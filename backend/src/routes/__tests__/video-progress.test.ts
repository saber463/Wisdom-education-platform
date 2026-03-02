/**
 * 视频追踪性能测试
 * 测试高频写入性能和热力图聚合查询性能
 * 需求：4.1
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { VideoProgress } from '../../models/mongodb/video-progress.model.js';
import { connectMongoDB, closeMongoConnection } from '../../config/mongodb.js';

describe('视频追踪性能测试', () => {
  let isMongoConnected = false;

  beforeAll(async () => {
    try {
      // 连接到测试数据库
      await connectMongoDB();
      isMongoConnected = true;
    } catch (error) {
      console.warn('MongoDB连接失败，跳过性能测试:', error);
      isMongoConnected = false;
    }
  });

  afterAll(async () => {
    if (isMongoConnected) {
      try {
        // 清理测试数据
        await VideoProgress.deleteMany({ user_id: { $gte: 90000 } });
        // 关闭数据库连接
        await closeMongoConnection();
      } catch (error) {
        console.warn('清理测试数据失败:', error);
      }
    }
  });

  beforeEach(async () => {
    if (!isMongoConnected) {
      return;
    }
    // 清理之前的测试数据
    await VideoProgress.deleteMany({ user_id: { $gte: 90000 } });
  });

  describe('高频写入性能测试（每5秒）', () => {
    it('应该能够在100ms内完成单次进度记录', async () => {
      if (!isMongoConnected) {
        console.log('跳过测试：MongoDB未连接');
        return;
      }

      const userId = 90001;
      const lessonId = 1;
      const videoUrl = 'https://example.com/test-video.mp4';
      const duration = 600; // 10分钟视频

      const startTime = Date.now();

      // 模拟记录视频进度
      const videoProgress = new VideoProgress({
        user_id: userId,
        lesson_id: lessonId,
        video_url: videoUrl,
        current_position: 30,
        duration: duration,
        progress_percentage: 5,
        watch_count: 1,
        total_watch_time: 5,
        playback_speed: 1.0,
        pause_positions: [],
        heat_map: [{
          start: 30,
          end: 40,
          count: 1
        }],
        is_completed: false,
        last_watched_at: new Date()
      });

      await videoProgress.save();

      const endTime = Date.now();
      const duration_ms = endTime - startTime;

      console.log(`单次进度记录耗时: ${duration_ms}ms`);
      expect(duration_ms).toBeLessThan(100);
    });

    it('应该能够在5秒内完成100次连续进度更新', async () => {
      if (!isMongoConnected) {
        console.log('跳过测试：MongoDB未连接');
        return;
      }

      const userId = 90002;
      const lessonId = 2;
      const videoUrl = 'https://example.com/test-video-2.mp4';
      const duration = 600;

      // 创建初始记录
      const videoProgress = new VideoProgress({
        user_id: userId,
        lesson_id: lessonId,
        video_url: videoUrl,
        current_position: 0,
        duration: duration,
        progress_percentage: 0,
        watch_count: 1,
        total_watch_time: 0,
        playback_speed: 1.0,
        pause_positions: [],
        heat_map: [],
        is_completed: false,
        last_watched_at: new Date()
      });

      await videoProgress.save();

      const startTime = Date.now();

      // 模拟100次进度更新（每5秒一次，相当于500秒的观看）
      for (let i = 1; i <= 100; i++) {
        const currentPosition = i * 5;
        const progressPercentage = Math.min(100, Math.round((currentPosition / duration) * 100));

        videoProgress.current_position = currentPosition;
        videoProgress.progress_percentage = progressPercentage;
        videoProgress.total_watch_time += 5;
        videoProgress.last_watched_at = new Date();

        // 更新热力图
        const segmentStart = Math.floor(currentPosition / 10) * 10;
        const segmentEnd = segmentStart + 10;
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

        await videoProgress.save();
      }

      const endTime = Date.now();
      const duration_ms = endTime - startTime;

      console.log(`100次连续进度更新总耗时: ${duration_ms}ms`);
      console.log(`平均每次更新耗时: ${duration_ms / 100}ms`);
      
      expect(duration_ms).toBeLessThan(5000); // 5秒内完成
      expect(videoProgress.progress_percentage).toBeGreaterThan(80);
    });
  });

  describe('热力图聚合查询性能测试', () => {
    beforeEach(async () => {
      if (!isMongoConnected) {
        return;
      }

      // 准备测试数据：创建50个学生的视频进度记录
      const lessonId = 100;
      const videoUrl = 'https://example.com/test-video-heatmap.mp4';
      const duration = 600;

      const promises = [];
      for (let i = 0; i < 50; i++) {
        const userId = 90100 + i;
        
        // 生成随机的热力图数据（模拟不同学生的观看模式）
        const heatMap = [];
        for (let j = 0; j < 60; j++) {
          const start = j * 10;
          const end = start + 10;
          const count = Math.floor(Math.random() * 5) + 1; // 1-5次观看
          heatMap.push({ start, end, count });
        }

        const promise = VideoProgress.create({
          user_id: userId,
          lesson_id: lessonId,
          video_url: videoUrl,
          current_position: Math.floor(Math.random() * duration),
          duration: duration,
          progress_percentage: Math.floor(Math.random() * 100),
          watch_count: Math.floor(Math.random() * 3) + 1,
          total_watch_time: Math.floor(Math.random() * duration),
          playback_speed: 1.0,
          pause_positions: [],
          heat_map: heatMap,
          is_completed: Math.random() > 0.5,
          last_watched_at: new Date()
        });

        promises.push(promise);
      }

      await Promise.all(promises);
    });

    it('应该能够在500ms内聚合50个学生的热力图数据', async () => {
      if (!isMongoConnected) {
        console.log('跳过测试：MongoDB未连接');
        return;
      }

      const lessonId = 100;

      const startTime = Date.now();

      // 查询所有学生的进度记录
      const progressList = await VideoProgress.find({ lesson_id: lessonId }).lean();

      // 聚合热力图数据
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

      const heatMapArray = Array.from(aggregatedHeatMap.values())
        .sort((a, b) => a.start - b.start);

      const endTime = Date.now();
      const duration_ms = endTime - startTime;

      console.log(`聚合50个学生的热力图数据耗时: ${duration_ms}ms`);
      console.log(`热力图片段数量: ${heatMapArray.length}`);
      console.log(`学生数量: ${progressList.length}`);

      expect(duration_ms).toBeLessThan(500);
      expect(progressList.length).toBe(50);
      expect(heatMapArray.length).toBeGreaterThan(0);
    });
  });
});
