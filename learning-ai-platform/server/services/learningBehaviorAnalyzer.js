const BrowseHistory = require('../models/BrowseHistory');
const User = require('../models/User');

/**
 * 用户学习行为分析服务
 */
class LearningBehaviorAnalyzer {
  /**
   * 分析用户学习兴趣
   * @param {ObjectId} userId - 用户ID
   * @returns {Promise<Array>} - 学习兴趣标签数组
   */
  static async analyzeLearningInterests(userId) {
    try {
      // 获取用户最近的浏览历史
      const recentHistory = await BrowseHistory.find({ user: userId })
        .sort({ lastAccessTime: -1 })
        .limit(50);

      // 统计不同类别的浏览次数
      const categoryCounts = {};
      recentHistory.forEach(item => {
        if (item.category) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
      });

      // 转换为兴趣标签数组
      const interests = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a) // 按浏览次数排序
        .slice(0, 10) // 取前10个兴趣标签
        .map(([category]) => category);

      // 更新用户的学习兴趣
      await User.findByIdAndUpdate(userId, {
        learningInterests: interests,
      });

      return interests;
    } catch (error) {
      console.error('分析学习兴趣失败:', error);
      return [];
    }
  }

  /**
   * 分析用户学习偏好
   * @param {ObjectId} userId - 用户ID
   * @returns {Promise<Object>} - 学习偏好对象
   */
  static async analyzeLearningPreferences(userId) {
    try {
      // 获取用户的浏览历史
      const history = await BrowseHistory.find({ user: userId });

      // 统计不同时间段的学习时长
      const timeSlotCounts = { morning: 0, afternoon: 0, evening: 0 };

      history.forEach(item => {
        const hour = item.lastAccessTime.getHours();
        if (hour >= 6 && hour < 12) {
          timeSlotCounts.morning += item.duration;
        } else if (hour >= 12 && hour < 18) {
          timeSlotCounts.afternoon += item.duration;
        } else {
          timeSlotCounts.evening += item.duration;
        }
      });

      // 确定用户偏好的学习时间段
      let preferredTime = 'flexible';
      if (Object.values(timeSlotCounts).some(count => count > 0)) {
        preferredTime = Object.entries(timeSlotCounts).sort(([, a], [, b]) => b - a)[0][0];
      }

      // 更新用户的学习偏好
      await User.findByIdAndUpdate(userId, {
        'learningPreferences.preferredTime': preferredTime,
      });

      return { preferredTime };
    } catch (error) {
      console.error('分析学习偏好失败:', error);
      return {};
    }
  }

  /**
   * 更新用户学习统计数据
   * @param {ObjectId} userId - 用户ID
   * @param {Object} statsUpdate - 统计数据更新对象
   */
  async updateLearningStats(userId, statsUpdate) {
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'learningStats.totalStudyTime': statsUpdate.totalStudyTime || 0,
          'learningStats.completedCourses': statsUpdate.completedCourses || 0,
          'learningStats.currentCourses': statsUpdate.currentCourses || 0,
          'learningStats.generatedPaths': statsUpdate.generatedPaths || 0,
        },
      });
    } catch (error) {
      console.error('更新学习统计数据失败:', error);
    }
  }

  /**
   * 为学习路径生成提供个性化建议
   * @param {ObjectId} userId - 用户ID
   * @param {string} goal - 学习目标
   * @param {number} days - 学习天数
   * @param {string} intensity - 学习强度
   * @returns {Promise<Object>} - 个性化建议
   */
  static async getPersonalizedRecommendations(userId, _goal, _days, _intensity) {
    try {
      // 获取用户信息
      const user = await User.findById(userId).select(
        'learningInterests learningPreferences learningStats'
      );
      if (!user) {
        return {};
      }

      // 构建个性化建议
      const recommendations = {
        interests: user.learningInterests || [],
        preferredTime: user.learningPreferences.preferredTime,
        learningStyle: user.learningPreferences.learningStyle,
        // 根据用户的学习统计数据调整学习计划
        adjustmentFactors: {
          // 如果用户已完成较多课程，增加学习难度
          difficultyLevel: user.learningStats.completedCourses > 5 ? 'medium' : 'beginner',
          // 如果用户总学习时长较长，可适当增加每日学习量
          dailyLoadFactor: user.learningStats.totalStudyTime > 1000 ? 1.1 : 1.0,
        },
      };

      return recommendations;
    } catch (error) {
      console.error('获取个性化建议失败:', error);
      return {};
    }
  }
}

module.exports = LearningBehaviorAnalyzer;
