-- ========================================
-- Task 10.2: 数据库字段类型修复
-- 修复score字段为INT类型，error_rate字段为DECIMAL类型
-- 添加字段注释以提高可维护性
-- ========================================

USE edu_education_platform;

-- ========================================
-- 1. 修复score相关字段类型
-- ========================================

-- 1.1 修复assignments表的total_score字段
ALTER TABLE assignments 
MODIFY COLUMN total_score INT NOT NULL COMMENT '总分';

-- 1.2 修复questions表的score字段
ALTER TABLE questions 
MODIFY COLUMN score INT NOT NULL COMMENT '分值';

-- 1.3 修复submissions表的total_score字段
ALTER TABLE submissions 
MODIFY COLUMN total_score INT DEFAULT 0 COMMENT '总得分';

-- 1.4 修复answers表的score字段
ALTER TABLE answers 
MODIFY COLUMN score INT DEFAULT 0 COMMENT '得分';

-- ========================================
-- 2. 修复error_rate字段类型
-- ========================================

-- 2.1 修复student_weak_points表的error_rate字段
ALTER TABLE student_weak_points 
MODIFY COLUMN error_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '错误率(%)';

-- ========================================
-- 3. 添加其他重要字段注释
-- ========================================

-- 3.1 作业表字段注释
ALTER TABLE assignments 
MODIFY COLUMN title VARCHAR(200) NOT NULL COMMENT '作业标题',
MODIFY COLUMN description TEXT COMMENT '作业描述',
MODIFY COLUMN class_id INT NOT NULL COMMENT '班级ID',
MODIFY COLUMN teacher_id INT NOT NULL COMMENT '教师ID',
MODIFY COLUMN difficulty ENUM('basic', 'medium', 'advanced') DEFAULT 'medium' COMMENT '难度等级',
MODIFY COLUMN deadline TIMESTAMP NOT NULL COMMENT '截止时间',
MODIFY COLUMN status ENUM('draft', 'published', 'closed') DEFAULT 'draft' COMMENT '状态';

-- 3.2 提交表字段注释
ALTER TABLE submissions 
MODIFY COLUMN assignment_id INT NOT NULL COMMENT '作业ID',
MODIFY COLUMN student_id INT NOT NULL COMMENT '学生ID',
MODIFY COLUMN file_url VARCHAR(255) COMMENT '作业文件URL',
MODIFY COLUMN submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
MODIFY COLUMN status ENUM('submitted', 'grading', 'graded', 'reviewed') DEFAULT 'submitted' COMMENT '提交状态',
MODIFY COLUMN grading_time TIMESTAMP NULL COMMENT '批改时间';

-- 3.3 答题记录表字段注释
ALTER TABLE answers 
MODIFY COLUMN submission_id INT NOT NULL COMMENT '提交ID',
MODIFY COLUMN question_id INT NOT NULL COMMENT '题目ID',
MODIFY COLUMN student_answer TEXT NOT NULL COMMENT '学生答案',
MODIFY COLUMN is_correct BOOLEAN COMMENT '是否正确',
MODIFY COLUMN ai_feedback TEXT COMMENT 'AI反馈',
MODIFY COLUMN needs_review BOOLEAN DEFAULT FALSE COMMENT '是否需要人工复核';

-- 3.4 薄弱点表字段注释
ALTER TABLE student_weak_points 
MODIFY COLUMN student_id INT NOT NULL COMMENT '学生ID',
MODIFY COLUMN knowledge_point_id INT NOT NULL COMMENT '知识点ID',
MODIFY COLUMN error_count INT DEFAULT 0 COMMENT '错误次数',
MODIFY COLUMN total_count INT DEFAULT 0 COMMENT '总答题次数',
MODIFY COLUMN last_practice_time TIMESTAMP NULL COMMENT '最后练习时间',
MODIFY COLUMN status ENUM('weak', 'improving', 'mastered') DEFAULT 'weak' COMMENT '状态';

-- ========================================
-- 4. 验证字段类型修复
-- ========================================

-- 4.1 检查score字段类型
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'edu_education_platform'
  AND COLUMN_NAME LIKE '%score%'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 4.2 检查error_rate字段类型
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'edu_education_platform'
  AND COLUMN_NAME = 'error_rate'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ========================================
-- 5. 数据一致性检查
-- ========================================

-- 5.1 检查score字段是否有非整数值
SELECT 'assignments.total_score' AS field, COUNT(*) AS invalid_count
FROM assignments
WHERE total_score IS NOT NULL AND total_score != FLOOR(total_score)
UNION ALL
SELECT 'questions.score' AS field, COUNT(*) AS invalid_count
FROM questions
WHERE score IS NOT NULL AND score != FLOOR(score)
UNION ALL
SELECT 'submissions.total_score' AS field, COUNT(*) AS invalid_count
FROM submissions
WHERE total_score IS NOT NULL AND total_score != FLOOR(total_score)
UNION ALL
SELECT 'answers.score' AS field, COUNT(*) AS invalid_count
FROM answers
WHERE score IS NOT NULL AND score != FLOOR(score);

-- 5.2 检查error_rate字段范围
SELECT 
  'student_weak_points.error_rate' AS field,
  COUNT(*) AS total_count,
  SUM(CASE WHEN error_rate < 0 THEN 1 ELSE 0 END) AS negative_count,
  SUM(CASE WHEN error_rate > 100 THEN 1 ELSE 0 END) AS over_100_count,
  MIN(error_rate) AS min_value,
  MAX(error_rate) AS max_value,
  AVG(error_rate) AS avg_value
FROM student_weak_points
WHERE error_rate IS NOT NULL;

-- ========================================
-- 修复完成
-- ========================================
SELECT '✓ Task 10.2: 字段类型修复完成！' AS message;
SELECT '✓ 所有score字段已修复为INT类型' AS message;
SELECT '✓ error_rate字段已修复为DECIMAL(5,2)类型' AS message;
SELECT '✓ 所有字段注释已添加' AS message;
