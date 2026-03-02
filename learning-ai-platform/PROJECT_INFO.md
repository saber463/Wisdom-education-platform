# AI LearnHub - 项目结构与系统更新记录

## 项目结构与文件作用

### 核心文件说明

#### 前端核心文件
- **client/src/main.js**：前端应用入口文件，初始化Vue应用、配置插件和全局组件
- **client/src/App.vue**：根组件，包含应用的基本布局结构
- **client/src/router/index.js**：路由配置文件，定义前端页面路由映射关系
- **client/src/store/index.js**：状态管理入口，集中管理应用状态
- **client/vite.config.js**：Vite构建工具配置文件

#### 后端核心文件
- **server/server.js**：后端服务器入口文件，负责启动服务、连接数据库和处理优雅退出
- **server/app.js**：Express应用配置文件，设置中间件、路由和全局错误处理
- **server/routes/index.js**：路由入口文件，集中加载和挂载所有路由模块
- **server/models/User.js**：用户数据模型，定义用户信息结构、密码加密和JWT生成方法
- **server/services/qwen3EmbeddingService.js**：Qwen3嵌入模型服务，提供文本嵌入生成、文档排序和兴趣分析功能
- **server/services/chatbotService.js**：聊天机器人服务，提供智能问答和学习建议功能

### 目录结构

```
learning-ai-platform/
├── client/                    # 前端应用
│   ├── public/                # 静态资源（HTML、图标等）
│   ├── src/                   # 源代码
│   │   ├── assets/            # 资源文件（图片、字体等）
│   │   ├── components/        # Vue组件
│   │   ├── router/            # 路由配置
│   │   ├── store/             # Pinia状态管理
│   │   ├── utils/             # 工具函数
│   │   ├── views/             # 页面组件
│   │   ├── App.vue            # 根组件
│   │   └── main.js            # 入口文件
│   ├── .env.example           # 前端环境变量示例
│   ├── package.json           # 前端依赖配置
│   └── vite.config.js         # Vite构建配置
├── server/                    # 后端应用
│   ├── controllers/           # 控制器（处理请求逻辑）
│   ├── middleware/            # 中间件（如认证、日志等）
│   ├── models/                # 数据模型（MongoDB集合定义）
│   │   ├── User.js            # 用户模型
│   │   ├── LearningPath.js    # 学习路径模型
│   │   ├── Resource.js        # 学习资源模型
│   │   └── ...                # 其他数据模型
│   ├── routes/                # 路由定义
│   │   ├── index.js           # 路由入口
│   │   ├── authRoutes.js      # 认证路由
│   │   ├── userRoutes.js      # 用户管理路由
│   │   ├── ai.js              # AI功能路由
│   │   └── ...                # 其他路由
│   ├── services/              # 业务逻辑服务
│   │   ├── chatbotService.js  # 聊天机器人服务
│   │   ├── qwen3EmbeddingService.js # Qwen3嵌入模型服务
│   │   └── ...                # 其他服务
│   ├── utils/                 # 工具函数
│   ├── .env.example           # 后端环境变量示例
│   ├── .env                   # 后端环境变量配置
│   ├── app.js                 # Express应用配置
│   ├── package.json           # 后端依赖配置
│   └── server.js              # 服务器入口文件
├── .env.example               # 全局环境变量示例
├── .env                       # 全局环境变量配置
├── Windows自动安装依赖.bat     # Windows自动安装脚本
├── MacOS自动安装依赖.sh       # MacOS自动安装脚本
└── README.md                  # 项目说明文档
```

## 系统更新时间记录

| 更新时间 | 更新内容 |
|---------|---------|
| 2024-06-01 | 项目初始化，完成基础架构搭建 |
| 2024-06-05 | 实现用户注册登录功能 |
| 2024-06-10 | 集成AI聊天机器人服务 |
| 2024-06-15 | 添加个性化学习路径生成功能 |
| 2024-06-20 | 优化后端错误处理机制 |
| 2024-06-25 | 添加Qwen3-Embedding-8B模型支持 |
| 2024-06-30 | 完善内容推荐和兴趣分析功能 |

## 技术栈说明

### 前端
- Vue 3 + Composition API
- Pinia（状态管理）
- Vue Router（路由）
- Element Plus（UI组件库）
- Axios（HTTP请求）
- Tailwind CSS（样式）

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT（身份验证）
- AI API集成（如百度AI、讯飞AI等）
