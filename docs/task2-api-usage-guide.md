# Task 2 API 使用指南 - 批改查询接口

## 接口概述

**新接口路径**：`GET /api/grading/assignment/:assignment_id`

**功能**：根据作业ID查询批改结果，支持可选的学生ID筛选

**认证**：需要 JWT Token

**权限**：
- 学生：只能查询自己的批改结果
- 教师：只能查询自己班级的批改结果
- 家长：只能查询自己孩子的批改结果
- 管理员：无限制

---

## 请求参数

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| assignment_id | integer | 是 | 作业ID |

### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| student_id | integer | 否 | 学生ID，用于筛选特定学生的批改结果 |

---

## 响应格式

### 成功响应（200）

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "submission_id": 1,
      "student_id": 1,
      "student_name": "张三",
      "student_username": "teststudent1",
      "submit_time": "2024-01-15T10:30:00.000Z",
      "grading_time": "2024-01-15T11:00:00.000Z",
      "total_score": 85,
      "status": "graded",
      "file_url": null,
      "answers": [
        {
          "answer_id": 1,
          "question_id": 1,
          "question_number": 1,
          "question_type": "choice",
          "question_content": "以下哪个是正确的？",
          "student_answer": "A",
          "score": 10,
          "max_score": 10,
          "is_correct": true,
          "ai_feedback": "回答正确，继续保持！",
          "needs_review": false,
          "review_comment": null,
          "knowledge_point_name": "基础知识"
        }
      ]
    }
  ]
}
```

### 无数据响应（200）

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": []
}
```

### 错误响应

#### 400 - 参数错误

```json
{
  "code": 400,
  "msg": "缺少必填参数：assignment_id，且必须是有效的整数",
  "data": null
}
```

```json
{
  "code": 400,
  "msg": "student_id参数必须是有效的整数",
  "data": null
}
```

#### 403 - 权限不足

```json
{
  "code": 403,
  "msg": "权限不足：学生只能查看自己的批改结果",
  "data": null
}
```

```json
{
  "code": 403,
  "msg": "权限不足：教师只能查看自己班级的批改结果",
  "data": null
}
```

```json
{
  "code": 403,
  "msg": "权限不足：家长只能查看自己孩子的批改结果",
  "data": null
}
```

#### 404 - 作业不存在

```json
{
  "code": 404,
  "msg": "作业不存在",
  "data": null
}
```

#### 500 - 服务器错误

```json
{
  "code": 500,
  "msg": "服务器内部错误",
  "data": null
}
```

---

## 使用示例

### 1. 学生查询自己的批改结果

```bash
curl -X GET "http://localhost:3000/api/grading/assignment/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**说明**：
- 学生不需要指定 `student_id`，系统自动查询当前登录学生的批改结果
- 如果学生指定了其他学生的 `student_id`，将返回 403 错误

### 2. 教师查询班级所有批改结果

```bash
curl -X GET "http://localhost:3000/api/grading/assignment/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**说明**：
- 教师不指定 `student_id` 时，返回该作业的所有批改结果
- 只能查询自己班级的作业

### 3. 教师查询特定学生的批改结果

```bash
curl -X GET "http://localhost:3000/api/grading/assignment/1?student_id=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**说明**：
- 指定 `student_id` 参数筛选特定学生
- 只能查询自己班级学生的批改结果

### 4. 家长查询孩子的批改结果

```bash
curl -X GET "http://localhost:3000/api/grading/assignment/1?student_id=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**说明**：
- 家长必须指定 `student_id` 参数
- 只能查询自己孩子的批改结果
- 如果不指定 `student_id`，返回所有孩子的批改结果

### 5. 管理员查询任意批改结果

```bash
# 查询所有批改结果
curl -X GET "http://localhost:3000/api/grading/assignment/1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 查询特定学生的批改结果
curl -X GET "http://localhost:3000/api/grading/assignment/1?student_id=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**说明**：
- 管理员无权限限制
- 可以查询任意作业的任意学生的批改结果

---

## JavaScript/TypeScript 示例

### 使用 Axios

```typescript
import axios from 'axios';

// 配置 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// 查询批改结果
async function getGradingResults(assignmentId: number, studentId?: number) {
  try {
    const params = studentId ? { student_id: studentId } : {};
    const response = await api.get(`/grading/assignment/${assignmentId}`, { params });
    
    if (response.data.code === 200) {
      console.log('查询成功:', response.data.data);
      return response.data.data;
    } else {
      console.error('查询失败:', response.data.msg);
      return null;
    }
  } catch (error) {
    console.error('请求失败:', error);
    return null;
  }
}

// 使用示例
const results = await getGradingResults(1);  // 查询作业1的所有批改结果
const studentResults = await getGradingResults(1, 5);  // 查询作业1中学生5的批改结果
```

### 使用 Fetch

```javascript
// 查询批改结果
async function getGradingResults(assignmentId, studentId) {
  const url = studentId 
    ? `http://localhost:3000/api/grading/assignment/${assignmentId}?student_id=${studentId}`
    : `http://localhost:3000/api/grading/assignment/${assignmentId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    
    if (data.code === 200) {
      console.log('查询成功:', data.data);
      return data.data;
    } else {
      console.error('查询失败:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('请求失败:', error);
    return null;
  }
}

// 使用示例
getGradingResults(1).then(results => {
  console.log('批改结果:', results);
});
```

---

## Vue 3 组件示例

```vue
<template>
  <div class="grading-results">
    <h2>批改结果</h2>
    
    <!-- 加载状态 -->
    <div v-if="loading">加载中...</div>
    
    <!-- 错误信息 -->
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <!-- 无数据 -->
    <div v-else-if="results.length === 0" class="empty">
      暂无批改结果
    </div>
    
    <!-- 批改结果列表 -->
    <div v-else>
      <div v-for="result in results" :key="result.submission_id" class="result-item">
        <h3>{{ result.student_name }} ({{ result.student_username }})</h3>
        <p>提交时间: {{ formatDate(result.submit_time) }}</p>
        <p>批改时间: {{ formatDate(result.grading_time) }}</p>
        <p>总分: {{ result.total_score }}</p>
        <p>状态: {{ getStatusText(result.status) }}</p>
        
        <!-- 答题详情 -->
        <div class="answers">
          <h4>答题详情</h4>
          <div v-for="answer in result.answers" :key="answer.answer_id" class="answer-item">
            <p>题目 {{ answer.question_number }}: {{ answer.question_content }}</p>
            <p>学生答案: {{ answer.student_answer }}</p>
            <p>得分: {{ answer.score }} / {{ answer.max_score }}</p>
            <p :class="{ correct: answer.is_correct, wrong: !answer.is_correct }">
              {{ answer.is_correct ? '✓ 正确' : '✗ 错误' }}
            </p>
            <p class="feedback">{{ answer.ai_feedback }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps<{
  assignmentId: number;
  studentId?: number;
}>();

const results = ref([]);
const loading = ref(false);
const error = ref('');

const fetchGradingResults = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const params = props.studentId ? { student_id: props.studentId } : {};
    const response = await axios.get(
      `/api/grading/assignment/${props.assignmentId}`,
      { params }
    );
    
    if (response.data.code === 200) {
      results.value = response.data.data;
    } else {
      error.value = response.data.msg;
    }
  } catch (err) {
    error.value = '加载失败，请稍后重试';
    console.error('加载批改结果失败:', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const getStatusText = (status: string) => {
  const statusMap = {
    'submitted': '已提交',
    'grading': '批改中',
    'graded': '已批改',
    'reviewed': '已复核'
  };
  return statusMap[status] || status;
};

onMounted(() => {
  fetchGradingResults();
});
</script>

<style scoped>
.grading-results {
  padding: 20px;
}

.error {
  color: red;
}

.empty {
  color: #999;
  text-align: center;
  padding: 40px;
}

.result-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 5px;
}

.answer-item {
  background: #f5f5f5;
  padding: 10px;
  margin: 10px 0;
  border-radius: 3px;
}

.correct {
  color: green;
}

.wrong {
  color: red;
}

.feedback {
  color: #666;
  font-style: italic;
}
</style>
```

---

## 错误处理最佳实践

### 1. 统一错误处理

```typescript
async function handleGradingRequest(assignmentId: number, studentId?: number) {
  try {
    const response = await api.get(`/grading/assignment/${assignmentId}`, {
      params: studentId ? { student_id: studentId } : {}
    });
    
    const { code, msg, data } = response.data;
    
    switch (code) {
      case 200:
        return { success: true, data };
      case 400:
        return { success: false, error: '参数错误', message: msg };
      case 403:
        return { success: false, error: '权限不足', message: msg };
      case 404:
        return { success: false, error: '作业不存在', message: msg };
      case 500:
        return { success: false, error: '服务器错误', message: msg };
      default:
        return { success: false, error: '未知错误', message: msg };
    }
  } catch (error) {
    console.error('请求失败:', error);
    return { success: false, error: '网络错误', message: '请检查网络连接' };
  }
}
```

### 2. 用户友好的错误提示

```typescript
import { ElMessage } from 'element-plus';

async function loadGradingResults(assignmentId: number) {
  const result = await handleGradingRequest(assignmentId);
  
  if (result.success) {
    if (result.data.length === 0) {
      ElMessage.info('暂无批改结果');
    } else {
      ElMessage.success('加载成功');
    }
    return result.data;
  } else {
    // 根据错误类型显示不同的提示
    switch (result.error) {
      case '参数错误':
        ElMessage.error('请求参数有误，请刷新页面重试');
        break;
      case '权限不足':
        ElMessage.warning('您没有权限查看该批改结果');
        break;
      case '作业不存在':
        ElMessage.error('作业不存在或已被删除');
        break;
      case '服务器错误':
        ElMessage.error('服务器繁忙，请稍后重试');
        break;
      default:
        ElMessage.error(result.message || '加载失败');
    }
    return null;
  }
}
```

---

## 性能优化建议

### 1. 使用缓存

```typescript
// 简单的内存缓存
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

async function getCachedGradingResults(assignmentId: number, studentId?: number) {
  const cacheKey = `grading:${assignmentId}:${studentId || 'all'}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('使用缓存数据');
    return cached.data;
  }
  
  const data = await getGradingResults(assignmentId, studentId);
  
  if (data) {
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  return data;
}
```

### 2. 请求防抖

```typescript
import { debounce } from 'lodash-es';

// 防抖查询函数
const debouncedSearch = debounce(async (assignmentId: number, studentId?: number) => {
  return await getGradingResults(assignmentId, studentId);
}, 300);
```

### 3. 分页加载（未来优化）

```typescript
// 未来可能支持的分页参数
async function getGradingResultsPaginated(
  assignmentId: number,
  page: number = 1,
  pageSize: number = 10,
  studentId?: number
) {
  const params = {
    page,
    pageSize,
    ...(studentId && { student_id: studentId })
  };
  
  const response = await api.get(`/grading/assignment/${assignmentId}`, { params });
  return response.data;
}
```

---

## 常见问题 (FAQ)

### Q1: 为什么查询不存在的作业返回404，但无提交记录返回200？

**A**: 这是有意设计的：
- **404**：资源（作业）本身不存在
- **200 + 空数组**：资源（作业）存在，但没有相关数据（提交记录）

这样可以让前端区分两种情况，提供更好的用户体验。

### Q2: 学生可以查询其他学生的批改结果吗？

**A**: 不可以。学生只能查询自己的批改结果。如果尝试查询其他学生的结果，将返回 403 错误。

### Q3: 教师可以查询其他班级的批改结果吗？

**A**: 不可以。教师只能查询自己班级的批改结果。如果尝试查询其他班级的结果，将返回 403 错误。

### Q4: 旧的接口路径还能用吗？

**A**: 可以。旧路径 `/api/grading/assignment/:assignmentId/student/:studentId` 会自动重定向到新路径，保持向后兼容。

### Q5: 如何判断是否有数据？

**A**: 检查响应的 `code` 和 `data`：
```typescript
if (response.data.code === 200) {
  if (response.data.data.length === 0) {
    // 无数据
  } else {
    // 有数据
  }
}
```

### Q6: 返回的答题详情包含哪些信息？

**A**: 每个答题记录包含：
- 题目信息（题号、类型、内容）
- 学生答案
- 得分和满分
- 是否正确
- AI反馈
- 是否需要复核
- 复核意见（如有）
- 知识点名称（如有）

---

## 相关文档

- **实施总结**：`docs/task2-implementation-summary.md`
- **验证脚本**：`test-scripts/task2-verification.sh`
- **需求文档**：`.kiro/specs/system-audit-bug-fixes/requirements.md`
- **设计文档**：`.kiro/specs/system-audit-bug-fixes/design.md`

---

**最后更新**：2024年
**版本**：1.0.0
