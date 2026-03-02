/**
 * 学情分析路由模块
 * 实现班级学情分析、薄弱知识点分析、成绩排名、报告导出
 * 需求：3.1, 3.2, 3.3, 3.5
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';

const router = Router();

// 所有学情分析路由都需要认证
router.use(authenticateToken);

/**
 * GET /api/analytics/class/:classId
 * 班级学情分析接口
 * 
 * 功能：
 * 1. 计算班级平均分、及格率、优秀率
 * 2. 生成最近30天趋势图数据
 * 
 * 需求：3.1
 */
router.get('/class/:classId', requireRole('teacher', 'parent'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 验证班级存在
    const classInfo = await executeQuery<Array<{
      id: number;
      name: string;
      grade: string;
      teacher_id: number;
      student_count: number;
    }>>(
      'SELECT * FROM classes WHERE id = ?',
      [classId]
    );

    if (!classInfo || classInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '班级不存在'
      });
      return;
    }

    // 权限检查：教师只能查看自己班级，家长只能查看孩子所在班级
    if (userRole === 'teacher' && classInfo[0].teacher_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该班级学情'
      });
      return;
    }

    if (userRole === 'parent') {
      // 检查家长的孩子是否在该班级
      const childInClass = await executeQuery<any[]>(
        `SELECT 1 FROM parent_students ps
         JOIN class_students cs ON ps.student_id = cs.student_id
         WHERE ps.parent_id = ? AND cs.class_id = ?`,
        [userId, classId]
      );

      if (!childInClass || childInClass.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该班级学情'
        });
        return;
      }
    }

    // 获取班级学生列表
    const students = await executeQuery<Array<{ student_id: number }>>(
      'SELECT student_id FROM class_students WHERE class_id = ?',
      [classId]
    );

    if (students.length === 0) {
      res.json({
        success: true,
        data: {
          class_info: classInfo[0],
          statistics: {
            average_score: 0,
            pass_rate: 0,
            excellent_rate: 0,
            total_students: 0,
            total_submissions: 0
          },
          trend_data: [],
          recent_assignments: []
        }
      });
      return;
    }

    const studentIds = students.map(s => s.student_id);

    // 计算班级整体统计数据
    const overallStats = await executeQuery<Array<{
      avg_score: number | null;
      total_submissions: number;
      pass_count: number;
      excellent_count: number;
    }>>(
      `SELECT 
        AVG(s.total_score / a.total_score * 100) as avg_score,
        COUNT(s.id) as total_submissions,
        SUM(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 1 ELSE 0 END) as excellent_count
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id IN (?) AND s.status IN ('graded', 'reviewed') AND a.class_id = ?`,
      [studentIds, classId]
    );

    const stats = overallStats[0];
    const totalSubmissions = stats.total_submissions || 0;

    // 计算最近30天趋势数据
    const trendData = await executeQuery<Array<{
      date: string;
      avg_score: number;
      pass_rate: number;
      excellent_rate: number;
      submission_count: number;
    }>>(
      `SELECT 
        DATE(s.grading_time) as date,
        AVG(s.total_score / a.total_score * 100) as avg_score,
        AVG(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 100 ELSE 0 END) as pass_rate,
        AVG(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 100 ELSE 0 END) as excellent_rate,
        COUNT(s.id) as submission_count
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id IN (?) 
         AND s.status IN ('graded', 'reviewed') 
         AND a.class_id = ?
         AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(s.grading_time)
       ORDER BY date ASC`,
      [studentIds, classId]
    );

    // 获取最近作业列表
    const recentAssignments = await executeQuery<Array<{
      id: number;
      title: string;
      deadline: Date;
      total_score: number;
      submission_count: number;
      graded_count: number;
      avg_score: number | null;
    }>>(
      `SELECT 
        a.id,
        a.title,
        a.deadline,
        a.total_score,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.status IN ('graded', 'reviewed') THEN s.id END) as graded_count,
        AVG(CASE WHEN s.status IN ('graded', 'reviewed') THEN s.total_score END) as avg_score
       FROM assignments a
       LEFT JOIN submissions s ON a.id = s.assignment_id
       WHERE a.class_id = ? AND a.status = 'published'
       GROUP BY a.id
       ORDER BY a.created_at DESC
       LIMIT 10`,
      [classId]
    );

    res.json({
      success: true,
      data: {
        class_info: classInfo[0],
        statistics: {
          average_score: stats.avg_score ? Math.round(stats.avg_score * 100) / 100 : 0,
          pass_rate: totalSubmissions > 0 ? Math.round((stats.pass_count / totalSubmissions) * 10000) / 100 : 0,
          excellent_rate: totalSubmissions > 0 ? Math.round((stats.excellent_count / totalSubmissions) * 10000) / 100 : 0,
          total_students: students.length,
          total_submissions: totalSubmissions
        },
        trend_data: trendData.map(t => ({
          date: t.date,
          average_score: Math.round(t.avg_score * 100) / 100,
          pass_rate: Math.round(t.pass_rate * 100) / 100,
          excellent_rate: Math.round(t.excellent_rate * 100) / 100,
          submission_count: t.submission_count
        })),
        recent_assignments: recentAssignments.map(a => ({
          ...a,
          avg_score: a.avg_score ? Math.round(a.avg_score * 100) / 100 : null
        }))
      }
    });

  } catch (error) {
    console.error('班级学情分析失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});


/**
 * GET /api/analytics/weak-points
 * 薄弱知识点分析接口
 * 
 * 功能：
 * 1. 识别错误率≥40%的知识点
 * 2. 生成热力图数据
 * 
 * 查询参数：
 * - class_id: 班级ID（教师查询班级薄弱点时使用）
 * - student_id: 学生ID（查询特定学生薄弱点时使用）
 * 
 * 需求：3.2
 * 
 * 修复内容（Task 3）：
 * - Sub-task 3.1: 添加参数校验，确保class_id或student_id至少提供一个
 * - Sub-task 3.2: 完善权限校验逻辑
 *   - 学生只能查询自己的薄弱点
 *   - 教师只能查询本班学生薄弱点
 *   - 管理员无限制
 */
router.get('/weak-points', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { class_id, student_id } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Sub-task 3.1: 参数校验 - 确保至少提供class_id或student_id之一
    if (!class_id && !student_id) {
      console.error(`[${new Date().toISOString()}] 薄弱点分析参数校验失败:`, {
        user_id: userId,
        role: userRole,
        error: '缺少必填参数：class_id或student_id',
        url: req.url,
        method: req.method,
        query: req.query,
        duration_ms: Date.now() - startTime
      });
      
      res.status(400).json({
        code: 400,
        msg: '缺少必填参数：class_id或student_id（至少提供一个）',
        data: null
      });
      return;
    }

    let targetStudentIds: number[] = [];

    // Sub-task 3.2: 完善权限校验逻辑
    // 根据角色确定查询范围
    if (userRole === 'admin') {
      // 管理员无限制，可以查询任意班级或学生
      if (class_id) {
        // 验证班级存在
        const classInfo = await executeQuery<Array<{ id: number }>>(
          'SELECT id FROM classes WHERE id = ?',
          [class_id]
        );

        if (!classInfo || classInfo.length === 0) {
          console.error(`[${new Date().toISOString()}] 薄弱点分析失败 - 班级不存在:`, {
            user_id: userId,
            role: userRole,
            class_id,
            duration_ms: Date.now() - startTime
          });
          
          res.status(404).json({
            code: 404,
            msg: '班级不存在',
            data: null
          });
          return;
        }

        // 获取班级所有学生
        const students = await executeQuery<Array<{ student_id: number }>>(
          'SELECT student_id FROM class_students WHERE class_id = ?',
          [class_id]
        );
        targetStudentIds = students.map(s => s.student_id);
      } else if (student_id) {
        targetStudentIds = [parseInt(student_id as string)];
      }

    } else if (userRole === 'teacher') {
      // 教师只能查询本班学生的薄弱点
      if (class_id) {
        // 验证教师权限
        const classInfo = await executeQuery<Array<{ teacher_id: number }>>(
          'SELECT teacher_id FROM classes WHERE id = ?',
          [class_id]
        );

        if (!classInfo || classInfo.length === 0) {
          console.error(`[${new Date().toISOString()}] 薄弱点分析失败 - 班级不存在:`, {
            user_id: userId,
            role: userRole,
            class_id,
            duration_ms: Date.now() - startTime
          });
          
          res.status(404).json({
            code: 404,
            msg: '班级不存在',
            data: null
          });
          return;
        }

        if (classInfo[0].teacher_id !== userId) {
          console.error(`[${new Date().toISOString()}] 薄弱点分析权限不足:`, {
            user_id: userId,
            role: userRole,
            class_id,
            teacher_id: classInfo[0].teacher_id,
            error: '教师只能查询本班学生的薄弱点',
            duration_ms: Date.now() - startTime
          });
          
          res.status(403).json({
            code: 403,
            msg: '权限不足：教师只能查询本班学生的薄弱点',
            data: null
          });
          return;
        }

        // 获取班级所有学生
        const students = await executeQuery<Array<{ student_id: number }>>(
          'SELECT student_id FROM class_students WHERE class_id = ?',
          [class_id]
        );
        targetStudentIds = students.map(s => s.student_id);
        
      } else if (student_id) {
        // 教师查询特定学生，需要验证该学生是否在教师的班级中
        const studentInTeacherClass = await executeQuery<Array<{ student_id: number }>>(
          `SELECT cs.student_id 
           FROM class_students cs
           JOIN classes c ON cs.class_id = c.id
           WHERE c.teacher_id = ? AND cs.student_id = ?`,
          [userId, student_id]
        );

        if (!studentInTeacherClass || studentInTeacherClass.length === 0) {
          console.error(`[${new Date().toISOString()}] 薄弱点分析权限不足:`, {
            user_id: userId,
            role: userRole,
            student_id,
            error: '教师只能查询本班学生的薄弱点',
            duration_ms: Date.now() - startTime
          });
          
          res.status(403).json({
            code: 403,
            msg: '权限不足：教师只能查询本班学生的薄弱点',
            data: null
          });
          return;
        }
        
        targetStudentIds = [parseInt(student_id as string)];
      }

    } else if (userRole === 'student') {
      // 学生只能查询自己的薄弱点
      if (student_id && parseInt(student_id as string) !== userId) {
        console.error(`[${new Date().toISOString()}] 薄弱点分析权限不足:`, {
          user_id: userId,
          role: userRole,
          requested_student_id: student_id,
          error: '学生只能查询自己的薄弱点',
          duration_ms: Date.now() - startTime
        });
        
        res.status(403).json({
          code: 403,
          msg: '权限不足：学生只能查询自己的薄弱点',
          data: null
        });
        return;
      }
      
      targetStudentIds = [userId];

    } else if (userRole === 'parent') {
      // 家长只能查询自己孩子的薄弱点
      if (student_id) {
        // 验证是否是家长的孩子
        const isChild = await executeQuery<any[]>(
          'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
          [userId, student_id]
        );

        if (!isChild || isChild.length === 0) {
          console.error(`[${new Date().toISOString()}] 薄弱点分析权限不足:`, {
            user_id: userId,
            role: userRole,
            student_id,
            error: '家长只能查询自己孩子的薄弱点',
            duration_ms: Date.now() - startTime
          });
          
          res.status(403).json({
            code: 403,
            msg: '权限不足：家长只能查询自己孩子的薄弱点',
            data: null
          });
          return;
        }
        targetStudentIds = [parseInt(student_id as string)];
      } else if (class_id) {
        // 家长通过班级查询，获取该班级中自己孩子的数据
        const childrenInClass = await executeQuery<Array<{ student_id: number }>>(
          `SELECT ps.student_id 
           FROM parent_students ps
           JOIN class_students cs ON ps.student_id = cs.student_id
           WHERE ps.parent_id = ? AND cs.class_id = ?`,
          [userId, class_id]
        );
        
        if (!childrenInClass || childrenInClass.length === 0) {
          console.error(`[${new Date().toISOString()}] 薄弱点分析权限不足:`, {
            user_id: userId,
            role: userRole,
            class_id,
            error: '家长的孩子不在该班级中',
            duration_ms: Date.now() - startTime
          });
          
          res.status(403).json({
            code: 403,
            msg: '权限不足：您的孩子不在该班级中',
            data: null
          });
          return;
        }
        
        targetStudentIds = childrenInClass.map(c => c.student_id);
      } else {
        // 获取家长所有孩子
        const children = await executeQuery<Array<{ student_id: number }>>(
          'SELECT student_id FROM parent_students WHERE parent_id = ?',
          [userId]
        );
        targetStudentIds = children.map(c => c.student_id);
      }
    }

    if (targetStudentIds.length === 0) {
      console.log(`[${new Date().toISOString()}] 薄弱点分析成功 - 无学生数据:`, {
        user_id: userId,
        role: userRole,
        class_id,
        student_id,
        duration_ms: Date.now() - startTime
      });
      
      res.json({
        code: 200,
        msg: '查询成功',
        data: {
          weak_points: [],
          heatmap_data: [],
          summary: {
            total_knowledge_points: 0,
            weak_count: 0,
            improving_count: 0,
            mastered_count: 0
          }
        }
      });
      return;
    }

    // 查询薄弱知识点（错误率≥40%）
    const weakPoints = await executeQuery<Array<{
      knowledge_point_id: number;
      knowledge_point_name: string;
      subject: string;
      grade: string;
      total_attempts: number;
      error_count: number;
      error_rate: number;
      student_count: number;
    }>>(
      `SELECT 
        kp.id as knowledge_point_id,
        kp.name as knowledge_point_name,
        kp.subject,
        kp.grade,
        SUM(swp.total_count) as total_attempts,
        SUM(swp.error_count) as error_count,
        AVG(swp.error_rate) as error_rate,
        COUNT(DISTINCT swp.student_id) as student_count
       FROM student_weak_points swp
       JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
       WHERE swp.student_id IN (?)
       GROUP BY kp.id
       HAVING AVG(swp.error_rate) >= 40
       ORDER BY error_rate DESC`,
      [targetStudentIds]
    );

    // 生成热力图数据（按学科和知识点分组）
    const heatmapData = await executeQuery<Array<{
      subject: string;
      knowledge_point_name: string;
      error_rate: number;
      student_count: number;
    }>>(
      `SELECT 
        kp.subject,
        kp.name as knowledge_point_name,
        AVG(swp.error_rate) as error_rate,
        COUNT(DISTINCT swp.student_id) as student_count
       FROM student_weak_points swp
       JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
       WHERE swp.student_id IN (?)
       GROUP BY kp.subject, kp.id
       ORDER BY kp.subject, error_rate DESC`,
      [targetStudentIds]
    );

    // 统计各状态知识点数量
    const statusSummary = await executeQuery<Array<{
      status: string;
      count: number;
    }>>(
      `SELECT 
        swp.status,
        COUNT(DISTINCT swp.knowledge_point_id) as count
       FROM student_weak_points swp
       WHERE swp.student_id IN (?)
       GROUP BY swp.status`,
      [targetStudentIds]
    );

    const summary = {
      total_knowledge_points: 0,
      weak_count: 0,
      improving_count: 0,
      mastered_count: 0
    };

    for (const s of statusSummary) {
      summary.total_knowledge_points += s.count;
      if (s.status === 'weak') summary.weak_count = s.count;
      else if (s.status === 'improving') summary.improving_count = s.count;
      else if (s.status === 'mastered') summary.mastered_count = s.count;
    }

    console.log(`[${new Date().toISOString()}] 薄弱点分析成功:`, {
      user_id: userId,
      role: userRole,
      class_id,
      student_id,
      target_student_count: targetStudentIds.length,
      weak_points_count: weakPoints.length,
      duration_ms: Date.now() - startTime
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        weak_points: weakPoints.map(wp => ({
          knowledge_point_id: wp.knowledge_point_id,
          knowledge_point_name: wp.knowledge_point_name,
          subject: wp.subject,
          grade: wp.grade,
          total_attempts: wp.total_attempts,
          error_count: wp.error_count,
          error_rate: Math.round(wp.error_rate * 100) / 100,
          student_count: wp.student_count,
          severity: wp.error_rate >= 70 ? 'high' : wp.error_rate >= 50 ? 'medium' : 'low'
        })),
        heatmap_data: heatmapData.map(h => ({
          subject: h.subject,
          knowledge_point: h.knowledge_point_name,
          error_rate: Math.round(h.error_rate * 100) / 100,
          student_count: h.student_count,
          intensity: Math.min(100, Math.round(h.error_rate))
        })),
        summary
      }
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 薄弱点分析失败:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      query: req.query,
      user_id: req.user?.id,
      role: req.user?.role,
      duration_ms: Date.now() - startTime
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});


/**
 * GET /api/analytics/ranking/:classId
 * 班级成绩排名接口
 * 
 * 功能：
 * 1. 按总分降序排列
 * 2. 计算进步幅度
 * 
 * 需求：3.3
 */
router.get('/ranking/:classId', requireRole('teacher', 'parent'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { assignment_id, period = '30' } = req.query; // period: 天数
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 验证班级存在
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

    // 权限检查
    if (userRole === 'teacher' && classInfo[0].teacher_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该班级排名'
      });
      return;
    }

    if (userRole === 'parent') {
      const childInClass = await executeQuery<any[]>(
        `SELECT 1 FROM parent_students ps
         JOIN class_students cs ON ps.student_id = cs.student_id
         WHERE ps.parent_id = ? AND cs.class_id = ?`,
        [userId, classId]
      );

      if (!childInClass || childInClass.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该班级排名'
        });
        return;
      }
    }

    const periodDays = parseInt(period as string) || 30;

    // 如果指定了作业ID，查询该作业的排名
    if (assignment_id) {
      const assignmentRanking = await executeQuery<Array<{
        student_id: number;
        student_name: string;
        total_score: number;
        max_score: number;
        score_percentage: number;
        submit_time: Date;
      }>>(
        `SELECT 
          s.student_id,
          u.real_name as student_name,
          s.total_score,
          a.total_score as max_score,
          (s.total_score / a.total_score * 100) as score_percentage,
          s.submit_time
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         JOIN assignments a ON s.assignment_id = a.id
         WHERE s.assignment_id = ? AND s.status IN ('graded', 'reviewed')
         ORDER BY s.total_score DESC, s.submit_time ASC`,
        [assignment_id]
      );

      // 添加排名
      const rankedResults = assignmentRanking.map((r, index) => ({
        rank: index + 1,
        ...r,
        score_percentage: Math.round(r.score_percentage * 100) / 100
      }));

      res.json({
        success: true,
        data: {
          class_info: classInfo[0],
          ranking_type: 'assignment',
          assignment_id: parseInt(assignment_id as string),
          rankings: rankedResults
        }
      });
      return;
    }

    // 查询班级学生在指定时间段内的综合排名
    const rankings = await executeQuery<Array<{
      student_id: number;
      student_name: string;
      total_score: number;
      submission_count: number;
      avg_score: number;
    }>>(
      `SELECT 
        cs.student_id,
        u.real_name as student_name,
        COALESCE(SUM(s.total_score), 0) as total_score,
        COUNT(s.id) as submission_count,
        COALESCE(AVG(s.total_score / a.total_score * 100), 0) as avg_score
       FROM class_students cs
       JOIN users u ON cs.student_id = u.id
       LEFT JOIN submissions s ON cs.student_id = s.student_id 
         AND s.status IN ('graded', 'reviewed')
         AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       LEFT JOIN assignments a ON s.assignment_id = a.id AND a.class_id = ?
       WHERE cs.class_id = ?
       GROUP BY cs.student_id
       ORDER BY total_score DESC, avg_score DESC`,
      [periodDays, classId, classId]
    );

    // 计算进步幅度（与上一个时间段对比）
    const previousPeriodScores = await executeQuery<Array<{
      student_id: number;
      avg_score: number;
    }>>(
      `SELECT 
        cs.student_id,
        COALESCE(AVG(s.total_score / a.total_score * 100), 0) as avg_score
       FROM class_students cs
       LEFT JOIN submissions s ON cs.student_id = s.student_id 
         AND s.status IN ('graded', 'reviewed')
         AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND s.grading_time < DATE_SUB(CURDATE(), INTERVAL ? DAY)
       LEFT JOIN assignments a ON s.assignment_id = a.id AND a.class_id = ?
       WHERE cs.class_id = ?
       GROUP BY cs.student_id`,
      [periodDays * 2, periodDays, classId, classId]
    );

    const previousScoreMap = new Map(previousPeriodScores.map(p => [p.student_id, p.avg_score]));

    // 添加排名和进步幅度
    const rankedResults = rankings.map((r, index) => {
      const previousAvg = previousScoreMap.get(r.student_id) || 0;
      const currentAvg = r.avg_score;
      const improvement = currentAvg - previousAvg;

      return {
        rank: index + 1,
        student_id: r.student_id,
        student_name: r.student_name,
        total_score: r.total_score,
        submission_count: r.submission_count,
        avg_score: Math.round(r.avg_score * 100) / 100,
        previous_avg_score: Math.round(previousAvg * 100) / 100,
        improvement: Math.round(improvement * 100) / 100,
        improvement_trend: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable'
      };
    });

    res.json({
      success: true,
      data: {
        class_info: classInfo[0],
        ranking_type: 'overall',
        period_days: periodDays,
        rankings: rankedResults,
        summary: {
          total_students: rankings.length,
          improving_count: rankedResults.filter(r => r.improvement > 0).length,
          declining_count: rankedResults.filter(r => r.improvement < 0).length,
          stable_count: rankedResults.filter(r => r.improvement === 0).length
        }
      }
    });

  } catch (error) {
    console.error('成绩排名查询失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});


/**
 * POST /api/analytics/export
 * 学情报告导出接口
 * 
 * 功能：
 * 1. 导出PDF格式报告
 * 2. 包含所有图表和数据分析
 * 
 * 请求体：
 * {
 *   "class_id": 班级ID,
 *   "student_id": 学生ID（可选，导出个人报告时使用）,
 *   "period": 时间段（天数，默认30）,
 *   "include_charts": 是否包含图表（默认true）
 * }
 * 
 * 需求：3.5
 */
router.post('/export', requireRole('teacher', 'parent'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { class_id, student_id, period = 30, include_charts = true } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!class_id && !student_id) {
      res.status(400).json({
        success: false,
        message: '必须指定班级ID或学生ID'
      });
      return;
    }

    // 权限验证
    if (class_id) {
      const classInfo = await executeQuery<Array<{ teacher_id: number; name: string }>>(
        'SELECT teacher_id, name FROM classes WHERE id = ?',
        [class_id]
      );

      if (!classInfo || classInfo.length === 0) {
        res.status(404).json({
          success: false,
          message: '班级不存在'
        });
        return;
      }

      if (userRole === 'teacher' && classInfo[0].teacher_id !== userId) {
        res.status(403).json({
          success: false,
          message: '无权限导出该班级报告'
        });
        return;
      }
    }

    if (student_id && userRole === 'parent') {
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [userId, student_id]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限导出该学生报告'
        });
        return;
      }
    }

    // 收集报告数据
    const reportData: any = {
      generated_at: new Date().toISOString(),
      period_days: period,
      include_charts
    };

    if (class_id) {
      // 班级报告
      const classInfo = await executeQuery<any[]>(
        'SELECT * FROM classes WHERE id = ?',
        [class_id]
      );
      reportData.class_info = classInfo[0];

      // 获取班级学生
      const students = await executeQuery<Array<{ student_id: number }>>(
        'SELECT student_id FROM class_students WHERE class_id = ?',
        [class_id]
      );
      const studentIds = students.map(s => s.student_id);

      if (studentIds.length > 0) {
        // 班级统计数据
        const stats = await executeQuery<any[]>(
          `SELECT 
            AVG(s.total_score / a.total_score * 100) as avg_score,
            COUNT(s.id) as total_submissions,
            SUM(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 1 ELSE 0 END) as pass_count,
            SUM(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 1 ELSE 0 END) as excellent_count
           FROM submissions s
           JOIN assignments a ON s.assignment_id = a.id
           WHERE s.student_id IN (?) AND s.status IN ('graded', 'reviewed') AND a.class_id = ?
             AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
          [studentIds, class_id, period]
        );

        const totalSubmissions = stats[0].total_submissions || 0;
        reportData.statistics = {
          average_score: stats[0].avg_score ? Math.round(stats[0].avg_score * 100) / 100 : 0,
          pass_rate: totalSubmissions > 0 ? Math.round((stats[0].pass_count / totalSubmissions) * 10000) / 100 : 0,
          excellent_rate: totalSubmissions > 0 ? Math.round((stats[0].excellent_count / totalSubmissions) * 10000) / 100 : 0,
          total_students: students.length,
          total_submissions: totalSubmissions
        };

        // 趋势数据
        const trendData = await executeQuery<any[]>(
          `SELECT 
            DATE(s.grading_time) as date,
            AVG(s.total_score / a.total_score * 100) as avg_score,
            AVG(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 100 ELSE 0 END) as pass_rate,
            AVG(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 100 ELSE 0 END) as excellent_rate
           FROM submissions s
           JOIN assignments a ON s.assignment_id = a.id
           WHERE s.student_id IN (?) AND s.status IN ('graded', 'reviewed') AND a.class_id = ?
             AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           GROUP BY DATE(s.grading_time)
           ORDER BY date ASC`,
          [studentIds, class_id, period]
        );
        reportData.trend_data = trendData;

        // 薄弱知识点
        const weakPoints = await executeQuery<any[]>(
          `SELECT 
            kp.name as knowledge_point_name,
            kp.subject,
            AVG(swp.error_rate) as error_rate,
            COUNT(DISTINCT swp.student_id) as affected_students
           FROM student_weak_points swp
           JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
           WHERE swp.student_id IN (?)
           GROUP BY kp.id
           HAVING AVG(swp.error_rate) >= 40
           ORDER BY error_rate DESC
           LIMIT 10`,
          [studentIds]
        );
        reportData.weak_points = weakPoints;

        // 排名数据
        const rankings = await executeQuery<any[]>(
          `SELECT 
            u.real_name as student_name,
            COALESCE(SUM(s.total_score), 0) as total_score,
            COALESCE(AVG(s.total_score / a.total_score * 100), 0) as avg_score
           FROM class_students cs
           JOIN users u ON cs.student_id = u.id
           LEFT JOIN submissions s ON cs.student_id = s.student_id 
             AND s.status IN ('graded', 'reviewed')
             AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           LEFT JOIN assignments a ON s.assignment_id = a.id AND a.class_id = ?
           WHERE cs.class_id = ?
           GROUP BY cs.student_id
           ORDER BY total_score DESC
           LIMIT 20`,
          [period, class_id, class_id]
        );
        reportData.rankings = rankings.map((r, i) => ({ rank: i + 1, ...r }));
      }

    } else if (student_id) {
      // 个人报告
      const studentInfo = await executeQuery<any[]>(
        'SELECT id, real_name, username FROM users WHERE id = ?',
        [student_id]
      );
      reportData.student_info = studentInfo[0];

      // 个人统计
      const stats = await executeQuery<any[]>(
        `SELECT 
          AVG(s.total_score / a.total_score * 100) as avg_score,
          COUNT(s.id) as total_submissions,
          SUM(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 1 ELSE 0 END) as pass_count,
          SUM(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 1 ELSE 0 END) as excellent_count
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')
           AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [student_id, period]
      );

      const totalSubmissions = stats[0].total_submissions || 0;
      reportData.statistics = {
        average_score: stats[0].avg_score ? Math.round(stats[0].avg_score * 100) / 100 : 0,
        pass_rate: totalSubmissions > 0 ? Math.round((stats[0].pass_count / totalSubmissions) * 10000) / 100 : 0,
        excellent_rate: totalSubmissions > 0 ? Math.round((stats[0].excellent_count / totalSubmissions) * 10000) / 100 : 0,
        total_submissions: totalSubmissions
      };

      // 个人薄弱点
      const weakPoints = await executeQuery<any[]>(
        `SELECT 
          kp.name as knowledge_point_name,
          kp.subject,
          swp.error_rate,
          swp.status
         FROM student_weak_points swp
         JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
         WHERE swp.student_id = ? AND swp.error_rate >= 40
         ORDER BY swp.error_rate DESC`,
        [student_id]
      );
      reportData.weak_points = weakPoints;

      // 最近作业成绩
      const recentScores = await executeQuery<any[]>(
        `SELECT 
          a.title as assignment_title,
          s.total_score,
          a.total_score as max_score,
          (s.total_score / a.total_score * 100) as score_percentage,
          s.grading_time
         FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')
         ORDER BY s.grading_time DESC
         LIMIT 10`,
        [student_id]
      );
      reportData.recent_scores = recentScores;
    }

    // 生成报告内容（这里返回JSON格式，实际PDF生成可以在前端或使用专门的PDF库）
    // 注意：完整的PDF生成需要使用如pdfkit、puppeteer等库
    // 这里先返回报告数据，前端可以使用这些数据生成PDF

    res.json({
      success: true,
      message: '报告数据生成成功',
      data: {
        report_type: class_id ? 'class' : 'student',
        report_data: reportData,
        // PDF生成提示
        pdf_generation_hint: '请使用前端PDF库（如jsPDF）或后端PDF库（如pdfkit）生成PDF文件'
      }
    });

  } catch (error) {
    console.error('报告导出失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/analytics/student/:studentId
 * 学生个人学情分析接口
 * 
 * 功能：
 * 1. 获取学生个人学习数据
 * 2. 包含成绩趋势、薄弱点、学习时长等
 * 
 * 需求：8.3
 */
router.get('/student/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查
    if (userRole === 'student' && parseInt(studentId) !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看其他学生学情'
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
          message: '无权限查看该学生学情'
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

    // 获取学生所在班级
    const classInfo = await executeQuery<any[]>(
      `SELECT c.id, c.name, c.grade
       FROM class_students cs
       JOIN classes c ON cs.class_id = c.id
       WHERE cs.student_id = ?`,
      [studentId]
    );

    // 获取学生统计数据
    const stats = await executeQuery<any[]>(
      `SELECT 
        AVG(s.total_score / a.total_score * 100) as avg_score,
        COUNT(s.id) as total_submissions,
        SUM(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 1 ELSE 0 END) as excellent_count
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')`,
      [studentId]
    );

    // 获取成绩趋势（最近30天）
    const trendData = await executeQuery<any[]>(
      `SELECT 
        DATE(s.grading_time) as date,
        AVG(s.total_score / a.total_score * 100) as avg_score
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')
         AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(s.grading_time)
       ORDER BY date ASC`,
      [studentId]
    );

    // 获取薄弱知识点
    const weakPoints = await executeQuery<any[]>(
      `SELECT 
        kp.id,
        kp.name,
        kp.subject,
        swp.error_rate,
        swp.status
       FROM student_weak_points swp
       JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
       WHERE swp.student_id = ? AND swp.status = 'weak'
       ORDER BY swp.error_rate DESC
       LIMIT 10`,
      [studentId]
    );

    // 获取班级排名
    let classRank = null;
    if (classInfo.length > 0) {
      const rankings = await executeQuery<any[]>(
        `SELECT 
          cs.student_id,
          COALESCE(SUM(s.total_score), 0) as total_score
         FROM class_students cs
         LEFT JOIN submissions s ON cs.student_id = s.student_id AND s.status IN ('graded', 'reviewed')
         WHERE cs.class_id = ?
         GROUP BY cs.student_id
         ORDER BY total_score DESC`,
        [classInfo[0].id]
      );

      const studentRankIndex = rankings.findIndex(r => r.student_id === parseInt(studentId));
      if (studentRankIndex !== -1) {
        classRank = {
          rank: studentRankIndex + 1,
          total_students: rankings.length,
          percentile: Math.round((1 - studentRankIndex / rankings.length) * 100)
        };
      }
    }

    const totalSubmissions = stats[0].total_submissions || 0;

    res.json({
      success: true,
      data: {
        student_info: studentInfo[0],
        class_info: classInfo[0] || null,
        statistics: {
          average_score: stats[0].avg_score ? Math.round(stats[0].avg_score * 100) / 100 : 0,
          pass_rate: totalSubmissions > 0 ? Math.round((stats[0].pass_count / totalSubmissions) * 10000) / 100 : 0,
          excellent_rate: totalSubmissions > 0 ? Math.round((stats[0].excellent_count / totalSubmissions) * 10000) / 100 : 0,
          total_submissions: totalSubmissions
        },
        class_rank: classRank,
        trend_data: trendData.map(t => ({
          date: t.date,
          score: Math.round(t.avg_score * 100) / 100
        })),
        weak_points: weakPoints.map(wp => ({
          id: wp.id,
          name: wp.name,
          subject: wp.subject,
          error_rate: Math.round(wp.error_rate * 100) / 100,
          status: wp.status
        }))
      }
    });

  } catch (error) {
    console.error('学生学情分析失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
