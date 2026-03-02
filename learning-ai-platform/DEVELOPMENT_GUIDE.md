# Learning AI Platform 开发指南

## 目录
- [项目架构](#项目架构)
- [开发环境配置](#开发环境配置)
- [代码规范](#代码规范)
- [测试指南](#测试指南)
- [部署指南](#部署指南)
- [性能优化](#性能优化)
- [安全最佳实践](#安全最佳实践)
- [故障排查](#故障排查)

## 项目架构

### 整体架构
Learning AI Platform采用前后端分离架构：
- **前端**：Vue 3 + Vite + Pinia + Vue Router
- **后端**：Node.js + Express + MongoDB
- **AI服务**：集成Qwen3模型进行文本嵌入和智能问答

### 前端架构

#### 目录结构
```
client/src/
├── api/                    # API请求封装
│   └── aiApi.js           # AI相关API
├── assets/                # 静态资源
│   ├── images/            # 图片资源
│   └── main.css           # 全局样式
├── components/            # Vue组件
│   ├── assessment/        # 评估测试组件
│   ├── auth/              # 认证相关组件
│   ├── business/          # 业务组件
│   ├── common/            # 通用组件
│   └── layout/            # 布局组件
├── config/                # 配置文件
│   └── index.js           # 应用配置
├── hooks/                 # 自定义Hooks
│   ├── useAiApi.js        # AI API Hook
│   ├── useLearningPathForm.js
│   ├── useMembership.js
│   ├── useMembershipUpgrade.js
│   └── useTestResult.js
├── router/                # 路由配置
│   └── index.js           # 路由定义
├── store/                 # Pinia状态管理
│   ├── index.js           # Store入口
│   ├── learning.js        # 学习状态
│   ├── notification.js    # 通知状态
│   ├── user.js            # 用户状态
│   └── wallet.js          # 钱包状态
├── utils/                 # 工具函数
│   ├── ai.js              # AI工具
│   ├── api.js             # API工具
│   ├── csrf.js            # CSRF工具
│   ├── date.js            # 日期工具
│   ├── logger.js          # 日志工具
│   └── request.js         # 请求工具
├── views/                 # 页面组件
│   ├── assessment/        # 评估测试页面
│   ├── auth/              # 认证页面
│   ├── group/             # 群组页面
│   ├── learning/          # 学习路径页面
│   ├── tweet/             # 推文页面
│   └── user/              # 用户页面
├── app.vue                # 根组件
├── config.js              # 主配置
└── main.js                # 入口文件
```

#### 组件设计原则
1. **单一职责**：每个组件只负责一个功能
2. **可复用性**：通用组件应具有高度可复用性
3. **组件通信**：使用props和events进行父子组件通信
4. **状态管理**：复杂状态使用Pinia进行管理
5. **性能优化**：合理使用computed、watch和v-memo

#### 状态管理
使用Pinia进行状态管理，主要Store包括：
- `userStore`：用户信息和认证状态
- `learningStore`：学习进度和路径
- `notificationStore`：通知管理
- `walletStore`：积分和钱包

### 后端架构

#### 目录结构
```
server/
├── config/                # 配置文件
│   ├── aiConfig.js        # AI服务配置
│   ├── db.js              # 数据库配置
│   └── sensitiveWords.json # 敏感词列表
├── controllers/           # 控制器
│   ├── achievementController.js
│   ├── aiController.js
│   ├── authController.js
│   ├── categoryController.js
│   ├── favoritesController.js
│   ├── groupController.js
│   ├── historyController.js
│   ├── knowledgePointController.js
│   ├── learningProgressController.js
│   ├── membershipController.js
│   ├── notificationController.js
│   ├── testController.js
│   ├── tweetController.js
│   └── userController.js
├── middleware/            # 中间件
│   ├── auditLog.js        # 审计日志
│   ├── auth.js            # 认证中间件
│   ├── csrf.js            # CSRF保护
│   ├── rateLimit.js       # 限流中间件
│   ├── sensitiveCheck.js   # 敏感词检查
│   ├── upload.js          # 文件上传
│   ├── validate.js        # 验证中间件
│   └── validation/        # 验证规则
├── models/                # 数据模型
│   ├── Achievement.js
│   ├── AuditLog.js
│   ├── BrowseHistory.js
│   ├── Category.js
│   ├── Comment.js
│   ├── Group.js
│   ├── GroupMember.js
│   ├── GroupPost.js
│   ├── KnowledgePoint.js
│   ├── LearningPath.js
│   ├── LearningProgress.js
│   ├── Notification.js
│   ├── Question.js
│   ├── Resource.js
│   ├── Test.js
│   ├── TestResult.js
│   ├── Tweet.js
│   ├── User.js
│   ├── UserAchievement.js
│   ├── UserFavorite.js
│   ├── UserKnowledgePoint.js
│   └── WrongQuestion.js
├── routes/                # 路由定义
│   ├── achievements.js
│   ├── ai.js
│   ├── authRoutes.js
│   ├── categories.js
│   ├── favorites.js
│   ├── groupRoutes.js
│   ├── historyRoutes.js
│   ├── index.js
│   ├── knowledgePoints.js
│   ├── learningProgressRoutes.js
│   ├── notificationRoutes.js
│   ├── points.js
│   ├── tests.js
│   ├── tweetRoutes.js
│   └── userRoutes.js
├── services/              # 业务逻辑服务
│   ├── chatbotService.js
│   ├── chatbotServiceEnhanced.js
│   ├── learningBehaviorAnalyzer.js
│   ├── qwen3EmbeddingService.js
│   └── qwen3EmbeddingServiceEnhanced.js
├── utils/                 # 工具函数
│   ├── couponGenerator.js
│   ├── cryptoUtils.js
│   ├── dfaFilter.js
│   ├── emailUtils.js
│   ├── errorResponse.js
│   ├── seedData.js
│   ├── seedGroupData.js
│   └── seedTestsData.js
├── app.js                 # Express应用配置
└── server.js              # 服务器入口
```

#### MVC架构
- **Model（模型）**：定义数据结构和数据库操作
- **View（视图）**：前端页面，由Vue组件实现
- **Controller（控制器）**：处理HTTP请求，调用Service层

#### 中间件链
```
请求 → CORS → Body Parser → CSRF Token → Auth → Rate Limit → Controller
```

## 开发环境配置

### 前置要求
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
```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

#### 3. 配置环境变量

##### 全局环境变量
```bash
cp .env.example .env
```

##### 后端环境变量
```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件：
```env
PORT=4001
MONGO_URI=mongodb://localhost:27017/learning-ai-platform
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d
NODE_ENV=development
```

##### 前端环境变量
```bash
cd ../client
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:4001/api
```

#### 4. 启动服务
```bash
# 启动后端服务（终端1）
cd server
npm run dev

# 启动前端服务（终端2）
cd client
npm run dev
```

#### 5. 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:4001/api

### 开发工具推荐

#### VS Code插件
- Volar（Vue 3支持）
- ESLint
- Prettier
- GitLens
- MongoDB for VS Code

#### 浏览器插件
- Vue.js devtools
- Redux DevTools（用于Pinia调试）

## 代码规范

### 前端代码规范

#### Vue组件规范
```vue
<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  prop1: {
    type: String,
    required: true
  },
  prop2: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['event1', 'event2'])

const state = ref(null)

const computedValue = computed(() => {
  return state.value * 2
})

onMounted(() => {
  // 组件挂载后执行
})

function method1() {
  // 方法实现
}
</script>

<style scoped>
.component-name {
  /* 样式 */
}
</style>
```

#### 命名规范
- **组件名**：PascalCase（如 `UserProfile.vue`）
- **文件名**：kebab-case（如 `user-profile.vue`）
- **变量名**：camelCase（如 `userName`）
- **常量名**：UPPER_SNAKE_CASE（如 `MAX_RETRY_COUNT`）
- **CSS类名**：kebab-case（如 `user-profile-card`）

#### API调用规范
```javascript
import { ref } from 'vue'
import { getCsrfToken } from '@/utils/csrf'
import request from '@/utils/request'

export function useUserProfile() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  async function fetchProfile(userId) {
    try {
      loading.value = true
      error.value = null
      
      const token = await getCsrfToken()
      const response = await request.get(`/users/${userId}`, {
        headers: {
          'X-CSRF-Token': token
        }
      })
      
      data.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    data,
    fetchProfile
  }
}
```

### 后端代码规范

#### 控制器规范
```javascript
const User = require('../models/User')
const { validationResult } = require('express-validator')

exports.getUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { userId } = req.params
    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
}
```

#### 路由规范
```javascript
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticate } = require('../middleware/auth')
const { validateUserUpdate } = require('../middleware/validate')

router.get('/users/:id', authenticate, userController.getUserProfile)
router.put('/users/:id', authenticate, validateUserUpdate, userController.updateUserProfile)

module.exports = router
```

#### 错误处理规范
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    })
  } else {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
  }
}

module.exports = { AppError, errorHandler }
```

## 测试指南

### 前端测试

#### 单元测试（Vitest）
```javascript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserProfile from '@/components/UserProfile.vue'

describe('UserProfile', () => {
  it('renders user name correctly', () => {
    const wrapper = mount(UserProfile, {
      props: {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    })
    
    expect(wrapper.text()).toContain('Test User')
  })

  it('emits update event when form is submitted', async () => {
    const wrapper = mount(UserProfile, {
      props: {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    })
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('update')).toBeTruthy()
  })
})
```

#### 组件测试
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TweetCard from '@/components/business/TweetCard.vue'

describe('TweetCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays tweet content', () => {
    const tweet = {
      id: '1',
      content: 'Test tweet',
      author: {
        name: 'Test User',
        avatar: 'avatar.png'
      },
      likes: 10,
      comments: 5
    }

    const wrapper = mount(TweetCard, {
      props: { tweet }
    })

    expect(wrapper.text()).toContain('Test tweet')
  })

  it('emits like event when like button is clicked', async () => {
    const tweet = {
      id: '1',
      content: 'Test tweet',
      author: {
        name: 'Test User',
        avatar: 'avatar.png'
      },
      likes: 10,
      comments: 5
    }

    const wrapper = mount(TweetCard, {
      props: { tweet }
    })

    await wrapper.find('.like-button').trigger('click')

    expect(wrapper.emitted('like')).toBeTruthy()
    expect(wrapper.emitted('like')[0]).toEqual(['1'])
  })
})
```

#### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test TweetCard.test.js

# 生成覆盖率报告
npm run test:coverage

# 监听模式
npm run test:watch
```

### 后端测试

#### 单元测试（Jest）
```javascript
const request = require('supertest')
const app = require('../app')
const User = require('../models/User')

describe('User API', () => {
  beforeAll(async () => {
    await User.deleteMany({})
  })

  afterAll(async () => {
    await User.deleteMany({})
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.email).toBe('test@example.com')
    })

    it('should not register user with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password123'
        })

      expect(res.statusCode).toBe(409)
      expect(res.body.success).toBe(false)
    })
  })
})
```

#### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test userController.test.js

# 生成覆盖率报告
npm run test:coverage

# 监听模式
npm run test:watch
```

## 部署指南

### 生产环境部署

#### 1. 环境准备
```bash
# 安装PM2（进程管理器）
npm install -g pm2

# 安装Nginx（反向代理）
sudo apt-get install nginx
```

#### 2. 构建前端
```bash
cd client
npm run build
```

#### 3. 配置Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 4. 配置PM2
创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'learning-ai-platform',
    script: './server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4001
    }
  }]
}
```

启动应用：
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. 配置HTTPS
使用Let's Encrypt获取免费SSL证书：
```bash
sudo certbot --nginx -d your-domain.com
```

### Docker部署

#### Dockerfile（后端）
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4001

CMD ["node", "server.js"]
```

#### Dockerfile（前端）
```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./server
    ports:
      - "4001:4001"
    depends_on:
      - mongodb
    environment:
      - MONGO_URI=mongodb://mongodb:27017/learning-ai-platform
      - NODE_ENV=production

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

启动服务：
```bash
docker-compose up -d
```

## 性能优化

### 前端性能优化

#### 1. 代码分割
```javascript
// 路由懒加载
const UserProfile = () => import('@/views/user/UserProfile.vue')

const routes = [
  {
    path: '/user/:id',
    component: UserProfile
  }
]
```

#### 2. 组件懒加载
```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
)
</script>
```

#### 3. 图片优化
```vue
<template>
  <img 
    :src="imageSrc" 
    :alt="imageAlt"
    loading="lazy"
    @error="handleImageError"
  />
</template>
```

#### 4. 虚拟滚动
```javascript
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  largeList,
  { itemHeight: 50 }
)
```

### 后端性能优化

#### 1. 数据库索引
```javascript
// User模型索引
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ username: 1 })
UserSchema.index({ createdAt: -1 })

// Tweet模型索引
TweetSchema.index({ userId: 1, createdAt: -1 })
TweetSchema.index({ tags: 1 })
```

#### 2. 查询优化
```javascript
// 使用投影减少数据传输
const users = await User.find({}, { name: 1, email: 1 })

// 使用limit和skip进行分页
const tweets = await Tweet.find()
  .sort({ createdAt: -1 })
  .limit(20)
  .skip(page * 20)

// 使用populate优化关联查询
const tweets = await Tweet.find()
  .populate('userId', 'name avatar')
  .limit(20)
```

#### 3. 缓存策略
```javascript
const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 600 })

exports.getCachedData = async (key, fetchFn) => {
  const cached = cache.get(key)
  if (cached) return cached

  const data = await fetchFn()
  cache.set(key, data)
  return data
}
```

#### 4. 连接池配置
```javascript
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000
})
```

## 安全最佳实践

### 前端安全

#### 1. XSS防护
```javascript
import DOMPurify from 'dompurify'

function sanitizeHTML(html) {
  return DOMPurify.sanitize(html)
}
```

#### 2. CSRF防护
```javascript
import { getCsrfToken, setupCsrfInterceptor } from '@/utils/csrf'

setupCsrfInterceptor()

async function makeRequest() {
  const token = await getCsrfToken()
  // 在请求头中包含CSRF Token
}
```

#### 3. 敏感信息保护
```javascript
// 不要在前端存储敏感信息
// 使用HttpOnly Cookie存储Token
// 使用localStorage存储非敏感信息
```

### 后端安全

#### 1. 输入验证
```javascript
const { body, validationResult } = require('express-validator')

exports.validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
]
```

#### 2. SQL/NoSQL注入防护
```javascript
// 使用参数化查询
const user = await User.findOne({ email: req.body.email })

// 使用Mongoose的查询构建器
const users = await User.find({ age: { $gte: 18 } })
```

#### 3. 密码加密
```javascript
const bcrypt = require('bcryptjs')
const saltRounds = 10

const hashedPassword = await bcrypt.hash(password, saltRounds)
const isValid = await bcrypt.compare(password, hashedPassword)
```

#### 4. 速率限制
```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '请求过于频繁，请稍后再试'
})

app.use('/api/', limiter)
```

## 故障排查

### 常见问题

#### 1. 前端构建失败
**问题**：`npm run build` 失败
**解决方案**：
```bash
# 清理缓存
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

#### 2. 数据库连接失败
**问题**：`MongoNetworkError: failed to connect to server`
**解决方案**：
```bash
# 检查MongoDB服务状态
sudo systemctl status mongod

# 启动MongoDB
sudo systemctl start mongod

# 检查连接字符串
echo $MONGO_URI
```

#### 3. API请求失败
**问题**：`Network Error` 或 `CORS Error`
**解决方案**：
```javascript
// 检查代理配置
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true
      }
    }
  }
})
```

#### 4. 内存泄漏
**问题**：应用内存占用持续增长
**解决方案**：
```javascript
// 使用Chrome DevTools Memory面板分析
// 检查事件监听器是否正确移除
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 检查定时器是否清除
const timer = setInterval(() => {}, 1000)
onUnmounted(() => {
  clearInterval(timer)
})
```

### 日志调试

#### 前端日志
```javascript
import { logger } from '@/utils/logger'

logger.info('用户登录', { userId: '123' })
logger.error('API请求失败', { error: err.message })
logger.warn('资源加载缓慢', { duration: 5000 })
```

#### 后端日志
```javascript
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

## 贡献指南

### 提交代码
1. 创建功能分支：`git checkout -b feature/your-feature`
2. 提交更改：`git commit -m 'Add some feature'`
3. 推送到分支：`git push origin feature/your-feature`
4. 创建Pull Request

### 代码审查
- 确保代码通过所有测试
- 遵循代码规范
- 添加必要的注释和文档
- 更新相关文档

### 问题报告
- 使用GitHub Issues报告问题
- 提供详细的复现步骤
- 附上错误日志和环境信息

## 联系方式

- Email: your-email@example.com
- GitHub: your-github-username
- Discord: your-discord-server
