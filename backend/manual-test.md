# 作业发布接口手动测试指南

## 前提条件
1. 后端服务已启动（http://localhost:3000）
2. 数据库已创建并初始化

## 测试步骤

### 步骤1: 教师登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"teacher001\",\"password\":\"teacher123\"}"
```

**预期结果**: 返回JWT token

### 步骤2: 创建草稿作业（包含客观题）
```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d "{
    \"title\": \"测试作业\",
    \"description\": \"测试发布功能\",
    \"class_id\": 1,
    \"difficulty\": \"medium\",
    \"total_score\": 100,
    \"deadline\": \"2024-12-31 23:59:59\",
    \"questions\": [
      {
        \"question_number\": 1,
        \"question_type\": \"choice\",
        \"question_content\": \"1+1=?\",
        \"standard_answer\": \"2\",
        \"score\": 50
      },
      {
        \"question_number\": 2,
        \"question_type\": \"subjective\",
        \"question_content\": \"简述加法\",
        \"score\": 50
      }
    ]
  }"
```

**预期结果**: 返回作业ID

### 步骤3: 发布作业
```bash
curl -X POST http://localhost:3000/api/assignments/<ASSIGNMENT_ID>/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**预期结果**: 
- 作业状态变为published
- 返回通知推送的学生数量

### 步骤4: 测试客观题标准答案验证
创建一个缺少标准答案的作业：
```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d "{
    \"title\": \"缺少答案的作业\",
    \"class_id\": 1,
    \"total_score\": 100,
    \"deadline\": \"2024-12-31 23:59:59\",
    \"questions\": [
      {
        \"question_number\": 1,
        \"question_type\": \"choice\",
        \"question_content\": \"测试题\",
        \"standard_answer\": \"\",
        \"score\": 100
      }
    ]
  }"
```

然后尝试发布：
```bash
curl -X POST http://localhost:3000/api/assignments/<ASSIGNMENT_ID>/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**预期结果**: 返回400错误，提示缺少标准答案

## 功能验证清单

- [x] 接口编译成功
- [ ] 教师可以发布草稿作业
- [ ] 客观题必须有标准答案才能发布
- [ ] 发布后作业状态变为published
- [ ] 发布后推送通知到班级所有学生
- [ ] 只有教师可以发布作业
- [ ] 只能发布草稿状态的作业

## 实现的功能

### 1. 客观题标准答案验证（需求1.5）
- 检查所有客观题（choice, fill, judge）是否有标准答案
- 如果缺少标准答案，返回400错误并列出缺少答案的题号

### 2. 作业状态更新
- 将作业状态从draft更新为published

### 3. 通知推送（需求1.4）
- 查询班级所有活跃学生
- 批量插入通知到notifications表
- 返回推送的学生数量

## 代码位置
- 文件: `backend/src/routes/assignments.ts`
- 接口: `POST /api/assignments/:id/publish`
- 行数: 547-660
