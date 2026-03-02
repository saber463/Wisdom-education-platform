# Learning AI Platform API 文档

## 安全说明

### CSRF保护

本平台实现了CSRF（跨站请求伪造）保护机制。所有修改数据的POST、PUT、PATCH、DELETE请求都需要包含有效的CSRF Token。

#### 获取CSRF Token

- **URL**: `/api/csrf-token`
- **方法**: `GET`
- **认证**: 无需认证（但建议携带JWT Token）
- **请求头**:
  ```
  Cookie: XSRF-TOKEN={token}
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "CSRF Token已生成"
  }
  ```
- **响应头**:
  ```
  X-CSRF-Token: {token}
  Set-Cookie: XSRF-TOKEN={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600000
  ```

#### 使用CSRF Token

对于需要CSRF保护的请求，需要在请求头中包含CSRF Token：

```
X-CSRF-Token: {token}
```

或者通过Cookie自动携带：

```
Cookie: XSRF-TOKEN={token}
```

或者在请求体中包含：

```json
{
  "_csrf": "{token}"
}
```

#### Token有效期

CSRF Token的有效期为1小时（3600000毫秒），过期后需要重新获取。

#### 错误响应

当CSRF Token验证失败时，会返回以下错误响应：

```json
{
  "success": false,
  "message": "CSRF Token无效或已过期"
}
```

### 安全响应头

本平台实现了以下安全响应头：

- `X-Content-Type-Options: nosniff` - 防止MIME类型嗅探
- `X-Frame-Options: DENY` - 防止点击劫持
- `X-XSS-Protection: 1; mode=block` - 启用XSS保护
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` - 强制HTTPS（生产环境）
- `Referrer-Policy: strict-origin-when-cross-origin` - 控制Referer信息

## 1. 用户接口

### 1.1 用户注册

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **认证**: 无需认证
- **请求体**:
  ```json
  {
    "username": "用户名",
    "email": "用户邮箱",
    "password": "密码"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "用户ID",
        "username": "用户名",
        "email": "用户邮箱",
        "avatar": "头像URL",
        "createdAt": "创建时间"
      },
      "token": "JWT令牌"
    }
  }
  ```

### 1.2 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **认证**: 无需认证
- **请求体**:
  ```json
  {
    "email": "用户邮箱",
    "password": "密码"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "用户ID",
        "username": "用户名",
        "email": "用户邮箱",
        "avatar": "头像URL",
        "createdAt": "创建时间"
      },
      "token": "JWT令牌"
    }
  }
  ```

### 1.3 获取用户信息

- **URL**: `/api/users/me`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "用户ID",
        "username": "用户名",
        "email": "用户邮箱",
        "avatar": "头像URL",
        "createdAt": "创建时间"
      }
    }
  }
  ```

### 1.4 更新用户信息

- **URL**: `/api/users/me`
- **方法**: `PUT`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求体**:
  ```json
  {
    "username": "新用户名",
    "avatar": "新头像URL"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "用户ID",
        "username": "新用户名",
        "email": "用户邮箱",
        "avatar": "新头像URL",
        "createdAt": "创建时间"
      }
    }
  }
  ```

### 1.5 获取学习进度

- **URL**: `/api/users/learning-progress`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "progress": [
        {
          "courseId": "课程ID",
          "courseTitle": "课程标题",
          "completedLessons": 10,
          "totalLessons": 20,
          "completionRate": 50
        }
      ]
    }
  }
  ```

## 2. 学习路径接口

### 2.1 生成学习路径

- **URL**: `/api/learning-paths/generate`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求体**:
  ```json
  {
    "goal": "学习目标",
    "currentLevel": "当前水平",
    "timeCommitment": "每周学习时间"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "path": {
        "id": "路径ID",
        "title": "路径标题",
        "description": "路径描述",
        "steps": [
          {
            "id": "步骤ID",
            "title": "步骤标题",
            "description": "步骤描述",
            "duration": "预计时长",
            "resources": ["资源1", "资源2"]
          }
        ],
        "createdAt": "创建时间"
      }
    }
  }
  ```

### 2.2 获取学习路径列表

- **URL**: `/api/learning-paths`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "paths": [
        {
          "id": "路径ID",
          "title": "路径标题",
          "description": "路径描述",
          "createdAt": "创建时间"
        }
      ]
    }
  }
  ```

### 2.3 获取学习路径详情

- **URL**: `/api/learning-paths/:id`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "path": {
        "id": "路径ID",
        "title": "路径标题",
        "description": "路径描述",
        "steps": [
          {
            "id": "步骤ID",
            "title": "步骤标题",
            "description": "步骤描述",
            "duration": "预计时长",
            "resources": ["资源1", "资源2"]
          }
        ],
        "createdAt": "创建时间"
      }
    }
  }
  ```

## 3. 知识库接口

### 3.1 获取知识库列表

- **URL**: `/api/knowledge-base`
- **方法**: `GET`
- **认证**: 无需认证
- **请求参数**:
  - `page`: 页码（可选）
  - `limit`: 每页数量（可选）
  - `category`: 分类（可选）
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "knowledgePoints": [
        {
          "id": "知识点ID",
          "title": "知识点标题",
          "description": "知识点描述",
          "category": "分类",
          "difficulty": "难度",
          "createdAt": "创建时间"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100
      }
    }
  }
  ```

### 3.2 获取知识库详情

- **URL**: `/api/knowledge-base/:id`
- **方法**: `GET`
- **认证**: 无需认证
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "knowledgePoint": {
        "id": "知识点ID",
        "title": "知识点标题",
        "description": "知识点描述",
        "category": "分类",
        "difficulty": "难度",
        "content": "知识点内容",
        "resources": ["资源1", "资源2"],
        "createdAt": "创建时间"
      }
    }
  }
  ```

## 4. AI助手接口

### 4.1 智能问答

- **URL**: `/api/ai/chat`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求体**:
  ```json
  {
    "message": "用户问题",
    "context": ["对话历史1", "对话历史2"]
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "response": "AI回答",
      "suggestions": ["相关问题1", "相关问题2"]
    }
  }
  ```

### 4.2 内容生成

- **URL**: `/api/ai/generate`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求体**:
  ```json
  {
    "prompt": "生成提示",
    "type": "内容类型（如：summary, article, question）"
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "content": "生成的内容"
    }
  }
  ```

## 5. 群组接口

### 5.1 创建群组

- **URL**: `/api/groups`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求体**:
  ```json
  {
    "name": "群组名称",
    "description": "群组描述",
    "category": "群组分类",
    "isPublic": true
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "group": {
        "id": "群组ID",
        "name": "群组名称",
        "description": "群组描述",
        "creatorId": "创建者ID",
        "memberCount": 1,
        "createdAt": "创建时间"
      }
    }
  }
  ```

### 5.2 获取群组列表

- **URL**: `/api/groups`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求参数**:
  - `page`: 页码（可选）
  - `limit`: 每页数量（可选）
  - `category`: 分类（可选）
  - `isPublic`: 是否公开（可选）
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "groups": [
        {
          "id": "群组ID",
          "name": "群组名称",
          "description": "群组描述",
          "memberCount": 100,
          "createdAt": "创建时间"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 50
      }
    }
  }
  ```

### 5.3 获取群组详情

- **URL**: `/api/groups/:id`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "group": {
        "id": "群组ID",
        "name": "群组名称",
        "description": "群组描述",
        "creatorId": "创建者ID",
        "memberCount": 100,
        "createdAt": "创建时间",
        "members": ["成员1", "成员2"]
      }
    }
  }
  ```

### 5.4 加入群组

- **URL**: `/api/groups/:id/join`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "message": "成功加入群组"
  }
  ```

### 5.5 退出群组

- **URL**: `/api/groups/:id/leave`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "message": "成功退出群组"
  }
  ```

## 6. 推文接口

### 6.1 发布推文

- **URL**: `/api/tweets`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求体**:
  ```json
  {
    "content": "推文内容",
    "images": ["图片URL1", "图片URL2"],
    "tags": ["标签1", "标签2"]
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "tweet": {
        "id": "推文ID",
        "content": "推文内容",
        "images": ["图片URL1", "图片URL2"],
        "tags": ["标签1", "标签2"],
        "userId": "用户ID",
        "username": "用户名",
        "createdAt": "创建时间"
      }
    }
  }
  ```

### 6.2 获取推文列表

- **URL**: `/api/tweets`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求参数**:
  - `page`: 页码（可选）
  - `limit`: 每页数量（可选）
  - `userId`: 用户ID（可选）
  - `tags`: 标签（可选）
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "tweets": [
        {
          "id": "推文ID",
          "content": "推文内容",
          "images": ["图片URL1", "图片URL2"],
          "tags": ["标签1", "标签2"],
          "userId": "用户ID",
          "username": "用户名",
          "likeCount": 10,
          "commentCount": 5,
          "createdAt": "创建时间"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100
      }
    }
  }
  ```

### 6.3 点赞推文

- **URL**: `/api/tweets/:id/like`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "likeCount": 11
    }
  }
  ```

### 6.4 取消点赞

- **URL**: `/api/tweets/:id/unlike`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "likeCount": 10
    }
  }
  ```

## 7. 测试接口

### 7.1 获取测试列表

- **URL**: `/api/tests`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求参数**:
  - `page`: 页码（可选）
  - `limit`: 每页数量（可选）
  - `category`: 分类（可选）
  - `difficulty`: 难度（可选）
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "tests": [
        {
          "id": "测试ID",
          "title": "测试标题",
          "description": "测试描述",
          "category": "分类",
          "difficulty": "难度",
          "questionCount": 10,
          "duration": 30,
          "createdAt": "创建时间"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 50
      }
    }
  }
  ```

### 7.2 获取测试详情

- **URL**: `/api/tests/:id`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "test": {
        "id": "测试ID",
        "title": "测试标题",
        "description": "测试描述",
        "category": "分类",
        "difficulty": "难度",
        "questions": [
          {
            "id": "问题ID",
            "content": "问题内容",
            "options": ["选项A", "选项B", "选项C", "选项D"],
            "type": "单选题"
          }
        ],
        "duration": 30,
        "createdAt": "创建时间"
      }
    }
  }
  ```

### 7.3 提交测试答案

- **URL**: `/api/tests/:id/submit`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求体**:
  ```json
  {
    "answers": [
      {
        "questionId": "问题ID",
        "selectedAnswer": "选项A"
      }
    ]
  }
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "score": 80,
      "correctCount": 8,
      "totalCount": 10,
      "wrongQuestions": ["问题ID1", "问题ID2"]
    }
  }
  ```

## 8. 通知接口

### 8.1 获取通知列表

- **URL**: `/api/notifications`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **请求参数**:
  - `page`: 页码（可选）
  - `limit`: 每页数量（可选）
  - `type`: 通知类型（可选）
  - `isRead`: 是否已读（可选）
- **响应**:
  ```json
  {
    "status": "success",
    "data": {
      "notifications": [
        {
          "id": "通知ID",
          "type": "系统通知",
          "title": "通知标题",
          "content": "通知内容",
          "isRead": false,
          "createdAt": "创建时间"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 20
      }
    }
  }
  ```

### 8.2 标记通知为已读

- **URL**: `/api/notifications/:id/read`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "message": "通知已标记为已读"
  }
  ```

### 8.3 标记所有通知为已读

- **URL**: `/api/notifications/read-all`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求头**:
  ```
  Authorization: Bearer {JWT令牌}
  ```
- **响应**:
  ```json
  {
    "status": "success",
    "message": "所有通知已标记为已读"
  }
  ```

## 9. 通用响应格式

### 9.1 成功响应

```json
{
  "status": "success",
  "data": {
    // 返回数据
  }
}
```

### 9.2 错误响应

```json
{
  "status": "error",
  "message": "错误信息",
  "error": {
    // 详细错误信息（可选）
  }
}
```

## 10. 认证与授权

- 所有需要认证的接口都需要在请求头中添加 `Authorization: Bearer {JWT令牌}`
- 令牌过期后需要重新登录获取新令牌
- 不同角色可能有不同的权限限制

## 11. 错误码

| 错误码 | 描述                     |
| ------ | ------------------------ |
| 400    | 请求参数错误             |
| 401    | 未认证或认证失败         |
| 403    | 权限不足                 |
| 404    | 资源不存在               |
| 500    | 服务器内部错误           |
| 409    | 资源冲突（如邮箱已存在） |
| 429    | 请求过于频繁（速率限制） |
