/**
 * 家长端API路由
 * 实现家长查看孩子学习路径、错题本、视频学习进度
 * Requirements: 15.2, 15.3, 23.10
 * Task: 18.4
 */

import { Router, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { videoQuizService } from '../services/video-quiz.service.js';
import { connectMongoDB } from '../config/mongodb.js';
import { VideoProgress } from '../models/mongodb/video-progress.model.js';

const router = Router();

/**
 * GET /api/parent/children
 * 获取家长的孩子列表
 */
router.get('/children', requireRole('parent'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user!.id;

    const children = await executeQuery<any[]>(
      `SELECT u.id, u.username, u.real_name, u.email, u.created_at
       FROM users u
       INNER JOIN parent_students ps ON u.id = ps.student_id
       WHERE ps.parent_id = ?`,
      [parentId]
    );

    res.json({
      code: 200,
      msg: '获取成功',
      data: children
    });
  } catch (error) {
    console.error('获取孩子列表失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取失败',
      data: null
    });
  }
});

/**
 * GET /api/parent/child/:childId/learning-path
 * 家长查看孩子学习路径
 * Requirements: 15.2
 */
router.get('/child/:childId/learning-path', requireRole('parent'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user!.id;
    const childId = parseInt(req.params.childId);

    // 验证家长权限
    const parentCheck = await executeQuery<any[]>(
      `SELECT 1 FROM parent_students 
       WHERE parent_id = ? AND student_id = ?`,
      [parentId, childId]
    );

    if (parentCheck.length === 0) {
      res.status(403).json({
        code: 403,
        msg: '无权限查看该孩子的学习路径',
        data: null
      });
      return;
    }

    // 获取孩子的学习路径
    const learningPaths = await executeQuery<any[]>(
      `SELECT lp.*, lp.progress_percentage, lp.status, lp.started_at, lp.completed_at
       FROM learning_progress lp
       WHERE lp.user_id = ?
       ORDER BY lp.started_at DESC`,
      [childId]
    );

    // 获取每个路径的详细信息
    const pathsWithDetails = await Promise.all(
      learningPaths.map(async (path) => {
        const pathDetails = await executeQuery<any[]>(
          `SELECT * FROM learning_paths WHERE id = ?`,
          [path.learning_path_id]
        );

        const steps = await executeQuery<any[]>(
          `SELECT * FROM learning_path_steps 
           WHERE learning_path_id = ? 
           ORDER BY step_number ASC`,
          [path.learning_path_id]
        );

        return {
          ...path,
          path_details: pathDetails[0] || null,
          steps
        };
      })
    );

    res.json({
      code: 200,
      msg: '获取成功',
      data: pathsWithDetails
    });
  } catch (error) {
    console.error('获取孩子学习路径失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取失败',
      data: null
    });
  }
});

/**
 * GET /api/parent/child/:childId/wrong-book
 * 家长查看孩子错题本
 * Requirements: 23.10
 */
router.get('/child/:childId/wrong-book', requireRole('parent'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user!.id;
    const childId = parseInt(req.params.childId);

    // 验证家长权限
    const parentCheck = await executeQuery<any[]>(
      `SELECT 1 FROM parent_students 
       WHERE parent_id = ? AND student_id = ?`,
      [parentId, childId]
    );

    if (parentCheck.length === 0) {
      res.status(403).json({
        code: 403,
        msg: '无权限查看该孩子的错题本',
        data: null
      });
      return;
    }

    const result = await videoQuizService.getParentWrongBook(parentId, childId);

    if (!result.success) {
      res.status(400).json({
        code: 400,
        msg: '获取失败',
        data: null
      });
      return;
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: result
    });
  } catch (error) {
    console.error('获取孩子错题本失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取失败',
      data: null
    });
  }
});

/**
 * GET /api/parent/child/:childId/video-progress
 * 家长查看孩子视频学习进度
 * Requirements: 15.3
 */
router.get('/child/:childId/video-progress', requireRole('parent'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user!.id;
    const childId = parseInt(req.params.childId);
    const { lesson_id } = req.query;

    // 验证家长权限
    const parentCheck = await executeQuery<any[]>(
      `SELECT 1 FROM parent_students 
       WHERE parent_id = ? AND student_id = ?`,
      [parentId, childId]
    );

    if (parentCheck.length === 0) {
      res.status(403).json({
        code: 403,
        msg: '无权限查看该孩子的视频进度',
        data: null
      });
      return;
    }

    await connectMongoDB();

    const query: any = { user_id: childId };
    if (lesson_id) {
      query.lesson_id = parseInt(lesson_id as string);
    }

    const videoProgressList = await VideoProgress.find(query)
      .sort({ last_watched_at: -1 })
      .limit(100);

    // 获取课节信息
    const progressWithLessonInfo = await Promise.all(
      videoProgressList.map(async (progress) => {
        const lessonInfo = await executeQuery<any[]>(
          `SELECT id, title, course_id FROM course_lessons WHERE id = ?`,
          [progress.lesson_id]
        );

        return {
          lesson_id: progress.lesson_id,
          lesson_title: lessonInfo[0]?.title || '未知课节',
          progress_percentage: progress.progress_percentage,
          watch_count: progress.watch_count,
          total_watch_time: progress.total_watch_time,
          is_completed: progress.is_completed,
          completed_at: progress.completed_at,
          last_watched_at: progress.last_watched_at
        };
      })
    );

    res.json({
      code: 200,
      msg: '获取成功',
      data: progressWithLessonInfo
    });
  } catch (error) {
    console.error('获取孩子视频进度失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取失败',
      data: null
    });
  }
});

export default router;

