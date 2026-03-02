# AI LearnHub

一个基于AI的智能学习平台，提供个性化学习路径、AI聊天助手、学习资源分享等功能。

## 项目简介

AI LearnHub是一个全栈应用，使用现代技术栈构建，为用户提供个性化的学习体验。平台集成了AI技术，能够根据用户的学习兴趣和进度生成定制化的学习路径，提供智能问答服务，并支持学习资源的分享和交流。

## 项目背景

在当今快速发展的数字化时代，传统的学习方式已经无法满足人们的需求。随着人工智能技术的不断进步，AI在教育领域的应用越来越广泛。AI LearnHub旨在利用AI技术，为用户提供更加高效、个性化的学习体验，帮助用户更好地掌握知识和技能。

## 功能特性

### 核心功能
- **用户认证与管理**：注册、登录、个人信息管理
- **个性化学习路径**：根据用户兴趣和进度生成定制化学习计划
- **AI聊天助手**：提供智能问答和学习指导
- **学习资源管理**：收藏、分类、分享学习资源
- **学习进度跟踪**：记录和分析学习进度
- **通知系统**：实时推送学习提醒和系统通知
- **测试与评估**：提供学习测试和评估功能
- **学习小组**：支持创建和加入学习小组，促进协作学习

### AI功能
- **文本嵌入**：使用Qwen3-Embedding-8B模型生成文本向量
- **兴趣分析**：基于用户行为和内容分析学习兴趣
- **内容推荐**：根据用户兴趣和学习历史推荐相关内容
- **智能问答**：集成多种AI模型提供智能问答服务

## 技术栈

### 前端
- Vue 3 + Composition API
- Pinia（状态管理）
- Vue Router（路由）
- Element Plus（UI组件库）
- Axios（HTTP请求）
- Tailwind CSS（样式）
- Vue Lazyload（图片懒加载）
- Font Awesome（图标库）
- dayjs（日期处理库）

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT（身份验证）
- bcrypt/bcryptjs（密码加密）
- dotenv（环境变量管理）
- cors（跨域资源共享）
- express-validator（请求验证）
- helmet（安全头部设置）
- multer（文件上传）
- nodemailer（邮件发送）
- AI API集成（如百度AI、讯飞AI等）
- Qwen3模型（嵌入模型和聊天模型）

### 开发工具
- Vite（前端构建工具）
- ESLint（代码质量检查）
- Prettier（代码格式化）
- Jest（单元测试）
- Postman（API测试）

## 项目结构

```
learning-ai-platform/
├── .cursorrules
├── .env                       # 全局环境变量配置
├── .env.example               # 全局环境变量示例
├── .env.new                   # 新的环境变量配置模板
├── AI_SERVICE_IMPROVEMENT_PLAN.md     # AI服务改进计划
├── AI_SERVICE_IMPROVEMENT_PROPOSAL.md  # AI服务改进提案
├── FIX_SUMMARY.md             # 修复摘要
├── IMPROVEMENT_GUIDE.md       # 改进指南
├── MacOS自动安装依赖.sh       # MacOS自动安装脚本
├── PROJECT_INFO.md            # 项目信息
├── PROJECT_STRUCTURE.md       # 项目结构详细说明
├── QWEN3_INTEGRATION_GUIDE.md # Qwen3模型集成指南
├── README.md                  # 项目说明文档
├── SIMPLE_IMPROVEMENT_GUIDE.md # 简单改进指南
├── Windows自动安装依赖.bat     # Windows自动安装脚本
├── bugfix.md                  # Bug修复记录
├── check-db-users.js          # 检查数据库用户脚本
├── login.js                   # 登录测试脚本
├── timeout-npm.ps1            # PowerShell超时处理脚本
├── client/                    # 前端应用
│   ├── .env.example           # 前端环境变量示例
│   ├── TOKEN_GUIDE.md         # Token使用指南
│   ├── check-localstorage.cjs # 检查本地存储脚本(CJS)
│   ├── check-localstorage.js  # 检查本地存储脚本
│   ├── comprehensive_test.js  # 综合测试脚本
│   ├── dist/                  # 构建输出目录
│   │   ├── api-test.html      # API测试页面
│   │   ├── debug-token.html   # Token调试页面
│   │   ├── get-token.html     # 获取Token页面
│   │   ├── index.html         # 主页面
│   │   ├── notifications.html # 通知页面
│   │   └── static/            # 静态资源
│   ├── get-token.js           # 获取Token脚本
│   ├── index.html             # 入口HTML
│   ├── package-lock.json      # 前端依赖锁定
│   ├── package.json           # 前端依赖配置
│   ├── postcss.config.js      # PostCSS配置
│   ├── public/                # 公共资源
│   │   ├── api-test.html      # API测试页面
│   │   ├── debug-token.html   # Token调试页面
│   │   ├── get-token.html     # 获取Token页面
│   │   └── notifications.html # 通知页面
│   ├── src/                   # 源代码
│   │   ├── api/               # API请求
│   │   ├── app.vue            # 根组件
│   │   ├── assets/            # 资源文件
│   │   ├── components/        # Vue组件
│   │   ├── config/            # 配置文件
│   │   ├── config.js          # 主配置文件
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── main.js            # 入口文件
│   │   ├── router/            # 路由配置
│   │   ├── store/             # Pinia状态管理
│   │   ├── utils/             # 工具函数
│   │   └── views/             # 页面组件
│   │       ├── Coupons.vue    # 优惠券页面
│   │       ├── Courses.vue    # 课程页面
│   │       ├── ErrorTest.vue  # 错误测试页面
│   │       ├── Home.vue       # 首页
│   │       ├── KnowledgeBase.vue  # 知识库页面
│   │       ├── NotFound.vue   # 404页面
│   │       ├── TestLogin.vue  # 测试登录页面
│   │       ├── assessment/    # 评估测试页面
│   │       ├── auth/          # 认证页面
│   │       ├── group/         # 群组功能页面
│   │       ├── learning/      # 学习路径页面
│   │       ├── tweet/         # 知识分享页面
│   │       └── user/          # 用户中心页面
│   ├── tailwind.config.js     # Tailwind CSS配置
│   ├── test-*.js              # 各种测试脚本
│   ├── tsconfig.json          # TypeScript配置
│   ├── tsconfig.node.json     # Node TypeScript配置
│   └── vite.config.js         # Vite构建配置
├── server/                    # 后端应用
│   ├── .env                   # 后端环境变量配置
│   ├── API_DOC.md             # API文档
│   ├── app.js                 # Express应用配置
│   ├── config/                # 配置文件
│   │   ├── aiConfig.js        # AI配置
│   │   ├── db.js              # 数据库配置
│   │   └── sensitiveWords.json # 敏感词列表
│   ├── controllers/           # 控制器
│   │   ├── achievementController.js  # 成就控制器
│   │   ├── authController.js  # 认证控制器
│   │   ├── categoryController.js     # 分类控制器
│   │   ├── favoritesController.js    # 收藏控制器
│   │   ├── groupController.js        # 群组控制器
│   │   ├── historyController.js      # 历史记录控制器
│   │   ├── knowledgePointController.js # 知识点控制器
│   │   ├── learningProgressController.js # 学习进度控制器
│   │   ├── notificationController.js # 通知控制器
│   │   ├── pointsController.js       # 积分控制器
│   │   ├── testController.js         # 测试控制器
│   │   ├── tweetController.js        # 推文控制器
│   │   └── userController.js         # 用户控制器
│   ├── getCategoryIds.js      # 获取分类ID脚本
│   ├── middleware/            # 中间件
│   │   ├── auditLog.js        # 审计日志
│   │   ├── auth.js            # 认证中间件
│   │   ├── rateLimit.js       # 限流中间件
│   │   ├── sensitiveCheck.js  # 敏感词检查
│   │   ├── upload.js          # 文件上传
│   │   ├── validate.js        # 验证中间件
│   │   └── validation/        # 验证规则
│   ├── models/                # 数据模型
│   │   ├── Achievement.js     # 成就模型
│   │   ├── AuditLog.js        # 审计日志模型
│   │   ├── BrowseHistory.js   # 浏览历史模型
│   │   ├── Category.js        # 分类模型
│   │   ├── Comment.js         # 评论模型
│   │   ├── Group.js           # 群组模型
│   │   ├── GroupMember.js     # 群组成员模型
│   │   ├── GroupPost.js       # 群组帖子模型
│   │   ├── KnowledgePoint.js  # 知识点模型
│   │   ├── LearningPath.js    # 学习路径模型
│   │   ├── LearningProgress.js # 学习进度模型
│   │   ├── Notification.js    # 通知模型
│   │   ├── Question.js        # 问题模型
│   │   ├── Resource.js        # 资源模型
│   │   ├── Test.js            # 测试模型
│   │   ├── TestResult.js      # 测试结果模型
│   │   ├── Tweet.js           # 推文模型
│   │   ├── User.js            # 用户模型
│   │   ├── UserAchievement.js # 用户成就模型
│   │   ├── UserFavorite.js    # 用户收藏模型
│   │   ├── UserKnowledgePoint.js # 用户知识点模型
│   │   └── WrongQuestion.js   # 错题模型
│   ├── package-lock.json      # 后端依赖锁定
│   ├── package.json           # 后端依赖配置
│   ├── reset_passwords.js     # 重置密码脚本
│   ├── routes/                # 路由定义
│   │   ├── achievements.js    # 成就路由
│   │   ├── ai.js              # AI功能路由
│   │   ├── authRoutes.js      # 认证路由
│   │   ├── categories.js      # 分类路由
│   │   ├── favorites.js       # 收藏路由
│   │   ├── groupRoutes.js     # 群组路由
│   │   ├── historyRoutes.js   # 历史记录路由
│   │   ├── index.js           # 路由入口
│   │   ├── knowledgePoints.js # 知识点路由
│   │   ├── learningProgressRoutes.js # 学习进度路由
│   │   ├── notificationRoutes.js # 通知路由
│   │   ├── points.js          # 积分路由
│   │   ├── tests.js           # 测试路由
│   │   ├── tweetRoutes.js     # 推文路由
│   │   └── userRoutes.js      # 用户路由
│   ├── scripts/               # 脚本文件
│   │   ├── addAssessmentTests.js # 添加评估测试
│   │   ├── addProfessionalAssessmentTests.js # 添加专业评估测试
│   │   ├── generate-system-tweets.js # 生成系统推文
│   │   ├── generateKnowledgeBase.js # 生成知识库
│   │   └── seedKnowledgeBase.js # 填充知识库
│   ├── seed/                  # 种子数据
│   │   ├── knowledge-base-data.json # 知识库数据
│   │   └── knowledge-base-seed.js # 知识库种子脚本
│   ├── seeds/                 # 种子数据目录
│   │   ├── achievements.js    # 成就种子数据
│   │   ├── categories.js      # 分类种子数据
│   │   └── knowledgePoints.js # 知识点种子数据
│   ├── server.js              # 服务器入口
│   ├── services/              # 业务逻辑服务
│   │   ├── chatbotService.js  # 聊天机器人服务
│   │   ├── chatbotServiceEnhanced.js # 增强版聊天机器人服务
│   │   ├── learningBehaviorAnalyzer.js # 学习行为分析器
│   │   ├── qwen3EmbeddingService.js # Qwen3嵌入模型服务
│   │   └── qwen3EmbeddingServiceEnhanced.js # 增强版Qwen3嵌入模型服务
│   ├── tests/                 # 测试文件
│   │   ├── ai.test.js         # AI功能测试
│   │   ├── getUserInfo.test.js # 获取用户信息测试
│   │   ├── getUserInfoUnit.test.js # 单元测试
│   │   ├── groupController.test.js # 群组控制器测试
│   │   ├── simple.test.js     # 简单测试
│   │   ├── testController.test.js # 测试控制器测试
│   │   └── userController.test.js # 用户控制器测试
│   ├── tsconfig.json          # TypeScript配置
│   ├── uploads/               # 上传文件目录
│   └── utils/                 # 工具函数
│       ├── couponGenerator.js # 优惠券生成器
│       ├── cryptoUtils.js     # 加密工具
│       ├── dfaFilter.js       # DFA敏感词过滤器
│       ├── emailUtils.js      # 邮件工具
│       ├── seedData.js        # 种子数据工具
│       ├── seedGroupData.js   # 群组种子数据
│       ├── seedTestsData.js   # 测试种子数据
│       └── test.js            # 测试工具
```

## 安装与使用

### 环境要求
- Node.js >= 16.x
- MongoDB >= 5.x
- Git

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/your-repo/learning-ai-platform.git
cd learning-ai-platform
```

#### 2. 安装依赖

##### 后端依赖
```bash
cd server
npm install
```

##### 前端依赖
```bash
cd ../client
npm install
```

#### 3. 配置环境变量

##### 全局环境变量
复制 `.env.example` 文件为 `.env`，并根据需要修改配置：
```bash
cp .env.example .env
```

##### 后端环境变量
在 `server` 目录下创建 `.env` 文件，参考 `.env.example` 配置：
```bash
cd server
cp .env.example .env
```

##### 前端环境变量
在 `client` 目录下创建 `.env` 文件，参考 `.env.example` 配置：
```bash
cd ../client
cp .env.example .env
```

#### 4. 启动项目

##### 启动后端服务
```bash
cd server
npm run dev
```

##### 启动前端服务
```bash
cd ../client
npm run dev
```

#### 5. 访问应用
前端应用默认访问地址：`http://localhost:3000`
后端API默认访问地址：`http://localhost:5000/api`

## 项目结构

```
learning-ai-platform/
├── server/                 # 后端服务目录
│   ├── app.js              # Express 应用配置文件
│   ├── server.js           # 服务器入口文件
│   ├── routes/             # 路由目录
│   │   ├── index.js        # 路由入口文件
│   │   ├── authRoutes.js   # 认证路由
│   │   ├── userRoutes.js   # 用户管理路由
│   │   ├── ai.js           # AI 功能路由
│   │   └── ...             # 其他路由文件
│   ├── controllers/        # 控制器目录
│   │   ├── authController.js   # 认证控制器
│   │   ├── userController.js   # 用户控制器
│   │   └── ...             # 其他控制器文件
│   ├── services/           # 业务逻辑服务
│   │   ├── qwen3EmbeddingService.js  # Qwen3 嵌入服务
│   │   └── ...             # 其他服务文件
│   ├── models/             # 数据模型
│   │   ├── User.js         # 用户模型
│   │   └── ...             # 其他模型文件
│   ├── middleware/         # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   └── ...             # 其他中间件文件
│   ├── utils/              # 工具函数
│   │   ├── error.js        # 自定义错误类
│   │   └── ...             # 其他工具文件
│   ├── config/             # 配置文件
│   │   └── db.js           # 数据库配置
│   └── tests/              # 测试文件
├── client/                 # 前端代码目录
├── package.json            # 项目依赖配置
└── README.md               # 项目说明文档
```

## API文档

### 认证API

#### 用户注册
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "learningInterests": ["JavaScript", "React"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "jwt-token",
    "user": {
      "_id": "user-id",
      "username": "testuser",
      "email": "test@example.com",
      "learningInterests": ["JavaScript", "React"]
    }
  }
  ```

#### 用户登录
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "jwt-token",
    "user": {
      "_id": "user-id",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
  ```

### 用户API

#### 获取用户信息
- **URL**: `/api/users/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer jwt-token`
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "user-id",
      "username": "testuser",
      "email": "test@example.com",
      "learningInterests": ["JavaScript", "React"]
    }
  }
  ```

### AI API

#### 智能问答
- **URL**: `/api/ai/chat`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer jwt-token`
- **Body**:
  ```json
  {
    "question": "什么是JavaScript？",
    "context": "学习前端开发"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "answer": "JavaScript是一种广泛用于前端开发的编程语言..."
  }
  ```

## 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目仓库
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 打开 Pull Request

### 代码规范

- 前端使用ESLint和Prettier进行代码检查和格式化
- 后端使用ESLint进行代码检查
- 提交代码前请确保通过所有代码检查

### 开发流程

1. 创建功能分支
2. 实现功能
3. 编写测试用例
4. 提交代码
5. 合并到主分支

## 许可证

本项目采用MIT许可证，详情请见 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- Email: your-email@example.com
- GitHub: your-github-username

## 常见问题

### 1. 安装依赖失败

**解决方案：**
- 确保Node.js版本为16+
- 尝试使用`npm install --legacy-peer-deps`命令安装依赖
- 检查网络连接是否正常
- 清理npm缓存：`npm cache clean --force`

### 2. 数据库连接失败

**解决方案：**
- 确保MongoDB服务已启动
- 检查`.env`文件中的`MONGO_URI`配置是否正确
- 确保数据库端口未被占用

### 3. AI服务调用失败

**解决方案：**
- 检查AI API密钥配置是否正确
- 确保网络连接正常
- 查看服务器日志获取详细错误信息

### 4. 前端页面无法访问

**解决方案：**
- 确保前端服务已启动
- 检查前端配置的API地址是否正确
- 查看浏览器控制台获取详细错误信息

## 开发指南

### 测试指南

- 前端测试：使用Vitest进行单元测试和组件测试
- 后端测试：使用Jest进行单元测试和集成测试
- 运行测试：`npm test`

### 部署指南

#### 开发环境部署

1. 安装依赖：`npm run install:all`
2. 配置环境变量
3. 启动服务：`npm start`

#### 生产环境部署

1. 构建前端：`cd client && npm run build`
2. 启动后端：`cd ../server && npm start`
3. 配置Nginx或其他反向代理服务器
4. 设置环境变量为生产模式

## 技术文档

- **API文档：** `server/API_DOC.md`
- **Qwen3集成指南：** `QWEN3_INTEGRATION_GUIDE.md`
- **AI服务改进计划：** `AI_SERVICE_IMPROVEMENT_PLAN.md`
- **项目结构说明：** `PROJECT_STRUCTURE.md`
- **改进指南：** `IMPROVEMENT_GUIDE.md`

## 安全注意事项

- 不要将敏感信息（如API密钥、数据库密码）提交到代码仓库
- 定期更新依赖库以修复安全漏洞
- 使用HTTPS协议保护数据传输
- 实施适当的访问控制和权限管理

## 性能优化

- 前端使用Vue Lazyload实现图片懒加载
- 后端使用缓存机制减少数据库查询
- 优化API响应时间
- 实施负载均衡和水平扩展策略

## 未来规划

1. 集成更多AI模型，提升智能学习体验
2. 实现多语言支持
3. 开发移动端应用
4. 增强数据分析和可视化功能
5. 扩展学习资源库
6. 实现社交学习功能
7. 开发企业版解决方案

## 系统更新日志

| 更新时间 | 更新内容 |
|---------|---------|
| 2024-06-01 | 项目初始化，完成基础架构搭建 |
| 2024-06-05 | 实现用户注册登录功能 |
| 2024-06-10 | 集成AI聊天机器人服务 |
| 2024-06-15 | 添加个性化学习路径生成功能 |
| 2024-06-20 | 优化后端错误处理机制 |
| 2024-06-25 | 添加Qwen3-Embedding-8B模型支持 |
| 2024-06-30 | 完善内容推荐和兴趣分析功能 |
| 2024-07-05 | 添加新的脚本命令和前端依赖 |
| 2024-07-10 | 实现群组功能和成就系统 |
| 2024-07-15 | 完善通知系统和测试评估功能 |
| 2024-07-20 | 集成Qwen3-7B模型和增强版嵌入服务 |
| 2024-07-25 | 添加敏感词过滤和审计日志功能 |
| 2024-07-30 | 优化学习行为分析和内容推荐算法 |
| 2024-08-05 | 添加测试脚本和性能优化 |
| 2024-08-10 | 完善API文档和项目说明文档 |