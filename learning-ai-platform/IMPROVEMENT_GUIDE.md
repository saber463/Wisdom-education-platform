# 项目改进指南

本指南提供了详细的实现步骤，帮助您完成项目改进任务。

## 1. 更新Jest等较旧的依赖包

### 步骤：
1. 打开 `server/package.json` 文件
2. 更新 `devDependencies` 部分：

```json
"devDependencies": {
  "@express-rate-limit/tsconfig": "^1.0.2",
  "jest": "^29.7.0",
  "nodemon": "^3.1.4",
  "supertest": "^7.1.4"
}
```

3. 运行 `npm install` 更新依赖

## 2. 配置定期运行npm audit检查安全漏洞

### 步骤：
1. 打开 `server/package.json` 文件
2. 在 `scripts` 部分添加：

```json
"scripts": {
  "audit": "npm audit",
  "audit:fix": "npm audit fix"
}
```

3. 配置定时任务（根据您的操作系统）：
   - Windows：使用任务计划程序
   - Linux/macOS：使用cron

## 3. 添加更多的单元测试和集成测试

### 步骤：
1. 在 `server` 目录下创建 `tests` 文件夹
2. 创建单元测试文件，例如：
   - `tests/ai.test.js` - AI路由测试
   - `tests/auth.test.js` - 认证测试
   - `tests/learning-paths.test.js` - 学习路径测试

3. 示例测试代码（`tests/ai.test.js`）：

```javascript
const request = require('supertest');
const app = require('../app');

describe('AI Routes', () => {
  it('should generate learning paths', async () => {
    const res = await request(app)
      .get('/api/ai/learning-paths')
      .query({ 
        learningGoal: '学习前端开发',
        days: 30
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('learningPaths');
  });
});
```

## 4. 实现CI/CD流程，自动运行测试

### 步骤：
1. 在项目根目录创建 `.github/workflows` 文件夹
2. 创建 `ci.yml` 文件：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
    - run: cd server && npm install
    - run: cd server && npm test
```

## 5. 完成Qwen3-Embedding-8B模型的完整集成

### 步骤：
1. 打开 `.env` 文件，确保已配置：

```
QWEN_API_URL=https://maas-api.cn-huabei-1.xf-yun.com/v1
QWEN_API_KEY=your_api_key_here
```

2. 创建 `server/services/qwen3EmbeddingService.js` 文件：

```javascript
const axios = require('axios');
require('dotenv').config();

class Qwen3EmbeddingService {
  static async generateEmbeddings(texts) {
    try {
      const response = await axios.post(
        `${process.env.QWEN_API_URL}/embeddings`,
        { 
          model: 'Qwen3-Embedding-8B',
          input: texts 
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.embeddings;
    } catch (error) {
      console.error('Qwen3 Embedding API Error:', error.message);
      throw error;
    }
  }

  static async rankDocuments(query, documents) {
    try {
      // 生成查询和文档的嵌入
      const texts = [query, ...documents.map(doc => doc.content)];
      const embeddings = await this.generateEmbeddings(texts);
      
      // 计算相似度并排序
      const queryEmbedding = embeddings[0];
      const docEmbeddings = embeddings.slice(1);
      
      const rankedDocs = documents.map((doc, index) => ({
        ...doc,
        score: this.cosineSimilarity(queryEmbedding, docEmbeddings[index])
      })).sort((a, b) => b.score - a.score);
      
      return rankedDocs;
    } catch (error) {
      console.error('Qwen3 Rank Documents Error:', error.message);
      // 降级方案：返回原始文档
      return documents;
    }
  }

  static cosineSimilarity(vecA, vecB) {
    // 计算余弦相似度
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    return dotProduct / (normA * normB);
  }
}

module.exports = Qwen3EmbeddingService;
```

## 6. 为AI模型调用添加错误处理和降级机制

### 步骤：
1. 打开 `server/routes/ai.js` 文件
2. 添加错误处理和降级逻辑：

```javascript
const express = require('express');
const Qwen3EmbeddingService = require('../services/qwen3EmbeddingService');

const router = express.Router();

router.get('/learning-paths', async (req, res) => {
  try {
    const { learningGoal, days } = req.query;
    
    // 使用Qwen3模型生成学习路径
    const learningPaths = await generateLearningPaths(learningGoal, days);
    
    res.json({ success: true, learningPaths });
  } catch (error) {
    console.error('AI Learning Path Error:', error.message);
    
    // 降级方案：使用传统算法生成学习路径
    try {
      const fallbackPaths = await generateFallbackLearningPaths(learningGoal, days);
      res.json({ success: true, learningPaths: fallbackPaths, message: '使用备用方案生成学习路径' });
    } catch (fallbackError) {
      res.status(500).json({ success: false, message: '生成学习路径失败' });
    }
  }
});

module.exports = router;
```

## 7. 实现API缓存机制

### 步骤：
1. 安装缓存中间件：

```bash
npm install express-redis-cache
```

2. 在 `server/app.js` 中配置缓存：

```javascript
const expressRedisCache = require('express-redis-cache');
const cache = expressRedisCache({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// 使用缓存中间件
app.use('/api/ai/learning-paths', cache.route());
```

## 8. 优化数据库查询性能

### 步骤：
1. 为MongoDB集合添加索引：

```javascript
// 在模型定义中添加索引
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true },
  username: { type: String, index: true }
});
```

2. 使用查询优化技巧：
   - 只查询需要的字段
   - 使用分页和限制
   - 避免N+1查询问题

## 9. 考虑使用Redis等缓存工具

### 步骤：
1. 安装Redis和Redis客户端：

```bash
npm install redis
```

2. 创建Redis服务文件 `server/services/redisService.js`：

```javascript
const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.connect();

class RedisService {
  static async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis Get Error:', error.message);
      return null;
    }
  }

  static async set(key, value, expiry = 3600) {
    try {
      await client.set(key, JSON.stringify(value), { EX: expiry });
      return true;
    } catch (error) {
      console.error('Redis Set Error:', error.message);
      return false;
    }
  }

  static async delete(key) {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis Delete Error:', error.message);
      return false;
    }
  }
}

module.exports = RedisService;
```

## 10. 增强日志记录功能

### 步骤：
1. 安装日志中间件：

```bash
npm install winston
```

2. 创建日志服务文件 `server/services/loggerService.js`：

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

3. 在 `server/app.js` 中使用日志中间件：

```javascript
const logger = require('./services/loggerService');

// 替换现有的日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const url = req.url;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${method} ${url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});
```

## 11. 考虑添加性能监控工具

### 推荐工具：
- **PM2**：进程管理和监控
- **New Relic**：应用性能监控
- **Datadog**：全面的监控和分析

### 步骤（以PM2为例）：
1. 安装PM2：

```bash
npm install -g pm2
```

2. 使用PM2启动应用：

```bash
pm2 start server.js
```

3. 查看监控：

```bash
pm2 monit
```

## 12. 实现异常告警机制

### 步骤：
1. 安装告警服务：

```bash
npm install nodemailer
```

2. 创建告警服务文件 `server/services/alertService.js`：

```javascript
const nodemailer = require('nodemailer');
const logger = require('./loggerService');
require('dotenv').config();

class AlertService {
  static transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_EMAIL_PASSWORD
    }
  });

  static async sendAlert(subject, message, errorDetails) {
    try {
      const mailOptions = {
        from: process.env.ALERT_EMAIL,
        to: process.env.ALERT_RECIPIENTS,
        subject: `[ALERT] ${subject}`,
        text: `${message}\n\n详细信息：\n${JSON.stringify(errorDetails, null, 2)}`
      };
      
      await this.transporter.sendMail(mailOptions);
      logger.info('告警邮件已发送');
    } catch (error) {
      logger.error('发送告警邮件失败:', error.message);
    }
  }

  static async handleError(error, context) {
    // 记录错误
    logger.error(`${context}: ${error.message}`, error);
    
    // 发送告警
    await this.sendAlert(
      `${context} 错误`,
      `${error.message}`,
      {
        error: error,
        context: context,
        timestamp: new Date().toISOString()
      }
    );
  }
}

module.exports = AlertService;
```

3. 在全局错误处理中使用：

```javascript
// 在 server/app.js 中
const AlertService = require('./services/alertService');

// 全局错误处理中间件
app.use((err, req, res, next) => {
  AlertService.handleError(err, '全局错误处理');
  res.status(500).json({ success: false, message: '服务器内部错误' });
});
```

## 13. 添加新的聊天机器人功能

### 步骤：
1. 在 `.env` 文件中添加新的聊天机器人API配置：

```
CHATBOT_API_URL=https://maas-api.cn-huabei-1.xf-yun.com/v1
CHATBOT_API_KEY=sk-TA4ZwSE3an1Ggp1CAc737422E70d4e7aBf563e169bD85190
```

2. 创建聊天机器人服务文件 `server/services/chatbotService.js`：

```javascript
const axios = require('axios');
require('dotenv').config();

class ChatbotService {
  static async sendMessage(message, context = {}) {
    try {
      const response = await axios.post(
        `${process.env.CHATBOT_API_URL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo', // 根据实际模型名称调整
          messages: [
            { role: 'system', content: '你是一个学习助手，帮助用户解决学习问题。' },
            ...(context.history || []),
            { role: 'user', content: message }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.CHATBOT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Chatbot API Error:', error.message);
      throw error;
    }
  }
}

module.exports = ChatbotService;
```

3. 在 `server/routes/ai.js` 中添加聊天机器人路由：

```javascript
const ChatbotService = require('../services/chatbotService');

// 聊天机器人路由
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await ChatbotService.sendMessage(message, { history });
    res.json({ success: true, response });
  } catch (error) {
    console.error('Chatbot Error:', error.message);
    res.status(500).json({ success: false, message: '聊天机器人服务不可用' });
  }
});
```

## 总结

按照上述步骤实现这些改进后，您的项目将具有：
- 更新的依赖包，提高了安全性和性能
- 完善的测试体系，确保代码质量
- 完整的CI/CD流程，实现自动化测试
- 优化的AI模型集成，包括错误处理和降级机制
- 性能优化，包括缓存和数据库查询优化
- 增强的监控和告警机制，提高系统可靠性
- 新的聊天机器人功能，提升用户体验

建议您按照优先级逐步实现这些改进，并在每个阶段进行测试，确保系统的稳定性和可用性。