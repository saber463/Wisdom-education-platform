import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initEncodingFix, logger } from './utils/encoding-fix.js';
import { testConnection } from './config/database.js';
import { initRedisClient } from './config/redis.js';
import { startAIHealthCheck, getAIServiceStatus, getAIServiceStats } from './services/ai-service-manager.js';
import { performanceMonitor, compressionMiddleware, cacheHeaders } from './middleware/performance.js';

// 初始化编码修复（必须在最开始）
initEncodingFix();
import authRoutes from './routes/auth.js';
import assignmentRoutes from './routes/assignments.js';
import uploadRoutes from './routes/upload.js';
import gradingRoutes from './routes/grading.js';
import analyticsRoutes from './routes/analytics.js';
import tieredTeachingRoutes from './routes/tiered-teaching.js';
import recommendationsRoutes from './routes/recommendations.js';
import resourceRecommendationsRoutes from './routes/resource-recommendations.js';
import qaRoutes from './routes/qa.js';
import learningAnalyticsReportsRoutes from './routes/learning-analytics-reports.js';
import offlineRoutes from './routes/offline.js';
import teamsRoutes from './routes/teams.js';
import speechAssessmentRoutes from './routes/speech-assessment.js';
import coursesRoutes from './routes/courses.js';
import classesRoutes from './routes/classes.js';
import videoProgressRoutes from './routes/video-progress.js';
import userInterestsRoutes from './routes/user-interests.js';
import aiLearningPathRoutes from './routes/ai-learning-path.js';
import virtualPartnerRoutes from './routes/virtual-partner.js';
import videoQuizRoutes from './routes/video-quiz.js';
import parentRoutes from './routes/parent.js';
// V2.0 新增路由
import faceVerifyRoutes from './routes/face-verify.js';
import codeAnalysisRoutes from './routes/code-analysis.js';
import pushRoutes from './routes/push-routes.js';

import { authenticateToken, requireRole } from './middleware/auth.js';
import { executeQuery } from './config/database.js';

// 加载环境变量
dotenv.config();

const app = express();

// 中间件配置
app.use(cors());
app.use(compressionMiddleware); // 性能优化：响应压缩（必须在其他中间件之前）
app.use(performanceMonitor); // 性能优化：性能监控
app.use(cacheHeaders); // 性能优化：缓存头
app.use(express.json({ limit: '10mb' })); // 性能优化：限制请求体大小
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查接口
app.get('/health', (_req, res) => {
  const aiStatus = getAIServiceStatus();
  const aiStats = getAIServiceStats();
  
  res.json({
    status: 'ok',
    message: '智慧教育学习平台后端服务运行中',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'ok',
      ai: {
        status: aiStatus.isAvailable ? 'ok' : 'degraded',
        lastCheckTime: aiStatus.lastCheckTime,
        consecutiveFailures: aiStatus.consecutiveFailures,
        lastSuccessTime: aiStatus.lastSuccessTime,
        lastFailureTime: aiStatus.lastFailureTime
      }
    },
    statistics: {
      ai: aiStats
    }
  });
});

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tiered-teaching', tieredTeachingRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/resource-recommendations', resourceRecommendationsRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/analytics/reports', learningAnalyticsReportsRoutes);
app.use('/api/offline', offlineRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/speech', speechAssessmentRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/classes', classesRoutes);  // Must be before app.use('/api', coursesRoutes) to avoid wildcard clash
app.use('/api', coursesRoutes); // For /api/branches/:id/lessons routes
app.use('/api/video-progress', videoProgressRoutes);
// Teacher dashboard — must be registered BEFORE /api/teacher -> videoProgressRoutes (which has /:lessonId wildcard)
app.get('/api/teacher/dashboard', authenticateToken, requireRole('teacher'), async (req: any, res: any): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const [totalsRows, studentsRows, recent] = await Promise.all([
      executeQuery<any[]>(
        `SELECT
           COUNT(*) AS totalAssignments,
           SUM(CASE WHEN status='graded' THEN 1 ELSE 0 END) AS gradedCount,
           SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS pendingCount
         FROM assignments WHERE teacher_id = ?`,
        [teacherId]
      ),
      executeQuery<any[]>(
        `SELECT COUNT(DISTINCT cp.user_id) AS totalStudents
         FROM course_purchases cp
         JOIN courses c ON cp.course_id = c.id
         WHERE c.teacher_id = ?`,
        [teacherId]
      ),
      executeQuery<any[]>(
        `SELECT id, title, status FROM assignments WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 5`,
        [teacherId]
      ),
    ]);
    res.json({
      totalAssignments: totalsRows?.[0]?.totalAssignments || 0,
      gradedCount:      totalsRows?.[0]?.gradedCount || 0,
      pendingCount:     totalsRows?.[0]?.pendingCount || 0,
      totalStudents:    studentsRows?.[0]?.totalStudents || 0,
      recentAssignments: recent || [],
    });
  } catch {
    res.json({ totalAssignments: 0, gradedCount: 0, pendingCount: 0, totalStudents: 0, recentAssignments: [] });
  }
});
app.use('/api/teacher', videoProgressRoutes); // For teacher endpoints
app.use('/api/user-interests', userInterestsRoutes);
app.use('/api/ai-learning-path', aiLearningPathRoutes);
app.use('/api/virtual-partner', virtualPartnerRoutes);
app.use('/api/video-quiz', videoQuizRoutes);
// Parent dashboard — must be before /api/parent to avoid route conflicts
app.get('/api/parent/dashboard', authenticateToken, requireRole('parent'), async (req: any, res: any): Promise<void> => {
  try {
    const parentId = req.user?.id;
    const children = await executeQuery<any[]>(
      `SELECT u.id, u.username, u.real_name AS name FROM parent_children pc
       JOIN users u ON pc.child_id = u.id WHERE pc.parent_id = ?`,
      [parentId]
    );
    res.json({
      children: children || [],
      latestScore: null, classRank: null, averageScore: null,
      weakPointCount: 0, recentResults: [], notifications: [], unreadCount: 0,
    });
  } catch {
    res.json({ children: [], latestScore: null, classRank: null, averageScore: null,
      weakPointCount: 0, recentResults: [], notifications: [], unreadCount: 0 });
  }
});
app.use('/api/parent', parentRoutes);
// V2.0 新增路由注册
app.use('/api/face', faceVerifyRoutes);
app.use('/api/code-analysis', codeAnalysisRoutes);
app.use('/api/push', pushRoutes);

// 端口检测函数 - 修改为严格模式
async function findAvailablePort(startPort: number, _maxAttempts: number = 1): Promise<number> {
  const net = await import('net');
  
  const port = startPort;
  await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用，请先停止占用该端口的进程`));
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(port);
    });
    
    server.listen(port);
  });
  
  return port;
}

// 优雅关闭函数
async function gracefulShutdown(signal: string, server?: import('http').Server) {
  logger.warn(`收到 ${signal} 信号，开始优雅关闭...`);
  
  // 设置超时强制退出
  const forceExitTimer = setTimeout(() => {
    logger.error('优雅关闭超时（10秒），强制退出');
    process.exit(1);
  }, 10000);
  
  try {
    // 停止接受新请求
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info('HTTP服务器已关闭');
          resolve();
        });
      });
    }
    
    // 关闭数据库连接
    const { closePool } = await import('./config/database.js');
    await closePool();
    logger.info('数据库连接已关闭');
    
    // 关闭Redis连接
    const { closeRedisClient } = await import('./config/redis.js');
    await closeRedisClient();
    logger.info('Redis连接已关闭');
    
    clearTimeout(forceExitTimer);
    logger.info('优雅关闭完成');
    process.exit(0);
  } catch (error) {
    logger.error(`优雅关闭失败: ${error instanceof Error ? error.message : String(error)}`);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

// 启动服务器
async function startServer() {
  let server: import('http').Server | undefined;
  
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('数据库连接失败，但服务器将继续启动');
    }
    
    // 初始化Redis客户端（可选，失败不影响服务启动）
    await initRedisClient();
    
    // 启动AI服务健康检查
    logger.info('启动AI服务健康检查...');
    startAIHealthCheck();
    
    // 查找可用端口（严格模式）
    const defaultPort = parseInt(process.env.PORT || '3000');
    const availablePort = await findAvailablePort(defaultPort);
    
    server = app.listen(availablePort, () => {
      logger.success(`后端服务已启动，端口: ${availablePort}`);
      logger.info(`认证接口: http://localhost:${availablePort}/api/auth/login`);
      logger.info(`健康检查: http://localhost:${availablePort}/health`);
    });
    
    // 全局异常捕获
    process.on('uncaughtException', (error: Error) => {
      logger.error(`未捕获的异常: ${error.message}`);
      logger.error(`堆栈信息: ${error.stack}`);
      gracefulShutdown('uncaughtException', server);
    });
    
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error(`未处理的Promise拒绝: ${reason}`);
      logger.error(`Promise: ${promise}`);
      gracefulShutdown('unhandledRejection', server);
    });
    
    // 监听SIGTERM和SIGINT信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
    
  } catch (error) {
    logger.error(`服务器启动失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

startServer();

export default app;
