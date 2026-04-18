import { setCache, getCache, deleteCache, deleteCachePattern } from './redisService.js';

const COURSE_CACHE_PREFIX = 'course:';
const COURSE_LIST_CACHE_KEY = 'courses:list';
const COURSE_DETAIL_PREFIX = 'course:detail:';
const CATEGORY_COURSES_PREFIX = 'courses:category:';
const TEACHER_COURSES_PREFIX = 'courses:teacher:';

// 默认缓存时间
const DEFAULT_CACHE_TTL = 300; // 5分钟
const HOT_COURSE_TTL = 600; // 10分钟

/**
 * 获取课程列表（带缓存）
 * @param {object} options - 查询选项
 */
export const getCachedCourseList = async (options = {}) => {
  const { category, teacher, isVip, page = 1, limit = 20 } = options;

  // 构建缓存键
  let cacheKey = `${COURSE_LIST_CACHE_KEY}:${page}:${limit}`;
  if (category) cacheKey += `:cat:${category}`;
  if (teacher) cacheKey += `:teacher:${teacher}`;
  if (isVip !== undefined) cacheKey += `:vip:${isVip}`;

  // 尝试从缓存获取
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`📦 课程列表缓存命中: ${cacheKey}`);
    return cached;
  }

  // 返回 null 表示需要查询数据库
  return null;
};

/**
 * 设置课程列表缓存
 * @param {object} options - 查询选项
 * @param {array} courses - 课程数据
 */
export const setCachedCourseList = async (options, courses) => {
  const { category, teacher, isVip, page = 1, limit = 20 } = options;

  let cacheKey = `${COURSE_LIST_CACHE_KEY}:${page}:${limit}`;
  if (category) cacheKey += `:cat:${category}`;
  if (teacher) cacheKey += `:teacher:${teacher}`;
  if (isVip !== undefined) cacheKey += `:vip:${isVip}`;

  await setCache(cacheKey, courses, DEFAULT_CACHE_TTL);
  console.log(`💾 课程列表已缓存: ${cacheKey}`);
};

/**
 * 获取课程详情（带缓存）
 * @param {string} courseId - 课程ID
 */
export const getCachedCourseDetail = async courseId => {
  const cacheKey = `${COURSE_DETAIL_PREFIX}${courseId}`;
  const cached = await getCache(cacheKey);

  if (cached) {
    console.log(`📦 课程详情缓存命中: ${courseId}`);
    return cached;
  }

  return null;
};

/**
 * 设置课程详情缓存
 * @param {string} courseId - 课程ID
 * @param {object} course - 课程数据
 */
export const setCachedCourseDetail = async (courseId, course) => {
  const cacheKey = `${COURSE_DETAIL_PREFIX}${courseId}`;
  await setCache(cacheKey, course, DEFAULT_CACHE_TTL);
  console.log(`💾 课程详情已缓存: ${courseId}`);
};

/**
 * 获取分类课程（带缓存）
 * @param {string} categoryId - 分类ID
 */
export const getCachedCategoryCourses = async categoryId => {
  const cacheKey = `${CATEGORY_COURSES_PREFIX}${categoryId}`;
  return await getCache(cacheKey);
};

/**
 * 设置分类课程缓存
 * @param {string} categoryId - 分类ID
 * @param {array} courses - 课程列表
 */
export const setCachedCategoryCourses = async (categoryId, courses) => {
  const cacheKey = `${CATEGORY_COURSES_PREFIX}${categoryId}`;
  await setCache(cacheKey, courses, DEFAULT_CACHE_TTL);
};

/**
 * 获取老师课程（带缓存）
 * @param {string} teacherId - 老师ID
 */
export const getCachedTeacherCourses = async teacherId => {
  const cacheKey = `${TEACHER_COURSES_PREFIX}${teacherId}`;
  return await getCache(cacheKey);
};

/**
 * 设置老师课程缓存
 * @param {string} teacherId - 老师ID
 * @param {array} courses - 课程列表
 */
export const setCachedTeacherCourses = async (teacherId, courses) => {
  const cacheKey = `${TEACHER_COURSES_PREFIX}${teacherId}`;
  await setCache(cacheKey, courses, DEFAULT_CACHE_TTL);
};

/**
 * 清除课程相关缓存
 * @param {string} courseId - 课程ID（可选）
 */
export const invalidateCourseCache = async courseId => {
  if (courseId) {
    // 清除单个课程详情
    await deleteCache(`${COURSE_DETAIL_PREFIX}${courseId}`);
  }

  // 清除所有列表缓存
  await deleteCachePattern(`${COURSE_LIST_CACHE_KEY}*`);
  await deleteCachePattern(`${CATEGORY_COURSES_PREFIX}*`);
  await deleteCachePattern(`${TEACHER_COURSES_PREFIX}*`);

  console.log('🗑️ 课程缓存已清除');
};

/**
 * 热门课程缓存（使用 sorted set）
 */
export const incrementCourseView = async courseId => {
  try {
    const { getRedisClient } = await import('./redisService.js');
    const client = await getRedisClient();
    if (!client) return;

    await client.zIncrBy('courses:popular', 1, courseId);
  } catch (err) {
    console.error('❌ incrementCourseView 错误:', err.message);
  }
};

/**
 * 获取热门课程ID列表
 * @param {number} limit - 返回数量
 */
export const getPopularCourseIds = async (limit = 10) => {
  try {
    const { getRedisClient } = await import('./redisService.js');
    const client = await getRedisClient();
    if (!client) return [];

    const result = await client.zRangeWithScores('courses:popular', 0, limit - 1, { REV: true });
    return result.map(item => ({ id: item.value, score: item.score }));
  } catch (err) {
    console.error('❌ getPopularCourseIds 错误:', err.message);
    return [];
  }
};

export default {
  getCachedCourseList,
  setCachedCourseList,
  getCachedCourseDetail,
  setCachedCourseDetail,
  getCachedCategoryCourses,
  setCachedCategoryCourses,
  getCachedTeacherCourses,
  setCachedTeacherCourses,
  invalidateCourseCache,
  incrementCourseView,
  getPopularCourseIds,
};
