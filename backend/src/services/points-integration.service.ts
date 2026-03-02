/**
 * 积分系统集成服务
 * 确保课程完成、答题正确、共同任务完成奖励积分
 * Requirements: 22.8, 22.20, 23.5
 * Task: 18.1
 */

import { executeQuery } from '../config/database.js';

export class PointsIntegrationService {
  /**
   * 奖励课程完成积分
   * Requirements: 22.20
   */
  async rewardCourseCompletion(userId: number, courseId: number): Promise<void> {
    try {
      // 检查是否已经奖励过
      const existingReward = await executeQuery<any[]>(
        `SELECT id FROM point_transactions 
         WHERE user_id = ? AND reference_id = ? AND transaction_type = 'reward' 
         AND description LIKE '%课程完成%'`,
        [userId, courseId]
      );

      if (existingReward.length > 0) {
        return; // 已经奖励过，不重复奖励
      }

      // 奖励积分（课程完成奖励50积分）
      const rewardPoints = 50;

      // 更新用户积分
      await executeQuery(
        `UPDATE user_points SET total_points = total_points + ?, available_points = available_points + ? 
         WHERE user_id = ?`,
        [rewardPoints, rewardPoints, userId]
      );

      // 如果用户积分记录不存在，创建一条
      const userPoints = await executeQuery<any[]>(
        'SELECT id FROM user_points WHERE user_id = ?',
        [userId]
      );

      if (userPoints.length === 0) {
        await executeQuery(
          `INSERT INTO user_points (user_id, total_points, available_points) 
           VALUES (?, ?, ?)`,
          [userId, rewardPoints, rewardPoints]
        );
      }

      // 记录积分交易
      await executeQuery(
        `INSERT INTO point_transactions 
         (user_id, points, type, reason, reference_id) 
         VALUES (?, ?, 'earn', ?, ?)`,
        [userId, rewardPoints, `完成课程奖励`, courseId]
      );

      console.log(`[积分系统] 课程完成奖励: 用户${userId}完成课程${courseId}，获得${rewardPoints}积分`);
    } catch (error) {
      console.error('奖励课程完成积分失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 奖励答题正确积分（已在video-quiz.service.ts中实现，这里确保一致性）
   * Requirements: 23.5
   */
  async rewardQuizCorrect(userId: number, questionId: number, points: number): Promise<void> {
    try {
      // 更新用户积分
      await executeQuery(
        `UPDATE user_points SET total_points = total_points + ?, available_points = available_points + ? 
         WHERE user_id = ?`,
        [points, points, userId]
      );

      // 记录积分交易
      await executeQuery(
        `INSERT INTO point_transactions 
         (user_id, points, type, reason, reference_id) 
         VALUES (?, ?, 'earn', ?, ?)`,
        [userId, points, '视频答题正确奖励', questionId]
      );
    } catch (error) {
      console.error('奖励答题正确积分失败:', error);
    }
  }

  /**
   * 奖励共同任务完成积分（已在virtual-partner.service.ts中实现，这里确保一致性）
   * Requirements: 22.8
   */
  async rewardTaskCompletion(userId: number, taskId: number, points: number): Promise<void> {
    try {
      // 更新用户积分
      await executeQuery(
        `UPDATE user_points SET total_points = total_points + ?, available_points = available_points + ? 
         WHERE user_id = ?`,
        [points, points, userId]
      );

      // 记录积分交易
      await executeQuery(
        `INSERT INTO point_transactions 
         (user_id, points, type, reason, reference_id) 
         VALUES (?, ?, 'earn', ?, ?)`,
        [userId, points, '完成共同任务奖励', taskId]
      );
    } catch (error) {
      console.error('奖励任务完成积分失败:', error);
    }
  }

  /**
   * 创建协作达人徽章碎片
   * Requirements: 22.20
   */
  async createCollaborationBadgeFragment(userId: number, fragmentType: string): Promise<void> {
    try {
      // 检查是否已有该类型的徽章碎片
      const existingFragment = await executeQuery<any[]>(
        `SELECT id FROM badge_fragments 
         WHERE user_id = ? AND fragment_type = ?`,
        [userId, fragmentType]
      );

      if (existingFragment.length === 0) {
        await executeQuery(
          `INSERT INTO badge_fragments (user_id, fragment_type, collected_at) 
           VALUES (?, ?, NOW())`,
          [userId, fragmentType]
        );
      }
    } catch (error) {
      console.error('创建徽章碎片失败:', error);
      // 如果badge_fragments表不存在，忽略错误
    }
  }
}

export const pointsIntegrationService = new PointsIntegrationService();

