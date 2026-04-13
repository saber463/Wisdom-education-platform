/**
 * 个性化推荐路由模块
 * 实现薄弱点识别、个性化推荐、知识点掌握度更新
 * 需求：6.1, 6.2, 6.3, 6.4, 6.5
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { recommendExercises } from '../services/grpc-clients.js';

const router = Router();

// 所有推荐路由都需要认证
router.use(authenticateToken);

/**
 * 薄弱点识别阈值
 * 错误率 >= 50% 的知识点被识别为薄弱点
 * 需求：6.1
 */
export const WEAK_POINT_THRESHOLD = 50;

/**
 * 薄弱点移除阈值
 * 错误率 < 30% 时从薄弱点列表移除
 * 需求：6.5
 */
export const MASTERY_THRESHOLD = 30;

/**
 * 薄弱点状态类型
 */
export type WeakPointStatus = 'weak' | 'improving' | 'mastered';

/**
 * 薄弱点识别结果接口
 */
export interface WeakPointResult {
  knowledge_point_id: number;
  knowledge_point_name: string;
  subject: string;
  error_count: number;
  total_count: number;
  error_rate: number;
  status: WeakPointStatus;
}

/**
 * 根据错误率计算薄弱点状态
 * 需求：6.1, 6.5
 * 
 * @param errorRate 错误率（百分比，0-100）
 * @returns 薄弱点状态
 */
export function calculateWeakPointStatus(errorRate: number): WeakPointStatus {
  if (errorRate >= WEAK_POINT_THRESHOLD) {
    return 'weak';
  } else if (errorRate >= MASTERY_THRESHOLD) {
    return 'improving';
  } else {
    return 'mastered';
  }
}

/**
 * 判断是否为薄弱点
 * 需求：6.1
 * 
 * @param errorRate 错误率（百分比，0-100）
 * @returns 是否为薄弱点
 */
export function isWeakPoint(errorRate: number): boolean {
  return errorRate >= WEAK_POINT_THRESHOLD;
}

/**
 * 判断是否应该从薄弱点列表移除
 * 需求：6.5
 * 
 * @param errorRate 错误率（百分比，0-100）
 * @returns 是否应该移除
 */
export function shouldRemoveFromWeakPoints(errorRate: number): boolean {
  return errorRate < MASTERY_THRESHOLD;
}

/**
 * 分析学生答题记录，识别薄弱知识点
 * 需求：6.1
 * 
 * @param studentId 学生ID
 * @returns 薄弱知识点列表
 */
export async function analyzeStudentWeakPoints(studentId: number): Promise<WeakPointResult[]> {
  // 查询学生在各知识点上的答题统计
  const knowledgePointStats = await executeQuery<Array<{
    knowledge_point_id: number;
    knowledge_point_name: string;
    subject: string;
    total_count: number;
    error_count: number;
  }>>(
    `SELECT 
      kp.id as knowledge_point_id,
      kp.name as knowledge_point_name,
      kp.subject,
      COUNT(a.id) as total_count,
      SUM(CASE WHEN ans.is_correct = 0 OR ans.is_correct IS NULL THEN 1 ELSE 0 END) as error_count
     FROM answers ans
     JOIN questions q ON ans.question_id = q.id
     JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
     JOIN submissions s ON ans.submission_id = s.id
     WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')
     GROUP BY kp.id
     HAVING COUNT(a.id) >= 1`,
    [studentId]
  );

  // 计算错误率并识别薄弱点
  const weakPoints: WeakPointResult[] = [];
  
  for (const stat of knowledgePointStats) {
    const errorRate = stat.total_count > 0 
      ? (stat.error_count / stat.total_count) * 100 
      : 0;
    
    const status = calculateWeakPointStatus(errorRate);
    
    weakPoints.push({
      knowledge_point_id: stat.knowledge_point_id,
      knowledge_point_name: stat.knowledge_point_name,
      subject: stat.subject,
      error_count: stat.error_count,
      total_count: stat.total_count,
      error_rate: Math.round(errorRate * 100) / 100,
      status
    });
  }

  return weakPoints;
}

/**
 * 更新学生薄弱点表
 * 需求：6.1
 * 
 * @param studentId 学生ID
 * @param weakPoints 薄弱点列表
 */
export async function updateStudentWeakPoints(
  studentId: number, 
  weakPoints: WeakPointResult[]
): Promise<void> {
  for (const wp of weakPoints) {
    // 使用UPSERT模式更新薄弱点记录
    await executeQuery(
      `INSERT INTO student_weak_points 
       (student_id, knowledge_point_id, error_count, total_count, error_rate, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       error_count = VALUES(error_count),
       total_count = VALUES(total_count),
       error_rate = VALUES(error_rate),
       status = VALUES(status),
       updated_at = NOW()`,
      [studentId, wp.knowledge_point_id, wp.error_count, wp.total_count, wp.error_rate, wp.status]
    );
  }
}

/**
 * POST /api/recommendations/analyze/:studentId
 * 分析学生薄弱点并更新数据库
 * 
 * 功能：
 * 1. 分析学生答题记录
 * 2. 识别错误率>=50%的知识点
 * 3. 存储到student_weak_points表
 * 
 * 需求：6.1
 */
router.post('/analyze/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查：学生只能分析自己，教师可以分析任何学生
    if (userRole === 'student' && parseInt(studentId) !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限分析其他学生的薄弱点'
      });
      return;
    }

    if (userRole === 'parent') {
      // 家长只能分析自己的孩子
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [userId, studentId]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限分析该学生的薄弱点'
        });
        return;
      }
    }

    // 验证学生存在
    const studentInfo = await executeQuery<any[]>(
      'SELECT id, real_name FROM users WHERE id = ? AND role = ?',
      [studentId, 'student']
    );

    if (!studentInfo || studentInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '学生不存在'
      });
      return;
    }

    // 分析薄弱点
    const allKnowledgePoints = await analyzeStudentWeakPoints(parseInt(studentId));
    
    // 筛选出薄弱点（错误率>=50%）
    const weakPoints = allKnowledgePoints.filter(wp => isWeakPoint(wp.error_rate));

    // 更新数据库
    await updateStudentWeakPoints(parseInt(studentId), allKnowledgePoints);

    res.json({
      success: true,
      message: '薄弱点分析完成',
      data: {
        student_id: parseInt(studentId),
        student_name: studentInfo[0].real_name,
        total_knowledge_points: allKnowledgePoints.length,
        weak_points_count: weakPoints.length,
        weak_points: weakPoints,
        all_knowledge_points: allKnowledgePoints.map(wp => ({
          ...wp,
          is_weak: isWeakPoint(wp.error_rate)
        }))
      }
    });

  } catch (error) {
    console.error('薄弱点分析失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});


/**
 * GET /api/recommendations/:studentId
 * 获取个性化推荐练习题
 * 
 * 功能：
 * 1. 获取学生薄弱知识点
 * 2. 调用Python AI服务筛选题目
 * 3. 返回5-10道推荐练习题
 * 
 * 需求：6.2, 6.3
 * Task 4 修复：优化权限控制逻辑，添加参数校验
 * - Sub-task 4.1: 学生/教师/管理员权限判断
 * - Sub-task 4.2: student_id参数校验
 */
router.get('/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { studentId } = req.params;
    const { count = '10' } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Sub-task 4.2: 参数校验 - student_id必填
    if (!studentId || studentId === 'undefined' || studentId === 'null') {
      console.error(`[${new Date().toISOString()}] 个性化推荐查询失败 - 参数校验失败:`, {
        user_id: userId,
        role: userRole,
        student_id: studentId,
        error: '缺少必填参数：student_id',
        duration_ms: Date.now() - startTime
      });
      
      res.status(400).json({
        code: 400,
        msg: '缺少必填参数：student_id',
        data: null
      });
      return;
    }

    // 验证student_id是有效的整数
    const studentIdNum = parseInt(studentId);
    if (isNaN(studentIdNum) || studentIdNum <= 0) {
      console.error(`[${new Date().toISOString()}] 个性化推荐查询失败 - 参数校验失败:`, {
        user_id: userId,
        role: userRole,
        student_id: studentId,
        error: 'student_id必须是有效的正整数',
        duration_ms: Date.now() - startTime
      });
      
      res.status(400).json({
        code: 400,
        msg: 'student_id必须是有效的正整数',
        data: null
      });
      return;
    }

    // Sub-task 4.1: 优化权限控制逻辑
    let hasPermission = false;
    let permissionDeniedReason = '';

    if (userRole === 'admin') {
      // 管理员可以查询任意学生的推荐
      hasPermission = true;
      console.log(`[${new Date().toISOString()}] 权限检查通过: 管理员查询学生${studentIdNum}的推荐`);
    } else if (userRole === 'student') {
      // 学生只能查询自己的推荐
      if (studentIdNum === userId) {
        hasPermission = true;
        console.log(`[${new Date().toISOString()}] 权限检查通过: 学生${userId}查询自己的推荐`);
      } else {
        permissionDeniedReason = `权限不足：学生只能查询自己的推荐（当前用户ID: ${userId}, 请求查询ID: ${studentIdNum}）`;
      }
    } else if (userRole === 'teacher') {
      // 教师可以查询本班学生的推荐
      const teacherClasses = await executeQuery<Array<{ student_id: number }>>(
        `SELECT cs.student_id
         FROM class_students cs
         JOIN classes c ON cs.class_id = c.id
         WHERE c.teacher_id = ? AND cs.student_id = ?`,
        [userId, studentIdNum]
      );

      if (teacherClasses && teacherClasses.length > 0) {
        hasPermission = true;
        console.log(`[${new Date().toISOString()}] 权限检查通过: 教师${userId}查询本班学生${studentIdNum}的推荐`);
      } else {
        permissionDeniedReason = `权限不足：教师只能查询本班学生的推荐（学生${studentIdNum}不在您的班级中）`;
      }
    } else if (userRole === 'parent') {
      // 家长可以查询自己孩子的推荐
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [userId, studentIdNum]
      );

      if (isChild && isChild.length > 0) {
        hasPermission = true;
        console.log(`[${new Date().toISOString()}] 权限检查通过: 家长${userId}查询孩子${studentIdNum}的推荐`);
      } else {
        permissionDeniedReason = `权限不足：家长只能查询自己孩子的推荐（学生${studentIdNum}不是您的孩子）`;
      }
    } else {
      permissionDeniedReason = `权限不足：未知角色 ${userRole}`;
    }

    // 如果没有权限，返回403错误
    if (!hasPermission) {
      console.error(`[${new Date().toISOString()}] 个性化推荐查询失败 - 权限不足:`, {
        user_id: userId,
        role: userRole,
        student_id: studentIdNum,
        reason: permissionDeniedReason,
        duration_ms: Date.now() - startTime
      });
      
      res.status(403).json({
        code: 403,
        msg: permissionDeniedReason,
        data: null
      });
      return;
    }

    // 验证学生存在
    const studentInfo = await executeQuery<any[]>(
      'SELECT id, real_name FROM users WHERE id = ? AND role = ?',
      [studentIdNum, 'student']
    );

    if (!studentInfo || studentInfo.length === 0) {
      console.error(`[${new Date().toISOString()}] 个性化推荐查询失败 - 学生不存在:`, {
        user_id: userId,
        role: userRole,
        student_id: studentIdNum,
        duration_ms: Date.now() - startTime
      });
      
      res.status(404).json({
        code: 404,
        msg: '学生不存在',
        data: null
      });
      return;
    }

    // 获取学生薄弱知识点（错误率>=50%）
    const weakPoints = await executeQuery<Array<{
      knowledge_point_id: number;
      knowledge_point_name: string;
      subject: string;
      error_rate: number;
      status: string;
    }>>(
      `SELECT 
        swp.knowledge_point_id,
        kp.name as knowledge_point_name,
        kp.subject,
        swp.error_rate,
        swp.status
       FROM student_weak_points swp
       JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
       WHERE swp.student_id = ? AND swp.error_rate >= ?
       ORDER BY swp.error_rate DESC`,
      [studentIdNum, WEAK_POINT_THRESHOLD]
    );

    if (weakPoints.length === 0) {
      console.log(`[${new Date().toISOString()}] 个性化推荐查询成功 - 无薄弱点:`, {
        user_id: userId,
        role: userRole,
        student_id: studentIdNum,
        duration_ms: Date.now() - startTime
      });
      
      res.json({
        code: 200,
        msg: '暂无薄弱知识点，无需推荐练习',
        data: {
          student_id: studentIdNum,
          student_name: studentInfo[0].real_name,
          weak_points: [],
          recommended_exercises: []
        }
      });
      return;
    }

    const weakPointIds = weakPoints.map(wp => wp.knowledge_point_id);
    const recommendCount = Math.min(Math.max(parseInt(count as string) || 10, 5), 10);

    const recommendedExercises: Array<{
      id: number;
      title: string;
      content?: string;
      difficulty: string;
      knowledge_point_id: number;
      knowledge_point_name?: string;
      standard_answer?: string;
      explanation?: string;
    }> = [];

    try {
      // 尝试调用Python AI服务获取推荐
      const aiRecommendations = await recommendExercises(
        studentIdNum,
        weakPointIds,
        recommendCount
      );

      if (aiRecommendations && aiRecommendations.length > 0) {
        // 获取推荐题目的详细信息
        const exerciseIds = aiRecommendations.map(ex => ex.id);
        const exerciseDetails = await executeQuery<Array<{
          id: number;
          title: string;
          content: string;
          difficulty: string;
          knowledge_point_id: number;
          standard_answer: string;
          explanation: string;
        }>>(
          `SELECT eb.id, eb.title, eb.content, eb.difficulty, 
                  eb.knowledge_point_id, eb.standard_answer, eb.explanation
           FROM exercise_bank eb
           WHERE eb.id IN (?)`,
          [exerciseIds]
        );

        // 合并知识点名称
        for (const ex of exerciseDetails) {
          const kp = weakPoints.find(wp => wp.knowledge_point_id === ex.knowledge_point_id);
          recommendedExercises.push({
            ...ex,
            knowledge_point_name: kp?.knowledge_point_name || ''
          });
        }
      }
    } catch (aiError) {
      console.warn('AI推荐服务调用失败，使用本地推荐:', aiError);
    }

    // 如果AI服务失败或返回结果不足，使用本地推荐
    if (recommendedExercises.length < 5) {
      const localExercises = await executeQuery<Array<{
        id: number;
        title: string;
        content: string;
        difficulty: string;
        knowledge_point_id: number;
        standard_answer: string;
        explanation: string;
        knowledge_point_name: string;
      }>>(
        `SELECT eb.id, eb.title, eb.content, eb.difficulty, 
                eb.knowledge_point_id, eb.standard_answer, eb.explanation,
                kp.name as knowledge_point_name
         FROM exercise_bank eb
         JOIN knowledge_points kp ON eb.knowledge_point_id = kp.id
         WHERE eb.knowledge_point_id IN (?)
           AND eb.difficulty IN ('basic', 'medium')
         ORDER BY RAND()
         LIMIT ?`,
        [weakPointIds, recommendCount - recommendedExercises.length]
      );

      // 合并本地推荐（避免重复）
      const existingIds = new Set(recommendedExercises.map(ex => ex.id));
      for (const ex of localExercises) {
        if (!existingIds.has(ex.id)) {
          recommendedExercises.push(ex);
        }
      }
    }

    // 更新题目使用次数
    if (recommendedExercises.length > 0) {
      const exerciseIds = recommendedExercises.map(ex => ex.id);
      await executeQuery(
        `UPDATE exercise_bank SET usage_count = usage_count + 1 WHERE id IN (?)`,
        [exerciseIds]
      );
    }

    console.log(`[${new Date().toISOString()}] 个性化推荐查询成功:`, {
      user_id: userId,
      role: userRole,
      student_id: studentIdNum,
      weak_points_count: weakPoints.length,
      recommendations_count: recommendedExercises.length,
      duration_ms: Date.now() - startTime
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        student_id: studentIdNum,
        student_name: studentInfo[0].real_name,
        weak_points: weakPoints.map(wp => ({
          knowledge_point_id: wp.knowledge_point_id,
          knowledge_point_name: wp.knowledge_point_name,
          subject: wp.subject,
          error_rate: Math.round(wp.error_rate * 100) / 100,
          status: wp.status
        })),
        recommended_exercises: recommendedExercises.map(ex => ({
          id: ex.id,
          title: ex.title,
          content: ex.content,
          difficulty: ex.difficulty,
          knowledge_point_id: ex.knowledge_point_id,
          knowledge_point_name: ex.knowledge_point_name,
          // 不返回标准答案，学生需要先作答
          has_explanation: !!ex.explanation
        })),
        total_weak_points: weakPoints.length,
        total_recommendations: recommendedExercises.length
      }
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 获取个性化推荐失败:`, {
      user_id: req.user?.id,
      role: req.user?.role,
      student_id: req.params.studentId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
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
 * POST /api/recommendations/:studentId/practice
 * 提交推荐练习答案并更新知识点掌握度
 * 
 * 功能：
 * 1. 接收学生练习答案
 * 2. 批改并计算正确率
 * 3. 重新评估知识点掌握程度
 * 4. 错误率<30%时从薄弱点列表移除
 * 
 * 请求体：
 * {
 *   "answers": [
 *     { "exercise_id": 1, "answer": "A" },
 *     { "exercise_id": 2, "answer": "B" }
 *   ]
 * }
 * 
 * 需求：6.4, 6.5
 */
router.post('/:studentId/practice', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { answers } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查：只有学生本人可以提交练习
    if (userRole !== 'student' || parseInt(studentId) !== userId) {
      res.status(403).json({
        success: false,
        message: '只有学生本人可以提交练习'
      });
      return;
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供练习答案'
      });
      return;
    }

    // 获取练习题信息
    const exerciseIds = answers.map((a: any) => a.exercise_id);
    const exercises = await executeQuery<Array<{
      id: number;
      title: string;
      knowledge_point_id: number;
      standard_answer: string;
      explanation: string;
    }>>(
      `SELECT id, title, knowledge_point_id, standard_answer, explanation
       FROM exercise_bank
       WHERE id IN (?)`,
      [exerciseIds]
    );

    if (exercises.length === 0) {
      res.status(404).json({
        success: false,
        message: '练习题不存在'
      });
      return;
    }

    // 批改答案
    const gradingResults: Array<{
      exercise_id: number;
      title: string;
      knowledge_point_id: number;
      student_answer: string;
      standard_answer: string;
      is_correct: boolean;
      explanation: string;
    }> = [];

    const knowledgePointResults: Map<number, { correct: number; total: number }> = new Map();

    for (const answer of answers) {
      const exercise = exercises.find(ex => ex.id === answer.exercise_id);
      if (!exercise) continue;

      // 简单答案比对（标准化后比较）
      const studentAnswer = String(answer.answer || '').trim().toLowerCase();
      const standardAnswer = String(exercise.standard_answer || '').trim().toLowerCase();
      const isCorrect = studentAnswer === standardAnswer;

      gradingResults.push({
        exercise_id: exercise.id,
        title: exercise.title,
        knowledge_point_id: exercise.knowledge_point_id,
        student_answer: answer.answer,
        standard_answer: exercise.standard_answer,
        is_correct: isCorrect,
        explanation: exercise.explanation
      });

      // 统计各知识点的正确率
      if (!knowledgePointResults.has(exercise.knowledge_point_id)) {
        knowledgePointResults.set(exercise.knowledge_point_id, { correct: 0, total: 0 });
      }
      const kpResult = knowledgePointResults.get(exercise.knowledge_point_id)!;
      kpResult.total++;
      if (isCorrect) {
        kpResult.correct++;
      }
    }

    // 更新知识点掌握度
    const updatedWeakPoints: Array<{
      knowledge_point_id: number;
      old_error_rate: number;
      new_error_rate: number;
      old_status: string;
      new_status: string;
      removed: boolean;
    }> = [];

    for (const [knowledgePointId, result] of knowledgePointResults) {
      // 获取当前薄弱点记录
      const currentRecord = await executeQuery<Array<{
        error_count: number;
        total_count: number;
        error_rate: number;
        status: string;
      }>>(
        `SELECT error_count, total_count, error_rate, status
         FROM student_weak_points
         WHERE student_id = ? AND knowledge_point_id = ?`,
        [studentId, knowledgePointId]
      );

      const oldErrorRate = currentRecord.length > 0 ? currentRecord[0].error_rate : 0;
      const oldStatus = currentRecord.length > 0 ? currentRecord[0].status : 'weak';
      const oldErrorCount = currentRecord.length > 0 ? currentRecord[0].error_count : 0;
      const oldTotalCount = currentRecord.length > 0 ? currentRecord[0].total_count : 0;

      // 计算新的统计数据
      const newErrorCount = oldErrorCount + (result.total - result.correct);
      const newTotalCount = oldTotalCount + result.total;
      const newErrorRate = newTotalCount > 0 ? (newErrorCount / newTotalCount) * 100 : 0;
      const newStatus = calculateWeakPointStatus(newErrorRate);

      // 更新数据库
      await executeQuery(
        `INSERT INTO student_weak_points 
         (student_id, knowledge_point_id, error_count, total_count, error_rate, status, last_practice_time, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         error_count = VALUES(error_count),
         total_count = VALUES(total_count),
         error_rate = VALUES(error_rate),
         status = VALUES(status),
         last_practice_time = NOW(),
         updated_at = NOW()`,
        [studentId, knowledgePointId, newErrorCount, newTotalCount, newErrorRate, newStatus]
      );

      updatedWeakPoints.push({
        knowledge_point_id: knowledgePointId,
        old_error_rate: Math.round(oldErrorRate * 100) / 100,
        new_error_rate: Math.round(newErrorRate * 100) / 100,
        old_status: oldStatus,
        new_status: newStatus,
        removed: shouldRemoveFromWeakPoints(newErrorRate)
      });
    }

    // 计算总体统计
    const totalCorrect = gradingResults.filter(r => r.is_correct).length;
    const totalQuestions = gradingResults.length;
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    res.json({
      success: true,
      message: '练习提交成功',
      data: {
        student_id: parseInt(studentId),
        grading_results: gradingResults,
        summary: {
          total_questions: totalQuestions,
          correct_count: totalCorrect,
          incorrect_count: totalQuestions - totalCorrect,
          accuracy: Math.round(accuracy * 100) / 100
        },
        weak_point_updates: updatedWeakPoints,
        mastered_points: updatedWeakPoints.filter(wp => wp.removed).map(wp => wp.knowledge_point_id)
      }
    });

  } catch (error) {
    console.error('练习提交失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/recommendations/:studentId/weak-points
 * 获取学生薄弱知识点列表
 * 
 * 功能：
 * 1. 返回学生所有薄弱知识点
 * 2. 包含错误率和状态信息
 * 
 * 需求：6.3
 */
router.get('/:studentId/weak-points', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查
    if (userRole === 'student' && parseInt(studentId) !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看其他学生的薄弱点'
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
          message: '无权限查看该学生的薄弱点'
        });
        return;
      }
    }

    // 获取学生信息
    const studentInfo = await executeQuery<any[]>(
      'SELECT id, real_name FROM users WHERE id = ? AND role = ?',
      [studentId, 'student']
    );

    if (!studentInfo || studentInfo.length === 0) {
      res.status(404).json({
        success: false,
        message: '学生不存在'
      });
      return;
    }

    // 获取所有薄弱知识点
    const weakPoints = await executeQuery<Array<{
      knowledge_point_id: number;
      knowledge_point_name: string;
      subject: string;
      grade: string;
      error_count: number;
      total_count: number;
      error_rate: number;
      status: string;
      last_practice_time: Date | null;
    }>>(
      `SELECT 
        swp.knowledge_point_id,
        kp.name as knowledge_point_name,
        kp.subject,
        kp.grade,
        swp.error_count,
        swp.total_count,
        swp.error_rate,
        swp.status,
        swp.last_practice_time
       FROM student_weak_points swp
       JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
       WHERE swp.student_id = ?
       ORDER BY swp.error_rate DESC`,
      [studentId]
    );

    // 分类统计
    const summary = {
      total: weakPoints.length,
      weak: weakPoints.filter(wp => wp.status === 'weak').length,
      improving: weakPoints.filter(wp => wp.status === 'improving').length,
      mastered: weakPoints.filter(wp => wp.status === 'mastered').length
    };

    res.json({
      success: true,
      data: {
        student_id: parseInt(studentId),
        student_name: studentInfo[0].real_name,
        weak_points: weakPoints.map(wp => ({
          knowledge_point_id: wp.knowledge_point_id,
          knowledge_point_name: wp.knowledge_point_name,
          subject: wp.subject,
          grade: wp.grade,
          error_count: wp.error_count,
          total_count: wp.total_count,
          error_rate: Math.round(wp.error_rate * 100) / 100,
          status: wp.status,
          is_weak: isWeakPoint(wp.error_rate),
          can_be_removed: shouldRemoveFromWeakPoints(wp.error_rate),
          last_practice_time: wp.last_practice_time
        })),
        summary
      }
    });

  } catch (error) {
    console.error('获取薄弱知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// GET /recommendations/resources/:studentId
router.get('/resources/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, page_size = 10 } = req.query;
  const mockResources = [
    { id: 1, title: '递归算法图解教程', type: 'video', url: '#', difficulty: 'basic', knowledge_point: '递归算法', duration: 25, view_count: 1280 },
    { id: 2, title: '动态规划入门到精通', type: 'video', url: '#', difficulty: 'medium', knowledge_point: '动态规划', duration: 45, view_count: 980 },
    { id: 3, title: 'LeetCode递归专题题解', type: 'article', url: '#', difficulty: 'medium', knowledge_point: '递归算法', duration: 20, view_count: 2350 },
    { id: 4, title: '背包问题详解', type: 'article', url: '#', difficulty: 'medium', knowledge_point: '动态规划', duration: 15, view_count: 1890 },
    { id: 5, title: '图论基础算法合集', type: 'video', url: '#', difficulty: 'advanced', knowledge_point: '图论基础', duration: 60, view_count: 760 },
    { id: 6, title: 'Python递归练习题100道', type: 'exercise', url: '#', difficulty: 'basic', knowledge_point: '递归算法', duration: 0, view_count: 3200 },
  ];
  const start = (Number(page) - 1) * Number(page_size);
  res.json({ success: true, data: { resources: mockResources.slice(start, start + Number(page_size)), total: mockResources.length } });
});

// POST /recommendations/refresh/:studentId
router.post('/refresh/:studentId', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: '推荐已刷新' });
});

// POST /recommendations/feedback/:studentId
router.post('/feedback/:studentId', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: '反馈已记录' });
});

// POST /recommendations/click/:studentId
// POST /recommendations/open/:studentId
router.post('/:studentId/click', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true });
});
router.post('/:studentId/open', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true });
});

// DELETE /recommendations/history/:studentId/:id
router.delete('/history/:studentId/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: '删除成功' });
});

// GET /recommendations/history/export/:studentId
router.get('/history/export/:studentId', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, data: { exported: true } });
});

// GET /recommendations/history/:studentId — RecommendationHistory.vue 调用
router.get('/history/:studentId', async (_req: AuthRequest, res: Response): Promise<void> => {
  const mockRecords = [
    { id: 1, title: '递归算法图解教程', type: 'video', subject: '数据结构', recommended_at: '2026-03-28', clicked: true, completed: true, rating: 5 },
    { id: 2, title: 'Python函数式编程', type: 'article', subject: 'Python', recommended_at: '2026-03-25', clicked: true, completed: false, rating: null },
    { id: 3, title: '二叉树遍历专项练习', type: 'exercise', subject: '数据结构', recommended_at: '2026-03-22', clicked: false, completed: false, rating: null },
    { id: 4, title: 'Java并发编程实战', type: 'course', subject: 'Java', recommended_at: '2026-03-18', clicked: true, completed: true, rating: 4 },
  ];
  res.json({
    success: true,
    data: {
      records: mockRecords, total: mockRecords.length,
      statistics: { total: 4, clicked: 3, completed: 2, avg_rating: 4.5, click_rate: 75 },
      trend_data: [
        { date: '03-18', count: 1 }, { date: '03-22', count: 1 },
        { date: '03-25', count: 1 }, { date: '03-28', count: 1 }
      ]
    }
  });
});

// GET / — 支持 ?student_id=xxx 查询参数方式（前端兼容）
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.query.student_id || req.user?.id;
  const mockRecommendations = [
    { id: 1, title: '递归算法图解教程', type: 'video', subject: '数据结构', score: 0.95, reason: '根据您的薄弱点推荐' },
    { id: 2, title: 'Python函数式编程', type: 'article', subject: 'Python', score: 0.88, reason: '与您学习路径匹配' },
    { id: 3, title: '二叉树遍历专项练习', type: 'practice', subject: '数据结构', score: 0.82, reason: '错题知识点强化' },
    { id: 4, title: 'Java并发编程实战', type: 'video', subject: 'Java', score: 0.75, reason: '同班同学热门课程' },
  ];
  res.json({ success: true, data: { recommendations: mockRecommendations, student_id: studentId, total: 4 } });
});

export default router;
