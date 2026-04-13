import dayjs from 'dayjs';
import { safeLocalStorage } from '@/store/user';
import { userApi, aiApi } from '@/utils/api.js';
import axios from 'axios';
import { getBackupPath } from '@/utils/backupLearningPaths';

/**
 * 优化版AI学习路径生成（含缓存+容错解析+备用方案，禁用流式响应解决兼容报错）
 * @param {string} goal 学习目标
 * @param {number} days 学习天数（1-180）
 * @param {string} intensity 学习强度（low/medium/high）
 * @param {Function} onProgress 进度回调（返回加载状态，非实时流式）
 * @param {Function} onCancel 取消回调（用于取消请求）
 * @returns {Promise<Object>} 完整学习路径
 */
export const generateLearningPathByAi = async (goal, days, intensity, onProgress, onCancel) => {
  // 创建请求取消令牌
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();

  // 如果提供了取消回调，将取消函数传递给外部
  if (onCancel) {
    onCancel(() => source.cancel('用户取消了请求'));
  }

  // 1. 严格参数校验（保留原逻辑）
  if (!goal || typeof goal !== 'string' || goal.trim() === '') {
    throw new Error('学习目标不能为空，请输入有效的学习目标');
  }
  if (!Number.isInteger(days) || days < 1 || days > 180) {
    throw new Error('学习天数必须是1-180天的正整数');
  }
  const validIntensities = ['low', 'medium', 'high'];
  if (!validIntensities.includes(intensity)) {
    throw new Error(`学习强度必须是以下值之一：${validIntensities.join('/')}`);
  }

  // 2. 检查用户操作次数是否达到上限
  try {
    const userResponse = await userApi.getCurrentUser();
    // api.js的响应拦截器已经返回了response.data，所以userResponse就是{ success: true, data: { ... } }
    const userInfo = userResponse.data;

    // 检查用户是否登录并且生成次数是否达到上限
    if (userInfo && userInfo.learningStats && userInfo.learningStats.generatedPaths >= 5) {
      console.log('用户学习路径生成次数已达上限，直接进入生成流程');
      // 次数达到上限时，不需要额外提示，直接继续执行
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    // 获取用户信息失败时，不影响生成流程，继续执行
  }

  // 3. 学习强度映射（精简表述）
  const intensityMap = {
    low: '30-60分钟/天',
    medium: '60-90分钟/天',
    high: '90-120分钟/天',
  };

  // 4. 本地缓存逻辑（增加JSON解析容错）
  const cacheKey = `lp_${goal.trim().replace(/[\s/\\]/g, '_')}_${days}_${intensity}`;
  const cachedData = safeLocalStorage.get(cacheKey);
  const cachedTime = safeLocalStorage.get(`${cacheKey}_time`);

  // 缓存30分钟内有效，直接返回
  if (cachedData) {
    try {
      // 验证缓存时间是否有效
      const isValidTime = cachedTime && !isNaN(new Date(cachedTime).getTime());
      if (isValidTime && dayjs().diff(dayjs(cachedTime), 'minute') < 30) {
        const cacheResult = cachedData; // safeLocalStorage已经解析过JSON
        onProgress && onProgress({ ...cacheResult, isCached: true, isStreaming: false });
        return cacheResult;
      } else {
        // 缓存时间无效或已过期，删除缓存
        safeLocalStorage.remove(cacheKey);
        safeLocalStorage.remove(`${cacheKey}_time`);
      }
    } catch {
      // 任何解析错误都删除缓存
      safeLocalStorage.remove(cacheKey);
      safeLocalStorage.remove(`${cacheKey}_time`);
    }
  }

  // 设置最大重试次数
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      // 5. API请求配置（核心修改：禁用流式响应，统一用json类型）
      onProgress &&
        onProgress({
          goal: goal.trim(),
          totalDays: days,
          startDate: dayjs().format('YYYY-MM-DD'),
          endDate: dayjs().add(days, 'day').format('YYYY-MM-DD'),
          stages: [],
          summary:
            retryCount > 0
              ? `AI正在重试生成学习路径... (${retryCount}/${maxRetries})`
              : 'AI正在生成学习路径，请稍候...',
          isStreaming: true,
          isCached: false,
        });

      // 使用后端模拟数据API，增加取消令牌和超时时间
      const response = await aiApi.generateLearningPath(
        {
          goal: goal.trim(),
          days: days,
          intensity: intensity,
        },
        {
          timeout: retryCount === 0 ? 30000 : 45000, // 重试时增加超时时间
          cancelToken: source.token,
        }
      );

      // 处理后端返回的数据格式
      // api.js的响应拦截器已经返回了response.data，所以response就是{ success: true, plan: { ... }, message: "..." }
      // 前端需要的是 { goal, totalDays, startDate, endDate, stages, summary, ... }
      const backendPlan = response.plan || response;

      // 转换字段名并构建前端需要的数据结构
      const result = {
        goal: backendPlan.title || goal.trim(),
        totalDays: backendPlan.days || days,
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(days, 'day').format('YYYY-MM-DD'),
        stages:
          backendPlan.modules?.map(module => ({
            day: module.day,
            title: module.moduleName,
            content: module.detailedContent || `学习${module.moduleName}的核心知识点`,
            duration: intensityMap[intensity],
            resources: module.resourceLink ? [{ name: '学习资源', url: module.resourceLink }] : [],
            topics: module.topics,
          })) || [],
        summary: backendPlan.summary || `该计划为您制定了${days}天的${goal}学习方案。`,
        intensity: intensity,
        certificateType: backendPlan.certificateType,
      };

      console.log('处理后的学习路径数据:', result);
      console.log('后端返回的模拟数据:', result);
      if (!result) throw new Error('后端未返回有效内容');

      validateResult(result, days, goal.trim());
      saveToCache(cacheKey, result);

      // 回调返回完整结果
      onProgress && onProgress({ ...result, isStreaming: false, isCached: false });
      return result;
    } catch (error) {
      console.error('AI生成失败详情：', error);

      // 处理取消请求的情况
      if (axios.isCancel(error)) {
        console.log('请求已取消:', error.message);
        throw new Error('请求已取消');
      }

      // 处理重试逻辑
      retryCount++;

      // 如果是最后一次重试，使用备用方案
      if (retryCount > maxRetries) {
        console.log('AI生成失败，使用备用学习路径');

        // 获取备用路径
        const backupPath = getBackupPath(goal, days, intensity);
        if (backupPath) {
          // 调整路径参数以匹配用户输入
          const adjustedPath = {
            ...backupPath,
            goal: goal.trim(),
            totalDays: days,
            intensity: intensity,
            startDate: dayjs().format('YYYY-MM-DD'),
            endDate: dayjs().add(days, 'day').format('YYYY-MM-DD'),
            // 调整学习阶段数量以匹配天数
            stages: backupPath.stages.slice(0, days).map((stage, index) => ({
              ...stage,
              day: index + 1,
            })),
          };

          // 保存到缓存
          saveToCache(cacheKey, adjustedPath);

          // 返回备用路径，不显示错误信息
          onProgress && onProgress({ ...adjustedPath, isStreaming: false, isCached: false });
          return adjustedPath;
        } else {
          // 如果没有备用路径，抛出异常
          throw new Error('生成失败，请重试');
        }
      }

      // 如果是不可重试的错误，使用备用方案
      if (
        error.response?.status === 400 ||
        error.response?.status === 401 ||
        error.message.includes('JSON.parse') ||
        error.message.includes('路径不符合要求')
      ) {
        console.log('遇到不可重试的错误，使用备用学习路径');

        // 获取备用路径
        const backupPath = getBackupPath(goal, days, intensity);
        if (backupPath) {
          // 调整路径参数以匹配用户输入
          const adjustedPath = {
            ...backupPath,
            goal: goal.trim(),
            totalDays: days,
            intensity: intensity,
            startDate: dayjs().format('YYYY-MM-DD'),
            endDate: dayjs().add(days, 'day').format('YYYY-MM-DD'),
            // 调整学习阶段数量以匹配天数
            stages: backupPath.stages.slice(0, days).map((stage, index) => ({
              ...stage,
              day: index + 1,
            })),
          };

          // 保存到缓存
          saveToCache(cacheKey, adjustedPath);

          // 返回备用路径，不显示错误信息
          onProgress && onProgress({ ...adjustedPath, isStreaming: false, isCached: false });
          return adjustedPath;
        }
      }

      // 重试前等待一段时间
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
};

/**
 * 验证AI返回结果（强化字段校验）
 * @param {Object} result AI返回的路径数据
 * @param {number} days 期望的学习天数
 * @param {string} goal 原始学习目标
 */
const validateResult = (result, days, goal) => {
  // 校验核心字段
  const requiredFields = ['goal', 'totalDays', 'startDate', 'endDate', 'stages', 'summary'];
  const missingFields = requiredFields.filter(field => !(field in result));
  if (missingFields.length > 0) {
    throw new Error(`生成的路径缺少核心字段：${missingFields.join(', ')}`);
  }

  // 校验天数匹配（允许±1，避免AI小误差）
  if (result.stages.length < days - 1 || result.stages.length > days + 1) {
    throw new Error(`生成的路径天数不符（应为${days}天，实际${result.stages.length}天）`);
  }

  // 校验目标一致
  if (result.goal.trim() !== goal.trim()) {
    throw new Error('生成的路径目标与输入不一致');
  }
};

/**
 * 保存结果到本地缓存（优化缓存策略）
 * @param {string} cacheKey 缓存键
 * @param {Object} result 学习路径结果
 */
const saveToCache = (cacheKey, result) => {
  try {
    // 检查本地存储剩余空间
    if (typeof Storage !== 'undefined') {
      // 简单检查本地存储是否已满
      try {
        // 尝试存储一个测试数据
        localStorage.setItem('__test__', '__test__');
        localStorage.removeItem('__test__');

        // 存储实际数据
        safeLocalStorage.set(cacheKey, result);
        safeLocalStorage.set(`${cacheKey}_time`, dayjs().format());
      } catch {
        // 本地存储已满，清理过期缓存
        clearExpiredCache();

        // 再次尝试存储
        try {
          safeLocalStorage.set(cacheKey, result);
          safeLocalStorage.set(`${cacheKey}_time`, dayjs().format());
        } catch (e2) {
          console.warn('缓存保存失败：本地存储空间不足', e2);
        }
      }
    }
  } catch {
    // 缓存失败不影响核心功能
  }
};

/**
 * 清理过期的缓存
 */
const clearExpiredCache = () => {
  try {
    const now = dayjs();
    const keysToRemove = [];

    // 遍历所有本地存储键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      // 检查是否是学习路径缓存键
      if (key.startsWith('lp_') && !key.endsWith('_time')) {
        const timeKey = `${key}_time`;
        const cachedTime = safeLocalStorage.get(timeKey);

        // 检查缓存是否过期
        if (cachedTime) {
          const isValidTime = !isNaN(new Date(cachedTime).getTime());
          if (isValidTime && now.diff(dayjs(cachedTime), 'minute') >= 30) {
            keysToRemove.push(key, timeKey);
          }
        } else {
          // 没有时间戳的缓存直接删除
          keysToRemove.push(key);
        }
      }
    }

    // 删除过期缓存
    keysToRemove.forEach(key => safeLocalStorage.remove(key));
    console.log(`已清理 ${keysToRemove.length / 2} 个过期缓存`);
  } catch (e) {
    console.warn('清理过期缓存失败：', e);
  }
};
