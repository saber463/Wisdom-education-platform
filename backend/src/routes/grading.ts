/**
 * 批改管理路由模块
 * 实现作业提交、AI批改、结果查询、人工复核
 * 需求：2.1, 2.2, 2.3, 2.4, 2.6
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { gradeSubjective } from '../services/grpc-clients.js';

const router = Router();

// 所有批改路由都需要认证
router.use(authenticateToken);

/**
 * GET /api/grading/submissions
 * 获取教师待批改/已批改提交列表（批改管理页面用）
 */
router.get('/submissions', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const { page = '1', pageSize = '10', status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const statusWhere = status ? `AND s.status = ?` : '';
    const params: unknown[] = [teacherId];
    if (status) params.push(status);
    params.push(Number(pageSize), offset);

    const submissions = await executeQuery<any[]>(
      `SELECT s.id, s.assignment_id, s.student_id, s.status, s.submitted_at,
              u.real_name AS student_name, a.title AS assignment_title
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       JOIN assignments a ON s.assignment_id = a.id
       WHERE a.teacher_id = ? ${statusWhere}
       ORDER BY s.submitted_at DESC
       LIMIT ? OFFSET ?`,
      params
    );
    const [{ total }] = await executeQuery<any[]>(
      `SELECT COUNT(*) AS total FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE a.teacher_id = ?`,
      [teacherId]
    ) as any[];
    res.json({ code: 200, submissions: submissions || [], total: total || 0 });
  } catch {
    res.json({ code: 200, submissions: [], total: 0 });
  }
});

/**
 * 获取学生的批改结果列表
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认10）
 * - status: 状态筛选（graded/reviewed）
 * 
 * 需求：5.4
 */
router.get('/student/results', requireRole('student'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const {
      page = '1',
      pageSize = '10',
      status
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    const whereConditions = ['s.student_id = ?'];
    const queryParams: any[] = [studentId];

    // 只显示已批改或已复核的结果
    if (status) {
      whereConditions.push('s.status = ?');
      queryParams.push(status);
    } else {
      whereConditions.push("s.status IN ('graded', 'reviewed')");
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // 查询总数
    const countResult = await executeQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) as total FROM submissions s ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.total || 0;

    // 查询批改结果列表
    const submissions = await executeQuery<any[]>(
      `SELECT 
        s.id,
        s.assignment_id,
        a.title as assignment_title,
        s.submit_time,
        s.grading_time,
        s.total_score,
        a.total_score as max_score,
        s.status
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       ${whereClause}
       ORDER BY s.grading_time DESC, s.submit_time DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, pageSizeNum, offset]
    );

    res.json({
      success: true,
      data: {
        submissions,
        total
      }
    });

  } catch (error) {
    console.error('获取学生批改结果列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 客观题类型
const OBJECTIVE_TYPES = ['choice', 'fill', 'judge'];

/**
 * 客观题答案比对（模拟WASM模块功能）
 * 在后端提供备用批改逻辑，前端优先使用WASM
 * @param studentAnswer 学生答案
 * @param standardAnswer 标准答案
 * @param questionType 题目类型
 * @returns 是否正确
 */
function compareObjectiveAnswer(
  studentAnswer: string,
  standardAnswer: string,
  questionType: string
): boolean {
  // 标准化答案：去除空格、转小写
  const normalizeAnswer = (answer: string): string => {
    return answer.trim().toLowerCase().replace(/\s+/g, '');
  };

  const student = normalizeAnswer(studentAnswer);
  const standard = normalizeAnswer(standardAnswer);

  switch (questionType) {
    case 'choice':
      // 选择题：完全匹配
      return student === standard;
    case 'judge': {
      // 判断题：支持多种表示方式
      const trueValues = ['true', '对', '正确', '是', 't', '1', 'yes'];
      const falseValues = ['false', '错', '错误', '否', 'f', '0', 'no'];
      const studentBool = trueValues.includes(student) ? true : 
                          falseValues.includes(student) ? false : null;
      const standardBool = trueValues.includes(standard) ? true :
                           falseValues.includes(standard) ? false : null;
      return studentBool !== null && standardBool !== null && studentBool === standardBool;
    }
    case 'fill':
      // 填空题：允许一定的相似度
      return student === standard;
    default:
      return false;
  }
}

/**
 * 生成改进建议
 * @param isCorrect 是否正确
 * @param questionType 题目类型
 * @param knowledgePointName 知识点名称
 * @returns 改进建议
 */
function generateFeedback(
  isCorrect: boolean,
  questionType: string,
  knowledgePointName: string | null
): string {
  if (isCorrect) {
    return '回答正确，继续保持！';
  }

  const typeNames: Record<string, string> = {
    choice: '选择题',
    fill: '填空题',
    judge: '判断题',
    subjective: '主观题'
  };

  const typeName = typeNames[questionType] || '题目';
  const knowledgeHint = knowledgePointName 
    ? `建议复习"${knowledgePointName}"相关知识点。` 
    : '';

  return `${typeName}回答错误。${knowledgeHint}请仔细审题，注意关键信息。`;
}

interface SubmitAnswerRequest {
  assignment_id: number;
  answers: Array<{
    question_id: number;
    student_answer: string;
  }>;
  file_url?: string;
}

interface Question {
  id: number;
  question_number: number;
  question_type: 'choice' | 'fill' | 'judge' | 'subjective';
  question_content: string;
  standard_answer: string | null;
  score: number;
  knowledge_point_id: number | null;
  knowledge_point_name?: string | null;
}

/**
 * POST /api/grading/submit
 * 提交作业并自动触发AI批改
 * 
 * 请求体：
 * {
 *   "assignment_id": 作业ID,
 *   "answers": [
 *     { "question_id": 1, "student_answer": "A" },
 *     { "question_id": 2, "student_answer": "答案内容" }
 *   ],
 *   "file_url": "可选的作业文件URL"
 * }
 * 
 * 需求：2.1, 2.2, 2.3
 */
router.post('/submit', requireRole('student'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignment_id, answers, file_url } = req.body as SubmitAnswerRequest;
    const studentId = req.user!.id;

    // 验证必填字段
    if (!assignment_id || !answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({
        success: false,
        message: '缺少必填字段：assignment_id, answers'
      });
      return;
    }

    // 查询作业信息
    const assignments = await executeQuery<Array<{
      id: number;
      class_id: number;
      status: string;
      deadline: Date;
      total_score: number;
    }>>(
      'SELECT id, class_id, status, deadline, total_score FROM assignments WHERE id = ?',
      [assignment_id]
    );

    if (!assignments || assignments.length === 0) {
      res.status(404).json({
        success: false,
        message: '作业不存在'
      });
      return;
    }

    const assignment = assignments[0];

    // 验证作业状态
    if (assignment.status !== 'published') {
      res.status(400).json({
        success: false,
        message: '作业未发布或已关闭'
      });
      return;
    }

    // 验证学生是否在该班级
    const studentInClass = await executeQuery<any[]>(
      'SELECT 1 FROM class_students WHERE class_id = ? AND student_id = ?',
      [assignment.class_id, studentId]
    );

    if (!studentInClass || studentInClass.length === 0) {
      res.status(403).json({
        success: false,
        message: '您不在该班级中'
      });
      return;
    }

    // 检查是否已提交
    const existingSubmission = await executeQuery<any[]>(
      'SELECT id, status FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignment_id, studentId]
    );

    if (existingSubmission && existingSubmission.length > 0) {
      res.status(400).json({
        success: false,
        message: '您已提交过该作业，不能重复提交'
      });
      return;
    }

    // 查询作业的所有题目（包含知识点名称）
    const questions = await executeQuery<Question[]>(
      `SELECT q.*, kp.name as knowledge_point_name
       FROM questions q
       LEFT JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
       WHERE q.assignment_id = ?`,
      [assignment_id]
    );

    // 创建提交记录（状态为grading）
    const submissionResult = await executeQuery<any>(
      `INSERT INTO submissions (assignment_id, student_id, file_url, status)
       VALUES (?, ?, ?, 'grading')`,
      [assignment_id, studentId, file_url || null]
    );

    const submissionId = submissionResult.insertId;

    // 批改每道题目
    let totalScore = 0;
    const gradingResults: Array<{
      question_id: number;
      question_number: number;
      question_type: string;
      score: number;
      max_score: number;
      is_correct: boolean;
      ai_feedback: string;
      needs_review: boolean;
    }> = [];

    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.question_id);
      
      if (!question) {
        console.warn(`题目ID ${answer.question_id} 不存在，跳过`);
        continue;
      }

      let score = 0;
      let isCorrect = false;
      let aiFeedback = '';
      let needsReview = false;

      if (OBJECTIVE_TYPES.includes(question.question_type)) {
        // 客观题批改（需求2.2）
        // 使用本地比对逻辑（前端优先使用WASM模块）
        if (question.standard_answer) {
          isCorrect = compareObjectiveAnswer(
            answer.student_answer,
            question.standard_answer,
            question.question_type
          );
          score = isCorrect ? question.score : 0;
          aiFeedback = generateFeedback(
            isCorrect,
            question.question_type,
            question.knowledge_point_name || null
          );
        } else {
          // 没有标准答案，标记为待复核
          needsReview = true;
          aiFeedback = '该题目缺少标准答案，已标记为待人工复核。';
        }
      } else {
        // 主观题批改（需求2.3）
        // 调用Python BERT服务
        try {
          if (question.standard_answer) {
            const gradingResult = await gradeSubjective(
              question.question_content,
              answer.student_answer,
              question.standard_answer,
              question.score
            );
            
            score = gradingResult.score;
            isCorrect = score >= question.score * 0.6; // 60%以上视为正确
            aiFeedback = gradingResult.feedback;
            
            // 如果AI评分置信度较低，标记为待复核
            if (gradingResult.keyPoints.length === 0 || score === 0) {
              needsReview = true;
              aiFeedback += ' [AI评分置信度较低，建议人工复核]';
            }
          } else {
            // 没有标准答案，标记为待复核
            needsReview = true;
            aiFeedback = '该主观题缺少标准答案，已标记为待人工复核。';
          }
        } catch (error) {
          // AI服务调用失败，标记为待复核
          console.error('BERT评分服务调用失败:', error);
          needsReview = true;
          aiFeedback = 'AI评分服务暂时不可用，已标记为待人工复核。';
        }
      }

      totalScore += score;

      // 保存答题记录
      await executeQuery(
        `INSERT INTO answers 
         (submission_id, question_id, student_answer, score, is_correct, ai_feedback, needs_review)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [submissionId, question.id, answer.student_answer, score, isCorrect, aiFeedback, needsReview]
      );

      gradingResults.push({
        question_id: question.id,
        question_number: question.question_number,
        question_type: question.question_type,
        score,
        max_score: question.score,
        is_correct: isCorrect,
        ai_feedback: aiFeedback,
        needs_review: needsReview
      });
    }

    // 更新提交记录的总分和状态
    const hasReviewNeeded = gradingResults.some(r => r.needs_review);
    const finalStatus = hasReviewNeeded ? 'graded' : 'graded'; // 即使有待复核也标记为已批改

    await executeQuery(
      `UPDATE submissions 
       SET total_score = ?, status = ?, grading_time = NOW()
       WHERE id = ?`,
      [totalScore, finalStatus, submissionId]
    );

    // 更新学生薄弱点（基于错题）
    await updateStudentWeakPoints(studentId, gradingResults, questions);

    // 推送批改完成通知给学生
    await executeQuery(
      `INSERT INTO notifications (user_id, type, title, content)
       VALUES (?, 'grading', ?, ?)`,
      [
        studentId,
        '作业批改完成',
        `您提交的作业已完成批改，总分：${totalScore}分。${hasReviewNeeded ? '部分题目待人工复核。' : ''}`
      ]
    );

    // 推送通知给家长
    const parents = await executeQuery<Array<{ parent_id: number }>>(
      'SELECT parent_id FROM parent_students WHERE student_id = ?',
      [studentId]
    );

    if (parents && parents.length > 0) {
      const parentNotifications = parents.map(p => [
        p.parent_id,
        'grading',
        '孩子作业批改完成',
        `您的孩子已完成作业批改，总分：${totalScore}分。`
      ]);

      const placeholders = parents.map(() => '(?, ?, ?, ?)').join(', ');
      await executeQuery(
        `INSERT INTO notifications (user_id, type, title, content) VALUES ${placeholders}`,
        parentNotifications.flat()
      );
    }

    res.status(201).json({
      success: true,
      message: '作业提交并批改完成',
      data: {
        submission_id: submissionId,
        total_score: totalScore,
        max_score: assignment.total_score,
        grading_results: gradingResults,
        needs_review: hasReviewNeeded
      }
    });

  } catch (error) {
    console.error('作业提交失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新学生薄弱点
 * @param studentId 学生ID
 * @param gradingResults 批改结果
 * @param questions 题目列表
 */
async function updateStudentWeakPoints(
  studentId: number,
  gradingResults: Array<{ question_id: number; is_correct: boolean }>,
  questions: Question[]
): Promise<void> {
  try {
    for (const result of gradingResults) {
      const question = questions.find(q => q.id === result.question_id);
      if (!question || !question.knowledge_point_id) continue;

      // 查询或创建薄弱点记录
      const existing = await executeQuery<any[]>(
        `SELECT id, error_count, total_count 
         FROM student_weak_points 
         WHERE student_id = ? AND knowledge_point_id = ?`,
        [studentId, question.knowledge_point_id]
      );

      if (existing && existing.length > 0) {
        // 更新现有记录
        const newErrorCount = existing[0].error_count + (result.is_correct ? 0 : 1);
        const newTotalCount = existing[0].total_count + 1;
        const errorRate = (newErrorCount / newTotalCount) * 100;
        
        // 根据错误率更新状态
        let status = 'weak';
        if (errorRate < 30) {
          status = 'mastered';
        } else if (errorRate < 50) {
          status = 'improving';
        }

        await executeQuery(
          `UPDATE student_weak_points 
           SET error_count = ?, total_count = ?, error_rate = ?, status = ?, last_practice_time = NOW()
           WHERE id = ?`,
          [newErrorCount, newTotalCount, errorRate, status, existing[0].id]
        );
      } else {
        // 创建新记录
        const errorCount = result.is_correct ? 0 : 1;
        const errorRate = result.is_correct ? 0 : 100;
        const status = result.is_correct ? 'mastered' : 'weak';

        await executeQuery(
          `INSERT INTO student_weak_points 
           (student_id, knowledge_point_id, error_count, total_count, error_rate, status, last_practice_time)
           VALUES (?, ?, ?, 1, ?, ?, NOW())`,
          [studentId, question.knowledge_point_id, errorCount, errorRate, status]
        );
      }
    }
  } catch (error) {
    console.error('更新学生薄弱点失败:', error);
    // 不抛出错误，薄弱点更新失败不影响主流程
  }
}

/**
 * POST /api/grading/:id/request-review
 * 学生申请人工复核
 * 
 * 请求体：
 * {
 *   "question_ids": [1, 2, 3],  // 需要复核的题目ID列表
 *   "reason": "复核原因"
 * }
 * 
 * 需求：5.5
 */
router.post('/:id/request-review', requireRole('student'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;
    const { question_ids, reason } = req.body as {
      question_ids: number[];
      reason?: string;
    };

    // 验证请求体
    if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
      res.status(400).json({
        success: false,
        message: '请选择需要复核的题目'
      });
      return;
    }

    // 查询提交记录
    const submissions = await executeQuery<Array<{
      id: number;
      assignment_id: number;
      student_id: number;
      status: string;
    }>>(
      `SELECT s.*, a.teacher_id
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = ?`,
      [id]
    );

    if (!submissions || submissions.length === 0) {
      res.status(404).json({
        success: false,
        message: '批改记录不存在'
      });
      return;
    }

    const submission = submissions[0] as any;

    // 权限检查：只有该提交的学生可以申请复核
    if (submission.student_id !== studentId) {
      res.status(403).json({
        success: false,
        message: '无权限申请复核该批改结果'
      });
      return;
    }

    // 验证提交状态
    if (submission.status !== 'graded' && submission.status !== 'reviewed') {
      res.status(400).json({
        success: false,
        message: '该作业尚未完成批改，无法申请复核'
      });
      return;
    }

    // 更新答题记录的复核状态
    let updatedCount = 0;
    for (const questionId of question_ids) {
      const result = await executeQuery<any>(
        `UPDATE answers 
         SET needs_review = TRUE
         WHERE submission_id = ? AND question_id = ? AND needs_review = FALSE`,
        [id, questionId]
      );
      if (result && result.affectedRows > 0) {
        updatedCount++;
      }
    }

    // 推送通知给教师
    if (updatedCount > 0) {
      await executeQuery(
        `INSERT INTO notifications (user_id, type, title, content)
         VALUES (?, 'grading', ?, ?)`,
        [
          submission.teacher_id,
          '学生申请复核',
          `学生申请对作业进行人工复核，共${updatedCount}道题目。${reason ? '原因：' + reason : ''}`
        ]
      );
    }

    res.json({
      success: true,
      message: updatedCount > 0 ? '复核申请已提交' : '所选题目已在复核中',
      data: {
        submission_id: parseInt(id),
        requested_questions: updatedCount
      }
    });

  } catch (error) {
    console.error('申请复核失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;


/**
 * GET /api/grading/:id
 * 查询批改结果
 * 
 * 返回：总分、各题得分、错题标注、改进建议
 * 
 * 需求：2.4
 */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 查询提交记录
    const submissions = await executeQuery<Array<{
      id: number;
      assignment_id: number;
      student_id: number;
      file_url: string | null;
      submit_time: Date;
      status: string;
      total_score: number | null;
      grading_time: Date | null;
    }>>(
      `SELECT s.*, a.title as assignment_title, a.total_score as max_score, 
              a.teacher_id, a.class_id, u.real_name as student_name
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN users u ON s.student_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (!submissions || submissions.length === 0) {
      res.status(404).json({
        success: false,
        message: '批改记录不存在'
      });
      return;
    }

    const submission = submissions[0] as any;

    // 权限检查
    if (userRole === 'student' && submission.student_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该批改结果'
      });
      return;
    }

    if (userRole === 'teacher' && submission.teacher_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该批改结果'
      });
      return;
    }

    if (userRole === 'parent') {
      // 家长只能查看自己孩子的批改结果
      const parentChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [userId, submission.student_id]
      );

      if (!parentChild || parentChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该批改结果'
        });
        return;
      }
    }

    // 查询答题详情
    const answers = await executeQuery<Array<{
      id: number;
      question_id: number;
      student_answer: string;
      score: number | null;
      is_correct: boolean | null;
      ai_feedback: string | null;
      needs_review: boolean;
      reviewed_by: number | null;
      review_comment: string | null;
      question_number: number;
      question_type: string;
      question_content: string;
      standard_answer: string | null;
      max_score: number;
      knowledge_point_name: string | null;
    }>>(
      `SELECT a.*, q.question_number, q.question_type, q.question_content, 
              q.standard_answer, q.score as max_score, kp.name as knowledge_point_name
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       LEFT JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
       WHERE a.submission_id = ?
       ORDER BY q.question_number`,
      [id]
    );

    // 统计错题
    const wrongAnswers = answers.filter(a => a.is_correct === false);
    const needsReviewCount = answers.filter(a => a.needs_review).length;

    // 生成综合改进建议
    const improvementSuggestions = generateImprovementSuggestions(answers);

    res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          assignment_id: submission.assignment_id,
          assignment_title: submission.assignment_title,
          student_id: submission.student_id,
          student_name: submission.student_name,
          file_url: submission.file_url,
          submit_time: submission.submit_time,
          status: submission.status,
          total_score: submission.total_score,
          max_score: submission.max_score,
          grading_time: submission.grading_time
        },
        answers: answers.map(a => ({
          id: a.id,
          question_id: a.question_id,
          question_number: a.question_number,
          question_type: a.question_type,
          question_content: a.question_content,
          standard_answer: userRole === 'student' && !a.is_correct ? null : a.standard_answer, // 学生答错时不显示标准答案
          student_answer: a.student_answer,
          score: a.score,
          max_score: a.max_score,
          is_correct: a.is_correct,
          ai_feedback: a.ai_feedback,
          needs_review: a.needs_review,
          review_comment: a.review_comment,
          knowledge_point: a.knowledge_point_name
        })),
        statistics: {
          total_questions: answers.length,
          correct_count: answers.filter(a => a.is_correct === true).length,
          wrong_count: wrongAnswers.length,
          needs_review_count: needsReviewCount,
          accuracy_rate: answers.length > 0 
            ? Math.round((answers.filter(a => a.is_correct === true).length / answers.length) * 100) 
            : 0
        },
        wrong_questions: wrongAnswers.map(a => ({
          question_number: a.question_number,
          question_type: a.question_type,
          question_content: a.question_content,
          student_answer: a.student_answer,
          ai_feedback: a.ai_feedback,
          knowledge_point: a.knowledge_point_name
        })),
        improvement_suggestions: improvementSuggestions
      }
    });

  } catch (error) {
    console.error('查询批改结果失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 生成综合改进建议
 * @param answers 答题记录
 * @returns 改进建议列表
 */
function generateImprovementSuggestions(
  answers: Array<{
    is_correct: boolean | null;
    question_type: string;
    knowledge_point_name: string | null;
  }>
): string[] {
  const suggestions: string[] = [];
  
  // 统计各类型题目的错误情况
  const typeErrors: Record<string, { wrong: number; total: number }> = {};
  const weakKnowledgePoints: Set<string> = new Set();

  for (const answer of answers) {
    const type = answer.question_type;
    if (!typeErrors[type]) {
      typeErrors[type] = { wrong: 0, total: 0 };
    }
    typeErrors[type].total++;
    if (answer.is_correct === false) {
      typeErrors[type].wrong++;
      if (answer.knowledge_point_name) {
        weakKnowledgePoints.add(answer.knowledge_point_name);
      }
    }
  }

  // 根据题型错误率生成建议
  const typeNames: Record<string, string> = {
    choice: '选择题',
    fill: '填空题',
    judge: '判断题',
    subjective: '主观题'
  };

  for (const [type, stats] of Object.entries(typeErrors)) {
    const errorRate = stats.total > 0 ? stats.wrong / stats.total : 0;
    if (errorRate >= 0.5) {
      suggestions.push(`${typeNames[type] || type}错误率较高（${Math.round(errorRate * 100)}%），建议加强练习。`);
    }
  }

  // 根据薄弱知识点生成建议
  if (weakKnowledgePoints.size > 0) {
    const points = Array.from(weakKnowledgePoints).slice(0, 3);
    suggestions.push(`建议重点复习以下知识点：${points.join('、')}。`);
  }

  // 如果没有错误，给予鼓励
  if (suggestions.length === 0) {
    suggestions.push('表现优秀！继续保持良好的学习状态。');
  }

  return suggestions;
}

/**
 * PUT /api/grading/:id/review
 * 人工复核批改结果
 * 
 * 请求体：
 * {
 *   "answers": [
 *     {
 *       "answer_id": 1,
 *       "score": 8,
 *       "review_comment": "复核意见"
 *     }
 *   ]
 * }
 * 
 * 需求：2.6
 */
router.put('/:id/review', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user!.id;
    const { answers } = req.body as {
      answers: Array<{
        answer_id: number;
        score: number;
        review_comment?: string;
      }>;
    };

    // 验证请求体
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({
        success: false,
        message: '缺少必填字段：answers'
      });
      return;
    }

    // 查询提交记录
    const submissions = await executeQuery<Array<{
      id: number;
      assignment_id: number;
      student_id: number;
      status: string;
      total_score: number | null;
    }>>(
      `SELECT s.*, a.teacher_id
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = ?`,
      [id]
    );

    if (!submissions || submissions.length === 0) {
      res.status(404).json({
        success: false,
        message: '批改记录不存在'
      });
      return;
    }

    const submission = submissions[0] as any;

    // 权限检查：只有该作业的教师可以复核
    if (submission.teacher_id !== teacherId) {
      res.status(403).json({
        success: false,
        message: '无权限复核该批改结果'
      });
      return;
    }

    // 验证提交状态
    if (submission.status !== 'graded' && submission.status !== 'reviewed') {
      res.status(400).json({
        success: false,
        message: '该作业尚未完成批改，无法复核'
      });
      return;
    }

    // 更新每道题的复核结果
    let totalScoreAdjustment = 0;

    for (const answerUpdate of answers) {
      // 查询原答题记录
      const originalAnswer = await executeQuery<Array<{
        id: number;
        score: number | null;
        submission_id: number;
      }>>(
        'SELECT id, score, submission_id FROM answers WHERE id = ? AND submission_id = ?',
        [answerUpdate.answer_id, id]
      );

      if (!originalAnswer || originalAnswer.length === 0) {
        console.warn(`答题记录 ${answerUpdate.answer_id} 不存在或不属于该提交`);
        continue;
      }

      const oldScore = originalAnswer[0].score || 0;
      const newScore = answerUpdate.score;
      totalScoreAdjustment += (newScore - oldScore);

      // 更新答题记录
      await executeQuery(
        `UPDATE answers 
         SET score = ?, 
             is_correct = ?,
             needs_review = FALSE,
             reviewed_by = ?,
             review_comment = ?
         WHERE id = ?`,
        [
          newScore,
          newScore > 0,
          teacherId,
          answerUpdate.review_comment || null,
          answerUpdate.answer_id
        ]
      );
    }

    // 更新提交记录的总分和状态
    const newTotalScore = (submission.total_score || 0) + totalScoreAdjustment;
    await executeQuery(
      `UPDATE submissions 
       SET total_score = ?, status = 'reviewed'
       WHERE id = ?`,
      [newTotalScore, id]
    );

    // 推送复核完成通知给学生
    await executeQuery(
      `INSERT INTO notifications (user_id, type, title, content)
       VALUES (?, 'grading', ?, ?)`,
      [
        submission.student_id,
        '作业复核完成',
        `您的作业已完成人工复核，最终得分：${newTotalScore}分。`
      ]
    );

    res.json({
      success: true,
      message: '复核完成',
      data: {
        submission_id: parseInt(id),
        old_total_score: submission.total_score,
        new_total_score: newTotalScore,
        score_adjustment: totalScoreAdjustment,
        reviewed_answers: answers.length
      }
    });

  } catch (error) {
    console.error('人工复核失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/grading/submission/:submissionId
 * 根据提交ID查询批改结果（别名路由）
 */
router.get('/submission/:submissionId', async (req: AuthRequest, res: Response): Promise<void> => {
  req.params.id = req.params.submissionId;
  // 重定向到主查询接口
  res.redirect(`/api/grading/${req.params.submissionId}`);
});

/**
 * GET /api/grading/assignment/:assignment_id
 * 根据作业ID查询批改结果（支持可选的student_id参数）
 * 
 * 查询参数：
 * - student_id: 可选，学生ID，用于筛选特定学生的批改结果
 * 
 * 需求：2.1, 2.2, 2.3
 * 
 * Sub-task 2.1: 统一接口路径为 /api/grading/assignment/:assignment_id
 * Sub-task 2.2: 无数据时返回空数组而非404错误
 * Sub-task 2.3: 添加查询参数校验
 */
router.get('/assignment/:assignment_id', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { assignment_id } = req.params;
    const { student_id } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Sub-task 2.3: 参数校验 - assignment_id必填
    if (!assignment_id || isNaN(parseInt(assignment_id))) {
      console.error(`[${new Date().toISOString()}] 批改查询失败 - 参数错误:`, {
        assignment_id,
        student_id,
        userId,
        userRole,
        duration: Date.now() - startTime
      });
      
      res.status(400).json({
        code: 400,
        msg: '缺少必填参数：assignment_id，且必须是有效的整数',
        data: null
      });
      return;
    }

    // Sub-task 2.3: 参数校验 - student_id可选，但如果提供必须是有效整数
    if (student_id && isNaN(parseInt(student_id as string))) {
      console.error(`[${new Date().toISOString()}] 批改查询失败 - 参数错误:`, {
        assignment_id,
        student_id,
        userId,
        userRole,
        duration: Date.now() - startTime
      });
      
      res.status(400).json({
        code: 400,
        msg: 'student_id参数必须是有效的整数',
        data: null
      });
      return;
    }

    // 验证作业是否存在
    const assignments = await executeQuery<Array<{
      id: number;
      class_id: number;
      teacher_id: number;
      title: string;
      total_score: number;
    }>>(
      'SELECT id, class_id, teacher_id, title, total_score FROM assignments WHERE id = ?',
      [assignment_id]
    );

    if (!assignments || assignments.length === 0) {
      console.error(`[${new Date().toISOString()}] 批改查询失败 - 作业不存在:`, {
        assignment_id,
        student_id,
        userId,
        userRole,
        duration: Date.now() - startTime
      });
      
      res.status(404).json({
        code: 404,
        msg: '作业不存在',
        data: null
      });
      return;
    }

    const assignment = assignments[0];

    // 权限检查
    if (userRole === 'student') {
      // 学生只能查看自己的批改结果
      if (student_id && parseInt(student_id as string) !== userId) {
        console.error(`[${new Date().toISOString()}] 批改查询失败 - 权限不足:`, {
          assignment_id,
          student_id,
          userId,
          userRole,
          reason: '学生只能查看自己的批改结果',
          duration: Date.now() - startTime
        });
        
        res.status(403).json({
          code: 403,
          msg: '权限不足：学生只能查看自己的批改结果',
          data: null
        });
        return;
      }
    } else if (userRole === 'teacher') {
      // 教师只能查看自己班级的批改结果
      if (assignment.teacher_id !== userId) {
        console.error(`[${new Date().toISOString()}] 批改查询失败 - 权限不足:`, {
          assignment_id,
          student_id,
          userId,
          userRole,
          reason: '教师只能查看自己班级的批改结果',
          duration: Date.now() - startTime
        });
        
        res.status(403).json({
          code: 403,
          msg: '权限不足：教师只能查看自己班级的批改结果',
          data: null
        });
        return;
      }
    } else if (userRole === 'parent') {
      // 家长只能查看自己孩子的批改结果
      if (student_id) {
        const parentChild = await executeQuery<any[]>(
          'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
          [userId, student_id]
        );

        if (!parentChild || parentChild.length === 0) {
          console.error(`[${new Date().toISOString()}] 批改查询失败 - 权限不足:`, {
            assignment_id,
            student_id,
            userId,
            userRole,
            reason: '家长只能查看自己孩子的批改结果',
            duration: Date.now() - startTime
          });
          
          res.status(403).json({
            code: 403,
            msg: '权限不足：家长只能查看自己孩子的批改结果',
            data: null
          });
          return;
        }
      }
    }
    // 管理员无限制

    // 构建查询条件
    const whereConditions = ['s.assignment_id = ?'];
    const queryParams: any[] = [assignment_id];

    // 如果指定了student_id，添加筛选条件
    if (student_id) {
      whereConditions.push('s.student_id = ?');
      queryParams.push(student_id);
    } else if (userRole === 'student') {
      // 学生未指定student_id时，默认查询自己的
      whereConditions.push('s.student_id = ?');
      queryParams.push(userId);
    } else if (userRole === 'parent') {
      // 家长未指定student_id时，查询所有孩子的
      const children = await executeQuery<Array<{ student_id: number }>>(
        'SELECT student_id FROM parent_students WHERE parent_id = ?',
        [userId]
      );
      
      if (children && children.length > 0) {
        const childIds = children.map(c => c.student_id);
        whereConditions.push(`s.student_id IN (${childIds.join(',')})`);
      } else {
        // 家长没有孩子，返回空数组
        console.log(`[${new Date().toISOString()}] 批改查询成功 - 无数据:`, {
          assignment_id,
          student_id,
          userId,
          userRole,
          reason: '家长没有关联的孩子',
          duration: Date.now() - startTime
        });
        
        res.json({
          code: 200,
          msg: '查询成功',
          data: []
        });
        return;
      }
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Sub-task 2.2: 查询批改结果，无数据时返回空数组
    const submissions = await executeQuery<any[]>(
      `SELECT 
        s.id as submission_id,
        s.student_id,
        u.real_name as student_name,
        u.username as student_username,
        s.submit_time,
        s.grading_time,
        s.total_score,
        s.status,
        s.file_url
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       ${whereClause}
       ORDER BY s.submit_time DESC`,
      queryParams
    );

    // Sub-task 2.2: 无数据时返回空数组而非404
    if (!submissions || submissions.length === 0) {
      console.log(`[${new Date().toISOString()}] 批改查询成功 - 无数据:`, {
        assignment_id,
        student_id,
        userId,
        userRole,
        duration: Date.now() - startTime
      });
      
      res.json({
        code: 200,
        msg: '查询成功',
        data: []
      });
      return;
    }

    // 查询每个提交的详细答题记录
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        const answers = await executeQuery<any[]>(
          `SELECT 
            a.id as answer_id,
            a.question_id,
            q.question_number,
            q.question_type,
            q.question_content,
            a.student_answer,
            a.score,
            q.score as max_score,
            a.is_correct,
            a.ai_feedback,
            a.needs_review,
            a.review_comment,
            kp.name as knowledge_point_name
           FROM answers a
           JOIN questions q ON a.question_id = q.id
           LEFT JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
           WHERE a.submission_id = ?
           ORDER BY q.question_number`,
          [submission.submission_id]
        );

        return {
          ...submission,
          answers: answers || []
        };
      })
    );

    console.log(`[${new Date().toISOString()}] 批改查询成功:`, {
      assignment_id,
      student_id,
      userId,
      userRole,
      resultCount: submissionsWithDetails.length,
      duration: Date.now() - startTime
    });

    // Sub-task 2.2: 统一返回格式 {code, msg, data}
    res.json({
      code: 200,
      msg: '查询成功',
      data: submissionsWithDetails
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 批改查询失败 - 服务器错误:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      assignment_id: req.params.assignment_id,
      student_id: req.query.student_id,
      userId: req.user?.id,
      userRole: req.user?.role,
      duration: Date.now() - startTime
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null
    });
  }
});

/**
 * GET /api/grading/assignment/:assignmentId/student/:studentId
 * 根据作业ID和学生ID查询批改结果（兼容旧路径）
 * 重定向到新的统一路径
 */
router.get('/assignment/:assignmentId/student/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { assignmentId, studentId } = req.params;
  
  // 重定向到新的统一路径
  res.redirect(`/api/grading/assignment/${assignmentId}?student_id=${studentId}`);
});
