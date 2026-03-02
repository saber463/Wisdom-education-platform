/**
 * 分层教学路由模块
 * 实现学生分层算法、分层作业分配
 * 需求：4.2, 4.3, 4.4
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';

const router = Router();

// 所有分层教学路由都需要认证
router.use(authenticateToken);

/**
 * 学生层次类型定义
 * basic: 基础层 - 平均分 < 60%
 * medium: 中等层 - 平均分 60% - 85%
 * advanced: 提高层 - 平均分 >= 85%
 */
type StudentTier = 'basic' | 'medium' | 'advanced';

/**
 * 学生分层结果接口
 */
interface StudentTierResult {
  student_id: number;
  student_name: string;
  tier: StudentTier;
  avg_score: number;
  submission_count: number;
  recent_accuracy: number;
}

/**
 * 根据平均分计算学生层次
 * 需求：4.2
 * 
 * @param avgScore 平均分（百分比，0-100）
 * @returns 学生层次
 */
export function calculateTier(avgScore: number): StudentTier {
  if (avgScore >= 85) {
    return 'advanced';
  } else if (avgScore >= 60) {
    return 'medium';
  } else {
    return 'basic';
  }
}

/**
 * 根据作业正确率动态调整学生层次
 * 需求：4.4
 * 
 * @param currentTier 当前层次
 * @param recentAccuracy 最近作业正确率（百分比，0-100）
 * @returns 调整后的层次
 */
export function adjustTierByAccuracy(currentTier: StudentTier, recentAccuracy: number): StudentTier {
  // 如果最近正确率很高（>=85%），考虑升级
  if (recentAccuracy >= 85) {
    if (currentTier === 'basic') {
      return 'medium';
    } else if (currentTier === 'medium') {
      return 'advanced';
    }
  }
  // 如果最近正确率很低（<50%），考虑降级
  else if (recentAccuracy < 50) {
    if (currentTier === 'advanced') {
      return 'medium';
    } else if (currentTier === 'medium') {
      return 'basic';
    }
  }
  // 保持当前层次
  return currentTier;
}

/**
 * GET /api/tiered-teaching/students/:classId
 * 获取班级学生分层信息
 * 
 * 功能：
 * 1. 根据历史成绩将学生分为基础层、中等层、提高层
 * 2. 返回每个学生的层次和统计数据
 * 
 * 需求：4.2
 */
router.get('/students/:classId', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const userId = req.user!.id;

    // 验证班级存在且属于该教师
    const classInfo = await executeQuery<Array<{
      id: number;
      name: string;
      teacher_id: number;
    }>>(
      'SELECT id, name, teacher_id FROM classes WHERE id = ?',
      [classId]
    );

    if (!classInfo || classInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '班级不存在'
      });
      return;
    }

    if (classInfo[0].teacher_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该班级'
      });
      return;
    }

    // 查询班级所有学生的历史成绩统计
    const studentStats = await executeQuery<Array<{
      student_id: number;
      student_name: string;
      avg_score: number | null;
      submission_count: number;
      recent_avg_score: number | null;
    }>>(
      `SELECT 
        cs.student_id,
        u.real_name as student_name,
        AVG(s.total_score / a.total_score * 100) as avg_score,
        COUNT(s.id) as submission_count,
        (
          SELECT AVG(s2.total_score / a2.total_score * 100)
          FROM submissions s2
          JOIN assignments a2 ON s2.assignment_id = a2.id
          WHERE s2.student_id = cs.student_id 
            AND s2.status IN ('graded', 'reviewed')
            AND a2.class_id = ?
            AND s2.grading_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) as recent_avg_score
       FROM class_students cs
       JOIN users u ON cs.student_id = u.id
       LEFT JOIN submissions s ON cs.student_id = s.student_id AND s.status IN ('graded', 'reviewed')
       LEFT JOIN assignments a ON s.assignment_id = a.id AND a.class_id = ?
       WHERE cs.class_id = ?
       GROUP BY cs.student_id, u.real_name`,
      [classId, classId, classId]
    );

    // 计算每个学生的层次
    const tieredStudents: StudentTierResult[] = studentStats.map(student => {
      const avgScore = student.avg_score !== null ? Number(student.avg_score) : 0;
      const recentAccuracy = student.recent_avg_score !== null ? Number(student.recent_avg_score) : avgScore;
      
      // 先根据历史成绩计算基础层次
      let tier = calculateTier(avgScore);
      
      // 如果有最近的作业数据，根据正确率动态调整
      if (student.recent_avg_score !== null) {
        tier = adjustTierByAccuracy(tier, recentAccuracy);
      }

      return {
        student_id: student.student_id,
        student_name: student.student_name,
        tier,
        avg_score: Math.round(avgScore * 100) / 100,
        submission_count: Number(student.submission_count),
        recent_accuracy: Math.round(recentAccuracy * 100) / 100
      };
    });

    // 统计各层次学生数量
    const tierSummary = {
      basic: tieredStudents.filter(s => s.tier === 'basic').length,
      medium: tieredStudents.filter(s => s.tier === 'medium').length,
      advanced: tieredStudents.filter(s => s.tier === 'advanced').length,
      total: tieredStudents.length
    };

    res.json({
      success: true,
      data: {
        class_info: classInfo[0],
        students: tieredStudents,
        summary: tierSummary
      }
    });

  } catch (error) {
    console.error('获取学生分层信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});


/**
 * GET /api/tiered-teaching/student/:studentId/tier
 * 获取单个学生的层次信息
 * 
 * 功能：
 * 1. 返回学生当前层次
 * 2. 返回层次计算依据
 * 
 * 需求：4.2
 */
router.get('/student/:studentId/tier', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查
    if (userRole === 'student' && parseInt(studentId) !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看其他学生层次'
      });
      return;
    }

    if (userRole === 'parent') {
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [userId, studentId]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该学生层次'
        });
        return;
      }
    }

    // 获取学生信息
    const studentInfo = await executeQuery<any[]>(
      'SELECT id, real_name, username FROM users WHERE id = ? AND role = ?',
      [studentId, 'student']
    );

    if (!studentInfo || studentInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '学生不存在'
      });
      return;
    }

    // 获取学生历史成绩统计
    const stats = await executeQuery<Array<{
      avg_score: number | null;
      submission_count: number;
      recent_avg_score: number | null;
    }>>(
      `SELECT 
        AVG(s.total_score / a.total_score * 100) as avg_score,
        COUNT(s.id) as submission_count,
        (
          SELECT AVG(s2.total_score / a2.total_score * 100)
          FROM submissions s2
          JOIN assignments a2 ON s2.assignment_id = a2.id
          WHERE s2.student_id = ? 
            AND s2.status IN ('graded', 'reviewed')
            AND s2.grading_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) as recent_avg_score
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')`,
      [studentId, studentId]
    );

    const avgScore = stats[0].avg_score !== null ? Number(stats[0].avg_score) : 0;
    const recentAccuracy = stats[0].recent_avg_score !== null ? Number(stats[0].recent_avg_score) : avgScore;
    
    // 计算层次
    let tier = calculateTier(avgScore);
    const baseTier = tier;
    
    // 动态调整
    if (stats[0].recent_avg_score !== null) {
      tier = adjustTierByAccuracy(tier, recentAccuracy);
    }

    res.json({
      success: true,
      data: {
        student_info: studentInfo[0],
        tier,
        base_tier: baseTier,
        tier_adjusted: tier !== baseTier,
        statistics: {
          avg_score: Math.round(avgScore * 100) / 100,
          submission_count: Number(stats[0].submission_count),
          recent_accuracy: Math.round(recentAccuracy * 100) / 100
        },
        tier_criteria: {
          basic: '平均分 < 60%',
          medium: '平均分 60% - 85%',
          advanced: '平均分 >= 85%'
        }
      }
    });

  } catch (error) {
    console.error('获取学生层次信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/tiered-teaching/assignments/:id/assign
 * 分层作业分配接口
 * 
 * 功能：
 * 1. 根据学生层次分配对应难度题目
 * 2. 创建分层作业分配记录
 * 
 * 请求体：
 * {
 *   "basic_questions": [题目ID列表],
 *   "medium_questions": [题目ID列表],
 *   "advanced_questions": [题目ID列表]
 * }
 * 
 * 需求：4.3
 */
router.post('/assignments/:id/assign', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { basic_questions = [], medium_questions = [], advanced_questions = [] } = req.body;
    const userId = req.user!.id;

    // 查询作业信息
    const assignments = await executeQuery<Array<{
      id: number;
      title: string;
      class_id: number;
      teacher_id: number;
      status: string;
      total_score: number;
    }>>(
      'SELECT id, title, class_id, teacher_id, status, total_score FROM assignments WHERE id = ?',
      [id]
    );

    if (!assignments || assignments.length === 0) {
      res.status(404).json({
        success: false,
        message: '作业不存在'
      });
      return;
    }

    const assignment = assignments[0];

    // 权限检查
    if (assignment.teacher_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限分配该作业'
      });
      return;
    }

    // 只能分配已发布的作业
    if (assignment.status !== 'published') {
      res.status(400).json({
        success: false,
        message: '只能分配已发布的作业'
      });
      return;
    }

    // 获取班级学生分层信息
    const studentStats = await executeQuery<Array<{
      student_id: number;
      student_name: string;
      avg_score: number | null;
      recent_avg_score: number | null;
    }>>(
      `SELECT 
        cs.student_id,
        u.real_name as student_name,
        AVG(s.total_score / a.total_score * 100) as avg_score,
        (
          SELECT AVG(s2.total_score / a2.total_score * 100)
          FROM submissions s2
          JOIN assignments a2 ON s2.assignment_id = a2.id
          WHERE s2.student_id = cs.student_id 
            AND s2.status IN ('graded', 'reviewed')
            AND a2.class_id = ?
            AND s2.grading_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) as recent_avg_score
       FROM class_students cs
       JOIN users u ON cs.student_id = u.id
       LEFT JOIN submissions s ON cs.student_id = s.student_id AND s.status IN ('graded', 'reviewed')
       LEFT JOIN assignments a ON s.assignment_id = a.id AND a.class_id = ?
       WHERE cs.class_id = ?
       GROUP BY cs.student_id, u.real_name`,
      [assignment.class_id, assignment.class_id, assignment.class_id]
    );

    // 为每个学生分配对应层次的题目
    const assignmentResults: Array<{
      student_id: number;
      student_name: string;
      tier: StudentTier;
      assigned_questions: number[];
    }> = [];

    for (const student of studentStats) {
      const avgScore = student.avg_score !== null ? Number(student.avg_score) : 0;
      const recentAccuracy = student.recent_avg_score !== null ? Number(student.recent_avg_score) : avgScore;
      
      let tier = calculateTier(avgScore);
      if (student.recent_avg_score !== null) {
        tier = adjustTierByAccuracy(tier, recentAccuracy);
      }

      // 根据层次选择题目
      let assignedQuestions: number[] = [];
      switch (tier) {
        case 'basic':
          assignedQuestions = basic_questions;
          break;
        case 'medium':
          assignedQuestions = medium_questions;
          break;
        case 'advanced':
          assignedQuestions = advanced_questions;
          break;
      }

      assignmentResults.push({
        student_id: student.student_id,
        student_name: student.student_name,
        tier,
        assigned_questions: assignedQuestions
      });
    }

    // 统计分配结果
    const summary = {
      basic_count: assignmentResults.filter(r => r.tier === 'basic').length,
      medium_count: assignmentResults.filter(r => r.tier === 'medium').length,
      advanced_count: assignmentResults.filter(r => r.tier === 'advanced').length,
      total_students: assignmentResults.length
    };

    // 推送通知给学生
    if (assignmentResults.length > 0) {
      const notificationValues = assignmentResults.map(result => [
        result.student_id,
        'assignment',
        `分层作业：${assignment.title}`,
        `教师为您分配了${result.tier === 'basic' ? '基础' : result.tier === 'medium' ? '中等' : '提高'}难度的作业，请及时完成。`
      ]);

      const placeholders = assignmentResults.map(() => '(?, ?, ?, ?)').join(', ');
      const flatValues = notificationValues.flat();

      await executeQuery(
        `INSERT INTO notifications (user_id, type, title, content) 
         VALUES ${placeholders}`,
        flatValues
      );
    }

    res.json({
      success: true,
      message: '分层作业分配成功',
      data: {
        assignment_id: assignment.id,
        assignment_title: assignment.title,
        assignments: assignmentResults,
        summary
      }
    });

  } catch (error) {
    console.error('分层作业分配失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/tiered-teaching/effect/:classId
 * 获取分层教学效果统计
 * 
 * 功能：
 * 1. 显示各层次学生的平均分和进步率
 * 
 * 需求：4.5
 */
router.get('/effect/:classId', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { period = '30' } = req.query;
    const userId = req.user!.id;
    const periodDays = parseInt(period as string) || 30;

    // 验证班级存在且属于该教师
    const classInfo = await executeQuery<Array<{
      id: number;
      name: string;
      teacher_id: number;
    }>>(
      'SELECT id, name, teacher_id FROM classes WHERE id = ?',
      [classId]
    );

    if (!classInfo || classInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '班级不存在'
      });
      return;
    }

    if (classInfo[0].teacher_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该班级'
      });
      return;
    }

    // 获取班级学生分层和成绩数据
    const studentData = await executeQuery<Array<{
      student_id: number;
      avg_score: number | null;
      recent_avg_score: number | null;
      previous_avg_score: number | null;
    }>>(
      `SELECT 
        cs.student_id,
        AVG(s.total_score / a.total_score * 100) as avg_score,
        (
          SELECT AVG(s2.total_score / a2.total_score * 100)
          FROM submissions s2
          JOIN assignments a2 ON s2.assignment_id = a2.id
          WHERE s2.student_id = cs.student_id 
            AND s2.status IN ('graded', 'reviewed')
            AND a2.class_id = ?
            AND s2.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ) as recent_avg_score,
        (
          SELECT AVG(s3.total_score / a3.total_score * 100)
          FROM submissions s3
          JOIN assignments a3 ON s3.assignment_id = a3.id
          WHERE s3.student_id = cs.student_id 
            AND s3.status IN ('graded', 'reviewed')
            AND a3.class_id = ?
            AND s3.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND s3.grading_time < DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ) as previous_avg_score
       FROM class_students cs
       LEFT JOIN submissions s ON cs.student_id = s.student_id AND s.status IN ('graded', 'reviewed')
       LEFT JOIN assignments a ON s.assignment_id = a.id AND a.class_id = ?
       WHERE cs.class_id = ?
       GROUP BY cs.student_id`,
      [classId, periodDays, classId, periodDays * 2, periodDays, classId, classId]
    );

    // 按层次分组统计
    const tierStats: Record<StudentTier, {
      students: number;
      avg_score: number;
      improvement: number;
      improving_count: number;
    }> = {
      basic: { students: 0, avg_score: 0, improvement: 0, improving_count: 0 },
      medium: { students: 0, avg_score: 0, improvement: 0, improving_count: 0 },
      advanced: { students: 0, avg_score: 0, improvement: 0, improving_count: 0 }
    };

    const tierScores: Record<StudentTier, number[]> = {
      basic: [],
      medium: [],
      advanced: []
    };

    const tierImprovements: Record<StudentTier, number[]> = {
      basic: [],
      medium: [],
      advanced: []
    };

    for (const student of studentData) {
      const avgScore = student.avg_score !== null ? Number(student.avg_score) : 0;
      const recentScore = student.recent_avg_score !== null ? Number(student.recent_avg_score) : avgScore;
      const previousScore = student.previous_avg_score !== null ? Number(student.previous_avg_score) : 0;
      
      const tier = calculateTier(avgScore);
      const improvement = recentScore - previousScore;

      tierStats[tier].students++;
      tierScores[tier].push(recentScore);
      tierImprovements[tier].push(improvement);

      if (improvement > 0) {
        tierStats[tier].improving_count++;
      }
    }

    // 计算各层次平均值
    for (const tier of ['basic', 'medium', 'advanced'] as StudentTier[]) {
      if (tierScores[tier].length > 0) {
        tierStats[tier].avg_score = Math.round(
          tierScores[tier].reduce((a, b) => a + b, 0) / tierScores[tier].length * 100
        ) / 100;
        tierStats[tier].improvement = Math.round(
          tierImprovements[tier].reduce((a, b) => a + b, 0) / tierImprovements[tier].length * 100
        ) / 100;
      }
    }

    res.json({
      success: true,
      data: {
        class_info: classInfo[0],
        period_days: periodDays,
        tier_statistics: {
          basic: {
            ...tierStats.basic,
            improvement_rate: tierStats.basic.students > 0 
              ? Math.round(tierStats.basic.improving_count / tierStats.basic.students * 10000) / 100 
              : 0
          },
          medium: {
            ...tierStats.medium,
            improvement_rate: tierStats.medium.students > 0 
              ? Math.round(tierStats.medium.improving_count / tierStats.medium.students * 10000) / 100 
              : 0
          },
          advanced: {
            ...tierStats.advanced,
            improvement_rate: tierStats.advanced.students > 0 
              ? Math.round(tierStats.advanced.improving_count / tierStats.advanced.students * 10000) / 100 
              : 0
          }
        },
        overall: {
          total_students: studentData.length,
          overall_improvement_rate: studentData.length > 0
            ? Math.round(
                (tierStats.basic.improving_count + tierStats.medium.improving_count + tierStats.advanced.improving_count) 
                / studentData.length * 10000
              ) / 100
            : 0
        }
      }
    });

  } catch (error) {
    console.error('获取分层教学效果失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
