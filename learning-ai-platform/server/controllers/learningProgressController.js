import LearningProgress from '../models/LearningProgress.js';
import { BadRequestError, InternalServerError } from '../utils/errorResponse.js';

export const getLearningProgress = async (req, res, next) => {
  try {
    const progress = await LearningProgress.findOne({ user: req.user.id });

    if (!progress) {
      const newProgress = await LearningProgress.create({
        user: req.user.id,
        currentPath: null,
        progress: {},
      });
      return res.status(200).json(newProgress);
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error('获取学习进度失败:', error);
    return next(new InternalServerError('获取学习进度失败，请稍后重试'));
  }
};

export const setCurrentPath = async (req, res, next) => {
  const { path } = req.body;

  if (!path) {
    return next(new BadRequestError('必须提供学习路径'));
  }

  try {
    let progress = await LearningProgress.findOne({ user: req.user.id });

    if (!progress) {
      progress = await LearningProgress.create({
        user: req.user.id,
        currentPath: path,
        progress: {},
      });
    } else {
      progress.currentPath = path;
      await progress.save();
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error('设置学习路径失败:', error);
    return next(new InternalServerError('设置学习路径失败，请稍后重试'));
  }
};

export const updateProgress = async (req, res, next) => {
  const { day } = req.body;

  if (!day) {
    return next(new BadRequestError('必须提供日期'));
  }

  try {
    let progress = await LearningProgress.findOne({ user: req.user.id });

    if (!progress) {
      progress = await LearningProgress.create({
        user: req.user.id,
        currentPath: null,
        progress: { [day]: true },
      });
    } else {
      progress.progress[day] = true;
      await progress.save();
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error('更新学习进度失败:', error);
    return next(new InternalServerError('更新学习进度失败，请稍后重试'));
  }
};

export const resetProgress = async (req, res, next) => {
  try {
    let progress = await LearningProgress.findOne({ user: req.user.id });

    if (progress) {
      progress.progress = {};
      progress.currentPath = null;
      await progress.save();
    } else {
      progress = await LearningProgress.create({
        user: req.user.id,
        currentPath: null,
        progress: {},
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
      message: '学习进度已重置',
    });
  } catch (error) {
    console.error('重置学习进度失败:', error);
    return next(new InternalServerError('重置学习进度失败，请稍后重试'));
  }
};

export default {
  getLearningProgress,
  setCurrentPath,
  updateProgress,
  resetProgress,
};
