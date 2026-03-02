/**
 * 虚拟学习伙伴路由
 * Requirements: 22.1-22.21
 * Task: 9
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { virtualPartnerService } from '../services/virtual-partner.service.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * POST /api/virtual-partner/generate
 * 生成虚拟伙伴
 * Requirements: 22.1, 22.2, 22.3, 22.4
 * Task: 9.1
 */
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { learning_path_id } = req.body;

    if (!learning_path_id) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必填字段: learning_path_id',
        data: null
      });
    }

    const result = await virtualPartnerService.generatePartner(userId, learning_path_id);

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: result.message,
        data: {
          partner: result.partner,
          alternatives: result.alternatives
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    console.error('生成虚拟伙伴失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `生成失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * POST /api/virtual-partner/send-message
 * 发送消息
 * Requirements: 22.5, 22.6, 22.19
 * Task: 9.2
 */
router.post('/send-message', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { 
      message_type, 
      content, 
      related_knowledge_point 
    } = req.body;

    if (!message_type || !['encouragement', 'learning_tip', 'task_reminder', 'question_answer', 'celebration'].includes(message_type)) {
      return res.status(400).json({
        code: 400,
        msg: '缺少或无效的message_type',
        data: null
      });
    }

    const startTime = Date.now();
    const result = await virtualPartnerService.sendMessage(
      userId,
      message_type,
      content,
      related_knowledge_point
    );
    const elapsedTime = Date.now() - startTime;

    if (result.success) {
      // 验证响应时间≤200ms
      if (elapsedTime > 200) {
        console.warn(`伙伴消息响应时间${elapsedTime}ms超过200ms`);
      }

      return res.status(200).json({
        code: 200,
        msg: result.message,
        data: result.response
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `发送失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * GET /api/virtual-partner/interactions
 * 获取互动历史
 * Requirements: 22.5
 * Task: 9.2
 */
router.get('/interactions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await virtualPartnerService.getInteractions(userId, limit);

    return res.status(200).json({
      code: 200,
      msg: '获取互动历史成功',
      data: {
        interactions: result.interactions
      }
    });
  } catch (error) {
    console.error('获取互动历史失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `获取失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * GET /api/virtual-partner/tasks
 * 获取任务列表
 * Requirements: 22.7, 22.8
 * Task: 9.3
 */
router.get('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    // 生成或获取每日任务
    const result = await virtualPartnerService.generateDailyTask(userId);

    if (result.success && result.task) {
      return res.status(200).json({
        code: 200,
        msg: '获取任务列表成功',
        data: {
          tasks: [result.task]
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: '获取任务失败',
        data: null
      });
    }
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `获取失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * POST /api/virtual-partner/tasks/:id/progress
 * 更新任务进度
 * Requirements: 22.7, 22.8
 * Task: 9.3
 */
router.post('/tasks/:id/progress', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const taskId = parseInt(req.params.id);
    const { progress } = req.body;

    if (isNaN(taskId) || progress === undefined || typeof progress !== 'number') {
      return res.status(400).json({
        code: 400,
        msg: '缺少或无效的参数',
        data: null
      });
    }

    const result = await virtualPartnerService.updateTaskProgress(userId, taskId, progress);

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: result.message,
        data: {
          completed: result.completed,
          reward: result.reward
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    console.error('更新任务进度失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `更新失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * GET /api/virtual-partner/leaderboard
 * 获取排行榜
 * Requirements: 22.9, 22.10
 * Task: 9.4
 */
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const result = await virtualPartnerService.getProgressComparison(userId);

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: '获取排行榜成功',
        data: {
          progress_diff: result.progressDiff,
          leaderboard: result.leaderboard
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: '获取排行榜失败',
        data: null
      });
    }
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `获取失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * POST /api/virtual-partner/ask-question
 * 提问
 * Requirements: 22.12, 22.13
 * Task: 9.5
 */
router.post('/ask-question', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        msg: '问题内容不能为空',
        data: null
      });
    }

    const result = await virtualPartnerService.askQuestion(userId, question.trim());

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: result.canAnswer ? '伙伴已回答' : '伙伴无法解答',
        data: {
          answer: result.answer,
          can_answer: result.canAnswer,
          guidance: result.guidance
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: '提问失败',
        data: null
      });
    }
  } catch (error) {
    console.error('伙伴答疑失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `提问失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * PUT /api/virtual-partner/settings
 * 更新设置
 * Requirements: 22.21
 * Task: 9.6
 */
router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { is_active, interaction_frequency } = req.body;

    const settings: any = {};
    if (is_active !== undefined) {
      settings.is_active = is_active;
    }
    if (interaction_frequency && ['high', 'medium', 'low'].includes(interaction_frequency)) {
      settings.interaction_frequency = interaction_frequency;
    }

    if (Object.keys(settings).length === 0) {
      return res.status(400).json({
        code: 400,
        msg: '没有有效的设置项',
        data: null
      });
    }

    const result = await virtualPartnerService.updateSettings(userId, settings);

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: result.message,
        data: null
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    console.error('更新设置失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `更新失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * PUT /api/virtual-partner/toggle
 * 开关伙伴
 * Requirements: 22.21
 * Task: 9.6
 */
router.put('/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        code: 400,
        msg: 'enabled必须是布尔值',
        data: null
      });
    }

    const result = await virtualPartnerService.updateSettings(userId, { is_active: enabled });

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: enabled ? '虚拟伙伴已启用' : '虚拟伙伴已关闭',
        data: null
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    console.error('开关伙伴失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `操作失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * PUT /api/virtual-partner/switch
 * 切换伙伴
 * Requirements: 22.21
 * Task: 9.6
 */
router.put('/switch', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { partner_id } = req.body;

    if (!partner_id || typeof partner_id !== 'number') {
      return res.status(400).json({
        code: 400,
        msg: '缺少或无效的partner_id',
        data: null
      });
    }

    const result = await virtualPartnerService.switchPartner(userId, partner_id);

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: result.message,
        data: null
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: result.message,
        data: null
      });
    }
  } catch (error) {
    console.error('切换伙伴失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `切换失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

export default router;

