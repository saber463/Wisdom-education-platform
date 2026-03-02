/**
 * 数据库同步服务
 * 负责MySQL和MongoDB之间的数据同步
 * Requirements: 6.8, 21.19
 */

import { executeQuery } from '../config/database.js';
import { VideoProgress } from '../models/mongodb/video-progress.model.js';
import { UserBehavior } from '../models/mongodb/user-behaviors.model.js';
import { Recommendation } from '../models/mongodb/recommendations.model.js';

export interface SyncResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ConsistencyCheckResult {
  consistent: boolean;
  issues: Array<{
    type: string;
    description: string;
    affectedRecords: number;
  }>;
  timestamp: Date;
}

export class DatabaseSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5分钟

  startAutoSync(): void {
    if (this.syncInterval) {
      console.log('自动同步已在运行中');
      return;
    }

    console.log('启动数据库自动同步服务...');
    this.syncAll().catch(error => console.error('初始同步失败:', error));

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAll();
      } catch (error) {
        console.error('定期同步失败:', error);
      }
    }, this.SYNC_INTERVAL_MS);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('自动同步已停止');
    }
  }

  async syncAll(): Promise<SyncResult[]> {
    console.log('开始执行数据库同步...');
    const results: SyncResult[] = [];

    try {
      results.push(await this.syncCourseStatistics());
      results.push(await this.syncLearningPathStatistics());
      results.push(await this.syncResourceStatistics());
      results.push(await this.syncUserProgress());
      console.log('数据库同步完成');
      return results;
    } catch (error) {
      console.error('数据库同步失败:', error);
      throw error;
    }
  }

  async syncUserToMongoDB(mysqlUserId: number): Promise<SyncResult> {
    try {
      const existingBehavior = await UserBehavior.findOne({ user_id: mysqlUserId });

      if (!existingBehavior) {
        await UserBehavior.create({
          user_id: mysqlUserId,
          behavior_type: 'register',
          target_type: 'system',
          target_id: 0,
          metadata: { source: 'registration' },
          timestamp: new Date(),
          session_id: `session_${mysqlUserId}_${Date.now()}`,
          ip_address: '0.0.0.0',
          user_agent: 'system'
        });
        console.log(`用户 ${mysqlUserId} 已同步到MongoDB`);
      }

      return {
        success: true,
        message: `用户 ${mysqlUserId} 同步成功`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `同步用户失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }

  async syncCourseStatistics(): Promise<SyncResult> {
    try {
      const completionStats = await UserBehavior.aggregate([
        { $match: { behavior_type: 'complete', target_type: 'course' } },
        {
          $group: {
            _id: '$target_id',
            total_students: { $addToSet: '$user_id' },
            total_completions: { $sum: 1 }
          }
        }
      ]);

      const viewStats = await UserBehavior.aggregate([
        { $match: { behavior_type: 'view', target_type: 'course' } },
        { $group: { _id: '$target_id', view_count: { $sum: 1 } } }
      ]);

      let updatedCount = 0;
      for (const stat of completionStats) {
        await executeQuery(
          'UPDATE courses SET total_students = ? WHERE id = ?',
          [stat.total_students.length, stat._id]
        );
        updatedCount++;
      }

      for (const stat of viewStats) {
        await executeQuery(
          'UPDATE courses SET view_count = view_count + ? WHERE id = ?',
          [stat.view_count, stat._id]
        );
      }

      return {
        success: true,
        message: `课程统计同步成功，更新了 ${updatedCount} 个课程`,
        details: { updatedCount },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `同步课程统计失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }

  async syncLearningPathStatistics(): Promise<SyncResult> {
    try {
      const pathViews = await UserBehavior.aggregate([
        { $match: { behavior_type: 'view', target_type: 'learning_path' } },
        { $group: { _id: '$target_id', view_count: { $sum: 1 } } }
      ]);

      const pathEnrollments = await UserBehavior.aggregate([
        { $match: { behavior_type: 'enroll', target_type: 'learning_path' } },
        { $group: { _id: '$target_id', enrollment_count: { $sum: 1 } } }
      ]);

      let updatedCount = 0;
      for (const stat of pathViews) {
        await executeQuery(
          'UPDATE learning_paths SET view_count = ? WHERE id = ?',
          [stat.view_count, stat._id]
        );
        updatedCount++;
      }

      for (const stat of pathEnrollments) {
        await executeQuery(
          'UPDATE learning_paths SET enrollment_count = ? WHERE id = ?',
          [stat.enrollment_count, stat._id]
        );
      }

      return {
        success: true,
        message: `学习路径统计同步成功，更新了 ${updatedCount} 个路径`,
        details: { updatedCount },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `同步学习路径统计失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }

  async syncResourceStatistics(): Promise<SyncResult> {
    try {
      const resourceViews = await UserBehavior.aggregate([
        { $match: { behavior_type: 'view', target_type: 'resource' } },
        { $group: { _id: '$target_id', view_count: { $sum: 1 } } }
      ]);

      const resourceLikes = await UserBehavior.aggregate([
        { $match: { behavior_type: 'like', target_type: 'resource' } },
        { $group: { _id: '$target_id', like_count: { $sum: 1 } } }
      ]);

      let updatedCount = 0;
      for (const stat of resourceViews) {
        await executeQuery(
          'UPDATE learning_resources SET view_count = ? WHERE id = ?',
          [stat.view_count, stat._id]
        );
        updatedCount++;
      }

      for (const stat of resourceLikes) {
        await executeQuery(
          'UPDATE learning_resources SET like_count = ? WHERE id = ?',
          [stat.like_count, stat._id]
        );
      }

      return {
        success: true,
        message: `资源统计同步成功，更新了 ${updatedCount} 个资源`,
        details: { updatedCount },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `同步资源统计失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }

  async syncUserProgress(): Promise<SyncResult> {
    try {
      const videoProgressRecords = await VideoProgress.find({ is_completed: true });
      let updatedCount = 0;

      for (const progress of videoProgressRecords) {
        await executeQuery(
          `UPDATE learning_progress 
           SET completed_steps = JSON_ARRAY_APPEND(
             COALESCE(completed_steps, '[]'), '$', ?
           )
           WHERE user_id = ? 
           AND learning_path_id IN (
             SELECT learning_path_id FROM learning_path_steps WHERE resource_id = ?
           )`,
          [progress.lesson_id, progress.user_id, progress.lesson_id]
        );
        updatedCount++;
      }

      return {
        success: true,
        message: `用户进度同步成功，更新了 ${updatedCount} 条记录`,
        details: { updatedCount },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `同步用户进度失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }

  async checkDataConsistency(): Promise<ConsistencyCheckResult> {
    const issues: Array<{ type: string; description: string; affectedRecords: number }> = [];

    try {
      const mysqlUsers = await executeQuery<Array<{ id: number }>>('SELECT id FROM users');
      const mysqlUserIds = new Set(mysqlUsers.map(u => u.id));
      const mongoUserBehaviors = await UserBehavior.distinct('user_id');
      const mongoUserIds = new Set(mongoUserBehaviors);

      const missingInMongo = Array.from(mysqlUserIds).filter(id => !mongoUserIds.has(id));
      if (missingInMongo.length > 0) {
        issues.push({
          type: 'missing_users_in_mongodb',
          description: `${missingInMongo.length} 个用户在MongoDB中缺失`,
          affectedRecords: missingInMongo.length
        });

        for (const userId of missingInMongo) {
          await this.syncUserToMongoDB(userId);
        }
      }

      const courses = await executeQuery<Array<{ id: number; total_students: number }>>(
        'SELECT id, total_students FROM courses'
      );

      for (const course of courses) {
        const uniqueStudents = await UserBehavior.distinct('user_id', {
          behavior_type: 'complete',
          target_type: 'course',
          target_id: course.id
        });

        if (uniqueStudents.length !== course.total_students) {
          issues.push({
            type: 'course_statistics_mismatch',
            description: `课程 ${course.id} 的学生数不一致: MySQL=${course.total_students}, MongoDB=${uniqueStudents.length}`,
            affectedRecords: 1
          });
        }
      }

      return {
        consistent: issues.length === 0,
        issues,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('数据一致性检查失败:', error);
      throw error;
    }
  }

  async manualSync(): Promise<{
    syncResults: SyncResult[];
    consistencyCheck: ConsistencyCheckResult;
  }> {
    console.log('开始手动同步...');
    const syncResults = await this.syncAll();
    const consistencyCheck = await this.checkDataConsistency();
    console.log('手动同步完成');
    return { syncResults, consistencyCheck };
  }

  async cleanupOldData(daysToKeep: number = 30): Promise<SyncResult> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const behaviorResult = await UserBehavior.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      const recommendationResult = await Recommendation.deleteMany({
        expires_at: { $lt: new Date() }
      });

      return {
        success: true,
        message: `数据清理成功`,
        details: {
          behaviorRecordsDeleted: behaviorResult.deletedCount,
          recommendationsDeleted: recommendationResult.deletedCount
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `数据清理失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }
}

export const databaseSyncService = new DatabaseSyncService();
