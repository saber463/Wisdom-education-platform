import express from 'express';
import axios from 'axios';
import 'dotenv/config';
import { auth } from '../middleware/auth.js';
import { generateLearningPath, testGenerateLearningPath } from '../controllers/aiController.js';
import { generateImage, getGenerationStatus } from '../controllers/imageGenerationController.js';
import { getAvailableRoadmaps } from '../services/xunfeiRoadmapService.js';
import User from '../models/User.js';

const router = express.Router();

// ============================================================
// Qwen3 Embedding 配置（含超时/重试 - AI改进计划落地）
// ============================================================
const QWEN3_CONFIG = {
  timeout: 30000, // 30秒超时
  retryAttempts: 2, // 最多重试2次
  retryDelay: 1000, // 重试间隔1秒
};

class Qwen3EmbeddingService {
  /**
   * 关键词匹配降级方案 - 当API不可用时使用
   */
  static _fallbackRankDocuments(query, documents, maxOutput = 10) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const scored = documents.map(doc => {
      const docLower = doc.toLowerCase();
      const score = queryWords.reduce((acc, word) => acc + (docLower.includes(word) ? 1 : 0), 0);
      return { doc, score };
    });
    scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
    return scored.slice(0, maxOutput).map(item => item.doc);
  }

  /**
   * 带重试机制的API调用
   */
  static async _callWithRetry(fn, attempts = QWEN3_CONFIG.retryAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempts > 0 && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
        console.warn(`⚠️  Qwen3 API超时，${QWEN3_CONFIG.retryDelay}ms后重试(剩余${attempts}次)...`);
        await new Promise(r => setTimeout(r, QWEN3_CONFIG.retryDelay));
        return Qwen3EmbeddingService._callWithRetry(fn, attempts - 1);
      }
      throw error;
    }
  }

  static async rankLearningTopics(query, topics) {
    try {
      const apiKey = process.env.AI_API_KEY || process.env.TRAE_API_KEY;

      if (!apiKey) {
        console.warn('⚠️  未配置AI_API_KEY或TRAE_API_KEY，使用关键词匹配降级');
        return Qwen3EmbeddingService._fallbackRankDocuments(query, topics);
      }

      const apiUrl =
        process.env.AI_API_BASE_URL ||
        'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

      const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      const response = await Qwen3EmbeddingService._callWithRetry(() =>
        axios.post(
          apiUrl,
          {
            model: 'text-embedding-v2',
            input: { texts: [query, ...topics] },
            parameters: { text_type: 'document' },
          },
          { headers, timeout: QWEN3_CONFIG.timeout }
        )
      );

      if (response.data?.output?.embeddings) {
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
        console.warn('⚠️  AI API响应格式不符合预期，使用关键词降级');
        return Qwen3EmbeddingService._fallbackRankDocuments(query, topics);
      }
    } catch (error) {
      console.error('Qwen3-Embedding-8B模型错误:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        query,
        topicCount: topics.length,
      });
      return Qwen3EmbeddingService._fallbackRankDocuments(query, topics);
    }
  }

  static calculateCosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0,
      norm1 = 0,
      norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  static getMockRanking(topics) {
    return Qwen3EmbeddingService._fallbackRankDocuments('', topics);
  }
}

// ============================================================
// 统一AI错误处理中间件（AI改进计划落地）
// ============================================================
const handleAIError = (error, req, res, _next) => {
  console.error('AI请求错误:', {
    route: req.path,
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    userId: req.user?._id,
  });

  let statusCode = error.response?.status || 500;
  let errorMessage = 'AI服务请求失败，请稍后重试';

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    errorMessage = '请求超时，请稍后重试';
    statusCode = 504;
  } else if (statusCode === 401) {
    errorMessage = 'API密钥无效';
  } else if (statusCode === 403) {
    errorMessage = 'API访问受限';
  } else if (statusCode === 429) {
    errorMessage = '请求过于频繁，请稍后重试';
  }

  res.status(statusCode).json({ success: false, error: errorMessage });
};

// ============================================================
// 验证中间件
// ============================================================
/**
 * 验证学习路径生成请求参数
 */
const validateLearningPathParams = (req, res, next) => {
  const { goal, days } = req.query;
  const { goal: bodyGoal, daysNum } = req.body;

  const goalToUse = bodyGoal || goal;
  const daysToUse = daysNum || days;

  if (!goalToUse || !daysToUse) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  req.learningPathParams = {
    goal: goalToUse,
    daysNum: parseInt(daysToUse),
    userId: req.user?._id,
  };

  next();
};

// ============================================================
// 学习路径路由
// ============================================================
router.get('/learning-paths', auth, validateLearningPathParams, generateLearningPath);
router.post('/generate-plan', auth, validateLearningPathParams, generateLearningPath);
router.post('/test/generate-learning-path', validateLearningPathParams, testGenerateLearningPath);

// 获取可用的开发者路线图列表
router.get('/roadmaps', async (req, res) => {
  try {
    const roadmaps = getAvailableRoadmaps();
    res.status(200).json({
      success: true,
      data: roadmaps,
      message: '获取成功',
    });
  } catch (error) {
    handleAIError(error, req, res, null);
  }
});

// ============================================================
// 内容推荐路由（AI改进计划落地 - 2.2.1）
// ============================================================
router.post('/recommend', auth, async (req, res) => {
  try {
    const { query } = req.body;
    const topics = [
      'JavaScript',
      'Python',
      'React',
      'Node.js',
      'Vue3',
      '英语',
      '会计',
      '设计',
      'Java',
      'C++',
    ];

    if (!query) {
      return res.status(400).json({ success: false, message: '缺少查询参数' });
    }

    const results = await Qwen3EmbeddingService.rankLearningTopics(query, topics);

    res.status(200).json({
      success: true,
      recommended: results,
      message: '推荐内容获取成功',
    });
  } catch (error) {
    handleAIError(error, req, res, null);
  }
});

/**
 * POST /api/ai/recommend-content
 * 个性化内容推荐 - 基于用户兴趣和学习目标（AI改进计划落地 2.2.1）
 */
router.post('/recommend-content', auth, async (req, res) => {
  try {
    const { interests = [], topic } = req.body;

    const learningContent = {
      计算机: ['JavaScript高级编程', 'Python数据分析', 'React基础', 'Vue3实战', 'Node.js后端'],
      英语: ['商务英语写作', '英语口语表达', '英语听力提升', '四六级备考', '雅思冲刺'],
      会计: ['财务报表分析', '税务筹划', '成本核算', '管理会计', '审计基础'],
      教师: ['教学设计', '课堂管理', '教育心理学', '班级管理', '教育信息化'],
      设计: ['UI设计原则', '色彩搭配', '用户体验设计', 'Figma实战', 'Photoshop技巧'],
      数学: ['高等数学', '线性代数', '概率统计', '数据结构', '算法导论'],
      编程: ['算法与数据结构', '设计模式', '系统设计', '数据库优化', '微服务架构'],
    };

    let allContent = [];
    interests.forEach(interest => {
      if (learningContent[interest]) {
        allContent = [...allContent, ...learningContent[interest]];
      }
    });

    if (allContent.length === 0) {
      allContent = Object.values(learningContent).flat();
    }

    let recommendedContent;
    if (topic && allContent.length > 0) {
      const ranked = await Qwen3EmbeddingService.rankLearningTopics(topic, allContent);
      recommendedContent = ranked.slice(0, 10);
    } else {
      recommendedContent = allContent.slice(0, 10);
    }

    res.status(200).json({
      success: true,
      recommendedContent,
      message: '个性化内容推荐成功',
    });
  } catch (error) {
    handleAIError(error, req, res, null);
  }
});

/**
 * POST /api/ai/analyze-interests
 * 用户兴趣分析 - 基于输入文本分析并更新用户兴趣（AI改进计划落地 2.2.2）
 */
router.post('/analyze-interests', auth, async (req, res) => {
  try {
    const { userInput } = req.body;
    const userId = req.user._id;

    if (!userInput || userInput.trim().length < 3) {
      return res.status(400).json({ success: false, message: '请输入至少3个字符描述您的兴趣' });
    }

    const availableTopics = [
      '编程开发',
      '数据分析',
      'UI设计',
      '英语学习',
      '财务管理',
      '教育教学',
      '机器学习',
      '网络安全',
      '前端开发',
      '后端开发',
      '移动开发',
      '数据库',
    ];

    const rankedInterests = await Qwen3EmbeddingService.rankLearningTopics(
      userInput,
      availableTopics
    );
    const topInterests = rankedInterests.slice(0, 5);

    // 更新用户兴趣字段
    await User.findByIdAndUpdate(userId, {
      $set: { learningInterests: topInterests },
    });

    res.status(200).json({
      success: true,
      interests: topInterests,
      message: '兴趣分析完成，已更新您的学习偏好',
    });
  } catch (error) {
    handleAIError(error, req, res, null);
  }
});

// ============================================================
// 内部AI路由 - 真正调用大模型生成学习路径
// ============================================================

/**
 * POST /api/ai/internal/generate-path
 * 内部接口：调用讯飞MaaS API（OpenAI兼容格式）生成结构化学习路径
 * aiController 内部调用，不走 auth 中间件
 */
router.post('/internal/generate-path', async (req, res) => {
  const { goal, days, intensity = 'medium', userInterests = [] } = req.body;

  const intensityLabel =
    {
      low: '轻松（每天30-60分钟）',
      medium: '适中（每天60-90分钟）',
      high: '高强度（每天90-120分钟）',
    }[intensity] || '适中';

  const systemPrompt = `你是一名专业的学习规划师，请根据用户提供的学习目标、天数和强度，生成一份详细的每日学习计划。
要求：
1. 严格按照JSON格式输出，不要包含任何其他文字
2. 每天必须有独立的学习模块，共${days}个模块
3. 内容要具体、可执行，不要空泛
4. 只输出合法JSON，不加任何markdown代码块

输出格式（严格遵守）：
{"title":"学习目标名称","days":${days},"summary":"整体计划简介100字以内","certificateType":"领域分类计算机英语会计教师设计其他","modules":[{"day":1,"moduleName":"第1天主题","detailedContent":"具体学习内容","topics":["知识点1","知识点2"],"estimatedTime":"预计时间","resourceLink":""}]}`;

  const userPrompt = `学习目标：${goal}
学习天数：${days}天
学习强度：${intensityLabel}
用户兴趣：${userInterests.length > 0 ? userInterests.join('、') : '通用'}

请生成完整的${days}天学习计划，modules数组必须有${days}个元素，day字段从1到${days}。`;

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.CHATBOT_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1';

  if (!apiKey) {
    console.error('❌ 未配置AI_API_KEY，无法调用AI服务');
    return res.status(500).json({ success: false, message: '未配置AI_API_KEY' });
  }

  try {
    console.log(`🤖 调用AI API: ${apiUrl}/chat/completions, goal="${goal}", days=${days}`);

    const response = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: 'Qwen3-7B',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.95,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content || '';
    console.log('🤖 AI原始返回（前300字）：', rawContent.slice(0, 300));

    // 提取JSON（防止模型在JSON外包了多余文字或think标签）
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ AI返回内容无法提取JSON，原始内容：', rawContent.slice(0, 500));
      return res.status(500).json({ success: false, message: 'AI返回格式异常，无法解析JSON' });
    }

    let plan;
    try {
      plan = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('❌ JSON解析失败：', parseErr.message, '\n内容：', jsonMatch[0].slice(0, 300));
      return res.status(500).json({ success: false, message: 'AI返回JSON解析失败' });
    }

    // 基础结构校验
    if (!plan.modules || !Array.isArray(plan.modules) || plan.modules.length === 0) {
      console.error('❌ AI返回计划缺少modules字段：', JSON.stringify(plan).slice(0, 200));
      return res.status(500).json({ success: false, message: 'AI返回的计划缺少modules字段' });
    }

    console.log(`✅ AI学习路径生成成功：${plan.modules.length}个模块，目标="${plan.title}"`);
    return res.status(200).json({ success: true, plan });
  } catch (error) {
    const errInfo = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: JSON.stringify(error.response?.data)?.slice(0, 300),
    };
    console.error('❌ 内部AI路由调用失败：', errInfo);
    return res.status(500).json({
      success: false,
      message: `AI服务调用失败：${error.message}`,
      detail: errInfo,
    });
  }
});

// ============================================================
// 图片生成路由
// ============================================================
router.post('/generate-image', auth, generateImage);
router.get('/image-generation-status', auth, getGenerationStatus);

// 统一错误处理（放在最后）
router.use(handleAIError);

export default router;
