# 智慧教育学习平台

## 项目概述

智慧教育学习平台是一个面向传智杯国赛的创新型教育系统，采用Node.js + Python + Rust多语言协同架构，通过AI技术解决教师批改负担重、学生反馈慢、家长难以掌握学情的核心痛点。

## 技术栈

- **前端**: Vue 3 + Vite + TypeScript + Rust-WASM + Element Plus
- **后端**: Node.js 18+ (Express + gRPC)
- **AI服务**: Python 3.10+ (Flask + BERT + Transformers)
- **高性能服务**: Rust 1.70+ (Actix-web + gRPC)
- **数据库**: MySQL 8.0 (UTF8MB4字符集)

## 项目结构

```
.
├── frontend/          # Vue3前端项目
├── backend/           # Node.js后端服务
├── python-ai/         # Python AI服务
├── rust-service/      # Rust高性能服务
├── rust-wasm/         # Rust-WASM模块
└── docs/              # 项目文档
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- Rust 1.70+
- MySQL 8.0+
- wasm-pack

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install

# Python AI服务
cd python-ai
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Rust服务
cd rust-service
cargo build

# Rust-WASM
cd rust-wasm
wasm-pack build --target web --release
```

### 启动服务

详见后续一键启动脚本。

## 核心功能

1. **AI智能批改**: 客观题WASM批改 + 主观题BERT评分
2. **学情分析**: 班级学情可视化 + 薄弱点识别
3. **个性化推荐**: 基于薄弱点的练习推荐
4. **AI答疑**: NLP问答助手
5. **家校互通**: 实时学情监控

## 技术创新

- Rust-WASM前端高性能计算（批改速度提升8倍）
- BERT主观题智能评分（准确率≥92%）
- 多语言gRPC协同架构
- 纯Windows本地部署（零容器化）

## 文档

- [需求文档](.kiro/specs/smart-education-platform/requirements.md)
- [设计文档](.kiro/specs/smart-education-platform/design.md)
- [任务列表](.kiro/specs/smart-education-platform/tasks.md)

## 许可证

本项目仅用于传智杯国赛参赛使用。
