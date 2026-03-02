/**
 * Server酱微信推送服务
 * 集成Server酱API实现每日学习打卡提醒推送
 */

import axios from 'axios';
import { executeQuery } from '../config/database.js';

interface PushTask {
  id?: number;
  user_id: number;
  push_type: 'check_in_reminder' | 'task_reminder' | 'class_notification';
  push_content: string;
  scheduled_time: Date;
}

interface PushLog {
  task_id?: number;
  user_id: number;
  push_content: string;
  push_title?: string;
  action_url?: string;
  push_type?: string;
  receive_status: 'success' | 'failed' | 'pending';
  error_message?: string;
  response_code?: number;
  response_data?: any;
}

interface PushConfig {
  send_key: string;
  push_times: string[];
  is_enabled: boolean;
  max_concurrent_tasks: number;
  retry_times: number;
  retry_interval: number;
}

class PushService {
  private sendKey: string = 'SCT309765TcNT6iaZFzS9hjkzRvmo5jmpj';
  private serverJiangUrl: string = 'https://sctapi.ftqq.com';
  private pushConfig: PushConfig | null = null;
  private currentConcurrentTasks: number = 0;

  /**
   * 初始化推送服务
   */
  async initialize(): Promise<void> {
    try {
      // 从数据库加载推送配置
      const configs = await executeQuery<any[]>(
        'SELECT * FROM push_config WHERE is_enabled = TRUE LIMIT 1'
      );
      
      if (configs && configs.length > 0) {
        const config = configs[0];
        this.pushConfig = {
          send_key: config.send_key,
          push_times: JSON.parse(config.push_times),
          is_enabled: config.is_enabled,
          max_concurrent_tasks: config.max_concurrent_tasks,
          retry_times: config.retry_times,
          retry_interval: config.retry_interval
        };
        this.sendKey = config.send_key;
        console.log('推送服务初始化成功', { sendKey: this.sendKey.substring(0, 10) + '...' });
      } else {
        console.warn('未找到推送配置，使用默认配置');
      }
    } catch (error) {
      console.error('推送服务初始化失败', error);
      throw error;
    }
  }

  /**
   * 发送微信推送
   * @param title 推送标题
   * @param content 推送内容
   * @param desp 推送详情（支持Markdown）
   * @returns 推送结果
   */
  async sendWechatPush(
    title: string,
    content: string,
    desp?: string
  ): Promise<{ success: boolean; message: string; code?: number }> {
    try {
      // 检查并发数量限制
      if (this.currentConcurrentTasks >= (this.pushConfig?.max_concurrent_tasks || 100)) {
        return {
          success: false,
          message: '并发推送任务已达上限，请稍后重试'
        };
      }

      this.currentConcurrentTasks++;

      const url = `${this.serverJiangUrl}/${this.sendKey}.send`;
      const data = {
        title: title,
        desp: `${content}\n\n${desp || ''}`
      };

      const response = await axios.post(url, data, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.currentConcurrentTasks--;

      if (response.data && response.data.code === 0) {
        console.log('微信推送成功', { title, code: response.data.code });
        return {
          success: true,
          message: '推送成功',
          code: response.data.code
        };
      } else {
        console.warn('微信推送失败', { title, response: response.data });
        return {
          success: false,
          message: response.data?.errmsg || '推送失败',
          code: response.data?.code
        };
      }
    } catch (error) {
      this.currentConcurrentTasks--;
      console.error('微信推送异常', error);
      return {
        success: false,
        message: '推送异常：' + (error instanceof Error ? error.message : '未知错误')
      };
    }
  }

  /**
   * 创建推送任务
   */
  async createPushTask(task: PushTask): Promise<number> {
    try {
      const result = await executeQuery<any>(
        `INSERT INTO push_tasks (user_id, push_type, push_content, scheduled_time, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [task.user_id, task.push_type, task.push_content, task.scheduled_time]
      );
      
      console.log('推送任务创建成功', { taskId: result.insertId, userId: task.user_id });
      return result.insertId;
    } catch (error) {
      console.error('推送任务创建失败', error);
      throw error;
    }
  }

  /**
   * 记录推送日志
   */
  async logPush(log: PushLog): Promise<void> {
    try {
      await executeQuery(
        `INSERT INTO push_logs (task_id, user_id, push_content, push_title, action_url, push_type, receive_status, error_message, response_code, response_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.task_id || null,
          log.user_id,
          log.push_content,
          log.push_title || null,
          log.action_url || null,
          log.push_type || null,
          log.receive_status,
          log.error_message || null,
          log.response_code || null,
          log.response_data ? JSON.stringify(log.response_data) : null
        ]
      );
    } catch (error) {
      console.error('推送日志记录失败', error);
    }
  }

  /**
   * 获取用户推送历史
   */
  async getPushHistory(userId: number, days: number = 30): Promise<any[]> {
    try {
      const logs = await executeQuery<any[]>(
        `SELECT * FROM push_logs 
         WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ORDER BY created_at DESC`,
        [userId, days]
      );
      return logs || [];
    } catch (error) {
      console.error('获取推送历史失败', error);
      throw error;
    }
  }

  /**
   * 获取用户推送偏好
   */
  async getUserPushPreferences(userId: number): Promise<any> {
    try {
      const preferences = await executeQuery<any[]>(
        `SELECT * FROM user_push_preferences WHERE user_id = ?`,
        [userId]
      );
      
      if (preferences && preferences.length > 0) {
        return preferences[0];
      }
      
      // 如果不存在，创建默认偏好
      await executeQuery(
        `INSERT INTO user_push_preferences (user_id, receive_check_in_reminder, receive_task_reminder, receive_class_notification)
         VALUES (?, TRUE, TRUE, TRUE)`,
        [userId]
      );
      
      return {
        user_id: userId,
        receive_check_in_reminder: true,
        receive_task_reminder: true,
        receive_class_notification: true
      };
    } catch (error) {
      console.error('获取用户推送偏好失败', error);
      throw error;
    }
  }

  /**
   * 更新用户推送偏好
   */
  async updateUserPushPreferences(
    userId: number,
    preferences: {
      receive_check_in_reminder?: boolean;
      receive_task_reminder?: boolean;
      receive_class_notification?: boolean;
    }
  ): Promise<void> {
    try {
      const updates = [];
      const values = [];
      
      if (preferences.receive_check_in_reminder !== undefined) {
        updates.push('receive_check_in_reminder = ?');
        values.push(preferences.receive_check_in_reminder);
      }
      if (preferences.receive_task_reminder !== undefined) {
        updates.push('receive_task_reminder = ?');
        values.push(preferences.receive_task_reminder);
      }
      if (preferences.receive_class_notification !== undefined) {
        updates.push('receive_class_notification = ?');
        values.push(preferences.receive_class_notification);
      }
      
      if (updates.length === 0) return;
      
      values.push(userId);
      
      await executeQuery(
        `UPDATE user_push_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
      
      console.log('用户推送偏好更新成功', { userId });
    } catch (error) {
      console.error('更新用户推送偏好失败', error);
      throw error;
    }
  }

  /**
   * 获取待执行的推送任务
   */
  async getPendingPushTasks(): Promise<any[]> {
    try {
      const tasks = await executeQuery<any[]>(
        `SELECT * FROM push_tasks 
         WHERE status = 'pending' AND scheduled_time <= NOW()
         ORDER BY scheduled_time ASC
         LIMIT 100`
      );
      return tasks || [];
    } catch (error) {
      console.error('获取待执行推送任务失败', error);
      throw error;
    }
  }

  /**
   * 更新推送任务状态
   */
  async updatePushTaskStatus(
    taskId: number,
    status: 'executing' | 'success' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      await executeQuery(
        `UPDATE push_tasks SET status = ?, executed_time = NOW(), error_message = ? WHERE id = ?`,
        [status, errorMessage || null, taskId]
      );
    } catch (error) {
      console.error('更新推送任务状态失败', error);
    }
  }

  /**
   * 重试失败的推送任务
   */
  async retryFailedPushTask(taskId: number): Promise<void> {
    try {
      const tasks = await executeQuery<any[]>(
        `SELECT * FROM push_tasks WHERE id = ?`,
        [taskId]
      );
      
      if (!tasks || tasks.length === 0) return;
      
      const task = tasks[0];
      const maxRetries = this.pushConfig?.retry_times || 3;
      
      if (task.retry_count < maxRetries) {
        await executeQuery(
          `UPDATE push_tasks SET status = 'pending', retry_count = retry_count + 1 WHERE id = ?`,
          [taskId]
        );
        console.log('推送任务重试', { taskId, retryCount: task.retry_count + 1 });
      } else {
        console.warn('推送任务重试次数已达上限', { taskId, maxRetries });
      }
    } catch (error) {
      console.error('重试推送任务失败', error);
    }
  }

  /**
   * 获取推送成功率统计
   */
  async getPushSuccessRate(days: number = 7): Promise<{
    total: number;
    success: number;
    failed: number;
    successRate: number;
  }> {
    try {
      const stats = await executeQuery<any[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN receive_status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN receive_status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM push_logs
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );
      
      if (stats && stats.length > 0) {
        const stat = stats[0];
        const successRate = stat.total > 0 ? (stat.success / stat.total * 100).toFixed(2) : 0;
        return {
          total: stat.total || 0,
          success: stat.success || 0,
          failed: stat.failed || 0,
          successRate: parseFloat(successRate as string)
        };
      }
      
      return { total: 0, success: 0, failed: 0, successRate: 0 };
    } catch (error) {
      console.error('获取推送成功率统计失败', error);
      throw error;
    }
  }

  /**
   * 获取当前并发任务数
   */
  getCurrentConcurrentTasks(): number {
    return this.currentConcurrentTasks;
  }
}

export const pushService = new PushService();
