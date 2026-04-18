import { setCache, getCache, deleteCache, incrementCounter, getCounter } from './redisService.js';

const PROGRESS_PREFIX = 'progress:';
const LEADERBOARD_KEY = 'leaderboard:learning';
const USER_STREAK_PREFIX = 'streak:';

/**
 * 缓存用户学习进度
 * @param {string} oderId - 用户ID
 * @param {string} courseId - 课程ID
 * @param {object} progress - 进度数据
 */
export const cacheUserProgress = async (userId, courseId, progress) => {
  const key = `${PROGRESS_PREFIX}${userId}:${courseId}`;
  // 缓存 5 分钟
  await setCache(key, progress, 300);
};

/**
 * 获取用户学习进度（从缓存）
 * @param {string} userId - 用户ID
 * @param {string} courseId - 课程ID
 */
export const getCachedUserProgress = async (userId, courseId) => {
  const key = `${PROGRESS_PREFIX}${userId}:${courseId}`;
  return await getCache(key);
};

/**
 * 清除用户学习进度缓存
 * @param {string} oderId - 用户ID
 * @param {string} courseId - 课程ID
 */
export const invalidateUserProgress = async (userId, courseId) => {
  const key = `${PROGRESS_PREFIX}${userId}:${courseId}`;
  await deleteCache(key);
};

/**
 * 增加用户学习时长
 * @param {string} userId - 用户ID
 * @param {number} minutes - 分钟数
 */
export const addLearningTime = async (userId, minutes) => {
  // 使用 Redis 有序集合存储总学习时长
  try {
    const { getRedisClient } = await import('./redisService.js');
    const client = await getRedisClient();
    if (!client) return;

    await client.zIncrBy(LEADERBOARD_KEY, minutes, userId);

    // 更新今日学习时长
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `learning:daily:${userId}:${today}`;
    await incrementCounter(dailyKey, minutes);

    // 设置当日结束时过期（到凌晨）
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ttl = Math.floor((midnight - now) / 1000);

    const { setCounter } = await import('./redisService.js');
    await setCounter(dailyKey, minutes, ttl);
  } catch (err) {
    console.error('❌ addLearningTime 错误:', err.message);
  }
};

/**
 * 获取用户总学习时长
 * @param {string} userId - 用户ID
 */
export const getTotalLearningTime = async userId => {
  try {
    const { getRedisClient } = await import('./redisService.js');
    const client = await getRedisClient();
    if (!client) return 0;

    const score = await client.zScore(LEADERBOARD_KEY, userId);
    return score || 0;
  } catch (err) {
    console.error('❌ getTotalLearningTime 错误:', err.message);
    return 0;
  }
};

/**
 * 获取学习排行榜
 * @param {number} limit - 返回数量，默认10
 */
export const getLearningLeaderboard = async (limit = 10) => {
  try {
    const { getRedisClient } = await import('./redisService.js');
    const client = await getRedisClient();
    if (!client) return [];

    const result = await client.zRangeWithScores(LEADERBOARD_KEY, 0, limit - 1, { REV: true });
    return result.map(item => ({
      oderId: item.value,
      totalMinutes: item.score,
    }));
  } catch (err) {
    console.error('❌ getLearningLeaderboard 错误:', err.message);
    return [];
  }
};

/**
 * 更新用户学习连续天数
 * @param {string} userId - 用户ID
 */
export const updateUserStreak = async userId => {
  try {
    const { getRedisClient } = await import('./redisService.js');
    const client = await getRedisClient();
    if (!client) return 0;

    const today = new Date().toISOString().split('T')[0];
    const streakKey = `${USER_STREAK_PREFIX}${userId}`;
    const lastDate = await getCache(streakKey);

    let newStreak = 1;

    if (lastDate) {
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);
      const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // 连续学习
        newStreak = (await getCounter(`${streakKey}:count`)) + 1;
      } else if (diffDays === 0) {
        // 同一天
        newStreak = (await getCounter(`${streakKey}:count`)) || 1;
      }
      // 否则重新开始
    }

    await setCache(streakKey, today, 86400 * 30); // 30天过期
    await setCounter(`${streakKey}:count`, newStreak, 86400 * 30);

    return newStreak;
  } catch (err) {
    console.error('❌ updateUserStreak 错误:', err.message);
    return 0;
  }
};

/**
 * 获取用户学习连续天数
 * @param {string} userId - 用户ID
 */
export const getUserStreak = async userId => {
  return await getCounter(`${USER_STREAK_PREFIX}${userId}:count`);
};

export default {
  cacheUserProgress,
  getCachedUserProgress,
  invalidateUserProgress,
  addLearningTime,
  getTotalLearningTime,
  getLearningLeaderboard,
  updateUserStreak,
  getUserStreak,
};
