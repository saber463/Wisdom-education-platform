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

// 引入讯飞星火API路线图服务
import {
  generateLearningPath as xunfeiGeneratePath,
  getAvailableRoadmaps,
} from '../services/xunfeiRoadmapService.js';

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
    let detailedTopics = [];

    if (
      goal.includes('英语') ||
      goal.includes('雅思') ||
      goal.includes('四六级') ||
      goal.includes('托福')
    ) {
      certificateType = '英语';
      detailedTopics = [
        {
          name: '英语基础音标与发音',
          desc: '学习48个国际音标，掌握正确发音技巧，练习单词重音和句子语调。每天练习30分钟，模仿标准发音。',
        },
        {
          name: '核心词汇积累',
          desc: '每天记忆30-50个核心词汇，使用词根词缀法记忆，理解词汇在不同语境中的用法。推荐使用Anki进行间隔重复记忆。',
        },
        {
          name: '基础语法体系',
          desc: '系统学习十大词性、八大时态、三大从句等核心语法知识，建立完整语法框架。做练习题巩固所学。',
        },
        {
          name: '听力训练',
          desc: '从简单听力材料开始，逐步过渡到新闻、演讲、电影等复杂材料。每天精听30分钟泛听20分钟。',
        },
        {
          name: '口语表达',
          desc: '跟读模仿地道表达，练习日常对话，描述图片和事件。可使用HelloTalk等APP与母语者交流。',
        },
        {
          name: '阅读理解技巧',
          desc: '学习快速阅读技巧，掌握扫读、略读方法，提高阅读速度和理解准确率。每天阅读2-3篇英文文章。',
        },
        {
          name: '写作能力提升',
          desc: '学习不同文体写作格式，练习句型转换和段落展开，背诵经典句式和模板。每周写2篇作文。',
        },
        {
          name: '综合应用与模拟',
          desc: '做历年真题和模拟试题，熟悉考试题型和时间分配，提升应考技巧和心理素质。',
        },
      ];
    } else if (
      goal.includes('会计') ||
      goal.includes('财务') ||
      goal.includes('CPA') ||
      goal.includes('ACCA')
    ) {
      certificateType = '会计';
      detailedTopics = [
        {
          name: '会计基础理论',
          desc: '理解会计基本假设、会计要素、会计等式，掌握复式记账法原理和借贷记账规则。',
        },
        {
          name: '财务会计实务',
          desc: '学习资产、负债、所有者权益的核算方法，掌握收入、费用、利润的确认与计量。',
        },
        {
          name: '财务报表分析',
          desc: '解读资产负债表、利润表、现金流量表，进行比率分析和趋势分析，评估企业财务状况。',
        },
        {
          name: '成本会计与管理会计',
          desc: '掌握成本计算方法（品种法、分批法、分步法），学习本量利分析、预算管理。',
        },
        {
          name: '税法与税务实务',
          desc: '学习增值税、消费税、企业所得税、个人所得税等主要税种的计算方法和申报流程。',
        },
        {
          name: '审计基础',
          desc: '了解审计基本原理、审计程序、审计证据、审计报告等核心概念和实务操作。',
        },
        {
          name: '财务管理与投资决策',
          desc: '学习资金时间价值、证券估值、资本预算方法，优化企业投资和融资决策。',
        },
        {
          name: '综合案例分析与模拟',
          desc: '通过真实企业案例进行综合分析，做历年真题和模拟试卷，提升应试能力。',
        },
      ];
    } else if (goal.includes('教师') || goal.includes('教育')) {
      certificateType = '教师';
      detailedTopics = [
        {
          name: '教育学基础理论',
          desc: '学习教育的本质、目的、功能，了解教育与政治经济文化的关系，树立正确教育观。',
        },
        {
          name: '教育心理学',
          desc: '掌握学生认知发展、学习动机、知识技能习得规律，应用心理学原理优化教学。',
        },
        {
          name: '课程与教学设计',
          desc: '学习课程设计原理、教学目标编写、教学过程组织、教学方法选择与运用。',
        },
        {
          name: '课堂教学技能',
          desc: '练习导入、讲授、提问、互动、板书、总结等教学基本技能，提升课堂掌控力。',
        },
        {
          name: '学生管理与沟通',
          desc: '学习班级管理技巧、学生行为引导、与家长沟通方法，建立良好师生关系。',
        },
        {
          name: '教育法律法规',
          desc: '掌握教育法、教师法、未成年人保护法等重要教育法规，依法执教。',
        },
        {
          name: '信息技术与融合',
          desc: '学习现代教育技术（多媒体、智慧教室、在线教学平台），探索信息技术与学科融合。',
        },
        {
          name: '教学实践与反思',
          desc: '进行教学观摩、试讲、评课，反思教学实践，不断改进教学方法和策略。',
        },
      ];
    } else if (goal.includes('设计') || goal.includes('UI') || goal.includes('UX')) {
      certificateType = '设计';
      detailedTopics = [
        {
          name: '设计基础理论',
          desc: '学习设计史论、设计思维、用户中心设计理念，理解设计的本质和价值。',
        },
        {
          name: '色彩理论与配色',
          desc: '掌握色彩心理学、色彩搭配原则、冷暖色对比，练习不同风格的配色方案。',
        },
        {
          name: '排版与字体设计',
          desc: '学习字体分类、字号层级、行距字距、版式布局原则，提升文字信息传达效率。',
        },
        {
          name: '图形与图标设计',
          desc: '练习几何图形绘制、图标设计（线性、填充、扁平风格）、品牌视觉元素。',
        },
        {
          name: '用户体验研究',
          desc: '学习用户研究方法（访谈、问卷、可用性测试）、用户画像、用户体验地图。',
        },
        {
          name: '界面设计规范',
          desc: '掌握iOS Human Interface Guidelines和Material Design规范，设计符合平台标准的界面。',
        },
        {
          name: '交互设计与原型',
          desc: '学习交互设计原则、手势操作、流程设计，使用Figma/Axure制作高保真原型。',
        },
        {
          name: '作品集与求职指导',
          desc: '整理优秀作品集，优化简历和面试技巧，准备设计岗位求职材料。',
        },
      ];
    } else {
      // 默认计算机方向
      detailedTopics = [
        {
          name: '编程基础入门',
          desc: '学习变量、数据类型、运算符、控制结构（if/else、循环）等编程基础概念，使用Python或JavaScript入门。',
        },
        {
          name: '算法与数据结构基础',
          desc: '掌握数组、链表、栈、队列、树等基础数据结构，学习排序、查找、递归等基本算法思想。',
        },
        {
          name: '前端开发技术',
          desc: '学习HTML标签、CSS样式、JavaScript交互，使用Vue或React框架进行组件化开发。',
        },
        {
          name: '后端开发技术',
          desc: '学习Node.js或Python Flask/Django框架，掌握路由设计、数据库操作、API开发。',
        },
        {
          name: '数据库技术',
          desc: '学习MySQL数据库设计（表、索引、视图），掌握SQL查询优化，了解Redis缓存应用。',
        },
        {
          name: 'Git版本控制',
          desc: '熟练使用Git进行代码版本管理，掌握分支创建、合并、冲突处理等协作开发技能。',
        },
        {
          name: '网络与安全基础',
          desc: '理解HTTP协议、TCP/IP模型、前端安全（XSS、CSRF、SQL注入）及防护措施。',
        },
        {
          name: '项目实战与部署',
          desc: '完成一个完整项目的设计、开发、测试和部署，熟悉Docker容器化和云服务器部署。',
        },
      ];
    }

    // 根据强度调整学习时间
    const timeMap = {
      low: { daily: '30-60分钟', session: '上午30分钟 + 下午30分钟' },
      medium: { daily: '60-90分钟', session: '上午45分钟 + 下午45分钟' },
      high: { daily: '90-120分钟', session: '上午60分钟 + 下午60分钟' },
    };
    const timeConfig = timeMap[intensity] || timeMap.medium;

    // 生成详细的学习路径
    const modules = [];

    // 将详细主题循环分配到每天
    for (let day = 1; day <= days; day++) {
      // 使用循环索引获取主题，确保每天都充实
      const topicIndex = (day - 1) % detailedTopics.length;
      const topic = detailedTopics[topicIndex];

      // 为每个主题添加每日具体安排
      const dailySchedule = [
        { time: '上午', content: `复习前一天内容 + 学习${topic.name}核心概念`, duration: '30分钟' },
        { time: '中午', content: `整理笔记 + 绘制思维导图`, duration: '20分钟' },
        { time: '下午', content: `${topic.desc.split('。')[0]}，做配套练习`, duration: '45分钟' },
        { time: '晚上', content: `项目实践/刷题 + 总结今日学习内容`, duration: '30分钟' },
      ];

      modules.push({
        day: day,
        moduleName: `${topic.name}`,
        detailedContent: `${topic.desc}\n\n📅 每日学习安排：\n${dailySchedule.map(s => `• ${s.time}（${s.duration}）：${s.content}`).join('\n')}`,
        topics: [topic.name],
        estimatedTime: timeConfig.daily,
        dailySchedule: dailySchedule,
        resourceLink: '',
        practice: `完成本知识点的练习题和实践项目，整理学习笔记`,
        checkpoint: `自我检测：能用自己的话复述${topic.name}的核心内容`,
      });
    }

    const path = {
      title: goal,
      days: days,
      certificateType: certificateType,
      intensity: intensity,
      modules: modules,
      summary: `📚 ${days}天${goal}学习计划\n\n本计划涵盖${detailedTopics.length}个核心知识模块，采用「理论学习→实践巩固→总结复盘」的学习方法。每天建议学习${timeConfig.daily}，分${timeConfig.session}两个时段进行。\n\n🎯 学习目标：\n1. 掌握${certificateType}领域核心理论知识\n2. 完成配套练习和实践项目\n3. 建立完整的知识体系框架\n4. 提升解决实际问题的能力\n\n💡 学习建议：\n• 坚持每日学习，保持连贯性\n• 做好学习笔记，定期回顾\n• 遇到问题及时记录并解决\n• 适时进行阶段性测试检验学习效果`,
      isFallback: true,
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
        console.error('❌ AI服务调用失败，使用讯飞路线图服务:', {
          error: aiError.message,
          code: aiError.code,
          status: aiError.response?.status,
        });

        // 降级策略：使用讯飞星火API路线图服务生成
        try {
          learningPath = await xunfeiGeneratePath(goal, days, intensity);
          useFallback = true;
          console.log('✅ 使用讯飞路线图服务生成成功');
        } catch (roadmapError) {
          // 最终降级：使用内置fallback
          learningPath = AiController.getFallbackPath(goal, days, intensity);
          console.log('⚠️ 讯飞服务也失败了，使用内置fallback');
        }
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

      // 2. 尝试调用真正的AI接口生成学习路径
      let learningPath;
      let useFallback = false;

      try {
        const axiosInstance = axios.create(AiController.getRequestConfig());

        const response = await axiosInstance.post('/ai/internal/generate-path', {
          goal: goal.trim(),
          days: days,
          intensity: intensity,
          userInterests: [],
        });

        if (response.data.success) {
          learningPath = response.data.plan;
          console.log(`✅ 测试接口 AI 生成成功: ${learningPath?.modules?.length || 0} 个模块`);
        } else {
          throw new Error(response.data.message || 'AI服务返回失败');
        }
      } catch (aiError) {
        console.error('⚠️  测试接口 AI 调用失败，使用讯飞路线图服务:', aiError.message);
        try {
          learningPath = await xunfeiGeneratePath(goal, days, intensity);
          useFallback = true;
          console.log('✅ 使用讯飞路线图服务生成成功');
        } catch (roadmapError) {
          learningPath = AiController.getFallbackPath(goal, days, intensity);
          console.log('⚠️ 讯飞服务也失败了，使用内置fallback');
        }
      }

      // 3. 返回成功响应
      const duration = Date.now() - startTime;
      PerformanceMonitor.log('测试学习路径生成', duration, true, {
        goal,
        days,
        intensity,
        isFallback: useFallback,
        moduleCount: learningPath.modules?.length || 0,
      });

      res.status(200).json({
        success: true,
        message: useFallback ? '测试环境学习路径生成成功（降级方案）' : '测试环境学习路径生成成功',
        plan: learningPath,
        metadata: {
          generatedAt: new Date().toISOString(),
          duration: `${duration}ms`,
          isTest: true,
          isFallback: useFallback,
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
