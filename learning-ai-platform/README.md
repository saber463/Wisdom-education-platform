# 智学AI (AI LearnHub) - 智慧教育平台

[![Vue](https://img.shields.io/badge/Vue-3.x-4fc08d.svg)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-18.x-339933.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🌟 项目简介

**智学AI** 是一款基于人工智能技术的全栈智慧教育平台。它不仅仅是一个在线学习工具，更是一个懂你的智能导师。通过集成大语言模型（LLM）和先进的推荐算法，平台能够为学生、教师和家长提供全方位的智慧教育解决方案。

---

## 🚀 核心功能模块

### 1. 🎓 学生智慧学习中心
- **AI 学习路径规划**：根据用户的兴趣标签和当前水平，一键生成结构化的学习路线图。
- **代码生成器**：支持 Python、JavaScript、Java 等多种语言，提供交互式代码示例与可视化原理展示。
- **学习评估分析**：通过在线测试，利用 AI 深度分析知识点掌握情况，生成多维度的能力雷达图。
- **智能知识库**：沉淀海量优质教育资源，支持分类检索与 AI 辅助阅读。

### 2. 🧑‍🏫 教师教学管理后台
- **课程发布系统**：支持多媒体课件上传、章节管理及课程权限控制。
- **班级小组管理**：创建学习小组，实时监控学生学习进度与活跃度。
- **家校互动社区**：发布动态通知，与家长深度沟通学生在校表现。

### 3. 👪 家长监控与反馈
- **实时进度监控**：查看孩子的课程完成率、测试成绩及学习时长分布。
- **导师直连**：一键联系导师，获取专业的教育建议。
- **学习偏好洞察**：AI 自动汇总孩子的学习兴趣，帮助家长发掘孩子潜能。

### 4. 🔔 全局智慧交互
- **多维度通知系统**：实时推送作业提醒、课程更新及社区互动消息。
- **安全身份认证**：支持学生/老师/家长多角色一键切换，采用 JWT + CSRF 令牌双重安全防护。
- **响应式 UI 设计**：采用现代科技感的 Glassmorphism（玻璃拟态）风格，完美适配 PC 与移动端。

---

## 🛠️ 技术栈清单

### 前端 (Client)
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia (持久化存储)
- **路由**: Vue Router 4
- **UI 组件**: Element Plus + Tailwind CSS (原子化样式)
- **图标**: Font Awesome 6 + Element Icons
- **交互**: Axios (拦截器封装) + Day.js

### 后端 (Server)
- **环境**: Node.js + Express
- **数据库**: MongoDB (Mongoose ODM) + Redis (高速缓存)
- **安全**: JWT (无状态认证) + Helmet (安全头) + BCrypt (密码哈希)
- **文件**: Multer (磁盘存储方案)
- **AI 引擎**: Qwen3-Embedding / 大模型 API 接入

---

## 📁 项目结构导览

```text
learning-ai-platform/
├── client/                 # 前端源码
│   ├── src/
│   │   ├── api/            # 接口请求封装
│   │   ├── components/     # 公共组件 (Dropdown, Popup, Avatar等)
│   │   ├── store/          # Pinia 状态中心 (user, notification等)
│   │   ├── views/          # 页面视图 (auth, role, ai等)
│   │   └── utils/          # 工具类 (api, logger等)
│   └── vite.config.js      # 构建配置
├── server/                 # 后端源码
│   ├── config/             # 数据库与中间件配置
│   ├── controllers/        # 业务逻辑控制器
│   ├── middleware/         # 安全与校验中间件 (auth, csrf, upload等)
│   ├── models/             # Mongoose 数据模型
│   └── routes/             # 路由定义
└── docs/                   # 项目文档与修复报告
```

---

## 🛠️ 快速启动

### 1. 环境准备
- Node.js >= 18.0.0
- MongoDB 社区版
- Redis 服务

### 2. 安装与运行
```bash
# 进入项目目录
cd Wisdom-education-platform/learning-ai-platform

# 自动安装所有依赖 (Windows)
./Windows自动安装依赖.bat

# 启动开发服务器
# 终端 1: 后端
cd server && npm run dev
# 终端 2: 前端
cd client && npm run dev
```

### 3. 测试账号
- **学生**: `student1@test.com` / `Student123!`
- **导师**: `teacher1@test.com` / `Teacher123!`
- **家长**: `parent1@test.com` / `Parent123!`

---

## 🛡️ 安全修复记录
本项目近期已完成针对 CSRF、注册越权及账号切换状态污染的专项修复。详细细节请参阅 `docs/VULNERABILITY_FIX_REPORT.md`。

---
© 2026 智学AI 开发团队 · 保留所有权利
