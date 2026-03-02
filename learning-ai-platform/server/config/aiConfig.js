// AI服务配置文件
// 包含错误处理设置、超时配置和模型应用扩展

// Qwen3-Embedding-8B大模型配置
export const QWEN3_EMBEDDING_CONFIG = {
  url: process.env.QWEN_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1/rerank',
  apiKey: process.env.QWEN_API_KEY,
  timeout: 30000, // 30秒超时设置
  retryAttempts: 2, // 重试次数
  retryDelay: 1000, // 重试延迟（毫秒）
  fallbackStrategy: 'enabled', // 启用降级策略
};

// 聊天机器人配置
export const CHATBOT_CONFIG = {
  url: process.env.CHATBOT_API_URL || 'https://spark-api-open.xf-yun.com/v1/chat/completions',
  apiKey: process.env.CHATBOT_API_KEY || process.env.XUNFEI_API_KEY,
  timeout: 35000, // 35秒超时设置
  maxMessages: 20, // 最大上下文消息数
  fallbackModels: ['gpt-3.5-turbo'], // 降级模型列表
};

// 内容推荐配置
export const CONTENT_RECOMMENDATION_CONFIG = {
  useEmbeddingModel: true, // 使用嵌入模型进行推荐
  maxRecommendations: 10, // 最大推荐数量
  updateInterval: 24 * 60 * 60 * 1000, // 推荐更新间隔（毫秒）
  defaultTopics: [
    '学习方法与技巧',
    '时间管理与规划',
    '目标设定与执行',
    '思维导图应用',
    '记忆方法训练',
  ], // 默认推荐主题
};

// 兴趣分析配置
export const INTEREST_ANALYSIS_CONFIG = {
  useEmbeddingModel: true, // 使用嵌入模型进行兴趣分析
  maxInterests: 5, // 最大兴趣标签数量
  threshold: 0.6, // 兴趣相关性阈值
  fallbackStrategy: 'keyword', // 降级策略：keyword关键词匹配
};

// 错误处理配置
export const ERROR_HANDLING_CONFIG = {
  detailedLogging: true, // 启用详细错误日志
  logUserContext: true, // 记录用户上下文信息
  secureErrorMessages: true, // 返回安全的错误信息给客户端
  errorCodes: {
    400: '请求参数错误',
    401: 'API密钥无效',
    403: 'API访问受限',
    429: '请求过于频繁',
    500: '服务器内部错误',
    504: '请求超时',
  }, // 标准化错误消息
};

// 学习内容分类
export const LEARNING_CONTENT_CATEGORIES = {
  计算机: [
    'JavaScript高级编程技巧',
    'Python数据分析入门',
    '前端框架React基础',
    '后端开发Node.js实战',
    '数据库设计与优化',
    '云计算基础与应用',
    '网络安全防护技术',
  ],
  英语: [
    '商务英语写作技巧',
    '英语口语流利表达',
    '英语听力提升方法',
    '雅思考试备考策略',
    '英语阅读速度训练',
    '英语词汇记忆技巧',
    '英语语法系统复习',
  ],
  会计: [
    '财务报表分析',
    '税务筹划与优化',
    '成本核算与控制',
    '审计理论与实践',
    '财务管理基础',
    '会计电算化应用',
    '企业会计制度解读',
  ],
  教师: [
    '教学设计与实施',
    '课堂管理艺术',
    '教育心理学应用',
    '教学评价与反馈',
    '班主任工作技巧',
    '课程标准解读',
    '教育技术应用',
  ],
  设计: [
    'UI设计原则与方法',
    '色彩搭配与视觉效果',
    '排版设计基础',
    '用户体验设计',
    '响应式网页设计',
    '设计思维训练',
    '设计工具高级技巧',
  ],
};

// 导出默认配置
export default {
  QWEN3_EMBEDDING_CONFIG,
  CHATBOT_CONFIG,
  CONTENT_RECOMMENDATION_CONFIG,
  INTEREST_ANALYSIS_CONFIG,
  ERROR_HANDLING_CONFIG,
  LEARNING_CONTENT_CATEGORIES,
};
