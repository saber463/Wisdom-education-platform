# 智学AI (AI LearnHub) - 智慧教育平台

[![Vue](https://img.shields.io/badge/Vue-3.x-4fc08d.svg)](https://vuejs.org/)
[![Node](https://img.shields.io/badge/Node-18.x-339933.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ICP](https://img.shields.io/badge/ICP备案-已完成-blue.svg)](https://beian.miit.gov.cn/)

## 🌟 项目简介

**智学AI** 是一款基于人工智能技术的全栈智慧教育平台。它不仅仅是一个在线学习工具，更是一个懂你的智能导师。通过集成大语言模型（LLM）和先进的推荐算法，平台能够为学生、教师和家长提供全方位的智慧教育解决方案。**本项目已完成云端部署及域名 ICP 备案，具备商业化上线能力。**

---

## 🚀 核心功能模块

### 1. 🤖 核心 AI 服务与算法 (New!)
- **“千人千面”个性化推荐系统**：
  - **兴趣驱动过滤**：基于用户自选的 `learningInterests` 标签，实现学习社区（推文）与知识库内容的精准分发。
  - **智能加权排序**：结合标题匹配（3.0）、关键词（2.5）及分类（2.0）多重权重，通过后端 `$in` 过滤与前端二次重排，确保最相关内容置顶。
- **AI 智能学习路径规划**：
  - **30天考试冲刺模板**：针对“计算机一级”等高频场景，内置科学的 6 阶段备考计划（理论、Office 三大组件、全真模拟）。
  - **动态路径生成**：对接大模型 API，根据学习目标、天数与强度，秒级生成结构化 Roadmap。
- **AI 代码助手与诊断**：支持多语言代码生成、实时语法诊断及可视化原理展示。

### 2. 🎓 学生智慧学习中心
- **个性化推文社区**：推文配图自动匹配对应技术的官方 Logo（如 Python, Vue, 机器学习等），提升视觉专业度。
- **学习评估分析**：利用 AI 深度分析测试数据，生成多维度能力雷达图，直观展示知识盲区。
- **智能知识库**：沉淀海量优质资源，支持基于兴趣标签的智能推荐。

### 3. 🧑‍🏫 教师教学管理后台
- **课程发布系统**：支持多媒体课件管理及权限控制。
- **班级小组监控**：实时追踪学生学习进度与活跃度，发掘潜在学习困难。

### 4. 👪 家长监控与反馈
- **学习洞察报告**：AI 自动汇总孩子的学习兴趣与时长分布，助力家长发掘孩子潜能。
- **导师直连**：一键联系导师，获取专业教育建议。

---

## 🛠️ 技术栈清单

### 前端 (Client)
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia (持久化存储)
- **UI 组件**: Element Plus + Tailwind CSS
- **图表**: ECharts (能力图谱可视化)

### 后端 (Server)
- **环境**: Node.js + Express (ESM 模块化)
- **数据库**: MongoDB (Mongoose) + Redis (高性能缓存)
- **AI 引擎**: 对接大语言模型 API + 自研推荐过滤算法
- **安全**: JWT + CSRF + BCrypt 加密

---

## 📁 项目结构导览

```text
learning-ai-platform/
├── client/                 # 前端源码 (Vue 3 + Vite)
├── server/                 # 后端源码 (Node.js + Express)
│   ├── scripts/            # 自动化脚本 (数据生成、测试账号重置)
│   ├── services/           # 核心服务 (AI 路径生成、推荐算法)
│   └── ...
└── docs/                   # 项目文档、演示演讲稿及备案说明
```

---

## 🌐 云端部署与合规性
- **托管平台**: GitHub + 云服务器 (Linux)
- **反向代理**: Nginx
- **进程管理**: PM2 进程守护
- **合规证明**: 已完成域名 **ICP 备案**，确保在国内网络环境下的合规稳定运行。

---

## 🛠️ 快速启动

### 1. 环境准备
- Node.js >= 18.0.0
- MongoDB 6.0+
- Redis 7.0+

### 2. 安装与运行
```bash
# 进入项目目录
cd Wisdom-education-platform/learning-ai-platform

# 自动安装所有依赖 (Windows)
./Windows自动安装依赖.bat

# 启动开发服务器
# 终端 1: 启动数据库 (需配置 dbpath)
mongod --dbpath ./data/db
# 终端 2: 后端
cd server && npm run dev
# 终端 3: 前端
cd client && npm run dev
```

---

## 📝 开发与修改文档
- [项目修改说明文档 (MODIFICATION_GUIDE.md)](file:///d:/edu-ai-platform-web/Wisdom-education-platform/learning-ai-platform/MODIFICATION_GUIDE.md) - 记录了推荐算法与 UI 优化的技术细节。
- [项目演示演讲稿 (PROJECT_PRESENTATION_SPEECH.md)](file:///d:/edu-ai-platform-web/Wisdom-education-platform/learning-ai-platform/docs/PROJECT_PRESENTATION_SPEECH.md) - 专为赛项设计的演示指南。

### 3. 测试账号
- **学生**: `student1@test.com` / `Student123!`
- **导师**: `teacher1@test.com` / `Teacher123!`
- **家长**: `parent1@test.com` / `Parent123!`

---

## 🛡️ 安全修复记录
本项目近期已完成针对 CSRF、注册越权及账号切换状态污染的专项修复。详细细节请参阅 `docs/VULNERABILITY_FIX_REPORT.md`。

---
© 2026 智学AI 开发团队 · 保留所有权利
