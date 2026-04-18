# EduAI 学习平台 — 项目总览 & 待修复清单

> **目标**：5分钟看懂项目 + 所有待办一览  
> **最后更新**：2026-04-13  
> **工作目录**：`D:\edu-ai-platform-web\Wisdom-education-platform\learning-ai-platform`

---

## 1. 项目一句话简介

一个面向学生的 AI 学习平台，核心功能：**AI生成个人学习路径 → 刷题评估 → 社区推文 → 知识库 → 代码生成器**。

---

## 2. 技术栈（5分钟速读）

| 层 | 技术 | 端口 | 入口 |
|---|---|---|---|
| 前端 | Vue 3 + Vite + Tailwind CSS | 3000 | `client/src/main.js` |
| 后端 | Node.js + Express (ESM) | 4001 | `server/server.js` |
| 数据库 | MongoDB (Mongoose) | 27017 | `server/config/db.js` |
| 缓存 | 内存LRU（Redis可选） | 6379 | `server/config/redis.js` |
| AI服务 | 讯飞MaaS API (Qwen3-7B) | — | `server/routes/ai.js` |

### 启动方式
```bash
# 终端1 — 后端
cd server && npm run dev     # nodemon server.js，端口4001

# 终端2 — 前端
cd client && npm run dev     # vite，端口3000
```

### 环境变量（`server/.env`）
```
PORT=4001
MONGO_URI=mongodb://localhost:27017/learning-ai-platform
JWT_SECRET=learning_ai_platform_jwt_secret_key_2025
CORS_ORIGIN=http://localhost:3000
AI_API_KEY=tnrQojUzXDQvOunDRqtf:fGVFIaShAbvzEeIRvFoT   ← 学习路径生成密钥
AI_API_BASE_URL=http://localhost:4001/api
CHATBOT_API_URL=https://maas-api.cn-huabei-1.xf-yun.com/v1
CHATBOT_API_KEY=sk-TA4ZwSE3an1Ggp1CAc737422E70d4e7aBf563e169bD85190
QWEN_API_KEY=892900fbef2c4cb3b7430066874ee293.lNA90gc9azVS81hi
```

---

## 3. 项目目录结构

```
learning-ai-platform/
├── client/                          # Vue3前端
│   └── src/
│       ├── main.js                  # 入口
│       ├── app.vue                  # 根组件（含兴趣弹窗InterestModal）
│       ├── router/index.js          # 路由
│       ├── store/                   # Pinia状态
│       │   ├── user.js              # 用户信息、learningInterests
│       │   └── notification.js      # 全局通知
│       ├── utils/
│       │   ├── api.js               # axios封装，baseURL=/api
│       │   └── request.js           # 二次封装
│       ├── views/
│       │   ├── Home.vue             # 首页
│       │   ├── KnowledgeBase.vue    # 知识库（⚠️ 内容太少）
│       │   ├── Membership.vue       # 会员页（⚠️ 性价比描述弱）
│       │   ├── assessment/
│       │   │   ├── TestList.vue     # 评估列表（✅ 有mock数据）
│       │   │   ├── TestDetail.vue   # 评估详情（⚠️ 部分题目为空）
│       │   │   ├── TestResult.vue   # 评估结果
│       │   │   └── QuestionBank.vue # 题库
│       │   ├── tweet/
│       │   │   ├── TweetList.vue    # 社区推文（⚠️ 无个性化推荐）
│       │   │   └── TweetPublish.vue # 发布推文
│       │   ├── learning/
│       │   │   └── LearningPathDetail.vue
│       │   └── auth/
│       │       └── Login.vue        # 登录页
│       └── components/
│           ├── common/
│           │   └── InterestModal.vue  # 兴趣选择弹窗（⚠️ 缺推荐算法）
│           ├── business/
│           │   └── LearningPathForm.vue
│           └── layout/
│               └── MainLayout.vue
│
└── server/                          # Express后端
    ├── server.js                    # 入口
    ├── app.js                       # Express配置、中间件
    ├── routes/
    │   ├── index.js                 # 路由聚合（⚠️ 缺courses路由）
    │   ├── ai.js                    # AI路由（✅ 已加/internal/generate-path）
    │   ├── authRoutes.js            # 登录注册
    │   ├── userRoutes.js            # 用户接口
    │   ├── tweetRoutes.js           # 推文
    │   ├── tests.js                 # 测试评估
    │   └── knowledgePoints.js       # 知识点
    ├── controllers/
    │   └── aiController.js          # AI学习路径生成（含降级方案）
    ├── models/                      # Mongoose模型（20+个）
    ├── services/
    │   └── chatbotService.js        # 聊天机器人（讯飞Qwen3-7B）
    └── config/
        ├── db.js                    # MongoDB连接
        ├── redis.js                 # Redis/内存缓存
        └── aiConfig.js              # AI服务配置常量
```

---

## 4. 关键数据流

### 学习路径生成流程
```
用户填写目标/天数/强度
  → client/hooks/useAiApi.js: generateLearningPathByAi()
  → GET /api/ai/learning-paths (aiController.generateLearningPath)
  → 后端自调: POST /api/ai/internal/generate-path   ← 真正调用AI
      → 讯飞MaaS: POST https://maas-api.cn-huabei-1.xf-yun.com/v1/chat/completions
      → 返回JSON格式学习计划
  → 失败降级: aiController.getFallbackPath() (本地hardcode)
```

### 用户兴趣推荐流程（待完善）
```
登录成功
  → InterestModal.vue 弹出（首次登录）
  → 用户选择兴趣标签（Python/Java/前端/算法等）
  → 保存到 user.learningInterests[]
  → TweetList.vue 按权重排序推文  ← ⚠️ 当前未实现
```

---

## 5. ✅ 已完成的工作

| 功能 | 状态 | 说明 |
|---|---|---|
| 整站深色UI主题重设计 | ✅ | #0d1117 + #6366f1 + #22d3ee 配色 |
| 前后端分离（found/目录） | ✅ | frontend/ + backend/ + 根package.json |
| AI学习路径 /internal/generate-path 路由 | ✅ | 已接入讯飞MaaS密钥 |
| 算法可视化动画（8种算法） | ✅ | StudentDashboard 完整CSS |
| 学习评估mock数据（6套题） | ✅ | Vue3/React/算法/Node.js/Python/AI |
| InterestModal基础弹窗 | ✅ | 首次登录弹出，保存到后端 |
| 推文社区mock数据（10条） | ✅ | 多分类内容 |

---

## 6. ⚠️ 待修复 & 待开发清单

### 优先级 P0（影响核心功能）

#### [BUG-01] 学习路径AI生成不稳定
- **现象**：始终走降级fallback，返回hardcode数据，不是真正AI生成
- **根因**：aiController内部调用 `POST /api/ai/internal/generate-path`，该路由刚添加但尚未验证联调
- **文件**：`server/routes/ai.js:300行+` / `server/controllers/aiController.js`
- **修复**：启动后端，curl测试该接口是否正确返回AI内容
- **测试命令**：
  ```bash
  curl -X POST http://localhost:4001/api/ai/internal/generate-path \
    -H "Content-Type: application/json" \
    -d '{"goal":"学习Python","days":7,"intensity":"medium"}'
  ```

#### [BUG-02] /api/courses 返回404
- **现象**：前端访问课程相关接口全部404
- **根因**：`server/routes/index.js` 没有注册courses路由
- **文件**：`server/routes/index.js`
- **修复**：检查是否有courses.js路由文件，若有则import并注册

### 优先级 P1（体验问题）

#### [TODO-01] 兴趣弹窗 → 推文推荐算法
- **需求**：用户选择Python、Java等兴趣后，TweetList按兴趣权重排序推文
- **算法逻辑**：
  - 第一兴趣标签匹配的推文权重 × 3
  - 其他兴趣标签匹配的推文权重 × 1.5
  - 多兴趣全选时，第一选择优先
  - 无匹配时按热度（likes）排序
- **文件**：`client/src/views/tweet/TweetList.vue`（`initializeTweets`函数后添加排序逻辑）
- **InterestModal**：已有，在`client/src/components/common/InterestModal.vue`
  - 需补充Python/Java/REST/算法等更细分标签（当前粒度粗）

#### [TODO-02] 代码生成器扩展（不只算法）
- **现状**：只有算法可视化，太单一
- **需求**：增加以下有趣页面/功能
  - Python: 正则表达式可视化测试器
  - JavaScript: 闭包/原型链交互演示
  - Java: 泛型/集合框架图示
  - SQL: 在线查询练习器（mock数据）
  - 前端: CSS动画代码生成器
  - 网络: HTTP请求/响应模拟器
- **入口文件**：需新建 `client/src/views/ai/CodeGenerator.vue` 或扩展现有

#### [TODO-03] 学习评估内容补全
- **现状**：TestDetail页面部分评估点进去无内容
- **需求**：每个评估模块自带默认题目，点进去有内容可答
- **文件**：`client/src/views/assessment/TestDetail.vue`
- **现有mock**：TestList.vue中已有6套mockTests含mockQuestions，需确保TestDetail能读取

#### [TODO-04] 知识库内容扩充+显示修复
- **现状**：知识点太少，分类列表只显示一点点
- **需求**：
  - 增加知识点数量（至少50条，覆盖Python/Java/前端/算法/数据库）
  - 修复分类侧边栏只显示一行的CSS问题
- **文件**：`client/src/views/KnowledgeBase.vue` / `server/routes/knowledgePoints.js`

#### [TODO-05] 会员页面改写
- **现状**：会员特权描述与学习路径关联不强，性价比感知弱
- **需求**：
  - 突出"黄金会员无限次生成学习路径"
  - 加入会员专属功能对比表格（免费/白银/黄金三档）
  - 替换与学习无关的图片
- **文件**：`client/src/views/Membership.vue`

### 优先级 P2（完善度）

#### [TODO-06] 推文图片优化
- **现状**：推文图片用picsum.photos随机图，与内容无关
- **需求**：根据推文category显示对应技术图标或代码截图
- **文件**：`client/src/views/tweet/TweetList.vue` 的mockTweets数组

#### [TODO-07] 首页知识库入口
- **需求**：知识库内容丰富后，在首页Home.vue增加"热门知识点"模块

---

## 7. API接口速查

| 接口 | 方法 | 说明 | 认证 |
|---|---|---|---|
| `/api/auth/login` | POST | 登录 | 否 |
| `/api/auth/register` | POST | 注册 | 否 |
| `/api/users/me` | GET | 当前用户信息 | JWT |
| `/api/ai/learning-paths` | GET | 生成学习路径 | JWT |
| `/api/ai/internal/generate-path` | POST | 内部AI调用（讯飞） | 否 |
| `/api/ai/recommend` | POST | 内容推荐 | JWT |
| `/api/tweets` | GET/POST | 推文列表/发布 | GET无需 |
| `/api/tests` | GET | 评估列表 | 否 |
| `/health` | GET | 健康检查 | 否 |

---

## 8. 新AI快速理解项目（5分钟清单）

**第一步（30秒）**：看这张图
```
用户 → Login → InterestModal → Home
                               ├── 学习路径生成（AI）
                               ├── 学习社区（推文+推荐）
                               ├── 学习评估（题库）
                               ├── 知识库（文章）
                               └── 代码生成器（交互式）
```

**第二步（1分钟）**：读 `client/src/utils/api.js` — 了解所有前端API调用封装

**第三步（1分钟）**：读 `server/routes/index.js` — 了解后端注册了哪些路由

**第四步（1分钟）**：读 `server/controllers/aiController.js` 的 `generateLearningPath` — 核心业务逻辑

**第五步（1分钟）**：读 `client/src/store/user.js` — `learningInterests` 字段驱动全站个性化

**第六步（1分钟）**：运行并测试
```bash
# 验证AI接口是否真正调用了讯飞
curl -X POST http://localhost:4001/api/ai/internal/generate-path \
  -H "Content-Type: application/json" \
  -d '{"goal":"学Python","days":3,"intensity":"low"}'
# 期望：返回 {"success":true,"plan":{"title":"...","modules":[...]}}
# 实际若返回错误：检查 AI_API_KEY 和 CHATBOT_API_URL 配置
```

---

## 9. 开发注意事项

1. **ESM模块**：后端全用 `import/export`，不能用 `require()`
2. **认证**：所有需要登录的接口通过 `server/middleware/auth.js` 的 `auth` 中间件，从JWT解出 `req.user`
3. **错误格式**：统一 `{ success: false, code: 404, message: "..." }`，见 `server/utils/errorResponse.js`
4. **缓存**：Redis可选，未安装自动降级内存LRU，不影响功能
5. **前端代理**：`client/vite.config.js` 把 `/api` 代理到 `http://localhost:4001`，所以前端直接 `axios.get('/api/...')`
6. **found/目录**：这是生产部署用的前后端分离版本，日常开发在 `learning-ai-platform/` 下进行

---

*文档版本：v1.0 | 生成时间：2026-04-13*
