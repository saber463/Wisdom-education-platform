# Learning AI Platform - 后端服务

## 项目简介

Learning AI Platform 后端服务是一个基于 Node.js 和 Express 构建的智能学习平台后端系统，提供用户管理、学习路径生成、AI 问答、群组社交等核心功能的 API 支持。

## 技术栈

- **Node.js**: 运行时环境
- **Express**: Web 应用框架
- **MongoDB**: 数据库
- **Redis**: 缓存系统
- **JWT**: 身份认证
- **Mongoose**: MongoDB ODM
- **CORS**: 跨域资源共享
- **Helmet**: 安全增强
- **Express Rate Limit**: 速率限制
- **Swagger**: API 文档

## 项目结构

```
server/
├── config/           # 配置文件
│   ├── db.js         # 数据库配置
│   ├── redis.js      # Redis 配置
│   ├── auth.js       # 认证配置
│   └── constants.js  # 常量定义
├── controllers/      # 控制器
│   ├── authController.js
│   ├── userController.js
│   ├── learningPathController.js
│   ├── knowledgeBaseController.js
│   ├── aiController.js
│   ├── groupController.js
│   ├── tweetController.js
│   ├── testController.js
│   └── notificationController.js
├── middleware/       # 中间件
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── rateLimitMiddleware.js
│   └── validationMiddleware.js
├── models/           # 数据模型
│   ├── User.js
│   ├── LearningPath.js
│   ├── KnowledgePoint.js
│   ├── Group.js
│   ├── Tweet.js
│   ├── Test.js
│   └── Notification.js
├── routes/           # 路由
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── learningPathRoutes.js
│   ├── knowledgeBaseRoutes.js
│   ├── aiRoutes.js
│   ├── groupRoutes.js
│   ├── tweetRoutes.js
│   ├── testRoutes.js
│   └── notificationRoutes.js
├── services/         # 业务逻辑
│   ├── authService.js
│   ├── userService.js
│   ├── aiService.js
│   └── emailService.js
├── utils/            # 工具函数
│   ├── errorHandler.js
│   ├── logger.js
│   └── validator.js
├── public/           # 静态资源
├── .env.example      # 环境变量示例
├── .env              # 环境变量
├── index.js          # 入口文件
├── package.json      # 项目配置
└── API_DOC.md        # API 文档
```

## 功能模块

1. **用户管理**
   - 用户注册、登录、信息更新
   - 学习进度追踪
   - 个人资料管理

2. **学习路径**
   - 基于用户目标生成个性化学习路径
   - 学习路径管理
   - 学习进度统计

3. **知识库**
   - 知识点管理
   - 分类和搜索
   - 难度分级

4. **AI 助手**
   - 智能问答
   - 内容生成
   - 学习建议

5. **群组社交**
   - 群组创建和管理
   - 成员管理
   - 群组活动

6. **推文系统**
   - 内容发布
   - 点赞和评论
   - 标签系统

7. **测试评估**
   - 测试创建和管理
   - 在线测试
   - 成绩统计

8. **通知系统**
   - 系统通知
   - 个性化提醒
   - 通知管理

## 快速开始

### 环境要求

- Node.js 16.x 或更高版本
- MongoDB 4.x 或更高版本
- Redis 6.x 或更高版本

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 文件为 `.env`，并根据实际情况修改配置：

```bash
cp .env.example .env
```

主要环境变量：

- `PORT`: 服务器端口
- `MONGO_URI`: MongoDB 连接 URI
- `REDIS_URL`: Redis 连接 URL
- `JWT_SECRET`: JWT 密钥
- `JWT_EXPIRES_IN`: JWT 过期时间
- `NODE_ENV`: 运行环境（development/production）

### 开发模式

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### 生产模式

```bash
npm run build
npm start
```

## API 文档

API 文档详细信息请查看 [API_DOC.md](API_DOC.md) 文件。

## 中间件

- **认证中间件**: 验证用户身份
- **错误处理中间件**: 统一错误处理
- **速率限制中间件**: 防止 API 滥用
- **验证中间件**: 请求参数验证

## 安全特性

- JWT 身份认证
- 密码加密存储
- CORS 配置
- Helmet 安全头
- 速率限制
- 输入验证

## 性能优化

- Redis 缓存
- 数据库索引
- 异步处理
- 响应压缩

## 测试

### 单元测试

```bash
npm run test
```

### 集成测试

```bash
npm run test:integration
```

### 代码覆盖率

```bash
npm run test:coverage
```

## 部署

### Docker 部署

```bash
docker-compose up -d
```

### 传统部署

1. 安装依赖
2. 配置环境变量
3. 启动服务

## 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License

## 联系方式

- 项目维护者: xxx
- 邮箱: xxx@example.com
- 项目地址: https://github.com/xxx/learning-ai-platform
