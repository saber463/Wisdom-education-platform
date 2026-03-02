# Task 10 快速参考 - 数据库SQL语法修复

## 快速开始

### 1. 运行字段类型修复

```bash
# 执行SQL修复脚本
mysql -u root < scripts/task10-fix-field-types.sql
```

### 2. 运行GROUP BY分析

```bash
# 分析所有GROUP BY查询
cd backend
npx ts-node ../scripts/task10-analyze-group-by.ts
cd ..
```

### 3. 运行验证测试

```bash
# Linux/Mac
chmod +x test-scripts/task10-verification.sh
./test-scripts/task10-verification.sh

# Windows (Git Bash)
bash test-scripts/task10-verification.sh
```

---

## 常用命令

### MySQL命令

```bash
# 检查字段类型
mysql -u root -D edu_education_platform -e "
  SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, COLUMN_COMMENT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'edu_education_platform'
    AND COLUMN_NAME LIKE '%score%'
  ORDER BY TABLE_NAME, COLUMN_NAME;
"

# 检查SQL模式
mysql -u root -e "SELECT @@sql_mode;"

# 启用严格模式
mysql -u root -e "
  SET GLOBAL sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
"

# 测试GROUP BY查询
mysql -u root -D edu_education_platform -e "
  SELECT a.id, a.title, COUNT(s.id) as submission_count
  FROM assignments a
  LEFT JOIN submissions s ON a.id = s.assignment_id
  WHERE a.class_id = 1
  GROUP BY a.id, a.title
  LIMIT 5;
"
```

---

## GROUP BY修复模板

### 模板1: 基本查询

```sql
-- 修复前
SELECT a.id, a.name, COUNT(b.id) as count
FROM table_a a
LEFT JOIN table_b b ON a.id = b.a_id
GROUP BY a.id;

-- 修复后
SELECT a.id, a.name, COUNT(b.id) as count
FROM table_a a
LEFT JOIN table_b b ON a.id = b.a_id
GROUP BY a.id, a.name;
```

### 模板2: 多表JOIN

```sql
-- 修复前
SELECT a.id, a.name, b.title, COUNT(c.id) as count
FROM table_a a
JOIN table_b b ON a.b_id = b.id
LEFT JOIN table_c c ON a.id = c.a_id
GROUP BY a.id;

-- 修复后
SELECT a.id, a.name, b.title, COUNT(c.id) as count
FROM table_a a
JOIN table_b b ON a.b_id = b.id
LEFT JOIN table_c c ON a.id = c.a_id
GROUP BY a.id, a.name, b.title;
```

### 模板3: 聚合函数

```sql
-- 修复前
SELECT student_id, AVG(score) as avg_score
FROM submissions
GROUP BY student_id;

-- 修复后（已正确，无需修改）
SELECT student_id, AVG(score) as avg_score
FROM submissions
GROUP BY student_id;
```

---

## 字段类型参考

### INT类型

```sql
-- 定义
column_name INT [NOT NULL] [DEFAULT value] COMMENT '注释'

-- 示例
total_score INT NOT NULL COMMENT '总分'
score INT DEFAULT 0 COMMENT '得分'

-- 范围
-2147483648 到 2147483647

-- 存储
4字节
```

### DECIMAL类型

```sql
-- 定义
column_name DECIMAL(M,D) [NOT NULL] [DEFAULT value] COMMENT '注释'

-- 示例
error_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '错误率(%)'

-- 说明
M: 总位数（包括小数点前后）
D: 小数位数

-- DECIMAL(5,2) 范围
-999.99 到 999.99

-- 存储
精确存储，无浮点误差
```

---

## 验证检查清单

### ✅ Task 10.1: GROUP BY语法

- [ ] 所有GROUP BY查询包含所有非聚合列
- [ ] 使用表别名保持一致性
- [ ] 按SELECT顺序列出GROUP BY列
- [ ] 符合MySQL 8.0 ONLY_FULL_GROUP_BY模式
- [ ] 查询可以正常执行

### ✅ Task 10.2: 字段类型

- [ ] assignments.total_score 为 INT 类型
- [ ] questions.score 为 INT 类型
- [ ] submissions.total_score 为 INT 类型
- [ ] answers.score 为 INT 类型
- [ ] student_weak_points.error_rate 为 DECIMAL(5,2) 类型
- [ ] 所有字段都有注释
- [ ] 数据值在有效范围内

---

## 故障排查

### 问题1: GROUP BY错误

**错误信息**:
```
Expression #2 of SELECT list is not in GROUP BY clause
```

**解决方案**:
```sql
-- 将缺失的列添加到GROUP BY
SELECT a.id, a.title, COUNT(s.id)
FROM assignments a
GROUP BY a.id, a.title;  -- 添加 a.title
```

### 问题2: 字段类型不匹配

**错误信息**:
```
Data truncated for column 'score'
```

**解决方案**:
```sql
-- 检查数据值
SELECT * FROM answers WHERE score IS NOT NULL AND score != FLOOR(score);

-- 修正数据
UPDATE answers SET score = FLOOR(score) WHERE score != FLOOR(score);
```

### 问题3: error_rate超出范围

**错误信息**:
```
Out of range value for column 'error_rate'
```

**解决方案**:
```sql
-- 检查超出范围的值
SELECT * FROM student_weak_points WHERE error_rate < 0 OR error_rate > 100;

-- 修正数据
UPDATE student_weak_points
SET error_rate = CASE
  WHEN error_rate < 0 THEN 0
  WHEN error_rate > 100 THEN 100
  ELSE error_rate
END
WHERE error_rate < 0 OR error_rate > 100;
```

---

## 文件清单

### 脚本文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `scripts/task10-fix-field-types.sql` | 字段类型修复 | SQL |
| `scripts/task10-analyze-group-by.ts` | GROUP BY分析 | TypeScript |
| `test-scripts/task10-verification.sh` | 验证测试 | Bash |

### 文档文件

| 文件 | 用途 |
|------|------|
| `docs/task10-implementation-summary.md` | 详细实施总结 |
| `docs/task10-quick-reference.md` | 快速参考（本文档） |

---

## 相关任务

- **Task 1**: 修复作业接口500错误（包含GROUP BY修复）
- **Task 11**: 数据库索引优化
- **Task 12**: 数据一致性修复

---

## 联系支持

如有问题，请参考:
- 详细文档: `docs/task10-implementation-summary.md`
- 需求文档: `.kiro/specs/system-audit-bug-fixes/requirements.md`
- 设计文档: `.kiro/specs/system-audit-bug-fixes/design.md`

---

**版本**: 1.0  
**更新**: 2024年
