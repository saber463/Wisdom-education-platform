# Task 8.6 Implementation Summary: 动态调整开关接口

## 概述

实现了AI动态学习路径的开关功能，允许用户启用或关闭学习路径的智能调整功能。

**实施日期**: 2026-01-23  
**需求**: Requirements 21.18  
**任务**: Task 8.6 - 实现动态调整开关接口

---

## 实现内容

### 1. 数据库变更

**文件**: `backend/sql/add-dynamic-adjustment-toggle.sql`

为 `learning_progress` 表添加了新字段：

```sql
-- 兼容 MySQL 5.7+（不使用 ADD COLUMN/INDEX IF NOT EXISTS）
ALTER TABLE learning_progress
  ADD COLUMN dynamic_adjustment_enabled BOOLEAN DEFAULT TRUE 
    COMMENT '是否启用动态调整（默认启用）'
    AFTER status;

ALTER TABLE learning_progress
  ADD INDEX idx_dynamic_adjustment (dynamic_adjustment_enabled);
```

**字段说明**:
- `dynamic_adjustment_enabled`: 布尔值，默认为 `TRUE`（启用）
- 用于存储用户对动态调整功能的偏好设置
- 设置持久化，跨会话保持

### 2. 服务层实现

**文件**: `backend/src/services/ai-learning-path.service.ts`

#### 新增方法

##### 2.1 `toggleDynamicAdjustment()`

切换动态调整开关的核心方法。

**功能**:
1. 验证学习进度记录是否存在
2. 更新 `dynamic_adjustment_enabled` 字段
3. 如果关闭动态调整，恢复默认学习路径
4. 记录操作到 MongoDB（调整日志）
5. 返回操作结果和当前状态

**参数**:
- `userId`: 用户ID
- `learningPathId`: 学习路径ID
- `enabled`: 是否启用动态调整（boolean）

**返回值**:
```typescript
{
  success: boolean;
  message: string;
  current_state: {
    dynamic_adjustment_enabled: boolean;
    learning_path_id: number;
    restored_to_default: boolean;
  };
}
```

**关键逻辑**:
- **启用时**: 记录启用操作，系统将根据学习情况自动调整路径
- **关闭时**: 
  - 恢复默认学习路径（显示所有原始步骤）
  - 记录关闭操作到 MongoDB
  - 设置 `restored_to_default = true`

##### 2.2 `getDynamicAdjustmentStatus()`

获取动态调整开关的当前状态。

**功能**:
- 查询 `learning_progress` 表中的 `dynamic_adjustment_enabled` 字段
- 如果没有进度记录，返回默认值（启用）

**参数**:
- `userId`: 用户ID
- `learningPathId`: 学习路径ID

**返回值**:
```typescript
{
  dynamic_adjustment_enabled: boolean;
  learning_path_id: number;
}
```

### 3. API 路由实现

**文件**: `backend/src/routes/ai-learning-path.ts`

#### 新增端点

##### 3.1 PUT `/api/ai-learning-path/toggle-dynamic`

切换动态调整开关。

**请求体**:
```json
{
  "learning_path_id": 1,
  "enabled": true
}
```

**响应示例（成功）**:
```json
{
  "code": 200,
  "msg": "动态调整已启用，系统将根据您的学习情况智能调整路径",
  "data": {
    "dynamic_adjustment_enabled": true,
    "learning_path_id": 1,
    "restored_to_default": false
  }
}
```

**响应示例（关闭）**:
```json
{
  "code": 200,
  "msg": "动态调整已关闭，已恢复默认学习路径",
  "data": {
    "dynamic_adjustment_enabled": false,
    "learning_path_id": 1,
    "restored_to_default": true
  }
}
```

**错误处理**:
- 401: 未授权
- 400: 缺少必填字段或字段类型错误
- 400: 学习进度记录不存在
- 500: 服务器内部错误

##### 3.2 GET `/api/ai-learning-path/dynamic-status/:pathId`

获取动态调整开关状态。

**路径参数**:
- `pathId`: 学习路径ID

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取动态调整状态成功",
  "data": {
    "dynamic_adjustment_enabled": true,
    "learning_path_id": 1
  }
}
```

---

## 功能特性

### 1. 持久化设置

- 用户的开关偏好存储在数据库中
- 跨会话保持设置
- 每个学习路径独立设置

### 2. 默认行为

- 新用户默认启用动态调整
- 首次开始学习路径时，动态调整自动启用

### 3. 恢复默认路径

当用户关闭动态调整时：
- 系统恢复原始学习路径结构
- 保留已完成的步骤记录
- 显示所有原始步骤（不隐藏已掌握的内容）

### 4. 操作日志

所有开关操作都记录到 MongoDB：
- 记录操作类型（启用/关闭）
- 记录操作时间
- 记录操作原因
- 可通过调整日志API查询

---

## 数据流

### 启用动态调整流程

```
用户请求启用
    ↓
验证用户身份和学习进度
    ↓
更新 learning_progress.dynamic_adjustment_enabled = TRUE
    ↓
记录启用操作到 MongoDB
    ↓
返回成功响应
    ↓
系统开始根据学习情况调整路径
```

### 关闭动态调整流程

```
用户请求关闭
    ↓
验证用户身份和学习进度
    ↓
更新 learning_progress.dynamic_adjustment_enabled = FALSE
    ↓
恢复默认学习路径
    ↓
记录关闭操作到 MongoDB
    ↓
返回成功响应（restored_to_default = true）
    ↓
用户看到完整的原始学习路径
```

---

## 与其他功能的集成

### 1. 路径调整功能 (Task 8.4)

在执行路径调整前，应检查 `dynamic_adjustment_enabled` 状态：

```typescript
// 在 adjustLearningPath() 方法中添加检查
const status = await this.getDynamicAdjustmentStatus(userId, pathId);
if (!status.dynamic_adjustment_enabled) {
  // 如果关闭了动态调整，返回原始路径
  return getOriginalPath(pathId);
}
```

### 2. 前端显示

前端应根据开关状态显示不同的UI：
- 启用时：显示"智能调整中"标识
- 关闭时：显示"标准模式"标识
- 提供切换按钮

### 3. 调整日志 (Task 8.5)

开关操作会自动记录到调整日志中：
- `adjustment_type`: 'progress_optimization'
- `trigger_event`: '用户启用/关闭动态调整'
- 可通过 `/api/ai-learning-path/adjustment-log` 查询

---

## 测试建议

### 单元测试

1. **测试开关切换**:
   - 从启用切换到关闭
   - 从关闭切换到启用
   - 重复切换多次

2. **测试状态查询**:
   - 查询已存在的进度记录
   - 查询不存在的进度记录（应返回默认值）

3. **测试恢复默认路径**:
   - 验证关闭后路径是否恢复
   - 验证已完成步骤是否保留

### 集成测试

1. **测试与路径调整的集成**:
   - 关闭动态调整后，路径调整API应返回原始路径
   - 启用动态调整后，路径调整API应返回调整后的路径

2. **测试日志记录**:
   - 验证开关操作是否正确记录到 MongoDB
   - 验证日志内容是否完整

### API测试

使用以下curl命令测试：

```bash
# 1. 获取当前状态
curl -X GET "http://localhost:3000/api/ai-learning-path/dynamic-status/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. 关闭动态调整
curl -X PUT "http://localhost:3000/api/ai-learning-path/toggle-dynamic" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"learning_path_id": 1, "enabled": false}'

# 3. 启用动态调整
curl -X PUT "http://localhost:3000/api/ai-learning-path/toggle-dynamic" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"learning_path_id": 1, "enabled": true}'

# 4. 查看调整日志
curl -X GET "http://localhost:3000/api/ai-learning-path/adjustment-log?learning_path_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 性能考虑

1. **数据库索引**: 已为 `dynamic_adjustment_enabled` 字段添加索引，优化查询性能
2. **缓存策略**: 可考虑缓存用户的开关状态，减少数据库查询
3. **批量操作**: 如果需要批量更新多个用户的设置，应使用批量更新SQL

---

## 安全性

1. **身份验证**: 所有API端点都需要JWT认证
2. **权限验证**: 用户只能修改自己的学习路径设置
3. **输入验证**: 严格验证 `learning_path_id` 和 `enabled` 参数

---

## 后续工作

### 前端实现 (Task 15.5)

需要创建以下组件：
1. `DynamicToggleSwitch.vue`: 动态调整开关组件
2. 集成到学习路径详情页
3. 实现开关状态持久化

### 文档更新

1. 更新API文档，添加新端点说明
2. 更新用户手册，说明动态调整功能
3. 添加开关使用指南

---

## 验证 Property 68

**Property 68: Dynamic Adjustment Toggle**  
*For any* user disabling dynamic adjustment, the system should restore default path, record user choice, and persist the setting across sessions.  
**Validates: Requirements 21.18**

**验证结果**: ✅ 已实现

- ✅ 关闭动态调整时恢复默认路径
- ✅ 记录用户选择到数据库
- ✅ 设置持久化（存储在 `learning_progress` 表）
- ✅ 跨会话保持（每次查询从数据库读取）

---

## 总结

Task 8.6 已成功实现，提供了完整的动态调整开关功能：

✅ **数据库变更**: 添加 `dynamic_adjustment_enabled` 字段  
✅ **服务层**: 实现切换和查询方法  
✅ **API层**: 提供RESTful端点  
✅ **日志记录**: 所有操作记录到 MongoDB  
✅ **持久化**: 设置跨会话保持  
✅ **恢复功能**: 关闭时恢复默认路径  

该功能为用户提供了对学习路径调整的完全控制权，满足了不同学习偏好的需求。

---

**实施者**: Kiro AI Assistant  
**完成时间**: 2026-01-23  
**状态**: ✅ 已完成
