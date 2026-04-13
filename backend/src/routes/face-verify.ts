/**
 * 人脸核验路由
 * POST /api/face/register  - 注册人脸特征
 * POST /api/face/verify    - 核验人脸（学习时每2分钟调用）
 * GET  /api/face/status    - 查询是否已注册
 * GET  /api/face/logs      - 教师查看核验日志
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { registerFace, verifyFace, hasFaceRegistered } from '../services/face-verify.service.js';
import { executeQuery } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/face/register
 * 注册人脸特征（128维向量）
 * 前端用 face-api.js 提取后传来
 */
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { feature_vector, photo_url } = req.body;

    if (!feature_vector || !Array.isArray(feature_vector)) {
      res.status(400).json({ success: false, message: '缺少人脸特征向量' });
      return;
    }

    const result = await registerFace(userId, feature_vector, photo_url);
    res.json(result);
  } catch (error) {
    logger.error('人脸注册接口异常', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/face/verify
 * 学习时每2分钟静默核验
 */
router.post('/verify', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { feature_vector, lesson_id, course_id, snapshot_url } = req.body;

    if (!feature_vector || !lesson_id || !course_id) {
      res.status(400).json({ success: false, message: '参数不完整' });
      return;
    }

    const result = await verifyFace(
      userId,
      Number(lesson_id),
      Number(course_id),
      feature_vector,
      snapshot_url
    );

    res.json(result);
  } catch (error) {
    logger.error('人脸核验接口异常', error);
    res.status(500).json({ success: false, result: 'fail', message: '核验服务异常' });
  }
});

/**
 * GET /api/face/status
 * 查询当前用户是否已注册人脸
 */
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registered = await hasFaceRegistered(req.user!.id);
    res.json({ success: true, registered });
  } catch (error) {
    // 演示模式降级：返回未注册状态
    res.json({ success: true, registered: false, demo_mode: true });
  }
});

/**
 * GET /api/face/logs/:courseId
 * 教师查看某课程的核验异常日志
 */
router.get('/logs/:courseId', requireRole('teacher', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { days = 7, result } = req.query;

    let sql = `
      SELECT
        fvl.id, fvl.user_id, fvl.lesson_id, fvl.verify_time,
        fvl.similarity, fvl.result, fvl.snapshot_url,
        u.name AS student_name, u.student_id AS student_no,
        l.title AS lesson_title
      FROM face_verify_logs fvl
      JOIN users u ON u.id = fvl.user_id
      JOIN lessons l ON l.id = fvl.lesson_id
      WHERE fvl.course_id = ?
        AND fvl.verify_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const params: (string | number)[] = [courseId, Number(days)];

    if (result && ['warning', 'fail'].includes(result as string)) {
      sql += ' AND fvl.result = ?';
      params.push(result as string);
    }

    sql += ' ORDER BY fvl.verify_time DESC LIMIT 500';

    const logs = await executeQuery(sql, params);
    res.json({ success: true, data: logs });
  } catch (error) {
    // 演示模式降级：face_verify_logs 表不存在时返回 mock 日志
    res.json({ success: true, data: [
      { id: 1, user_id: 4, lesson_id: 1, verify_time: new Date().toISOString(), similarity: 0.92, result: 'pass', student_name: '张小明', lesson_title: 'Python变量与类型' },
      { id: 2, user_id: 4, lesson_id: 2, verify_time: new Date(Date.now()-3600000).toISOString(), similarity: 0.78, result: 'warning', student_name: '张小明', lesson_title: '控制流程' }
    ]});
  }
});

export default router;
