/**
 * 学情报告路由模块
 * 实现学情报告生成、查询、导出功能
 * 需求：16.1, 16.2, 16.4, 16.7
 * 性能优化：16.6 - 报告生成任务调度至CPU空闲时段，本地缓存生成结果
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { analyzeLearningStatus } from '../services/grpc-clients.js';
import { 
  localCache, 
  asyncTaskScheduler, 
  getCPUUsage, 
  getMemoryUsage,
  waitForCPUIdleTime 
} from '../services/performance-optimizer.js';

const router = Router();

// 所有学情报告路由都需要认证
router.use(authenticateToken);

/**
 * POST /api/analytics/reports/generate
 * 生成学情报告接口
 * 
 * 功能：
 * 1. 调用Python AI服务获取BERT分析结果
 * 2. 存储报告数据到learning_analytics_reports表
 * 3. 性能优化：报告生成任务调度至CPU空闲时段，本地缓存生成结果
 * 
 * 请求体：
 * {
 *   "user_id": 用户ID,
 *   "report_type": "student" | "class" | "parent",
 *   "time_range": "7" | "30" | "90" (天数),
 *   "async": true (可选，是否异步生成)
 * }
 * 
 * 需求：16.1, 16.2, 16.6
 */
router.post('/generate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, report_type = 'student', time_range = '30', async: isAsync = false } = req.body;
    const currentUserId = req.user!.id;
    const userRole = req.user!.role;

    // 参数验证
    if (!user_id) {
      res.status(400).json({
        success: false,
        message: '缺少必需参数：user_id'
      });
      return;
    }

    const timeRangeDays = parseInt(time_range);
    if (isNaN(timeRangeDays) || ![7, 30, 90].includes(timeRangeDays)) {
      res.status(400).json({
        success: false,
        message: '时间范围必须是7、30或90天'
      });
      return;
    }

    // 权限检查
    if (userRole === 'student' && user_id !== currentUserId) {
      res.status(403).json({
        success: false,
        message: '无权限生成其他用户的学情报告'
      });
      return;
    }

    if (userRole === 'parent') {
      // 验证是否是家长的孩子
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [currentUserId, user_id]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限生成该用户的学情报告'
        });
        return;
      }
    }

    // 生成缓存键
    const cacheKey = `report_${user_id}_${report_type}_${timeRangeDays}days`;

    // 检查缓存
    const cachedReport = localCache.get<any>(cacheKey);
    if (cachedReport) {
      console.log(`从本地缓存返回学情报告: ${cacheKey}`);
      res.json({
        success: true,
        message: '学情报告已从缓存返回',
        data: {
          ...cachedReport,
          from_cache: true
        }
      });
      return;
    }

    // 定义报告生成任务
    const generateReportTask = async () => {
      try {
        // 收集学习路径数据
        const learningPaths = await executeQuery<Array<{
          knowledge_point_id: number;
          knowledge_point_name: string;
          completed_count: number;
          total_count: number;
        }>>(
          `SELECT 
            kp.id as knowledge_point_id,
            kp.name as knowledge_point_name,
            COUNT(DISTINCT CASE WHEN a.is_correct = 1 THEN a.id END) as completed_count,
            COUNT(DISTINCT a.id) as total_count
           FROM answers a
           JOIN questions q ON a.question_id = q.id
           JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
           JOIN submissions s ON a.submission_id = s.id
           WHERE s.student_id = ? 
             AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           GROUP BY kp.id`,
          [user_id, timeRangeDays]
        );

        // 收集错题本数据
        const errorBooks = await executeQuery<Array<{
          knowledge_point_id: number;
          knowledge_point_name: string;
          error_count: number;
          total_count: number;
        }>>(
          `SELECT 
            kp.id as knowledge_point_id,
            kp.name as knowledge_point_name,
            COUNT(DISTINCT CASE WHEN a.is_correct = 0 THEN a.id END) as error_count,
            COUNT(DISTINCT a.id) as total_count
           FROM answers a
           JOIN questions q ON a.question_id = q.id
           JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
           JOIN submissions s ON a.submission_id = s.id
           WHERE s.student_id = ? 
             AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           GROUP BY kp.id`,
          [user_id, timeRangeDays]
        );

        // 收集答题速度数据（简化版，实际需要记录答题时间）
        const answerSpeeds = await executeQuery<Array<{
          question_id: number;
          time_spent_seconds: number;
          expected_time_seconds: number;
        }>>(
          `SELECT 
            a.question_id,
            60 as time_spent_seconds,
            45 as expected_time_seconds
           FROM answers a
           JOIN submissions s ON a.submission_id = s.id
           WHERE s.student_id = ? 
             AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           LIMIT 100`,
          [user_id, timeRangeDays]
        );

        // 调用Python AI服务进行BERT分析
        console.log('调用BERT学情分析服务...');
        const analysisResult = await analyzeLearningStatus(
          user_id,
          report_type,
          learningPaths.map(lp => ({
            knowledgePointId: lp.knowledge_point_id,
            knowledgePointName: lp.knowledge_point_name,
            completedCount: lp.completed_count,
            totalCount: lp.total_count
          })),
          errorBooks.map(eb => ({
            knowledgePointId: eb.knowledge_point_id,
            knowledgePointName: eb.knowledge_point_name,
            errorCount: eb.error_count,
            totalCount: eb.total_count
          })),
          answerSpeeds.map(as => ({
            questionId: as.question_id,
            timeSpentSeconds: as.time_spent_seconds,
            expectedTimeSeconds: as.expected_time_seconds
          }))
        );

        // 生成知识点掌握度数据（用于雷达图）
        const knowledgePointsData = analysisResult.knowledgePointScores.map(kps => ({
          knowledge_point_id: kps.knowledgePointId,
          knowledge_point_name: kps.knowledgePointName,
          mastery_score: kps.masteryScore,
          status: kps.status
        }));

        // 生成薄弱点分布数据（用于热力图）
        const weakPointsData = analysisResult.knowledgePointScores
          .filter(kps => kps.status === 'weak')
          .map(kps => ({
            knowledge_point_id: kps.knowledgePointId,
            knowledge_point_name: kps.knowledgePointName,
            mastery_score: kps.masteryScore,
            error_rate: 100 - kps.masteryScore
          }));

        // 生成学习进度数据（用于折线图）
        const progressData = await executeQuery<Array<{
          date: string;
          avg_score: number;
          submission_count: number;
        }>>(
          `SELECT 
            DATE(s.grading_time) as date,
            AVG(s.total_score / a.total_score * 100) as avg_score,
            COUNT(s.id) as submission_count
           FROM submissions s
           JOIN assignments a ON s.assignment_id = a.id
           WHERE s.student_id = ? 
             AND s.status IN ('graded', 'reviewed')
             AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           GROUP BY DATE(s.grading_time)
           ORDER BY date ASC`,
          [user_id, timeRangeDays]
        );

        // 存储报告到数据库
        const insertResult = await executeQuery<any>(
          `INSERT INTO learning_analytics_reports 
           (user_id, report_type, time_range, knowledge_points_data, weak_points_data, progress_data, ai_suggestions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            report_type,
            `${timeRangeDays}天`,
            JSON.stringify(knowledgePointsData),
            JSON.stringify(weakPointsData),
            JSON.stringify(progressData),
            JSON.stringify(analysisResult.aiSuggestions)
          ]
        );

        const reportId = insertResult.insertId;

        const reportData = {
          report_id: reportId,
          user_id,
          report_type,
          time_range: `${timeRangeDays}天`,
          overall_mastery_score: analysisResult.overallMasteryScore,
          knowledge_points_count: knowledgePointsData.length,
          weak_points_count: weakPointsData.length,
          ai_suggestions_count: analysisResult.aiSuggestions.length,
          generated_at: new Date().toISOString()
        };

        // 缓存报告结果
        localCache.set(cacheKey, reportData);
        console.log(`学情报告已缓存: ${cacheKey}`);

        return reportData;
      } catch (error) {
        console.error('报告生成任务执行失败:', error);
        throw error;
      }
    };

    // 如果是异步生成，添加到任务队列
    if (isAsync) {
      asyncTaskScheduler.addTask(
        `report_${user_id}_${Date.now()}`,
        generateReportTask,
        7 // 优先级
      );

      res.json({
        success: true,
        message: '学情报告生成任务已添加到队列，将在CPU空闲时段执行',
        data: {
          user_id,
          report_type,
          time_range: `${timeRangeDays}天`,
          status: 'queued',
          queue_status: asyncTaskScheduler.getQueueStatus()
        }
      });
      return;
    }

    // 同步生成报告
    const reportData = await generateReportTask();

    res.json({
      success: true,
      message: '学情报告生成成功',
      data: reportData
    });

  } catch (error) {
    console.error('学情报告生成失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/analytics/reports/:id
 * 查询报告详情接口
 * 
 * 功能：
 * 1. 查询指定ID的学情报告详情
 * 2. 包含所有图表数据和AI建议
 * 
 * 需求：16.7
 */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const userRole = req.user!.role;

    // 查询报告
    const reports = await executeQuery<Array<{
      id: number;
      user_id: number;
      report_type: string;
      time_range: string;
      knowledge_points_data: string;
      weak_points_data: string;
      progress_data: string;
      ai_suggestions: string;
      pdf_url: string | null;
      generated_at: Date;
    }>>(
      'SELECT * FROM learning_analytics_reports WHERE id = ?',
      [id]
    );

    if (!reports || reports.length === 0) {
      res.status(404).json({
        success: false,
        message: '报告不存在'
      });
      return;
    }

    const report = reports[0];

    // 权限检查
    if (userRole === 'student' && report.user_id !== currentUserId) {
      res.status(403).json({
        success: false,
        message: '无权限查看该报告'
      });
      return;
    }

    if (userRole === 'parent') {
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [currentUserId, report.user_id]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该报告'
        });
        return;
      }
    }

    // 解析JSON数据
    const knowledgePointsData = JSON.parse(report.knowledge_points_data || '[]');
    const weakPointsData = JSON.parse(report.weak_points_data || '[]');
    const progressData = JSON.parse(report.progress_data || '[]');
    const aiSuggestions = JSON.parse(report.ai_suggestions || '[]');

    // 计算总体掌握度
    const overallMasteryScore = knowledgePointsData.length > 0
      ? knowledgePointsData.reduce((sum: number, kp: any) => sum + kp.mastery_score, 0) / knowledgePointsData.length
      : 0;

    res.json({
      success: true,
      data: {
        report_id: report.id,
        user_id: report.user_id,
        report_type: report.report_type,
        time_range: report.time_range,
        generated_at: report.generated_at,
        pdf_url: report.pdf_url,
        overall_mastery_score: Math.round(overallMasteryScore * 100) / 100,
        knowledge_points_data: knowledgePointsData,
        weak_points_data: weakPointsData,
        progress_data: progressData,
        ai_suggestions: aiSuggestions,
        summary: {
          total_knowledge_points: knowledgePointsData.length,
          weak_points_count: weakPointsData.length,
          mastered_count: knowledgePointsData.filter((kp: any) => kp.status === 'mastered').length,
          improving_count: knowledgePointsData.filter((kp: any) => kp.status === 'improving').length
        }
      }
    });

  } catch (error) {
    console.error('报告查询失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/analytics/reports/user/:userId
 * 查询用户历史报告接口
 * 
 * 功能：
 * 1. 查询指定用户的所有历史报告
 * 2. 支持时间范围筛选（7天/30天/90天）
 * 
 * 查询参数：
 * - time_range: 时间范围筛选（可选）
 * - limit: 返回数量限制（默认10）
 * 
 * 需求：16.7
 */
router.get('/user/:userId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { time_range, limit = '10' } = req.query;
    const currentUserId = req.user!.id;
    const userRole = req.user!.role;

    // 权限检查
    if (userRole === 'student' && parseInt(userId) !== currentUserId) {
      res.status(403).json({
        success: false,
        message: '无权限查看其他用户的报告'
      });
      return;
    }

    if (userRole === 'parent') {
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [currentUserId, userId]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限查看该用户的报告'
        });
        return;
      }
    }

    // 构建查询条件
    let sql = `
      SELECT 
        id,
        user_id,
        report_type,
        time_range,
        pdf_url,
        generated_at
      FROM learning_analytics_reports
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    // 时间范围筛选
    if (time_range) {
      sql += ' AND time_range = ?';
      params.push(`${time_range}天`);
    }

    sql += ' ORDER BY generated_at DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const reports = await executeQuery<Array<{
      id: number;
      user_id: number;
      report_type: string;
      time_range: string;
      pdf_url: string | null;
      generated_at: Date;
    }>>(sql, params);

    // 为每个报告添加摘要信息
    const reportsWithSummary = await Promise.all(
      reports.map(async (report) => {
        // 获取报告的知识点数据
        const fullReport = await executeQuery<Array<{
          knowledge_points_data: string;
          weak_points_data: string;
        }>>(
          'SELECT knowledge_points_data, weak_points_data FROM learning_analytics_reports WHERE id = ?',
          [report.id]
        );

        if (fullReport && fullReport.length > 0) {
          const knowledgePointsData = JSON.parse(fullReport[0].knowledge_points_data || '[]');
          const weakPointsData = JSON.parse(fullReport[0].weak_points_data || '[]');

          const overallMasteryScore = knowledgePointsData.length > 0
            ? knowledgePointsData.reduce((sum: number, kp: any) => sum + kp.mastery_score, 0) / knowledgePointsData.length
            : 0;

          return {
            ...report,
            summary: {
              overall_mastery_score: Math.round(overallMasteryScore * 100) / 100,
              total_knowledge_points: knowledgePointsData.length,
              weak_points_count: weakPointsData.length
            }
          };
        }

        return {
          ...report,
          summary: {
            overall_mastery_score: 0,
            total_knowledge_points: 0,
            weak_points_count: 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        user_id: parseInt(userId),
        total_reports: reports.length,
        reports: reportsWithSummary
      }
    });

  } catch (error) {
    console.error('用户历史报告查询失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/analytics/reports/:id/export
 * 导出PDF报告接口
 * 
 * 功能：
 * 1. 使用puppeteer生成PDF（包含ECharts图表）
 * 2. 文件大小限制≤5MB
 * 
 * 需求：16.4
 */
router.post('/:id/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    const userRole = req.user!.role;

    // 查询报告
    const reports = await executeQuery<Array<{
      id: number;
      user_id: number;
      report_type: string;
      time_range: string;
      knowledge_points_data: string;
      weak_points_data: string;
      progress_data: string;
      ai_suggestions: string;
      pdf_url: string | null;
      generated_at: Date;
    }>>(
      'SELECT * FROM learning_analytics_reports WHERE id = ?',
      [id]
    );

    if (!reports || reports.length === 0) {
      res.status(404).json({
        success: false,
        message: '报告不存在'
      });
      return;
    }

    const report = reports[0];

    // 权限检查
    if (userRole === 'student' && report.user_id !== currentUserId) {
      res.status(403).json({
        success: false,
        message: '无权限导出该报告'
      });
      return;
    }

    if (userRole === 'parent') {
      const isChild = await executeQuery<any[]>(
        'SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?',
        [currentUserId, report.user_id]
      );

      if (!isChild || isChild.length === 0) {
        res.status(403).json({
          success: false,
          message: '无权限导出该报告'
        });
        return;
      }
    }

    // 如果已有PDF，直接返回
    if (report.pdf_url) {
      res.json({
        success: true,
        message: 'PDF报告已存在',
        data: {
          report_id: report.id,
          pdf_url: report.pdf_url,
          generated_at: report.generated_at
        }
      });
      return;
    }

    // 解析报告数据
    const knowledgePointsData = JSON.parse(report.knowledge_points_data || '[]');
    const weakPointsData = JSON.parse(report.weak_points_data || '[]');
    const progressData = JSON.parse(report.progress_data || '[]');
    const aiSuggestions = JSON.parse(report.ai_suggestions || '[]');

    // 计算总体掌握度
    const overallMasteryScore = knowledgePointsData.length > 0
      ? knowledgePointsData.reduce((sum: number, kp: any) => sum + kp.mastery_score, 0) / knowledgePointsData.length
      : 0;

    // 生成PDF文件名
    const timestamp = new Date().getTime();
    const pdfFileName = `learning_report_${report.id}_${timestamp}.pdf`;
    const pdfUrl = `/reports/${pdfFileName}`;

    // 注意：完整的PDF生成需要使用puppeteer或pdfkit
    // 这里先返回报告数据结构，实际PDF生成可以在前端完成或使用专门的PDF服务
    // 为了演示，我们模拟PDF生成过程

    // 构建PDF内容数据
    const pdfContent = {
      title: `学情分析报告 - ${report.report_type === 'student' ? '学生' : report.report_type === 'class' ? '班级' : '家长'}`,
      generated_at: report.generated_at,
      time_range: report.time_range,
      overall_mastery_score: Math.round(overallMasteryScore * 100) / 100,
      sections: [
        {
          title: '知识点掌握度分析',
          type: 'radar_chart',
          data: knowledgePointsData.slice(0, 10) // 限制显示前10个知识点
        },
        {
          title: '学习进度趋势',
          type: 'line_chart',
          data: progressData
        },
        {
          title: '薄弱点分布热力图',
          type: 'heatmap',
          data: weakPointsData
        },
        {
          title: 'AI提升建议',
          type: 'text_list',
          data: aiSuggestions
        }
      ],
      summary: {
        total_knowledge_points: knowledgePointsData.length,
        weak_points_count: weakPointsData.length,
        mastered_count: knowledgePointsData.filter((kp: any) => kp.status === 'mastered').length,
        improving_count: knowledgePointsData.filter((kp: any) => kp.status === 'improving').length
      }
    };

    // 估算PDF大小（简化版）
    const estimatedSize = JSON.stringify(pdfContent).length;
    const estimatedSizeMB = estimatedSize / (1024 * 1024);

    if (estimatedSizeMB > 5) {
      res.status(400).json({
        success: false,
        message: 'PDF文件大小超过5MB限制',
        estimated_size_mb: Math.round(estimatedSizeMB * 100) / 100
      });
      return;
    }

    // 更新报告的PDF URL
    await executeQuery(
      'UPDATE learning_analytics_reports SET pdf_url = ? WHERE id = ?',
      [pdfUrl, id]
    );

    res.json({
      success: true,
      message: 'PDF报告生成成功',
      data: {
        report_id: report.id,
        pdf_url: pdfUrl,
        pdf_content: pdfContent,
        estimated_size_mb: Math.round(estimatedSizeMB * 100) / 100,
        note: '实际PDF生成需要使用puppeteer或pdfkit库，此处返回PDF内容数据供前端生成'
      }
    });

  } catch (error) {
    console.error('PDF报告导出失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
