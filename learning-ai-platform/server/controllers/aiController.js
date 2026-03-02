import axios from 'axios';
import User from '../models/User.js';
import 'dotenv/config';

import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
  TooManyRequestsError,
} from '../utils/errorResponse.js';

import http from 'http';
import https from 'https';

class PerformanceMonitor {
  static performanceBaselines = {
    学习路径生成: {
      warningThreshold: 5000,
      criticalThreshold: 10000,
      averageDuration: 0,
      sampleCount: 0,
    },
    测试学习路径生成: {
      warningThreshold: 3000,
      criticalThreshold: 5000,
      averageDuration: 0,
      sampleCount: 0,
    },
    AI请求: {
      warningThreshold: 2000,
      criticalThreshold: 5000,
      averageDuration: 0,
      sampleCount: 0,
    },
    用户生成历史记录更新: {
      warningThreshold: 500,
      criticalThreshold: 1000,
      averageDuration: 0,
      sampleCount: 0,
    },
  };

  static log(operation, duration, success = true, metadata = {}) {
    const baseline = PerformanceMonitor.performanceBaselines[operation];
    if (baseline) {
      baseline.sampleCount++;
      baseline.averageDuration =
        (baseline.averageDuration * (baseline.sampleCount - 1) + duration) / baseline.sampleCount;

      if (duration > baseline.criticalThreshold) {
        console.error(
          `🚨 ${operation} 性能严重超出阈值 (${duration}ms > ${baseline.criticalThreshold}ms)`,
          metadata
        );
      } else if (duration > baseline.warningThreshold) {
        console.warn(
          `⚠️  ${operation} 性能超出阈值 (${duration}ms > ${baseline.warningThreshold}ms)`,
          metadata
        );
      } else {
        console.log(`✅ ${operation} 完成 (${duration}ms)`, metadata);
      }
    } else {
      if (success) {
        console.log(`✅ ${operation} 完成 (${duration}ms)`, metadata);
      } else {
        console.error(`❌ ${operation} 失败 (${duration}ms)`, metadata);
      }
    }
  }

  static getPerformanceReport() {
    const report = {};
    for (const [operation, baseline] of Object.entries(PerformanceMonitor.performanceBaselines)) {
      report[operation] = {
        averageDuration: `${baseline.averageDuration.toFixed(2)}ms`,
        warningThreshold: `${baseline.warningThreshold}ms`,
        criticalThreshold: `${baseline.criticalThreshold}ms`,
        sampleCount: baseline.sampleCount,
        status:
          baseline.averageDuration > baseline.criticalThreshold
            ? 'critical'
            : baseline.averageDuration > baseline.warningThreshold
              ? 'warning'
              : 'normal',
      };
    }
    return report;
  }
}

class AiController {
  /**
   * 前置参数校验
   * @param {Object} params - 请求参数
   */
  static validateParams(params) {
    const { goal, daysNum, intensity } = params;

    // 检查必填项
    if (!goal || !daysNum) {
      throw new BadRequestError('缺少必要参数：goal 和 daysNum 为必填项');
    }

    // 验证 goal 格式
    if (typeof goal !== 'string' || goal.trim().length < 5) {
      throw new BadRequestError('学习目标格式不符合要求，长度至少为5个字符');
    }

    // 验证 daysNum 范围
    const days = parseInt(daysNum);
    if (isNaN(days) || days < 1 || days > 180) {
      throw new BadRequestError('学习天数必须是1-180天的正整数');
    }

    // 验证 intensity 格式
    if (intensity) {
      const validIntensities = ['low', 'medium', 'high'];
      if (!validIntensities.includes(intensity)) {
        throw new BadRequestError('学习强度必须是 low、medium 或 high 中的一个');
      }
    }

    return true;
  }

  /**
   * 统一请求配置
   * @param {Object} config - 配置参数
   */
  static getRequestConfig(config = {}) {
    return {
      baseURL: process.env.AI_API_BASE_URL || 'http://localhost:4001/api',
      timeout: config.timeout || 30000, // 默认超时30秒
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      // 添加重试配置
      maxRedirects: 3,
      // 添加连接池配置
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
      ...config,
    };
  }

  /**
   * 指数退避重试策略
   * @param {Function} fn - 要重试的函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} initialDelay - 初始延迟（毫秒）
   * @param {string} operationName - 操作名称（用于日志）
   */
  static async retryWithExponentialBackoff(
    fn,
    maxRetries = 3,
    initialDelay = 1000,
    operationName = 'AI请求'
  ) {
    let delay = initialDelay;
    let attempts = 0;
    const errors = [];

    while (true) {
      try {
        const startTime = Date.now();
        const result = await fn();
        const duration = Date.now() - startTime;

        // 记录成功日志
        PerformanceMonitor.log(operationName, duration, true, { attempts });

        return result;
      } catch (error) {
        attempts++;
        errors.push(error);

        // 记录失败日志
        PerformanceMonitor.log(operationName, Date.now() - (error.startTime || Date.now()), false, {
          attempts,
          error: error.message,
          code: error.code,
          status: error.response?.status,
        });

        // 检查是否超过最大重试次数
        if (attempts > maxRetries) {
          console.error(`${operationName} 已达到最大重试次数 (${maxRetries})，放弃重试`);
          throw new InternalServerError(`服务暂时不可用，已重试${maxRetries}次`);
        }

        // 检查错误类型，只对特定错误进行重试
        const shouldRetry =
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600) ||
          error.response.status === 429 || // 频率限制
          error.code === 'ECONNABORTED' || // 超时
          error.code === 'ECONNRESET' || // 连接重置
          error.code === 'ETIMEDOUT'; // 超时

        if (shouldRetry) {
          console.log(
            `⚠️  ${operationName} 失败，${delay}ms后重试 (第${attempts}次) - ${error.message}`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 指数退避
        } else {
          // 其他错误类型直接抛出
          console.error(`❌ ${operationName} 遇到不可重试的错误:`, error.message);
          throw error;
        }
      }
    }
  }

  /**
   * 获取降级路径（备用方案）
   * @param {string} goal - 学习目标
   * @param {number} days - 学习天数
   * @param {string} intensity - 学习强度
   */
  static getFallbackPath(goal, days, intensity) {
    console.log(
      `🔄 使用降级策略生成学习路径: goal="${goal}", days=${days}, intensity=${intensity}`
    );

    // 根据学习目标选择证书类型
    let certificateType = '计算机';
    if (goal.includes('英语') || goal.includes('雅思') || goal.includes('四六级')) {
      certificateType = '英语';
    } else if (goal.includes('会计') || goal.includes('财务')) {
      certificateType = '会计';
    } else if (goal.includes('教师') || goal.includes('教育')) {
      certificateType = '教师';
    } else if (goal.includes('设计') || goal.includes('UI')) {
      certificateType = '设计';
    }

    // 根据强度调整每天的学习模块数
    const modulesPerDay = intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1;
    const learningHours =
      intensity === 'high' ? '3-4小时' : intensity === 'medium' ? '2-3小时' : '1-2小时';

    // 生成简化的学习路径
    const modules = [];
    const topicsMap = {
      计算机: ['编程基础', '数据结构', '算法', '数据库', 'Web开发', '系统设计'],
      英语: ['词汇', '语法', '听力', '口语', '阅读', '写作'],
      会计: ['会计基础', '财务报表', '成本会计', '管理会计', '审计', '税法'],
      教师: ['教育学', '心理学', '教学设计', '课堂管理', '教育技术', '教育法规'],
      设计: ['设计基础', '色彩理论', '排版', '用户体验', '界面设计', '交互设计'],
    };

    const topics = topicsMap[certificateType] || topicsMap['计算机'];

    for (let day = 1; day <= days; day++) {
      const dayTopics = [];
      for (let i = 0; i < modulesPerDay; i++) {
        const topicIndex = (day - 1 + i) % topics.length;
        dayTopics.push(topics[topicIndex]);
      }

      modules.push({
        day: day,
        moduleName: `${certificateType}学习 - 第${day}天`,
        detailedContent: `第${day}天：${dayTopics.join('、')}。建议学习时长${learningHours}。`,
        topics: dayTopics,
        resourceLink: `https://example.com/${certificateType.toLowerCase()}/day-${day}`,
        estimatedTime: learningHours,
      });
    }

    const path = {
      title: goal,
      days: days,
      certificateType: certificateType,
      intensity: intensity,
      modules: modules,
      summary: `为您生成了${days}天的${goal}学习计划，涵盖${certificateType}专业知识体系。学习强度：${intensity}。`,
      isFallback: true, // 标记为降级方案
      generatedAt: new Date().toISOString(),
    };

    console.log(`✅ 降级学习路径生成完成: ${modules.length}个学习模块`);
    return path;
  }

  /**
   * 生成学习路径
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件函数
   */
  static async generateLearningPath(req, res, next) {
    const startTime = Date.now();

    try {
      // 1. 合并 GET 和 POST 请求的参数
      const params = {
        ...req.query,
        ...req.body,
      };

      // 2. 前置参数校验
      AiController.validateParams(params);

      const { goal, daysNum, intensity = 'medium' } = params;
      const days = parseInt(daysNum);

      // 从认证中间件获取用户ID
      const userId = req.user?._id;

      console.log(
        `📝 开始生成学习路径: goal="${goal}", days=${days}, intensity=${intensity}, userId=${userId}`
      );

      // 3. 获取用户信息
      let user;
      if (userId) {
        user = await User.findById(userId);
        if (!user) {
          throw new NotFoundError('用户不存在');
        }
      }

      // 4. 检查用户生成次数是否达到基于时间窗口的限制（使用会员系统）
      if (user && user.learningStats) {
        const now = new Date();

        // 转换为GMT+8时区
        const gmt8Offset = 8 * 60 * 60 * 1000;
        const gmt8Now = new Date(now.getTime() + gmt8Offset);
        const gmt8Today = new Date(gmt8Now.getFullYear(), gmt8Now.getMonth(), gmt8Now.getDate());

        // 检查是否需要重置每日计数（GMT+8时区）
        const lastResetDate = user.learningStats.lastResetDate;
        const gmt8LastReset = lastResetDate ? new Date(lastResetDate.getTime() + gmt8Offset) : null;
        const gmt8LastResetDay = gmt8LastReset
          ? new Date(gmt8LastReset.getFullYear(), gmt8LastReset.getMonth(), gmt8LastReset.getDate())
          : null;

        let dailyCount = user.learningStats.dailyGenerationCount || 0;

        // 如果上次重置日期不是今天（GMT+8），则重置计数
        if (!gmt8LastResetDay || gmt8LastResetDay.getTime() !== gmt8Today.getTime()) {
          dailyCount = 0;
          await User.findByIdAndUpdate(userId, {
            'learningStats.dailyGenerationCount': 0,
            'learningStats.lastResetDate': now,
          });
          console.log(`🔄 重置用户 ${userId} 的每日生成计数（GMT+8）`);
        }

        // 根据会员等级确定每日限制
        const membershipLevel = user.membership?.level || 'free';
        const membershipExpireDate = user.membership?.expireDate;

        // 检查会员是否过期
        let effectiveLevel = membershipLevel;
        if (membershipExpireDate && new Date(membershipExpireDate) < now) {
          effectiveLevel = 'free';
          await User.findByIdAndUpdate(userId, {
            'membership.level': 'free',
            'membership.expireDate': null,
          });
          console.log(`⚠️  用户 ${userId} 的会员已过期，降级为免费用户`);
        }

        let dailyLimit;
        switch (effectiveLevel) {
          case 'gold':
            dailyLimit = Infinity; // 黄金会员无限次
            break;
          case 'silver':
            dailyLimit = 20; // 白银会员20次/天
            break;
          default:
            dailyLimit = 3; // 免费用户3次/天
        }

        // 检查是否达到限制（黄金会员除外）
        if (dailyLimit !== Infinity && dailyCount >= dailyLimit) {
          // 计算下次可用时间（GMT+8时区的午夜）
          const nextAvailableTime = new Date(
            gmt8Today.getTime() + 24 * 60 * 60 * 1000 - gmt8Offset
          );
          const hoursUntilReset = Math.ceil((nextAvailableTime - now) / (60 * 60 * 1000));

          const levelName = effectiveLevel === 'silver' ? '白银会员' : '免费用户';
          throw new TooManyRequestsError(
            `您已达到今日学习路径生成次数上限（${levelName}${dailyLimit}次/天），请${hoursUntilReset}小时后再试`
          );
        }

        // 增加每日计数
        dailyCount++;
        await User.findByIdAndUpdate(userId, {
          'learningStats.dailyGenerationCount': dailyCount,
        });

        console.log(
          `📊 用户 ${userId} 今日已生成 ${dailyCount}/${dailyLimit === Infinity ? '∞' : dailyLimit} 次（${effectiveLevel}）`
        );
      }

      // 5. 尝试调用AI服务生成学习路径
      let learningPath;
      let useFallback = false;

      try {
        const axiosInstance = axios.create(AiController.getRequestConfig());

        learningPath = await AiController.retryWithExponentialBackoff(
          async () => {
            const response = await axiosInstance.post('/ai/internal/generate-path', {
              goal: goal.trim(),
              days: days,
              intensity: intensity,
              userInterests: user?.learningInterests || [],
            });

            if (!response.data.success) {
              throw new InternalServerError(response.data.message || 'AI服务生成失败');
            }

            return response.data.plan;
          },
          3, // 最大重试3次
          1000, // 初始延迟1秒
          'AI学习路径生成'
        );
      } catch (aiError) {
        console.error('❌ AI服务调用失败，使用降级方案:', {
          error: aiError.message,
          code: aiError.code,
          status: aiError.response?.status,
        });

        // 降级策略：使用本地生成的学习路径
        learningPath = AiController.getFallbackPath(goal, days, intensity);
        useFallback = true;
      }

      // 6. 更新用户生成历史记录
      if (user) {
        try {
          await User.findByIdAndUpdate(userId, {
            $push: { 'learningStats.pathGenerationHistory': new Date() },
          });
          console.log(`✅ 用户 ${userId} 生成历史记录已更新`);
        } catch (updateError) {
          console.error('❌ 更新用户生成历史记录失败:', updateError.message);
          // 不影响主流程，但记录错误以便后续排查
          PerformanceMonitor.log('用户生成历史记录更新', 0, false, {
            userId,
            error: updateError.message,
          });
        }
      }

      // 7. 返回成功响应
      const duration = Date.now() - startTime;
      PerformanceMonitor.log('学习路径生成', duration, true, {
        goal,
        days,
        intensity,
        userId,
        isFallback: useFallback,
        moduleCount: learningPath.modules?.length || 0,
      });

      res.status(200).json({
        success: true,
        message: '学习路径生成成功',
        plan: learningPath,
        metadata: {
          generatedAt: new Date().toISOString(),
          duration: `${duration}ms`,
          isFallback: useFallback,
          userId: userId,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.log('学习路径生成', duration, false, {
        error: error.message,
        userId: req.user?._id,
      });
      next(error);
    }
  }

  /**
   * 测试生成学习路径（无需认证）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件函数
   */
  static async testGenerateLearningPath(req, res, next) {
    const startTime = Date.now();

    try {
      // 1. 前置参数校验
      AiController.validateParams(req.body);

      const { goal, daysNum, intensity = 'medium' } = req.body;
      const days = parseInt(daysNum);

      console.log(`🧪 测试环境生成学习路径: goal="${goal}", days=${days}, intensity=${intensity}`);

      // 2. 直接使用降级策略生成学习路径（用于测试）
      const learningPath = AiController.getFallbackPath(goal, days, intensity);

      // 3. 返回成功响应
      const duration = Date.now() - startTime;
      PerformanceMonitor.log('测试学习路径生成', duration, true, {
        goal,
        days,
        intensity,
        moduleCount: learningPath.modules?.length || 0,
      });

      res.status(200).json({
        success: true,
        message: '测试环境学习路径生成成功',
        plan: learningPath,
        metadata: {
          generatedAt: new Date().toISOString(),
          duration: `${duration}ms`,
          isTest: true,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      PerformanceMonitor.log('测试学习路径生成', duration, false, {
        error: error.message,
      });
      next(error);
    }
  }
}

// 导出控制器方法
export const generateLearningPath = AiController.generateLearningPath;
export const testGenerateLearningPath = AiController.testGenerateLearningPath;
