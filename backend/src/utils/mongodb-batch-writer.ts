/**
 * MongoDB批量写入优化工具
 * 实现视频进度批量写入优化
 * Requirements: 性能要求
 * Task: 20
 */

import { connectMongoDB } from '../config/mongodb.js';
import { VideoProgress } from '../models/mongodb/video-progress.model.js';

interface BatchWriteItem {
  user_id: number;
  lesson_id: number;
  video_url: string;
  current_position: number;
  duration: number;
  progress_percentage: number;
  watch_count: number;
  total_watch_time: number;
  playback_speed: number;
  is_completed: boolean;
  completed_at?: Date;
  pause_positions?: any[];
  heat_map?: any[];
}

class MongoDBBatchWriter {
  private batch: BatchWriteItem[] = [];
  private batchSize: number = 50; // 每批50条
  private flushInterval: number = 5000; // 5秒刷新一次
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startTimer();
  }

  /**
   * 添加写入项到批次
   */
  add(item: BatchWriteItem): void {
    this.batch.push(item);

    // 如果批次已满，立即刷新
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * 刷新批次（批量写入）
   */
  async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const itemsToWrite = [...this.batch];
    this.batch = [];

    try {
      await connectMongoDB();

      // 使用bulkWrite进行批量操作
      const operations = itemsToWrite.map(item => ({
        updateOne: {
          filter: {
            user_id: item.user_id,
            lesson_id: item.lesson_id
          },
          update: {
            $set: {
              video_url: item.video_url,
              current_position: item.current_position,
              duration: item.duration,
              progress_percentage: item.progress_percentage,
              playback_speed: item.playback_speed,
              is_completed: item.is_completed,
              completed_at: item.completed_at,
              updated_at: new Date()
            },
            $inc: {
              watch_count: item.watch_count,
              total_watch_time: item.total_watch_time
            },
            $setOnInsert: {
              pause_positions: item.pause_positions || [],
              heat_map: item.heat_map || [],
              created_at: new Date()
            }
          },
          upsert: true
        }
      }));

      await VideoProgress.bulkWrite(operations, { ordered: false });

      console.log(`[批量写入] 成功写入${itemsToWrite.length}条视频进度记录`);
    } catch (error) {
      console.error('批量写入失败:', error);
      // 失败时重新加入批次，下次重试
      this.batch.unshift(...itemsToWrite);
    }
  }

  /**
   * 启动定时器
   */
  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * 停止定时器并刷新剩余数据
   */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}

// 单例实例
let batchWriter: MongoDBBatchWriter | null = null;

/**
 * 获取批量写入器实例
 */
export function getBatchWriter(): MongoDBBatchWriter {
  if (!batchWriter) {
    batchWriter = new MongoDBBatchWriter();
  }
  return batchWriter;
}

/**
 * 优雅关闭批量写入器
 */
export async function closeBatchWriter(): Promise<void> {
  if (batchWriter) {
    await batchWriter.stop();
    batchWriter = null;
  }
}

