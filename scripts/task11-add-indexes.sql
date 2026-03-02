-- ========================================
-- Task 11: Database Index Optimization
-- 数据库索引优化脚本
-- ========================================
-- 目标：为高频查询字段添加索引，优化查询性能
-- 需求：8.2 - 高频查询执行时使用索引优化查询性能
-- ========================================

USE edu_education_platform;

-- ========================================
-- 检查并显示当前索引状态
-- ========================================
SELECT '========================================' AS '';
SELECT 'Task 11: 数据库索引优化开始' AS '';
SELECT '========================================' AS '';

-- ========================================
-- 11.1 作业表索引优化
-- ========================================
SELECT '' AS '';
SELECT '11.1 作业表索引优化...' AS '';

-- 检查 idx_class_deadline 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'assignments' 
    AND index_name = 'idx_class_deadline'
);

-- 添加 idx_class_deadline 索引（如果不存在）
-- 用途：优化按班级和截止时间查询作业的场景
-- 场景：教师查看班级即将到期的作业、学生查看班级作业列表
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE assignments ADD INDEX idx_class_deadline (class_id, deadline)',
  'SELECT "索引 idx_class_deadline 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查 idx_teacher_status 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'assignments' 
    AND index_name = 'idx_teacher_status'
);

-- 添加 idx_teacher_status 索引（如果不存在）
-- 用途：优化按教师和状态查询作业的场景
-- 场景：教师查看自己创建的草稿/已发布/已关闭作业
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE assignments ADD INDEX idx_teacher_status (teacher_id, status)',
  'SELECT "索引 idx_teacher_status 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✓ 作业表索引优化完成' AS '';

-- ========================================
-- 11.2 提交表索引优化
-- ========================================
SELECT '' AS '';
SELECT '11.2 提交表索引优化...' AS '';

-- 检查 idx_assignment_status 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'submissions' 
    AND index_name = 'idx_assignment_status'
);

-- 添加 idx_assignment_status 索引（如果不存在）
-- 用途：优化按作业和状态查询提交记录的场景
-- 场景：教师查看某作业的待批改/已批改提交、统计作业完成情况
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE submissions ADD INDEX idx_assignment_status (assignment_id, status)',
  'SELECT "索引 idx_assignment_status 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查 idx_student_submit_time 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'submissions' 
    AND index_name = 'idx_student_submit_time'
);

-- 添加 idx_student_submit_time 索引（如果不存在）
-- 用途：优化按学生和提交时间查询提交记录的场景
-- 场景：学生查看自己的提交历史、按时间排序查看提交记录
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE submissions ADD INDEX idx_student_submit_time (student_id, submit_time)',
  'SELECT "索引 idx_student_submit_time 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✓ 提交表索引优化完成' AS '';

-- ========================================
-- 11.3 答题记录表索引优化
-- ========================================
SELECT '' AS '';
SELECT '11.3 答题记录表索引优化...' AS '';

-- 检查 idx_submission_question 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'answers' 
    AND index_name = 'idx_submission_question'
);

-- 添加 idx_submission_question 索引（如果不存在）
-- 用途：优化按提交和题目查询答题记录的场景
-- 场景：查看某次提交的所有答题记录、查询特定题目的答题情况
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE answers ADD INDEX idx_submission_question (submission_id, question_id)',
  'SELECT "索引 idx_submission_question 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 注意：idx_needs_review 索引已存在于原始schema中，无需重复添加
-- 检查确认
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'answers' 
    AND index_name = 'idx_needs_review'
);

SELECT IF(@index_exists > 0, 
  '✓ 索引 idx_needs_review 已存在（原始schema）', 
  '⚠ 警告：索引 idx_needs_review 不存在'
) AS message;

SELECT '✓ 答题记录表索引优化完成' AS '';

-- ========================================
-- 11.4 薄弱点表索引优化
-- ========================================
SELECT '' AS '';
SELECT '11.4 薄弱点表索引优化...' AS '';

-- 检查 idx_student_error_rate 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'student_weak_points' 
    AND index_name = 'idx_student_error_rate'
);

-- 添加 idx_student_error_rate 索引（如果不存在）
-- 用途：优化按学生和错误率查询薄弱点的场景
-- 场景：查询学生的薄弱知识点（错误率高的优先）、薄弱点分析
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE student_weak_points ADD INDEX idx_student_error_rate (student_id, error_rate)',
  'SELECT "索引 idx_student_error_rate 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查 idx_knowledge_status 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'student_weak_points' 
    AND index_name = 'idx_knowledge_status'
);

-- 添加 idx_knowledge_status 索引（如果不存在）
-- 用途：优化按知识点和状态查询薄弱点的场景
-- 场景：统计某知识点的掌握情况、查询处于不同状态的学生
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE student_weak_points ADD INDEX idx_knowledge_status (knowledge_point_id, status)',
  'SELECT "索引 idx_knowledge_status 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✓ 薄弱点表索引优化完成' AS '';

-- ========================================
-- 11.5 推荐表索引优化
-- ========================================
SELECT '' AS '';
SELECT '11.5 推荐表索引优化...' AS '';

-- 检查 idx_user_score 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'resource_recommendations' 
    AND index_name = 'idx_user_score'
);

-- 添加 idx_user_score 索引（如果不存在）
-- 用途：优化按用户和推荐评分查询推荐的场景
-- 场景：查询用户的个性化推荐（按评分排序）、推荐列表
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE resource_recommendations ADD INDEX idx_user_score (user_id, recommendation_score)',
  'SELECT "索引 idx_user_score 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查 idx_recommended_at 索引是否存在
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = 'edu_education_platform' 
    AND table_name = 'resource_recommendations' 
    AND index_name = 'idx_recommended_at'
);

-- 添加 idx_recommended_at 索引（如果不存在）
-- 用途：优化按推荐时间查询推荐的场景
-- 场景：查询最新推荐、按时间范围统计推荐数据
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE resource_recommendations ADD INDEX idx_recommended_at (created_at)',
  'SELECT "索引 idx_recommended_at 已存在，跳过" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✓ 推荐表索引优化完成' AS '';

-- ========================================
-- 验证所有索引
-- ========================================
SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '索引验证' AS '';
SELECT '========================================' AS '';

-- 验证作业表索引
SELECT 
  'assignments' AS table_name,
  COUNT(*) AS index_count,
  GROUP_CONCAT(DISTINCT index_name ORDER BY index_name SEPARATOR ', ') AS indexes
FROM information_schema.statistics 
WHERE table_schema = 'edu_education_platform' 
  AND table_name = 'assignments'
  AND index_name IN ('idx_class_deadline', 'idx_teacher_status');

-- 验证提交表索引
SELECT 
  'submissions' AS table_name,
  COUNT(*) AS index_count,
  GROUP_CONCAT(DISTINCT index_name ORDER BY index_name SEPARATOR ', ') AS indexes
FROM information_schema.statistics 
WHERE table_schema = 'edu_education_platform' 
  AND table_name = 'submissions'
  AND index_name IN ('idx_assignment_status', 'idx_student_submit_time');

-- 验证答题记录表索引
SELECT 
  'answers' AS table_name,
  COUNT(*) AS index_count,
  GROUP_CONCAT(DISTINCT index_name ORDER BY index_name SEPARATOR ', ') AS indexes
FROM information_schema.statistics 
WHERE table_schema = 'edu_education_platform' 
  AND table_name = 'answers'
  AND index_name IN ('idx_submission_question', 'idx_needs_review');

-- 验证薄弱点表索引
SELECT 
  'student_weak_points' AS table_name,
  COUNT(*) AS index_count,
  GROUP_CONCAT(DISTINCT index_name ORDER BY index_name SEPARATOR ', ') AS indexes
FROM information_schema.statistics 
WHERE table_schema = 'edu_education_platform' 
  AND table_name = 'student_weak_points'
  AND index_name IN ('idx_student_error_rate', 'idx_knowledge_status');

-- 验证推荐表索引
SELECT 
  'resource_recommendations' AS table_name,
  COUNT(*) AS index_count,
  GROUP_CONCAT(DISTINCT index_name ORDER BY index_name SEPARATOR ', ') AS indexes
FROM information_schema.statistics 
WHERE table_schema = 'edu_education_platform' 
  AND table_name = 'resource_recommendations'
  AND index_name IN ('idx_user_score', 'idx_recommended_at');

-- ========================================
-- 完成
-- ========================================
SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '✓ Task 11: 数据库索引优化完成！' AS '';
SELECT '========================================' AS '';
SELECT '' AS '';
SELECT '已添加的索引：' AS '';
SELECT '  1. assignments.idx_class_deadline (class_id, deadline)' AS '';
SELECT '  2. assignments.idx_teacher_status (teacher_id, status)' AS '';
SELECT '  3. submissions.idx_assignment_status (assignment_id, status)' AS '';
SELECT '  4. submissions.idx_student_submit_time (student_id, submit_time)' AS '';
SELECT '  5. answers.idx_submission_question (submission_id, question_id)' AS '';
SELECT '  6. answers.idx_needs_review (needs_review) - 已存在' AS '';
SELECT '  7. student_weak_points.idx_student_error_rate (student_id, error_rate)' AS '';
SELECT '  8. student_weak_points.idx_knowledge_status (knowledge_point_id, status)' AS '';
SELECT '  9. resource_recommendations.idx_user_score (user_id, recommendation_score)' AS '';
SELECT ' 10. resource_recommendations.idx_recommended_at (created_at)' AS '';
SELECT '' AS '';
