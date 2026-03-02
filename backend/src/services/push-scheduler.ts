/**
 * 推送任务调度器
 * 每日定时执行推送任务（8点、15点、20点）
 */

import * as cron from 'node-cron';
import { pushService } from './push-service';
import { db } from '../database';
import { logger } from '../utils/logger';

class PushScheduler {
  private scheduledJobs: any[] = [];

  /**
   * 初始化推送调度器
   */
  async initialize(): Promise<void> {
    try {
      logger.info('推送调度器初始化中...');
      
      // 每天8点、15点、20点执行推送任务
      const pushTimes = ['0 8 * * *', '0 15 * * *', '0 20 * * *'];
      
      for (const time of pushTimes) {
        const job = cron.schedule(time, async () => {
          await this.executePushTasks();
        });
        
        this.scheduledJobs.push(job);
        logger.info(`推送任务调度已设置: ${time}`);
      }
      
      logger.info('推送调度器初始化完成');
    } catch (error) {
      logger.error('推送调度器初始化失败', error);
      throw error;
    }
  }

  /**
   * 执行推送任务
   */
  private async executePushTasks(): Promise<void> {
    try {
      logger.info('开始执行推送任务...');
      
      // 获取所有待执行的推送任务
      const pendingTasks = await pushService.getPendingPushTasks();
      
      if (pendingTasks.length === 0) {
        logger.info('没有待执行的推送任务');
        return;
      }
      
      logger.info(`发现 ${pendingTasks.length} 个待执行推送任务`);
      
      // 并发执行推送任务（最多100个）
      const maxConcurrent = 100;
      const chunks = [];
      
      for (let i = 0; i < pendingTasks.length; i += maxConcurrent) {
        chunks.push(pendingTasks.slice(i, i + maxConcurrent));
      }
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(task => this.processPushTask(task)));
      }
      
      logger.info('推送任务执行完成');
    } catch (error) {
      logger.error('执行推送任务失败', error);
    }
  }

  /**
   * 处理单个推送任务
   */
  private async processPushTask(task: any): Promise<void> {
    try {
      // 更新任务状态为执行中
      await pushService.updatePushTaskStatus(task.id, 'executing');
      
      // 检查用户推送偏好
      const preferences = await pushService.getUserPushPreferences(task.user_id);
      
      let shouldSend = false;
      switch (task.push_type) {
        case 'check_in_reminder':
          shouldSend = preferences.receive_check_in_reminder;
          break;
        case 'task_reminder':
          shouldSend = preferences.receive_task_reminder;
          break;
        case 'class_notification':
          shouldSend = preferences.receive_class_notification;
          break;
        default:
          shouldSend = true;
      }
      
      if (!shouldSend) {
        logger.info(`用户 ${task.user_id} 已禁用 ${task.push_type} 推送`);
        await pushService.updatePushTaskStatus(task.id, 'success');
        return;
      }
      
      // 发送推送
      const result = await pushService.sendWechatPush(
        this.generateTitle(task.push_type),
        task.push_content
      );
      
      // 记录推送日志
      await pushService.logPush({
        task_id: task.id,
        user_id: task.user_id,
        push_content: task.push_content,
        receive_status: result.success ? 'success' : 'failed',
        error_message: result.success ? undefined : result.message,
        response_code: result.code
      });
      
      if (result.success) {
        await pushService.updatePushTaskStatus(task.id, 'success');
        logger.info(`推送任务执行成功: ${task.id}`);
      } else {
        // 失败则重试
        await pushService.retryFailedPushTask(task.id);
        logger.warn(`推送任务执行失败，已加入重试队列: ${task.id}`);
      }
    } catch (error) {
      logger.error(`处理推送任务失败: ${task.id}`, error);
      await pushService.updatePushTaskStatus(
        task.id,
        'failed',
        error instanceof Error ? error.message : '未知错误'
      );
      await pushService.retryFailedPushTask(task.id);
    }
  }

  /**
   * 生成推送标题
   */
  private generateTitle(pushType: string): string {
    switch (pushType) {
      case 'check_in_reminder':
        return '📚 学习打卡提醒';
      case 'task_reminder':
        return '✅ 任务完成提醒';
      case 'class_notification':
        return '📢 班级通知';
      default:
        return '📝 学习提醒';
    }
  }

  /**
   * 停止所有调度任务
   */
  stop(): void {
    for (const job of this.scheduledJobs) {
      job.stop();
    }
    logger.info('推送调度器已停止');
  }

  /**
   * 手动触发推送任务（用于测试）
   */
  async triggerPushTasks(): Promise<void> {
    await this.executePushTasks();
  }
}

export const pushScheduler = new PushScheduler();
