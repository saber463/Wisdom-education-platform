import User from '../models/User.js';
import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
// 导入自定义错误类
import { NotFoundError, InternalServerError, UnauthorizedError } from '../utils/errorResponse.js';

// @desc    获取所有可用成就
// @route   GET /api/v1/achievements
// @access  Public
export const getAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements,
    });
  } catch (error) {
    console.error('获取成就失败:', error);
    next(new InternalServerError('获取成就失败，请稍后重试'));
  }
};

// @desc    获取用户成就
// @route   GET /api/v1/users/achievements
// @access  Private
export const getUserAchievements = async (req, res, next) => {
  try {
    const userAchievements = await UserAchievement.find({ user: req.user._id })
      .populate('achievement')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      count: userAchievements.length,
      data: userAchievements,
    });
  } catch (error) {
    console.error('获取用户成就失败:', error);
    next(new InternalServerError('获取用户成就失败，请稍后重试'));
  }
};

// @desc    更新用户成就进度
// @route   POST /api/v1/users/achievements/update
// @access  Private
export const updateAchievements = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const user = await User.findById(req.user._id).select('learningStats points');

    if (!user) {
      return next(new NotFoundError('用户不存在'));
    }

    // 获取所有活跃成就
    const achievements = await Achievement.find({ isActive: true });

    // 待更新的成就列表
    const updatedAchievements = [];

    for (const achievement of achievements) {
      // 查找用户是否已有该成就记录
      let userAchievement = await UserAchievement.findOne({
        user: req.user._id,
        achievement: achievement._id,
      });

      // 计算当前进度
      let currentProgress = 0;

      switch (achievement.condition) {
        case 'study_time':
          currentProgress = user.learningStats.totalStudyTime;
          break;
        case 'completed_courses':
          currentProgress = user.learningStats.completedCourses;
          break;
        case 'points_earned':
          currentProgress = user.points;
          break;
        // 可以根据需要扩展其他条件
        default:
          currentProgress = 0;
      }

      // 如果没有记录，创建新记录
      if (!userAchievement) {
        userAchievement = new UserAchievement({
          user: req.user._id,
          achievement: achievement._id,
          progress: currentProgress,
          isCompleted: currentProgress >= achievement.targetValue,
        });

        if (userAchievement.isCompleted) {
          userAchievement.completedAt = Date.now();
        }
        await userAchievement.save();
        updatedAchievements.push(userAchievement);
      } else if (!userAchievement.isCompleted && currentProgress >= achievement.targetValue) {
        // 如果未完成且现在已完成，更新状态
        userAchievement.isCompleted = true;
        userAchievement.completedAt = Date.now();
        userAchievement.progress = currentProgress;
        await userAchievement.save();
        updatedAchievements.push(userAchievement);
      } else if (userAchievement.progress < currentProgress) {
        // 如果进度有所增加，更新进度
        userAchievement.progress = currentProgress;
        await userAchievement.save();
        updatedAchievements.push(userAchievement);
      }
    }

    res.status(200).json({
      success: true,
      count: updatedAchievements.length,
      data: updatedAchievements,
    });
  } catch (error) {
    console.error('更新成就进度失败:', error);
    next(new InternalServerError('更新成就进度失败，请稍后重试'));
  }
};

// @desc    获取用户最新获得的成就
// @route   GET /api/v1/users/achievements/recent
// @access  Private
export const getRecentAchievements = async (req, res) => {
  try {
    const userAchievements = await UserAchievement.find({
      user: req.user.id,
      isCompleted: true,
    })
      .populate('achievement')
      .sort({ completedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: userAchievements.length,
      data: userAchievements,
    });
  } catch (error) {
    console.error('获取用户最新获得的成就失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户最新获得的成就失败，请稍后重试',
    });
  }
};
