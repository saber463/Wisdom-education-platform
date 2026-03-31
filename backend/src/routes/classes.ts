/**
 * 班级管理路由模块
 * 实现班级学生列表查询和公告发布
 * 需求：3.5, 3.8
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';

const router = Router();

// 所有班级路由都需要认证
router.use(authenticateToken);

interface CourseClass {
  id: number;
  course_id: number;
  branch_id: number;
  class_number: number;
  class_name: string;
  teacher_id: number;
  student_count: number;
  max_students: number;
  created_at: Date;
}

interface ClassStudent {
  user_id: number;
  username: string;
  email: string;
  role: string;
  purchase_time: Date;
  course_id: number;
  course_name: string;
}

interface AnnouncementRequest {
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * GET /api/classes
 * 获取教师负责的班级列表（前端下拉选择用）
 */
router.get('/', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const rows = await executeQuery<CourseClass[]>(
      `SELECT id, name, student_count FROM classes WHERE teacher_id = ? ORDER BY created_at DESC`,
      [teacherId]
    );
    res.json({ code: 200, msg: '查询成功', classes: rows });
  } catch (err) {
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
});

/**
 * GET /api/classes/:id/students
 * 获取班级学生列表
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 * 
 * 响应：
 * {
 *   "code": 200,
 *   "msg": "查询成功",
 *   "data": {
 *     "class": { ... },
 *     "students": [ ... ],
 *     "pagination": { ... }
 *   }
 * }
 * 
 * 需求：3.5
 */
router.get('/:id/students', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        code: 400,
        msg: '无效的班级ID',
        data: null
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        code: 401,
        msg: '用户未登录',
        data: null
      });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
        code: 400,
        msg: '无效的page参数，必须是大于0的整数',
        data: null
      });
      return;
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        code: 400,
        msg: '无效的limit参数，必须是1-100之间的整数',
        data: null
      });
      return;
    }

    // 查询班级信息
    const classes = await executeQuery<CourseClass[]>(
      'SELECT * FROM course_classes WHERE id = ?',
      [id]
    );

    if (!classes || classes.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '班级不存在',
        data: null
      });
      return;
    }

    const classInfo = classes[0];

    // 权限验证：只有该班级的教师、管理员或家长可以查看
    if (userRole === 'teacher' && classInfo.teacher_id !== userId) {
      res.status(403).json({
        code: 403,
        msg: '您没有权限查看该班级的学生列表',
        data: null
      });
      return;
    }

    const offset = (pageNum - 1) * limitNum;

    // 查询学生总数
    const countResult = await executeQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) as total 
       FROM course_purchases cp
       WHERE cp.assigned_class_id = ? AND cp.payment_status = ?`,
      [id, 'paid']
    );
    const total = countResult[0].total;

    // 查询班级学生列表
    const students = await executeQuery<ClassStudent[]>(
      `SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.role,
        cp.purchase_time,
        c.id as course_id,
        c.display_name as course_name
       FROM course_purchases cp
       INNER JOIN users u ON cp.user_id = u.id
       INNER JOIN courses c ON cp.course_id = c.id
       WHERE cp.assigned_class_id = ? AND cp.payment_status = ?
       ORDER BY cp.purchase_time DESC
       LIMIT ? OFFSET ?`,
      [id, 'paid', limitNum, offset]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 班级学生列表查询成功`, {
      classId: id,
      userId,
      count: students.length,
      total,
      duration: `${duration}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        class: classInfo,
        students,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 班级学生列表查询失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      params: req.params,
      query: req.query,
      user: req.user?.id,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误，请稍后重试',
      data: null
    });
  }
});

/**
 * POST /api/classes/:id/announcement
 * 发布班级公告
 * 
 * 请求体：
 * {
 *   "title": "公告标题",
 *   "content": "公告内容",
 *   "priority": "low|medium|high|urgent"  // 可选，默认medium
 * }
 * 
 * 响应：
 * {
 *   "code": 200,
 *   "msg": "公告发布成功",
 *   "data": {
 *     "notified_count": 25
 *   }
 * }
 * 
 * 需求：3.8
 */
router.post('/:id/announcement', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const { title, content, priority = 'medium' } = req.body as AnnouncementRequest;
    const userId = req.user?.id;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        code: 400,
        msg: '无效的班级ID',
        data: null
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        code: 401,
        msg: '用户未登录',
        data: null
      });
      return;
    }

    if (!title || !content) {
      res.status(400).json({
        code: 400,
        msg: '缺少必填字段：title, content',
        data: null
      });
      return;
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      res.status(400).json({
        code: 400,
        msg: '无效的优先级，必须是 low, medium, high 或 urgent',
        data: null
      });
      return;
    }

    // 查询班级信息
    const classes = await executeQuery<CourseClass[]>(
      'SELECT * FROM course_classes WHERE id = ?',
      [id]
    );

    if (!classes || classes.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '班级不存在',
        data: null
      });
      return;
    }

    const classInfo = classes[0];

    // 权限验证：只有该班级的教师可以发布公告
    if (classInfo.teacher_id !== userId) {
      res.status(403).json({
        code: 403,
        msg: '您没有权限在该班级发布公告',
        data: null
      });
      return;
    }

    // 查询班级所有学生
    const students = await executeQuery<Array<{ user_id: number }>>(
      `SELECT DISTINCT cp.user_id
       FROM course_purchases cp
       WHERE cp.assigned_class_id = ? AND cp.payment_status = ?`,
      [id, 'paid']
    );

    if (!students || students.length === 0) {
      res.status(400).json({
        code: 400,
        msg: '该班级暂无学生',
        data: null
      });
      return;
    }

    // 为每个学生创建通知
    const notificationPromises = students.map(student => 
      executeQuery(
        `INSERT INTO notifications 
         (user_id, type, priority, title, content, action_url, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          student.user_id,
          'system',
          priority,
          `【班级公告】${title}`,
          content,
          `/learning/classes/${id}`,
          JSON.stringify({ 
            class_id: parseInt(id), 
            class_name: classInfo.class_name,
            teacher_id: userId 
          })
        ]
      )
    );

    await Promise.all(notificationPromises);

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 班级公告发布成功`, {
      classId: id,
      teacherId: userId,
      notifiedCount: students.length,
      title,
      priority,
      duration: `${duration}ms`
    });

    res.json({
      code: 200,
      msg: '公告发布成功',
      data: {
        notified_count: students.length,
        class_name: classInfo.class_name
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 班级公告发布失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      params: req.params,
      body: req.body,
      user: req.user?.id,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误，请稍后重试',
      data: null
    });
  }
});

export default router;
