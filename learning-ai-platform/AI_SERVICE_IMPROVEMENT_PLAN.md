# AI服务改进计划

## 一、错误处理机制完善

### 1.1 Qwen3-Embedding-8B模型错误处理增强

**当前状态**：
- 已有基本的错误捕获机制
- 缺少超时设置
- 错误日志不够详细
- 降级方案较为简单

**改进建议**：

```javascript
// 在 qwen3EmbeddingService.js 中添加超时设置和详细错误日志
const QWEN3_EMBEDDING_CONFIG = {
  url: process.env.QWEN_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v1/rerank',
  apiKey: process.env.QWEN_API_KEY || 'sk-TA4ZwSE3an1Ggp1CAc737422E70d4e7aBf563e169bD85190',
  timeout: 30000, // 30秒超时设置
  retryAttempts: 2, // 重试次数
  retryDelay: 1000 // 重试延迟
};

// 完善错误处理示例
static async rankDocuments(query, documents, maxOutput = 5) {
  try {
    const requestData = {
      model: "Qwen3-Embedding-8B",
      query: query,
      documents: documents,
      max_output: maxOutput,
      return_documents: true
    };
    
    const response = await axios.post(QWEN3_EMBEDDING_CONFIG.url, requestData, {
      headers: {
        'Authorization': `Bearer ${QWEN3_EMBEDDING_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: QWEN3_EMBEDDING_CONFIG.timeout // 添加超时设置
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Qwen3-Embedding-8B模型调用失败:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config,
      query: query,
      documentCount: documents.length
    });
    
    // 重试机制
    if (error.code === 'ECONNABORTED' && retryAttempts > 0) {
      retryAttempts--;
      await new Promise(resolve => setTimeout(resolve, QWEN3_EMBEDDING_CONFIG.retryDelay));
      return this.rankDocuments(query, documents, maxOutput);
    }
    
    // 使用简单的关键词匹配作为降级方案
    return this._fallbackRankDocuments(query, documents, maxOutput);
  }
}
```

### 1.2 路由级错误处理统一

**改进建议**：
- 在所有AI相关路由中统一错误处理格式
- 添加标准化的错误响应
- 实现集中的错误日志记录

```javascript
// 在 ai.js 中添加统一的错误处理中间件
const handleAIError = (error, req, res, next) => {
  console.error('AI请求错误:', {
    route: req.path,
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    userId: req.user?._id
  });
  
  let statusCode = error.response?.status || 500;
  let errorMessage = 'AI服务请求失败';
  
  if (error.code === 'ECONNABORTED') {
    errorMessage = '请求超时，请稍后重试';
    statusCode = 504;
  } else if (statusCode === 401) {
    errorMessage = 'API密钥无效';
  } else if (statusCode === 403) {
    errorMessage = 'API访问受限';
  } else if (statusCode === 429) {
    errorMessage = '请求过于频繁，请稍后重试';
  }
  
  res.status(statusCode).json({ error: errorMessage });
};

// 将中间件应用到所有AI路由
router.use(handleAIError);
```

## 二、Qwen3-Embedding-8B模型扩展应用

### 2.1 在现有路由中扩展使用

**当前使用场景**：
- 学习路径生成中的证书类型匹配
- 学习主题相关性排序

**扩展建议**：

#### 2.1.1 /chat 路由增强

```javascript
// 在聊天机器人响应中使用Qwen3-Embedding-8B模型进行上下文关联
router.post('/chat', async (req, res) => {
  try {
    // ... 现有代码 ...
    
    // 使用Qwen3-Embedding-8B模型分析对话历史，提供更相关的回答
    if (req.body.history && req.body.history.length > 0) {
      const historyText = req.body.history.map(msg => msg.content).join(' ');
      const relevantContext = await Qwen3EmbeddingService.rankDocuments(
        req.body.messages[req.body.messages.length - 1].content,
        historyText.split('. '),
        3
      );
      
      // 将相关上下文添加到请求中
      req.body.messages.unshift({
        role: 'system',
        content: `相关对话历史：${relevantContext.map(item => item.document).join('. ')}`
      });
    }
    
    // ... 现有API调用代码 ...
    
  } catch (error) {
    // ... 错误处理 ...
  }
});
```

#### 2.1.2 /chatbot 路由增强

```javascript
// 在新聊天机器人路由中使用Qwen3-Embedding-8B模型
router.post('/chatbot', async (req, res) => {
  try {
    // ... 现有代码 ...
    
    // 使用Qwen3-Embedding-8B模型优化回答相关性
    const response = await axios.post(chatbotUrl, {
      // ... 现有请求参数 ...
      // 添加基于Qwen3的上下文优化
    });
    
    // ... 现有代码 ...
    
  } catch (error) {
    // ... 错误处理 ...
  }
});
```

### 2.2 新增模型应用路由

#### 2.2.1 内容推荐路由

```javascript
// 内容推荐路由 - 使用Qwen3-Embedding-8B模型进行个性化推荐
router.post('/recommend-content', auth, async (req, res) => {
  try {
    const { interests, topic } = req.body;
    const userId = req.user._id;
    
    // ... 输入验证 ...
    
    // 定义学习内容分类
    const learningContent = {
      "计算机": ["JavaScript高级编程", "Python数据分析", "React基础"],
      "英语": ["商务英语写作", "英语口语表达", "英语听力提升"],
      "会计": ["财务报表分析", "税务筹划", "成本核算"],
      "教师": ["教学设计", "课堂管理", "教育心理学"],
      "设计": ["UI设计原则", "色彩搭配", "用户体验设计"]
    };
    
    // 收集相关内容
    let allContent = [];
    interests.forEach(interest => {
      if (learningContent[interest]) {
        allContent = [...allContent, ...learningContent[interest]];
      }
    });
    
    // 使用Qwen3-Embedding-8B模型进行相关性排序
    if (topic) {
      const rankedContent = await Qwen3EmbeddingService.rankLearningTopics(topic, allContent);
      return res.status(200).json({ recommendedContent: rankedContent.slice(0, 10) });
    }
    
    return res.status(200).json({ recommendedContent: allContent.slice(0, 10) });
    
  } catch (error) {
    // ... 错误处理 ...
  }
});
```

#### 2.2.2 用户兴趣分析路由

```javascript
// 用户兴趣分析路由 - 使用Qwen3-Embedding-8B模型分析用户兴趣
router.post('/analyze-interests', auth, async (req, res) => {
  try {
    const { userInput } = req.body;
    const userId = req.user._id;
    
    // 定义可用的兴趣主题
    const availableTopics = [
      "编程开发", "数据分析", "UI设计", "英语学习", 
      "财务管理", "教育教学", "机器学习", "网络安全"
    ];
    
    // 使用Qwen3-Embedding-8B模型分析用户兴趣
    const rankedInterests = await Qwen3EmbeddingService.analyzeUserInterests(userInput, availableTopics);
    
    // 更新用户兴趣
    await User.findByIdAndUpdate(userId, {
      learningInterests: rankedInterests.slice(0, 5)
    });
    
    return res.status(200).json({ interests: rankedInterests.slice(0, 5) });
    
  } catch (error) {
    // ... 错误处理 ...
  }
});
```

## 三、模型应用场景扩展

### 3.1 内容推荐系统

**功能描述**：基于用户兴趣和学习目标，推荐相关的学习内容。

**实现方案**：

```javascript
// 在 qwen3EmbeddingService.js 中添加内容推荐方法
static async recommendContent(userInterests, learningGoal, contentPool) {
  try {
    // 构建推荐查询
    const query = `${learningGoal} ${userInterests.join(' ')}`;
    
    // 使用Qwen3-Embedding-8B模型对内容进行排序
    const rankedContent = await this.rankDocuments(query, contentPool, 10);
    
    return rankedContent.map(item => item.document);
  } catch (error) {
    console.error('内容推荐失败:', error);
    
    // 降级方案：返回随机内容
    return this._shuffleArray(contentPool).slice(0, 10);
  }
}

// 辅助方法：随机打乱数组
static _shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
```

### 3.2 学习兴趣分析增强

**功能描述**：基于用户的学习行为和输入，更准确地分析用户兴趣。

**实现方案**：

```javascript
// 在 learningBehaviorAnalyzer.js 中集成Qwen3-Embedding-8B模型
const Qwen3EmbeddingService = require('./qwen3EmbeddingService');

static async analyzeLearningInterests(userId) {
  try {
    // ... 现有浏览历史分析 ...
    
    // 使用Qwen3-Embedding-8B模型优化兴趣排序
    const allCategories = Object.keys(categoryCounts);
    const rankedCategories = await Qwen3EmbeddingService.rankDocuments(
      '用户学习兴趣分析', 
      allCategories.map(category => `${category}: ${categoryCounts[category]}次浏览`),
      10
    );
    
    const interests = rankedCategories.map(item => item.document.split(':')[0].trim());
    
    // ... 更新用户兴趣 ...
    
    return interests;
  } catch (error) {
    // ... 错误处理和降级方案 ...
  }
}
```

### 3.3 学习路径个性化优化

**功能描述**：基于用户的学习兴趣、偏好和历史记录，优化学习路径的个性化程度。

**实现方案**：

```javascript
// 在 ai.js 学习路径生成路由中增强个性化
router.post('/generate-learning-path', auth, async (req, res) => {
  try {
    // ... 现有代码 ...
    
    // 使用Qwen3-Embedding-8B模型优化学习路径
    if (user) {
      // 获取用户学习兴趣
      const userInterests = user.learningInterests || [];
      
      // 使用Qwen3-Embedding-8B模型调整学习模块顺序
      const optimizedModules = await Qwen3EmbeddingService.rankLearningTopics(
        `${goal} ${userInterests.join(' ')}`,
        selectedModules.map(module => module.name)
      );
      
      // 根据优化后的模块顺序重新组织学习路径
      const reorderedModules = optimizedModules.map(moduleName => 
        selectedModules.find(module => module.name === moduleName)
      ).filter(Boolean);
      
      if (reorderedModules.length > 0) {
        selectedModules = reorderedModules;
      }
    }
    
    // ... 生成学习路径 ...
    
  } catch (error) {
    // ... 错误处理 ...
  }
});
```

## 四、实施步骤

### 阶段一：错误处理机制完善（1-2天）
1. 更新 QWEN3_EMBEDDING_CONFIG，添加超时设置和重试机制
2. 完善 Qwen3EmbeddingService 中的错误处理和日志记录
3. 在所有AI路由中统一错误处理中间件
4. 测试错误处理机制的有效性

### 阶段二：现有路由模型应用扩展（2-3天）
1. 在 /chat 路由中集成Qwen3-Embedding-8B模型进行上下文关联
2. 在 /chatbot 路由中使用Qwen3-Embedding-8B模型优化回答相关性
3. 测试扩展后的路由功能

### 阶段三：新增模型应用路由（3-4天）
1. 实现 /recommend-content 路由，提供个性化内容推荐
2. 实现 /analyze-interests 路由，增强用户兴趣分析
3. 测试新路由的功能和性能

### 阶段四：应用场景扩展（3-5天）
1. 在 LearningBehaviorAnalyzer 中集成Qwen3-Embedding-8B模型
2. 增强学习路径生成的个性化程度
3. 测试扩展后的应用场景

## 五、测试建议

### 5.1 单元测试

```javascript
// Qwen3EmbeddingService 测试示例
const Qwen3EmbeddingService = require('../services/qwen3EmbeddingService');

describe('Qwen3EmbeddingService', () => {
  test('generateEmbeddings should return embeddings', async () => {
    const text = '测试文本';
    const embeddings = await Qwen3EmbeddingService.generateEmbeddings(text);
    expect(embeddings).toBeDefined();
    expect(Array.isArray(embeddings)).toBe(true);
  });
  
  test('rankDocuments should return ranked documents', async () => {
    const query = '编程学习';
    const documents = ['JavaScript学习', '英语学习', 'Python学习'];
    const results = await Qwen3EmbeddingService.rankDocuments(query, documents);
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(documents.length);
  });
  
  test('should use fallback when API fails', async () => {
    // 模拟API失败
    jest.spyOn(require('axios'), 'post').mockRejectedValue(new Error('API错误'));
    
    const query = '编程学习';
    const documents = ['JavaScript学习', '英语学习', 'Python学习'];
    const results = await Qwen3EmbeddingService.rankDocuments(query, documents);
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // 恢复原始函数
    jest.restoreAllMocks();
  });
});
```

### 5.2 集成测试

```javascript
// AI路由集成测试示例
const request = require('supertest');
const app = require('../app');

describe('AI Routes', () => {
  test('POST /api/ai/recommend-content should return recommended content', async () => {
    const response = await request(app)
      .post('/api/ai/recommend-content')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        interests: ['计算机', '英语'],
        topic: '编程学习'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.recommendedContent).toBeDefined();
    expect(Array.isArray(response.body.recommendedContent)).toBe(true);
  });
  
  test('POST /api/ai/analyze-interests should return user interests', async () => {
    const response = await request(app)
      .post('/api/ai/analyze-interests')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        userInput: '我想学习JavaScript编程和数据分析'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.interests).toBeDefined();
    expect(Array.isArray(response.body.interests)).toBe(true);
  });
});
```

## 六、性能优化建议

1. **缓存机制**：对频繁使用的嵌入结果进行缓存
   ```javascript
   // 使用Redis缓存嵌入结果
   static async getOrGenerateEmbeddings(text) {
     const cacheKey = `embedding:${hash(text)}`;
     const cached = await redis.get(cacheKey);
     
     if (cached) {
       return JSON.parse(cached);
     }
     
     const embeddings = await this.generateEmbeddings(text);
     await redis.set(cacheKey, JSON.stringify(embeddings), 'EX', 3600); // 缓存1小时
     
     return embeddings;
   }
   ```

2. **批量处理**：对多个文本同时生成嵌入，减少API调用次数

3. **异步处理**：将非关键路径的AI模型调用改为异步处理

4. **负载均衡**：如果有多个模型服务实例，实现负载均衡

## 七、监控与告警

1. **添加监控指标**：
   - 模型调用成功率
   - 平均响应时间
   - 错误类型分布
   - 降级方案触发频率

2. **实现告警机制**：
   - 当模型调用失败率超过阈值时发送告警
   - 当响应时间过长时发送告警
   - 当降级方案频繁触发时发送告警

## 八、总结

通过以上改进，我们可以：
1. 提高Qwen3-Embedding-8B模型的稳定性和可靠性
2. 在更多路由和场景中利用模型的强大功能
3. 提供更个性化、更相关的学习内容和建议
4. 增强系统的错误处理能力和用户体验

这些改进将使AI服务更加健壮，同时为用户提供更好的学习体验。
