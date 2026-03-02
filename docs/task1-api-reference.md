# Task 1 API参考文档 - 作业接口

## 概述

本文档提供修复后的作业接口的完整API参考，包括请求格式、响应格式、错误码说明和使用示例。

---

## 通用说明

### 认证

所有接口都需要JWT认证，在请求头中包含：

```
Authorization: Bearer <token>
```

### 响应格式

所有接口统一使用以下响应格式：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": { /* 数据对象或null */ }
}
```

### 错误码

| 状态码 | 说明 | 示例 |
|--------|------|------|
| 200 | 成功 | 查询成功 |
| 201 | 创建成功 | 作业创建成功 |
| 400 | 参数错误 | 缺少必填字段、参数格式错误 |
| 403 | 权限不足 | 无权限访问该资源 |
| 404 | 资源不存在 | 作业不存在 |
| 500 | 服务器错误 | 数据库错误、未知错误 |

---

## 接口列表

### 1. 查询作业列表

**接口**: `GET /api/assignments`

**描述**: 查询作业列表，支持分页和筛选

**权限**: 
- 教师：查看自己创建的作业
- 学生：查看自己班级的已发布作业
- 管理员：查看所有作业

**请求参数**:

| 参数 | 类型 | 必填 | 说明 | 默认值 | 限制 |
|------|------|------|------|--------|------|
| class_id | number | 否 | 班级ID | - | 正整数 |
| status | string | 否 | 作业状态 | - | draft/published/closed |
| page | number | 否 | 页码 | 1 | ≥1 |
| limit | number | 否 | 每页数量 | 10 | 1-100 |

**响应示例**:

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "assignments": [
      {
        "id": 1,
        "title": "第一章作业",
        "description": "完成课后习题",
        "class_id": 1,
        "teacher_id": 2,
        "difficulty": "medium",
        "total_score": 100,
        "deadline": "2024-12-31T23:59:59.000Z",
        "status": "published",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "class_name": "高一1班",
        "teacher_name": "张老师",
        "submission_count": 25,
        "graded_count": 20
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

**错误示例**:

```json
// 无效的page参数
{
  "code": 400,
  "msg": "无效的page参数，必须是大于0的整数",
  "data": null
}

// 无效的limit参数
{
  "code": 400,
  "msg": "无效的limit参数，必须是1-100之间的整数",
  "data": null
}
```

**curl示例**:

```bash
# 查询所有作业
curl -X GET "http://localhost:3000/api/assignments" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按班级查询
curl -X GET "http://localhost:3000/api/assignments?class_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 分页查询
curl -X GET "http://localhost:3000/api/assignments?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按状态查询
curl -X GET "http://localhost:3000/api/assignments?status=published" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. 查询作业详情

**接口**: `GET /api/assignments/:id`

**描述**: 查询指定作业的详细信息，包括题目列表和提交统计

**权限**:
- 教师：查看自己创建的作业
- 学生：查看自己班级的已发布作业
- 管理员：查看所有作业

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 作业ID |

**响应示例**:

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "id": 1,
    "title": "第一章作业",
    "description": "完成课后习题",
    "class_id": 1,
    "teacher_id": 2,
    "difficulty": "medium",
    "total_score": 100,
    "deadline": "2024-12-31T23:59:59.000Z",
    "status": "published",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "class_name": "高一1班",
    "teacher_name": "张老师",
    "questions": [
      {
        "id": 1,
        "assignment_id": 1,
        "question_number": 1,
        "question_type": "choice",
        "question_content": "1+1=?",
        "standard_answer": "2",
        "score": 10,
        "knowledge_point_id": 1,
        "knowledge_point_name": "基础运算"
      }
    ],
    "statistics": {
      "total_submissions": 25,
      "graded_count": 20,
      "avg_score": 85.5
    }
  }
}
```

**错误示例**:

```json
// 无效的作业ID
{
  "code": 400,
  "msg": "无效的作业ID",
  "data": null
}

// 作业不存在
{
  "code": 404,
  "msg": "作业不存在",
  "data": null
}

// 权限不足
{
  "code": 403,
  "msg": "无权限查看该作业",
  "data": null
}
```

**curl示例**:

```bash
curl -X GET "http://localhost:3000/api/assignments/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. 创建作业

**接口**: `POST /api/assignments`

**描述**: 创建新作业（仅教师）

**权限**: 仅教师

**请求体**:

```json
{
  "title": "第一章作业",
  "description": "完成课后习题",
  "class_id": 1,
  "difficulty": "medium",
  "total_score": 100,
  "deadline": "2024-12-31 23:59:59",
  "questions": [
    {
      "question_number": 1,
      "question_type": "choice",
      "question_content": "1+1=?",
      "standard_answer": "2",
      "score": 10,
      "knowledge_point_id": 1
    }
  ]
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 | 限制 |
|------|------|------|------|------|
| title | string | 是 | 作业标题 | 1-200字符 |
| description | string | 否 | 作业描述 | - |
| class_id | number | 是 | 班级ID | 正整数 |
| difficulty | string | 否 | 难度 | basic/medium/advanced，默认medium |
| total_score | number | 是 | 总分 | 正整数 |
| deadline | string | 是 | 截止时间 | YYYY-MM-DD HH:mm:ss |
| questions | array | 否 | 题目列表 | - |

**响应示例**:

```json
{
  "code": 201,
  "msg": "作业创建成功",
  "data": {
    "id": 1,
    "title": "第一章作业",
    "description": "完成课后习题",
    "class_id": 1,
    "teacher_id": 2,
    "difficulty": "medium",
    "total_score": 100,
    "deadline": "2024-12-31T23:59:59.000Z",
    "status": "draft",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误示例**:

```json
// 缺少必填字段
{
  "code": 400,
  "msg": "缺少必填字段：title, class_id, total_score, deadline",
  "data": null
}

// 班级不存在
{
  "code": 404,
  "msg": "班级不存在",
  "data": null
}

// 无权限管理该班级
{
  "code": 403,
  "msg": "无权限管理该班级",
  "data": null
}
```

**curl示例**:

```bash
curl -X POST "http://localhost:3000/api/assignments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "第一章作业",
    "description": "完成课后习题",
    "class_id": 1,
    "difficulty": "medium",
    "total_score": 100,
    "deadline": "2024-12-31 23:59:59"
  }'
```

---

### 4. 更新作业

**接口**: `PUT /api/assignments/:id`

**描述**: 更新作业信息（仅教师，且只能更新草稿状态的作业）

**权限**: 仅教师，且必须是作业创建者

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 作业ID |

**请求体**:

```json
{
  "title": "第一章作业（修改）",
  "description": "完成课后习题1-10",
  "difficulty": "advanced",
  "total_score": 120,
  "deadline": "2024-12-31 23:59:59"
}
```

**字段说明**: 所有字段都是可选的，只更新提供的字段

**响应示例**:

```json
{
  "code": 200,
  "msg": "作业更新成功",
  "data": {
    "id": 1,
    "title": "第一章作业（修改）",
    "description": "完成课后习题1-10",
    "class_id": 1,
    "teacher_id": 2,
    "difficulty": "advanced",
    "total_score": 120,
    "deadline": "2024-12-31T23:59:59.000Z",
    "status": "draft",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
}
```

**错误示例**:

```json
// 无效的作业ID
{
  "code": 400,
  "msg": "无效的作业ID",
  "data": null
}

// 作业不存在
{
  "code": 404,
  "msg": "作业不存在",
  "data": null
}

// 无权限修改
{
  "code": 403,
  "msg": "无权限修改该作业",
  "data": null
}

// 只能修改草稿
{
  "code": 400,
  "msg": "只能修改草稿状态的作业",
  "data": null
}

// 没有更新字段
{
  "code": 400,
  "msg": "没有需要更新的字段",
  "data": null
}
```

**curl示例**:

```bash
curl -X PUT "http://localhost:3000/api/assignments/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "第一章作业（修改）",
    "total_score": 120
  }'
```

---

### 5. 删除作业

**接口**: `DELETE /api/assignments/:id`

**描述**: 删除作业（仅教师，且只能删除草稿状态的作业）

**权限**: 仅教师，且必须是作业创建者

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 作业ID |

**响应示例**:

```json
{
  "code": 200,
  "msg": "作业删除成功",
  "data": null
}
```

**错误示例**:

```json
// 无效的作业ID
{
  "code": 400,
  "msg": "无效的作业ID",
  "data": null
}

// 作业不存在
{
  "code": 404,
  "msg": "作业不存在",
  "data": null
}

// 无权限删除
{
  "code": 403,
  "msg": "无权限删除该作业",
  "data": null
}

// 只能删除草稿
{
  "code": 400,
  "msg": "只能删除草稿状态的作业",
  "data": null
}
```

**curl示例**:

```bash
curl -X DELETE "http://localhost:3000/api/assignments/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. 发布作业

**接口**: `POST /api/assignments/:id/publish`

**描述**: 发布作业，将状态从draft改为published，并推送通知给学生

**权限**: 仅教师，且必须是作业创建者

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 作业ID |

**响应示例**:

```json
{
  "code": 200,
  "msg": "作业发布成功",
  "data": {
    "assignment": {
      "id": 1,
      "title": "第一章作业",
      "status": "published",
      ...
    },
    "notifiedStudents": 25
  }
}
```

**错误示例**:

```json
// 无效的作业ID
{
  "code": 400,
  "msg": "无效的作业ID",
  "data": null
}

// 作业不存在
{
  "code": 404,
  "msg": "作业不存在",
  "data": null
}

// 无权限发布
{
  "code": 403,
  "msg": "无权限发布该作业",
  "data": null
}

// 只能发布草稿
{
  "code": 400,
  "msg": "只能发布草稿状态的作业",
  "data": null
}

// 客观题缺少标准答案
{
  "code": 400,
  "msg": "客观题必须提供标准答案，缺少标准答案的题号：1, 3, 5",
  "data": {
    "missingAnswers": [1, 3, 5]
  }
}
```

**curl示例**:

```bash
curl -X POST "http://localhost:3000/api/assignments/1/publish" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 日志格式

### 成功日志

```
[2024-01-01T12:00:00.000Z] 作业列表查询成功 {
  user: 2,
  role: 'teacher',
  count: 10,
  total: 50,
  duration: '45ms',
  params: { class_id: 1, status: 'published', page: 1, limit: 10 }
}
```

### 错误日志

```
[2024-01-01T12:00:00.000Z] 作业列表查询失败 {
  error: 'Connection timeout',
  stack: 'Error: Connection timeout\n    at ...',
  url: '/api/assignments',
  method: 'GET',
  query: { page: 1, limit: 10 },
  user: 2,
  role: 'teacher',
  duration: '5000ms'
}
```

---

## 最佳实践

### 1. 错误处理

```javascript
try {
  const response = await fetch('/api/assignments', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (result.code === 200) {
    // 处理成功
    console.log('作业列表:', result.data.assignments);
  } else {
    // 处理错误
    console.error('错误:', result.msg);
  }
} catch (error) {
  console.error('网络错误:', error);
}
```

### 2. 分页处理

```javascript
async function loadAssignments(page = 1, limit = 10) {
  const response = await fetch(
    `/api/assignments?page=${page}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const result = await response.json();
  
  if (result.code === 200) {
    const { assignments, pagination } = result.data;
    console.log(`第${pagination.page}页，共${pagination.totalPages}页`);
    return assignments;
  }
}
```

### 3. 参数校验

```javascript
function validateParams(page, limit) {
  if (page < 1 || !Number.isInteger(page)) {
    throw new Error('page必须是大于0的整数');
  }
  
  if (limit < 1 || limit > 100 || !Number.isInteger(limit)) {
    throw new Error('limit必须是1-100之间的整数');
  }
}
```

---

## 常见问题

### Q1: 为什么查询作业列表返回400错误？

**A**: 检查page和limit参数是否有效：
- page必须是大于0的整数
- limit必须是1-100之间的整数

### Q2: 为什么无法更新已发布的作业？

**A**: 只能更新草稿状态的作业。如需修改已发布的作业，请先将其状态改回draft。

### Q3: 为什么发布作业失败？

**A**: 检查以下几点：
1. 作业状态是否为draft
2. 所有客观题是否都有标准答案
3. 是否有权限发布该作业

### Q4: 如何查看详细的错误信息？

**A**: 查看后端日志，所有错误都会记录详细信息，包括错误消息、堆栈跟踪、请求参数等。

---

## 更新日志

### v1.0 (2024)
- ✅ 修复MySQL GROUP BY语法错误
- ✅ 添加参数校验
- ✅ 添加详细错误日志
- ✅ 实现数据库连接重试机制
- ✅ 统一响应格式为 {code, msg, data}

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护者**: 开发团队
