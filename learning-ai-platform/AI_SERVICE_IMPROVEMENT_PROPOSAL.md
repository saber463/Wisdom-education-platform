# AI服务改进方案

## 一、项目现状分析

通过对项目代码的分析，我发现以下几个方面可以进行改进：

### 1. AI模型集成
- **当前状态**：已集成Qwen3-Embedding-8B模型，主要用于证书类型选择和学习主题排序
- **改进空间**：扩展模型应用场景，完善错误处理机制，增加超时设置和重试逻辑

### 2. 聊天机器人功能
- **当前状态**：实现了基本的消息发送和学习建议生成功能
- **改进空间**：增强错误处理，添加多轮对话和上下文记忆，实现更个性化的学习建议

### 3. 内容推荐和兴趣分析
- **当前状态**：使用简单的关键词匹配和学习行为分析
- **改进空间**：利用Qwen3-Embedding-8B模型实现更精确的内容推荐和兴趣分析

### 4. 错误处理和监控
- **当前状态**：基本的错误日志记录
- **改进空间**：更详细的错误日志，异常告警机制，性能监控

## 二、详细改进建议

### 1. AI模型集成增强

#### 1.1 完善错误处理机制

**文件：server/services/qwen3EmbeddingService.js**

改进建议：
- 增加超时设置（30秒）
- 实现重试逻辑（2次重试，1秒延迟）
- 记录更详细的错误信息（包含时间戳、请求内容、响应状态等）
- 实现更完善的降级方案

```javascript
// 改进后的generateEmbeddings方法
static async generateEmbeddings(text) {
  try {
    const requestData = {
      model: "Qwen3-Embedding-8B",
      input: text
    };

    const response = await axios.post(QWEN3_EMBEDDING_CONFIG.url, requestData, {
      headers: {
        'Authorization': `Bearer ${QWEN3_EMBEDDING_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时设置
    });

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Qwen3-Embedding-8B生成嵌入向量失败:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      text: text.substring(0, 100), // 只记录前100个字符
      timestamp: new Date().toISOString() // 添加时间戳
    });
    
    // 实现重试逻辑
    let retryAttempts = 2;
    while (retryAttempts > 0) {
      try {
        console.log(`Qwen3-Embedding-8B重试第${3 - retryAttempts}次`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延迟
        
        const response = await axios.post(QWEN3_EMBEDDING_CONFIG.url, requestData, {
          headers: {
            'Authorization': `Bearer ${QWEN3_EMBEDDING_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        return response.data.data[0].embedding;
      } catch (retryError) {
        console.error(`Qwen3-Embedding-8B重试失败 (剩余${retryAttempts - 1}次):`, retryError.message);
        retryAttempts--;
      }
    }

    // 降级方案：返回默认嵌入向量
    return this._getDefaultEmbedding();
  }
}
```

#### 1.2 扩展模型应用场景

**文件：server/services/qwen3EmbeddingService.js**

添加新方法，扩展模型应用场景：

```javascript
/**
 * 分析用户兴趣
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
      userInput: userInput.substring(0, 100)
    });

    // 降级方案：返回所有可用主题
    return availableTopics;
  }
}

/**
 * 获取推荐内容
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
      contentCount: contentPool.length
    });

    // 降级方案：随机返回内容
    return this._shuffleArray(contentPool).slice(0, limit);
  }
}
```

#### 1.3 在更多路由中使用模型

**文件：server/routes/ai.js**

添加新的路由，扩展模型应用：

```javascript
// 内容推荐路由
router.post('/recommend-content', auth, async (req, res) => {
  try {
    const { interests, topic } = req.body;
    
    // 输入验证
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: '请提供有效的兴趣列表' });
    }
    
    // 定义学习内容分类
    const learningContent = {
      "计算机": ["JavaScript高级编程", "Python数据分析", "React基础", "Node.js开发", "数据库设计", "算法与数据结构", "前端工程化"],
      "英语": ["商务英语写作", "英语口语表达", "英语听力提升", "英语阅读技巧", "英语语法进阶", "英语词汇扩展", "英语翻译实践"],
      "会计": ["财务报表分析", "税务筹划", "成本核算", "财务管理", "审计学基础", "管理会计", "会计信息系统"],
      "教师": ["教学设计", "课堂管理", "教育心理学", "教学评价", "课程开发", "教育技术应用", "学生辅导技巧"],
      "设计": ["UI设计原则", "色彩搭配", "用户体验设计", "平面设计", "交互设计", "设计思维", "设计工具精通"]
    };
    
    // 收集所有相关内容
    let allContent = [];
    interests.forEach(interest => {
      if (learningContent[interest]) {
        allContent = [...allContent, ...learningContent[interest]];
      }
    });
    
    // 使用Qwen3-Embedding-8B模型对内容进行排序
    let recommendedContent = [];
    if (topic) {
      const query = `${topic} ${interests.join(' ')}`;
      recommendedContent = await Qwen3EmbeddingService.rankLearningTopics(query, allContent);
    } else {
      const query = interests.join(' ');
      recommendedContent = await Qwen3EmbeddingService.rankLearningTopics(query, allContent);
    }
    
    // 返回前10个推荐内容
    res.status(200).json({
      recommendedContent: recommendedContent.slice(0, 10),
      totalItems: recommendedContent.length
    });
  } catch (error) {
    console.error('内容推荐错误:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      userId: req.user?._id,
      interests: req.body?.interests,
      topic: req.body?.topic
    });
    
    // 降级方案：返回默认推荐内容
    const defaultRecommendations = [
      "JavaScript高级编程",
      "Python数据分析",
      "UI设计原则",
      "商务英语写作",
      "财务报表分析"
    ];
    
    res.status(200).json({
      recommendedContent: defaultRecommendations,
      totalItems: defaultRecommendations.length,
      note: '使用了默认推荐内容，可能与您的兴趣不完全匹配'
    });
  }
});

// 兴趣分析路由
router.post('/analyze-interests', auth, async (req, res) => {
  try {
    const { userInput } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ error: '请提供用户输入内容' });
    }
    
    // 定义可用的学习主题
    const availableTopics = [
      "JavaScript", "Python", "React", "Node.js", "数据库", "算法", "前端工程化",
      "商务英语", "英语口语", "英语听力", "英语阅读", "英语语法", "英语词汇",
      "财务报表", "税务筹划", "成本核算", "财务管理", "审计学", "管理会计",
      "教学设计", "课堂管理", "教育心理学", "教学评价", "课程开发", "教育技术",
      "UI设计", "色彩搭配", "用户体验", "平面设计", "交互设计", "设计思维"
    ];
    
    // 使用Qwen3-Embedding-8B模型分析用户兴趣
    const analyzedInterests = await Qwen3EmbeddingService.analyzeUserInterests(userInput, availableTopics);
    
    res.status(200).json({ interests: analyzedInterests.slice(0, 10) });
  } catch (error) {
    console.error('兴趣分析错误:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      userId: req.user?._id,
      userInput: req.body?.userInput?.substring(0, 100)
    });
    
    // 降级方案：返回默认兴趣列表
    res.status(200).json({ 
      interests: ["JavaScript", "Python", "React", "商务英语", "财务报表"],
      note: '使用了默认兴趣列表，可能与您的实际兴趣不完全匹配'
    });
  }
});
```

### 2. 聊天机器人功能完善

#### 2.1 增强错误处理

**文件：server/services/chatbotService.js**

改进建议：
- 增加超时设置
- 实现重试逻辑
- 记录更详细的错误信息

```javascript
// 改进后的sendMessage方法
static async sendMessage(message, history = []) {
  try {
    // 增加超时设置
    const response = await axios.post(
      `${this.#config.url}/chat/completions`,
      {
        model: 'Qwen3-7B',
        messages: [
          { 
            role: 'system', 
            content: '你是一个专业的学习助手，帮助用户解决学习问题。请提供详细、准确的回答，并保持友好的语气。' 
          },
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
        n: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${this.#config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 35000 // 35秒超时设置
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('聊天机器人API错误:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      messageContent: message.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    // 实现重试逻辑
    try {
      console.log('尝试使用讯飞星火API作为降级方案');
      return await this._fallbackToXunFei(message, history);
    } catch (fallbackError) {
      console.error('讯飞星火API调用也失败了:', fallbackError.message);
      
      // 返回简单的错误响应
      return '抱歉，当前服务暂时不可用，请稍后重试。';
    }
  }
}
```

#### 2.2 添加多轮对话和上下文记忆

**文件：server/services/chatbotService.js**

改进建议：
- 添加上下文记忆存储
- 实现多轮对话支持
- 增加清除上下文功能

```javascript
// 在ChatbotService类中添加以下代码

// 上下文记忆存储（简单实现，生产环境可使用Redis等）
static #contextMemory = new Map();

// 改进sendMessage方法，添加上下文记忆支持
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
          content: '你是一个专业的学习助手，帮助用户解决学习问题。请提供详细、准确的回答，并保持友好的语气。'
        },
        ...fullHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.95,
      n: 1
    };

    // 发送请求
    const response = await axios.post(
      `${this.#config.url}/chat/completions`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${this.#config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 35000
      }
    );

    // 保存上下文到记忆中
    if (userId) {
      const assistantResponse = response.data.choices[0].message.content;
      const updatedHistory = [
        ...fullHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: assistantResponse }
      ];
      
      // 只保留最近的10轮对话，避免记忆过大
      const recentHistory = updatedHistory.slice(-20); // 每轮包括user和assistant的消息
      this.#contextMemory.set(userId, recentHistory);
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    // 错误处理逻辑...
  }
}

// 添加清除上下文功能
static clearContext(userId) {
  if (userId) {
    this.#contextMemory.delete(userId);
  }
}
```

#### 2.3 实现个性化学习建议生成

**文件：server/services/chatbotService.js**

添加新方法，实现个性化学习建议生成：

```javascript
/**
 * 生成个性化学习建议
 * @param {string} learningGoal - 学习目标
 * @param {Object[]} currentProgress - 当前学习进度
 * @param {Object} userProfile - 用户个人资料（包含兴趣、偏好等）
 * @returns {Promise<string>} - 个性化学习建议
 */
static async generatePersonalizedLearningAdvice(learningGoal, currentProgress = [], userProfile = {}) {
  try {
    // 构建个性化的学习建议请求
    const { learningInterests = [], preferredLearningStyle = 'visual', learningTimePerWeek = 10 } = userProfile;

    const progressSummary = currentProgress.length > 0
      ? `\n当前学习进度：${JSON.stringify(currentProgress)}`
      : '\n暂无学习进度';

    const interestsSummary = learningInterests.length > 0
      ? `\n我感兴趣的领域有：${learningInterests.join('、')}`
      : '';

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
      userId: userProfile._id
    });

    // 使用增强的本地降级方案
    return this._enhancedFallbackLearningAdvice(learningGoal, currentProgress, userProfile);
  }
}
```

### 3. 测试改进

#### 3.1 创建测试目录

创建以下目录结构：
```
server/
├── tests/
│   ├── unit/          # 单元测试
│   ├── integration/   # 集成测试
│   └── api/           # API测试
```

#### 3.2 添加AI功能测试用例

**文件：server/tests/unit/qwen3EmbeddingService.test.js**

```javascript
const Qwen3EmbeddingService = require('../../services/qwen3EmbeddingService');

// Mock axios
const axios = require('axios');
jest.mock('axios');

describe('Qwen3EmbeddingService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          data: [
            { embedding: [0.1, 0.2, 0.3] }
          ]
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const text = 'Test text';
      const result = await Qwen3EmbeddingService.generateEmbeddings(text);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      axios.post.mockRejectedValue(new Error('API error'));

      const text = 'Test text';
      const result = await Qwen3EmbeddingService.generateEmbeddings(text);

      expect(axios.post).toHaveBeenCalledTimes(3); // 1 + 2 retries
      expect(result).toHaveLength(1024); // Default embedding length
    });
  });

  describe('rankLearningTopics', () => {
    it('should rank topics successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          results: [
            { document: 'JavaScript高级编程', score: 0.9 },
            { document: 'Python数据分析', score: 0.8 },
            { document: 'React基础', score: 0.7 }
          ]
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const query = '编程';
      const topics = ['React基础', 'Python数据分析', 'JavaScript高级编程'];
      const result = await Qwen3EmbeddingService.rankLearningTopics(query, topics);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(['JavaScript高级编程', 'Python数据分析', 'React基础']);
    });
  });
});
```

#### 3.3 添加集成测试用例

**文件：server/tests/integration/aiRoutes.test.js**

```javascript
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

// Mock Qwen3EmbeddingService
const Qwen3EmbeddingService = require('../../services/qwen3EmbeddingService');
jest.mock('../../services/qwen3EmbeddingService');

describe('AI Routes', () => {
  let token;
  let user;

  beforeAll(async () => {
    // Create a test user
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!'
    });

    // Get JWT token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    token = response.body.token;
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
  });

  describe('POST /api/ai/recommend-content', () => {
    it('should return recommended content', async () => {
      // Mock Qwen3EmbeddingService.rankLearningTopics
      Qwen3EmbeddingService.rankLearningTopics.mockResolvedValue([
        'JavaScript高级编程',
        'Python数据分析',
        'React基础'
      ]);

      const response = await request(app)
        .post('/api/ai/recommend-content')
        .set('Authorization', `Bearer ${token}`)
        .send({
          interests: ['计算机'],
          topic: '编程'
        });

      expect(response.status).toBe(200);
      expect(response.body.recommended).toEqual([
        'JavaScript高级编程',
        'Python数据分析',
        'React基础'
      ]);
    });

    it('should return 400 if interests are missing', async () => {
      const response = await request(app)
        .post('/api/ai/recommend-content')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请提供有效的兴趣列表');
    });
  });
});
```

### 4. 性能优化

#### 4.1 安装并配置Redis缓存

**步骤1：安装Redis依赖**
```bash
npm install redis
npm install -D redis-mock
```

**步骤2：创建Redis缓存服务**

**文件：server/services/redisCacheService.js**

```javascript
const redis = require('redis');

class RedisCacheService {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (error) => {
      console.error('Redis连接错误:', error);
    });

    this.client.connect();
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = 3600) {
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
      console.error('Redis设置缓存错误:', error);
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis获取缓存错误:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<void>}
   */
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis删除缓存错误:', error);
    }
  }
}

module.exports = new RedisCacheService();
```

**步骤3：在Qwen3EmbeddingService中使用Redis缓存**

```javascript
const redisCacheService = require('./redisCacheService');

// 改进后的generateEmbeddings方法
static async generateEmbeddings(text) {
  try {
    // 检查缓存
    const cacheKey = `embedding:${text}`;
    const cachedEmbedding = await redisCacheService.get(cacheKey);
    if (cachedEmbedding) {
      return cachedEmbedding;
    }

    // 如果缓存不存在，调用API
    const requestData = {
      model: "Qwen3-Embedding-8B",
      input: text
    };

    const response = await axios.post(QWEN3_EMBEDDING_CONFIG.url, requestData, {
      headers: {
        'Authorization': `Bearer ${QWEN3_EMBEDDING_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: QWEN3_EMBEDDING_CONFIG.timeout
    });

    const embedding = response.data.data[0].embedding;
    
    // 保存到缓存
    await redisCacheService.set(cacheKey, embedding, 3600 * 24); // 缓存24小时
    
    return embedding;
  } catch (error) {
    // 错误处理...
  }
}
```

#### 4.2 为数据库模型添加索引

**文件：server/models/User.js**

```javascript
const UserSchema = new mongoose.Schema({
  // ... 现有字段 ...
  interests: [
    { type: String, trim: true, index: true } // 添加索引
  ],
  learningStyle: {
    type: String, enum: ['visual', 'auditory', 'reading', 'kinesthetic'], index: true // 添加索引
  },
  // ... 其他字段 ...
});

// 添加复合索引
UserSchema.index({ email: 1, username: 1 });
```

#### 4.3 优化查询语句，避免全表扫描

**文件：server/services/learningBehaviorAnalyzer.js**

```javascript
// 改进前
static async updateLearningStats(userId, stats) {
  try {
    await User.findByIdAndUpdate(userId, { $inc: stats });
  } catch (error) {
    console.error('更新学习统计数据错误:', error);
  }
}

// 改进后 - 添加错误处理和返回更新后的数据
static async updateLearningStats(userId, stats) {
  try {
    // 使用findByIdAndUpdate并返回更新后的数据
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: stats },
      { new: true, select: '_id learningStats' } // 只返回需要的字段
    );
    return updatedUser;
  } catch (error) {
    console.error('更新学习统计数据错误:', {
      message: error.message,
      userId: userId,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    throw error; // 抛出错误以便调用者处理
  }
}
```

### 5. 监控和告警

#### 5.1 安装并配置winston日志库

**步骤1：安装winston**
```bash
npm install winston winston-daily-rotate-file
```

**步骤2：创建日志配置文件**

**文件：server/config/logger.js**

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 创建日志目录
const logDir = path.join(__dirname, '..', 'logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(info => {
    return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`;
  })
);

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 错误日志文件
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m'
    }),
    // 所有日志文件
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '50m'
    })
  ]
});

module.exports = logger;
```

#### 5.2 实现异常告警机制

**文件：server/middleware/errorHandler.js**

```javascript
const logger = require('../config/logger');

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 记录错误信息
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    status: err.statusCode || 500,
    userId: req.user?._id,
    requestData: JSON.stringify(req.body)
  });

  // 实现异常告警逻辑
  if (err.statusCode >= 500) {
    // 这里可以集成告警服务，如邮件、短信、Slack等
    // sendAlert(err);
  }

  // 返回错误响应
  res.status(err.statusCode || 500).json({
    error: err.message || '服务器内部错误',
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
};

module.exports = errorHandler;
```

#### 5.3 添加性能监控

**文件：server/middleware/performanceMonitor.js**

```javascript
const logger = require('../config/logger');

// 性能监控中间件
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime();
  const url = req.originalUrl;
  const method = req.method;

  // 监听响应结束事件
  res.on('finish', () => {
    const endTime = process.hrtime(startTime);
    const responseTime = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2); // 转换为毫秒
    const statusCode = res.statusCode;

    // 记录性能数据
    logger.info({
      message: 'Request processed',
      url: url,
      method: method,
      status: statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    // 如果响应时间超过阈值，记录警告
    if (parseFloat(responseTime) > 1000) { // 1秒阈值
      logger.warn({
        message: 'Slow request detected',
        url: url,
        method: method,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

module.exports = performanceMonitor;
```

## 三、实施顺序建议

1. **优先完成**：AI模型集成增强和聊天机器人功能完善
2. **其次**：测试改进和依赖更新
3. **最后**：性能优化和监控告警

## 四、预期效果

通过实施以上改进，预期可以达到以下效果：

1. **AI模型应用扩展**：
   - 模型应用场景从2个扩展到4个以上
   - 错误率降低50%以上
   - 响应时间稳定性提高

2. **聊天机器人功能增强**：
   - 支持多轮对话和上下文记忆
   - 学习建议更加个性化
   - 错误处理更加完善

3. **内容推荐和兴趣分析**：
   - 推荐结果更加精确
   - 兴趣分析更加深入
   - 用户体验提升

4. **系统性能优化**：
   - 响应速度提升30%以上
   - 数据库查询效率提高
   - 缓存命中率提高

5. **监控和告警**：
   - 实时监控系统运行状态
   - 及时发现和处理异常
   - 系统稳定性提高

## 五、结论

以上改进方案涵盖了AI服务的多个方面，包括模型集成、聊天机器人功能、测试改进、性能优化和监控告警。通过实施这些改进，可以提高系统的稳定性、性能和用户体验，为用户提供更好的学习支持服务。