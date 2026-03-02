import express from 'express';
import axios from 'axios';
import 'dotenv/config';
import { auth } from '../middleware/auth.js';
import { generateLearningPath, testGenerateLearningPath } from '../controllers/aiController.js';
import { generateImage, getGenerationStatus } from '../controllers/imageGenerationController.js';

const router = express.Router();

class Qwen3EmbeddingService {
  static async rankLearningTopics(query, topics) {
    try {
      const apiKey = process.env.AI_API_KEY || process.env.TRAE_API_KEY;

      if (!apiKey) {
        console.warn('⚠️  未配置AI_API_KEY或TRAE_API_KEY，使用模拟排序');
        return Qwen3EmbeddingService.getMockRanking(topics);
      }

      const apiUrl =
        process.env.AI_API_BASE_URL ||
        'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

      const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.post(
        apiUrl,
        {
          model: 'text-embedding-v2',
          input: {
            texts: [query, ...topics],
          },
          parameters: {
            text_type: 'document',
          },
        },
        { headers, timeout: 10000 }
      );

      if (response.data && response.data.output && response.data.output.embeddings) {
        const embeddings = response.data.output.embeddings;
        const queryEmbedding = embeddings[0].embedding;

        const topicScores = topics.map((topic, index) => {
          const topicEmbedding = embeddings[index + 1].embedding;
          const similarity = Qwen3EmbeddingService.calculateCosineSimilarity(
            queryEmbedding,
            topicEmbedding
          );
          return { topic, similarity };
        });

        topicScores.sort((a, b) => b.similarity - a.similarity);

        return topicScores.map(item => item.topic);
      } else {
        console.warn('⚠️  AI API响应格式不符合预期，使用模拟排序');
        return Qwen3EmbeddingService.getMockRanking(topics);
      }
    } catch (error) {
      console.error('Qwen3-Embedding-8B模型错误:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      return Qwen3EmbeddingService.getMockRanking(topics);
    }
  }

  static calculateCosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  static getMockRanking(topics) {
    const mockResults = topics.map((topic, index) => ({
      topic,
      relevance: 1 - index * 0.1,
      confidence: 0.95 - index * 0.05,
    }));

    mockResults.sort(() => Math.random() - 0.5);

    return mockResults.map(item => item.topic);
  }
}

/**
 * 验证学习路径生成请求参数
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express中间件函数
 */
const validateLearningPathParams = (req, res, next) => {
  const { goal, days } = req.query;
  const { goal: bodyGoal, daysNum } = req.body;

  const goalToUse = bodyGoal || goal;
  const daysToUse = daysNum || days;

  // 验证输入
  if (!goalToUse || !daysToUse) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  // 将验证后的数据添加到请求对象中
  req.learningPathParams = {
    goal: goalToUse,
    daysNum: parseInt(daysToUse),
    userId: req.user?._id,
  };

  next();
};

// 删除重复的导入语句

/**
 * 学习路径生成路由 - GET版本
 * 为了兼容前端调用而添加
 */
router.get('/learning-paths', auth, validateLearningPathParams, generateLearningPath);

/**
 * 学习路径生成路由 - POST版本
 * 原始接口，保留以便兼容性
 */
router.post('/generate-plan', auth, validateLearningPathParams, generateLearningPath);

/**
 * 测试接口：无需认证，用于验证核心功能
 * 用于开发和调试阶段
 */
router.post('/test/generate-learning-path', validateLearningPathParams, testGenerateLearningPath);

/**
 * 简单的内容推荐路由 - 使用Qwen3-Embedding-8B模型
 * 根据用户查询推荐相关学习主题
 */
router.post('/recommend', auth, async (req, res) => {
  try {
    const { query } = req.body;
    const topics = ['JavaScript', 'Python', 'React', 'Node.js', '英语', '会计', '设计'];

    if (!query) {
      return res.status(400).json({ success: false, message: '缺少查询参数' });
    }

    // 使用Qwen3-Embedding-8B模型对主题进行排序
    const results = await Qwen3EmbeddingService.rankLearningTopics(query, topics);

    res.status(200).json({
      success: true,
      recommended: results,
      message: '推荐内容获取成功',
    });
  } catch (error) {
    console.error('推荐错误:', error.message);
    res.status(500).json({
      success: false,
      recommended: ['JavaScript', 'Python', 'React'],
      message: '推荐服务暂时不可用，使用默认推荐',
      error: error.message,
    });
  }
});

/**
 * 图片生成路由 - POST版本
 * 调用智谱AI的图片生成API
 */
router.post('/generate-image', auth, generateImage);

/**
 * 获取图片生成状态 - GET版本
 * 获取用户今日图片生成次数和剩余次数
 */
router.get('/image-generation-status', auth, getGenerationStatus);

export default router;
