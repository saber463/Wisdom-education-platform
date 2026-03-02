# Design Document - Learning Platform Integration

## Overview

本设计文档描述了将 learning-ai-platform 项目作为**主界面**，当前 edu-ai-platform-web 的教学管理功能作为**副界面**的双系统架构方案。两个系统通过统一的用户体系和数据关联实现无缝切换和协同工作。

### 架构理念

**主界面（Learning AI Platform）**：
- 面向学生的学习体验
- 学习路径浏览和学习
- 学习资源分享和发现
- AI 聊天助手
- 学习进度跟踪
- 个性化推荐

**副界面（Education Management System）**：
- 面向教师的教学管理
- 作业创建和管理
- AI 智能批改
- 学情分析和报告
- 班级管理
- 成绩统计

**系统切换**：
- 主界面顶部导航栏提供"教学管理"入口
- 副界面顶部导航栏提供"返回学习平台"入口
- 切换时保持用户登录状态
- 共享通知中心

### 设计目标

1. **双系统协同**：主副界面功能互补，数据互通
2. **无缝切换**：用户可以在两个系统间自由切换
3. **数据关联**：学习路径、作业、资源、知识点相互关联
4. **统一体验**：保持一致的UI风格和交互模式
5. **角色适配**：不同角色看到不同的功能入口

### 核心功能模块

**主界面模块**：
1. 学习路径浏览和学习系统
2. 学习资源分享和发现系统
3. AI 聊天助手
4. 学习进度跟踪系统
5. 个性化推荐系统

**副界面模块**（保留现有）：
1. 作业管理系统
2. AI 智能批改系统
3. 学情分析系统
4. 班级管理系统
5. 成绩统计系统

**共享模块**：
1. 统一用户认证系统
2. 统一通知系统
3. 统一知识点体系
4. 统一AI服务

---

## Architecture

### 双系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                    主界面 (Learning AI Platform)                     │
│                  Vue 3 + TypeScript + Element Plus + Tailwind CSS    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  顶部导航栏                                                  │    │
│  │  [学习路径] [资源广场] [AI助手] [我的学习] [通知]           │    │
│  │  ┌──────────────────────────────────────────┐              │    │
│  │  │  [切换到教学管理系统] ←─ 教师/家长可见    │              │    │
│  │  └──────────────────────────────────────────┘              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ 学习路径     │  │ 资源分享     │  │ AI聊天       │             │
│  │ 浏览和学习   │  │ 发现和收藏   │  │ 智能问答     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└───────────────────────────────────────┬─────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │      统一后端服务 (Shared Backend)     │
                    │   Node.js + Express + TypeScript      │
                    │                                        │
                    │  ┌──────────┐  ┌──────────┐          │
                    │  │ 路由     │  │ 认证     │          │
                    │  │ 分发器   │  │ 中间件   │          │
                    │  └──────────┘  └──────────┘          │
                    └───────────────────┬───────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ 学习平台 API      │         │ 教学管理 API     │         │ 共享 API        │
│ - 学习路径        │         │ - 作业管理       │         │ - 用户认证      │
│ - 学习资源        │         │ - AI批改         │         │ - 通知系统      │
│ - 学习进度        │         │ - 学情分析       │         │ - 知识点体系    │
│ - AI推荐          │         │ - 班级管理       │         │ - AI服务        │
└───────────────────┘         └─────────────────┘         └─────────────────┘
        │                               │                               │
        └───────────────────────────────┼───────────────────────────────┘
                                        ▼
                            ┌───────────────────────┐
                            │   MySQL Database      │
                            │                       │
                            │  ┌─────────────────┐ │
                            │  │ 学习平台表      │ │
                            │  │ 教学管理表      │ │
                            │  │ 共享表          │ │
                            │  └─────────────────┘ │
                            └───────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ Python AI Service │         │ Qwen3 Models    │         │ Baidu/Xunfei AI │
│ (gRPC)            │         │ (Embedding/Chat)│         │ Services        │
└───────────────────┘         └─────────────────┘         └─────────────────┘
                                        ▲
                                        │
┌───────────────────────────────────────┴─────────────────────────────┐
│                  副界面 (Education Management System)                │
│                  Vue 3 + TypeScript + Element Plus                   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  顶部导航栏                                                  │    │
│  │  [作业管理] [批改系统] [学情分析] [班级管理] [通知]         │    │
│  │  ┌──────────────────────────────────────────┐              │    │
│  │  │  [返回学习平台] ←─ 所有用户可见           │              │    │
│  │  └──────────────────────────────────────────┘              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ 作业管理     │  │ AI批改       │  │ 学情分析     │             │
│  │ 创建和发布   │  │ 智能评分     │  │ 数据报告     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└───────────────────────────────────────────────────────────────────────┘
```

### 技术栈

**主界面 (Learning AI Platform)**:
- Vue 3 (Composition API)
- TypeScript
- Element Plus (UI组件库)
- Tailwind CSS (样式系统)
- Pinia (状态管理)
- Vue Router (路由)
- Axios (HTTP客户端)
- ECharts (数据可视化 - 思维导图、学习统计)
- Video.js (视频播放器 - 支持进度追踪)

**副界面 (Education Management System)**:
- Vue 3 (Composition API)
- TypeScript
- Element Plus (UI组件库)
- 保持现有样式系统
- Pinia (状态管理)
- Vue Router (路由)
- Axios (HTTP客户端)

**统一后端**:
- Node.js 16+
- Express 4.x
- TypeScript
- **MySQL 8.0** (结构化数据：用户、课程、班级、作业等)
- **MongoDB 5.0+** (行为数据：视频进度、用户行为、推荐结果、社区内容)
- JWT (身份认证)
- bcrypt (密码加密)
- Mongoose (MongoDB ORM)

**AI服务**:
- Python AI Service (gRPC)
- Qwen3 Models (文本嵌入、聊天)
- Baidu AI (学习行为分析)
- Xunfei AI (语音识别和合成)
- 协同过滤算法 (课程推荐)
- 内容相似度算法 (资源推荐)

### 系统切换机制

#### 1. 路由设计

**主界面路由前缀**: `/learning`
```
/learning/paths          - 学习路径列表
/learning/paths/:id      - 学习路径详情
/learning/resources      - 资源广场
/learning/resources/:id  - 资源详情
/learning/ai-chat        - AI聊天助手
/learning/my-progress    - 我的学习进度
```

**副界面路由前缀**: `/edu` (保持现有)
```
/edu/teacher/assignments - 作业管理
/edu/student/assignments - 我的作业
/edu/teacher/grading     - 批改系统
/edu/teacher/analytics   - 学情分析
```

**切换实现**:
```typescript
// 主界面 → 副界面
const switchToEduSystem = () => {
  router.push('/edu/dashboard');
};

// 副界面 → 主界面
const switchToLearningPlatform = () => {
  router.push('/learning/paths');
};
```

#### 2. 导航栏设计

**主界面导航栏** (`frontend/src/layouts/LearningLayout.vue`):
```vue
<template>
  <div class="learning-layout">
    <header class="top-nav">
      <div class="logo">AI LearnHub</div>
      <nav class="main-nav">
        <router-link to="/learning/paths">学习路径</router-link>
        <router-link to="/learning/resources">资源广场</router-link>
        <router-link to="/learning/ai-chat">AI助手</router-link>
        <router-link to="/learning/my-progress">我的学习</router-link>
        <router-link to="/notifications">通知</router-link>
      </nav>
      <div class="user-actions">
        <!-- 教师和家长可见 -->
        <el-button 
          v-if="['teacher', 'parent'].includes(userRole)"
          type="primary" 
          @click="switchToEduSystem">
          <el-icon><Management /></el-icon>
          教学管理系统
        </el-button>
        <user-menu />
      </div>
    </header>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>
```

**副界面导航栏** (`frontend/src/layouts/EduLayout.vue`):
```vue
<template>
  <div class="edu-layout">
    <header class="top-nav">
      <div class="logo">智慧教育管理系统</div>
      <nav class="main-nav">
        <router-link v-if="userRole === 'teacher'" to="/edu/teacher/assignments">
          作业管理
        </router-link>
        <router-link v-if="userRole === 'student'" to="/edu/student/assignments">
          我的作业
        </router-link>
        <router-link to="/notifications">通知</router-link>
      </nav>
      <div class="user-actions">
        <!-- 所有用户可见 -->
        <el-button 
          type="primary" 
          @click="switchToLearningPlatform">
          <el-icon><Reading /></el-icon>
          返回学习平台
        </el-button>
        <user-menu />
      </div>
    </header>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>
```

#### 3. 状态共享

使用 Pinia 共享用户状态和通知状态：

```typescript
// frontend/src/stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || '',
    currentSystem: 'learning' as 'learning' | 'edu'
  }),
  
  actions: {
    switchSystem(system: 'learning' | 'edu') {
      this.currentSystem = system;
      localStorage.setItem('currentSystem', system);
    }
  }
});

// frontend/src/stores/notifications.ts
export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    unreadCount: 0
  }),
  
  // 两个系统共享通知数据
  actions: {
    async fetchNotifications() {
      const { data } = await api.get('/api/notifications');
      this.notifications = data.notifications;
      this.unreadCount = data.notifications.filter(n => !n.is_read).length;
    }
  }
});
```

### 数据关联设计

#### 1. 学习路径 ↔ 作业关联

**数据库关联表**:
```sql
-- 学习路径步骤可以关联作业
ALTER TABLE learning_path_steps
  ADD COLUMN assignment_id INT NULL COMMENT '关联的作业ID',
  ADD FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;

-- 作业可以关联学习路径
ALTER TABLE assignments
  ADD COLUMN learning_path_id INT NULL COMMENT '所属学习路径ID',
  ADD FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE SET NULL;
```

**使用场景**:
- 教师创建学习路径时，可以在某个步骤中添加作业练习
- 学生学习到该步骤时，可以直接跳转到作业提交页面
- 完成作业后，自动更新学习路径进度

#### 2. 学习资源 ↔ 知识点关联

**数据库关联**:
```sql
-- 学习资源可以标记多个知识点
CREATE TABLE resource_knowledge_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resource_id INT NOT NULL,
  knowledge_point_id INT NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0 COMMENT '相关度评分',
  FOREIGN KEY (resource_id) REFERENCES learning_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
  UNIQUE KEY unique_resource_kp (resource_id, knowledge_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**使用场景**:
- 学生在作业中遇到薄弱知识点时，系统推荐相关学习资源
- 教师创建学习路径时，可以根据知识点筛选资源
- 学情分析时，可以看到学生在哪些知识点的资源学习情况

#### 3. 学习进度 ↔ 学情分析关联

**数据整合**:
```typescript
// backend/src/services/analytics.ts
export class AnalyticsService {
  // 综合学习数据分析
  async getComprehensiveAnalytics(studentId: number) {
    // 1. 获取学习路径进度
    const learningProgress = await getLearningProgress(studentId);
    
    // 2. 获取作业完成情况
    const assignmentStats = await getAssignmentStats(studentId);
    
    // 3. 获取资源学习情况
    const resourceViews = await getResourceViews(studentId);
    
    // 4. 获取薄弱知识点
    const weakPoints = await getWeakPoints(studentId);
    
    // 5. 综合分析
    return {
      learningProgress,
      assignmentStats,
      resourceViews,
      weakPoints,
      recommendations: this.generateRecommendations({
        learningProgress,
        assignmentStats,
        weakPoints
      })
    };
  }
}
```

**使用场景**:
- 教师查看学生学情时，可以看到学习路径进度和作业完成情况
- 家长监控孩子学习时，可以看到全面的学习数据
- AI 推荐系统根据综合数据推荐学习内容

#### 4. 统一通知系统

**通知类型扩展**:
```sql
-- 扩展通知类型
ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'assignment',      -- 作业通知
    'grading',         -- 批改通知
    'system',          -- 系统通知
    'message',         -- 消息通知
    'learning_path',   -- 学习路径通知
    'resource',        -- 资源通知
    'progress',        -- 进度提醒
    'recommendation'   -- 推荐通知
  ) NOT NULL;
```

**通知路由**:
```typescript
// 通知点击后根据类型跳转到对应系统
const handleNotificationClick = (notification: Notification) => {
  switch (notification.type) {
    case 'assignment':
    case 'grading':
      // 跳转到副界面
      router.push(`/edu/student/assignments/${notification.metadata.assignmentId}`);
      break;
    case 'learning_path':
    case 'resource':
    case 'progress':
      // 跳转到主界面
      router.push(`/learning/paths/${notification.metadata.pathId}`);
      break;
  }
};
```

---

## Components and Interfaces

### 1. 数据库组件

### 1. 数据库组件

#### 1.0 数据库架构说明

**MySQL数据库** - 存储结构化数据：
- 用户基础信息（users）
- 课程结构（courses, course_branches, course_lessons）
- 班级和购买记录（classes, course_purchases）
- 作业和成绩（assignments, submissions）
- 学习路径和资源（learning_paths, learning_resources）

**MongoDB数据库** - 存储行为数据和非结构化数据：
- 视频观看进度（video_progress）
- 用户行为日志（user_behaviors）
- 推荐结果缓存（recommendations）
- 社区内容（community_posts, community_comments）
- 学习路径思维导图数据（mindmap_data）

#### 1.1 MySQL - 课程表 (courses)

```sql
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  language_name VARCHAR(100) NOT NULL COMMENT '编程语言名称（如Python、JavaScript）',
  display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
  description TEXT COMMENT '课程描述',
  icon_url VARCHAR(255) COMMENT '语言图标URL',
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  price DECIMAL(10,2) DEFAULT 0.00 COMMENT '课程价格（0为免费）',
  is_hot BOOLEAN DEFAULT FALSE COMMENT '是否热门',
  hot_rank INT DEFAULT 0 COMMENT '热门排名',
  total_students INT DEFAULT 0 COMMENT '总学习人数',
  total_lessons INT DEFAULT 0 COMMENT '总课节数',
  avg_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分',
  rating_count INT DEFAULT 0 COMMENT '评价数量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_language (language_name),
  INDEX idx_hot (is_hot, hot_rank),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.2 MySQL - 课程分支表 (course_branches)

```sql
CREATE TABLE course_branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL COMMENT '所属课程ID',
  branch_name VARCHAR(100) NOT NULL COMMENT '分支名称（如Web开发、数据分析）',
  description TEXT COMMENT '分支描述',
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  estimated_hours INT COMMENT '预计学习时长（小时）',
  order_num INT DEFAULT 0 COMMENT '排序序号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_order (order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.3 MySQL - 课节表 (course_lessons)

```sql
CREATE TABLE course_lessons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL COMMENT '所属分支ID',
  lesson_number INT NOT NULL COMMENT '课节编号',
  title VARCHAR(255) NOT NULL COMMENT '课节标题',
  description TEXT COMMENT '课节描述',
  video_url VARCHAR(500) COMMENT '视频URL',
  video_duration INT COMMENT '视频时长（秒）',
  content TEXT COMMENT '课节内容（Markdown）',
  code_example TEXT COMMENT '代码示例',
  exercise_content TEXT COMMENT '练习题内容',
  is_free BOOLEAN DEFAULT FALSE COMMENT '是否免费试看',
  order_num INT DEFAULT 0 COMMENT '排序序号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES course_branches(id) ON DELETE CASCADE,
  INDEX idx_branch (branch_id),
  INDEX idx_order (order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.4 MySQL - 课程购买表 (course_purchases)

```sql
CREATE TABLE course_purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '学生ID',
  course_id INT NOT NULL COMMENT '课程ID',
  branch_id INT COMMENT '分支ID（如果购买单个分支）',
  price DECIMAL(10,2) NOT NULL COMMENT '购买价格',
  payment_method ENUM('alipay', 'wechat', 'balance', 'free') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  assigned_class_id INT COMMENT '分配的班级ID',
  purchase_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_class_id) REFERENCES classes(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_course (user_id, course_id),
  INDEX idx_user (user_id),
  INDEX idx_course (course_id),
  INDEX idx_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.5 MySQL - 课程班级表 (course_classes)

```sql
CREATE TABLE course_classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL COMMENT '课程ID',
  branch_id INT NOT NULL COMMENT '分支ID',
  class_number INT NOT NULL COMMENT '班级编号（1-6）',
  class_name VARCHAR(100) NOT NULL COMMENT '班级名称',
  teacher_id INT NOT NULL COMMENT '教师ID',
  student_count INT DEFAULT 0 COMMENT '学生人数',
  max_students INT DEFAULT 100 COMMENT '最大学生数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES course_branches(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_branch_class (branch_id, class_number),
  INDEX idx_course (course_id),
  INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.6 MySQL - 课程评价表 (course_reviews)

```sql
CREATE TABLE course_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '评价用户ID',
  course_id INT NOT NULL COMMENT '课程ID',
  rating INT NOT NULL COMMENT '评分（1-5）',
  content TEXT COMMENT '评价内容',
  tags JSON COMMENT '标签数组',
  helpful_count INT DEFAULT 0 COMMENT '有帮助数',
  teacher_reply TEXT COMMENT '教师回复',
  is_anonymous BOOLEAN DEFAULT FALSE COMMENT '是否匿名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_course (course_id),
  INDEX idx_rating (rating),
  INDEX idx_helpful (helpful_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.7 MySQL - 会员表 (memberships)

```sql
CREATE TABLE memberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  membership_type ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
  start_date TIMESTAMP NOT NULL COMMENT '开始时间',
  end_date TIMESTAMP NOT NULL COMMENT '结束时间',
  price DECIMAL(10,2) NOT NULL COMMENT '购买价格',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否有效',
  auto_renew BOOLEAN DEFAULT FALSE COMMENT '是否自动续费',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_active (is_active),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.8 MySQL - 积分表 (user_points)

```sql
CREATE TABLE user_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  total_points INT DEFAULT 0 COMMENT '总积分',
  available_points INT DEFAULT 0 COMMENT '可用积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE point_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  points INT NOT NULL COMMENT '积分变动（正数为增加，负数为减少）',
  type ENUM('earn', 'spend') NOT NULL,
  reason VARCHAR(255) NOT NULL COMMENT '原因',
  reference_id INT COMMENT '关联ID（如课程ID、帖子ID）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.9 MongoDB - 视频进度集合 (video_progress)

```javascript
// MongoDB Collection: video_progress
{
  _id: ObjectId,
  user_id: Number,              // MySQL用户ID
  lesson_id: Number,            // MySQL课节ID
  video_url: String,            // 视频URL
  current_position: Number,     // 当前播放位置（秒）
  duration: Number,             // 视频总时长（秒）
  progress_percentage: Number,  // 进度百分比
  watch_count: Number,          // 观看次数
  total_watch_time: Number,     // 总观看时长（秒）
  playback_speed: Number,       // 播放速度
  pause_positions: [            // 暂停位置数组
    {
      position: Number,
      pause_duration: Number,   // 暂停时长（秒）
      timestamp: Date
    }
  ],
  heat_map: [                   // 热力图数据（哪些部分被重复观看）
    {
      start: Number,
      end: Number,
      count: Number
    }
  ],
  is_completed: Boolean,        // 是否完成
  completed_at: Date,           // 完成时间
  last_watched_at: Date,        // 最后观看时间
  created_at: Date,
  updated_at: Date
}

// 索引
db.video_progress.createIndex({ user_id: 1, lesson_id: 1 }, { unique: true });
db.video_progress.createIndex({ user_id: 1, last_watched_at: -1 });
db.video_progress.createIndex({ lesson_id: 1 });
```

#### 1.10 MongoDB - 用户行为集合 (user_behaviors)

```javascript
// MongoDB Collection: user_behaviors
{
  _id: ObjectId,
  user_id: Number,              // MySQL用户ID
  behavior_type: String,        // 行为类型：view, click, search, purchase, complete
  target_type: String,          // 目标类型：course, lesson, resource, post
  target_id: Number,            // 目标ID
  metadata: {                   // 元数据
    course_id: Number,
    branch_id: Number,
    tags: [String],
    duration: Number,           // 停留时长
    source: String              // 来源（推荐、搜索、热门等）
  },
  timestamp: Date,
  session_id: String,           // 会话ID
  ip_address: String,
  user_agent: String
}

// 索引
db.user_behaviors.createIndex({ user_id: 1, timestamp: -1 });
db.user_behaviors.createIndex({ behavior_type: 1, timestamp: -1 });
db.user_behaviors.createIndex({ target_type: 1, target_id: 1 });
db.user_behaviors.createIndex({ timestamp: -1 });
```

#### 1.11 MongoDB - 推荐结果集合 (recommendations)

```javascript
// MongoDB Collection: recommendations
{
  _id: ObjectId,
  user_id: Number,              // MySQL用户ID
  recommendation_type: String,  // 推荐类型：course, learning_path, resource
  items: [                      // 推荐项目列表
    {
      item_id: Number,
      item_type: String,
      score: Number,            // 推荐分数
      reason: String,           // 推荐理由
      tags: [String]
    }
  ],
  algorithm: String,            // 使用的算法：collaborative_filtering, content_based, hybrid
  generated_at: Date,           // 生成时间
  expires_at: Date,             // 过期时间
  is_active: Boolean
}

// 索引
db.recommendations.createIndex({ user_id: 1, recommendation_type: 1, is_active: 1 });
db.recommendations.createIndex({ expires_at: 1 });
```

#### 1.12 MongoDB - 社区帖子集合 (community_posts)

```javascript
// MongoDB Collection: community_posts
{
  _id: ObjectId,
  user_id: Number,              // MySQL用户ID
  post_type: String,            // 帖子类型：forum, question, dynamic
  title: String,
  content: String,              // 富文本内容
  code_blocks: [                // 代码块
    {
      language: String,
      code: String
    }
  ],
  images: [String],             // 图片URL数组
  tags: [String],               // 标签
  related_course_id: Number,    // 关联课程ID
  related_knowledge_point_id: Number, // 关联知识点ID
  view_count: Number,
  like_count: Number,
  comment_count: Number,
  is_pinned: Boolean,           // 是否置顶
  is_featured: Boolean,         // 是否精华
  status: String,               // 状态：published, hidden, deleted
  created_at: Date,
  updated_at: Date
}

// 索引
db.community_posts.createIndex({ user_id: 1, created_at: -1 });
db.community_posts.createIndex({ post_type: 1, created_at: -1 });
db.community_posts.createIndex({ tags: 1 });
db.community_posts.createIndex({ related_course_id: 1 });
```

#### 1.13 MongoDB - 思维导图数据集合 (mindmap_data)

```javascript
// MongoDB Collection: mindmap_data
{
  _id: ObjectId,
  learning_path_id: Number,     // MySQL学习路径ID
  user_id: Number,              // MySQL用户ID（个人定制）
  nodes: [                      // 节点数组
    {
      id: String,
      label: String,
      type: String,             // 节点类型：root, branch, leaf
      step_id: Number,          // 关联步骤ID
      status: String,           // 状态：locked, current, completed
      position: {
        x: Number,
        y: Number
      },
      style: {
        color: String,
        icon: String
      }
    }
  ],
  edges: [                      // 边数组
    {
      source: String,
      target: String,
      type: String              // 边类型：required, optional, prerequisite
    }
  ],
  layout: String,               // 布局类型：tree, radial, force
  created_at: Date,
  updated_at: Date
}

// 索引
db.mindmap_data.createIndex({ learning_path_id: 1, user_id: 1 }, { unique: true });
db.mindmap_data.createIndex({ user_id: 1 });
```

#### 1.14 MySQL - 用户兴趣表 (user_interests)

```sql
CREATE TABLE user_interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  learning_goal ENUM('employment', 'hobby', 'exam', 'project') COMMENT '学习目标',
  interested_languages JSON COMMENT '感兴趣的编程语言数组',
  interested_directions JSON COMMENT '感兴趣的技术方向数组',
  skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
  weekly_hours ENUM('less_5', 'hours_5_10', 'hours_10_20', 'more_20') COMMENT '每周学习时间',
  learning_style JSON COMMENT '偏好的学习方式数组',
  survey_completed BOOLEAN DEFAULT FALSE COMMENT '是否完成问卷',
  survey_completed_at TIMESTAMP NULL COMMENT '问卷完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id),
  INDEX idx_survey_completed (survey_completed),
  INDEX idx_learning_goal (learning_goal),
  INDEX idx_skill_level (skill_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.15 MySQL - 知识点掌握度表 (knowledge_mastery)

```sql
CREATE TABLE knowledge_mastery (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  knowledge_point_id INT NOT NULL COMMENT '知识点ID',
  mastery_level ENUM('mastered', 'consolidating', 'weak') DEFAULT 'weak' COMMENT '掌握等级',
  practice_correct_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '练习正确率',
  code_error_count INT DEFAULT 0 COMMENT '代码错误次数',
  video_rewatch_count INT DEFAULT 0 COMMENT '视频回看次数',
  lesson_completion_time INT DEFAULT 0 COMMENT '课节完成时长（秒）',
  comprehensive_score DECIMAL(5,2) DEFAULT 0.00 COMMENT '综合得分',
  last_evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后评估时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_kp (user_id, knowledge_point_id),
  INDEX idx_user (user_id),
  INDEX idx_mastery_level (mastery_level),
  INDEX idx_score (comprehensive_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.16 MySQL - 虚拟学习伙伴表 (virtual_partners)

```sql
CREATE TABLE virtual_partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  partner_name VARCHAR(100) NOT NULL COMMENT '伙伴姓名',
  partner_avatar VARCHAR(255) COMMENT '伙伴头像URL',
  partner_signature VARCHAR(255) COMMENT '个性签名',
  learning_ability_tag ENUM('efficient', 'steady', 'basic') COMMENT '学习能力标签',
  partner_level INT DEFAULT 1 COMMENT '伙伴等级',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  interaction_frequency ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '互动频率',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.17 MySQL - 共同任务表 (collaborative_tasks)

```sql
CREATE TABLE collaborative_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  partner_id INT NOT NULL COMMENT '伙伴ID',
  task_type ENUM('practice', 'video', 'lesson', 'project') NOT NULL COMMENT '任务类型',
  task_description VARCHAR(500) NOT NULL COMMENT '任务描述',
  target_count INT DEFAULT 1 COMMENT '目标数量',
  user_progress INT DEFAULT 0 COMMENT '用户进度',
  partner_progress INT DEFAULT 0 COMMENT '伙伴进度（模拟）',
  reward_points INT DEFAULT 0 COMMENT '奖励积分',
  reward_badge VARCHAR(100) COMMENT '奖励徽章',
  status ENUM('pending', 'in_progress', 'completed', 'expired') DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES virtual_partners(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.18 MySQL - 视频答题题库表 (video_quiz_questions)

```sql
CREATE TABLE video_quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lesson_id INT NOT NULL COMMENT '课节ID',
  video_url VARCHAR(500) NOT NULL COMMENT '视频URL',
  trigger_time_range_start INT NOT NULL COMMENT '触发时间范围开始（秒）',
  trigger_time_range_end INT NOT NULL COMMENT '触发时间范围结束（秒）',
  question_type ENUM('single_choice', 'multiple_choice', 'fill_blank') NOT NULL COMMENT '题目类型',
  question_content TEXT NOT NULL COMMENT '题目内容',
  options JSON COMMENT '选项（选择题）',
  correct_answer VARCHAR(500) NOT NULL COMMENT '正确答案',
  explanation TEXT COMMENT '答案解析',
  knowledge_point_ids JSON COMMENT '关联知识点ID数组',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  reward_points INT DEFAULT 5 COMMENT '答对奖励积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
  INDEX idx_lesson (lesson_id),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.19 MySQL - 错题本表 (wrong_question_book)

```sql
CREATE TABLE wrong_question_book (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  question_id INT NOT NULL COMMENT '题目ID',
  lesson_id INT NOT NULL COMMENT '课节ID',
  video_url VARCHAR(500) COMMENT '视频URL',
  question_content TEXT NOT NULL COMMENT '题目内容',
  user_answer VARCHAR(500) NOT NULL COMMENT '用户答案',
  correct_answer VARCHAR(500) NOT NULL COMMENT '正确答案',
  explanation TEXT COMMENT '答案解析',
  knowledge_point_ids JSON COMMENT '关联知识点ID数组',
  answered_at TIMESTAMP NOT NULL COMMENT '答题时间',
  retry_count INT DEFAULT 0 COMMENT '重做次数',
  is_mastered BOOLEAN DEFAULT FALSE COMMENT '是否已掌握',
  mastered_at TIMESTAMP NULL COMMENT '掌握时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES video_quiz_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_mastered (is_mastered),
  INDEX idx_answered_at (answered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.20 MySQL - 视频答题记录表 (video_quiz_records)

```sql
CREATE TABLE video_quiz_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  lesson_id INT NOT NULL COMMENT '课节ID',
  question_id INT NOT NULL COMMENT '题目ID',
  video_position INT NOT NULL COMMENT '视频触发位置（秒）',
  user_answer VARCHAR(500) COMMENT '用户答案',
  is_correct BOOLEAN NOT NULL COMMENT '是否正确',
  answer_time INT COMMENT '答题用时（秒）',
  is_timeout BOOLEAN DEFAULT FALSE COMMENT '是否超时',
  points_earned INT DEFAULT 0 COMMENT '获得积分',
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES video_quiz_questions(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_correct (is_correct),
  INDEX idx_answered_at (answered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.21 MongoDB - AI学习路径动态调整集合 (ai_learning_path_dynamic)

```javascript
// MongoDB Collection: ai_learning_path_dynamic
{
  _id: ObjectId,
  user_id: Number,              // MySQL用户ID
  path_id: Number,              // MySQL学习路径ID
  adjust_time: Date,            // 调整时间
  adjust_reason: String,        // 调整原因（如"检测到装饰器掌握薄弱"）
  before_path: {                // 调整前路径
    current_step: Number,
    steps: [Number]             // 步骤ID数组
  },
  after_path: {                 // 调整后路径
    current_step: Number,
    steps: [Number],            // 步骤ID数组
    skipped_steps: [Number],    // 跳过的步骤
    added_steps: [Number]       // 新增的补强步骤
  },
  knowledge_points_affected: [  // 受影响的知识点
    {
      kp_id: Number,
      kp_name: String,
      mastery_level: String,
      action: String            // 'skip' | 'reinforce'
    }
  ],
  ai_model_used: String,        // 使用的AI模型
  evaluation_metrics: {         // 评估指标
    practice_correct_rate: Number,
    code_error_count: Number,
    video_rewatch_count: Number,
    completion_time: Number,
    comprehensive_score: Number
  }
}

// 索引
db.ai_learning_path_dynamic.createIndex({ user_id: 1, adjust_time: -1 });
db.ai_learning_path_dynamic.createIndex({ path_id: 1 });
db.ai_learning_path_dynamic.createIndex({ adjust_time: -1 });
```

#### 1.19 MongoDB - 虚拟学习伙伴互动集合 (virtual_learning_partner)

```javascript
// MongoDB Collection: virtual_learning_partner
{
  _id: ObjectId,
  partner_id: Number,           // MySQL虚拟伙伴ID
  user_id: Number,              // MySQL用户ID
  partner_persona: {            // 伙伴人设
    name: String,
    avatar: String,
    signature: String,
    ability_tag: String
  },
  match_criteria: {             // 匹配条件
    learning_path_id: Number,
    progress_difference: Number, // 进度差距百分比
    ability_match: Boolean,
    interest_overlap: Number    // 兴趣重合度百分比
  },
  level: Number,                // 伙伴等级
  task_history: [               // 任务历史
    {
      task_id: Number,
      task_type: String,
      completed: Boolean,
      completed_at: Date,
      points_earned: Number
    }
  ],
  interaction_log: [            // 互动日志
    {
      interaction_type: String, // 'encouragement' | 'study_tip' | 'task_reminder' | 'answer'
      message: String,
      timestamp: Date,
      user_response: String     // 用户回复（如有）
    }
  ],
  statistics: {                 // 统计数据
    total_tasks_completed: Number,
    total_interactions: Number,
    collaboration_days: Number,
    last_interaction_at: Date
  }
}

// 索引
db.virtual_learning_partner.createIndex({ user_id: 1 });
db.virtual_learning_partner.createIndex({ partner_id: 1 });
db.virtual_learning_partner.createIndex({ "statistics.last_interaction_at": -1 });
```

#### 1.20 数据库同步策略

**用户ID同步**:
```typescript
// 当MySQL创建新用户时，同步到MongoDB
async function syncUserToMongoDB(mysqlUserId: number) {
  await mongoClient.db('learning_platform').collection('user_behaviors').insertOne({
    user_id: mysqlUserId,
    behavior_type: 'register',
    timestamp: new Date()
  });
}

// 定期同步统计数据
async function syncStatistics() {
  // 从MongoDB聚合用户行为数据
  const behaviors = await mongoClient.db('learning_platform')
    .collection('user_behaviors')
    .aggregate([
      { $match: { behavior_type: 'complete' } },
      { $group: { _id: '$target_id', count: { $sum: 1 } } }
    ]).toArray();
  
  // 更新MySQL课程统计
  for (const behavior of behaviors) {
    await executeQuery(
      'UPDATE courses SET total_students = ? WHERE id = ?',
      [behavior.count, behavior._id]
    );
  }
}
```

#### 1.1 学习路径表 (learning_paths)

```sql
CREATE TABLE learning_paths (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '创建者ID（教师）',
  title VARCHAR(255) NOT NULL COMMENT '学习路径标题',
  description TEXT COMMENT '学习路径描述',
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  estimated_hours INT COMMENT '预计学习时长（小时）',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  enrollment_count INT DEFAULT 0 COMMENT '选择人数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_difficulty (difficulty),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.2 学习路径步骤表 (learning_path_steps)

```sql
CREATE TABLE learning_path_steps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  learning_path_id INT NOT NULL,
  step_number INT NOT NULL COMMENT '步骤编号',
  title VARCHAR(255) NOT NULL COMMENT '步骤标题',
  content TEXT COMMENT '步骤内容',
  resource_type ENUM('article', 'video', 'exercise', 'quiz', 'document') NOT NULL,
  resource_id INT COMMENT '关联资源ID',
  resource_url VARCHAR(500) COMMENT '外部资源URL',
  estimated_minutes INT COMMENT '预计完成时间（分钟）',
  is_required BOOLEAN DEFAULT TRUE COMMENT '是否必须完成',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
  INDEX idx_learning_path (learning_path_id),
  INDEX idx_step_number (step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.3 学习资源表 (learning_resources)

```sql
CREATE TABLE learning_resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '资源标题',
  description TEXT COMMENT '资源描述',
  type ENUM('article', 'video', 'document', 'link', 'course') NOT NULL,
  url VARCHAR(500) COMMENT '资源URL',
  content TEXT COMMENT '资源内容（文章类型）',
  category VARCHAR(100) COMMENT '分类',
  tags JSON COMMENT '标签数组',
  author_id INT NOT NULL COMMENT '作者ID',
  is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  favorite_count INT DEFAULT 0 COMMENT '收藏数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author (author_id),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_is_public (is_public),
  FULLTEXT INDEX ft_title_desc (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.4 资源收藏表 (resource_favorites)

```sql
CREATE TABLE resource_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES learning_resources(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_resource (user_id, resource_id),
  INDEX idx_user (user_id),
  INDEX idx_resource (resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.5 学习进度表 (learning_progress)

```sql
CREATE TABLE learning_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '学生ID',
  learning_path_id INT NOT NULL,
  current_step INT DEFAULT 1 COMMENT '当前步骤',
  completed_steps JSON COMMENT '已完成步骤数组',
  progress_percentage INT DEFAULT 0 COMMENT '完成百分比',
  total_time_spent INT DEFAULT 0 COMMENT '总学习时间（分钟）',
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  status ENUM('in_progress', 'completed', 'paused') DEFAULT 'in_progress',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_path (user_id, learning_path_id),
  INDEX idx_user (user_id),
  INDEX idx_path (learning_path_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 1.6 增强通知表 (扩展现有 notifications 表)

```sql
-- 扩展现有通知表
ALTER TABLE notifications 
  ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' 
    AFTER type COMMENT '优先级',
  ADD COLUMN action_url VARCHAR(500) 
    AFTER content COMMENT '操作链接',
  ADD COLUMN expires_at TIMESTAMP NULL 
    AFTER action_url COMMENT '过期时间',
  ADD COLUMN metadata JSON 
    AFTER expires_at COMMENT '元数据',
  ADD INDEX idx_priority (priority),
  ADD INDEX idx_expires (expires_at);
```

### 2. 后端API接口

#### 2.1 学习路径API

**基础路径**: `/api/learning-paths`

```typescript
// 学习路径接口定义
interface LearningPath {
  id: number;
  user_id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  view_count: number;
  enrollment_count: number;
  created_at: Date;
  updated_at: Date;
}

interface LearningPathStep {
  id: number;
  learning_path_id: number;
  step_number: number;
  title: string;
  content: string;
  resource_type: 'article' | 'video' | 'exercise' | 'quiz' | 'document';
  resource_id?: number;
  resource_url?: string;
  estimated_minutes: number;
  is_required: boolean;
}

// API端点
GET    /api/learning-paths              // 获取学习路径列表
POST   /api/learning-paths              // 创建学习路径（教师）
GET    /api/learning-paths/:id          // 获取学习路径详情
PUT    /api/learning-paths/:id          // 更新学习路径（教师）
DELETE /api/learning-paths/:id          // 删除学习路径（教师）
POST   /api/learning-paths/:id/publish  // 发布学习路径（教师）
POST   /api/learning-paths/:id/enroll   // 选择学习路径（学生）
GET    /api/learning-paths/:id/progress // 获取学习进度
PUT    /api/learning-paths/:id/progress // 更新学习进度
```

#### 2.2 学习资源API

**基础路径**: `/api/learning-resources`

```typescript
// 学习资源接口定义
interface LearningResource {
  id: number;
  title: string;
  description: string;
  type: 'article' | 'video' | 'document' | 'link' | 'course';
  url?: string;
  content?: string;
  category: string;
  tags: string[];
  author_id: number;
  is_public: boolean;
  view_count: number;
  like_count: number;
  favorite_count: number;
  created_at: Date;
  updated_at: Date;
}

// API端点
GET    /api/learning-resources              // 获取资源列表
POST   /api/learning-resources              // 创建资源
GET    /api/learning-resources/:id          // 获取资源详情
PUT    /api/learning-resources/:id          // 更新资源
DELETE /api/learning-resources/:id          // 删除资源
POST   /api/learning-resources/:id/like     // 点赞资源
POST   /api/learning-resources/:id/favorite // 收藏资源
DELETE /api/learning-resources/:id/favorite // 取消收藏
GET    /api/learning-resources/favorites    // 获取收藏列表
GET    /api/learning-resources/search       // 搜索资源
```

#### 2.3 增强通知API

**基础路径**: `/api/notifications`

```typescript
// 增强通知接口定义
interface Notification {
  id: number;
  user_id: number;
  type: 'assignment' | 'grading' | 'system' | 'message' | 'learning_path' | 'resource';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  content: string;
  action_url?: string;
  expires_at?: Date;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: Date;
}

// API端点（扩展现有）
GET    /api/notifications                   // 获取通知列表（支持优先级筛选）
POST   /api/notifications                   // 创建通知
PUT    /api/notifications/:id/read          // 标记已读
PUT    /api/notifications/mark-all-read     // 批量标记已读
DELETE /api/notifications/:id               // 删除通知
DELETE /api/notifications/expired           // 清理过期通知
```

#### 2.4 用户兴趣调查API

**基础路径**: `/api/user-interests`

```typescript
// 用户兴趣接口定义
interface UserInterest {
  id: number;
  user_id: number;
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project';
  interested_languages: string[];  // ['Python', 'JavaScript', 'Java', ...]
  interested_directions: string[]; // ['frontend', 'backend', 'ai', ...]
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20';
  learning_style: string[];        // ['video', 'document', 'project', 'interactive']
  survey_completed: boolean;
  survey_completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 问卷提交请求
interface SurveySubmitRequest {
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project';
  interested_languages: string[];
  interested_directions: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20';
  learning_style: string[];
}

// API端点
GET    /api/user-interests              // 获取当前用户兴趣信息
POST   /api/user-interests              // 提交用户兴趣问卷
PUT    /api/user-interests              // 更新用户兴趣信息
GET    /api/user-interests/status       // 检查问卷完成状态
GET    /api/user-interests/recommendations // 基于兴趣获取推荐
```

#### 2.5 AI动态学习路径API

**基础路径**: `/api/ai-learning-path`

```typescript
// 知识点掌握度接口定义
interface KnowledgeMastery {
  id: number;
  user_id: number;
  knowledge_point_id: number;
  mastery_level: 'mastered' | 'consolidating' | 'weak';
  practice_correct_rate: number;
  code_error_count: number;
  video_rewatch_count: number;
  lesson_completion_time: number;
  comprehensive_score: number;
  last_evaluated_at: Date;
}

// 路径调整记录接口定义
interface PathAdjustmentRecord {
  user_id: number;
  path_id: number;
  adjust_time: Date;
  adjust_reason: string;
  before_path: {
    current_step: number;
    steps: number[];
  };
  after_path: {
    current_step: number;
    steps: number[];
    skipped_steps: number[];
    added_steps: number[];
  };
  knowledge_points_affected: Array<{
    kp_id: number;
    kp_name: string;
    mastery_level: string;
    action: 'skip' | 'reinforce';
  }>;
}

// 学习数据采集请求
interface LearningDataCollectionRequest {
  user_id: number;
  lesson_id: number;
  data_type: 'video' | 'practice' | 'completion';
  video_data?: {
    pause_positions: number[];
    rewatch_count: number;
    fast_forward_rate: number;
  };
  practice_data?: {
    error_type: 'syntax' | 'logic' | 'performance';
    knowledge_point_ids: number[];
    correct_rate: number;
  };
  completion_data?: {
    completion_time: number;
    resource_views: number;
  };
}

// API端点
POST   /api/ai-learning-path/collect-data        // 采集学习数据
POST   /api/ai-learning-path/evaluate            // 触发AI评估
GET    /api/ai-learning-path/mastery/:userId     // 获取知识点掌握度
GET    /api/ai-learning-path/adjusted/:pathId    // 获取调整后的学习路径
GET    /api/ai-learning-path/adjustment-log      // 获取路径调整日志
PUT    /api/ai-learning-path/toggle-dynamic      // 开启/关闭动态调整
GET    /api/ai-learning-path/knowledge-portrait  // 获取知识掌握画像
POST   /api/ai-learning-path/manual-adjust       // 手动调整路径（教师）
```

#### 2.6 虚拟学习伙伴API

**基础路径**: `/api/virtual-partner`

```typescript
// 虚拟伙伴接口定义
interface VirtualPartner {
  id: number;
  user_id: number;
  partner_name: string;
  partner_avatar: string;
  partner_signature: string;
  learning_ability_tag: 'efficient' | 'steady' | 'basic';
  partner_level: number;
  is_active: boolean;
  interaction_frequency: 'high' | 'medium' | 'low';
  created_at: Date;
  updated_at: Date;
}

// 共同任务接口定义
interface CollaborativeTask {
  id: number;
  user_id: number;
  partner_id: number;
  task_type: 'practice' | 'video' | 'lesson' | 'project';
  task_description: string;
  target_count: number;
  user_progress: number;
  partner_progress: number;
  reward_points: number;
  reward_badge?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  expires_at: Date;
  completed_at?: Date;
}

// 伙伴互动消息接口定义
interface PartnerInteraction {
  interaction_type: 'encouragement' | 'study_tip' | 'task_reminder' | 'answer' | 'congratulation';
  message: string;
  timestamp: Date;
  related_content?: {
    lesson_id?: number;
    task_id?: number;
    knowledge_point_id?: number;
  };
}

// 伙伴匹配请求
interface PartnerMatchRequest {
  user_id: number;
  learning_path_id: number;
  current_progress: number;
  ability_tag: 'efficient' | 'steady' | 'basic';
  interested_directions: string[];
}

// API端点
POST   /api/virtual-partner/generate             // 生成虚拟伙伴
GET    /api/virtual-partner/my-partner           // 获取我的伙伴信息
PUT    /api/virtual-partner/switch               // 切换伙伴
PUT    /api/virtual-partner/settings             // 更新伙伴设置
GET    /api/virtual-partner/tasks                // 获取共同任务列表
POST   /api/virtual-partner/tasks/:id/progress   // 更新任务进度
GET    /api/virtual-partner/interactions         // 获取互动历史
POST   /api/virtual-partner/send-message         // 发送消息给伙伴
GET    /api/virtual-partner/leaderboard          // 获取协作排行榜
GET    /api/virtual-partner/statistics           // 获取协作统计数据
PUT    /api/virtual-partner/toggle               // 开启/关闭虚拟伙伴
```

#### 2.7 视频答题与错题本API

**基础路径**: `/api/video-quiz`

```typescript
// 视频答题题目接口定义
interface VideoQuizQuestion {
  id: number;
  lesson_id: number;
  video_url: string;
  trigger_time_range_start: number;
  trigger_time_range_end: number;
  question_type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  question_content: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  knowledge_point_ids: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  reward_points: number;
}

// 错题本记录接口定义
interface WrongQuestionRecord {
  id: number;
  user_id: number;
  question_id: number;
  lesson_id: number;
  video_url: string;
  question_content: string;
  user_answer: string;
  correct_answer: string;
  explanation: string;
  knowledge_point_ids: number[];
  answered_at: Date;
  retry_count: number;
  is_mastered: boolean;
  mastered_at?: Date;
}

// 答题提交请求
interface QuizSubmitRequest {
  user_id: number;
  lesson_id: number;
  question_id: number;
  video_position: number;
  user_answer: string;
  answer_time: number;
  is_timeout: boolean;
}

// 错题统计接口定义
interface WrongQuestionStatistics {
  total_questions: number;
  correct_rate: number;
  wrong_count: number;
  weak_knowledge_points: Array<{
    kp_id: number;
    kp_name: string;
    wrong_count: number;
  }>;
  recent_wrong_questions: WrongQuestionRecord[];
}

// API端点
GET    /api/video-quiz/trigger/:lessonId         // 获取视频答题触发信息
GET    /api/video-quiz/question/:questionId      // 获取题目详情
POST   /api/video-quiz/submit                    // 提交答案
GET    /api/video-quiz/records                   // 获取答题记录
GET    /api/video-quiz/wrong-book                // 获取错题本列表
GET    /api/video-quiz/wrong-book/:id            // 获取错题详情
POST   /api/video-quiz/retry/:id                 // 重做错题
PUT    /api/video-quiz/mark-mastered/:id         // 标记已掌握
GET    /api/video-quiz/statistics                // 获取答题统计
GET    /api/video-quiz/weak-points               // 获取薄弱知识点
GET    /api/video-quiz/teacher/wrong-book        // 教师查看学生错题本
GET    /api/video-quiz/parent/wrong-book         // 家长查看孩子错题本
POST   /api/video-quiz/admin/create-question     // 管理员创建题目
PUT    /api/video-quiz/admin/update-question/:id // 管理员更新题目
DELETE /api/video-quiz/admin/delete-question/:id // 管理员删除题目
```

### 3. 前端组件

#### 3.1 学习路径组件

```
frontend/src/views/student/
├── LearningPaths.vue           # 学习路径列表页
├── LearningPathDetail.vue      # 学习路径详情页
├── LearningPathProgress.vue    # 学习进度页
└── LearningPathStep.vue        # 学习步骤页

frontend/src/views/teacher/
├── CreateLearningPath.vue      # 创建学习路径页
├── ManageLearningPaths.vue     # 管理学习路径页
└── LearningPathStats.vue       # 学习路径统计页

frontend/src/components/learning/
├── PathCard.vue                # 学习路径卡片
├── StepList.vue                # 步骤列表
├── ProgressBar.vue             # 进度条
└── PathFilter.vue              # 筛选器
```

#### 3.2 学习资源组件

```
frontend/src/views/student/
├── Resources.vue               # 资源列表页
├── ResourceDetail.vue          # 资源详情页
└── MyFavorites.vue             # 我的收藏页

frontend/src/views/teacher/
├── CreateResource.vue          # 创建资源页
└── ManageResources.vue         # 管理资源页

frontend/src/components/resource/
├── ResourceCard.vue            # 资源卡片
├── ResourceFilter.vue          # 资源筛选器
├── ResourceSearch.vue          # 资源搜索
└── ResourcePreview.vue         # 资源预览
```

#### 3.3 用户兴趣调查组件

```
frontend/src/components/survey/
├── InterestSurveyModal.vue     # 兴趣调查弹窗（强制）
├── SurveyStep1.vue             # 问卷步骤1：学习目标
├── SurveyStep2.vue             # 问卷步骤2：编程语言
├── SurveyStep3.vue             # 问卷步骤3：技术方向
├── SurveyStep4.vue             # 问卷步骤4：技能水平
├── SurveyStep5.vue             # 问卷步骤5：学习时间
├── SurveyStep6.vue             # 问卷步骤6：学习方式
└── SurveyProgress.vue          # 问卷进度条

frontend/src/views/user/
└── InterestSettings.vue        # 个人中心-兴趣设置页
```

#### 3.4 AI动态学习路径组件

```
frontend/src/components/ai-path/
├── DynamicPathAdjustment.vue   # 路径动态调整说明面板
├── KnowledgeMasteryChart.vue   # 知识掌握度图表
├── PathAdjustmentLog.vue       # 路径调整日志列表
├── LessonPriorityBadge.vue     # 课节优先级标记（红/黑/灰）
└── DynamicToggleSwitch.vue     # 动态调整开关

frontend/src/views/student/
├── KnowledgePortrait.vue       # 知识掌握画像页
├── AdjustmentHistory.vue       # 调整历史页
└── ReinforcementLessons.vue    # 补强课节页

frontend/src/views/teacher/
└── StudentMasteryDashboard.vue # 学生掌握度仪表盘
```

#### 3.5 虚拟学习伙伴组件

```
frontend/src/components/partner/
├── PartnerCard.vue             # 伙伴信息卡片
├── PartnerChatPanel.vue        # 伙伴聊天面板
├── CollaborativeTaskCard.vue   # 共同任务卡片
├── ProgressComparison.vue      # 进度对比组件
├── CollaborationLeaderboard.vue # 协作排行榜
├── PartnerSettings.vue         # 伙伴设置面板
└── PartnerInteractionLog.vue   # 互动历史记录

frontend/src/views/student/
├── MyPartner.vue               # 我的学习伙伴页
├── CollaborativeTasks.vue      # 共同任务页
└── PartnerStatistics.vue       # 协作统计页
```

#### 3.6 视频答题与错题本组件

```
frontend/src/components/video-quiz/
├── VideoQuizModal.vue          # 视频答题弹窗
├── QuizQuestion.vue            # 题目显示组件
├── QuizTimer.vue               # 答题倒计时
├── QuizResult.vue              # 答题结果显示
└── QuizExplanation.vue         # 答案解析组件

frontend/src/components/wrong-book/
├── WrongQuestionCard.vue       # 错题卡片
├── WrongQuestionDetail.vue     # 错题详情
├── WrongQuestionFilter.vue     # 错题筛选器
├── WeakPointsChart.vue         # 薄弱知识点图表
└── WrongQuestionStatistics.vue # 错题统计面板

frontend/src/views/student/
├── WrongQuestionBook.vue       # 我的错题本页
├── RetryWrongQuestion.vue      # 重做错题页
└── QuizStatistics.vue          # 答题统计页

frontend/src/views/teacher/
└── StudentWrongBookDashboard.vue # 学生错题本仪表盘

frontend/src/views/parent/
└── ChildWrongBookMonitor.vue   # 孩子错题本监控页
```

**VideoQuizModal.vue 组件设计**:
```vue
<template>
  <el-dialog
    v-model="visible"
    title="视频答题"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    width="600px"
    class="video-quiz-modal"
  >
    <div class="quiz-container">
      <!-- 倒计时 -->
      <quiz-timer 
        :duration="60" 
        @timeout="handleTimeout"
        ref="timerRef"
      />
      
      <!-- 题目内容 -->
      <quiz-question 
        :question="currentQuestion"
        v-model="userAnswer"
      />
      
      <!-- 提交按钮 -->
      <div class="quiz-footer">
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :disabled="!userAnswer"
          :loading="submitting"
        >
          提交答案
        </el-button>
      </div>
    </div>
    
    <!-- 答题结果 -->
    <quiz-result 
      v-if="showResult"
      :is-correct="isCorrect"
      :correct-answer="currentQuestion.correct_answer"
      :explanation="currentQuestion.explanation"
      :points-earned="pointsEarned"
      @continue="handleContinue"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { submitQuizAnswer } from '@/api/video-quiz';
import QuizTimer from './QuizTimer.vue';
import QuizQuestion from './QuizQuestion.vue';
import QuizResult from './QuizResult.vue';

const props = defineProps<{
  lessonId: number;
  videoPosition: number;
  onContinue: () => void;
}>();

const visible = ref(false);
const currentQuestion = ref(null);
const userAnswer = ref('');
const submitting = ref(false);
const showResult = ref(false);
const isCorrect = ref(false);
const pointsEarned = ref(0);
const timerRef = ref(null);

const loadQuestion = async () => {
  try {
    const { data } = await getQuizQuestion(props.lessonId, props.videoPosition);
    currentQuestion.value = data;
    visible.value = true;
  } catch (error) {
    console.error('Failed to load quiz question:', error);
  }
};

const handleSubmit = async () => {
  try {
    submitting.value = true;
    const answerTime = 60 - timerRef.value.remainingTime;
    
    const { data } = await submitQuizAnswer({
      lesson_id: props.lessonId,
      question_id: currentQuestion.value.id,
      video_position: props.videoPosition,
      user_answer: userAnswer.value,
      answer_time: answerTime,
      is_timeout: false
    });
    
    isCorrect.value = data.is_correct;
    pointsEarned.value = data.points_earned;
    showResult.value = true;
    
    if (isCorrect.value) {
      ElMessage.success(`答对了！获得${pointsEarned.value}积分`);
    } else {
      ElMessage.warning('答错了，已添加到错题本');
    }
  } catch (error) {
    ElMessage.error('提交失败，请重试');
  } finally {
    submitting.value = false;
  }
};

const handleTimeout = async () => {
  // 超时自动提交
  await submitQuizAnswer({
    lesson_id: props.lessonId,
    question_id: currentQuestion.value.id,
    video_position: props.videoPosition,
    user_answer: userAnswer.value || '',
    answer_time: 60,
    is_timeout: true
  });
  
  ElMessage.warning('答题超时，已自动提交');
  isCorrect.value = false;
  showResult.value = true;
};

const handleContinue = () => {
  visible.value = false;
  showResult.value = false;
  props.onContinue();
};

onMounted(() => {
  loadQuestion();
});
</script>
```

---

## Data Models

### 1. 学习路径数据模型

```typescript
// backend/src/models/LearningPath.ts

export interface LearningPathModel {
  id: number;
  user_id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  view_count: number;
  enrollment_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface LearningPathStepModel {
  id: number;
  learning_path_id: number;
  step_number: number;
  title: string;
  content: string;
  resource_type: 'article' | 'video' | 'exercise' | 'quiz' | 'document';
  resource_id?: number;
  resource_url?: string;
  estimated_minutes: number;
  is_required: boolean;
  created_at: Date;
}

export interface LearningProgressModel {
  id: number;
  user_id: number;
  learning_path_id: number;
  current_step: number;
  completed_steps: number[];
  progress_percentage: number;
  total_time_spent: number;
  last_accessed_at: Date;
  started_at: Date;
  completed_at?: Date;
  status: 'in_progress' | 'completed' | 'paused';
}

// 创建学习路径请求
export interface CreateLearningPathRequest {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  is_public: boolean;
  steps: Array<{
    step_number: number;
    title: string;
    content: string;
    resource_type: 'article' | 'video' | 'exercise' | 'quiz' | 'document';
    resource_id?: number;
    resource_url?: string;
    estimated_minutes: number;
    is_required: boolean;
  }>;
}

// 更新学习进度请求
export interface UpdateProgressRequest {
  current_step: number;
  completed_steps: number[];
  time_spent: number; // 本次学习时长（分钟）
}
```

### 2. 学习资源数据模型

```typescript
// backend/src/models/LearningResource.ts

export interface LearningResourceModel {
  id: number;
  title: string;
  description: string;
  type: 'article' | 'video' | 'document' | 'link' | 'course';
  url?: string;
  content?: string;
  category: string;
  tags: string[];
  author_id: number;
  is_public: boolean;
  view_count: number;
  like_count: number;
  favorite_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ResourceFavoriteModel {
  id: number;
  user_id: number;
  resource_id: number;
  created_at: Date;
}

// 创建资源请求
export interface CreateResourceRequest {
  title: string;
  description: string;
  type: 'article' | 'video' | 'document' | 'link' | 'course';
  url?: string;
  content?: string;
  category: string;
  tags: string[];
  is_public: boolean;
}

// 资源搜索请求
export interface SearchResourceRequest {
  keyword?: string;
  type?: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
```

### 3. 增强通知数据模型

```typescript
// backend/src/models/Notification.ts (扩展)

export interface NotificationModel {
  id: number;
  user_id: number;
  type: 'assignment' | 'grading' | 'system' | 'message' | 'learning_path' | 'resource';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  content: string;
  action_url?: string;
  expires_at?: Date;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: Date;
}

// 创建通知请求
export interface CreateNotificationRequest {
  user_id: number;
  type: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  content: string;
  action_url?: string;
  expires_at?: Date;
  metadata?: Record<string, any>;
}
```

### 4. 用户兴趣数据模型

```typescript
// backend/src/models/UserInterest.ts

export interface UserInterestModel {
  id: number;
  user_id: number;
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project';
  interested_languages: string[];
  interested_directions: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20';
  learning_style: string[];
  survey_completed: boolean;
  survey_completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 问卷提交请求
export interface SurveySubmitRequest {
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project';
  interested_languages: string[];
  interested_directions: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20';
  learning_style: string[];
}

// 问卷状态响应
export interface SurveyStatusResponse {
  survey_completed: boolean;
  user_interests?: UserInterestModel;
}

// 基于兴趣的推荐响应
export interface InterestBasedRecommendation {
  courses: Array<{
    id: number;
    title: string;
    language: string;
    match_reason: string;
    match_score: number;
  }>;
  learning_paths: Array<{
    id: number;
    title: string;
    difficulty: string;
    match_reason: string;
  }>;
  resources: Array<{
    id: number;
    title: string;
    type: string;
    match_reason: string;
  }>;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundant Properties to Consolidate:**
1. Properties 3.4 (创建收藏记录) and 6.5 (添加到收藏列表) are the same - consolidate into one
2. Properties 3.5 (删除收藏记录) and 6.6 (从收藏列表移除) are the same - consolidate into one
3. Properties 3.6 (增加点赞计数) and 6.7 (增加点赞数) are the same - consolidate into one
4. Properties 3.7 (返回用户的所有收藏资源) and 6.8 (显示所有收藏的资源) are the same - consolidate into one
5. Properties 2.5 (级联删除) and 7.8 (清理相关数据) test the same cascade deletion behavior - consolidate
6. Properties 2.6 (创建学习进度记录) and 5.3 (创建进度记录) are the same - consolidate
7. Properties 2.7 (记录当前步骤和完成百分比) and 5.4 (更新进度) overlap significantly - consolidate
8. Properties 5.6 (保存当前进度) and 5.7 (从上次位置继续) can be combined into a single "progress persistence" property

**Properties to Keep Separate:**
- View count increment (3.3) is distinct from like count increment
- Role-based filtering (2.2) is distinct from type/category filtering (3.2, 6.3)
- Notification sorting (4.4) is distinct from notification filtering (4.5)

After consolidation, we have approximately 45 unique testable properties.

---

### Correctness Properties

Based on the prework analysis, here are the correctness properties for the learning platform integration:

#### Database Migration Properties

**Property 1: Data Integrity Preservation**
*For any* existing database record before migration, after executing the migration scripts, the record should remain unchanged with all fields intact.
**Validates: Requirements 1.7**

#### Learning Path Management Properties

**Property 2: Learning Path Creation Validation**
*For any* learning path creation request with all required fields (title, description, difficulty, estimated_hours), the system should successfully store the path in the database and return a valid path ID.
**Validates: Requirements 2.1**

**Property 3: Role-Based Path Filtering**
*For any* user with role 'teacher', querying learning paths should return only paths created by that teacher; for any user with role 'student', querying should return only published public paths or paths they are enrolled in.
**Validates: Requirements 2.2**

**Property 4: Complete Path Details**
*For any* learning path ID, querying the path details should return all associated steps in correct order (sorted by step_number) with complete resource information.
**Validates: Requirements 2.3**

**Property 5: Authorization for Updates**
*For any* learning path update request, the system should only allow updates if the requesting user is the path creator (user_id matches).
**Validates: Requirements 2.4**

**Property 6: Cascade Deletion**
*For any* learning path, when deleted, all associated steps (learning_path_steps) and progress records (learning_progress) should also be deleted from the database.
**Validates: Requirements 2.5, 7.8**

**Property 7: Enrollment Creates Progress**
*For any* student enrolling in a learning path, the system should create a new learning_progress record with initial values (current_step=1, progress_percentage=0, status='in_progress').
**Validates: Requirements 2.6, 5.3**

**Property 8: Progress Update Accuracy**
*For any* progress update with completed steps, the system should calculate progress_percentage as (completed_steps.length / total_steps * 100) and update total_time_spent by adding the new time_spent value.
**Validates: Requirements 2.7, 5.4**

**Property 9: Path Completion Detection**
*For any* learning path with N total steps, when a student completes all N steps, the system should set status='completed', progress_percentage=100, and record completed_at timestamp.
**Validates: Requirements 2.8, 5.8**

**Property 10: Progress Persistence**
*For any* student's learning progress, pausing and then resuming should restore the exact same current_step, completed_steps array, and total_time_spent values.
**Validates: Requirements 5.6, 5.7**

#### Learning Resource Properties

**Property 11: Resource Type Validation**
*For any* resource creation request, if the type is not one of ('article', 'video', 'document', 'link', 'course'), the system should reject the request with a validation error.
**Validates: Requirements 3.1**

**Property 12: Resource Filtering**
*For any* resource query with filters (type, category, tags), the returned resources should match all specified filter criteria.
**Validates: Requirements 3.2, 6.3**

**Property 13: View Count Increment**
*For any* resource, each time it is viewed (GET /api/learning-resources/:id), the view_count should increase by exactly 1.
**Validates: Requirements 3.3**

**Property 14: Favorite Creation and Removal**
*For any* user and resource, favoriting should create a unique record in resource_favorites; unfavoriting should delete that record; attempting to favorite twice should not create duplicate records.
**Validates: Requirements 3.4, 3.5, 6.5, 6.6**

**Property 15: Like Count Increment**
*For any* resource, each time it is liked, the like_count should increase by exactly 1.
**Validates: Requirements 3.6, 6.7**

**Property 16: User Favorites Query**
*For any* user, querying their favorites should return exactly the set of resources they have favorited (matching resource_favorites records).
**Validates: Requirements 3.7, 6.8**

**Property 17: Resource Search**
*For any* search query with keyword, the returned resources should have the keyword appearing in either title, description, or tags (case-insensitive match).
**Validates: Requirements 6.2**

**Property 18: Resource Recommendation Relevance**
*For any* user with learning interests, recommended resources should have at least one tag matching the user's interests or be in categories related to their recent learning history.
**Validates: Requirements 3.8**

#### Enhanced Notification Properties

**Property 19: Notification Priority Setting**
*For any* notification creation request with priority specified, the created notification should have exactly that priority value ('low', 'medium', 'high', or 'urgent').
**Validates: Requirements 4.1**

**Property 20: Notification Action URL**
*For any* notification creation request with action_url specified, the created notification should store that URL and return it in queries.
**Validates: Requirements 4.2**

**Property 21: Notification Expiration**
*For any* notification creation request with expires_at specified, the created notification should store that expiration timestamp.
**Validates: Requirements 4.3**

**Property 22: Notification Sorting**
*For any* notification query, results should be sorted first by priority (urgent > high > medium > low) and then by created_at (descending).
**Validates: Requirements 4.4**

**Property 23: Expired Notification Filtering**
*For any* notification query at time T, notifications with expires_at < T should not be included in the results.
**Validates: Requirements 4.5**

**Property 24: Mark as Read**
*For any* notification, marking it as read should set is_read=true; querying that notification afterward should return is_read=true.
**Validates: Requirements 4.6**

**Property 25: Batch Mark as Read**
*For any* set of notification IDs, batch marking as read should set is_read=true for all specified notifications.
**Validates: Requirements 4.7**

**Property 26: Expired Notification Cleanup**
*For any* cleanup operation at time T, all notifications with expires_at < T should be deleted from the database.
**Validates: Requirements 4.8**

#### Teacher Management Properties

**Property 27: Step Ordering**
*For any* learning path with steps, the steps should be stored and retrieved in order by step_number (1, 2, 3, ...).
**Validates: Requirements 7.2**

**Property 28: URL Validation**
*For any* resource URL in a learning path step, if the URL format is invalid (not starting with http:// or https://), the system should reject the request.
**Validates: Requirements 7.3**

**Property 29: Preview Consistency**
*For any* learning path, the preview view for teachers should return the same data structure and content as the student view.
**Validates: Requirements 7.4**

**Property 30: Publish Notification**
*For any* learning path being published, the system should create notifications for all students in the target class or all students if is_public=true.
**Validates: Requirements 7.5**

**Property 31: Path Statistics Accuracy**
*For any* learning path, the statistics should show enrollment_count equal to the number of learning_progress records and completion_count equal to records with status='completed'.
**Validates: Requirements 7.6**

**Property 32: Progress Preservation on Edit**
*For any* learning path being edited, existing learning_progress records should remain unchanged (not deleted or reset).
**Validates: Requirements 7.7**

#### Parent Monitoring Properties

**Property 33: Child Path Query**
*For any* parent user, querying child's learning paths should return only paths where the child has a learning_progress record.
**Validates: Requirements 8.2**

**Property 34: Child Progress Query**
*For any* parent user, querying child's progress should return accurate progress_percentage and total_time_spent for each enrolled path.
**Validates: Requirements 8.3**

**Property 35: Child Favorites Query**
*For any* parent user, querying child's favorites should return exactly the resources the child has favorited.
**Validates: Requirements 8.4**

**Property 36: Learning Activity History**
*For any* parent user, querying child's learning history should return activities sorted by timestamp (most recent first).
**Validates: Requirements 8.5**

**Property 37: Learning Reminder Creation**
*For any* parent setting a learning reminder, the system should create a scheduled notification with the specified time and target student.
**Validates: Requirements 8.6**

**Property 38: Learning Report Generation**
*For any* parent requesting a learning report for a time period, the report should include all learning activities, progress updates, and resource views within that period.
**Validates: Requirements 8.7**

**Property 39: Parent-Teacher Messaging**
*For any* message sent from parent to teacher, the system should create a notification for the teacher and store the message in the database.
**Validates: Requirements 8.8**

#### AI Service Integration Properties

**Property 40: Qwen3 Service Integration**
*For any* text input to Qwen3 embedding service, the system should return a valid embedding vector or handle errors gracefully without crashing.
**Validates: Requirements 10.1**

**Property 41: Baidu AI Service Integration**
*For any* learning behavior analysis request to Baidu AI, the system should return analysis results or handle errors gracefully.
**Validates: Requirements 10.2**

**Property 42: Xunfei AI Service Integration**
*For any* speech recognition request to Xunfei AI, the system should return transcribed text or handle errors gracefully.
**Validates: Requirements 10.3**

**Property 43: AI-Generated Path Validity**
*For any* AI-generated learning path, the path should have valid structure (title, description, steps with proper ordering) and match the user's specified interests.
**Validates: Requirements 10.4**

**Property 44: Learning Behavior Analysis**
*For any* student's learning behavior analysis, the system should identify at least one learning pattern or weak point if sufficient data exists (>5 activities).
**Validates: Requirements 10.5**

**Property 45: AI Recommendation Relevance**
*For any* AI-recommended resource, the resource should have content similarity score >0.5 with the user's learning history or match at least one user interest.
**Validates: Requirements 10.6**

**Property 46: AI Service Fallback**
*For any* AI service call that fails (timeout, error response), the system should fall back to rule-based algorithms and continue functioning without errors.
**Validates: Requirements 10.7**

**Property 47: AI Service Logging**
*For any* AI service call, the system should log the request, response time, and result status (success/failure) to system_logs table.
**Validates: Requirements 10.8**

#### User Interest Survey Properties

**Property 48: Survey Display on First Login**
*For any* user logging in for the first time (survey_completed=false), the system should display the interest survey modal and prevent closing until completion.
**Validates: Requirements 20.1, 20.2**

**Property 49: Survey Data Validation**
*For any* survey submission, the system should validate that all required fields are filled (learning_goal, interested_languages, interested_directions, skill_level, weekly_hours, learning_style) before accepting.
**Validates: Requirements 20.9**

**Property 50: Survey Completion Recording**
*For any* successful survey submission, the system should set survey_completed=true, record survey_completed_at timestamp, and create a user_interests record.
**Validates: Requirements 20.10**

**Property 51: Survey Modal Suppression**
*For any* user with survey_completed=true, the system should not display the survey modal on subsequent logins.
**Validates: Requirements 20.12**

**Property 52: Interest-Based Recommendations**
*For any* user with completed survey, the system should generate course recommendations matching at least one interested_language or interested_direction from their survey data.
**Validates: Requirements 20.14**

**Property 53: Interest-Based Learning Path**
*For any* user with completed survey, the system should generate learning path recommendations matching their skill_level and learning_goal.
**Validates: Requirements 20.15**

**Property 54: Survey Update Capability**
*For any* user requesting to update their interests, the system should allow modification of all survey fields and regenerate recommendations based on new data.
**Validates: Requirements 20.13**

**Property 55: Multi-Select Validation**
*For any* survey field accepting multiple selections (interested_languages, interested_directions, learning_style), the system should accept arrays with at least one item and store them as JSON.
**Validates: Requirements 20.4, 20.5, 20.8**

#### AI Dynamic Learning Path Properties

**Property 56: Learning Data Collection Latency**
*For any* learning activity (video pause, practice completion, lesson finish), the system should collect and store data to MongoDB within 5 seconds.
**Validates: Requirements 21.1, 21.2, 21.3, 21.4**

**Property 57: Knowledge Mastery Evaluation**
*For any* knowledge point evaluation, the system should calculate comprehensive_score using the formula: (practice_correct_rate × 0.4) + ((100 - code_error_count) × 0.3) + ((100 - video_rewatch_count × 10) × 0.2) + (lesson_completion_efficiency × 0.1), and map to mastery levels: ≥85 = mastered, 60-84 = consolidating, <60 = weak.
**Validates: Requirements 21.5, 21.6**

**Property 58: Error Pattern Recognition**
*For any* code error recorded, the system should associate it with at least one knowledge_point_id based on error type (syntax/logic/performance).
**Validates: Requirements 21.7**

**Property 59: Learning Ability Tagging**
*For any* user, the system should generate ability tag (efficient/steady/basic) based on: efficient if avg_completion_time < expected_time × 0.8 AND repeat_practice_count < 2; basic if avg_completion_time > expected_time × 1.5 OR repeat_practice_count > 5; otherwise steady.
**Validates: Requirements 21.8**

**Property 60: Path Adjustment for Mastered Content**
*For any* knowledge point with mastery_level='mastered', the system should hide corresponding lessons in the learning path and mark them as "已掌握" in the mind map.
**Validates: Requirements 21.9**

**Property 61: Weak Point Reinforcement**
*For any* knowledge point with mastery_level='weak', the system should add 1 micro-lesson (5-10 min) + 3-5 targeted practice questions + related Q&A cases to the learning path before the original next step.
**Validates: Requirements 21.10**

**Property 62: Ability-Based Path Adaptation**
*For any* user with ability_tag='efficient', the system should skip basic explanation lessons and add advanced project tasks; for ability_tag='basic', the system should reduce difficulty gradient and add step-by-step guidance.
**Validates: Requirements 21.11, 21.12**

**Property 63: Real-Time Path Evaluation**
*For any* completed learning task (practice/lesson/video), the system should trigger AI re-evaluation within 100ms.
**Validates: Requirements 21.13**

**Property 64: Path Update Response Time**
*For any* path adjustment triggered by AI evaluation, the frontend should display updated path within 300ms.
**Validates: Requirements 21.14**

**Property 65: Lesson Priority Visualization**
*For any* learning path display, lessons should be color-coded: red for recommended priority, black for normal, gray for mastered.
**Validates: Requirements 21.15**

**Property 66: Adjustment Explanation Display**
*For any* path adjustment, the system should display a human-readable explanation (e.g., "检测到你对装饰器掌握薄弱，已添加3道针对性练习").
**Validates: Requirements 21.16**

**Property 67: Knowledge Portrait Display**
*For any* user viewing personal center, the system should display current knowledge mastery portrait and path adjustment log with timestamps.
**Validates: Requirements 21.17**

**Property 68: Dynamic Adjustment Toggle**
*For any* user disabling dynamic adjustment, the system should restore default path, record user choice, and persist the setting across sessions.
**Validates: Requirements 21.18**

**Property 69: Path Synchronization**
*For any* path adjustment, the system should synchronize changes to learning_progress table, mind map display, and parent dashboard within 1 second with 100% data consistency.
**Validates: Requirements 21.19**

**Property 70: AI Evaluation Accuracy**
*For any* batch of 100 AI knowledge point evaluations, at least 80 should match teacher manual evaluation results (mastery level agreement).
**Validates: Requirements 21.20**

#### Virtual Learning Partner Properties

**Property 71: Partner Generation on Path Selection**
*For any* user selecting a learning path for the first time, the system should automatically generate 1 main partner + up to 2 backup partners.
**Validates: Requirements 22.1**

**Property 72: Partner Matching Criteria**
*For any* generated partner, the matching should satisfy: same learning_path_id, progress_difference ≤ 5%, same ability_tag, and interest_overlap ≥ 60%.
**Validates: Requirements 22.2, 22.17**

**Property 73: Partner Persona Generation**
*For any* new partner, the system should generate random name, avatar, signature that matches the ability_tag (e.g., efficient tag → signature contains "追求极致效率").
**Validates: Requirements 22.3, 22.4**

**Property 74: Daily Encouragement Timing**
*For any* active partner, the system should send encouragement messages during user's high-frequency learning time slots (detected from historical behavior).
**Validates: Requirements 22.5**

**Property 75: Context-Aware Study Tips**
*For any* partner-generated study tip, the message should be based on current lesson's knowledge points and generated by Qwen3 with ≥90% content relevance.
**Validates: Requirements 22.6, 22.18**

**Property 76: Daily Collaborative Task Generation**
*For any* active partner-user pair, the system should generate exactly 1 collaborative task per day (e.g., "complete 3 loop practice questions together").
**Validates: Requirements 22.7**

**Property 77: Task Completion Rewards**
*For any* completed collaborative task, both user and partner should receive base_points × 1.5 + 1 collaboration badge fragment.
**Validates: Requirements 22.8, 22.20**

**Property 78: Progress Comparison Display**
*For any* partner-user pair, the system should display real-time progress difference (e.g., "你的伙伴已经完成今天的任务啦，快跟上！").
**Validates: Requirements 22.9**

**Property 79: Weekly Collaboration Leaderboard**
*For any* week end, the system should generate a leaderboard ranked by collaborative_tasks_completed count.
**Validates: Requirements 22.10**

**Property 80: Partner Level Synchronization**
*For any* user earning points, the partner's level should increase proportionally, unlocking new interaction phrases and task rewards at level thresholds (5, 10, 15, 20).
**Validates: Requirements 22.11**

**Property 81: Partner Q&A Capability**
*For any* user question, the partner should provide initial answer from existing Q&A knowledge base; if unable to answer, redirect to live Q&A room or teacher.
**Validates: Requirements 22.12, 22.13**

**Property 82: Task Expiration Reminders**
*For any* collaborative task with expires_at within 24 hours, the partner should send reminder message (e.g., "我们的双人任务还有24小时截止").
**Validates: Requirements 22.14**

**Property 83: Completion Congratulations**
*For any* user completing a course/path, the partner should send congratulation message and offer to share collaboration results to community.
**Validates: Requirements 22.15, 22.16**

**Property 84: Partner Message Response Time**
*For any* partner interaction (message send, task generation), the system should respond within 200ms.
**Validates: Requirements 22.19**

**Property 85: Partner Configuration**
*For any* user accessing personal center settings, the system should support: enable/disable partner, switch partner persona, adjust interaction frequency (high/medium/low).
**Validates: Requirements 22.21**

#### Video Quiz and Wrong Question Book Properties

**Property 86: Random Quiz Trigger**
*For any* video playback, the system should trigger quiz popup at a random time between 10-20 minutes, pausing the video until answer submission.
**Validates: Requirements 23.1, 23.3**

**Property 87: Context-Relevant Questions**
*For any* triggered quiz question, the question_content should be related to the current video's knowledge points (knowledge_point_ids overlap ≥ 1).
**Validates: Requirements 23.2**

**Property 88: Immediate Answer Validation**
*For any* quiz answer submission, the system should validate correctness within 100ms and display correct answer + explanation.
**Validates: Requirements 23.4**

**Property 89: Correct Answer Rewards**
*For any* correct quiz answer, the system should award exactly 5 points and continue video playback immediately.
**Validates: Requirements 23.5**

**Property 90: Wrong Answer to Wrong Book**
*For any* incorrect quiz answer, the system should create a wrong_question_book record with all fields (video_id, question_id, user_answer, correct_answer, answered_at, knowledge_point_ids) populated.
**Validates: Requirements 23.6, 23.7**

**Property 91: Real-Time Wrong Book Sync**
*For any* new wrong question record, the system should send notifications to teacher and parent within 3 seconds.
**Validates: Requirements 23.8, 23.20**

**Property 92: Teacher Wrong Book View**
*For any* teacher querying student wrong book, the response should include student_name, video_name, question_content, user_answer, answered_at for all wrong questions.
**Validates: Requirements 23.9**

**Property 93: Parent Wrong Book View**
*For any* parent querying child's wrong book, the response should include wrong question list, statistics, and weak knowledge points analysis.
**Validates: Requirements 23.10**

**Property 94: Wrong Book Filtering**
*For any* student viewing wrong book, the system should support filtering by video_id, knowledge_point_id, and date range.
**Validates: Requirements 23.11**

**Property 95: Wrong Question Detail Display**
*For any* wrong question detail view, the system should display question_content, user_answer, correct_answer, explanation, and related knowledge point links.
**Validates: Requirements 23.12**

**Property 96: Retry Tracking**
*For any* wrong question retry, the system should increment retry_count and record the new attempt result.
**Validates: Requirements 23.13**

**Property 97: Mastery Marking**
*For any* wrong question answered correctly on retry, the system should set is_mastered=true, record mastered_at timestamp, and remove from active wrong book display.
**Validates: Requirements 23.14**

**Property 98: Quiz Statistics Accuracy**
*For any* quiz statistics query, the system should calculate: total_questions = count(all quiz records), correct_rate = (correct_count / total_questions) × 100, wrong_count = count(wrong_question_book), weak_points = top 5 knowledge points by wrong_count.
**Validates: Requirements 23.15**

**Property 99: No Duplicate Quiz Triggers**
*For any* video, the system should not trigger quiz at the same time position twice for the same user.
**Validates: Requirements 23.16**

**Property 100: Max Quiz Limit Per Video**
*For any* video, the system should trigger at most 3 quiz questions per viewing session.
**Validates: Requirements 23.17**

**Property 101: Quiz Timeout Handling**
*For any* quiz question displayed for 60 seconds without submission, the system should auto-submit with is_timeout=true and mark as incorrect.
**Validates: Requirements 23.18**

**Property 102: Wrong Book Triggers AI Re-evaluation**
*For any* new wrong question added to wrong_question_book, the system should trigger AI knowledge mastery re-evaluation for affected knowledge_point_ids within 5 seconds.
**Validates: Requirements 23.19**

---

## Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)
- Missing required fields
- Invalid data types or formats
- Invalid enum values
- URL format validation failures
- Constraint violations (e.g., duplicate favorites)

**Handling Strategy**:
```typescript
// Example validation error response
{
  code: 400,
  msg: '参数验证失败',
  data: {
    errors: [
      { field: 'title', message: '标题不能为空' },
      { field: 'difficulty', message: '难度必须是 beginner, intermediate, 或 advanced' }
    ]
  }
}
```

#### 2. Authentication Errors (401 Unauthorized)
- Missing JWT token
- Invalid or expired token
- Token signature verification failure

**Handling Strategy**:
```typescript
// Middleware: authenticateToken
if (!token) {
  return res.status(401).json({
    code: 401,
    msg: '未提供认证令牌',
    data: null
  });
}
```

#### 3. Authorization Errors (403 Forbidden)
- User lacks required role
- User doesn't own the resource
- Resource is not accessible to user's role

**Handling Strategy**:
```typescript
// Example authorization check
if (learningPath.user_id !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json({
    code: 403,
    msg: '无权限访问该学习路径',
    data: null
  });
}
```

#### 4. Not Found Errors (404 Not Found)
- Resource ID doesn't exist
- User not found
- Learning path not found

**Handling Strategy**:
```typescript
if (!learningPath) {
  return res.status(404).json({
    code: 404,
    msg: '学习路径不存在',
    data: null
  });
}
```

#### 5. Database Errors (500 Internal Server Error)
- Connection failures
- Query execution errors
- Constraint violations
- Transaction rollback

**Handling Strategy**:
```typescript
try {
  // Database operations
} catch (error) {
  console.error('Database error:', error);
  return res.status(500).json({
    code: 500,
    msg: '数据库操作失败',
    data: null
  });
}
```

#### 6. External Service Errors (503 Service Unavailable)
- AI service timeout
- AI service connection failure
- Third-party API errors

**Handling Strategy**:
```typescript
try {
  const result = await aiService.analyze(data);
  return result;
} catch (error) {
  console.warn('AI service failed, using fallback:', error);
  // Fallback to rule-based algorithm
  return fallbackAlgorithm(data);
}
```

### Error Logging

All errors should be logged with the following information:
- Timestamp
- Error type and message
- Stack trace (for 500 errors)
- Request URL and method
- User ID (if authenticated)
- Request body/params (sanitized)

```typescript
// Error logging utility
function logError(error: Error, req: Request, context: string) {
  console.error(`[${new Date().toISOString()}] ${context} Error`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    body: sanitize(req.body)
  });
}
```

### Retry Strategies

#### Database Connection Retry
- Max retries: 3
- Retry delay: 2000ms
- Exponential backoff: No (fixed delay)

#### AI Service Retry
- Max retries: 2
- Retry delay: 1000ms
- Timeout: 10000ms
- Fallback: Rule-based algorithms

---

## Testing Strategy

### Dual Testing Approach

The testing strategy combines **unit tests** and **property-based tests** to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary for comprehensive coverage

### Unit Testing

**Focus Areas**:
1. Specific examples that demonstrate correct behavior
2. Integration points between components
3. Edge cases and error conditions
4. Database schema validation
5. API endpoint responses

**Example Unit Tests**:
```typescript
// backend/tests/learning-paths.test.ts
describe('Learning Path API', () => {
  test('should create learning path with valid data', async () => {
    const pathData = {
      title: 'JavaScript Basics',
      description: 'Learn JavaScript fundamentals',
      difficulty: 'beginner',
      estimated_hours: 10,
      is_public: true,
      steps: [
        {
          step_number: 1,
          title: 'Variables and Data Types',
          content: 'Learn about variables',
          resource_type: 'article',
          estimated_minutes: 30,
          is_required: true
        }
      ]
    };
    
    const response = await request(app)
      .post('/api/learning-paths')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(pathData);
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.title).toBe(pathData.title);
  });
  
  test('should reject creation without required fields', async () => {
    const invalidData = { title: 'Test' }; // Missing required fields
    
    const response = await request(app)
      .post('/api/learning-paths')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(invalidData);
    
    expect(response.status).toBe(400);
  });
});
```

### Property-Based Testing

**Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: `Feature: learning-platform-integration, Property {number}: {property_text}`

**Property Testing Library**: 
- For TypeScript/JavaScript: **fast-check**
- Installation: `npm install --save-dev fast-check`

**Example Property Tests**:
```typescript
// backend/tests/properties/learning-paths.property.test.ts
import fc from 'fast-check';

describe('Learning Path Properties', () => {
  /**
   * Feature: learning-platform-integration, Property 2: Learning Path Creation Validation
   * For any learning path creation request with all required fields, 
   * the system should successfully store the path and return a valid path ID.
   */
  test('Property 2: Learning Path Creation Validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          description: fc.string({ maxLength: 1000 }),
          difficulty: fc.constantFrom('beginner', 'intermediate', 'advanced'),
          estimated_hours: fc.integer({ min: 1, max: 100 }),
          is_public: fc.boolean()
        }),
        async (pathData) => {
          const response = await request(app)
            .post('/api/learning-paths')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send(pathData);
          
          expect(response.status).toBe(201);
          expect(response.body.data).toHaveProperty('id');
          expect(typeof response.body.data.id).toBe('number');
          expect(response.body.data.title).toBe(pathData.title);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: learning-platform-integration, Property 8: Progress Update Accuracy
   * For any progress update with completed steps, the system should calculate 
   * progress_percentage correctly.
   */
  test('Property 8: Progress Update Accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }), // total steps
        fc.integer({ min: 0, max: 20 }), // completed steps count
        async (totalSteps, completedCount) => {
          fc.pre(completedCount <= totalSteps); // Precondition
          
          // Create path with totalSteps steps
          const pathId = await createTestPath(totalSteps);
          
          // Enroll student
          await enrollStudent(studentId, pathId);
          
          // Complete some steps
          const completedSteps = Array.from({ length: completedCount }, (_, i) => i + 1);
          await updateProgress(studentId, pathId, completedSteps);
          
          // Verify progress percentage
          const progress = await getProgress(studentId, pathId);
          const expectedPercentage = Math.floor((completedCount / totalSteps) * 100);
          
          expect(progress.progress_percentage).toBe(expectedPercentage);
          expect(progress.completed_steps).toEqual(completedSteps);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Focus Areas**:
1. End-to-end workflows (create path → enroll → complete → view stats)
2. Role-based access control across multiple endpoints
3. Database transaction integrity
4. Cascade deletion verification
5. Notification delivery

**Example Integration Test**:
```typescript
// backend/tests/integration/learning-path-workflow.test.ts
describe('Learning Path Complete Workflow', () => {
  test('should complete full learning path lifecycle', async () => {
    // 1. Teacher creates path
    const createResponse = await request(app)
      .post('/api/learning-paths')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(testPathData);
    
    const pathId = createResponse.body.data.id;
    
    // 2. Teacher publishes path
    await request(app)
      .post(`/api/learning-paths/${pathId}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`);
    
    // 3. Student enrolls
    await request(app)
      .post(`/api/learning-paths/${pathId}/enroll`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    // 4. Student completes steps
    for (let step = 1; step <= 3; step++) {
      await request(app)
        .put(`/api/learning-paths/${pathId}/progress`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ current_step: step, completed_steps: [step] });
    }
    
    // 5. Verify completion
    const progressResponse = await request(app)
      .get(`/api/learning-paths/${pathId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(progressResponse.body.data.status).toBe('completed');
    expect(progressResponse.body.data.progress_percentage).toBe(100);
  });
});
```

### Frontend Testing

**Unit Tests** (Vitest):
- Component rendering
- User interactions
- State management
- API mocking

**Example Frontend Test**:
```typescript
// frontend/src/views/student/__tests__/LearningPaths.test.ts
import { mount } from '@vue/test-utils';
import { describe, test, expect, vi } from 'vitest';
import LearningPaths from '../LearningPaths.vue';

describe('LearningPaths.vue', () => {
  test('should display learning paths list', async () => {
    const mockPaths = [
      { id: 1, title: 'JavaScript Basics', difficulty: 'beginner' },
      { id: 2, title: 'Advanced TypeScript', difficulty: 'advanced' }
    ];
    
    // Mock API call
    vi.mock('@/api/learning-paths', () => ({
      getLearningPaths: vi.fn().mockResolvedValue({ data: mockPaths })
    }));
    
    const wrapper = mount(LearningPaths);
    await wrapper.vm.$nextTick();
    
    expect(wrapper.findAll('.path-card')).toHaveLength(2);
    expect(wrapper.text()).toContain('JavaScript Basics');
  });
});
```

### Performance Testing

**Metrics to Monitor**:
- API response time < 500ms (learning path list)
- Resource search < 1s
- Progress update < 200ms
- Database query optimization (use EXPLAIN)

**Load Testing**:
- Concurrent users: 1000
- Tools: Apache JMeter or k6

### Test Coverage Goals

- Backend code coverage: >80%
- Frontend code coverage: >70%
- Property tests: All 47 properties implemented
- Integration tests: All critical workflows covered

---

## Implementation Notes

### Migration Strategy

1. **Phase 1: Database Setup** (Day 1-2)
   - Create new tables
   - Add indexes
   - Extend notifications table
   - Test migrations on development database

2. **Phase 2: Backend API** (Day 3-6)
   - Implement learning path controllers
   - Implement resource controllers
   - Enhance notification controllers
   - Write unit tests and property tests

3. **Phase 3: Frontend Components** (Day 7-10)
   - Create learning path views
   - Create resource views
   - Integrate Tailwind CSS
   - Write component tests

4. **Phase 4: Role Integration** (Day 11-12)
   - Teacher management features
   - Student learning features
   - Parent monitoring features

5. **Phase 5: AI Integration** (Day 13-15)
   - Integrate Qwen3 models
   - Integrate Baidu AI
   - Integrate Xunfei AI
   - Implement fallback mechanisms

6. **Phase 6: Testing & Optimization** (Day 16-17)
   - Run all tests
   - Performance optimization
   - Security audit
   - Documentation

### Code Quality Standards

- All new code in TypeScript
- ESLint and Prettier configured
- Consistent naming conventions
- Comprehensive JSDoc comments
- Error handling in all async functions
- Input validation on all endpoints

### Security Considerations

- JWT token validation on all protected routes
- Role-based access control (RBAC)
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- Rate limiting on API endpoints
- HTTPS in production

### Performance Optimizations

- Database indexes on foreign keys and frequently queried fields
- Pagination on all list endpoints
- Caching for frequently accessed data (Redis)
- Lazy loading for frontend components
- Image optimization and CDN usage
- Database connection pooling

---

**Document Version**: 1.0  
**Created**: 2026-01-23  
**Status**: Ready for Review
