-- ========================================
-- Task 12.2: 修复错误率计算
-- 数据库: edu_education_platform
-- 功能: 重新计算所有薄弱点错误率，更新状态字段
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
-- 1. 错误率统计（修复前）
-- ========================================

SELECT '========================================' AS '';
SELECT '错误率计算检查 - 修复前统计' AS '';
SELECT '========================================' AS '';

-- 1.1 统计总记录数
SELECT 
    '薄弱点总记录数' AS 检查项,
    COUNT(*) AS 数量
FROM student_weak_points;

-- 1.2 统计需要修复的记录（total_count > 0 但 error_rate 不正确）
SELECT 
    '需要修复的记录（错误率不正确）' AS 检查项,
    COUNT(*) AS 数量
FROM student_weak_points
WHERE total_count > 0 
  AND (
    error_rate IS NULL 
    OR error_rate != ROUND((error_count / total_count) * 100, 2)
  );

-- 1.3 统计需要修复的记录（status 不正确）
SELECT 
    '需要修复的记录（状态不正确）' AS 检查项,
    COUNT(*) AS 数量
FROM student_weak_points
WHERE total_count > 0 
  AND (
    (ROUND((error_count / total_count) * 100, 2) >= 50 AND status != 'weak')
    OR (ROUND((error_count / total_count) * 100, 2) >= 30 AND ROUND((error_count / total_count) * 100, 2) < 50 AND status != 'improving')
    OR (ROUND((error_count / total_count) * 100, 2) < 30 AND status != 'mastered')
  );

-- 1.4 统计各状态分布（修复前）
SELECT 
    '状态分布（修复前）' AS 统计项,
    status AS 状态,
    COUNT(*) AS 数量,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM student_weak_points WHERE total_count > 0), 2), '%') AS 占比
FROM student_weak_points
WHERE total_count > 0
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'weak' THEN 1
        WHEN 'improving' THEN 2
        WHEN 'mastered' THEN 3
        ELSE 4
    END;

-- 1.5 统计错误率分布（修复前）
SELECT 
    '错误率分布（修复前）' AS 统计项,
    CASE 
        WHEN error_rate IS NULL THEN 'NULL'
        WHEN error_rate >= 50 THEN '>=50% (薄弱)'
        WHEN error_rate >= 30 THEN '30-49% (进步中)'
        ELSE '<30% (已掌握)'
    END AS 错误率范围,
    COUNT(*) AS 数量,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM student_weak_points WHERE total_count > 0), 2), '%') AS 占比
FROM student_weak_points
WHERE total_count > 0
GROUP BY 
    CASE 
        WHEN error_rate IS NULL THEN 'NULL'
        WHEN error_rate >= 50 THEN '>=50% (薄弱)'
        WHEN error_rate >= 30 THEN '30-49% (进步中)'
        ELSE '<30% (已掌握)'
    END
ORDER BY 
    CASE 
        WHEN error_rate IS NULL THEN 0
        WHEN error_rate >= 50 THEN 1
        WHEN error_rate >= 30 THEN 2
        ELSE 3
    END;

SELECT '========================================' AS '';

-- ========================================
-- 2. 修复错误率和状态
-- ========================================

SELECT '开始修复错误率和状态...' AS '';

-- 2.1 重新计算所有薄弱点的错误率和状态
-- 说明: 
-- - error_rate = ROUND((error_count / total_count) * 100, 2)
-- - status 规则:
--   * 'weak' (薄弱): error_rate >= 50
--   * 'improving' (进步中): 30 <= error_rate < 50
--   * 'mastered' (已掌握): error_rate < 30
UPDATE student_weak_points 
SET 
    error_rate = CASE 
        WHEN total_count > 0 THEN ROUND((error_count / total_count) * 100, 2)
        ELSE 0
    END,
    status = CASE
        WHEN total_count = 0 THEN 'mastered'
        WHEN ROUND((error_count / total_count) * 100, 2) >= 50 THEN 'weak'
        WHEN ROUND((error_count / total_count) * 100, 2) >= 30 THEN 'improving'
        ELSE 'mastered'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE total_count >= 0;

SELECT CONCAT('✓ 已更新 ', ROW_COUNT(), ' 条薄弱点记录的错误率和状态') AS 结果;

SELECT '========================================' AS '';

-- ========================================
-- 3. 错误率统计（修复后）
-- ========================================

SELECT '错误率计算检查 - 修复后统计' AS '';
SELECT '========================================' AS '';

-- 3.1 验证错误率计算正确性
SELECT 
    '错误率计算正确性验证' AS 检查项,
    COUNT(*) AS 错误数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM student_weak_points
WHERE total_count > 0 
  AND error_rate != ROUND((error_count / total_count) * 100, 2);

-- 3.2 验证状态字段正确性
SELECT 
    '状态字段正确性验证' AS 检查项,
    COUNT(*) AS 错误数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM student_weak_points
WHERE total_count > 0 
  AND (
    (error_rate >= 50 AND status != 'weak')
    OR (error_rate >= 30 AND error_rate < 50 AND status != 'improving')
    OR (error_rate < 30 AND status != 'mastered')
  );

-- 3.3 统计各状态分布（修复后）
SELECT 
    '状态分布（修复后）' AS 统计项,
    status AS 状态,
    COUNT(*) AS 数量,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM student_weak_points WHERE total_count > 0), 2), '%') AS 占比
FROM student_weak_points
WHERE total_count > 0
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'weak' THEN 1
        WHEN 'improving' THEN 2
        WHEN 'mastered' THEN 3
        ELSE 4
    END;

-- 3.4 统计错误率分布（修复后）
SELECT 
    '错误率分布（修复后）' AS 统计项,
    CASE 
        WHEN error_rate >= 50 THEN '>=50% (薄弱)'
        WHEN error_rate >= 30 THEN '30-49% (进步中)'
        ELSE '<30% (已掌握)'
    END AS 错误率范围,
    COUNT(*) AS 数量,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM student_weak_points WHERE total_count > 0), 2), '%') AS 占比
FROM student_weak_points
WHERE total_count > 0
GROUP BY 
    CASE 
        WHEN error_rate >= 50 THEN '>=50% (薄弱)'
        WHEN error_rate >= 30 THEN '30-49% (进步中)'
        ELSE '<30% (已掌握)'
    END
ORDER BY 
    CASE 
        WHEN error_rate >= 50 THEN 1
        WHEN error_rate >= 30 THEN 2
        ELSE 3
    END;

-- 3.5 显示错误率和状态的对应关系
SELECT 
    '错误率和状态对应关系' AS 统计项,
    status AS 状态,
    MIN(error_rate) AS 最小错误率,
    MAX(error_rate) AS 最大错误率,
    ROUND(AVG(error_rate), 2) AS 平均错误率,
    COUNT(*) AS 数量
FROM student_weak_points
WHERE total_count > 0
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'weak' THEN 1
        WHEN 'improving' THEN 2
        WHEN 'mastered' THEN 3
        ELSE 4
    END;

SELECT '========================================' AS '';

-- ========================================
-- 4. 详细数据示例
-- ========================================

SELECT '详细数据示例（每种状态各5条）' AS '';
SELECT '========================================' AS '';

-- 4.1 薄弱状态示例
SELECT 
    '薄弱状态 (weak) 示例' AS 类型,
    id AS ID,
    student_id AS 学生ID,
    knowledge_point_id AS 知识点ID,
    error_count AS 错误次数,
    total_count AS 总次数,
    error_rate AS 错误率,
    status AS 状态
FROM student_weak_points
WHERE status = 'weak' AND total_count > 0
ORDER BY error_rate DESC
LIMIT 5;

-- 4.2 进步中状态示例
SELECT 
    '进步中状态 (improving) 示例' AS 类型,
    id AS ID,
    student_id AS 学生ID,
    knowledge_point_id AS 知识点ID,
    error_count AS 错误次数,
    total_count AS 总次数,
    error_rate AS 错误率,
    status AS 状态
FROM student_weak_points
WHERE status = 'improving' AND total_count > 0
ORDER BY error_rate DESC
LIMIT 5;

-- 4.3 已掌握状态示例
SELECT 
    '已掌握状态 (mastered) 示例' AS 类型,
    id AS ID,
    student_id AS 学生ID,
    knowledge_point_id AS 知识点ID,
    error_count AS 错误次数,
    total_count AS 总次数,
    error_rate AS 错误率,
    status AS 状态
FROM student_weak_points
WHERE status = 'mastered' AND total_count > 0
ORDER BY error_rate DESC
LIMIT 5;

SELECT '========================================' AS '';

-- ========================================
-- 5. 边界情况检查
-- ========================================

SELECT '边界情况检查' AS '';
SELECT '========================================' AS '';

-- 5.1 检查 error_rate = 50 的记录（应该是 weak）
SELECT 
    'error_rate = 50 的记录' AS 检查项,
    COUNT(*) AS 数量,
    GROUP_CONCAT(DISTINCT status) AS 状态列表,
    CASE WHEN COUNT(DISTINCT status) = 1 AND MAX(status) = 'weak' THEN '✓ 通过' ELSE '✗ 失败' END AS 验证结果
FROM student_weak_points
WHERE error_rate = 50;

-- 5.2 检查 error_rate = 30 的记录（应该是 improving）
SELECT 
    'error_rate = 30 的记录' AS 检查项,
    COUNT(*) AS 数量,
    GROUP_CONCAT(DISTINCT status) AS 状态列表,
    CASE WHEN COUNT(DISTINCT status) = 1 AND MAX(status) = 'improving' THEN '✓ 通过' ELSE '✗ 失败' END AS 验证结果
FROM student_weak_points
WHERE error_rate = 30;

-- 5.3 检查 error_rate = 0 的记录（应该是 mastered）
SELECT 
    'error_rate = 0 的记录' AS 检查项,
    COUNT(*) AS 数量,
    GROUP_CONCAT(DISTINCT status) AS 状态列表,
    CASE WHEN COUNT(DISTINCT status) = 1 AND MAX(status) = 'mastered' THEN '✓ 通过' ELSE '✗ 失败' END AS 验证结果
FROM student_weak_points
WHERE error_rate = 0;

-- 5.4 检查 error_rate = 100 的记录（应该是 weak）
SELECT 
    'error_rate = 100 的记录' AS 检查项,
    COUNT(*) AS 数量,
    GROUP_CONCAT(DISTINCT status) AS 状态列表,
    CASE WHEN COUNT(DISTINCT status) = 1 AND MAX(status) = 'weak' THEN '✓ 通过' ELSE '✗ 失败' END AS 验证结果
FROM student_weak_points
WHERE error_rate = 100;

-- 5.5 检查 total_count = 0 的记录（应该是 mastered）
SELECT 
    'total_count = 0 的记录' AS 检查项,
    COUNT(*) AS 数量,
    GROUP_CONCAT(DISTINCT status) AS 状态列表,
    CASE WHEN COUNT(DISTINCT status) = 1 AND MAX(status) = 'mastered' THEN '✓ 通过' ELSE '✗ 失败' END AS 验证结果
FROM student_weak_points
WHERE total_count = 0;

SELECT '========================================' AS '';

-- 提交事务
COMMIT;

SELECT '✓ 错误率和状态修复完成！' AS '';
SELECT '✓ 所有操作已提交！' AS '';
SELECT '========================================' AS '';

-- ========================================
-- 使用说明
-- ========================================
-- 
-- 1. 执行脚本:
--    mysql -u root -p edu_education_platform < scripts/task12-fix-error-rates.sql
--
-- 2. 特性:
--    - 幂等性: 可以安全地重复执行
--    - 事务保护: 所有操作在一个事务中，失败会自动回滚
--    - 详细日志: 显示修复前后的统计信息
--    - 验证检查: 修复后自动验证计算正确性
--
-- 3. 计算规则:
--    - error_rate = ROUND((error_count / total_count) * 100, 2)
--    - status 规则:
--      * 'weak' (薄弱): error_rate >= 50
--      * 'improving' (进步中): 30 <= error_rate < 50
--      * 'mastered' (已掌握): error_rate < 30
--
-- 4. 边界情况:
--    - error_rate = 50: status = 'weak'
--    - error_rate = 30: status = 'improving'
--    - error_rate = 0: status = 'mastered'
--    - total_count = 0: error_rate = 0, status = 'mastered'
--
-- 5. 注意事项:
--    - 建议在执行前备份数据库
--    - 在测试环境验证后再在生产环境执行
--    - 如果验证失败，请检查数据库数据
--
-- ========================================
