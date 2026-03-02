/**
 * 资源推荐路由模块
 * 实现个性化资源推荐、推荐反馈、推荐历史查询
 * 需求：19.1-19.8
 * 性能优化：19.7 - 推荐计算异步执行，Redis缓存热门资源，CPU占用≤15%，响应时间≤1.5s
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { 
  cacheHotResource, 
  getCachedHotResource,
  isRedisClientAvailable 
} from '../config/redis.js';
import { 
  asyncTaskScheduler, 
  getCPUUsage, 
  getMemoryUsage 
} from '../services/performance-optimizer.js';

const router = Router();

// 所有资源推荐路由都需要认证
router.use(authenticateToken);

/**
 * 资源类型枚举
 */
export type ResourceType = 'article' | 'video' | 'exercise' | 'tutorial' | 'course';

/**
 * 会员等级枚举
 */
export type MemberLevel = 'basic' | 'advanced' | 'premium';

/**
 * 反馈类型枚举
 */
export type FeedbackType = 'interested' | 'not_interested' | 'completed';

/**
 * 资源推荐接口
 */
export interface ResourceRecommendation {
  id: number;
  resource_type: ResourceType;
  resource_id: number;
  resource_title: string;
  resource_url: string;
  recommendation_score: number;
  recommendation_reason: string;
  related_knowledge_points: string[];
  is_clicked: boolean;
  click_time: Date | null;
  feedback: FeedbackType | null;
  feedback_time: Date | null;
  is_exclusive: boolean;
  member_level_required: MemberLevel;
  created_at: Date;
}

/**
 * 获取用户会员等级
 * 需求：19.3
 * 
 * @param userId 用户ID
 * @returns 会员等级
 */
async function getUserMemberLevel(userId: number): Promise<MemberLevel> {
  const memberInfo = await executeQuery<Array<{
    role_level: number;
  }>>(
    `SELECT mr.role_level
     FROM user_member_relations umr
     JOIN member_roles mr ON umr.member_role_id = mr.id
     WHERE umr.user_id = ? AND umr.is_active = TRUE
     ORDER BY mr.role_level DESC
     LIMIT 1`,
    [userId]
  );

  if (!memberInfo || memberInfo.length === 0) {
    return 'basic'; // 默认基础会员
  }

  const roleLevel = memberInfo[0].role_level;
  if (roleLevel >= 3) return 'premium';
  if (roleLevel >= 2) return 'advanced';
  return 'basic';
}

/**
 * GET /api/resource-recommendations/:userId
 * 获取个性化推荐
 * 
 * 功能：
 * 1. 获取用户薄弱知识点
 * 2. 调用Python AI服务获取BERT推荐结果（如果可用）
 * 3. 会员优先推荐独家资源
 * 4. 使用Redis缓存热门资源（有效期24小时）
 * 5. 返回推荐资源列表
 * 6. 性能优化：推荐计算异步执行，CPU占用≤15%，响应时间≤1.5s
 * 
 * 查询参数：
 * - async: true (可选，是否异步计算推荐)
 * 
 * 需求：19.2, 19.3, 19.6, 19.7
 */
router.get('/:userId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit = '10', resource_type, async: isAsync = false } = req.query;
    const requestUserId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查
    if (userRole === 'student' && parseInt(userId) !== requestUserId) {
      res.status(403).json({
        success: false,
        message: '无权限查看其他用户的推荐'
      });
      return;
    }

    if (userRole === 'parent') {
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [requestUserId, userId]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该用户的推荐'
        });
        return;
      }
    }

    // 验证用户存在
    const userInfo = await executeQuery<any[]>(
      'SELECT id, real_name, role FROM users WHERE id = ?',
      [userId]
    );

    if (!userInfo || userInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    // 获取用户会员等级
    const memberLevel = await getUserMemberLevel(parseInt(userId));

    // 构建缓存键
    // 需求：19.6 - Redis缓存热门资源
    const cacheKey = `recommendation:user:${userId}:type:${resource_type || 'all'}:limit:${limit}:member:${memberLevel}`;
    
    // 尝试从Redis获取缓存
    if (isRedisClientAvailable()) {
      const cachedData = await getCachedHotResource(cacheKey);
      if (cachedData) {
        console.log(`从Redis缓存获取推荐数据: ${cacheKey}`);
        res.json({
          success: true,
          data: cachedData,
          from_cache: true,
          cpu_usage: getCPUUsage(),
          memory_usage: getMemoryUsage()
        });
        return;
      }
    }

    // 定义推荐计算任务
    const calculateRecommendationsTask = async () => {
      try {
        // 获取用户薄弱知识点
        const weakPoints = await executeQuery<Array<{
          knowledge_point_id: number;
          knowledge_point_name: string;
          subject: string;
          error_rate: number;
        }>>(
          `SELECT 
            swp.knowledge_point_id,
            kp.name as knowledge_point_name,
            kp.subject,
            swp.error_rate
           FROM student_weak_points swp
           JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
           WHERE swp.student_id = ? AND swp.error_rate >= 40
           ORDER BY swp.error_rate DESC
           LIMIT 5`,
          [userId]
        );

        // 构建查询条件
        const whereConditions = ['rr.user_id = ?'];
        const queryParams: any[] = [userId];

        if (resource_type) {
          whereConditions.push('rr.resource_type = ?');
          queryParams.push(resource_type);
        }

        // 会员优先推荐独家资源
        // 需求：19.3
        let orderBy = 'rr.recommendation_score DESC';
        if (memberLevel === 'premium') {
          orderBy = 'rr.is_exclusive DESC, rr.recommendation_score DESC';
        } else if (memberLevel === 'advanced') {
          orderBy = '(CASE WHEN rr.member_level_required IN ("basic", "advanced") THEN 1 ELSE 0 END) DESC, rr.recommendation_score DESC';
        } else {
          // 基础会员只能看到基础资源
          whereConditions.push('rr.member_level_required = "basic"');
        }

        queryParams.push(parseInt(limit as string) || 10);

        // 查询推荐资源
        const recommendations = await executeQuery<Array<{
          id: number;
          resource_type: ResourceType;
          resource_id: number;
          resource_title: string;
          resource_url: string;
          recommendation_score: number;
          recommendation_reason: string;
          related_knowledge_points: string;
          is_clicked: boolean;
          click_time: Date | null;
          feedback: FeedbackType | null;
          feedback_time: Date | null;
          is_exclusive: boolean;
          member_level_required: MemberLevel;
          created_at: Date;
        }>>(
          `SELECT 
            rr.id,
            rr.resource_type,
            rr.resource_id,
            rr.resource_title,
            rr.resource_url,
            rr.recommendation_score,
            rr.recommendation_reason,
            rr.related_knowledge_points,
            rr.is_clicked,
            rr.click_time,
            rr.feedback,
            rr.feedback_time,
            rr.is_exclusive,
            rr.member_level_required,
            rr.created_at
           FROM resource_recommendations rr
           WHERE ${whereConditions.join(' AND ')}
           ORDER BY ${orderBy}
           LIMIT ?`,
          queryParams
        );

        // 解析JSON字段
        const formattedRecommendations = recommendations.map(rec => ({
          ...rec,
          related_knowledge_points: rec.related_knowledge_points 
            ? JSON.parse(rec.related_knowledge_points as any)
            : [],
          can_access: memberLevel === 'premium' || 
                      (memberLevel === 'advanced' && rec.member_level_required !== 'premium') ||
                      (memberLevel === 'basic' && rec.member_level_required === 'basic')
        }));

        const responseData = {
          user_id: parseInt(userId),
          user_name: userInfo[0].real_name,
          member_level: memberLevel,
          weak_points: weakPoints.map(wp => ({
            knowledge_point_id: wp.knowledge_point_id,
            knowledge_point_name: wp.knowledge_point_name,
            subject: wp.subject,
            error_rate: Math.round(wp.error_rate * 100) / 100
          })),
          recommendations: formattedRecommendations,
          total_recommendations: recommendations.length
        };

        // 缓存到Redis（24小时有效期）
        // 需求：19.6
        if (isRedisClientAvailable()) {
          await cacheHotResource(cacheKey, responseData, 86400);
          console.log(`推荐数据已缓存到Redis: ${cacheKey}`);
        }

        return responseData;
      } catch (error) {
        console.error('推荐计算任务执行失败:', error);
        throw error;
      }
    };

    // 如果是异步计算，添加到任务队列
    if (isAsync === 'true' || isAsync === 'true') {
      asyncTaskScheduler.addTask(
        `recommendation_${userId}_${Date.now()}`,
        calculateRecommendationsTask,
        6 // 优先级
      );

      res.json({
        success: true,
        message: '推荐计算任务已添加到队列，将异步执行',
        data: {
          user_id: parseInt(userId),
          status: 'queued',
          queue_status: asyncTaskScheduler.getQueueStatus(),
          cpu_usage: getCPUUsage(),
          memory_usage: getMemoryUsage()
        }
      });
      return;
    }

    // 同步计算推荐
    const responseData = await calculateRecommendationsTask();

    res.json({
      success: true,
      data: responseData,
      from_cache: false,
      cpu_usage: getCPUUsage(),
      memory_usage: getMemoryUsage()
    });

  } catch (error) {
    console.error('获取个性化推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});
/**
 * POST /api/resource-recommendations/:id/feedback
 * 提交推荐反馈
 * 
 * 功能：
 * 1. 接收用户对推荐资源的反馈（感兴趣/不感兴趣/已完成）
 * 2. 更新推荐记录
 * 3. 实时回传反馈到AI服务（用于优化推荐算法）
 * 
 * 请求体：
 * {
 *   "feedback": "interested" | "not_interested" | "completed"
 * }
 * 
 * 需求：19.4
 */
router.post('/:id/feedback', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const userId = req.user!.id;

    // 验证反馈类型
    const validFeedback: FeedbackType[] = ['interested', 'not_interested', 'completed'];
    if (!feedback || !validFeedback.includes(feedback)) {
      res.status(400).json({
        success: false,
        message: '无效的反馈类型，必须是 interested、not_interested 或 completed'
      });
      return;
    }

    // 查询推荐记录
    const recommendation = await executeQuery<Array<{
      id: number;
      user_id: number;
      resource_type: ResourceType;
      resource_id: number;
      resource_title: string;
      is_clicked: boolean;
    }>>(
      `SELECT id, user_id, resource_type, resource_id, resource_title, is_clicked
       FROM resource_recommendations
       WHERE id = ?`,
      [id]
    );

    if (!recommendation || recommendation.length === 0) {
      res.status(404).json({
        success: false,
        message: '推荐记录不存在'
      });
      return;
    }

    // 权限检查：只能对自己的推荐提交反馈
    if (recommendation[0].user_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限对此推荐提交反馈'
      });
      return;
    }

    // 更新推荐记录
    // 如果是第一次反馈，同时标记为已点击
    const updateFields: string[] = ['feedback = ?', 'feedback_time = NOW()'];
    const updateParams: any[] = [feedback];

    if (!recommendation[0].is_clicked) {
      updateFields.push('is_clicked = TRUE', 'click_time = NOW()');
    }

    updateParams.push(id);

    await executeQuery(
      `UPDATE resource_recommendations
       SET ${updateFields.join(', ')}
       WHERE id = ?`,
      updateParams
    );

    // TODO: 实时回传反馈到AI服务
    // 这里可以调用Python AI服务的反馈接口
    // 用于优化推荐算法
    try {
      // 异步发送反馈到AI服务（不阻塞响应）
      // await sendFeedbackToAI(userId, recommendation[0].resource_id, feedback);
      console.log(`反馈已记录: 用户${userId}对资源${recommendation[0].resource_id}的反馈为${feedback}`);
    } catch (aiError) {
      console.warn('发送反馈到AI服务失败:', aiError);
      // 不影响主流程，继续返回成功
    }

    res.json({
      success: true,
      message: '反馈提交成功',
      data: {
        recommendation_id: parseInt(id),
        resource_title: recommendation[0].resource_title,
        feedback,
        feedback_time: new Date()
      }
    });

  } catch (error) {
    console.error('提交推荐反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/resource-recommendations/:userId/history
 * 查询推荐历史
 * 
 * 功能：
 * 1. 查询用户的推荐历史记录
 * 2. 显示点击率统计
 * 3. 支持按资源类型筛选
 * 4. 支持分页
 * 
 * 查询参数：
 * - resource_type: 资源类型（可选）
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * 
 * 需求：19.8
 */
router.get('/:userId/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { resource_type, page = '1', page_size = '20' } = req.query;
    const requestUserId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查
    if (userRole === 'student' && parseInt(userId) !== requestUserId) {
      res.status(403).json({
        success: false,
        message: '无权限查看其他用户的推荐历史'
      });
      return;
    }

    if (userRole === 'parent') {
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [requestUserId, userId]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该用户的推荐历史'
        });
        return;
      }
    }

    // 验证用户存在
    const userInfo = await executeQuery<any[]>(
      'SELECT id, real_name FROM users WHERE id = ?',
      [userId]
    );

    if (!userInfo || userInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    // 构建查询条件
    const whereConditions = ['user_id = ?'];
    const queryParams: any[] = [userId];

    if (resource_type) {
      whereConditions.push('resource_type = ?');
      queryParams.push(resource_type);
    }

    // 计算分页
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const pageSizeNum = Math.min(Math.max(parseInt(page_size as string) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSizeNum;

    // 查询总数
    const totalResult = await executeQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) as total
       FROM resource_recommendations
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );
    const total = totalResult[0].total;

    // 查询推荐历史
    const history = await executeQuery<Array<{
      id: number;
      resource_type: ResourceType;
      resource_id: number;
      resource_title: string;
      resource_url: string;
      recommendation_score: number;
      recommendation_reason: string;
      related_knowledge_points: string;
      is_clicked: boolean;
      click_time: Date | null;
      feedback: FeedbackType | null;
      feedback_time: Date | null;
      is_exclusive: boolean;
      member_level_required: MemberLevel;
      created_at: Date;
    }>>(
      `SELECT 
        id,
        resource_type,
        resource_id,
        resource_title,
        resource_url,
        recommendation_score,
        recommendation_reason,
        related_knowledge_points,
        is_clicked,
        click_time,
        feedback,
        feedback_time,
        is_exclusive,
        member_level_required,
        created_at
       FROM resource_recommendations
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, pageSizeNum, offset]
    );

    // 计算点击率统计
    const statsResult = await executeQuery<Array<{
      total_recommendations: number;
      clicked_count: number;
      click_rate: number;
      interested_count: number;
      not_interested_count: number;
      completed_count: number;
    }>>(
      `SELECT 
        COUNT(*) as total_recommendations,
        SUM(CASE WHEN is_clicked = TRUE THEN 1 ELSE 0 END) as clicked_count,
        ROUND(SUM(CASE WHEN is_clicked = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as click_rate,
        SUM(CASE WHEN feedback = 'interested' THEN 1 ELSE 0 END) as interested_count,
        SUM(CASE WHEN feedback = 'not_interested' THEN 1 ELSE 0 END) as not_interested_count,
        SUM(CASE WHEN feedback = 'completed' THEN 1 ELSE 0 END) as completed_count
       FROM resource_recommendations
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    // 按资源类型统计
    const typeStatsResult = await executeQuery<Array<{
      resource_type: ResourceType;
      count: number;
      click_rate: number;
    }>>(
      `SELECT 
        resource_type,
        COUNT(*) as count,
        ROUND(SUM(CASE WHEN is_clicked = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as click_rate
       FROM resource_recommendations
       WHERE user_id = ?
       GROUP BY resource_type
       ORDER BY count DESC`,
      [userId]
    );

    // 解析JSON字段
    const formattedHistory = history.map(rec => ({
      ...rec,
      related_knowledge_points: rec.related_knowledge_points 
        ? JSON.parse(rec.related_knowledge_points as any)
        : []
    }));

    res.json({
      success: true,
      data: {
        user_id: parseInt(userId),
        user_name: userInfo[0].real_name,
        history: formattedHistory,
        pagination: {
          page: pageNum,
          page_size: pageSizeNum,
          total,
          total_pages: Math.ceil(total / pageSizeNum)
        },
        statistics: {
          total_recommendations: statsResult[0].total_recommendations,
          clicked_count: statsResult[0].clicked_count,
          click_rate: statsResult[0].click_rate || 0,
          interested_count: statsResult[0].interested_count,
          not_interested_count: statsResult[0].not_interested_count,
          completed_count: statsResult[0].completed_count,
          by_type: typeStatsResult
        }
      }
    });

  } catch (error) {
    console.error('查询推荐历史失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
