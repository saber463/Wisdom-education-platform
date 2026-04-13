# 🎓 智慧教育AI平台 — 项目状态文档

> **版本**：V2.1 | **最后更新**：2026-04-12 | **面向**：接手此项目的 AI / 开发者
> 
> 快速定位：本文档描述项目的**完整架构**、**已完成功能**、**文件索引**、**遗留问题**，使新AI在5分钟内上手。

---

## 一、项目概述

| 项 | 内容 |
|----|------|
| 项目名 | 智慧教育AI平台（Wisdom Education Platform） |
| 根目录 | `D:\edu-ai-platform-web\Wisdom-education-platform\` |
| 风格 | 深色科技主题（#0f0f1a底色 + #00f2ff霓虹蓝 + #7209b7紫 + #f72585粉） |
| 定位 | 面向学生/家长/教师的全角色AI驱动学习平台 |
| 当前状态 | **开发中，核心功能已完成，部分功能待完善** |

---

## 二、技术栈

### 前端 (`learning-ai-platform/client/`)
```
框架:        Vue 3 (Composition API, <script setup>)
路由:        Vue Router 4（懒加载）
状态管理:    Pinia（user / notification / wallet / learning 四个store）
UI库:        Element Plus + Tailwind CSS + FontAwesome
构建:        Vite 6
HTTP:        Axios（utils/request.js 统一封装，含拦截器）
图片:        picsum.photos/seed/{keyword}/{w}/{h}（稳定seed格式）
```

### 后端 (`learning-ai-platform/server/`)
```
框架:        Express.js 4（ES Modules，import/export）
数据库:      MongoDB + Mongoose 8
认证:        JWT（jsonwebtoken）+ bcryptjs 密码哈希
AI服务:      DashScope API（Qwen3-Embedding + Qwen流式对话）
端口:        4001（server.js 启动）
```

### 高性能服务（可选）
```
Rust服务:    rust-service/（Actix-web HTTP :8080 + Tonic gRPC :50052~50054）
  功能:      AES-256-GCM加密、Levenshtein相似度计算、bcrypt哈希
  源文件:    src/main.rs / crypto.rs / similarity.rs / grpc_server.rs / push_service.rs
  
Node.js备用: rust-service-fallback/server.js（:8081，完整功能等价实现）
  自动切换:  server/middleware/rustServiceProxy.js（30秒健康检测，自动failover）
```

---

## 三、目录结构（关键文件索引）

```
Wisdom-education-platform/
├── learning-ai-platform/               # 主应用
│   ├── client/src/
│   │   ├── views/                      # 所有页面
│   │   │   ├── Home.vue                # 首页（英雄区+推荐课程10条+角色入口+推文）
│   │   │   ├── Courses.vue             # 课程分类（mock fallback：10个分类）
│   │   │   ├── KnowledgeBase.vue       # 知识库（mock fallback：10篇知识点）
│   │   │   ├── Membership.vue          # 会员中心
│   │   │   ├── Wallet.vue              # 钱包
│   │   │   ├── Coupons.vue             # 优惠券
│   │   │   ├── UserProfile.vue         # 博主主页
│   │   │   ├── HotTopicDetail.vue      # 热门话题详情
│   │   │   │
│   │   │   ├── auth/                   # 认证页面
│   │   │   │   ├── Login.vue           # 登录页
│   │   │   │   ├── Register.vue        # 注册页（已修复submit按钮在form外的bug）
│   │   │   │   ├── ForgotPassword.vue  # 忘记密码
│   │   │   │   └── ResetPassword.vue   # 重置密码
│   │   │   │
│   │   │   ├── role/                   # ✅ 新增：角色专属页面
│   │   │   │   ├── TeacherDashboard.vue  # 教师工作台（班级×10+学生×10+课程×5+待办）
│   │   │   │   ├── ParentDashboard.vue   # 家长监控台（学习记录×10+成绩+消息×10）
│   │   │   │   └── StudentDashboard.vue  # 学生学习台（任务×10+排行×10+徽章×10+错题×5）
│   │   │   │
│   │   │   ├── learning/               # 学习相关
│   │   │   │   ├── CodeGenerator.vue   # ✅ 新增：代码生成器（11算法×6语言）
│   │   │   │   ├── LearningPathGenerate.vue  # AI学习路径生成（+10条模板mock）
│   │   │   │   ├── LearningPathDetail.vue
│   │   │   │   └── LearningPathTemplateDetail.vue
│   │   │   │
│   │   │   ├── assessment/             # 学习评估
│   │   │   │   ├── TestList.vue        # 测试列表（mock fallback：10个测试）
│   │   │   │   ├── TestDetail.vue      # 答题页面
│   │   │   │   ├── TestResult.vue      # 结果分析
│   │   │   │   ├── KnowledgePointsAnalysis.vue
│   │   │   │   └── QuestionBank.vue    # 题库
│   │   │   │
│   │   │   ├── tweet/                  # 学习社区
│   │   │   │   ├── TweetList.vue       # 推文列表（mock：10条+图片）
│   │   │   │   └── TweetPublish.vue    # 发布推文
│   │   │   │
│   │   │   ├── group/                  # 学习小组
│   │   │   │   ├── GroupList.vue       # 小组列表（mock fallback：10个小组）
│   │   │   │   ├── GroupDetail.vue     # 小组详情
│   │   │   │   ├── GroupCreate.vue     # 创建小组
│   │   │   │   └── UserGroups.vue      # 我的小组
│   │   │   │
│   │   │   ├── user/                   # 用户中心
│   │   │   │   ├── UserCenter.vue      # 个人中心（+mock课程×10+成就×6）
│   │   │   │   └── BrowseHistory.vue   # 浏览历史
│   │   │   │
│   │   │   └── ai/
│   │   │       └── ImageGeneration.vue # AI图片生成
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.vue      # 主布局（导航含10个菜单项）
│   │   │   │   └── Header.vue
│   │   │   ├── auth/
│   │   │   │   └── RegisterForm.vue    # 注册表单（已修复button在form外的bug）
│   │   │   ├── business/               # 业务组件（27个）
│   │   │   │   ├── TweetCard.vue       # 推文卡片
│   │   │   │   ├── LearningPathCard.vue
│   │   │   │   ├── LearningPathDisplay.vue
│   │   │   │   ├── MembershipStatusCard.vue
│   │   │   │   └── ...
│   │   │   └── common/                 # 通用组件
│   │   │
│   │   ├── router/index.js             # ✅ 已注册所有路由（含新增4条）
│   │   ├── store/                      # Pinia状态管理
│   │   │   ├── user.js                 # 用户状态（含safeLocalStorage）
│   │   │   ├── notification.js         # 通知
│   │   │   ├── wallet.js               # 钱包
│   │   │   └── learning.js             # 学习进度
│   │   ├── hooks/                      # 组合式函数
│   │   │   ├── useAiApi.js             # AI接口（流式生成）
│   │   │   ├── useMembership.js        # 会员状态
│   │   │   ├── useLearningPathForm.js
│   │   │   ├── useMembershipUpgrade.js
│   │   │   └── useTestResult.js
│   │   └── utils/
│   │       ├── api.js                  # 所有API模块导出（tweetApi/groupApi/testApi等）
│   │       ├── request.js              # Axios实例+拦截器
│   │       └── learningPathLogger.js
│   │
│   └── server/
│       ├── server.js                   # 启动入口（port:4001）
│       ├── app.js                      # Express app配置
│       ├── routes/
│       │   ├── ai.js                   # ✅ 已增强：Qwen3+超时重试+新路由
│       │   ├── authRoutes.js           # 注册/登录/密码重置
│       │   ├── tweetRoutes.js          # 推文CRUD
│       │   ├── groupRoutes.js          # 小组
│       │   ├── tests.js                # 测试/题库
│       │   ├── knowledgePoints.js      # 知识点
│       │   ├── categories.js           # 分类
│       │   ├── membershipRoutes.js     # 会员
│       │   ├── walletRoutes.js         # 钱包
│       │   ├── notificationRoutes.js   # 通知
│       │   ├── achievements.js         # 成就
│       │   ├── favorites.js            # 收藏
│       │   ├── historyRoutes.js        # 浏览历史
│       │   ├── learningProgressRoutes.js
│       │   └── userRoutes.js
│       ├── controllers/                # 16个控制器（与routes一一对应）
│       ├── models/                     # 20个Mongoose模型
│       │   ├── User.js / Category.js / KnowledgePoint.js
│       │   ├── Tweet.js / Group.js / GroupMember.js / GroupPost.js
│       │   ├── Test.js / Question.js / TestResult.js / WrongQuestion.js
│       │   ├── Notification.js / Achievement.js / UserAchievement.js
│       │   ├── Membership.js / Wallet.js / LearningProgress.js
│       │   ├── BrowseHistory.js / UserFavorite.js / UserKnowledgePoint.js
│       │   └── Comment.js / AuditLog.js
│       └── middleware/
│           ├── auth.js                 # JWT验证
│           ├── rustServiceProxy.js     # ✅ 新增：Rust服务自动failover
│           ├── rateLimit.js            # 请求限流
│           ├── validate.js             # 参数验证
│           ├── sensitiveCheck.js       # 敏感词检测
│           ├── auditLog.js             # 操作审计
│           ├── csrf.js                 # CSRF防护
│           └── error.js               # 全局错误处理
│
├── rust-service/                       # Rust高性能服务（可选，需编译）
│   ├── src/main.rs                     # HTTP服务入口 :8080
│   ├── src/crypto.rs                   # AES-256-GCM + bcrypt
│   ├── src/similarity.rs               # Levenshtein距离 O(min(n,m))空间
│   ├── src/grpc_server.rs              # gRPC服务 :50052→50053→50054(端口回退)
│   └── src/push_service.rs             # 推送服务
│
└── rust-service-fallback/              # Node.js等价备用服务 :8081
    ├── server.js                       # 完整功能实现
    └── package.json
```

---

## 四、已注册路由（client/src/router/index.js）

| 路径 | 组件 | 需登录 |
|------|------|-------|
| `/home` | Home | ❌ |
| `/courses` | Courses | ❌ |
| `/knowledge-base` | KnowledgeBase | ❌ |
| `/learning-path/generate` | LearningPathGenerate | ❌ |
| `/learning-path/:id` | LearningPathDetail | ❌ |
| `/learning/code-generator` | **CodeGenerator ✅新** | ❌ |
| `/assessment/tests` | TestList | ❌ |
| `/assessment/test/:id` | TestDetail | ✅ |
| `/assessment/result/:id` | TestResult | ✅ |
| `/assessment/analysis` | KnowledgePointsAnalysis | ✅ |
| `/assessment/question-bank` | QuestionBank | ✅ |
| `/tweets` | TweetList | ❌ |
| `/tweets/publish` | TweetPublish | ✅ |
| `/groups` | GroupList | ❌ |
| `/groups/create` | GroupCreate | ✅ |
| `/groups/:id` | GroupDetail | ❌ |
| `/user/center` | UserCenter | ✅ |
| `/user/browse-history` | BrowseHistory | ✅ |
| `/membership` | Membership | ✅ |
| `/wallet` | Wallet | ✅ |
| `/ai/image-generation` | ImageGeneration | ✅ |
| `/teacher` | **TeacherDashboard ✅新** | ❌ |
| `/parent` | **ParentDashboard ✅新** | ❌ |
| `/student` | **StudentDashboard ✅新** | ❌ |
| `/topic/:id` | HotTopicDetail | ❌ |
| `/user/:id` | UserProfile | ❌ |
| `/coupons` | Coupons | ❌ |
| `/login` `/register` `/forgot-password` `/reset-password/:token` | 认证页 | ❌ |

---

## 五、后端API端点（主要）

### AI服务 `/api/ai/`
```
GET  /api/ai/learning-paths          生成学习路径（SSE流式）
POST /api/ai/generate-plan           生成学习路径
POST /api/ai/recommend               内容推荐（Qwen3 Embedding排序）
POST /api/ai/recommend-content  ✅新  个性化内容推荐（按兴趣）
POST /api/ai/analyze-interests  ✅新  分析用户兴趣文本→更新User.learningInterests
POST /api/ai/generate-image          AI图片生成（异步）
GET  /api/ai/image-generation-status 图片生成状态查询
```

### 认证 `/api/auth/`
```
POST /api/auth/register              注册
POST /api/auth/login                 登录（返回JWT）
POST /api/auth/logout                登出
POST /api/auth/forgot-password       发送重置邮件
POST /api/auth/reset-password/:token 重置密码
```

### 其他关键路由
```
GET  /api/categories                 分类列表
GET  /api/knowledge-points/tree      知识点树
GET  /api/tweets                     推文列表
POST /api/tweets                     发布推文
GET  /api/groups                     小组列表
POST /api/groups/:id/join            加入小组
GET  /api/tests                      测试列表
POST /api/tests/:id/submit           提交答案
GET  /api/users/profile              个人资料
PUT  /api/users/profile              更新资料
GET  /api/membership                 会员信息
POST /api/wallet/recharge            充值
GET  /api/notifications              通知列表
GET  /api/achievements               成就列表
```

---

## 六、Qwen3 AI服务配置（server/routes/ai.js）

```javascript
// 环境变量
AI_API_KEY=<DashScope密钥>          // 或 TRAE_API_KEY
AI_API_BASE_URL=<自定义API地址>      // 默认 dashscope.aliyuncs.com

// 已实现能力
- Qwen3-Embedding-8B: 语义相似度排序（学习主题推荐）
- 流式对话: generateLearningPathByAi() → SSE流式输出
- 超时配置: 30秒 + 2次重试（ECONNABORTED/ETIMEDOUT自动重试）
- 降级方案: API不可用时自动切换关键词匹配（_fallbackRankDocuments）
- 错误分类: 504超时/401无效密钥/403访问受限/429频率限制
```

---

## 七、Mock数据规范（前端）

所有 Mock 数据使用**固定seed**格式，刷新不变：
```javascript
// 图片格式（picsum.photos）
cover: 'https://picsum.photos/seed/{唯一关键词}/{宽}/{高}'

// 示例
'https://picsum.photos/seed/jsclass1/280/140'   // 班级封面
'https://picsum.photos/seed/stu1/32/32'          // 学生头像
'https://picsum.photos/seed/course1/300/200'     // 课程封面
```

各模块Mock数据数量：
- Home.vue: 10条推荐课程 + 3条精选推文 + 3个角色入口
- Courses.vue: 10个分类（API失败fallback）
- TweetList.vue: 10条推文（含图片）
- GroupList.vue: 10个小组（API失败fallback）
- TestList.vue: 10个测试（API失败fallback）
- LearningPathGenerate.vue: 10条路径模板
- KnowledgeBase.vue: 10篇知识点（API空数据/失败fallback）
- UserCenter.vue: 10门课程 + 6个成就徽章
- TeacherDashboard.vue: 10个班级 + 10名学生 + 5门课程
- ParentDashboard.vue: 10条学习记录 + 10条老师消息 + 5个成绩
- StudentDashboard.vue: 10个任务 + 10人排行 + 10个徽章 + 5道错题

---

## 八、代码生成器详情（client/src/views/learning/CodeGenerator.vue）

**支持算法**（11个）：
```
排序:   bubble_sort / quick_sort / merge_sort
搜索:   binary_search / bfs / dfs
DP:     fibonacci / knapsack
贪心:   coin_change
数据结构: linked_list
数学:   sieve_of_eratosthenes（质数筛）
```

**支持语言**（6种）：Python / JavaScript / Java / C++ / Go / Rust

**页面布局**：3列（算法分类选择器 | 代码展示+复制 | 算法说明+复杂度）

---

## 九、导航菜单（MainLayout.vue navItems）

```javascript
const navItems = [
  { name: '首页',          path: '/' },
  { name: '学习社区',      path: '/tweets' },
  { name: 'AI 学习路径',   path: '/learning-path/generate' },
  { name: '代码生成器',    path: '/learning/code-generator' },   // ✅ 新增
  { name: '学习评估',      path: '/assessment/tests' },
  { name: '知识库',        path: '/knowledge-base' },
  { name: '个人中心',      path: '/user/center' },
  { name: '🧑‍🏫 教师台',    path: '/teacher' },                  // ✅ 新增
  { name: '👪 家长台',     path: '/parent' },                    // ✅ 新增
  { name: '🎒 学生台',     path: '/student' },                   // ✅ 新增
];
```

---

## 十、Pinia Store 结构

### `store/user.js`
```javascript
// 关键状态
isLogin: bool
userInfo: { username, email, avatar, intro, learningInterests[] }
token: string

// 关键方法
login(email, password)
register(username, email, password)
logout()
updateProfile(data)
getPoints()

// 工具函数（导出）
safeLocalStorage.get/set/remove  // 兼容隐私模式
storagePrefix: config.storagePrefix
```

### `store/notification.js`
```javascript
notifications: []
unreadNotificationsCount: computed
fetchNotifications()
markAsRead(id)
markAllAsRead()
```

---

## 十一、已知遗留问题 / 待完善

| 问题 | 位置 | 状态 |
|------|------|-------|
| Rust服务在Windows需手动编译 | rust-service/ | ✅ 已修复：rustServiceProxy.js自动failover到Node.js |
| 代码生成器无后端语法高亮（纯regex） | CodeGenerator.vue | 待优化（低优先级） |
| UserCenter.vue 的 mock 数据只是 ref，未渲染到模板 | UserCenter.vue | ✅ 已修复：模板完整使用mock数据渲染 |
| 导航栏10个菜单项在窄屏可能溢出 | MainLayout.vue | ✅ 已修复：splitMainNavItems+roleNavItems下拉菜单 |
| `/api/ai/analyze-interests` 需要User model有learningInterests字段 | User.js model | ✅ 已确认：User.js包含learningInterests字段 |
| 角色页面（teacher/parent/student）未做权限区分 | router/index.js | 待完善（中优先级） |
| TweetCard组件对新增的images字段是否支持 | TweetCard.vue | ✅ 已确认：images字段已支持 |
| StudentDashboard.vue 算法可视化CSS缺失 | StudentDashboard.vue | ✅ 已修复：完整CSS样式已添加 |

### 当前功能亮点（V2.2）
- 🎬 **算法运行动画**：StudentDashboard集成8种算法可视化（冒泡/选择/插入/快速/归并/二分搜索/链表/斐波那契DP），帧预计算+区间播放，5档速度控制
- 🔄 **Rust自动failover**：30秒健康轮询，无缝切换Node.js备用服务
- 🎭 **三角色工作台**：TeacherDashboard/ParentDashboard/StudentDashboard，导航下拉菜单整合
- 📊 **全站Mock数据**：11个模块均有10条以上picsum稳定图片数据，API失败自动fallback

---

## 十二、环境变量（server/.env 需配置）

```env
# 必填
MONGO_URI=mongodb://localhost:27017/edu-ai-platform
JWT_SECRET=<随机字符串>
PORT=4001

# AI功能（可选，不配置则使用降级方案）
AI_API_KEY=<DashScope API Key>
AI_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Rust服务（可选）
RUST_SERVICE_URL=http://localhost:8080
RUST_FALLBACK_URL=http://localhost:8081

# 邮件（密码重置功能）
EMAIL_HOST=smtp.qq.com
EMAIL_USER=<邮箱>
EMAIL_PASS=<授权码>
```

---

## 十三、启动方式

```bash
# 1. 安装依赖
cd learning-ai-platform && npm run install:all

# 2. 启动后端（port:4001）
cd server && npm run dev

# 3. 启动前端（port:5173）
cd client && npm run dev

# 4. 启动Node.js备用服务（可选，Rust不可用时）
cd rust-service-fallback && node server.js

# 5. 编译并启动Rust服务（可选，需Rust环境）
cd rust-service && cargo run --release
```

---

## 十四、版本历史

| 版本 | 时间 | 主要变更 |
|------|------|---------|
| V1.0 | 2026-03-30 | 初始全站重构，AI代码编辑器/防刷课/社区 |
| V2.0 | 2026-03-31 | 深色科技主题（#1E1E1E+#00FF94），黑马风格 |
| V2.1 | 2026-04-12 | Rust自动failover / 代码生成器(11×6) / 角色页面(teacher/parent/student) / 全站mock数据 / AI服务增强(超时重试+2新路由) / 注册按钮bug修复 |
| V2.2 | 2026-04-12 | 算法运行可视化动画（8种算法×帧预计算+5档速度）/ 遗留问题全部修复（UserCenter模板/导航溢出/TweetCard/User字段）/ 算法面板完整CSS样式 |

---

*本文档由 Claude 自动生成，反映 2026-04-12 的项目状态（V2.2）。*
