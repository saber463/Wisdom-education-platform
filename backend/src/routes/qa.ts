/**
 * AI答疑路由模块
 * 实现AI问答、满意度反馈、问答记录持久化
 * 需求：7.2, 7.3, 7.5
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { answerQuestion } from '../services/grpc-clients.js';

const router = Router();

// 所有答疑路由都需要认证
router.use(authenticateToken);

/**
 * POST /api/qa/ask
 * AI答疑接口 - 学生提问
 * 
 * 请求体：
 * {
 *   "question": "问题内容",
 *   "context": "可选的上下文信息（如相关知识点、题目内容等）"
 * }
 * 
 * 返回：
 * {
 *   "success": true,
 *   "data": {
 *     "answer": "答案内容",
 *     "steps": ["解题步骤1", "解题步骤2"],
 *     "related_examples": ["相关例题1", "相关例题2"],
 *     "qa_record_id": 123
 *   }
 * }
 * 
 * 需求：7.2, 7.3
 */
router.post('/ask', requireRole('student'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question, context } = req.body as {
      question: string;
      context?: string;
    };
    const studentId = req.user!.id;

    // 验证必填字段
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '问题内容不能为空'
      });
      return;
    }

    // 问题长度限制
    if (question.length > 2000) {
      res.status(400).json({
        success: false,
        message: '问题内容过长，请限制在2000字以内'
      });
      return;
    }


    let answer: string;
    let steps: string[];
    let relatedExamples: string[];

    try {
      // 调用Python NLP服务理解问题并生成答案
      const aiResponse = await answerQuestion(question.trim(), context || '');
      answer = aiResponse.answer;
      steps = aiResponse.steps;
      relatedExamples = aiResponse.relatedExamples;
    } catch (error) {
      console.error('AI答疑服务调用失败:', error);
      
      // AI服务不可用时，返回友好提示
      res.status(503).json({
        success: false,
        message: 'AI答疑服务暂时不可用，请稍后重试或联系人工教师',
        error_code: 'AI_SERVICE_UNAVAILABLE'
      });
      return;
    }

    // 保存问答记录到数据库（初始状态无满意度评价）
    const qaResult = await executeQuery<any>(
      `INSERT INTO qa_records (student_id, question, answer, satisfaction)
       VALUES (?, ?, ?, NULL)`,
      [studentId, question.trim(), answer]
    );

    const qaRecordId = qaResult.insertId;

    // 记录系统日志
    await executeQuery(
      `INSERT INTO system_logs (log_type, service, message)
       VALUES ('info', 'qa-service', ?)`,
      [`学生${studentId}提问成功，问答记录ID: ${qaRecordId}`]
    );

    res.json({
      success: true,
      message: 'AI答疑成功',
      data: {
        answer,
        steps,
        related_examples: relatedExamples,
        qa_record_id: qaRecordId
      }
    });

  } catch (error) {
    console.error('AI答疑失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/qa/feedback
 * 问答满意度反馈接口
 * 
 * 请求体：
 * {
 *   "qa_record_id": 123,
 *   "satisfaction": "satisfied" | "unsatisfied" | "neutral"
 * }
 * 
 * 需求：7.5
 */
router.post('/feedback', requireRole('student'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qa_record_id, satisfaction } = req.body as {
      qa_record_id: number;
      satisfaction: 'satisfied' | 'unsatisfied' | 'neutral';
    };
    const studentId = req.user!.id;

    // 验证必填字段
    if (!qa_record_id || typeof qa_record_id !== 'number') {
      res.status(400).json({
        success: false,
        message: '问答记录ID不能为空'
      });
      return;
    }

    // 验证满意度值
    const validSatisfactions = ['satisfied', 'unsatisfied', 'neutral'];
    if (!satisfaction || !validSatisfactions.includes(satisfaction)) {
      res.status(400).json({
        success: false,
        message: '满意度值无效，必须为 satisfied、unsatisfied 或 neutral'
      });
      return;
    }

    // 查询问答记录，验证是否属于当前学生
    const qaRecords = await executeQuery<Array<{
      id: number;
      student_id: number;
      satisfaction: string | null;
    }>>(
      'SELECT id, student_id, satisfaction FROM qa_records WHERE id = ?',
      [qa_record_id]
    );

    if (!qaRecords || qaRecords.length === 0) {
      res.status(404).json({
        success: false,
        message: '问答记录不存在'
      });
      return;
    }

    const qaRecord = qaRecords[0];

    // 验证问答记录属于当前学生
    if (qaRecord.student_id !== studentId) {
      res.status(403).json({
        success: false,
        message: '无权限评价该问答记录'
      });
      return;
    }

    // 更新满意度
    await executeQuery(
      'UPDATE qa_records SET satisfaction = ? WHERE id = ?',
      [satisfaction, qa_record_id]
    );

    // 记录系统日志
    await executeQuery(
      `INSERT INTO system_logs (log_type, service, message)
       VALUES ('info', 'qa-service', ?)`,
      [`学生${studentId}对问答记录${qa_record_id}评价为: ${satisfaction}`]
    );

    res.json({
      success: true,
      message: '满意度反馈已记录',
      data: {
        qa_record_id,
        satisfaction
      }
    });

  } catch (error) {
    console.error('满意度反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/qa/history
 * 获取学生问答历史记录
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10，最大50）
 * - satisfaction: 筛选满意度（可选）
 */
router.get('/history', requireRole('student'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const satisfaction = req.query.satisfaction as string | undefined;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE student_id = ?';
    const params: any[] = [studentId];

    if (satisfaction && ['satisfied', 'unsatisfied', 'neutral'].includes(satisfaction)) {
      whereClause += ' AND satisfaction = ?';
      params.push(satisfaction);
    }

    // 查询总数
    const countResult = await executeQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) as total FROM qa_records ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // 查询记录
    const records = await executeQuery<Array<{
      id: number;
      question: string;
      answer: string;
      satisfaction: string | null;
      created_at: Date;
    }>>(
      `SELECT id, question, answer, satisfaction, created_at 
       FROM qa_records 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取问答历史失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * GET /api/qa/:id
 * 获取单条问答记录详情
 */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // 查询问答记录
    const records = await executeQuery<Array<{
      id: number;
      student_id: number;
      question: string;
      answer: string;
      satisfaction: string | null;
      created_at: Date;
    }>>(
      `SELECT qr.*, u.real_name as student_name
       FROM qa_records qr
       JOIN users u ON qr.student_id = u.id
       WHERE qr.id = ?`,
      [id]
    );

    if (!records || records.length === 0) {
      res.status(404).json({
        success: false,
        message: '问答记录不存在'
      });
      return;
    }

    const record = records[0] as any;

    // 权限检查：学生只能查看自己的记录，教师可以查看所有
    if (userRole === 'student' && record.student_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该问答记录'
      });
      return;
    }

    res.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('获取问答记录详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
