import request from '@/utils/request';

/**
 * AI学习路径生成接口
 * @param {Object} params - 请求参数
 * @param {string} params.goal - 学习目标
 * @param {string} params.days - 学习天数
 * @param {string} params.intensity - 学习强度 (low, medium, high)
 * @returns {Promise} - 返回Promise对象
 */
export const generateLearningPath = params => {
  return request({
    url: '/ai/learning-paths',
    method: 'get',
    params,
  });
};
