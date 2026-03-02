# 学习平台AI服务简化改进指南

## 一、核心改进点

### 1. 完善Qwen3-Embedding-8B模型的错误处理

**文件：server/services/qwen3EmbeddingService.js**

**改进内容**：
- 添加30秒超时设置
- 实现2次重试逻辑（1秒延迟）
- 记录更详细的错误信息
- 改进降级方案

**具体修改**：

```javascript
// 在文件顶部添加
const axios = require('axios');

// 配置
const QWEN3_EMBEDDING_CONFIG = {
  url: process.env.QWEN3_EMBEDDING_URL,
  apiKey: process.env.QWEN3_EMBEDDING_API_KEY,
  timeout: 30000,
  retryAttempts: 2,
  retryDelay: 1000
};

// 修改generateEmbeddings方法
static async generateEmbeddings(text) {
  let attempt = 0;
  
  while (attempt <= QWEN3_EMBEDDING_CONFIG.retryAttempts) {
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
        timeout: QWEN3_EMBEDDING_CONFIG.timeout
      });

      return response.data.data[0].embedding;
    } catch (error) {
      attempt++;
      console.error(`Qwen3-Embedding-8B尝试第${attempt}次失败:`, {
        message: error.message,
        status: error.response?.status,
        text: text.substring(0, 100),
        timestamp: new Date().toISOString()
      });

      if (attempt > QWEN3_EMBEDDING_CONFIG.retryAttempts) {
        console.error('Qwen3-Embedding-8B所有重试都失败，使用默认嵌入向量');
        // 返回默认嵌入向量（长度1024）
        return Array(1024).fill(0.01);
      }

      // 等待重试延迟
      await new Promise(resolve => setTimeout(resolve, QWEN3_EMBEDDING_CONFIG.retryDelay));
    }
  }
}
```

### 2. 增强聊天机器人功能

**文件：server/services/chatbotService.js**

**改进内容**：
- 添加上下文记忆功能
- 实现简单的多轮对话支持
- 增强错误处理

**具体修改**：

```javascript
// 在ChatbotService类中添加上下文记忆存储
static #contextMemory = new Map();

// 修改sendMessage方法
static async sendMessage(message, history = [], userId = null) {
  try {
    // 如果有userId，获取用户的上下文记忆
    let fullHistory = [...history];
    if (userId) {
      const userMemory = this.#contextMemory.get(userId) || [];
      fullHistory = [...userMemory, ...fullHistory];
    }

    const response = await axios.post(
      `${this.#config.url}/chat/completions`,
      {
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
      },
      {
        headers: {
          'Authorization': `Bearer ${this.#config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 35000 // 35秒超时
      }
    );
    
    const assistantResponse = response.data.choices[0].message.content;
    
    // 保存上下文到记忆中
    if (userId) {
      const updatedHistory = [
        ...fullHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: assistantResponse }
      ];
      
      // 只保留最近10轮对话
      const recentHistory = updatedHistory.slice(-20); // 每轮包括user和assistant的消息
      this.#contextMemory.set(userId, recentHistory);
    }
    
    return assistantResponse;
  } catch (error) {
    console.error('聊天机器人API错误:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      messageContent: message.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    // 降级到讯飞星火API
    try {
      return await this._fallbackToXunFei(message, history);
    } catch (fallbackError) {
      console.error('讯飞星火API调用失败:', fallbackError.message);
      return '抱歉，当前服务暂时不可用，请稍后重试。';
    }
  }
}

// 添加清除上下文方法
static clearContext(userId) {
  if (userId) {
    this.#contextMemory.delete(userId);
  }
}
```

### 3. 扩展模型应用场景 - 添加内容推荐路由

**文件：server/routes/ai.js**

**改进内容**：
- 添加POST /recommend-content路由
- 使用Qwen3-Embedding-8B模型进行内容推荐
- 实现基本的输入验证和错误处理

**具体修改**：

```javascript
// 在文件顶部添加
const Qwen3EmbeddingService = require('../services/qwen3EmbeddingService');

// 添加内容推荐路由
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
      userId: req.user?._id,
      interests: req.body?.interests,
      topic: req.body?.topic
    });
    
    // 降级方案
    res.status(200).json({
      recommendedContent: ["JavaScript高级编程", "Python数据分析", "React基础", "商务英语写作", "财务报表分析"],
      note: '使用了默认推荐内容'
    });
  }
});
```

### 4. 添加兴趣分析功能

**文件：server/services/qwen3EmbeddingService.js**

**改进内容**：
- 添加analyzeUserInterests方法
- 实现基于用户输入的兴趣分析

**具体修改**：

```javascript
// 添加analyzeUserInterests方法
static async analyzeUserInterests(userInput, availableTopics) {
  try {
    const results = await this.rankDocuments(userInput, availableTopics, availableTopics.length);
    return results.map(item => item.document);
  } catch (error) {
    console.error('用户兴趣分析失败:', {
      message: error.message,
      userInput: userInput.substring(0, 100)
    });
    
    // 降级方案：返回所有可用主题
    return availableTopics;
  }
}
```

### 5. 在聊天机器人中实现个性化学习建议

**文件：server/services/chatbotService.js**

**改进内容**：
- 增强generateLearningAdvice方法
- 添加个性化参数支持

**具体修改**：

```javascript
static async generateLearningAdvice(learningGoal, currentProgress = [], userProfile = {}) {
  try {
    const { learningInterests = [], preferredLearningStyle = 'visual', learningTimePerWeek = 10 } = userProfile;

    const progressSummary = currentProgress.length > 0
      ? `\n当前学习进度：${JSON.stringify(currentProgress)}`
      : '\n暂无学习进度';

    const interestsSummary = learningInterests.length > 0
      ? `\n我感兴趣的领域有：${learningInterests.join('、')}`
      : '';

    const styleSummary = `\n我的学习风格是：${preferredLearningStyle}`;
    const timeSummary = `\n我每周可用于学习的时间约为：${learningTimePerWeek}小时`;

    const message = 
      `请根据我的情况，为我生成一份详细的个性化学习建议：\n` +
      `学习目标：${learningGoal}${progressSummary}${interestsSummary}${styleSummary}${timeSummary}\n` +
      `建议内容应包括：\n` +
      `1. 个性化学习路径\n` +
      `2. 适合我的学习方法\n` +
      `3. 合理的每周学习安排\n` +
      `4. 针对性的学习资源推荐`;

    return await this.sendMessage(message, [], userProfile._id || null);
  } catch (error) {
    console.error('生成学习建议错误:', {
      message: error.message,
      learningGoal: learningGoal.substring(0, 100)
    });
    
    // 使用本地降级方案
    return this._fallbackLearningAdvice(learningGoal);
  }
}
```

## 二、测试建议

### 1. 创建基本测试用例

**文件：server/tests/qwen3EmbeddingService.test.js**

```javascript
const Qwen3EmbeddingService = require('../services/qwen3EmbeddingService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Qwen3EmbeddingService', () => {
  describe('generateEmbeddings', () => {
    it('should generate embeddings successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: { data: [{ embedding: [0.1, 0.2, 0.3] }] }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await Qwen3EmbeddingService.generateEmbeddings('test text');
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should handle API errors', async () => {
      // Mock API error
      axios.post.mockRejectedValue(new Error('API error'));

      const result = await Qwen3EmbeddingService.generateEmbeddings('test text');
      expect(result).toHaveLength(1024); // Default embedding
    });
  });
});
```

### 2. 运行测试

```bash
npm test --prefix server
```

## 三、实施顺序

1. 完善Qwen3-Embedding-8B模型的错误处理
2. 增强聊天机器人功能（上下文记忆、多轮对话）
3. 添加内容推荐路由
4. 添加兴趣分析功能
5. 增强个性化学习建议生成
6. 运行测试验证功能

## 四、总结

本改进指南提供了一个简化的方案，专注于核心功能的改进：
- 完善了AI模型的错误处理机制
- 增强了聊天机器人的功能
- 扩展了模型应用场景

这些改进可以提高系统的稳定性、用户体验和功能完整性，为用户提供更好的学习支持服务。