# Learning AI Platform 代码规范

## 目录
- [通用规范](#通用规范)
- [前端规范](#前端规范)
- [后端规范](#后端规范)
- [Git规范](#git规范)
- [代码审查清单](#代码审查清单)

## 通用规范

### 命名规范

#### 文件命名
- **前端组件**：PascalCase（如 `UserProfile.vue`）
- **前端页面**：PascalCase（如 `UserCenter.vue`）
- **前端工具文件**：camelCase（如 `request.js`）
- **后端控制器**：camelCase（如 `userController.js`）
- **后端模型**：PascalCase（如 `User.js`）
- **后端路由**：camelCase（如 `userRoutes.js`）
- **测试文件**：`*.test.js` 或 `*.spec.js`

#### 变量命名
- **变量**：camelCase（如 `userName`）
- **常量**：UPPER_SNAKE_CASE（如 `MAX_RETRY_COUNT`）
- **类/构造函数**：PascalCase（如 `UserService`）
- **私有变量**：前缀下划线（如 `_privateVar`）

#### 函数命名
- **普通函数**：camelCase（如 `getUserInfo`）
- **事件处理**：handle前缀（如 `handleSubmit`）
- **布尔返回**：is/has/can前缀（如 `isValid`、`hasPermission`）

### 注释规范

#### 文件注释
```javascript
/**
 * 用户服务模块
 * 提供用户相关的业务逻辑处理
 * @module services/userService
 */

/**
 * 用户控制器
 * 处理用户相关的HTTP请求
 * @module controllers/userController
 */
```

#### 函数注释
```javascript
/**
 * 获取用户信息
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项
 * @param {boolean} options.includeProfile - 是否包含个人资料
 * @returns {Promise<Object>} 用户信息对象
 * @throws {Error} 当用户不存在时抛出错误
 */
async function getUserInfo(userId, options = {}) {
  // 实现
}
```

#### 复杂逻辑注释
```javascript
// 使用二分查找算法查找用户，时间复杂度O(log n)
let left = 0;
let right = users.length - 1;

while (left <= right) {
  const mid = Math.floor((left + right) / 2);
  if (users[mid].id === targetId) {
    return users[mid];
  } else if (users[mid].id < targetId) {
    left = mid + 1;
  } else {
    right = mid - 1;
  }
}
```

#### TODO注释
```javascript
// TODO: 添加用户权限验证
// FIXME: 修复内存泄漏问题
// HACK: 临时解决方案，需要重构
// NOTE: 这个函数性能较差，需要优化
```

### 错误处理规范

#### 错误定义
```javascript
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}
```

#### 错误处理
```javascript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  if (error instanceof AppError) {
    throw error;
  }
  logger.error('Unexpected error:', error);
  throw new AppError('操作失败', 500, 'INTERNAL_ERROR');
}
```

### 日志规范

#### 日志级别
- **error**：错误信息，需要立即处理
- **warn**：警告信息，需要关注
- **info**：一般信息，记录关键操作
- **debug**：调试信息，仅在开发环境使用

#### 日志格式
```javascript
logger.info('用户登录', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

logger.error('数据库连接失败', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

## 前端规范

### Vue组件规范

#### 组件结构
```vue
<template>
  <div class="component-name">
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  prop1: {
    type: String,
    required: true,
    validator: (value) => value.length > 0
  },
  prop2: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const state = ref(null)

const computedValue = computed(() => {
  return state.value * 2
})

onMounted(() => {
  initializeComponent()
})

onUnmounted(() => {
  cleanup()
})

function initializeComponent() {
}

function cleanup() {
}

function handleSubmit() {
  emit('submit', state.value)
}
</script>

<style scoped>
.component-name {
}
</style>
```

#### Props定义
```javascript
const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Anonymous'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  tags: {
    type: Array,
    default: () => []
  },
  user: {
    type: Object,
    validator: (value) => {
      return value && typeof value.id === 'string'
    }
  }
})
```

#### Emits定义
```javascript
const emit = defineEmits({
  'update:modelValue': (value) => typeof value === 'string',
  'submit': (payload) => payload && typeof payload.id === 'string',
  'cancel': null
})
```

#### 组件通信
```javascript
// 父组件
<ChildComponent
  v-model="value"
  :user="user"
  @submit="handleSubmit"
  @cancel="handleCancel"
/>

// 子组件
const props = defineProps(['modelValue', 'user'])
const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

function updateValue(newValue) {
  emit('update:modelValue', newValue)
}
```

### 状态管理规范

#### Store定义
```javascript
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const state = ref({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  })

  const getters = {
    isLoggedIn: computed(() => state.value.isAuthenticated),
    userName: computed(() => state.value.user?.name || '')
  }

  const actions = {
    async login(credentials) {
      try {
        state.value.loading = true
        state.value.error = null
        
        const response = await api.login(credentials)
        state.value.user = response.user
        state.value.isAuthenticated = true
      } catch (error) {
        state.value.error = error.message
        throw error
      } finally {
        state.value.loading = false
      }
    },
    
    logout() {
      state.value.user = null
      state.value.isAuthenticated = false
    }
  }

  return {
    ...state,
    ...getters,
    ...actions
  }
})
```

### 路由规范

#### 路由定义
```javascript
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: false
    }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('@/views/user/UserProfile.vue'),
    meta: {
      title: '用户资料',
      requiresAuth: true
    }
  }
]
```

#### 路由守卫
```javascript
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
```

### API调用规范

#### API封装
```javascript
import request from '@/utils/request'
import { getCsrfToken } from '@/utils/csrf'

export const userApi = {
  async getProfile(userId) {
    const token = await getCsrfToken()
    return request.get(`/users/${userId}`, {
      headers: {
        'X-CSRF-Token': token
      }
    })
  },
  
  async updateProfile(userId, data) {
    const token = await getCsrfToken()
    return request.put(`/users/${userId}`, data, {
      headers: {
        'X-CSRF-Token': token
      }
    })
  }
}
```

#### 错误处理
```javascript
try {
  const response = await userApi.getProfile(userId)
  // 处理成功响应
} catch (error) {
  if (error.response?.status === 401) {
    // 处理未授权
  } else if (error.response?.status === 404) {
    // 处理资源不存在
  } else {
    // 处理其他错误
  }
}
```

### 样式规范

#### CSS类命名
```css
/* BEM命名规范 */
.component-name {
}

.component-name__element {
}

.component-name--modifier {
}

.component-name__element--modifier {
}
```

#### 样式组织
```vue
<style scoped>
/* 1. 变量定义 */
:root {
  --primary-color: #42b983;
}

/* 2. 基础样式 */
.component-name {
  display: flex;
  flex-direction: column;
}

/* 3. 元素样式 */
.component-name__header {
  padding: 16px;
}

/* 4. 修饰符 */
.component-name--active {
  background-color: var(--primary-color);
}

/* 5. 响应式 */
@media (max-width: 768px) {
  .component-name {
    flex-direction: row;
  }
}
</style>
```

## 后端规范

### 控制器规范

#### 控制器结构
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

exports.updateUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { userId } = req.params
    const updates = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password')

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

### 路由规范

#### 路由定义
```javascript
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticate } = require('../middleware/auth')
const { validateUserUpdate } = require('../middleware/validate')

router.get('/users/:id', authenticate, userController.getUserProfile)
router.put('/users/:id', authenticate, validateUserUpdate, userController.updateUserProfile)
router.delete('/users/:id', authenticate, userController.deleteUser)

module.exports = router
```

### 模型规范

#### 模型定义
```javascript
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名是必填项'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [30, '用户名最多30个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必填项'],
    minlength: [6, '密码至少6个字符'],
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

userSchema.index({ email: 1 })
userSchema.index({ username: 1 })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
```

### 中间件规范

#### 认证中间件
```javascript
const jwt = require('jsonwebtoken')
const User = require('../models/User')

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '认证失败'
    })
  }
}
```

#### 验证中间件
```javascript
const { body, param, validationResult } = require('express-validator')

exports.validateUserUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }
    next()
  }
]

exports.validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('无效的用户ID'),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }
    next()
  }
]
```

### 数据库操作规范

#### 查询优化
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

// 使用索引优化查询
const user = await User.findOne({ email: userEmail })
```

#### 事务处理
```javascript
const session = await mongoose.startSession()
session.startTransaction()

try {
  const user = await User.create([{ name: 'John' }], { session })
  const tweet = await Tweet.create([{ 
    content: 'Hello',
    userId: user[0]._id 
  }], { session })

  await session.commitTransaction()
  return { user, tweet }
} catch (error) {
  await session.abortTransaction()
  throw error
} finally {
  session.endSession()
}
```

## Git规范

### 分支管理

#### 分支命名
- **主分支**：`main` 或 `master`
- **开发分支**：`develop`
- **功能分支**：`feature/功能描述`
- **修复分支**：`fix/问题描述`
- **发布分支**：`release/版本号`
- **热修复分支**：`hotfix/问题描述`

#### 分支策略
```bash
# 创建功能分支
git checkout -b feature/user-profile

# 创建修复分支
git checkout -b fix/login-error

# 创建发布分支
git checkout -b release/v1.0.0

# 创建热修复分支
git checkout -b hotfix/critical-bug
```

### 提交信息规范

#### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type类型
- **feat**：新功能
- **fix**：修复bug
- **docs**：文档更新
- **style**：代码格式调整
- **refactor**：重构代码
- **perf**：性能优化
- **test**：测试相关
- **chore**：构建过程或辅助工具的变动

#### 提交示例
```bash
# 新功能
git commit -m "feat(user): 添加用户资料编辑功能"

# 修复bug
git commit -m "fix(auth): 修复登录时token验证失败的问题"

# 文档更新
git commit -m "docs(readme): 更新安装说明"

# 重构
git commit -m "refactor(api): 重构用户API接口"

# 性能优化
git commit -m "perf(database): 添加用户表索引优化查询性能"
```

### 代码审查清单

#### 功能性
- [ ] 代码是否实现了需求文档中的所有功能
- [ ] 是否有未使用的代码或变量
- [ ] 是否有重复代码可以提取
- [ ] 边界条件和异常情况是否处理

#### 代码质量
- [ ] 代码是否符合项目代码规范
- [ ] 变量和函数命名是否清晰
- [ ] 是否有必要的注释
- [ ] 复杂逻辑是否有注释说明

#### 性能
- [ ] 是否有不必要的数据库查询
- [ ] 是否有内存泄漏风险
- [ ] 是否有性能瓶颈
- [ ] 是否使用了合适的数据结构

#### 安全性
- [ ] 输入是否经过验证
- [ ] 敏感信息是否正确处理
- [ ] 是否有SQL/NoSQL注入风险
- [ ] 是否有XSS/CSRF风险

#### 测试
- [ ] 是否有单元测试
- [ ] 测试覆盖率是否达标
- [ ] 测试是否通过
- [ ] 是否有集成测试

#### 文档
- [ ] API文档是否更新
- [ ] README是否更新
- [ ] 变更日志是否更新
- [ ] 是否有必要的使用示例

## 工具配置

### ESLint配置
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser'
  },
  plugins: ['vue', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/no-unused-vars': 'warn',
    'vue/require-prop-types': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
```

### Prettier配置
```javascript
module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  htmlWhitespaceSensitivity: 'css',
  endOfLine: 'lf'
}
```

### Husky配置
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,vue,ts}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## 最佳实践

### 性能优化
- 使用虚拟滚动处理长列表
- 图片懒加载
- 代码分割和懒加载
- 使用CDN加速静态资源
- 启用Gzip压缩
- 合理使用缓存策略

### 安全性
- 所有用户输入必须验证
- 使用HTTPS
- 敏感信息加密存储
- 实施CSRF保护
- 使用Helmet设置安全响应头
- 定期更新依赖包

### 可维护性
- 保持函数简短（不超过50行）
- 单一职责原则
- 避免深层嵌套（不超过3层）
- 使用有意义的变量名
- 编写清晰的注释
- 定期重构代码

### 测试
- 单元测试覆盖率不低于80%
- 关键业务逻辑必须有测试
- 使用Mock隔离外部依赖
- 测试用例命名清晰
- 保持测试独立性
