/**
 * AI动态学习路径路由
 * Requirements: 21.1-21.20
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { aiLearningPathService, LearningDataCollectionRequest } from '../services/ai-learning-path.service.js';

const router = Router();

/**
 * POST /api/ai-learning-path/collect-data
 * 采集学习数据
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */
router.post('/collect-data', authenticateToken, async (req: AuthRequest, res: Response) => {
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
      lesson_id,
      data_type,
      video_data,
      practice_data,
      completion_data,
      session_id
    } = req.body;

    // 验证必填字段
    if (!lesson_id || !data_type || !session_id) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必填字段: lesson_id, data_type, session_id',
        data: null
      });
    }

    // 验证data_type
    if (!['video', 'practice', 'completion'].includes(data_type)) {
      return res.status(400).json({
        code: 400,
        msg: 'data_type必须是video, practice或completion之一',
        data: null
      });
    }

    const collectionRequest: LearningDataCollectionRequest = {
      user_id: userId,
      lesson_id,
      data_type,
      video_data,
      practice_data,
      completion_data,
      session_id
    };

    const result = await aiLearningPathService.collectLearningData(collectionRequest);

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: result.message,
        data: {
          data_id: result.data_id
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
    console.error('采集学习数据失败:', error);
    return res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});

/**
 * GET /api/ai-learning-path/learning-stats
 * 获取用户学习数据统计
 */
router.get('/learning-stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const lessonId = req.query.lesson_id ? parseInt(req.query.lesson_id as string) : undefined;

    const stats = await aiLearningPathService.getUserLearningStats(userId, lessonId);

    return res.status(200).json({
      code: 200,
      msg: '获取学习统计成功',
      data: stats
    });
  } catch (error) {
    console.error('获取学习统计失败:', error);
    return res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});

/**
 * GET /api/ai-learning-path/error-patterns
 * 获取用户错误模式
 * Requirements: 21.7
 */
router.get('/error-patterns', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const errorPatterns = await aiLearningPathService.identifyErrorPatterns(userId);

    return res.status(200).json({
      code: 200,
      msg: '获取错误模式成功',
      data: {
        error_patterns: errorPatterns
      }
    });
  } catch (error) {
    console.error('获取错误模式失败:', error);
    return res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});

/**
 * POST /api/ai-learning-path/evaluate
 * 评估知识点掌握度
 * Requirements: 21.5, 21.6
 * 
 * 请求体：
 * {
 *   knowledge_point_id: number,  // 单个知识点ID
 *   knowledge_point_ids?: number[], // 或多个知识点ID数组
 *   use_ai_model?: boolean  // 是否使用AI模型（默认false）
 * }
 */
router.post('/evaluate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { knowledge_point_id, knowledge_point_ids, use_ai_model = false } = req.body;

    // 验证输入
    if (!knowledge_point_id && (!knowledge_point_ids || knowledge_point_ids.length === 0)) {
      return res.status(400).json({
        code: 400,
        msg: '请提供 knowledge_point_id 或 knowledge_point_ids',
        data: null
      });
    }

    let results;

    // 单个知识点评估
    if (knowledge_point_id) {
      const result = await aiLearningPathService.evaluateKnowledgePoint(
        userId,
        knowledge_point_id,
        use_ai_model
      );
      results = [result];
    } 
    // 批量知识点评估
    else if (knowledge_point_ids && Array.isArray(knowledge_point_ids)) {
      results = await aiLearningPathService.evaluateMultipleKnowledgePoints(
        userId,
        knowledge_point_ids,
        use_ai_model
      );
    }

    return res.status(200).json({
      code: 200,
      msg: '知识点评估成功',
      data: {
        evaluations: results,
        summary: {
          total: results.length,
          mastered: results.filter((r: any) => r.mastery_level === 'mastered').length,
          consolidating: results.filter((r: any) => r.mastery_level === 'consolidating').length,
          weak: results.filter((r: any) => r.mastery_level === 'weak').length
        }
      }
    });
  } catch (error) {
    console.error('评估知识点失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `评估失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * GET /api/ai-learning-path/knowledge-mastery
 * 获取用户的知识点掌握度列表
 * Requirements: 21.6
 */
router.get('/knowledge-mastery', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const masteryList = await aiLearningPathService.getUserKnowledgeMastery(userId);

    // 统计各等级数量
    const summary = {
      total: masteryList.length,
      mastered: masteryList.filter(m => m.mastery_level === 'mastered').length,
      consolidating: masteryList.filter(m => m.mastery_level === 'consolidating').length,
      weak: masteryList.filter(m => m.mastery_level === 'weak').length
    };

    return res.status(200).json({
      code: 200,
      msg: '获取知识点掌握度成功',
      data: {
        mastery_list: masteryList,
        summary
      }
    });
  } catch (error) {
    console.error('获取知识点掌握度失败:', error);
    return res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});

/**
 * GET /api/ai-learning-path/ability-profile
 * 生成学习能力画像
 * Requirements: 21.7, 21.8
 * 
 * 返回用户的学习能力画像，包括：
 * - 能力标签（高效型/稳健型/基础型）
 * - 平均完成时间比率
 * - 重复练习次数
 * - 错误模式（关联知识点）
 * - 学习建议
 */
router.get('/ability-profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const lessonId = req.query.lesson_id ? parseInt(req.query.lesson_id as string) : undefined;

    // 生成学习能力画像
    const profile = await aiLearningPathService.generateLearningAbilityProfile(userId, lessonId);

    // 获取基于能力标签的学习建议
    const abilityRecommendations = aiLearningPathService.getLearningRecommendationsByAbility(profile.ability_tag);

    // 获取基于错误模式的针对性建议
    const errorRecommendations = await aiLearningPathService.getRecommendationsByErrorPatterns(profile.error_patterns);

    return res.status(200).json({
      code: 200,
      msg: '生成学习能力画像成功',
      data: {
        profile: {
          user_id: profile.user_id,
          ability_tag: profile.ability_tag,
          ability_tag_description: profile.ability_tag === 'efficient' 
            ? '高效型学习者：学习速度快，理解能力强，适合快节奏学习'
            : profile.ability_tag === 'basic'
            ? '基础型学习者：需要更多时间巩固，适合循序渐进的学习方式'
            : '稳健型学习者：学习节奏适中，保持稳定的学习进度',
          avg_completion_time_ratio: profile.avg_completion_time_ratio,
          repeat_practice_count: profile.repeat_practice_count,
          error_patterns: profile.error_patterns
        },
        recommendations: {
          ability_based: abilityRecommendations,
          error_based: errorRecommendations
        }
      }
    });
  } catch (error) {
    console.error('生成学习能力画像失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `服务器内部错误: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * GET /api/ai-learning-path/adjusted/:pathId
 * 获取调整后的学习路径
 * Requirements: 21.9, 21.10, 21.11, 21.12, 21.13, 21.14
 */
router.get('/adjusted/:pathId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const pathId = parseInt(req.params.pathId);
    if (isNaN(pathId)) {
      return res.status(400).json({
        code: 400,
        msg: '无效的学习路径ID',
        data: null
      });
    }

    const startTime = Date.now();

    // 执行路径调整
    const adjustmentResult = await aiLearningPathService.adjustLearningPath(userId, pathId);

    const elapsedTime = Date.now() - startTime;

    // 确保路径更新响应 < 300ms (Requirement 21.14)
    if (elapsedTime > 300) {
      console.warn(`路径调整API响应时间过长: ${elapsedTime}ms`);
    }

    return res.status(200).json({
      code: 200,
      msg: '路径调整成功',
      data: {
        ...adjustmentResult,
        performance: {
          elapsed_time_ms: elapsedTime
        }
      }
    });
  } catch (error) {
    console.error('获取调整后的学习路径失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `路径调整失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * GET /api/ai-learning-path/adjustment-log
 * 获取路径调整日志
 * Requirements: 21.16, 21.17
 */
router.get('/adjustment-log', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    // 解析查询参数
    const learningPathId = req.query.learning_path_id 
      ? parseInt(req.query.learning_path_id as string) 
      : undefined;
    
    const limit = req.query.limit 
      ? Math.min(parseInt(req.query.limit as string), 100) 
      : 20;
    
    const adjustmentType = req.query.adjustment_type as string | undefined;

    // 验证adjustment_type
    if (adjustmentType && !['knowledge_evaluation', 'ability_adaptation', 'progress_optimization'].includes(adjustmentType)) {
      return res.status(400).json({
        code: 400,
        msg: 'adjustment_type必须是knowledge_evaluation, ability_adaptation或progress_optimization之一',
        data: null
      });
    }

    // 获取调整日志
    const result = await aiLearningPathService.getAdjustmentLogs(
      userId,
      learningPathId,
      limit,
      adjustmentType as 'knowledge_evaluation' | 'ability_adaptation' | 'progress_optimization' | undefined
    );

    return res.status(200).json({
      code: 200,
      msg: '获取调整日志成功',
      data: result
    });
  } catch (error) {
    console.error('获取路径调整日志失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `获取调整日志失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * PUT /api/ai-learning-path/toggle-dynamic
 * 切换动态调整开关
 * Requirements: 21.18
 * 
 * 请求体：
 * {
 *   learning_path_id: number,  // 学习路径ID
 *   enabled: boolean           // 是否启用动态调整
 * }
 * 
 * 功能说明：
 * - 启用时：系统将根据学习情况自动调整路径
 * - 关闭时：恢复默认学习路径，记录用户选择
 * - 设置持久化，跨会话保持
 */
router.put('/toggle-dynamic', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const { learning_path_id, enabled } = req.body;

    // 验证必填字段
    if (!learning_path_id || typeof enabled !== 'boolean') {
      return res.status(400).json({
        code: 400,
        msg: '缺少必填字段: learning_path_id (number), enabled (boolean)',
        data: null
      });
    }

    // 验证learning_path_id是否为有效数字
    const pathId = parseInt(learning_path_id);
    if (isNaN(pathId)) {
      return res.status(400).json({
        code: 400,
        msg: 'learning_path_id必须是有效的数字',
        data: null
      });
    }

    // 执行切换操作
    const result = await aiLearningPathService.toggleDynamicAdjustment(
      userId,
      pathId,
      enabled
    );

    if (result.success) {
      return res.status(200).json({
        code: 200,
        msg: result.message,
        data: result.current_state
      });
    } else {
      return res.status(400).json({
        code: 400,
        msg: result.message,
        data: result.current_state
      });
    }
  } catch (error) {
    console.error('切换动态调整开关失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `切换动态调整开关失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

/**
 * GET /api/ai-learning-path/dynamic-status/:pathId
 * 获取动态调整开关状态
 * Requirements: 21.18
 */
router.get('/dynamic-status/:pathId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
        data: null
      });
    }

    const pathId = parseInt(req.params.pathId);
    if (isNaN(pathId)) {
      return res.status(400).json({
        code: 400,
        msg: '无效的学习路径ID',
        data: null
      });
    }

    // 获取动态调整开关状态
    const status = await aiLearningPathService.getDynamicAdjustmentStatus(userId, pathId);

    return res.status(200).json({
      code: 200,
      msg: '获取动态调整状态成功',
      data: status
    });
  } catch (error) {
    console.error('获取动态调整状态失败:', error);
    return res.status(500).json({
      code: 500,
      msg: `获取动态调整状态失败: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    });
  }
});

export default router;
