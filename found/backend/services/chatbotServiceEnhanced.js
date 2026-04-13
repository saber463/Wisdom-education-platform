const axios = require('axios');
require('dotenv').config();

class ChatbotServiceEnhanced {
  // 静态配置
  static #config = {
    url: process.env.CHATBOT_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1',
    apiKey: process.env.CHATBOT_API_KEY,
    timeout: 35000, // 增加超时时间到35秒
    retryAttempts: 2, // 重试次数
    retryDelay: 1500, // 重试延迟
  };

  // 上下文记忆存储（简单实现，生产环境可使用Redis等）
  static #contextMemory = new Map();

  /**
   * 向聊天机器人发送消息
   * @param {string} message - 用户发送的消息
   * @param {Object[]} history - 聊天历史记录
   * @param {string} userId - 用户ID，用于上下文记忆
   * @returns {Promise<string>} - 聊天机器人的响应
   */
  static async sendMessage(message, history = [], userId = null) {
    try {
      // 如果有userId，获取用户的上下文记忆
      let fullHistory = [...history];
      if (userId) {
        const userMemory = this.#contextMemory.get(userId) || [];
        fullHistory = [...userMemory, ...fullHistory];
      }

      // 构建请求数据
      const requestData = {
        model: 'Qwen3-7B',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的学习助手，帮助用户解决学习问题。请提供详细、准确的回答，并保持友好的语气。',
          },
          ...fullHistory,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
        n: 1,
      };

      // 设置重试逻辑
      let response;
      for (let i = 0; i < this.#config.retryAttempts; i++) {
        try {
          response = await axios.post(`${this.#config.url}/chat/completions`, requestData, {
            headers: {
              Authorization: `Bearer ${this.#config.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: this.#config.timeout,
          });
          break; // 成功则跳出循环
        } catch (error) {
          console.error(`聊天机器人API调用失败 (尝试 ${i + 1}/${this.#config.retryAttempts}):`, {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            userId: userId,
          });

          if (i === this.#config.retryAttempts - 1) {
            throw error; // 最后一次尝试失败则抛出错误
          }

          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, this.#config.retryDelay));
        }
      }

      // 保存上下文到记忆中
      if (userId) {
        const assistantResponse = response.data.choices[0].message.content;
        const updatedHistory = [
          ...fullHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: assistantResponse },
        ];

        // 只保留最近的10轮对话，避免记忆过大
        const recentHistory = updatedHistory.slice(-20); // 每轮包括user和assistant的消息
        this.#contextMemory.set(userId, recentHistory);
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('聊天机器人API调用最终失败:', {
        message: error.message,
        userId: userId,
        messageContent: message.substring(0, 100), // 只记录前100个字符
      });

      // 使用降级方案
      return await this._fallbackToXunFei(message, history, userId);
    }
  }

  /**
   * 生成个性化学习建议
   * @param {string} learningGoal - 学习目标
   * @param {Object[]} currentProgress - 当前学习进度
   * @param {Object} userProfile - 用户个人资料（包含兴趣、偏好等）
   * @returns {Promise<string>} - 个性化学习建议
   */
  static async generatePersonalizedLearningAdvice(
    learningGoal,
    currentProgress = [],
    userProfile = {}
  ) {
    try {
      // 构建个性化的学习建议请求
      const {
        learningInterests = [],
        preferredLearningStyle = 'visual',
        learningTimePerWeek = 10,
      } = userProfile;

      const progressSummary =
        currentProgress.length > 0
          ? `\n当前学习进度：${JSON.stringify(currentProgress)}`
          : '\n暂无学习进度';

      const interestsSummary =
        learningInterests.length > 0 ? `\n我感兴趣的领域有：${learningInterests.join('、')}` : '';

      const styleSummary = `\n我的学习风格是：${preferredLearningStyle}（视觉/听觉/阅读/动觉）`;

      const timeSummary = `\n我每周可用于学习的时间约为：${learningTimePerWeek}小时`;

      const message =
        `请根据我的情况，为我生成一份详细的个性化学习建议：\n` +
        `学习目标：${learningGoal}${progressSummary}${interestsSummary}${styleSummary}${timeSummary}\n` +
        `建议内容应包括：\n` +
        `1. 个性化学习路径（基于我的目标和兴趣）\n` +
        `2. 适合我的学习风格的学习方法\n` +
        `3. 合理的每周学习安排（考虑我的可用时间）\n` +
        `4. 针对性的学习资源推荐\n` +
        `5. 有效的学习习惯培养建议\n` +
        `6. 考试或评估准备策略（如果适用）\n` +
        `7. 保持学习动力的方法\n\n` +
        `请尽量详细、具体，并且符合我的实际情况。`;

      return await this.sendMessage(message, [], userProfile._id || null);
    } catch (error) {
      console.error('生成个性化学习建议错误:', {
        message: error.message,
        learningGoal: learningGoal.substring(0, 100),
        userId: userProfile._id,
      });

      // 使用增强的本地降级方案
      return this._enhancedFallbackLearningAdvice(learningGoal, currentProgress, userProfile);
    }
  }

  /**
   * 清除用户的上下文记忆
   * @param {string} userId - 用户ID
   */
  static clearContext(userId) {
    if (userId) {
      this.#contextMemory.delete(userId);
    }
  }

  /**
   * 使用讯飞星火作为降级方案
   * @param {string} message - 用户消息
   * @param {Object[]} history - 聊天历史
   * @param {string} userId - 用户ID
   * @returns {Promise<string>} - 响应内容
   * @private
   */
  static async _fallbackToXunFei(message, history = [], userId = null) {
    console.log('使用讯飞星火API作为降级方案');

    try {
      const response = await axios.post(
        'https://spark-api-open.xf-yun.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo', // 使用兼容的模型名称
          messages: [
            {
              role: 'system',
              content:
                '你是一个专业的学习助手，帮助用户解决学习问题。请提供详细、准确的回答，并保持友好的语气。',
            },
            ...history,
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.XUNFEI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: this.#config.timeout,
        }
      );

      // 保存上下文到记忆中
      if (userId) {
        const assistantResponse = response.data.choices[0].message.content;
        const updatedHistory = [
          ...history,
          { role: 'user', content: message },
          { role: 'assistant', content: assistantResponse },
        ];
        const recentHistory = updatedHistory.slice(-20);
        this.#contextMemory.set(userId, recentHistory);
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('讯飞星火API调用也失败了:', error.message);

      // 使用本地模板作为最终降级方案
      return this._getLocalTemplateResponse(message, userId);
    }
  }

  /**
   * 增强的本地降级方案生成学习建议
   * @param {string} learningGoal - 学习目标
   * @param {Object[]} currentProgress - 当前学习进度
   * @param {Object} userProfile - 用户个人资料
   * @returns {string} - 学习建议
   * @private
   */
  static _enhancedFallbackLearningAdvice(learningGoal, currentProgress, userProfile) {
    console.log('使用增强的本地降级方案生成学习建议');

    const {
      learningInterests = [],
      preferredLearningStyle = 'visual',
      learningTimePerWeek = 10,
    } = userProfile;

    // 根据学习风格调整建议
    const styleAdvice =
      {
        visual:
          '建议多使用图表、思维导图、视频教程等视觉化学习资源，将知识点可视化有助于记忆和理解。',
        auditory: '建议多听音频课程、参与讨论、朗读教材，将知识点转化为声音有助于记忆。',
        reading: '建议多读教材、论文、技术文档，通过阅读深入理解知识点。',
        kinesthetic: '建议多做实践项目、练习题，通过动手操作巩固所学知识。',
      }[preferredLearningStyle] || '请根据自己的学习风格选择合适的学习方法。';

    // 根据可用时间调整学习计划
    let studyPlanAdvice;
    if (learningTimePerWeek < 5) {
      studyPlanAdvice = '建议优先学习核心知识点，制定短期、集中的学习计划，每天坚持学习。';
    } else if (learningTimePerWeek < 15) {
      studyPlanAdvice = '建议合理分配时间，每周学习2-3个主题，平衡学习和复习的时间。';
    } else {
      studyPlanAdvice =
        '建议制定详细的学习计划，系统地学习各个知识点，适当增加实践和项目练习的时间。';
    }

    // 根据兴趣调整学习资源推荐
    let resourceAdvice = '推荐使用官方教材、在线课程、实践项目等资源进行学习。';
    if (learningInterests.includes('编程')) {
      resourceAdvice = '推荐使用LeetCode、GitHub、MDN等编程学习资源，多做实践项目。';
    } else if (learningInterests.includes('语言')) {
      resourceAdvice = '推荐使用多邻国、BBC Learning English、英语流利说等语言学习资源。';
    } else if (learningInterests.includes('设计')) {
      resourceAdvice = '推荐使用Figma、Behance、Dribbble等设计学习资源，多做设计练习。';
    }

    return `# 个性化学习建议\n\n## 学习目标：${learningGoal}\n\n### 1. 个性化学习路径\n建议您按照以下路径进行学习：\n- 基础阶段（1-4周）：掌握核心概念和基础知识\n- 进阶阶段（5-12周）：深入学习专业知识和技能\n- 实践阶段（13-16周）：通过项目和练习巩固所学内容\n- 提升阶段（17周以后）：扩展知识领域，进行综合应用\n\n### 2. 学习风格匹配建议\n${styleAdvice}\n\n### 3. 每周学习安排\n${studyPlanAdvice}\n建议您：\n- 制定详细的每周学习计划\n- 每天固定时间学习，培养学习习惯\n- 定期复习和总结所学内容\n\n### 4. 学习资源推荐\n${resourceAdvice}\n- 官方教材和参考书籍\n- 在线课程和视频教程\n- 实践项目和练习题\n- 学习社区和论坛\n\n### 5. 学习方法建议\n- 采用主动学习方法，如费曼学习法\n- 做好学习笔记和知识总结\n- 定期进行自我测试和评估\n- 与其他学习者交流和讨论\n\n### 6. 保持学习动力的方法\n- 设定明确的短期和长期目标\n- 记录学习进度，定期回顾\n- 奖励自己完成的学习任务\n- 寻找学习伙伴或加入学习小组\n\n请注意，这是一个基于您提供的信息生成的个性化学习建议。建议您根据自己的实际情况进行调整和优化。`;
  }

  /**
   * 获取本地模板响应
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @returns {string} - 本地模板响应
   * @private
   */
  static _getLocalTemplateResponse(message, _userId = null) {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('学习建议') || messageLower.includes('学习计划')) {
      return this._enhancedFallbackLearningAdvice('您的学习目标', [], {});
    } else if (messageLower.includes('你好') || messageLower.includes('hi')) {
      return '您好！我是您的学习助手，很高兴为您提供帮助。请问有什么学习相关的问题可以帮您解答？';
    } else if (messageLower.includes('谢谢') || messageLower.includes('感谢')) {
      return '不客气！如果您有任何其他问题，随时都可以问我。';
    } else {
      return '抱歉，当前AI服务暂时不可用。我可以为您提供一些基本的学习建议，请问您有什么具体的学习问题吗？';
    }
  }

  /**
   * 清除所有上下文记忆（用于测试或维护）
   */
  static clearAllContext() {
    this.#contextMemory.clear();
  }
}

module.exports = ChatbotServiceEnhanced;
