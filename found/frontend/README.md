# Learning AI Platform - 前端应用

## 项目简介

Learning AI Platform 前端应用是一个基于 Vue 3 构建的智能学习平台，提供用户友好的界面，支持学习路径查看、AI 问答、群组社交、测试评估等核心功能。

## 技术栈

- **Vue 3**: 渐进式 JavaScript 框架
- **Vite**: 下一代前端构建工具
- **Pinia**: 状态管理库
- **Element Plus**: UI 组件库
- **Axios**: HTTP 客户端
- **Vue Router**: 路由管理
- **Font Awesome**: 图标库
- **VueUse**: 工具函数集合
- **TypeScript**: 类型系统（可选）

## 项目结构

```
client/
├── public/            # 静态资源
├── src/
│   ├── assets/        # 资源文件
│   ├── components/    # 组件
│   │   ├── common/    # 通用组件
│   │   └── specific/  # 特定功能组件
│   ├── composables/   # 组合式函数
│   ├── layouts/       # 布局组件
│   ├── pages/         # 页面组件
│   ├── router/        # 路由配置
│   ├── stores/        # 状态管理
│   ├── utils/         # 工具函数
│   ├── services/      # API 服务
│   ├── styles/        # 全局样式
│   ├── App.vue        # 根组件
│   └── main.js        # 入口文件
├── .env.example       # 环境变量示例
├── .env               # 环境变量
├── index.html         # HTML 模板
├── package.json       # 项目配置
├── vite.config.js     # Vite 配置
└── README.md          # 项目文档
```

## 功能模块

1. **用户界面**
   - 登录/注册页面
   - 个人中心
   - 学习仪表盘

2. **学习路径**
   - 路径展示
   - 进度跟踪
   - 学习内容展示

3. **AI 助手**
   - 聊天界面
   - 智能问答
   - 内容生成

4. **知识库**
   - 知识点浏览
   - 搜索功能
   - 分类筛选

5. **群组社交**
   - 群组列表
   - 群组成员管理
   - 群组聊天

6. **推文系统**
   - 推文列表
   - 发布推文
   - 互动功能

7. **测试评估**
   - 测试列表
   - 在线答题
   - 成绩查看

8. **通知中心**
   - 通知列表
   - 通知详情
   - 已读/未读管理

## 快速开始

### 环境要求

- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器

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

- `VITE_API_BASE_URL`: 后端 API 基础 URL
- `VITE_APP_TITLE`: 应用标题
- `VITE_APP_ENV`: 运行环境（development/production）

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 开发规范

### 组件命名

- 使用 PascalCase 命名组件
- 组件文件名与组件名保持一致
- 通用组件放在 `components/common/` 目录
- 特定功能组件放在 `components/specific/` 目录

### 状态管理

- 使用 Pinia 进行状态管理
- 每个模块创建独立的 store
- 遵循单一职责原则

### API 调用

- 所有 API 调用封装在 `services/` 目录下
- 使用 Axios 拦截器处理请求和响应
- 统一处理错误和认证

### 样式规范

- 使用 CSS 变量定义主题
- 遵循 BEM 命名规范
- 组件样式使用 scoped 属性

## 性能优化

- 路由懒加载
- 组件按需加载
- 图片优化
- 缓存策略
- 代码分割

## 测试

### 单元测试

```bash
npm run test:unit
```

### 端到端测试

```bash
npm run test:e2e
```

## 部署

### Docker 部署

```bash
docker build -t learning-ai-platform-client .
docker run -p 80:80 learning-ai-platform-client
```

### 传统部署

1. 构建生产版本
2. 将 `dist` 目录部署到 Web 服务器
3. 配置 Nginx 或 Apache 服务器

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
