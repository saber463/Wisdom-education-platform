/**
 * 视频学习追踪路由模块
 * 实现视频进度记录和查询功能
 * 需求：4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { VideoProgress, IVideoProgress } from '../models/mongodb/video-progress.model.js';

const router = Router();

// 所有视频进度路由都需要认证
router.use(authenticateToken);

interface RecordProgressRequest {
  lesson_id: number;
  video_url: string;
  current_position: number;
  duration: number;
  playback_speed?: number;
  pause_position?: number;
  pause_duration?: number;
}

interface VideoProgressResponse {
  user_id: number;
  lesson_id: number;
  video_url: string;
  current_position: number;
  duration: number;
  progress_percentage: number;
  watch_count: number;
  total_watch_time: number;
  playback_speed: number;
  pause_positions: Array<{
    position: number;
    pause_duration: number;
    timestamp: Date;
  }>;
  heat_map: Array<{
    start: number;
    end: number;
    count: number;
  }>;
  is_completed: boolean;
  completed_at?: Date;
  last_watched_at: Date;
}

/**
 * POST /api/video-progress/record
 * 记录视频进度（每5秒调用一次）
 * 
 * 请求体：
 * {
 *   "lesson_id": 1,
 *   "video_url": "https://example.com/video.mp4",
 *   "current_position": 120,  // 当前播放位置（秒）
 *   "duration": 600,           // 视频总时长（秒）
 *   "playback_speed": 1.0,     // 播放速度（可选）
 *   "pause_position": 100,     // 暂停位置（可选）
 *   "pause_duration": 5        // 暂停时长（可选）
 * }
 * 
 * 需求：4.1, 4.2, 4.3
 */
router.post('/record', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        code: 401,
        msg: '用户未登录',
        data: null
      });
      return;
    }

    const {
      lesson_id,
      video_url,
      current_position,
      duration,
      playback_speed = 1.0,
      pause_position,
      pause_duration
    } = req.body as RecordProgressRequest;

    // 参数校验
    if (!lesson_id || !video_url || current_position === undefined || !duration) {
      console.error(`[${new Date().toISOString()}] 参数校验失败: 缺少必填字段`, {
        body: req.body,
        userId
      });
      res.status(400).json({
        code: 400,
        msg: '缺少必填字段：lesson_id, video_url, current_position, duration',
        data: null
      });
      return;
    }

    // 验证数值参数
    if (current_position < 0 || duration <= 0 || playback_speed <= 0) {
      res.status(400).json({
        code: 400,
        msg: '无效的参数值',
        data: null
      });
      return;
    }

    // 计算进度百分比
    const progress_percentage = Math.min(100, Math.round((current_position / duration) * 100));
    const is_completed = progress_percentage >= 95; // 观看95%以上视为完成

    // 查找或创建视频进度记录
    let videoProgress = await VideoProgress.findOne({
      user_id: userId,
      lesson_id: lesson_id
    });

    if (videoProgress) {
      // 更新现有记录
      
      // 更新基本信息
      videoProgress.current_position = current_position;
      videoProgress.duration = duration;
      videoProgress.progress_percentage = progress_percentage;
      videoProgress.playback_speed = playback_speed;
      videoProgress.last_watched_at = new Date();

      // 如果是第一次观看到这个位置，增加观看次数
      if (current_position > videoProgress.current_position) {
        videoProgress.total_watch_time += 5; // 每5秒记录一次
      }

      // 如果有暂停信息，记录暂停位置
      if (pause_position !== undefined && pause_duration !== undefined) {
        videoProgress.pause_positions.push({
          position: pause_position,
          pause_duration: pause_duration,
          timestamp: new Date()
        });

        // 限制暂停位置记录数量（最多保留最近100条）
        if (videoProgress.pause_positions.length > 100) {
          videoProgress.pause_positions = videoProgress.pause_positions.slice(-100);
        }
      }

      // 更新热力图数据（记录哪些部分被重复观看）
      const segmentSize = 10; // 每10秒为一个片段
      const segmentIndex = Math.floor(current_position / segmentSize);
      const segmentStart = segmentIndex * segmentSize;
      const segmentEnd = segmentStart + segmentSize;

      const existingSegment = videoProgress.heat_map.find(
        h => h.start === segmentStart && h.end === segmentEnd
      );

      if (existingSegment) {
        existingSegment.count += 1;
      } else {
        videoProgress.heat_map.push({
          start: segmentStart,
          end: segmentEnd,
          count: 1
        });
      }

      // 如果完成了视频，记录完成时间
      if (is_completed && !videoProgress.is_completed) {
        videoProgress.is_completed = true;
        videoProgress.completed_at = new Date();
        
        // 检查是否完成整个课程（所有课节都完成），奖励积分
        // 这里需要查询课程ID，暂时跳过，后续在课程完成时统一处理
      }

      await videoProgress.save();

    } else {
      // 创建新记录
      videoProgress = new VideoProgress({
        user_id: userId,
        lesson_id: lesson_id,
        video_url: video_url,
        current_position: current_position,
        duration: duration,
        progress_percentage: progress_percentage,
        watch_count: 1,
        total_watch_time: 5,
        playback_speed: playback_speed,
        pause_positions: pause_position !== undefined && pause_duration !== undefined ? [{
          position: pause_position,
          pause_duration: pause_duration,
          timestamp: new Date()
        }] : [],
        heat_map: [{
          start: Math.floor(current_position / 10) * 10,
          end: Math.floor(current_position / 10) * 10 + 10,
          count: 1
        }],
        is_completed: is_completed,
        completed_at: is_completed ? new Date() : undefined,
        last_watched_at: new Date()
      });

      await videoProgress.save();
    }

    const duration_ms = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 视频进度记录成功`, {
      userId,
      lessonId: lesson_id,
      position: current_position,
      progress: progress_percentage,
      duration: `${duration_ms}ms`
    });

    res.json({
      code: 200,
      msg: '进度记录成功',
      data: {
        progress_percentage: videoProgress.progress_percentage,
        is_completed: videoProgress.is_completed,
        total_watch_time: videoProgress.total_watch_time
      }
    });

  } catch (error) {
    const duration_ms = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 视频进度记录失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
      userId: req.user?.id,
      duration: `${duration_ms}ms`
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误，请稍后重试',
      data: null
    });
  }
});

/**
 * GET /api/video-progress/:lessonId
 * 获取指定课节的视频进度
 * 
 * 需求：4.1, 4.2
 */
router.get('/:lessonId', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    const { lessonId } = req.params;

    if (!userId) {
      res.status(401).json({
        code: 401,
        msg: '用户未登录',
        data: null
      });
      return;
    }

    // 参数校验
    if (!lessonId || isNaN(parseInt(lessonId))) {
      res.status(400).json({
        code: 400,
        msg: '无效的课节ID',
        data: null
      });
      return;
    }

    // 查询视频进度
    const videoProgress = await VideoProgress.findOne({
      user_id: userId,
      lesson_id: parseInt(lessonId)
    });

    if (!videoProgress) {
      res.json({
        code: 200,
        msg: '暂无观看记录',
        data: null
      });
      return;
    }

    const duration_ms = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 视频进度查询成功`, {
      userId,
      lessonId,
      progress: videoProgress.progress_percentage,
      duration: `${duration_ms}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        user_id: videoProgress.user_id,
        lesson_id: videoProgress.lesson_id,
        video_url: videoProgress.video_url,
        current_position: videoProgress.current_position,
        duration: videoProgress.duration,
        progress_percentage: videoProgress.progress_percentage,
        watch_count: videoProgress.watch_count,
        total_watch_time: videoProgress.total_watch_time,
        playback_speed: videoProgress.playback_speed,
        is_completed: videoProgress.is_completed,
        completed_at: videoProgress.completed_at,
        last_watched_at: videoProgress.last_watched_at
      }
    });

  } catch (error) {
    const duration_ms = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 视频进度查询失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
      userId: req.user?.id,
      duration: `${duration_ms}ms`
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误，请稍后重试',
      data: null
    });
  }
});

export default router;

/**
 * GET /api/teacher/video-progress/:studentId
 * 教师查看学生的视频学习进度
 * 
 * 查询参数：
 * - lesson_id: 课节ID（可选，不传则返回所有课节）
 * 
 * 需求：4.5, 4.6, 4.7
 */
router.get('/teacher/video-progress/:studentId', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { studentId } = req.params;
    const { lesson_id } = req.query;

    // 参数校验
    if (!studentId || isNaN(parseInt(studentId))) {
      res.status(400).json({
        code: 400,
        msg: '无效的学生ID',
        data: null
      });
      return;
    }

    // 构建查询条件
    const query: any = { user_id: parseInt(studentId) };
    if (lesson_id) {
      query.lesson_id = parseInt(lesson_id as string);
    }

    // 查询学生的视频进度
    const progressList = await VideoProgress.find(query)
      .sort({ last_watched_at: -1 })
      .lean();

    // 检测异常行为
    const anomalies: Array<{
      lesson_id: number;
      type: 'fast_forward' | 'hanging' | 'excessive_pause';
      description: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const progress of progressList) {
      // 检测快进行为：观看时长远小于视频时长
      const expectedWatchTime = progress.duration * 0.8; // 至少应该观看80%的时长
      if (progress.total_watch_time < expectedWatchTime && progress.progress_percentage > 80) {
        anomalies.push({
          lesson_id: progress.lesson_id,
          type: 'fast_forward',
          description: `观看时长(${progress.total_watch_time}秒)远小于视频时长(${progress.duration}秒)，可能存在快进跳过`,
          severity: 'high'
        });
      }

      // 检测挂机行为：暂停次数过多或暂停时长过长
      const totalPauseDuration = progress.pause_positions.reduce((sum, p) => sum + p.pause_duration, 0);
      if (totalPauseDuration > progress.duration * 0.5) {
        anomalies.push({
          lesson_id: progress.lesson_id,
          type: 'hanging',
          description: `总暂停时长(${totalPauseDuration}秒)超过视频时长的50%，可能存在挂机行为`,
          severity: 'medium'
        });
      }

      // 检测过度暂停：暂停次数过多
      if (progress.pause_positions.length > 20) {
        anomalies.push({
          lesson_id: progress.lesson_id,
          type: 'excessive_pause',
          description: `暂停次数(${progress.pause_positions.length}次)过多，学习专注度可能较低`,
          severity: 'low'
        });
      }
    }

    const duration_ms = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 教师查看学生视频进度成功`, {
      teacherId: req.user?.id,
      studentId,
      lessonId: lesson_id,
      progressCount: progressList.length,
      anomalyCount: anomalies.length,
      duration: `${duration_ms}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        student_id: parseInt(studentId),
        progress_list: progressList.map(p => ({
          lesson_id: p.lesson_id,
          video_url: p.video_url,
          current_position: p.current_position,
          duration: p.duration,
          progress_percentage: p.progress_percentage,
          watch_count: p.watch_count,
          total_watch_time: p.total_watch_time,
          playback_speed: p.playback_speed,
          pause_count: p.pause_positions.length,
          is_completed: p.is_completed,
          completed_at: p.completed_at,
          last_watched_at: p.last_watched_at
        })),
        anomalies: anomalies
      }
    });

  } catch (error) {
    const duration_ms = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 教师查看学生视频进度失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
      query: req.query,
      teacherId: req.user?.id,
      duration: `${duration_ms}ms`
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误，请稍后重试',
      data: null
    });
  }
});

/**
 * GET /api/teacher/video-heatmap/:lessonId
 * 教师查看视频热力图（哪些部分被重复观看）
 * 
 * 查询参数：
 * - class_id: 班级ID（可选，不传则返回所有学生的聚合数据）
 * 
 * 需求：4.6, 4.7
 */
router.get('/teacher/video-heatmap/:lessonId', requireRole('teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { lessonId } = req.params;
    const { class_id } = req.query;

    // 参数校验
    if (!lessonId || isNaN(parseInt(lessonId))) {
      res.status(400).json({
        code: 400,
        msg: '无效的课节ID',
        data: null
      });
      return;
    }

    // 如果指定了班级，先获取班级学生列表
    let studentIds: number[] | undefined;
    if (class_id) {
      const { executeQuery } = await import('../config/database.js');
      const classStudents = await executeQuery<Array<{ user_id: number }>>(
        'SELECT user_id FROM class_students WHERE class_id = ?',
        [parseInt(class_id as string)]
      );
      studentIds = classStudents.map(s => s.user_id);

      if (studentIds.length === 0) {
        res.json({
          code: 200,
          msg: '该班级暂无学生',
          data: {
            lesson_id: parseInt(lessonId),
            heat_map: [],
            student_count: 0
          }
        });
        return;
      }
    }

    // 构建查询条件
    const query: any = { lesson_id: parseInt(lessonId) };
    if (studentIds) {
      query.user_id = { $in: studentIds };
    }

    // 聚合所有学生的热力图数据
    const progressList = await VideoProgress.find(query).lean();

    if (progressList.length === 0) {
      res.json({
        code: 200,
        msg: '暂无观看记录',
        data: {
          lesson_id: parseInt(lessonId),
          heat_map: [],
          student_count: 0
        }
      });
      return;
    }

    // 合并所有学生的热力图数据
    const aggregatedHeatMap = new Map<string, { start: number; end: number; count: number }>();

    for (const progress of progressList) {
      for (const segment of progress.heat_map) {
        const key = `${segment.start}-${segment.end}`;
        const existing = aggregatedHeatMap.get(key);
        
        if (existing) {
          existing.count += segment.count;
        } else {
          aggregatedHeatMap.set(key, {
            start: segment.start,
            end: segment.end,
            count: segment.count
          });
        }
      }
    }

    // 转换为数组并排序
    const heatMapArray = Array.from(aggregatedHeatMap.values())
      .sort((a, b) => a.start - b.start);

    // 计算平均观看次数
    const avgCount = heatMapArray.reduce((sum, h) => sum + h.count, 0) / heatMapArray.length;

    // 标记热点区域（观看次数超过平均值1.5倍）
    const hotspots = heatMapArray
      .filter(h => h.count > avgCount * 1.5)
      .map(h => ({
        start: h.start,
        end: h.end,
        count: h.count,
        intensity: 'high' as const
      }));

    const duration_ms = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 教师查看视频热力图成功`, {
      teacherId: req.user?.id,
      lessonId,
      classId: class_id,
      studentCount: progressList.length,
      hotspotCount: hotspots.length,
      duration: `${duration_ms}ms`
    });

    res.json({
      code: 200,
      msg: '查询成功',
      data: {
        lesson_id: parseInt(lessonId),
        student_count: progressList.length,
        heat_map: heatMapArray,
        hotspots: hotspots,
        statistics: {
          total_segments: heatMapArray.length,
          avg_watch_count: Math.round(avgCount * 100) / 100,
          max_watch_count: Math.max(...heatMapArray.map(h => h.count)),
          min_watch_count: Math.min(...heatMapArray.map(h => h.count))
        }
      }
    });

  } catch (error) {
    const duration_ms = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] 教师查看视频热力图失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
      query: req.query,
      teacherId: req.user?.id,
      duration: `${duration_ms}ms`
    });
    
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误，请稍后重试',
      data: null
    });
  }
});
