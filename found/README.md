# 🎓 智慧教育AI平台

> **前后端分离架构** | Vue 3 + Express.js + MongoDB

## 📁 目录结构

```
found/
├── frontend/          # 前端 — Vue 3 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── views/     # 页面组件（首页/课程/角色台/算法可视化等）
│   │   ├── components/# 公共组件 + 业务组件
│   │   ├── store/     # Pinia 状态管理
│   │   ├── router/    # Vue Router 路由
│   │   ├── utils/     # API 请求封装（axios）
│   │   └── assets/    # 全局 CSS / 图片资源
│   ├── package.json
│   └── vite.config.js # 代理: /api → http://localhost:4001
│
├── backend/           # 后端 — Express.js + MongoDB
│   ├── routes/        # API 路由（auth/tweets/groups/tests/ai等）
│   ├── controllers/   # 业务控制器
│   ├── models/        # Mongoose 数据模型
│   ├── middleware/     # JWT认证 / 限流 / 审计 / CSRF
│   ├── config/        # 数据库连接 / 配置
│   ├── server.js      # 启动入口（端口 4001）
│   ├── app.js         # Express App 配置
│   ├── .env           # 环境变量（本地，不提交）
│   └── package.json
│
├── package.json       # 工作区根（一键启动两个服务）
└── .gitignore
```

## 🚀 快速启动

### 方式一：一键启动（推荐）

```bash
cd found

# 首次运行：安装所有依赖
npm run install:all

# 同时启动前端（:3000）和后端（:4001）
npm run dev
```

### 方式二：分别启动

```bash
# 启动后端（端口 4001）
cd found/backend
npm run dev

# 新开终端，启动前端（端口 3000）
cd found/frontend
npm run dev
```

## ⚙️ 环境变量配置

在 `backend/.env` 中配置（参考 `backend/.env.example`）：

```env
# 必填
MONGO_URI=mongodb://localhost:27017/edu-ai-platform
JWT_SECRET=your_jwt_secret_key
PORT=4001

# AI 服务（可选，不配置则降级为关键词匹配）
AI_API_KEY=your_dashscope_key
AI_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

## 🔌 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Dev Server | 3000 | Vite，代理 `/api` → 4001 |
| 后端 API | 4001 | Express REST API |
| Rust 服务（可选） | 8080 | AES加密/相似度计算 |
| Rust Fallback（可选） | 8081 | Node.js 等价实现 |

## 🌐 API 代理

前端开发时，Vite 自动将 `/api/*` 代理到后端：

```
浏览器请求: http://localhost:3000/api/auth/login
         ↓ Vite proxy
后端处理:   http://localhost:4001/api/auth/login
```

生产部署时，由 Nginx 或其他反向代理承担此职责。

## 📦 技术栈

| 层 | 技术 |
|----|------|
| **前端框架** | Vue 3 (Composition API + `<script setup>`) |
| **状态管理** | Pinia |
| **路由** | Vue Router 4 |
| **UI** | Element Plus + Tailwind CSS |
| **构建** | Vite 7 |
| **HTTP** | Axios（统一封装，含拦截器） |
| **后端框架** | Express.js 4（ESM） |
| **数据库** | MongoDB + Mongoose 8 |
| **认证** | JWT + bcryptjs |
| **AI 服务** | DashScope（Qwen3-Embedding + 流式对话） |

## 📝 主要功能

- 🤖 **AI 学习路径生成**（流式输出）
- 📊 **算法运行可视化**（8种算法 × 帧预计算动画）
- 👥 **三角色工作台**（教师 / 家长 / 学生）
- 📚 **知识库 + 评估测试 + 学习小组**
- 💬 **学习社区（推文系统）**
- 🏆 **成就系统 + 排行榜**
- 🔒 **JWT 认证 + CSRF 防护 + 限流**
