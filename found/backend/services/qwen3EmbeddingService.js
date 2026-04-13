const axios = require('axios');

// Qwen3-Embedding-8B模型配置
const QWEN3_EMBEDDING_CONFIG = {
  url: process.env.QWEN_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1/rerank',
  apiKey: process.env.QWEN_API_KEY,
  apiKeyFallback: process.env.QWEN_API_KEY_FALLBACK, // 备用API密钥
  timeout: 30000, // 30秒超时设置
  retryAttempts: 2, // 重试次数
  retryDelay: 1000, // 重试延迟
};

class Qwen3EmbeddingService {
  /**
   * 使用指定API密钥调用API
   * @param {string} apiKey - API密钥
   * @param {Object} requestData - 请求数据
   * @returns {Promise<Object>} API响应
   */
  static async _callApiWithKey(apiKey, requestData) {
    return axios.post(QWEN3_EMBEDDING_CONFIG.url, requestData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: QWEN3_EMBEDDING_CONFIG.timeout,
    });
  }

  /**
   * 生成文本嵌入向量
   * @param {string} text - 要生成嵌入向量的文本
   * @returns {Promise<Array<number>>} 嵌入向量
   */
  static async generateEmbeddings(text) {
    const requestData = {
      model: 'Qwen3-Embedding-8B',
      input: text,
    };

    // 尝试使用主密钥
    try {
      const response = await this._callApiWithKey(QWEN3_EMBEDDING_CONFIG.apiKey, requestData);
      return response.data.data[0].embedding;
    } catch (primaryError) {
      console.error('Qwen3-Embedding-8B生成嵌入向量失败（主密钥）:', {
        message: primaryError.message,
        response: primaryError.response?.data,
        status: primaryError.response?.status,
        text: text.substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      // 检查是否有备用密钥
      if (QWEN3_EMBEDDING_CONFIG.apiKeyFallback) {
        console.log('尝试使用备用API密钥...');
        try {
          const response = await this._callApiWithKey(
            QWEN3_EMBEDDING_CONFIG.apiKeyFallback,
            requestData
          );
          console.log('备用API密钥使用成功');
          return response.data.data[0].embedding;
        } catch (fallbackError) {
          console.error('Qwen3-Embedding-8B生成嵌入向量失败（备用密钥）:', fallbackError.message);
        }
      }

      // 实现重试逻辑（使用主密钥）
      let retryAttempts = QWEN3_EMBEDDING_CONFIG.retryAttempts || 0;
      while (retryAttempts > 0) {
        try {
          console.log(
            `Qwen3-Embedding-8B重试第${QWEN3_EMBEDDING_CONFIG.retryAttempts - retryAttempts + 1}次`
          );
          await new Promise(resolve => setTimeout(resolve, QWEN3_EMBEDDING_CONFIG.retryDelay));

          const response = await this._callApiWithKey(QWEN3_EMBEDDING_CONFIG.apiKey, requestData);
          return response.data.data[0].embedding;
        } catch (retryError) {
          console.error(
            `Qwen3-Embedding-8B重试失败 (剩余${retryAttempts - 1}次):`,
            retryError.message
          );
          retryAttempts--;
        }
      }

      // 降级方案：返回默认嵌入向量
      return this._getDefaultEmbedding();
    }
  }

  /**
   * 对文档进行相关性排序
   * @param {string} query - 查询文本
   * @param {Array<string>} documents - 文档列表
   * @param {number} maxOutput - 返回结果数量
   * @returns {Promise<Array<{document: string, score: number}>>} 排序后的文档及相关性得分
   */
  static async rankDocuments(query, documents, maxOutput = 5) {
    try {
      const requestData = {
        model: 'Qwen3-Embedding-8B',
        query: query,
        documents: documents,
        max_output: maxOutput,
        return_documents: true,
      };

      // 尝试使用主密钥
      try {
        const response = await this._callApiWithKey(QWEN3_EMBEDDING_CONFIG.apiKey, requestData);
        return response.data.results;
      } catch (primaryError) {
        console.error('Qwen3-Embedding-8B文档排序失败（主密钥）:', {
          message: primaryError.message,
          response: primaryError.response?.data,
          status: primaryError.response?.status,
          query: query,
          documentCount: documents.length,
        });

        // 尝试使用备用密钥
        if (QWEN3_EMBEDDING_CONFIG.apiKeyFallback) {
          console.log('尝试使用备用API密钥...');
          try {
            const response = await this._callApiWithKey(
              QWEN3_EMBEDDING_CONFIG.apiKeyFallback,
              requestData
            );
            console.log('备用API密钥使用成功');
            return response.data.results;
          } catch (fallbackError) {
            console.error('Qwen3-Embedding-8B文档排序失败（备用密钥）:', fallbackError.message);
          }
        }

        // 降级方案：使用简单的关键词匹配
        return this._fallbackRankDocuments(query, documents, maxOutput);
      }
    } catch (error) {
      console.error('Qwen3-Embedding-8B文档排序失败:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        query: query,
        documentCount: documents.length,
      });

      // 降级方案：使用简单的关键词匹配
      return this._fallbackRankDocuments(query, documents, maxOutput);
    }
  }

  /**
   * 根据用户学习目标选择证书类型
   * @param {string} learningGoal - 用户学习目标
   * @returns {Promise<string>} 推荐的证书类型
   */
  static async selectCertificateType(learningGoal) {
    try {
      const certificates = [
        '计算机等级证书',
        '英语四六级证书',
        '会计从业资格证',
        '教师资格证',
        '平面设计证书',
        '商务英语证书',
      ];

      const results = await this.rankDocuments(learningGoal, certificates, 1);

      if (results.length > 0) {
        return results[0].document;
      }

      // 降级方案：使用关键词匹配
      return this._fallbackSelectCertificate(learningGoal);
    } catch (error) {
      console.error('Qwen3-Embedding-8B证书类型选择失败:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        learningGoal: learningGoal,
      });

      // 降级方案：使用关键词匹配
      return this._fallbackSelectCertificate(learningGoal);
    }
  }

  /**
   * 对学习主题进行排序
   * @param {string} query - 查询文本
   * @param {Array<string>} topics - 学习主题列表
   * @returns {Promise<Array<string>>} 排序后的学习主题
   */
  static async rankLearningTopics(query, topics) {
    try {
      const results = await this.rankDocuments(query, topics, topics.length);
      return results.map(item => item.document);
    } catch (error) {
      console.error('Qwen3-Embedding-8B学习主题排序失败:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        query: query,
        topicCount: topics.length,
      });

      // 降级方案：返回原始顺序
      return topics;
    }
  }

  /**
   * 分析用户兴趣（新增方法）
   * @param {string} userInput - 用户输入的兴趣描述
   * @param {Array<string>} availableTopics - 可用的兴趣主题列表
   * @returns {Promise<Array<string>>} 排序后的用户兴趣
   */
  static async analyzeUserInterests(userInput, availableTopics) {
    try {
      const results = await this.rankDocuments(userInput, availableTopics, availableTopics.length);
      return results.map(item => item.document);
    } catch (error) {
      console.error('Qwen3-Embedding-8B用户兴趣分析失败:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userInput: userInput.substring(0, 100), // 只记录前100个字符
      });

      // 降级方案：返回所有可用主题
      return availableTopics;
    }
  }

  /**
   * 获取推荐内容（新增方法）
   * @param {string} userInterest - 用户兴趣
   * @param {Array<string>} contentPool - 内容池
   * @param {number} limit - 返回数量
   * @returns {Promise<Array<string>>} 推荐内容列表
   */
  static async getRecommendations(userInterest, contentPool, limit = 5) {
    try {
      const results = await this.rankDocuments(userInterest, contentPool, limit);
      return results.map(item => item.document);
    } catch (error) {
      console.error('Qwen3-Embedding-8B内容推荐失败:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userInterest: userInterest,
        contentCount: contentPool.length,
      });

      // 降级方案：随机返回内容
      return this._shuffleArray(contentPool).slice(0, limit);
    }
  }

  // 私有方法：获取默认嵌入向量
  static _getDefaultEmbedding() {
    // 返回一个固定长度的随机向量
    const embedding = [];
    for (let i = 0; i < 1024; i++) {
      embedding.push(Math.random() * 2 - 1);
    }
    return embedding;
  }

  // 私有方法：降级方案 - 简单关键词匹配排序
  static _fallbackRankDocuments(query, documents, maxOutput) {
    const results = documents.map(doc => {
      let score = 0;
      const queryWords = query.toLowerCase().split(/\s+/);
      const docWords = doc.toLowerCase().split(/\s+/);

      // 计算关键词匹配数量
      queryWords.forEach(word => {
        if (docWords.includes(word)) {
          score += 1;
        }
      });

      return { document: doc, score: score };
    });

    // 按得分排序
    results.sort((a, b) => b.score - a.score);

    // 返回前maxOutput个结果
    return results.slice(0, maxOutput);
  }

  // 私有方法：降级方案 - 简单关键词匹配选择证书
  static _fallbackSelectCertificate(learningGoal) {
    const goal = learningGoal.toLowerCase();

    if (goal.includes('计算机') || goal.includes('编程') || goal.includes('软件')) {
      return '计算机等级证书';
    } else if (goal.includes('英语') || goal.includes('english') || goal.includes('language')) {
      return '英语四六级证书';
    } else if (goal.includes('会计') || goal.includes('财务') || goal.includes('税务')) {
      return '会计从业资格证';
    } else if (goal.includes('教师') || goal.includes('教育') || goal.includes('教学')) {
      return '教师资格证';
    } else if (goal.includes('设计') || goal.includes('平面') || goal.includes('ui')) {
      return '平面设计证书';
    } else if (goal.includes('商务') || goal.includes('business')) {
      return '商务英语证书';
    } else {
      return '计算机等级证书'; // 默认返回
    }
  }

  // 私有方法：随机打乱数组
  static _shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}

module.exports = Qwen3EmbeddingService;
