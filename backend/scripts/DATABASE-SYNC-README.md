# 数据库同步系统

## 概述

数据库同步系统负责MySQL和MongoDB之间的数据同步，确保两个数据库的数据一致性。

**Requirements**: 6.8, 21.19

## 功能特性

### 1. MySQL用户ID到MongoDB的同步

- 自动检测MySQL中的新用户
- 在MongoDB中创建对应的用户行为记录
- 确保用户ID在两个数据库中保持一致

### 2. 定期统计数据同步

系统会定期同步以下统计数据：

- **课程统计**: 学习人数、完成人数、浏览次数
- **学习路径统计**: 浏览次数、注册人数
- **资源统计**: 浏览次数、点赞数
- **用户进度**: 视频完成进度同步到学习路径进度

### 3. 数据一致性检查

- 检查MySQL和MongoDB中的用户ID一致性
- 检查课程统计数据的一致性
- 自动修复发现的不一致问题

## 使用方法

### 手动同步

执行一次完整的数据同步：

```bash
npm run sync:manual
```

或者：

```bash
tsx scripts/sync-databases.ts
```

**输出示例**:
```
============================================================
数据库同步脚本
============================================================

正在连接MongoDB...
✓ MongoDB连接成功

正在测试MySQL连接...
✓ MySQL连接成功

开始执行数据库同步...
------------------------------------------------------------
开始执行数据库同步...
数据库同步完成
------------------------------------------------------------

同步结果:
  ✓ 课程统计同步成功，更新了 5 个课程
    详情: {"updatedCount":5}
  ✓ 学习路径统计同步成功，更新了 3 个路径
    详情: {"updatedCount":3}
  ✓ 资源统计同步成功，更新了 10 个资源
    详情: {"updatedCount":10}
  ✓ 用户进度同步成功，更新了 20 条记录
    详情: {"updatedCount":20}

数据一致性检查:
  ✓ 数据一致性检查通过

============================================================
同步完成
============================================================
```

### 数据一致性检查

仅执行数据一致性检查，不进行同步：

```bash
npm run sync:check
```

或者：

```bash
tsx scripts/check-data-consistency.ts
```

**输出示例**:
```
============================================================
数据一致性检查脚本
============================================================

正在连接MongoDB...
✓ MongoDB连接成功

正在测试MySQL连接...
✓ MySQL连接成功

开始检查数据一致性...
------------------------------------------------------------
------------------------------------------------------------

检查结果:
  检查时间: 2026-01-23 10:30:00
  数据一致: 否

发现 2 个问题:

问题 1:
  类型: missing_users_in_mongodb
  描述: 3 个用户在MongoDB中缺失
  影响记录数: 3

问题 2:
  类型: course_statistics_mismatch
  描述: 课程 5 的学生数不一致: MySQL=10, MongoDB=8
  影响记录数: 1

建议: 运行 npm run sync-databases 来修复这些问题

============================================================
检查完成
============================================================
```

### 自动同步服务

启动后台自动同步服务，每5分钟执行一次同步：

```bash
npm run sync:auto
```

或者：

```bash
tsx scripts/start-auto-sync.ts
```

**输出示例**:
```
============================================================
数据库自动同步服务
============================================================

正在连接MongoDB...
✓ MongoDB连接成功

正在测试MySQL连接...
✓ MySQL连接成功

启动自动同步服务...
✓ 自动同步服务已启动
  同步间隔: 5分钟
  按 Ctrl+C 停止服务

开始执行数据库同步...
数据库同步完成
```

按 `Ctrl+C` 停止服务：
```
^C
正在停止自动同步服务...
✓ 自动同步服务已停止
```

## 同步机制详解

### 1. 用户同步 (syncUserToMongoDB)

```typescript
// 检查用户是否已存在于MongoDB
const existingBehavior = await UserBehavior.findOne({ user_id: mysqlUserId });

if (!existingBehavior) {
  // 创建初始用户行为记录
  await UserBehavior.create({
    user_id: mysqlUserId,
    behavior_type: 'register',
    target_type: 'system',
    target_id: 0,
    metadata: { source: 'registration' },
    timestamp: new Date(),
    session_id: `session_${mysqlUserId}_${Date.now()}`,
    ip_address: '0.0.0.0',
    user_agent: 'system'
  });
}
```

### 2. 课程统计同步 (syncCourseStatistics)

从MongoDB聚合数据：
```typescript
// 统计完成课程的学生数
const completionStats = await UserBehavior.aggregate([
  { $match: { behavior_type: 'complete', target_type: 'course' } },
  {
    $group: {
      _id: '$target_id',
      total_students: { $addToSet: '$user_id' },
      total_completions: { $sum: 1 }
    }
  }
]);

// 更新MySQL
for (const stat of completionStats) {
  await executeQuery(
    'UPDATE courses SET total_students = ? WHERE id = ?',
    [stat.total_students.length, stat._id]
  );
}
```

### 3. 数据一致性检查 (checkDataConsistency)

```typescript
// 检查用户ID一致性
const mysqlUsers = await executeQuery('SELECT id FROM users');
const mysqlUserIds = new Set(mysqlUsers.map(u => u.id));
const mongoUserBehaviors = await UserBehavior.distinct('user_id');
const mongoUserIds = new Set(mongoUserBehaviors);

// 找出缺失的用户
const missingInMongo = Array.from(mysqlUserIds).filter(id => !mongoUserIds.has(id));

// 自动修复
for (const userId of missingInMongo) {
  await this.syncUserToMongoDB(userId);
}
```

## 数据清理

清理30天前的旧数据：

```typescript
import { databaseSyncService } from './src/services/database-sync.service';

// 清理30天前的数据
const result = await databaseSyncService.cleanupOldData(30);
console.log(result);
```

## 集成到应用

在应用启动时自动启动同步服务：

```typescript
// src/index.ts
import { databaseSyncService } from './services/database-sync.service';

// 启动服务器后
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // 启动自动同步
  databaseSyncService.startAutoSync();
});

// 优雅关闭
process.on('SIGTERM', () => {
  databaseSyncService.stopAutoSync();
  // ... 其他清理工作
});
```

## API接口

可以通过API接口触发同步：

```typescript
// routes/sync.ts
import express from 'express';
import { databaseSyncService } from '../services/database-sync.service';

const router = express.Router();

// 手动触发同步
router.post('/api/sync/manual', async (req, res) => {
  try {
    const result = await databaseSyncService.manualSync();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 检查数据一致性
router.get('/api/sync/check', async (req, res) => {
  try {
    const result = await databaseSyncService.checkDataConsistency();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

## 监控和日志

同步服务会输出详细的日志信息：

- 同步开始和结束时间
- 每个同步操作的结果
- 更新的记录数
- 发现的数据不一致问题
- 错误信息和堆栈跟踪

## 性能考虑

- **批量操作**: 使用聚合查询减少数据库往返次数
- **增量同步**: 只同步变化的数据
- **异步执行**: 同步操作不阻塞主应用
- **错误恢复**: 单个同步失败不影响其他操作

## 故障排除

### 问题: MongoDB连接失败

**解决方案**:
1. 检查MongoDB服务是否运行
2. 验证连接字符串配置
3. 检查网络连接

### 问题: MySQL连接失败

**解决方案**:
1. 检查MySQL服务是否运行
2. 验证数据库凭据
3. 检查防火墙设置

### 问题: 同步数据不一致

**解决方案**:
1. 运行 `npm run sync:check` 检查具体问题
2. 运行 `npm run sync:manual` 手动修复
3. 检查应用日志查找错误

## 最佳实践

1. **定期检查**: 每天运行一次一致性检查
2. **监控日志**: 关注同步失败的日志
3. **备份数据**: 在大规模同步前备份数据库
4. **测试环境**: 先在测试环境验证同步逻辑
5. **性能监控**: 监控同步操作的执行时间

## 相关文件

- `backend/src/services/database-sync.service.ts` - 同步服务实现
- `backend/scripts/sync-databases.ts` - 手动同步脚本
- `backend/scripts/check-data-consistency.ts` - 一致性检查脚本
- `backend/scripts/start-auto-sync.ts` - 自动同步服务脚本
- `backend/src/services/__tests__/database-sync.service.test.ts` - 单元测试

## 技术支持

如有问题，请查看：
- 应用日志: `backend/logs/`
- 测试用例: `backend/src/services/__tests__/database-sync.service.test.ts`
- 需求文档: `.kiro/specs/learning-platform-integration/requirements.md` (Requirements 6.8, 21.19)
