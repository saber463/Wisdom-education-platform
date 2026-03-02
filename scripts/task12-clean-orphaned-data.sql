-- ========================================
-- Task 12.1: 清理孤立数据
-- 数据库: edu_education_platform
-- 功能: 删除无效的提交记录、答题记录、班级关联
-- 特性: 幂等性（可安全重复执行）
-- ========================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 使用数据库
USE edu_education_platform;

-- 开始事务
START TRANSACTION;

-- ========================================
-- 1. 统计孤立数据（清理前）
-- ========================================

SELECT '========================================' AS '';
SELECT '数据一致性检查 - 清理前统计' AS '';
SELECT '========================================' AS '';

-- 1.1 统计无效的提交记录（引用不存在的作业）
SELECT 
    '无效提交记录（引用不存在的作业）' AS 检查项,
    COUNT(*) AS 数量
FROM submissions s
LEFT JOIN assignments a ON s.assignment_id = a.id
WHERE a.id IS NULL;

-- 1.2 统计无效的提交记录（引用不存在的学生）
SELECT 
    '无效提交记录（引用不存在的学生）' AS 检查项,
    COUNT(*) AS 数量
FROM submissions s
LEFT JOIN users u ON s.student_id = u.id
WHERE u.id IS NULL;

-- 1.3 统计无效的答题记录（引用不存在的提交）
SELECT 
    '无效答题记录（引用不存在的提交）' AS 检查项,
    COUNT(*) AS 数量
FROM answers a
LEFT JOIN submissions s ON a.submission_id = s.id
WHERE s.id IS NULL;

-- 1.4 统计无效的答题记录（引用不存在的题目）
SELECT 
    '无效答题记录（引用不存在的题目）' AS 检查项,
    COUNT(*) AS 数量
FROM answers a
LEFT JOIN questions q ON a.question_id = q.id
WHERE q.id IS NULL;

-- 1.5 统计无效的班级关联（引用不存在的班级）
SELECT 
    '无效班级关联（引用不存在的班级）' AS 检查项,
    COUNT(*) AS 数量
FROM class_students cs
LEFT JOIN classes c ON cs.class_id = c.id
WHERE c.id IS NULL;

-- 1.6 统计无效的班级关联（引用不存在的学生）
SELECT 
    '无效班级关联（引用不存在的学生）' AS 检查项,
    COUNT(*) AS 数量
FROM class_students cs
LEFT JOIN users u ON cs.student_id = u.id
WHERE u.id IS NULL OR u.role != 'student';

-- 1.7 统计无效的题目（引用不存在的作业）
SELECT 
    '无效题目（引用不存在的作业）' AS 检查项,
    COUNT(*) AS 数量
FROM questions q
LEFT JOIN assignments a ON q.assignment_id = a.id
WHERE a.id IS NULL;

-- 1.8 统计无效的薄弱点（引用不存在的学生）
SELECT 
    '无效薄弱点（引用不存在的学生）' AS 检查项,
    COUNT(*) AS 数量
FROM student_weak_points swp
LEFT JOIN users u ON swp.student_id = u.id
WHERE u.id IS NULL OR u.role != 'student';

-- 1.9 统计无效的薄弱点（引用不存在的知识点）
SELECT 
    '无效薄弱点（引用不存在的知识点）' AS 检查项,
    COUNT(*) AS 数量
FROM student_weak_points swp
LEFT JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
WHERE kp.id IS NULL;

SELECT '========================================' AS '';

-- ========================================
-- 2. 清理孤立数据
-- ========================================

SELECT '开始清理孤立数据...' AS '';

-- 2.1 删除无效的答题记录（引用不存在的提交）
-- 说明: 必须先删除答题记录，因为它依赖于提交记录
DELETE a FROM answers a
LEFT JOIN submissions s ON a.submission_id = s.id
WHERE s.id IS NULL;

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效答题记录（引用不存在的提交）') AS 结果;

-- 2.2 删除无效的答题记录（引用不存在的题目）
DELETE a FROM answers a
LEFT JOIN questions q ON a.question_id = q.id
WHERE q.id IS NULL;

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效答题记录（引用不存在的题目）') AS 结果;

-- 2.3 删除无效的提交记录（引用不存在的作业）
DELETE s FROM submissions s
LEFT JOIN assignments a ON s.assignment_id = a.id
WHERE a.id IS NULL;

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效提交记录（引用不存在的作业）') AS 结果;

-- 2.4 删除无效的提交记录（引用不存在的学生）
DELETE s FROM submissions s
LEFT JOIN users u ON s.student_id = u.id
WHERE u.id IS NULL;

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效提交记录（引用不存在的学生）') AS 结果;

-- 2.5 删除无效的班级关联（引用不存在的班级）
DELETE cs FROM class_students cs
LEFT JOIN classes c ON cs.class_id = c.id
WHERE c.id IS NULL;

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效班级关联（引用不存在的班级）') AS 结果;

-- 2.6 删除无效的班级关联（引用不存在的学生或角色不是学生）
DELETE cs FROM class_students cs
LEFT JOIN users u ON cs.student_id = u.id
WHERE u.id IS NULL OR u.role != 'student';

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效班级关联（引用不存在的学生）') AS 结果;

-- 2.7 删除无效的题目（引用不存在的作业）
DELETE q FROM questions q
LEFT JOIN assignments a ON q.assignment_id = a.id
WHERE a.id IS NULL;

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效题目（引用不存在的作业）') AS 结果;

-- 2.8 删除无效的薄弱点（引用不存在的学生）
DELETE swp FROM student_weak_points swp
LEFT JOIN users u ON swp.student_id = u.id
WHERE u.id IS NULL OR u.role != 'student';

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效薄弱点（引用不存在的学生）') AS 结果;

-- 2.9 删除无效的薄弱点（引用不存在的知识点）
DELETE swp FROM student_weak_points swp
LEFT JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
WHERE kp.id IS NULL;

SELECT CONCAT('✓ 已删除 ', ROW_COUNT(), ' 条无效薄弱点（引用不存在的知识点）') AS 结果;

SELECT '========================================' AS '';

-- ========================================
-- 3. 统计孤立数据（清理后）
-- ========================================

SELECT '数据一致性检查 - 清理后统计' AS '';
SELECT '========================================' AS '';

-- 3.1 验证无效的提交记录（引用不存在的作业）
SELECT 
    '无效提交记录（引用不存在的作业）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM submissions s
LEFT JOIN assignments a ON s.assignment_id = a.id
WHERE a.id IS NULL;

-- 3.2 验证无效的提交记录（引用不存在的学生）
SELECT 
    '无效提交记录（引用不存在的学生）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM submissions s
LEFT JOIN users u ON s.student_id = u.id
WHERE u.id IS NULL;

-- 3.3 验证无效的答题记录（引用不存在的提交）
SELECT 
    '无效答题记录（引用不存在的提交）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM answers a
LEFT JOIN submissions s ON a.submission_id = s.id
WHERE s.id IS NULL;

-- 3.4 验证无效的答题记录（引用不存在的题目）
SELECT 
    '无效答题记录（引用不存在的题目）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM answers a
LEFT JOIN questions q ON a.question_id = q.id
WHERE q.id IS NULL;

-- 3.5 验证无效的班级关联（引用不存在的班级）
SELECT 
    '无效班级关联（引用不存在的班级）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM class_students cs
LEFT JOIN classes c ON cs.class_id = c.id
WHERE c.id IS NULL;

-- 3.6 验证无效的班级关联（引用不存在的学生）
SELECT 
    '无效班级关联（引用不存在的学生）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM class_students cs
LEFT JOIN users u ON cs.student_id = u.id
WHERE u.id IS NULL OR u.role != 'student';

-- 3.7 验证无效的题目（引用不存在的作业）
SELECT 
    '无效题目（引用不存在的作业）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM questions q
LEFT JOIN assignments a ON q.assignment_id = a.id
WHERE a.id IS NULL;

-- 3.8 验证无效的薄弱点（引用不存在的学生）
SELECT 
    '无效薄弱点（引用不存在的学生）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM student_weak_points swp
LEFT JOIN users u ON swp.student_id = u.id
WHERE u.id IS NULL OR u.role != 'student';

-- 3.9 验证无效的薄弱点（引用不存在的知识点）
SELECT 
    '无效薄弱点（引用不存在的知识点）' AS 检查项,
    COUNT(*) AS 数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM student_weak_points swp
LEFT JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
WHERE kp.id IS NULL;

SELECT '========================================' AS '';

-- ========================================
-- 4. 数据完整性统计
-- ========================================

SELECT '数据完整性统计' AS '';
SELECT '========================================' AS '';

-- 4.1 统计各表记录数
SELECT 'assignments' AS 表名, COUNT(*) AS 记录数 FROM assignments
UNION ALL
SELECT 'submissions' AS 表名, COUNT(*) AS 记录数 FROM submissions
UNION ALL
SELECT 'questions' AS 表名, COUNT(*) AS 记录数 FROM questions
UNION ALL
SELECT 'answers' AS 表名, COUNT(*) AS 记录数 FROM answers
UNION ALL
SELECT 'class_students' AS 表名, COUNT(*) AS 记录数 FROM class_students
UNION ALL
SELECT 'student_weak_points' AS 表名, COUNT(*) AS 记录数 FROM student_weak_points;

SELECT '========================================' AS '';

-- 提交事务
COMMIT;

SELECT '✓ 孤立数据清理完成！' AS '';
SELECT '✓ 所有操作已提交！' AS '';
SELECT '========================================' AS '';

-- ========================================
-- 使用说明
-- ========================================
-- 
-- 1. 执行脚本:
--    mysql -u root -p edu_education_platform < scripts/task12-clean-orphaned-data.sql
--
-- 2. 特性:
--    - 幂等性: 可以安全地重复执行
--    - 事务保护: 所有操作在一个事务中，失败会自动回滚
--    - 详细日志: 显示清理前后的统计信息
--    - 验证检查: 清理后自动验证数据一致性
--
-- 3. 清理内容:
--    - 无效的提交记录（引用不存在的作业或学生）
--    - 无效的答题记录（引用不存在的提交或题目）
--    - 无效的班级关联（引用不存在的班级或学生）
--    - 无效的题目（引用不存在的作业）
--    - 无效的薄弱点（引用不存在的学生或知识点）
--
-- 4. 注意事项:
--    - 建议在执行前备份数据库
--    - 在测试环境验证后再在生产环境执行
--    - 如果清理后验证失败，请检查数据库约束
--
-- ========================================
