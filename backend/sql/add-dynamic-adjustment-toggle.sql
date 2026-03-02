-- ========================================
-- 添加动态调整开关字段
-- Task: 8.6 实现动态调整开关接口
-- Requirement: 21.18
-- ========================================

USE edu_education_platform;

-- 为 learning_progress 表添加 dynamic_adjustment_enabled 字段（兼容 MySQL 5.7+，不使用 IF NOT EXISTS）
ALTER TABLE learning_progress
  ADD COLUMN dynamic_adjustment_enabled BOOLEAN DEFAULT TRUE 
    COMMENT '是否启用动态调整（默认启用）'
    AFTER status;

-- 添加索引以优化查询
ALTER TABLE learning_progress
  ADD INDEX idx_dynamic_adjustment (dynamic_adjustment_enabled);

-- 验证字段添加成功
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'edu_education_platform'
  AND TABLE_NAME = 'learning_progress'
  AND COLUMN_NAME = 'dynamic_adjustment_enabled';

SELECT '动态调整开关字段添加完成！' AS message;
