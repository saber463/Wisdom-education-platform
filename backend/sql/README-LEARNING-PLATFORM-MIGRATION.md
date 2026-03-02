# 学习平台集成数据库迁移指南

## 概述

本迁移脚本为学习平台集成功能创建所有必需的MySQL数据库表，包括：

- 课程体系相关表（9个表）
- 学习路径相关表（6个表）
- 用户兴趣调查表（1个表）
- AI动态学习路径表（1个表）
- 虚拟学习伙伴表（2个表）
- 视频答题与错题本表（3个表）
- 扩展现有通知表和作业表

**总计**: 22个新表 + 2个表扩展

## 前置要求

1. MySQL 8.0 或更高版本
2. 已存在的数据库: `edu_education_platform`
3. 已创建基础表（users, classes, assignments等）
4. Node.js 16+ （用于运行测试脚本）

## 执行迁移

### 方法1: 使用MySQL命令行

```bash
mysql -u root -p edu_education_platform < backend/sql/learning-platform-integration-tables.sql
```

### 方法2: 使用MySQL Workbench

1. 打开MySQL Workbench
2. 连接到数据库
3. 打开 `learning-platform-integration-tables.sql` 文件
4. 点击执行（⚡图标）

### 方法3: 使用Navicat

1. 打开Navicat
2. 连接到 `edu_education_platform` 数据库
3. 点击"查询" → "新建查询"
4. 粘贴SQL内容并执行

## 运行测试

迁移完成后，运行测试脚本验证所有表、外键和索引是否正确创建：

```bash
cd backend
node scripts/test-learning-platform-migration.cjs
```

### 测试内容

测试脚本会验证以下内容：

1. ✓ 执行迁移脚本
2. ✓ 验证所有22个表创建成功
3. ✓ 验证外键约束正确（21个表的外键）
4. ✓ 验证索引存在（每个表至少有指定数量的索引）
5. ✓ 测试索引性能（查询应在10ms内完成）
6. ✓ 测试级联删除（删除课程应级联删除分支和课节）
7. ✓ 测试唯一约束（user_points的user_id唯一性）
8. ✓ 测试JSON字段（user_interests的JSON数组）
9. ✓ 测试ENUM字段（difficulty等枚举值）
10. ✓ 测试通知表扩展（priority, action_url等新字段）

### 预期输出

```
========================================
学习平台集成数据库迁移测试
========================================

连接数据库...
✓ 数据库连接成功

开始测试...

✓ 测试1: 执行迁移脚本
✓ 测试2: 验证所有表创建成功
✓ 测试3: 验证外键约束正确
✓ 测试4: 验证索引存在
✓ 测试5: 测试索引性能
✓ 测试6: 测试级联删除
✓ 测试7: 测试唯一约束
✓ 测试8: 测试JSON字段
✓ 测试9: 测试ENUM字段
✓ 测试10: 测试通知表扩展

========================================
测试结果汇总
========================================
总测试数: 10
通过: 10
失败: 0

✓ 所有测试通过！
```

## 创建的表结构

### 第一部分：课程体系相关表

1. **courses** - 课程表（编程语言课程）
2. **course_branches** - 课程分支表（学习方向）
3. **course_lessons** - 课节表（具体课程内容）
4. **course_purchases** - 课程购买表（购买记录）
5. **course_classes** - 课程班级表（每个分支6个班级）
6. **course_reviews** - 课程评价表（学生评价）
7. **memberships** - 会员表（VIP会员）
8. **user_points** - 积分表（用户积分）
9. **point_transactions** - 积分交易表（积分变动记录）

### 第二部分：学习路径相关表

10. **learning_paths** - 学习路径表
11. **learning_path_steps** - 学习路径步骤表
12. **learning_resources** - 学习资源表
13. **resource_favorites** - 资源收藏表
14. **learning_progress** - 学习进度表
15. **resource_knowledge_points** - 资源知识点关联表

### 第三部分：用户兴趣调查表

16. **user_interests** - 用户兴趣表（问卷数据）

### 第四部分：AI动态学习路径表

17. **knowledge_mastery** - 知识点掌握度表

### 第五部分：虚拟学习伙伴表

18. **virtual_partners** - 虚拟学习伙伴表
19. **collaborative_tasks** - 共同任务表

### 第六部分：视频答题与错题本表

20. **video_quiz_questions** - 视频答题题库表
21. **wrong_question_book** - 错题本表
22. **video_quiz_records** - 视频答题记录表

### 表扩展

- **notifications** - 扩展通知表（添加priority, action_url, expires_at, metadata字段）
- **assignments** - 扩展作业表（添加learning_path_id字段）

## 关键特性

### 外键约束

所有表都正确设置了外键约束，确保数据完整性：

- `ON DELETE CASCADE` - 级联删除（如删除课程会自动删除相关分支和课节）
- `ON DELETE SET NULL` - 设置为NULL（如删除作业不影响学习路径步骤）

### 索引优化

每个表都创建了必要的索引以优化查询性能：

- 主键索引（自动创建）
- 外键索引（自动创建）
- 查询优化索引（is_hot, difficulty, status等）
- 全文索引（learning_resources的title和description）

### JSON字段

支持JSON数据类型，用于存储数组和对象：

- `user_interests.interested_languages` - 编程语言数组
- `user_interests.interested_directions` - 技术方向数组
- `course_reviews.tags` - 评价标签数组
- `video_quiz_questions.options` - 题目选项数组

### ENUM字段

使用ENUM类型确保数据一致性：

- `difficulty` - beginner, intermediate, advanced
- `status` - draft, published, archived等
- `role` - teacher, student, parent

## 故障排除

### 问题1: 表已存在

如果表已存在，脚本会跳过创建（使用`IF NOT EXISTS`）。如需重新创建，请先删除表：

```sql
DROP TABLE IF EXISTS video_quiz_records;
DROP TABLE IF EXISTS wrong_question_book;
DROP TABLE IF EXISTS video_quiz_questions;
-- ... 按依赖顺序删除其他表
```

### 问题2: 外键约束失败

确保基础表（users, classes, assignments, knowledge_points）已存在。

### 问题3: 字符集问题

确保数据库使用UTF8MB4字符集：

```sql
ALTER DATABASE edu_education_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题4: 测试失败

如果测试失败，检查：

1. 数据库连接配置（.env文件）
2. MySQL版本（需要8.0+）
3. 用户权限（需要CREATE, ALTER, DROP权限）

## 回滚迁移

如需回滚迁移，按以下顺序删除表（避免外键约束错误）：

```sql
-- 删除依赖表
DROP TABLE IF EXISTS video_quiz_records;
DROP TABLE IF EXISTS wrong_question_book;
DROP TABLE IF EXISTS video_quiz_questions;
DROP TABLE IF EXISTS collaborative_tasks;
DROP TABLE IF EXISTS virtual_partners;
DROP TABLE IF EXISTS knowledge_mastery;
DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS resource_knowledge_points;
DROP TABLE IF EXISTS learning_progress;
DROP TABLE IF EXISTS resource_favorites;
DROP TABLE IF EXISTS learning_resources;
DROP TABLE IF EXISTS learning_path_steps;
DROP TABLE IF EXISTS learning_paths;
DROP TABLE IF EXISTS point_transactions;
DROP TABLE IF EXISTS user_points;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS course_reviews;
DROP TABLE IF EXISTS course_classes;
DROP TABLE IF EXISTS course_purchases;
DROP TABLE IF EXISTS course_lessons;
DROP TABLE IF EXISTS course_branches;
DROP TABLE IF EXISTS courses;

-- 回滚通知表扩展
ALTER TABLE notifications 
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS action_url,
  DROP COLUMN IF EXISTS priority;

-- 回滚作业表扩展
ALTER TABLE assignments 
  DROP FOREIGN KEY IF EXISTS fk_assignments_learning_path,
  DROP COLUMN IF EXISTS learning_path_id;
```

## 下一步

迁移完成后，可以开始：

1. 实现后端API接口（参考 `tasks.md` 的 Phase 2-3）
2. 创建MongoDB集合（参考 `tasks.md` 的 Task 2）
3. 开发前端界面（参考 `tasks.md` 的 Phase 4-5）

## 相关文档

- [需求文档](../../.kiro/specs/learning-platform-integration/requirements.md)
- [设计文档](../../.kiro/specs/learning-platform-integration/design.md)
- [任务列表](../../.kiro/specs/learning-platform-integration/tasks.md)

## 支持

如有问题，请查看：

1. MySQL错误日志
2. 测试脚本输出
3. 设计文档中的数据库架构说明
