const axios = require('axios');
require('dotenv').config();

// Qwen3-Embedding-8B大模型配置
const QWEN3_EMBEDDING_CONFIG = {
  url: process.env.QWEN_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1/rerank',
  apiKey: process.env.QWEN_API_KEY,
  timeout: 30000, // 30秒超时设置
};

class Qwen3EmbeddingService {
  /**
   * 生成文本嵌入
   * @param {string} text - 要生成嵌入的文本
   * @returns {Promise<Array<number>>} - 文本嵌入向量
   */
  static async generateEmbeddings(text) {
    try {
      const response = await axios.post(
        'https://maas-api.cn-huabei-1.xf-yun.com/v1/embed',
        {
          model: 'Qwen3-Embedding-8B',
          input: text,
        },
        {
          headers: {
            Authorization: `Bearer ${QWEN3_EMBEDDING_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: QWEN3_EMBEDDING_CONFIG.timeout, // 添加超时设置
        }
      );

      return response.data.embeddings;
    } catch (error) {
      console.error('Qwen3-Embedding-8B生成嵌入失败:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
        text: text.substring(0, 100), // 记录前100个字符以避免日志过大
      });

      // 生成默认嵌入向量作为降级方案
      return this._generateDefaultEmbedding(text);
    }
  }

  /**
   * 使用Qwen3-Embedding-8B模型对文档进行相关性排序
   * @param {string} query - 查询内容
   * @param {Array<string>} documents - 待排序的文档列表
   * @param {number} maxOutput - 返回的最大结果数
   * @returns {Promise<Array<Object>>} - 排序后的文档结果
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

      const response = await axios.post(QWEN3_EMBEDDING_CONFIG.url, requestData, {
        headers: {
          Authorization: `Bearer ${QWEN3_EMBEDDING_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: QWEN3_EMBEDDING_CONFIG.timeout, // 添加超时设置
      });

      return response.data.results;
    } catch (error) {
      console.error('Qwen3-Embedding-8B模型调用失败:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
        query: query,
        documentCount: documents.length,
      });

      // 使用简单的关键词匹配作为降级方案
      return this._fallbackRankDocuments(query, documents, maxOutput);
    }
  }

  /**
   * 根据学习目标选择最相关的证书类型
   * @param {string} goal - 学习目标
   * @returns {Promise<string>} - 最相关的证书类型
   */
  static async selectCertificateType(goal) {
    const certificateCategories = [
      '计算机、编程、软件学习',
      '英语、雅思、托福、CET、四六级学习',
      '会计、财务、CPA、ACCA学习',
      '教师、教资、教师资格证学习',
      '设计、PS、Photoshop、AI、UI、平面设计学习',
    ];

    try {
      const results = await this.rankDocuments(goal, certificateCategories, 1);
      const bestMatch = results[0].document;

      // 映射到具体的证书类型
      if (bestMatch.includes('计算机')) return '计算机';
      if (bestMatch.includes('英语')) return '英语';
      if (bestMatch.includes('会计')) return '会计';
      if (bestMatch.includes('教师')) return '教师';
      if (bestMatch.includes('设计')) return '设计';

      return '计算机'; // 默认返回计算机证书类型
    } catch (error) {
      console.error('选择证书类型失败:', {
        message: error.message,
        goal: goal,
      });

      // 使用传统关键词匹配作为降级方案
      return this._fallbackSelectCertificateType(goal);
    }
  }

  /**
   * 对学习主题进行相关性排序
   * @param {string} goal - 学习目标
   * @param {Array<string>} topics - 学习主题列表
   * @returns {Promise<Array<string>>} - 排序后的学习主题
   */
  static async rankLearningTopics(goal, topics) {
    try {
      const results = await this.rankDocuments(goal, topics, topics.length);
      return results.map(item => item.document);
    } catch (error) {
      console.error('学习主题排序失败:', {
        message: error.message,
        goal: goal,
        topicCount: topics.length,
      });

      // 返回原始顺序作为降级方案
      return topics;
    }
  }

  /**
   * 生成默认嵌入向量（降级方案）
   * @param {string} text - 文本
   * @returns {Array<number>} - 默认嵌入向量
   * @private
   */
  static _generateDefaultEmbedding(text) {
    // 生成简单的哈希值作为嵌入向量
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    // 创建一个长度为100的默认向量
    const embedding = [];
    for (let i = 0; i < 100; i++) {
      embedding.push((hash % 1000) / 1000.0);
      hash = Math.abs((hash << 3) - hash);
    }

    return embedding;
  }

  /**
   * 文档排序的降级方案（简单关键词匹配）
   * @param {string} query - 查询文本
   * @param {Array<string>} documents - 文档数组
   * @param {number} maxOutput - 返回的最大结果数
   * @returns {Array<{document: string, score: number}>} - 排序后的文档数组
   * @private
   */
  static _fallbackRankDocuments(query, documents, maxOutput) {
    return documents
      .map(doc => {
        let score = 0;
        const queryWords = query.toLowerCase().split(/\s+/);

        for (const queryWord of queryWords) {
          if (doc.toLowerCase().includes(queryWord)) {
            score += 1;
          }
        }

        return { document: doc, score: score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxOutput);
  }

  /**
   * 选择证书类型的降级方案
   * @param {string} goal - 学习目标
   * @returns {string} - 选择的证书类型
   * @private
   */
  static _fallbackSelectCertificateType(goal) {
    if (goal.includes('计算机') || goal.includes('编程') || goal.includes('软件')) {
      return '计算机';
    } else if (
      goal.includes('英语') ||
      goal.includes('雅思') ||
      goal.includes('托福') ||
      goal.includes('CET') ||
      goal.includes('四六级')
    ) {
      return '英语';
    } else if (
      goal.includes('会计') ||
      goal.includes('财务') ||
      goal.includes('CPA') ||
      goal.includes('ACCA')
    ) {
      return '会计';
    } else if (goal.includes('教师') || goal.includes('教资') || goal.includes('教师资格证')) {
      return '教师';
    } else if (
      goal.includes('设计') ||
      goal.includes('PS') ||
      goal.includes('Photoshop') ||
      goal.includes('AI') ||
      goal.includes('UI') ||
      goal.includes('平面设计')
    ) {
      return '设计';
    } else {
      // 默认使用计算机模块
      return '计算机';
    }
  }

  /**
   * 用户兴趣分析增强版
   * @param {string} userInput - 用户输入内容
   * @param {Array<string>} availableTopics - 可用主题列表
   * @returns {Promise<Array<string>>} - 排序后的兴趣主题
   */
  static async analyzeUserInterests(userInput, availableTopics) {
    try {
      console.log('使用Qwen3-Embedding-8B模型分析用户兴趣...');
      return await this.rankLearningTopics(userInput, availableTopics);
    } catch (error) {
      console.error('用户兴趣分析失败:', {
        message: error.message,
        userInput: userInput,
        topicCount: availableTopics.length,
      });

      // 使用简单关键词匹配作为降级方案
      return availableTopics;
    }
  }
}

module.exports = Qwen3EmbeddingService;
