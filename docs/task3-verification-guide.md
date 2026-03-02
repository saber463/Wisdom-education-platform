# Task 3 验证指南

## 概述

本文档说明如何验证 Task 3（薄弱点分析400错误修复）的实施效果。

## 前置条件

### 1. 确保后端服务运行

```bash
# 进入后端目录
cd backend

# 安装依赖（如果尚未安装）
npm install

# 编译TypeScript
npm run build

# 启动后端服务
npm start
```

后端服务应该在 `http://localhost:3000` 运行。

### 2. 确保数据库运行

确保MySQL数据库服务正在运行，并且已经导入了测试数据。

### 3. 准备测试用户

确保数据库中存在以下测试用户：

- **学生**: `student001` / `password123`
- **教师**: `teacher001` / `password123`
- **管理员**: `admin` / `admin123`

## 验证方法

### 方法1: 自动化验证脚本（推荐）

#### Linux/Mac

```bash
# 赋予执行权限
chmod +x test-scripts/task3-verification.sh

# 运行验证脚本
./test-scripts/task3-verification.sh
```

#### Windows (Git Bash)

```bash
# 使用Git Bash运行
bash test-scripts/task3-verification.sh
```

#### Windows (PowerShell)

由于PowerShell不支持bash脚本，建议使用以下方法之一：
1. 安装Git Bash并使用上述命令
2. 使用WSL (Windows Subsystem for Linux)
3. 使用手动验证方法（见下文）

### 方法2: 手动验证

#### 步骤1: 获取测试令牌

```bash
# 学生登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student001","password":"password123"}'

# 教师登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher001","password":"password123"}'

# 管理员登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

保存返回的 `token` 值，用于后续测试。

#### 步骤2: 测试参数校验（Sub-task 3.1）

**测试1: 缺少必填参数（应返回400）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points" \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```

期望响应:
```json
{
  "code": 400,
  "msg": "缺少必填参数：class_id或student_id（至少提供一个）",
  "data": null
}
```

**测试2: 提供class_id参数（应返回200）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?class_id=1" \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```

期望响应:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "weak_points": [...],
    "heatmap_data": [...],
    "summary": {...}
  }
}
```

**测试3: 提供student_id参数（应返回200）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?student_id=2" \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```

#### 步骤3: 测试权限校验（Sub-task 3.2）

**测试4: 学生查询自己（应返回200）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?student_id=2" \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```

**测试5: 学生查询其他学生（应返回403）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?student_id=3" \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```

期望响应:
```json
{
  "code": 403,
  "msg": "权限不足：学生只能查询自己的薄弱点",
  "data": null
}
```

**测试6: 教师查询本班（应返回200）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?class_id=1" \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```

**测试7: 教师查询不存在的班级（应返回404）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?class_id=999" \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```

期望响应:
```json
{
  "code": 404,
  "msg": "班级不存在",
  "data": null
}
```

**测试8: 管理员查询任意班级（应返回200）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?class_id=1" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**测试9: 管理员查询任意学生（应返回200）**

```bash
curl -X GET "http://localhost:3000/api/analytics/weak-points?student_id=2" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 方法3: 使用Postman验证

1. 导入以下请求到Postman
2. 设置环境变量：
   - `base_url`: `http://localhost:3000/api`
   - `student_token`: 学生登录后的token
   - `teacher_token`: 教师登录后的token
   - `admin_token`: 管理员登录后的token

3. 按照上述测试用例逐个执行

## 验证清单

### Sub-task 3.1: 参数校验

- [ ] 测试1: 缺少必填参数返回400 ✓
- [ ] 测试2: 提供class_id参数返回200 ✓
- [ ] 测试3: 提供student_id参数返回200 ✓
- [ ] 测试4: 同时提供两个参数返回200 ✓

### Sub-task 3.2: 权限校验

- [ ] 测试5: 学生查询自己返回200 ✓
- [ ] 测试6: 学生查询其他学生返回403 ✓
- [ ] 测试7: 教师查询本班返回200 ✓
- [ ] 测试8: 教师查询不存在的班级返回404 ✓
- [ ] 测试9: 管理员查询任意班级返回200 ✓
- [ ] 测试10: 管理员查询任意学生返回200 ✓

### 响应格式验证

- [ ] 成功响应格式: `{code: 200, msg: "...", data: {...}}` ✓
- [ ] 错误响应格式: `{code: 4xx/5xx, msg: "...", data: null}` ✓

## 预期结果

### 成功标准

- 所有12个测试用例通过
- 通过率: 100%
- 响应格式统一为 `{code, msg, data}`
- 错误日志详细记录（包含时间戳、用户信息、参数、执行时长）

### 日志验证

检查后端日志，应该看到类似以下的日志输出：

**成功日志**:
```
[2024-XX-XX XX:XX:XX.XXX] 薄弱点分析成功: {
  user_id: 1,
  role: 'teacher',
  class_id: '1',
  student_id: undefined,
  target_student_count: 25,
  weak_points_count: 5,
  duration_ms: 45
}
```

**错误日志**:
```
[2024-XX-XX XX:XX:XX.XXX] 薄弱点分析参数校验失败: {
  user_id: 1,
  role: 'teacher',
  error: '缺少必填参数：class_id或student_id',
  url: '/api/analytics/weak-points',
  method: 'GET',
  query: {},
  duration_ms: 2
}
```

## 故障排查

### 问题1: 后端服务无法启动

**解决方案**:
1. 检查端口3000是否被占用
2. 检查数据库连接配置
3. 查看后端日志文件

### 问题2: 测试用户登录失败

**解决方案**:
1. 确认数据库中存在测试用户
2. 检查密码是否正确（应该是bcrypt哈希后的值）
3. 运行数据库初始化脚本

### 问题3: 所有测试返回401

**解决方案**:
1. 确认JWT令牌正确获取
2. 检查Authorization header格式: `Bearer <token>`
3. 确认JWT_SECRET配置正确

### 问题4: 权限测试失败

**解决方案**:
1. 确认测试用户的角色正确
2. 检查班级和学生的关联关系
3. 查看后端权限校验日志

## 相关文档

- [Task 3 实施总结](./task3-implementation-summary.md)
- [需求文档](../.kiro/specs/system-audit-bug-fixes/requirements.md) - 需求3
- [设计文档](../.kiro/specs/system-audit-bug-fixes/design.md) - 第3节
- [任务文档](../.kiro/specs/system-audit-bug-fixes/tasks.md) - Task 3

## 联系支持

如果在验证过程中遇到问题，请：

1. 查看后端日志文件
2. 检查数据库连接和数据
3. 参考实施总结文档
4. 联系开发团队

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护者**: AI Assistant
