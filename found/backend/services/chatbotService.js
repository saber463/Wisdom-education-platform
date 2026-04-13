const axios = require('axios');
require('dotenv').config();

class ChatbotService {
  static #config = {
    url: process.env.CHATBOT_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1',
    apiKey: process.env.CHATBOT_API_KEY,
    apiKeyFallback: process.env.CHATBOT_API_KEY_FALLBACK,
    timeout: 30000,
  };

  /**
   * 使用指定密钥调用API
   * @param {string} key - API密钥
   * @param {string} message - 用户消息
   * @param {Object[]} history - 聊天历史
   * @returns {Promise<string>} - API响应
   * @private
   */
  static async _callApiWithKey(key, message, history) {
    const response = await axios.post(
      `${this.#config.url}/chat/completions`,
      {
        model: 'Qwen3-7B', // 使用Qwen3-7B模型
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
        top_p: 0.95,
        n: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: this.#config.timeout,
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * 向聊天机器人发送消息
   * @param {string} message - 用户发送的消息
   * @param {Object[]} history - 聊天历史记录
   * @returns {Promise<string>} - 聊天机器人的响应
   */
  static async sendMessage(message, history = []) {
    try {
      // 首先尝试使用主密钥
      return await this._callApiWithKey(this.#config.apiKey, message, history);
    } catch (error) {
      console.error('聊天机器人API错误(主密钥):', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // 如果有备用密钥，尝试使用备用密钥
      if (this.#config.apiKeyFallback) {
        try {
          console.log('尝试使用备用密钥调用聊天机器人API');
          return await this._callApiWithKey(this.#config.apiKeyFallback, message, history);
        } catch (fallbackError) {
          console.error('聊天机器人API错误(备用密钥):', {
            message: fallbackError.message,
            response: fallbackError.response?.data,
            status: fallbackError.response?.status,
          });

          // 使用讯飞星火作为降级方案
          return this._fallbackToXunFei(message, history);
        }
      } else {
        // 没有备用密钥，直接使用讯飞星火作为降级方案
        return this._fallbackToXunFei(message, history);
      }
    }
  }

  /**
   * 生成学习建议
   * @param {string} learningGoal - 学习目标
   * @param {Object[]} currentProgress - 当前学习进度
   * @returns {Promise<string>} - 学习建议
   */
  static async generateLearningAdvice(learningGoal, currentProgress = []) {
    try {
      const history = [];
      const progressSummary =
        currentProgress.length > 0
          ? `当前学习进度：${JSON.stringify(currentProgress)}`
          : '暂无学习进度';

      const message = `我的学习目标是：${learningGoal}。${progressSummary}。请给我一些针对性的学习建议，包括学习路径、每周学习安排、学习资源推荐、学习方法和考试准备策略。`;
      return await this.sendMessage(message, history);
    } catch (error) {
      console.error('生成学习建议错误:', error.message);

      // 使用本地降级方案
      return this._fallbackLearningAdvice(learningGoal, currentProgress);
    }
  }

  /**
   * 使用讯飞星火作为降级方案
   * @param {string} message - 用户消息
   * @param {Object[]} history - 聊天历史
   * @returns {Promise<string>} - 响应内容
   * @private
   */
  static async _fallbackToXunFei(message, history) {
    console.log('使用讯飞星火API作为降级方案');

    try {
      // 尝试使用主密钥
      let response = await axios.post(
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
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('讯飞星火API调用失败(主密钥):', error.message);

      // 如果有备用密钥，尝试使用备用密钥
      if (process.env.XUNFEI_API_KEY_FALLBACK) {
        try {
          console.log('尝试使用备用密钥调用讯飞星火API');
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
                Authorization: `Bearer ${process.env.XUNFEI_API_KEY_FALLBACK}`,
                'Content-Type': 'application/json',
              },
            }
          );

          return response.data.choices[0].message.content;
        } catch (fallbackError) {
          console.error('讯飞星火API调用也失败了(备用密钥):', fallbackError.message);

          // 返回简单的错误响应
          return '抱歉，当前服务暂时不可用，请稍后重试。';
        }
      } else {
        // 没有备用密钥，返回简单的错误响应
        return '抱歉，当前服务暂时不可用，请稍后重试。';
      }
    }
  }

  /**
   * 本地降级方案生成学习建议
   * @param {string} learningGoal - 学习目标
   * @param {Object[]} currentProgress - 当前学习进度
   * @returns {string} - 学习建议
   * @private
   */
  static _fallbackLearningAdvice(learningGoal, _currentProgress) {
    // 返回简单的学习建议模板
    return `# 个性化学习建议\n\n## 学习目标：${learningGoal}\n\n### 1. 学习路径建议\n建议您按照以下路径进行学习：\n- 基础阶段：掌握核心概念和基础知识\n- 进阶阶段：深入学习专业知识和技能\n- 实践阶段：通过项目和练习巩固所学内容\n- 备考阶段：针对考试进行专项训练\n\n### 2. 每周学习安排\n建议每周至少学习10小时，合理分配时间：\n- 周一至周五：每天学习1-2小时\n- 周六至周日：每天学习3-4小时\n\n### 3. 学习资源推荐\n- 官方教材和参考书籍\n- 在线课程和视频教程\n- 实践项目和练习题\n- 学习社区和论坛\n\n### 4. 学习方法建议\n- 制定详细的学习计划\n- 做好学习笔记和总结\n- 定期复习和巩固\n- 多做练习题和实践项目\n\n### 5. 考试准备策略\n- 熟悉考试大纲和题型\n- 做历年真题和模拟题\n- 掌握答题技巧和时间管理\n- 保持良好的心态和作息\n\n请注意，这是一个通用的学习建议模板。建议您根据自己的实际情况进行调整和优化。`;
  }
}

module.exports = ChatbotService;
