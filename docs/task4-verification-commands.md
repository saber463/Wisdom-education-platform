# Task 4 验证命令

## 快速验证

### 1. 编译TypeScript代码
```bash
cd backend
npm run build
```

### 2. 启动后端服务
```bash
# 使用PM2（推荐）
pm2 restart edu-backend

# 或直接运行
npm start
```

### 3. 运行自动化测试
```bash
# 赋予执行权限
chmod +x test-scripts/task4-verification.sh

# 运行测试
./test-scripts/task4-verification.sh
```

## 手动测试命令

### 前置条件：获取测试令牌

```bash
# 学生登录 (student001, ID=2)
STUDENT_TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"student001","password":"password123"}' | jq -r '.data.token')

# 教师登录 (teacher001, ID=1)
TEACHER_TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher001","password":"password123"}' | jq -r '.data.token')

# 管理员登录
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

echo "学生令牌: $STUDENT_TOKEN"
echo "教师令牌: $TEACHER_TOKEN"
echo "管理员令牌: $ADMIN_TOKEN"
```

### Sub-task 4.2: 参数校验测试

#### 测试1: 缺少student_id参数
```bash
curl -X GET "http://localhost:3000/api/recommendations/" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 404 (路由不匹配)

#### 测试2: student_id为undefined
```bash
curl -X GET "http://localhost:3000/api/recommendations/undefined" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 400,
  "msg": "缺少必填参数：student_id",
  "data": null
}
```

#### 测试3: student_id为null
```bash
curl -X GET "http://localhost:3000/api/recommendations/null" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 400,
  "msg": "缺少必填参数：student_id",
  "data": null
}
```

#### 测试4: student_id为非数字
```bash
curl -X GET "http://localhost:3000/api/recommendations/abc" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 400,
  "msg": "student_id必须是有效的正整数",
  "data": null
}
```

#### 测试5: student_id为负数
```bash
curl -X GET "http://localhost:3000/api/recommendations/-1" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 400,
  "msg": "student_id必须是有效的正整数",
  "data": null
}
```

#### 测试6: student_id为0
```bash
curl -X GET "http://localhost:3000/api/recommendations/0" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 400,
  "msg": "student_id必须是有效的正整数",
  "data": null
}
```

#### 测试7: 提供有效的student_id
```bash
curl -X GET "http://localhost:3000/api/recommendations/2" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "student_id": 2,
    "student_name": "...",
    "weak_points": [...],
    "recommended_exercises": [...]
  }
}
```

### Sub-task 4.1: 权限控制测试

#### 测试8: 学生查询自己的推荐
```bash
curl -X GET "http://localhost:3000/api/recommendations/2" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 200 成功

#### 测试9: 学生查询其他学生的推荐
```bash
curl -X GET "http://localhost:3000/api/recommendations/3" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 403,
  "msg": "权限不足：学生只能查询自己的推荐（当前用户ID: 2, 请求查询ID: 3）",
  "data": null
}
```

#### 测试10: 教师查询本班学生的推荐
```bash
curl -X GET "http://localhost:3000/api/recommendations/2" \
  -H "Authorization: Bearer $TEACHER_TOKEN" | jq
```
**期望结果**: 200 成功

#### 测试11: 教师查询其他班级学生的推荐
```bash
curl -X GET "http://localhost:3000/api/recommendations/999" \
  -H "Authorization: Bearer $TEACHER_TOKEN" | jq
```
**期望结果**: 
```json
{
  "code": 403,
  "msg": "权限不足：教师只能查询本班学生的推荐（学生999不在您的班级中）",
  "data": null
}
```
或
```json
{
  "code": 404,
  "msg": "学生不存在",
  "data": null
}
```

#### 测试12: 管理员查询任意学生的推荐
```bash
curl -X GET "http://localhost:3000/api/recommendations/2" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```
**期望结果**: 200 成功

#### 测试13: 管理员查询另一个学生的推荐
```bash
curl -X GET "http://localhost:3000/api/recommendations/3" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```
**期望结果**: 200 成功

### 响应格式验证

#### 测试14: 验证成功响应格式
```bash
curl -X GET "http://localhost:3000/api/recommendations/2" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.code, .msg, .data | type'
```
**期望结果**: 
```
"number"
"string"
"object"
```

#### 测试15: 验证参数错误响应格式
```bash
curl -X GET "http://localhost:3000/api/recommendations/undefined" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.code, .msg, .data'
```
**期望结果**: 
```
400
"缺少必填参数：student_id"
null
```

#### 测试16: 验证权限错误响应格式
```bash
curl -X GET "http://localhost:3000/api/recommendations/3" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.code, .msg, .data'
```
**期望结果**: 
```
403
"权限不足：学生只能查询自己的推荐（当前用户ID: 2, 请求查询ID: 3）"
null
```

## 日志验证

### 查看实时日志
```bash
# 查看所有日志
tail -f backend/logs/combined.log

# 只查看错误日志
tail -f backend/logs/error.log

# 使用PM2查看日志
pm2 logs edu-backend
```

### 日志示例

#### 成功日志
```
[2024-01-01T12:00:00.000Z] 权限检查通过: 学生2查询自己的推荐
[2024-01-01T12:00:00.100Z] 个性化推荐查询成功: {
  user_id: 2,
  role: 'student',
  student_id: 2,
  weak_points_count: 3,
  recommendations_count: 10,
  duration_ms: 150
}
```

#### 参数错误日志
```
[2024-01-01T12:00:00.000Z] 个性化推荐查询失败 - 参数校验失败: {
  user_id: 2,
  role: 'student',
  student_id: 'undefined',
  error: '缺少必填参数：student_id',
  duration_ms: 5
}
```

#### 权限错误日志
```
[2024-01-01T12:00:00.000Z] 个性化推荐查询失败 - 权限不足: {
  user_id: 2,
  role: 'student',
  student_id: 3,
  reason: '权限不足：学生只能查询自己的推荐（当前用户ID: 2, 请求查询ID: 3）',
  duration_ms: 50
}
```

## 数据库验证

### 验证测试数据

```sql
-- 查看测试用户
SELECT id, username, real_name, role FROM users 
WHERE username IN ('student001', 'student002', 'teacher001', 'admin');

-- 查看班级关系
SELECT c.id, c.name, c.teacher_id, cs.student_id 
FROM classes c
JOIN class_students cs ON c.id = cs.class_id
WHERE c.teacher_id = 1 OR cs.student_id IN (2, 3);

-- 查看学生薄弱点
SELECT swp.student_id, kp.name, swp.error_rate, swp.status
FROM student_weak_points swp
JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
WHERE swp.student_id IN (2, 3)
ORDER BY swp.error_rate DESC;
```

## 性能测试

### 测试响应时间
```bash
# 参数校验失败（应该 < 5ms）
time curl -X GET "http://localhost:3000/api/recommendations/undefined" \
  -H "Authorization: Bearer $STUDENT_TOKEN" -o /dev/null -s

# 权限校验失败（应该 < 50ms）
time curl -X GET "http://localhost:3000/api/recommendations/3" \
  -H "Authorization: Bearer $STUDENT_TOKEN" -o /dev/null -s

# 成功查询（应该 < 200ms）
time curl -X GET "http://localhost:3000/api/recommendations/2" \
  -H "Authorization: Bearer $STUDENT_TOKEN" -o /dev/null -s
```

### 并发测试
```bash
# 使用Apache Bench进行并发测试
ab -n 100 -c 10 -H "Authorization: Bearer $STUDENT_TOKEN" \
  http://localhost:3000/api/recommendations/2
```

## 故障排查

### 问题1: 令牌获取失败
**症状**: 无法获取测试用户令牌

**解决方案**:
```bash
# 检查后端服务是否运行
pm2 status

# 检查数据库连接
mysql -u root -p -e "USE edu_education_platform; SELECT COUNT(*) FROM users;"

# 检查测试用户是否存在
mysql -u root -p -e "USE edu_education_platform; SELECT * FROM users WHERE username='student001';"
```

### 问题2: 403错误仍然出现
**症状**: 学生查询自己的推荐仍返回403

**解决方案**:
```bash
# 检查JWT令牌中的用户ID
echo $STUDENT_TOKEN | cut -d'.' -f2 | base64 -d | jq

# 检查数据库中的用户ID
mysql -u root -p -e "USE edu_education_platform; SELECT id FROM users WHERE username='student001';"

# 确保ID匹配
```

### 问题3: 教师权限验证失败
**症状**: 教师无法查询本班学生

**解决方案**:
```bash
# 检查班级关系
mysql -u root -p -e "
USE edu_education_platform;
SELECT c.id, c.name, c.teacher_id, cs.student_id
FROM classes c
JOIN class_students cs ON c.id = cs.class_id
WHERE c.teacher_id = 1;
"

# 确保学生在教师的班级中
```

### 问题4: 参数校验不生效
**症状**: 无效参数仍返回200

**解决方案**:
```bash
# 检查代码是否已编译
ls -la backend/dist/routes/recommendations.js

# 重新编译
cd backend && npm run build

# 重启服务
pm2 restart edu-backend
```

## 回滚方案

如果修复出现问题，可以回滚到修复前的版本：

```bash
# 使用Git回滚
git checkout HEAD~1 backend/src/routes/recommendations.ts

# 重新编译
cd backend && npm run build

# 重启服务
pm2 restart edu-backend
```

## 相关文档

- **实施总结**: `docs/task4-implementation-summary.md`
- **测试脚本**: `test-scripts/task4-verification.sh`
- **需求文档**: `.kiro/specs/system-audit-bug-fixes/requirements.md`
- **设计文档**: `.kiro/specs/system-audit-bug-fixes/design.md`
- **任务文档**: `.kiro/specs/system-audit-bug-fixes/tasks.md`

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护人员**: System Audit Team
