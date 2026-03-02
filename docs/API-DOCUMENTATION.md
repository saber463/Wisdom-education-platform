# API接口文档

## 概述

本文档描述了学习平台集成功能的所有API接口。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`

## 认证

所有API（除登录注册外）都需要在请求头中携带JWT Token：

```
Authorization: Bearer <token>
```

## API接口列表

### 1. 课程体系管理 API

#### 1.1 获取课程列表
- **URL**: `GET /api/courses`
- **参数**:
  - `language_name` (可选): 语言名称筛选
  - `difficulty` (可选): 难度筛选 (beginner/intermediate/advanced)
  - `is_hot` (可选): 是否热门
  - `page` (可选): 页码，默认1
  - `page_size` (可选): 每页数量，默认10

#### 1.2 获取课程详情
- **URL**: `GET /api/courses/:id`
- **返回**: 课程详细信息，包括分支和课节列表

#### 1.3 购买课程
- **URL**: `POST /api/courses/:id/purchase`
- **请求体**:
```json
{
  "branch_id": 1,
  "payment_method": "alipay"
}
```

### 2. 用户兴趣调查 API

#### 2.1 获取问卷状态
- **URL**: `GET /api/user-interests/status`
- **返回**: 是否已完成问卷

#### 2.2 提交问卷
- **URL**: `POST /api/user-interests/submit`
- **请求体**:
```json
{
  "programming_experience": "beginner",
  "learning_goals": ["web_development"],
  "preferred_languages": ["javascript"],
  "learning_style": "visual",
  "available_time": "evening",
  "difficulty_preference": "moderate"
}
```

#### 2.3 获取推荐课程
- **URL**: `GET /api/user-interests/recommendations`
- **返回**: 基于兴趣的推荐课程列表

### 3. AI动态学习路径 API

#### 3.1 采集学习数据
- **URL**: `POST /api/ai-learning-path/collect`
- **请求体**:
```json
{
  "lesson_id": 1,
  "data_type": "video",
  "video_data": {
    "pause_positions": [100, 200],
    "rewatch_segments": [{"start": 50, "end": 100}],
    "total_watch_time": 1800
  }
}
```

#### 3.2 获取学习统计
- **URL**: `GET /api/ai-learning-path/statistics`
- **返回**: 学习统计数据

#### 3.3 获取调整后的学习路径
- **URL**: `GET /api/ai-learning-path/adjusted-path/:pathId`
- **返回**: 调整后的学习路径详情

#### 3.4 获取知识掌握画像
- **URL**: `GET /api/ai-learning-path/knowledge-mastery`
- **返回**: 知识点掌握度列表

#### 3.5 获取调整日志
- **URL**: `GET /api/ai-learning-path/adjustment-logs`
- **参数**:
  - `learning_path_id` (可选): 学习路径ID
  - `limit` (可选): 返回数量，默认20

#### 3.6 切换动态调整开关
- **URL**: `PUT /api/ai-learning-path/toggle-dynamic-adjustment`
- **请求体**:
```json
{
  "enabled": true
}
```

### 4. 虚拟学习伙伴 API

#### 4.1 生成虚拟伙伴
- **URL**: `POST /api/virtual-partner/generate`
- **请求体**:
```json
{
  "learning_path_id": 1
}
```

#### 4.2 发送消息
- **URL**: `POST /api/virtual-partner/send-message`
- **请求体**:
```json
{
  "message_type": "encouragement",
  "content": "今天学习得怎么样？",
  "related_knowledge_point": "JavaScript基础"
}
```

#### 4.3 获取互动历史
- **URL**: `GET /api/virtual-partner/interactions`
- **参数**:
  - `limit` (可选): 返回数量，默认50

#### 4.4 获取任务列表
- **URL**: `GET /api/virtual-partner/tasks`
- **返回**: 共同任务列表

#### 4.5 更新任务进度
- **URL**: `POST /api/virtual-partner/tasks/:id/progress`
- **请求体**:
```json
{
  "progress": 5
}
```

#### 4.6 获取排行榜
- **URL**: `GET /api/virtual-partner/leaderboard`
- **返回**: 协作排行榜

### 5. 视频答题与错题本 API

#### 5.1 获取答题触发信息
- **URL**: `GET /api/video-quiz/trigger/:lessonId`
- **返回**: 触发时间和题目信息

#### 5.2 提交答案
- **URL**: `POST /api/video-quiz/submit`
- **请求体**:
```json
{
  "question_id": 1,
  "lesson_id": 1,
  "user_answer": "A",
  "trigger_time": 600,
  "time_spent": 30
}
```

#### 5.3 获取错题本
- **URL**: `GET /api/video-quiz/wrong-book`
- **参数**:
  - `lesson_id` (可选): 课节ID筛选
  - `knowledge_point_id` (可选): 知识点ID筛选
  - `start_date` (可选): 开始日期
  - `end_date` (可选): 结束日期

#### 5.4 重做错题
- **URL**: `POST /api/video-quiz/retry/:id`
- **返回**: 重做结果

#### 5.5 标记已掌握
- **URL**: `PUT /api/video-quiz/mark-mastered/:id`
- **返回**: 操作结果

#### 5.6 获取错题统计
- **URL**: `GET /api/video-quiz/statistics`
- **返回**: 错题统计数据

#### 5.7 获取薄弱知识点
- **URL**: `GET /api/video-quiz/weak-points`
- **返回**: TOP5薄弱知识点

### 6. 家长端 API

#### 6.1 获取孩子列表
- **URL**: `GET /api/parent/children`
- **权限**: parent
- **返回**: 孩子列表

#### 6.2 查看孩子学习路径
- **URL**: `GET /api/parent/child/:childId/learning-path`
- **权限**: parent
- **返回**: 学习路径详情

#### 6.3 查看孩子错题本
- **URL**: `GET /api/parent/child/:childId/wrong-book`
- **权限**: parent
- **返回**: 错题本列表和统计

#### 6.4 查看孩子视频进度
- **URL**: `GET /api/parent/child/:childId/video-progress`
- **权限**: parent
- **参数**:
  - `lesson_id` (可选): 课节ID筛选
- **返回**: 视频学习进度列表

## 错误码

- `200`: 成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `429`: 请求过于频繁
- `500`: 服务器内部错误

## 响应格式

### 成功响应
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### 错误响应
```json
{
  "code": 400,
  "msg": "错误信息",
  "data": null
}
```

