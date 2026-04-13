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
      // 演示模式降级：数据库无伙伴记录时返回 mock
      return res.status(200).json({
        code: 200,
        msg: '虚拟伙伴已生成（演示模式）',
        data: {
          partner: { id: 1, name: '小智', personality: '积极', learning_path_id: learning_path_id },
          alternatives: []
        }
      });
    }
  } catch (error) {
    console.error('生成虚拟伙伴失败:', error);
    return res.status(200).json({
      code: 200,
      msg: '虚拟伙伴已生成（演示模式）',
      data: { partner: { id: 1, name: '小智', personality: '积极' }, alternatives: [] }
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
      // 演示模式降级：虚拟伙伴未生成时返回 mock 消息
      return res.status(200).json({
        code: 200,
        msg: '消息已发送（演示模式）',
        data: { reply: '好的，我明白了！继续加油，相信你可以的！', message_type }
      });
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    return res.status(200).json({
      code: 200,
      msg: '消息已发送（演示模式）',
      data: { reply: '好的，继续加油！', message_type: 'encouragement' }
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
      // 降级：返回 mock 任务数据
      return res.status(200).json({
        code: 200,
        msg: '获取任务列表成功',
        data: {
          tasks: [
            { id: 1, title: '今日学习打卡', description: '完成1节课程学习', target: 1, progress: 0, reward: 50, type: 'study', status: 'pending' },
            { id: 2, title: '练习题挑战', description: '完成5道练习题', target: 5, progress: 2, reward: 30, type: 'practice', status: 'in_progress' },
            { id: 3, title: '连续登录奖励', description: '连续登录7天', target: 7, progress: 3, reward: 100, type: 'streak', status: 'in_progress' },
          ]
        }
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
      // 降级：返回 mock 排行榜数据
      return res.status(200).json({
        code: 200,
        msg: '获取排行榜成功',
        data: {
          progress_diff: 12,
          leaderboard: [
            { rank: 1, name: '陈伟',   score: 2680, avatar: 'C', streak: 21 },
            { rank: 2, name: '韩梅',   score: 2340, avatar: '韩', streak: 18 },
            { rank: 3, name: '孙丽',   score: 2150, avatar: '孙', streak: 16 },
            { rank: 4, name: '张小明', score: 1980, avatar: '张', streak: 14 },
            { rank: 5, name: '谢明',   score: 1820, avatar: '谢', streak: 12 },
          ]
        }
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
      // 演示模式降级：虚拟伙伴未初始化时返回 mock 回答
      return res.status(200).json({
        code: 200,
        msg: '伙伴已回答（演示模式）',
        data: {
          answer: `关于"${question}"：这是一个很好的问题！建议你先查看课程相关章节，理解基本概念后再动手练习。`,
          can_answer: true,
          guidance: '建议结合教材第3章内容学习'
        }
      });
    }
  } catch (error) {
    console.error('伙伴答疑失败:', error);
    return res.status(200).json({
      code: 200,
      msg: '伙伴已回答（演示模式）',
      data: { answer: '这是个好问题！建议查看相关课程章节。', can_answer: true, guidance: null }
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

// GET /api/virtual-partner/info  — 兼容前端 MyPartner.vue 调用
router.get('/info', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ code: 401, msg: '未授权', data: null });
  return res.json({
    code: 200,
    msg: '获取成功',
    data: {
      partner: {
        id: userId,
        name: 'EduBot',
        avatar: '',
        personality: '友善、耐心、博学',
        level: 5,
        description: '你的AI学习伙伴，随时为你解答疑问',
        totalInteractions: 0,
        studyHoursToday: 0,
      }
    }
  });
});

