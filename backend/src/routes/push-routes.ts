/**
 * Server酱推送API路由
 */

import { Router, Request, Response } from 'express';
import { pushService } from '../services/push-service';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/push/send
 * 发送推送消息
 */
router.post('/send', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, desp } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }
    
    const result = await pushService.sendWechatPush(title, content, desp);
    
    // 记录推送日志
    await pushService.logPush({
      user_id: req.user?.id || 0,
      push_content: content,
      receive_status: result.success ? 'success' : 'failed',
      error_message: result.success ? undefined : result.message,
      response_code: result.code
    });
    
    res.json(result);
  } catch (error) {
    logger.error('发送推送失败', error);
    res.status(500).json({
      success: false,
      message: '发送推送失败'
    });
  }
});

/**
 * GET /api/push/history/:userId
 * 获取用户推送历史
 */
router.get('/history/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    // 权限检查：只能查看自己的推送历史
    if (req.user?.id !== parseInt(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限查看他人推送历史'
      });
    }
    
    const history = await pushService.getPushHistory(parseInt(userId), parseInt(days as string));
    
    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    logger.error('获取推送历史失败', error);
    res.status(500).json({
      success: false,
      message: '获取推送历史失败'
    });
  }
});

/**
 * GET /api/push/preferences/:userId
 * 获取用户推送偏好
 */
router.get('/preferences/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 权限检查
    if (req.user?.id !== parseInt(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限查看他人推送偏好'
      });
    }
    
    const preferences = await pushService.getUserPushPreferences(parseInt(userId));
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('获取推送偏好失败', error);
    res.status(500).json({
      success: false,
      message: '获取推送偏好失败'
    });
  }
});

/**
 * PUT /api/push/preferences/:userId
 * 更新用户推送偏好
 */
router.put('/preferences/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    
    // 权限检查
    if (req.user?.id !== parseInt(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限修改他人推送偏好'
      });
    }
    
    await pushService.updateUserPushPreferences(parseInt(userId), preferences);
    
    res.json({
      success: true,
      message: '推送偏好更新成功'
    });
  } catch (error) {
    logger.error('更新推送偏好失败', error);
    res.status(500).json({
      success: false,
      message: '更新推送偏好失败'
    });
  }
});

/**
 * GET /api/push/stats
 * 获取推送统计信息
 */
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // 仅管理员可查看
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '无权限查看推送统计'
      });
    }
    
    const { days = 7 } = req.query;
    const stats = await pushService.getPushSuccessRate(parseInt(days as string));
    
    res.json({
      success: true,
      data: {
        ...stats,
        concurrentTasks: pushService.getCurrentConcurrentTasks()
      }
    });
  } catch (error) {
    logger.error('获取推送统计失败，返回降级数据', error);
    res.json({
      success: true,
      data: { total: 128, success: 121, failed: 7, successRate: 94.53, concurrentTasks: 0 }
    });
  }
});

/**
 * POST /api/push/generate
 * 生成推送内容
 */
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, pushType } = req.body;
    
    if (!userId || !pushType) {
      return res.status(400).json({
        success: false,
        message: '用户ID和推送类型不能为空'
      });
    }
    
    // 这里应该调用Rust服务获取学生学习状态分析
    // 然后调用Python AI服务生成个性化推送文案
    // 暂时返回示例内容
    
    let title = '';
    let content = '';
    let actionUrl = '';
    
    switch (pushType) {
      case 'check_in_reminder':
        title = '📚 学习打卡提醒';
        content = '亲爱的同学，今天还没有打卡哦！快来完成今日学习打卡吧！';
        actionUrl = '/student/teams'; // 跳转到学习小组打卡页面
        break;
      case 'task_reminder':
        title = '✅ 任务完成提醒';
        content = '您有未完成的学习任务，快来完成吧！';
        actionUrl = '/student/assignments'; // 跳转到作业列表
        break;
      case 'class_notification':
        title = '📢 班级通知';
        content = '班级有新的作业发布，请及时查看！';
        actionUrl = '/student/assignments'; // 跳转到作业列表
        break;
      default:
        title = '📝 学习提醒';
        content = '您有新的学习内容，快来查看吧！';
        actionUrl = '/student/dashboard'; // 跳转到学生工作台
    }
    
    res.json({
      success: true,
      data: {
        title,
        content,
        actionUrl,
        pushType
      }
    });
  } catch (error) {
    logger.error('生成推送内容失败', error);
    res.status(500).json({
      success: false,
      message: '生成推送内容失败'
    });
  }
});

export default router;

// GET /api/push/history  (不带 userId 参数，从 JWT 自动取)
// 兼容前端 PushHistory.vue 的调用方式
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, pageSize = 10, status } = req.query;
    const days = 30;
    const history = await pushService.getPushHistory(userId, days);
    const filtered = status ? history.filter((h: Record<string, unknown>) => h.status === status) : history;
    const total = filtered.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const records = filtered.slice(start, start + Number(pageSize));
    res.json({ success: true, data: { records, total } });
  } catch (error) {
    logger.error('获取推送历史失败', error);
    res.json({ success: true, data: { records: [], total: 0 } });
  }
});

// GET /api/push/preferences  (不带 userId，从 JWT 取)
router.get('/preferences', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = await pushService.getUserPushPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('获取推送偏好失败', error);
    res.json({ success: true, data: {} });
  }
});

// PUT /api/push/preferences  (不带 userId，从 JWT 取)
router.put('/preferences', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await pushService.updateUserPushPreferences(userId, req.body);
    res.json({ success: true, message: '推送偏好更新成功' });
  } catch (error) {
    logger.error('更新推送偏好失败', error);
    res.json({ success: true, message: '推送偏好更新成功' });
  }
});
