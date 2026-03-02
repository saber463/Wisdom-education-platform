# 扩展题库使用说明

## 概述

本扩展题库为智慧教育学习平台提供了覆盖**1年级到大三**的全面题库数据，包含**500+道题目**。

## 文件结构

```
docs/sql/
├── schema.sql                          # 数据库表结构（必须先执行）
├── test-data.sql                       # 基础测试数据（100道题目）
├── extended-exercise-bank.sql          # 扩展知识点 + 小学1-6年级题目
├── extended-exercise-bank-part2.sql    # 初中7-9年级题目
├── extended-exercise-bank-part3.sql    # 高中1-3年级题目
├── extended-exercise-bank-part4.sql    # 大学1-3年级题目
└── README-EXTENDED-BANK.md            # 本说明文件
```

## 覆盖范围

### 年级覆盖
- **小学**：一年级 ~ 六年级
- **初中**：七年级 ~ 九年级
- **高中**：高一 ~ 高三
- **大学**：大一 ~ 大三

### 科目覆盖

#### 小学（1-6年级）
- 数学、语文、英语、科学

#### 初中（7-9年级）
- 数学、语文、英语、物理、化学、生物、历史、地理、政治

#### 高中（1-3年级）
- 数学、语文、英语、物理、化学、生物、历史、地理、政治

#### 大学（1-3年级）
- 高等数学、线性代数、概率统计
- 大学英语、大学物理、大学化学
- 计算机基础、程序设计、数据结构、操作系统、数据库、计算机网络

## 数据统计

### 知识点数量
- 原有知识点：20个
- 新增知识点：约120个
- **总计：约140个知识点**

### 题目数量
- 原有题目：100道
- 新增题目：约500道
- **总计：约600道题目**

### 题型分布
- **填空题（fill）**：约40%
- **选择题（choice）**：约25%
- **判断题（judge）**：约20%
- **主观题（subjective）**：约15%

### 难度分布
- **基础（basic）**：约30%
- **中等（medium）**：约50%
- **高级（advanced）**：约20%

## 导入步骤

### 方法一：完整导入（推荐用于新数据库）

```bash
# 1. 创建数据库表结构
mysql -u root -p edu_education_platform < docs/sql/schema.sql

# 2. 导入基础测试数据
mysql -u root -p edu_education_platform < docs/sql/test-data.sql

# 3. 导入扩展题库（按顺序）
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank.sql
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part2.sql
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part3.sql
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part4.sql
```

### 方法二：仅导入扩展题库（用于已有数据库）

如果数据库已经存在并且已导入基础数据，只需导入扩展题库：

```bash
# 导入扩展题库（按顺序）
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank.sql
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part2.sql
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part3.sql
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part4.sql
```

### 方法三：使用Windows批处理脚本

创建 `import-extended-bank.bat` 文件：

```batch
@echo off
echo 正在导入扩展题库...
echo.

echo [1/4] 导入小学题目...
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank.sql

echo [2/4] 导入初中题目...
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part2.sql

echo [3/4] 导入高中题目...
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part3.sql

echo [4/4] 导入大学题目...
mysql -u root -p edu_education_platform < docs/sql/extended-exercise-bank-part4.sql

echo.
echo 扩展题库导入完成！
pause
```

## 验证导入

导入完成后，可以执行以下SQL验证：

```sql
-- 查看知识点总数
SELECT COUNT(*) AS knowledge_points_count FROM knowledge_points;

-- 查看题库总数
SELECT COUNT(*) AS exercise_bank_count FROM exercise_bank;

-- 按年级统计知识点
SELECT grade, COUNT(*) AS count 
FROM knowledge_points 
GROUP BY grade 
ORDER BY 
  CASE grade
    WHEN '一年级' THEN 1
    WHEN '二年级' THEN 2
    WHEN '三年级' THEN 3
    WHEN '四年级' THEN 4
    WHEN '五年级' THEN 5
    WHEN '六年级' THEN 6
    WHEN '七年级' THEN 7
    WHEN '八年级' THEN 8
    WHEN '九年级' THEN 9
    WHEN '高一' THEN 10
    WHEN '高二' THEN 11
    WHEN '高三' THEN 12
    WHEN '大一' THEN 13
    WHEN '大二' THEN 14
    WHEN '大三' THEN 15
  END;

-- 按科目统计题目
SELECT subject, COUNT(*) AS count 
FROM knowledge_points 
GROUP BY subject 
ORDER BY count DESC;

-- 按难度统计题目
SELECT difficulty, COUNT(*) AS count 
FROM exercise_bank 
GROUP BY difficulty;

-- 按题型统计题目
SELECT question_type, COUNT(*) AS count 
FROM exercise_bank 
GROUP BY question_type;
```

## 注意事项

### 知识点ID映射
扩展题库中的 `knowledge_point_id` 是基于以下假设：
- 原有知识点ID：1-20
- 新增知识点ID：从21开始

如果实际ID不同，需要调整SQL文件中的ID值。

### 字符编码
所有SQL文件使用 **UTF8MB4** 编码，确保正确显示中文。

### 外键约束
导入时会自动关联到 `knowledge_points` 表，确保知识点数据已存在。

### 数据清理
如需重新导入，可以先清空相关表：

```sql
-- 清空题库（保留知识点）
TRUNCATE TABLE exercise_bank;

-- 清空知识点和题库（完全重置）
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE exercise_bank;
TRUNCATE TABLE knowledge_points;
SET FOREIGN_KEY_CHECKS = 1;
```

## 题目示例

### 小学一年级数学
```
题目：5 + 6 = ?
类型：填空题
难度：基础
答案：11
```

### 初中七年级数学
```
题目：解方程：2x + 5 = 13
类型：填空题
难度：中等
答案：x=4
```

### 高中一年级数学
```
题目：log₂8 = ?
类型：填空题
难度：中等
答案：3
```

### 大学一年级高等数学
```
题目：lim(x→0) sinx/x = ?
类型：填空题
难度：高级
答案：1
```

## 后续扩展

如需继续扩展题库，建议：

1. **按年级和科目分类**：便于管理和维护
2. **保持ID连续性**：新增知识点从最大ID+1开始
3. **标注题目来源**：便于追溯和更新
4. **定期审核题目**：确保准确性和时效性

## 技术支持

如有问题，请参考：
- 数据库表结构：`docs/sql/schema.sql`
- 基础测试数据：`docs/sql/test-data.sql`
- 项目文档：`docs/README.md`

---

**创建日期**：2025-01-15  
**版本**：v1.0  
**维护者**：智慧教育学习平台开发团队
