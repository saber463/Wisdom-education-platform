/**
 * 数据库同步服务测试
 * Requirements: 6.8, 21.19
 */

import { databaseSyncService, DatabaseSyncService } from '../database-sync.service';
import { executeQuery } from '../../config/database';
import { VideoProgress } from '../../models/mongodb/video-progress.model';
import { UserBehavior } from '../../models/mongodb/user-behaviors.model';
import { Recommendation } from '../../models/mongodb/recommendations.model';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../models/mongodb/video-progress.model');
jest.mock('../../models/mongodb/user-behaviors.model');
jest.mock('../../models/mongodb/recommendations.model');

describe('DatabaseSyncService', () => {
  let service: DatabaseSyncService;

  beforeEach(() => {
    service = new DatabaseSyncService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.stopAutoSync();
  });

  describe('syncUserToMongoDB', () => {
    it('should sync new user to MongoDB', async () => {
      const mockUserId = 123;
      (UserBehavior.findOne as jest.Mock).mockResolvedValue(null);
      (UserBehavior.create as jest.Mock).mockResolvedValue({});

      const result = await service.syncUserToMongoDB(mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('同步成功');
      expect(UserBehavior.findOne).toHaveBeenCalledWith({ user_id: mockUserId });
      expect(UserBehavior.create).toHaveBeenCalled();
    });

    it('should skip existing user in MongoDB', async () => {
      const mockUserId = 123;
      (UserBehavior.findOne as jest.Mock).mockResolvedValue({ user_id: mockUserId });

      const result = await service.syncUserToMongoDB(mockUserId);

      expect(result.success).toBe(true);
      expect(UserBehavior.create).not.toHaveBeenCalled();
    });

    it('should handle sync errors', async () => {
      const mockUserId = 123;
      (UserBehavior.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.syncUserToMongoDB(mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('同步用户失败');
    });
  });

  describe('syncCourseStatistics', () => {
    it('should sync course statistics from MongoDB to MySQL', async () => {
      const mockCompletionStats = [
        { _id: 1, total_students: [101, 102, 103], total_completions: 3 },
        { _id: 2, total_students: [104, 105], total_completions: 2 }
      ];

      const mockViewStats = [
        { _id: 1, view_count: 50 },
        { _id: 2, view_count: 30 }
      ];

      (UserBehavior.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockCompletionStats)
        .mockResolvedValueOnce(mockViewStats);
      (executeQuery as jest.Mock).mockResolvedValue({});

      const result = await service.syncCourseStatistics();

      expect(result.success).toBe(true);
      expect(result.message).toContain('课程统计同步成功');
      expect(result.details?.updatedCount).toBe(2);
      expect(executeQuery).toHaveBeenCalledTimes(4); // 2 for students, 2 for views
    });

    it('should handle sync errors', async () => {
      (UserBehavior.aggregate as jest.Mock).mockRejectedValue(new Error('Aggregation error'));

      const result = await service.syncCourseStatistics();

      expect(result.success).toBe(false);
      expect(result.message).toContain('同步课程统计失败');
    });
  });

  describe('syncLearningPathStatistics', () => {
    it('should sync learning path statistics', async () => {
      const mockPathViews = [
        { _id: 1, view_count: 100 },
        { _id: 2, view_count: 75 }
      ];

      const mockPathEnrollments = [
        { _id: 1, enrollment_count: 20 },
        { _id: 2, enrollment_count: 15 }
      ];

      (UserBehavior.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockPathViews)
        .mockResolvedValueOnce(mockPathEnrollments);
      (executeQuery as jest.Mock).mockResolvedValue({});

      const result = await service.syncLearningPathStatistics();

      expect(result.success).toBe(true);
      expect(result.message).toContain('学习路径统计同步成功');
      expect(result.details?.updatedCount).toBe(2);
    });
  });

  describe('syncResourceStatistics', () => {
    it('should sync resource statistics', async () => {
      const mockResourceViews = [
        { _id: 1, view_count: 200 },
        { _id: 2, view_count: 150 }
      ];

      const mockResourceLikes = [
        { _id: 1, like_count: 50 },
        { _id: 2, like_count: 30 }
      ];

      (UserBehavior.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockResourceViews)
        .mockResolvedValueOnce(mockResourceLikes);
      (executeQuery as jest.Mock).mockResolvedValue({});

      const result = await service.syncResourceStatistics();

      expect(result.success).toBe(true);
      expect(result.message).toContain('资源统计同步成功');
      expect(result.details?.updatedCount).toBe(2);
    });
  });

  describe('syncUserProgress', () => {
    it('should sync completed video progress to learning progress', async () => {
      const mockVideoProgress = [
        { user_id: 101, lesson_id: 1, is_completed: true },
        { user_id: 102, lesson_id: 2, is_completed: true }
      ];

      (VideoProgress.find as jest.Mock).mockResolvedValue(mockVideoProgress);
      (executeQuery as jest.Mock).mockResolvedValue({});

      const result = await service.syncUserProgress();

      expect(result.success).toBe(true);
      expect(result.message).toContain('用户进度同步成功');
      expect(result.details?.updatedCount).toBe(2);
    });
  });

  describe('checkDataConsistency', () => {
    it('should detect missing users in MongoDB', async () => {
      const mockMySQLUsers = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const mockMongoUserIds = [1, 2]; // Missing user 3

      (executeQuery as jest.Mock).mockResolvedValue(mockMySQLUsers);
      (UserBehavior.distinct as jest.Mock).mockResolvedValue(mockMongoUserIds);
      (UserBehavior.findOne as jest.Mock).mockResolvedValue(null);
      (UserBehavior.create as jest.Mock).mockResolvedValue({});

      const result = await service.checkDataConsistency();

      expect(result.consistent).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('missing_users_in_mongodb');
      expect(result.issues[0].affectedRecords).toBe(1);
    });

    it('should detect course statistics mismatch', async () => {
      const mockMySQLUsers = [{ id: 1 }];
      const mockMongoUserIds = [1];
      const mockCourses = [{ id: 1, total_students: 10 }];
      const mockUniqueStudents = [1, 2, 3]; // 3 students, but MySQL says 10

      (executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockMySQLUsers)
        .mockResolvedValueOnce(mockCourses);
      (UserBehavior.distinct as jest.Mock)
        .mockResolvedValueOnce(mockMongoUserIds)
        .mockResolvedValueOnce(mockUniqueStudents);

      const result = await service.checkDataConsistency();

      expect(result.consistent).toBe(false);
      expect(result.issues.some(issue => issue.type === 'course_statistics_mismatch')).toBe(true);
    });

    it('should return consistent when no issues found', async () => {
      const mockMySQLUsers = [{ id: 1 }];
      const mockMongoUserIds = [1];
      const mockCourses = [{ id: 1, total_students: 3 }];
      const mockUniqueStudents = [1, 2, 3];

      (executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockMySQLUsers)
        .mockResolvedValueOnce(mockCourses);
      (UserBehavior.distinct as jest.Mock)
        .mockResolvedValueOnce(mockMongoUserIds)
        .mockResolvedValueOnce(mockUniqueStudents);

      const result = await service.checkDataConsistency();

      expect(result.consistent).toBe(true);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('syncAll', () => {
    it('should execute all sync operations', async () => {
      (UserBehavior.aggregate as jest.Mock).mockResolvedValue([]);
      (VideoProgress.find as jest.Mock).mockResolvedValue([]);
      (executeQuery as jest.Mock).mockResolvedValue({});

      const results = await service.syncAll();

      expect(results.length).toBe(4); // 4 sync operations
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle errors in sync operations', async () => {
      (UserBehavior.aggregate as jest.Mock).mockRejectedValue(new Error('Sync error'));
      (VideoProgress.find as jest.Mock).mockResolvedValue([]);

      const results = await service.syncAll();

      // syncAll catches errors and returns error results instead of throwing
      expect(results.length).toBe(4);
      expect(results[0].success).toBe(false);
      expect(results[0].message).toContain('Sync error');
    });
  });

  describe('manualSync', () => {
    it('should perform manual sync and consistency check', async () => {
      (UserBehavior.aggregate as jest.Mock).mockResolvedValue([]);
      (VideoProgress.find as jest.Mock).mockResolvedValue([]);
      (executeQuery as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (UserBehavior.distinct as jest.Mock).mockResolvedValue([1]);

      const result = await service.manualSync();

      expect(result.syncResults.length).toBe(4);
      expect(result.consistencyCheck).toBeDefined();
      expect(result.consistencyCheck.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('cleanupOldData', () => {
    it('should cleanup old behavior data and expired recommendations', async () => {
      (UserBehavior.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 100 });
      (Recommendation.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 50 });

      const result = await service.cleanupOldData(30);

      expect(result.success).toBe(true);
      expect(result.details?.behaviorRecordsDeleted).toBe(100);
      expect(result.details?.recommendationsDeleted).toBe(50);
    });

    it('should handle cleanup errors', async () => {
      (UserBehavior.deleteMany as jest.Mock).mockRejectedValue(new Error('Cleanup error'));

      const result = await service.cleanupOldData(30);

      expect(result.success).toBe(false);
      expect(result.message).toContain('数据清理失败');
    });
  });

  describe('Auto Sync', () => {
    it('should start auto sync', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.startAutoSync();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('启动数据库自动同步服务'));
      
      consoleSpy.mockRestore();
    });

    it('should not start auto sync if already running', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.startAutoSync();
      service.startAutoSync();

      expect(consoleSpy).toHaveBeenCalledWith('自动同步已在运行中');
      
      consoleSpy.mockRestore();
    });

    it('should stop auto sync', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.startAutoSync();
      service.stopAutoSync();

      expect(consoleSpy).toHaveBeenCalledWith('自动同步已停止');
      
      consoleSpy.mockRestore();
    });
  });
});
