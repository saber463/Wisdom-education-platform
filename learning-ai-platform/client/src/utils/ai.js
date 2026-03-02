import { aiApi } from './api';
import { getBackupPath } from './backupLearningPaths';
import LearningPathLogger from './learningPathLogger';

/**
 * AI学习路径生成（使用完整的实现，含缓存+容错+备用方案）
 * @param {string} goal 学习目标
 * @param {number} days 学习天数
 * @param {string} intensity 学习强度
 * @returns {Promise<Object>} 完整学习路径
 */
export const generateLearningPathByAi = async (goal, days, intensity) => {
  const startTime = Date.now();

  try {
    // 记录开始生成的日志
    LearningPathLogger.logGenerateStart({
      goal,
      days,
      intensity,
    });

    // 直接调用后端的学习路径生成API
    const res = await aiApi.generateLearningPath({ goal, days, intensity });

    const elapsedTime = Date.now() - startTime;

    // 记录生成成功的日志
    LearningPathLogger.logGenerateSuccess({
      goal,
      days,
      stageCount: res.data.stages?.length || 0,
      elapsedTime,
    });

    return res.data;
  } catch (error) {
    const elapsedTime = Date.now() - startTime;

    // 记录生成失败的日志
    LearningPathLogger.logGenerateError({
      goal,
      days,
      error: error.message,
    });

    console.error('AI学习路径生成失败，使用备用方案:', error);

    // 使用备用学习路径方案
    const backupPath = getBackupPath(goal, days, intensity);

    // 记录备用方案使用的日志
    LearningPathLogger.logGenerateSuccess({
      goal,
      days,
      stageCount: backupPath.stages?.length || 0,
      elapsedTime,
      isBackup: true,
    });

    return backupPath;
  }
};
