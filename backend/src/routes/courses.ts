/**
 * 课程体系管理路由模块
 * 实现课程的CRUD操作
 * 需求：1.1, 1.6, 1.7
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';

const router = Router();

// 所有课程路由都需要认证
router.use(authenticateToken);

interface Course {
  id: number;
  language_name: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  is_hot: boolean;
  hot_rank: number;
  total_students: number;
  total_lessons: number;
  avg_rating: number;
  rating_count: number;
  created_at: Date;
  updated_at: Date;
}

interface CreateCourseRequest {
  language_name: string;
  display_name: string;
  description?: string;
  icon_url?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  is_hot?: boolean;
  hot_rank?: number;
}

interface UpdateCourseRequest {
  language_name?: string;
  display_name?: string;
  description?: string;
  icon_url?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  is_hot?: boolean;
  hot_rank?: number;
}

/**
 * POST /api/courses
 * 创建课程（仅管理员）
 * 
 * 请求体：
 * {
 *   "language_name": "Python",
 *   "display_name": "Python编程",
 *   "description": "课程描述",
 *   "icon_url": "https://example.com/icon.png",
 *   "difficulty": "beginner|intermediate|advanced",
 *   "price": 99.00,
 *   "is_hot": true,
 *   "hot_rank": 1
 * }
 * 
 * 需求：1.1
 */
router.post('/', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const {
      language_name,
      display_name,
      description,
      icon_url,
      difficulty = 'beginner',
      price = 0,
      is_hot = false,
      hot_rank = 0
    } = req.body as CreateCourseRequest;

    // 参数校验
    if (!language_name || !display_name) {
      console.error(`[${new Date().toISOString()}] 参数校验失败: 缺少必填字段`, {
        body: req.body,
        url: req.url,
        method: req.method,
        user: req.user?.id
      });
      res.status(400).json({
        code: 400,
        msg: '缺少必填字段：language_name, display_name',
        data: null
      });
      return;
    }

    // 验证难度级别
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json({
        code: 400,
        msg: '无效的难度级别，必须是 beginner, intermediate 或 advanced',
        data: null
      });
      return;
    }

    // 验证价格
    if (price < 0) {
      res.status(400).json({
        code: 400,
        msg: '价格不能为负数',
        data: null
      });
      return;
    }

    // 检查课程名称是否已存在
    const existingCourse = await executeQuery<Course[]>(
      'SELECT id FROM courses WHERE language_name = ?',
      [language_name]
    );

    if (existingCourse && existingCourse.length > 0) {
      res.status(409).json({
        code: 409,
        msg: '该编程语言课程已存在',
        data: null
      });
      return;
    }

    // 创建课程
    const result = await executeQuery<any>(
      `INSERT INTO courses 
       (language_name, display_name, description, icon_url, difficulty, price, is_hot, hot_rank) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [language_name, display_name, description || null, icon_url || null, difficulty, price, is_hot, hot_rank]
    );

    const courseId = result.insertId;

    // 查询创建的课程详情
    const course = await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程创建成功`, {
      courseId,
      language_name,
      user: req.user?.id,
      duration: `${duration}ms`
    });

    res.status(201).json({
      code: 201,
      msg: '课程创建成功',
      data: course[0]
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课程创建失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
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

/**
 * GET /api/courses
 * 获取课程列表（支持筛选）
 * 
 * 查询参数：
 * - difficulty: 难度级别（可选）
 * - is_hot: 是否热门（可选）
 * - min_price: 最低价格（可选）
 * - max_price: 最高价格（可选）
 * - search: 搜索关键词（可选）
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10）
 * 
 * 需求：1.6
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const {
      difficulty,
      is_hot,
      min_price,
      max_price,
      search,
      page = '1',
      limit = '10'
    } = req.query;

    // 参数校验 - 验证分页参数
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || pageNum < 1) {
      console.error(`[${new Date().toISOString()}] 参数校验失败: 无效的page参数`, {
        page,
        url: req.url,
        method: req.method,
        user: req.user?.id
      });
      res.status(400).json({
        code: 400,
        msg: '无效的page参数，必须是大于0的整数',
        data: null
      });
      return;
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.error(`[${new Date().toISOString()}] 参数校验失败: 无效的limit参数`, {
        limit,
        url: req.url,
        method: req.method,
        user: req.user?.id
      });
      res.status(400).json({
        code: 400,
        msg: '无效的limit参数，必须是1-100之间的整数',
        data: null
      });
      return;
    }

    const offset = (pageNum - 1) * limitNum;

    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    // 难度筛选
    if (difficulty) {
      whereConditions.push('difficulty = ?');
      queryParams.push(difficulty);
    }

    // 热门筛选
    if (is_hot !== undefined) {
      whereConditions.push('is_hot = ?');
      queryParams.push(is_hot === 'true' || is_hot === '1');
    }

    // 价格范围筛选
    if (min_price !== undefined) {
      const minPriceNum = parseFloat(min_price as string);
      if (!isNaN(minPriceNum)) {
        whereConditions.push('price >= ?');
        queryParams.push(minPriceNum);
      }
    }

    if (max_price !== undefined) {
      const maxPriceNum = parseFloat(max_price as string);
      if (!isNaN(maxPriceNum)) {
        whereConditions.push('price <= ?');
        queryParams.push(maxPriceNum);
      }
    }

    // 搜索关键词
    if (search) {
      whereConditions.push('(language_name LIKE ? OR display_name LIKE ? OR description LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // 查询总数
    const countResult = await executeQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) as total FROM courses ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询课程列表
    const courses = await executeQuery<Course[]>(
      `SELECT * FROM courses
       ${whereClause}
       ORDER BY 
         CASE WHEN is_hot = 1 THEN hot_rank ELSE 999 END ASC,
         created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程列表查询成功`, {
      user: req.user?.id,
      count: courses.length,
      total,
      duration: `${duration}ms`,
      params: { difficulty, is_hot, min_price, max_price, search, page: pageNum, limit: limitNum }
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        courses,
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
    console.error(`[${new Date().toISOString()}] 课程列表查询失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
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
 * GET /api/courses/:id
 * 获取课程详情
 * 
 * 需求：1.7
 */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      console.error(`[${new Date().toISOString()}] 参数校验失败: 无效的课程ID`, {
        id,
        url: req.url,
        method: req.method,
        user: req.user?.id
      });
      res.status(400).json({
        code: 400,
        msg: '无效的课程ID',
        data: null
      });
      return;
    }

    // 查询课程基本信息
    const courses = await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (!courses || courses.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程不存在',
        data: null
      });
      return;
    }

    const course = courses[0];

    // 查询课程分支数量
    const branchCount = await executeQuery<Array<{ count: number }>>(
      'SELECT COUNT(*) as count FROM course_branches WHERE course_id = ?',
      [id]
    );

    // 查询课程评价统计
    const reviewStats = await executeQuery<Array<{
      avg_rating: number;
      rating_count: number;
    }>>(
      `SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as rating_count
       FROM course_reviews
       WHERE course_id = ?`,
      [id]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程详情查询成功`, {
      courseId: id,
      user: req.user?.id,
      duration: `${duration}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        ...course,
        branch_count: branchCount[0].count,
        review_stats: reviewStats[0] || { avg_rating: 0, rating_count: 0 }
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课程详情查询失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      params: req.params,
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
 * PUT /api/courses/:id
 * 更新课程（仅管理员）
 * 
 * 需求：1.7
 */
router.put('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const updates = req.body as UpdateCourseRequest;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      console.error(`[${new Date().toISOString()}] 参数校验失败: 无效的课程ID`, {
        id,
        url: req.url,
        method: req.method,
        user: req.user?.id
      });
      res.status(400).json({
        code: 400,
        msg: '无效的课程ID',
        data: null
      });
      return;
    }

    // 查询课程
    const courses = await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (!courses || courses.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程不存在',
        data: null
      });
      return;
    }

    // 验证难度级别
    if (updates.difficulty) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(updates.difficulty)) {
        res.status(400).json({
          code: 400,
          msg: '无效的难度级别，必须是 beginner, intermediate 或 advanced',
          data: null
        });
        return;
      }
    }

    // 验证价格
    if (updates.price !== undefined && updates.price < 0) {
      res.status(400).json({
        code: 400,
        msg: '价格不能为负数',
        data: null
      });
      return;
    }

    // 构建更新语句
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.language_name !== undefined) {
      updateFields.push('language_name = ?');
      updateValues.push(updates.language_name);
    }
    if (updates.display_name !== undefined) {
      updateFields.push('display_name = ?');
      updateValues.push(updates.display_name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }
    if (updates.icon_url !== undefined) {
      updateFields.push('icon_url = ?');
      updateValues.push(updates.icon_url);
    }
    if (updates.difficulty !== undefined) {
      updateFields.push('difficulty = ?');
      updateValues.push(updates.difficulty);
    }
    if (updates.price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(updates.price);
    }
    if (updates.is_hot !== undefined) {
      updateFields.push('is_hot = ?');
      updateValues.push(updates.is_hot);
    }
    if (updates.hot_rank !== undefined) {
      updateFields.push('hot_rank = ?');
      updateValues.push(updates.hot_rank);
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        code: 400,
        msg: '没有需要更新的字段',
        data: null
      });
      return;
    }

    updateValues.push(id);

    await executeQuery(
      `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 查询更新后的课程
    const updatedCourse = await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程更新成功`, {
      courseId: id,
      user: req.user?.id,
      duration: `${duration}ms`,
      updatedFields: updateFields.length
    });

    res.json({
      code: 200,
      msg: '课程更新成功',
      data: updatedCourse[0]
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课程更新失败`, {
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

/**
 * DELETE /api/courses/:id
 * 删除课程（仅管理员）
 * 级联删除所有相关数据（分支、课节、购买记录等）
 * 
 * 需求：1.7
 */
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      console.error(`[${new Date().toISOString()}] 参数校验失败: 无效的课程ID`, {
        id,
        url: req.url,
        method: req.method,
        user: req.user?.id
      });
      res.status(400).json({
        code: 400,
        msg: '无效的课程ID',
        data: null
      });
      return;
    }

    // 查询课程
    const courses = await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (!courses || courses.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程不存在',
        data: null
      });
      return;
    }

    // 检查是否有学生已购买该课程
    const purchaseCount = await executeQuery<Array<{ count: number }>>(
      'SELECT COUNT(*) as count FROM course_purchases WHERE course_id = ? AND payment_status = ?',
      [id, 'paid']
    );

    if (purchaseCount[0].count > 0) {
      res.status(400).json({
        code: 400,
        msg: `无法删除课程，已有 ${purchaseCount[0].count} 名学生购买了该课程`,
        data: { purchaseCount: purchaseCount[0].count }
      });
      return;
    }

    // 删除课程（级联删除分支、课节等）
    await executeQuery('DELETE FROM courses WHERE id = ?', [id]);

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程删除成功`, {
      courseId: id,
      user: req.user?.id,
      duration: `${duration}ms`
    });

    res.json({
      code: 200,
      msg: '课程删除成功',
      data: null
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课程删除失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      params: req.params,
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

// ==================== 课程购买和班级分配 ====================

interface CoursePurchase {
  id: number;
  user_id: number;
  course_id: number;
  branch_id: number | null;
  price: number;
  payment_method: 'alipay' | 'wechat' | 'balance' | 'free';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  assigned_class_id: number | null;
  purchase_time: Date;
}

interface PurchaseCourseRequest {
  branch_id?: number;
  payment_method: 'alipay' | 'wechat' | 'balance' | 'free';
}

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

/**
 * 随机班级分配算法
 * 确保班级人数均衡（差距不超过5人）
 * 
 * @param courseId 课程ID
 * @param branchId 分支ID
 * @returns 分配的班级ID
 * 
 * 需求：2.2, 2.3
 */
async function assignClassBalanced(courseId: number, branchId: number): Promise<number> {
  // 查询该分支下的所有班级及其学生数
  const classes = await executeQuery<CourseClass[]>(
    `SELECT * FROM course_classes 
     WHERE course_id = ? AND branch_id = ?
     ORDER BY student_count ASC`,
    [courseId, branchId]
  );

  if (!classes || classes.length === 0) {
    throw new Error('该课程分支没有可用的班级');
  }

  // 找到学生数最少的班级
  const targetClass = classes[0];

  // 检查是否已满
  if (targetClass.student_count >= targetClass.max_students) {
    throw new Error('所有班级已满，无法分配');
  }

  // 检查班级人数差距
  const maxStudentCount = classes[classes.length - 1].student_count;
  const minStudentCount = targetClass.student_count;
  
  if (maxStudentCount - minStudentCount > 5) {
    console.warn(`班级人数差距较大: ${maxStudentCount - minStudentCount}人`);
  }

  return targetClass.id;
}

/**
 * POST /api/courses/:id/purchase
 * 购买课程
 * 
 * 请求体：
 * {
 *   "branch_id": 1,  // 可选，如果购买整个课程则不传
 *   "payment_method": "alipay|wechat|balance|free"
 * }
 * 
 * 响应：
 * {
 *   "code": 200,
 *   "msg": "购买成功",
 *   "data": {
 *     "purchase": { ... },
 *     "assigned_class": { ... }
 *   }
 * }
 * 
 * 需求：2.1, 2.2, 2.3, 2.6
 */
router.post('/:id/purchase', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const { branch_id, payment_method } = req.body as PurchaseCourseRequest;
    const userId = req.user?.id;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        code: 400,
        msg: '无效的课程ID',
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

    if (!payment_method) {
      res.status(400).json({
        code: 400,
        msg: '缺少必填字段：payment_method',
        data: null
      });
      return;
    }

    const validPaymentMethods = ['alipay', 'wechat', 'balance', 'free'];
    if (!validPaymentMethods.includes(payment_method)) {
      res.status(400).json({
        code: 400,
        msg: '无效的支付方式',
        data: null
      });
      return;
    }

    // 查询课程信息
    const courses = await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (!courses || courses.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程不存在',
        data: null
      });
      return;
    }

    const course = courses[0];

    // 如果指定了分支，验证分支是否存在
    let branchId = branch_id;
    if (branch_id) {
      const branches = await executeQuery<CourseBranch[]>(
        'SELECT id FROM course_branches WHERE id = ? AND course_id = ?',
        [branch_id, id]
      );

      if (!branches || branches.length === 0) {
        res.status(404).json({
          code: 404,
          msg: '课程分支不存在',
          data: null
        });
        return;
      }
    } else {
      // 如果没有指定分支，选择第一个分支
      const branches = await executeQuery<CourseBranch[]>(
        'SELECT id FROM course_branches WHERE course_id = ? ORDER BY order_num ASC LIMIT 1',
        [id]
      );

      if (!branches || branches.length === 0) {
        res.status(400).json({
          code: 400,
          msg: '该课程没有可用的分支',
          data: null
        });
        return;
      }

      branchId = branches[0].id;
    }

    // 检查是否已购买
    const existingPurchase = await executeQuery<CoursePurchase[]>(
      'SELECT * FROM course_purchases WHERE user_id = ? AND course_id = ? AND payment_status = ?',
      [userId, id, 'paid']
    );

    if (existingPurchase && existingPurchase.length > 0) {
      res.status(409).json({
        code: 409,
        msg: '您已购买该课程',
        data: { purchase: existingPurchase[0] }
      });
      return;
    }

    // 确定价格
    const price = course.price;

    // 免费课程直接通过
    const paymentStatus = price === 0 || payment_method === 'free' ? 'paid' : 'pending';

    // 如果是付费课程且不是免费支付方式，这里应该调用支付接口
    // 为了简化，我们假设支付立即成功
    const finalPaymentStatus = 'paid';

    // 分配班级
    let assignedClassId: number | null = null;
    try {
      assignedClassId = await assignClassBalanced(parseInt(id), branchId);
    } catch (error) {
      console.error('班级分配失败:', error);
      res.status(500).json({
        code: 500,
        msg: error instanceof Error ? error.message : '班级分配失败',
        data: null
      });
      return;
    }

    // 创建购买记录
    const purchaseResult = await executeQuery<any>(
      `INSERT INTO course_purchases 
       (user_id, course_id, branch_id, price, payment_method, payment_status, assigned_class_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, id, branchId, price, payment_method, finalPaymentStatus, assignedClassId]
    );

    const purchaseId = purchaseResult.insertId;

    // 更新班级学生数
    await executeQuery(
      'UPDATE course_classes SET student_count = student_count + 1 WHERE id = ?',
      [assignedClassId]
    );

    // 更新课程总学生数
    await executeQuery(
      'UPDATE courses SET total_students = total_students + 1 WHERE id = ?',
      [id]
    );

    // 查询购买记录详情
    const purchase = await executeQuery<CoursePurchase[]>(
      'SELECT * FROM course_purchases WHERE id = ?',
      [purchaseId]
    );

    // 查询分配的班级详情
    const assignedClass = await executeQuery<any[]>(
      `SELECT cc.*, u.username as teacher_name
       FROM course_classes cc
       LEFT JOIN users u ON cc.teacher_id = u.id
       WHERE cc.id = ?`,
      [assignedClassId]
    );

    // 创建通知给学生
    await executeQuery(
      `INSERT INTO notifications 
       (user_id, type, priority, title, content, action_url, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'system',
        'medium',
        '课程购买成功',
        `您已成功购买课程《${course.display_name}》，已为您分配到${assignedClass[0].class_name}`,
        `/learning/courses/${id}`,
        JSON.stringify({ course_id: id, class_id: assignedClassId })
      ]
    );

    // 通知班级教师
    if (assignedClass[0].teacher_id) {
      await executeQuery(
        `INSERT INTO notifications 
         (user_id, type, priority, title, content, action_url, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          assignedClass[0].teacher_id,
          'system',
          'low',
          '新学生加入班级',
          `新学生加入了您的班级${assignedClass[0].class_name}`,
          `/edu/teacher/classes/${assignedClassId}`,
          JSON.stringify({ course_id: id, class_id: assignedClassId, student_id: userId })
        ]
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程购买成功`, {
      userId,
      courseId: id,
      branchId,
      purchaseId,
      assignedClassId,
      price,
      duration: `${duration}ms`
    });

    res.status(200).json({
      code: 200,
      msg: '购买成功',
      data: {
        purchase: purchase[0],
        assigned_class: assignedClass[0]
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课程购买失败`, {
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

/**
 * GET /api/my-courses
 * 获取我的课程列表
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10）
 * 
 * 响应：
 * {
 *   "code": 200,
 *   "msg": "查询成功",
 *   "data": {
 *     "courses": [
 *       {
 *         "purchase": { ... },
 *         "course": { ... },
 *         "branch": { ... },
 *         "class": { ... }
 *       }
 *     ],
 *     "pagination": { ... }
 *   }
 * }
 * 
 * 需求：2.6
 */
router.get('/my-courses', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    const { page = '1', limit = '10' } = req.query;

    if (!userId) {
      res.status(401).json({
        code: 401,
        msg: '用户未登录',
        data: null
      });
      return;
    }

    // 参数校验
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

    const offset = (pageNum - 1) * limitNum;

    // 查询总数
    const countResult = await executeQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) as total 
       FROM course_purchases 
       WHERE user_id = ? AND payment_status = ?`,
      [userId, 'paid']
    );
    const total = countResult[0].total;

    // 查询我的课程列表
    const myCourses = await executeQuery<any[]>(
      `SELECT 
        cp.*,
        c.language_name,
        c.display_name,
        c.description as course_description,
        c.icon_url,
        c.difficulty as course_difficulty,
        cb.branch_name,
        cb.description as branch_description,
        cc.class_name,
        cc.class_number,
        u.username as teacher_name
       FROM course_purchases cp
       INNER JOIN courses c ON cp.course_id = c.id
       LEFT JOIN course_branches cb ON cp.branch_id = cb.id
       LEFT JOIN course_classes cc ON cp.assigned_class_id = cc.id
       LEFT JOIN users u ON cc.teacher_id = u.id
       WHERE cp.user_id = ? AND cp.payment_status = ?
       ORDER BY cp.purchase_time DESC
       LIMIT ? OFFSET ?`,
      [userId, 'paid', limitNum, offset]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 我的课程列表查询成功`, {
      userId,
      count: myCourses.length,
      total,
      duration: `${duration}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        courses: myCourses,
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
    console.error(`[${new Date().toISOString()}] 我的课程列表查询失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
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

export default router;

// ==================== 课程分支管理 ====================

interface CourseBranch {
  id: number;
  course_id: number;
  branch_name: string;
  description: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number | null;
  order_num: number;
  created_at: Date;
}

interface CreateBranchRequest {
  branch_name: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours?: number;
  order_num?: number;
}

/**
 * POST /api/courses/:id/branches
 * 创建课程分支（仅管理员）
 * 
 * 请求体：
 * {
 *   "branch_name": "Web开发",
 *   "description": "分支描述",
 *   "difficulty": "beginner|intermediate|advanced",
 *   "estimated_hours": 40,
 *   "order_num": 1
 * }
 * 
 * 需求：1.2
 */
router.post('/:id/branches', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const {
      branch_name,
      description,
      difficulty = 'beginner',
      estimated_hours,
      order_num = 0
    } = req.body as CreateBranchRequest;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        code: 400,
        msg: '无效的课程ID',
        data: null
      });
      return;
    }

    if (!branch_name) {
      res.status(400).json({
        code: 400,
        msg: '缺少必填字段：branch_name',
        data: null
      });
      return;
    }

    // 验证课程是否存在
    const courses = await executeQuery<Course[]>(
      'SELECT id FROM courses WHERE id = ?',
      [id]
    );

    if (!courses || courses.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程不存在',
        data: null
      });
      return;
    }

    // 验证难度级别
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json({
        code: 400,
        msg: '无效的难度级别，必须是 beginner, intermediate 或 advanced',
        data: null
      });
      return;
    }

    // 检查分支名称是否已存在
    const existingBranch = await executeQuery<CourseBranch[]>(
      'SELECT id FROM course_branches WHERE course_id = ? AND branch_name = ?',
      [id, branch_name]
    );

    if (existingBranch && existingBranch.length > 0) {
      res.status(409).json({
        code: 409,
        msg: '该课程分支名称已存在',
        data: null
      });
      return;
    }

    // 创建分支
    const result = await executeQuery<any>(
      `INSERT INTO course_branches 
       (course_id, branch_name, description, difficulty, estimated_hours, order_num) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, branch_name, description || null, difficulty, estimated_hours || null, order_num]
    );

    const branchId = result.insertId;

    // 查询创建的分支详情
    const branch = await executeQuery<CourseBranch[]>(
      'SELECT * FROM course_branches WHERE id = ?',
      [branchId]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程分支创建成功`, {
      courseId: id,
      branchId,
      branch_name,
      user: req.user?.id,
      duration: `${duration}ms`
    });

    res.status(201).json({
      code: 201,
      msg: '课程分支创建成功',
      data: branch[0]
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课程分支创建失败`, {
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

/**
 * GET /api/courses/:id/branches
 * 获取课程分支列表
 * 
 * 需求：1.2
 */
router.get('/:id/branches', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        code: 400,
        msg: '无效的课程ID',
        data: null
      });
      return;
    }

    // 验证课程是否存在
    const courses = await executeQuery<Course[]>(
      'SELECT id FROM courses WHERE id = ?',
      [id]
    );

    if (!courses || courses.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程不存在',
        data: null
      });
      return;
    }

    // 查询分支列表（包含课节数量）
    const branches = await executeQuery<any[]>(
      `SELECT 
        cb.*,
        COUNT(cl.id) as lesson_count
       FROM course_branches cb
       LEFT JOIN course_lessons cl ON cb.id = cl.branch_id
       WHERE cb.course_id = ?
       GROUP BY cb.id, cb.course_id, cb.branch_name, cb.description, 
                cb.difficulty, cb.estimated_hours, cb.order_num, cb.created_at
       ORDER BY cb.order_num ASC, cb.created_at ASC`,
      [id]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课程分支列表查询成功`, {
      courseId: id,
      count: branches.length,
      user: req.user?.id,
      duration: `${duration}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: branches
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课程分支列表查询失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      params: req.params,
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

// ==================== 课节管理 ====================

interface CourseLesson {
  id: number;
  branch_id: number;
  lesson_number: number;
  title: string;
  description: string | null;
  video_url: string | null;
  video_duration: number | null;
  content: string | null;
  code_example: string | null;
  exercise_content: string | null;
  is_free: boolean;
  order_num: number;
  created_at: Date;
}

interface CreateLessonRequest {
  lesson_number: number;
  title: string;
  description?: string;
  video_url?: string;
  video_duration?: number;
  content?: string;
  code_example?: string;
  exercise_content?: string;
  is_free?: boolean;
  order_num?: number;
}

/**
 * POST /api/branches/:id/lessons
 * 创建课节（仅管理员）
 * 
 * 请求体：
 * {
 *   "lesson_number": 1,
 *   "title": "Python基础语法",
 *   "description": "课节描述",
 *   "video_url": "https://example.com/video.mp4",
 *   "video_duration": 1800,
 *   "content": "课节内容（Markdown）",
 *   "code_example": "print('Hello World')",
 *   "exercise_content": "练习题内容",
 *   "is_free": true,
 *   "order_num": 1
 * }
 * 
 * 需求：1.3
 */
router.post('/branches/:id/lessons', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const {
      lesson_number,
      title,
      description,
      video_url,
      video_duration,
      content,
      code_example,
      exercise_content,
      is_free = false,
      order_num = 0
    } = req.body as CreateLessonRequest;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        code: 400,
        msg: '无效的分支ID',
        data: null
      });
      return;
    }

    if (!lesson_number || !title) {
      res.status(400).json({
        code: 400,
        msg: '缺少必填字段：lesson_number, title',
        data: null
      });
      return;
    }

    // 验证分支是否存在
    const branches = await executeQuery<CourseBranch[]>(
      'SELECT id FROM course_branches WHERE id = ?',
      [id]
    );

    if (!branches || branches.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程分支不存在',
        data: null
      });
      return;
    }

    // 检查课节编号是否已存在
    const existingLesson = await executeQuery<CourseLesson[]>(
      'SELECT id FROM course_lessons WHERE branch_id = ? AND lesson_number = ?',
      [id, lesson_number]
    );

    if (existingLesson && existingLesson.length > 0) {
      res.status(409).json({
        code: 409,
        msg: '该课节编号已存在',
        data: null
      });
      return;
    }

    // 创建课节
    const result = await executeQuery<any>(
      `INSERT INTO course_lessons 
       (branch_id, lesson_number, title, description, video_url, video_duration, 
        content, code_example, exercise_content, is_free, order_num) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, lesson_number, title, description || null, video_url || null, 
        video_duration || null, content || null, code_example || null, 
        exercise_content || null, is_free, order_num
      ]
    );

    const lessonId = result.insertId;

    // 查询创建的课节详情
    const lesson = await executeQuery<CourseLesson[]>(
      'SELECT * FROM course_lessons WHERE id = ?',
      [lessonId]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课节创建成功`, {
      branchId: id,
      lessonId,
      lesson_number,
      title,
      user: req.user?.id,
      duration: `${duration}ms`
    });

    res.status(201).json({
      code: 201,
      msg: '课节创建成功',
      data: lesson[0]
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课节创建失败`, {
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

/**
 * GET /api/branches/:id/lessons
 * 获取课节列表
 * 
 * 需求：1.3
 */
router.get('/branches/:id/lessons', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { id } = req.params;

    // 参数校验
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        code: 400,
        msg: '无效的分支ID',
        data: null
      });
      return;
    }

    // 验证分支是否存在
    const branches = await executeQuery<CourseBranch[]>(
      'SELECT id FROM course_branches WHERE id = ?',
      [id]
    );

    if (!branches || branches.length === 0) {
      res.status(404).json({
        code: 404,
        msg: '课程分支不存在',
        data: null
      });
      return;
    }

    // 查询课节列表
    const lessons = await executeQuery<CourseLesson[]>(
      `SELECT * FROM course_lessons
       WHERE branch_id = ?
       ORDER BY order_num ASC, lesson_number ASC`,
      [id]
    );

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 课节列表查询成功`, {
      branchId: id,
      count: lessons.length,
      user: req.user?.id,
      duration: `${duration}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: lessons
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 课节列表查询失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      params: req.params,
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
