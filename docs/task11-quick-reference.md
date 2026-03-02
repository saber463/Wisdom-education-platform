# Task 11: 数据库索引优化 - 快速参考

## 快速开始

### 1. 添加索引（必须）

```bash
# Linux/Mac
mysql -u root -p edu_education_platform < scripts/task11-add-indexes.sql

# Windows
mysql -u root -p edu_education_platform < scripts\task11-add-indexes.sql
```

### 2. 验证索引（推荐）

```bash
# Linux/Mac
bash test-scripts/task11-verification.sh

# Windows
powershell -ExecutionPolicy Bypass -File test-scripts/task11-verification.ps1
```

### 3. 性能测试（可选）

```bash
# Linux/Mac
bash test-scripts/task11-performance-test.sh
```

### 4. 索引分析（可选）

```bash
# 需要Node.js和TypeScript
npx ts-node scripts/task11-analyze-indexes.ts
```

## 索引列表

| # | 表名 | 索引名 | 列 | 用途 |
|---|------|--------|-----|------|
| 1 | assignments | idx_class_deadline | class_id, deadline | 按班级和截止时间查询作业 |
| 2 | assignments | idx_teacher_status | teacher_id, status | 按教师和状态查询作业 |
| 3 | submissions | idx_assignment_status | assignment_id, status | 按作业和状态查询提交 |
| 4 | submissions | idx_student_submit_time | student_id, submit_time | 按学生和提交时间查询 |
| 5 | answers | idx_submission_question | submission_id, question_id | 按提交和题目查询答题 |
| 6 | answers | idx_needs_review | needs_review | 查询需要复核的答题 |
| 7 | student_weak_points | idx_student_error_rate | student_id, error_rate | 按学生和错误率查询薄弱点 |
| 8 | student_weak_points | idx_knowledge_status | knowledge_point_id, status | 按知识点和状态查询 |
| 9 | resource_recommendations | idx_user_score | user_id, recommendation_score | 按用户和评分查询推荐 |
| 10 | resource_recommendations | idx_recommended_at | created_at | 按推荐时间查询 |

## 常用SQL命令

### 查看索引

```sql
-- 查看某表的所有索引
SHOW INDEX FROM assignments;

-- 查看索引详细信息
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    CARDINALITY,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'edu_education_platform'
  AND TABLE_NAME = 'assignments'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
```

### 分析查询

```sql
-- 查看查询执行计划
EXPLAIN SELECT * FROM assignments WHERE class_id = 1 AND deadline > NOW();

-- 详细执行计划（MySQL 8.0.18+）
EXPLAIN ANALYZE SELECT * FROM assignments WHERE class_id = 1 AND deadline > NOW();
```

### 更新索引统计

```sql
-- 更新单个表
ANALYZE TABLE assignments;

-- 更新多个表
ANALYZE TABLE assignments, submissions, answers, student_weak_points, resource_recommendations;
```

### 删除索引（如需要）

```sql
-- 删除索引
ALTER TABLE assignments DROP INDEX idx_class_deadline;

-- 删除多个索引
ALTER TABLE assignments 
    DROP INDEX idx_class_deadline,
    DROP INDEX idx_teacher_status;
```

## 性能优化查询示例

### 作业查询

```sql
-- ✓ 使用 idx_class_deadline
SELECT * FROM assignments 
WHERE class_id = 1 AND deadline > NOW() 
ORDER BY deadline;

-- ✓ 使用 idx_teacher_status
SELECT * FROM assignments 
WHERE teacher_id = 1 AND status = 'published' 
ORDER BY created_at DESC;
```

### 提交查询

```sql
-- ✓ 使用 idx_assignment_status
SELECT * FROM submissions 
WHERE assignment_id = 1 AND status = 'graded';

-- ✓ 使用 idx_student_submit_time
SELECT * FROM submissions 
WHERE student_id = 1 
ORDER BY submit_time DESC 
LIMIT 10;
```

### 答题记录查询

```sql
-- ✓ 使用 idx_submission_question
SELECT * FROM answers 
WHERE submission_id = 1 AND question_id = 1;

-- ✓ 使用 idx_needs_review
SELECT * FROM answers 
WHERE needs_review = TRUE 
LIMIT 20;
```

### 薄弱点查询

```sql
-- ✓ 使用 idx_student_error_rate
SELECT * FROM student_weak_points 
WHERE student_id = 1 
ORDER BY error_rate DESC 
LIMIT 10;

-- ✓ 使用 idx_knowledge_status
SELECT * FROM student_weak_points 
WHERE knowledge_point_id = 1 AND status = 'weak';
```

### 推荐查询

```sql
-- ✓ 使用 idx_user_score
SELECT * FROM resource_recommendations 
WHERE user_id = 1 
ORDER BY recommendation_score DESC 
LIMIT 10;

-- ✓ 使用 idx_recommended_at
SELECT * FROM resource_recommendations 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
ORDER BY created_at DESC;
```

## 故障排查

### 问题1: 索引未创建

**症状**: 验证脚本显示索引不存在

**解决方案**:
```bash
# 1. 检查数据库连接
mysql -u root -p -e "SELECT 1"

# 2. 手动运行索引脚本
mysql -u root -p edu_education_platform < scripts/task11-add-indexes.sql

# 3. 检查错误日志
# Linux: /var/log/mysql/error.log
# Windows: C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err
```

### 问题2: 查询未使用索引

**症状**: EXPLAIN显示type=ALL（全表扫描）

**解决方案**:
```sql
-- 1. 更新索引统计
ANALYZE TABLE assignments;

-- 2. 检查查询条件是否符合最左前缀原则
-- ✗ 不使用索引
WHERE deadline > NOW()

-- ✓ 使用索引
WHERE class_id = 1 AND deadline > NOW()

-- 3. 强制使用索引（测试用）
SELECT * FROM assignments FORCE INDEX (idx_class_deadline)
WHERE class_id = 1 AND deadline > NOW();
```

### 问题3: 索引基数为0或NULL

**症状**: SHOW INDEX显示Cardinality为0

**解决方案**:
```sql
-- 1. 更新索引统计
ANALYZE TABLE assignments;

-- 2. 优化表
OPTIMIZE TABLE assignments;

-- 3. 重建索引（如果问题持续）
ALTER TABLE assignments DROP INDEX idx_class_deadline;
ALTER TABLE assignments ADD INDEX idx_class_deadline (class_id, deadline);
```

### 问题4: 性能未改善

**症状**: 添加索引后查询仍然很慢

**可能原因**:
1. 数据量太小，索引优势不明显
2. 查询条件不符合索引设计
3. 索引统计信息过期
4. 表需要优化

**解决方案**:
```sql
-- 1. 检查表大小
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'edu_education_platform'
  AND TABLE_NAME = 'assignments';

-- 2. 更新统计信息
ANALYZE TABLE assignments;

-- 3. 优化表
OPTIMIZE TABLE assignments;

-- 4. 使用EXPLAIN分析
EXPLAIN SELECT * FROM assignments WHERE class_id = 1 AND deadline > NOW();
```

## 维护计划

### 每日

- 监控慢查询日志
- 检查数据库错误日志

### 每周

- 更新索引统计信息（ANALYZE TABLE）
- 检查索引使用情况
- 分析慢查询并优化

### 每月

- 优化表（OPTIMIZE TABLE）
- 检查索引碎片
- 评估是否需要新增索引

### 每季度

- 全面性能测试
- 索引使用情况分析
- 清理无用索引

## 相关文档

- **详细实施总结**: `docs/task11-implementation-summary.md`
- **索引分析报告**: `docs/task11-index-analysis-report.txt` (运行分析脚本后生成)
- **性能测试报告**: `docs/task11-performance-report.txt` (运行性能测试后生成)

## 联系支持

如有问题，请查看：
1. 详细实施总结文档
2. 运行验证脚本查看具体错误
3. 检查MySQL错误日志

---

**版本**: 1.0  
**更新时间**: 2024年
