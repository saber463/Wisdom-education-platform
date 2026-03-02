-- ========================================
-- 智慧教育学习平台 - 新增功能数据库表结构
-- 数据库: edu_education_platform
-- 字符集: UTF8MB4
-- 排序规则: utf8mb4_general_ci
-- 新增8张表：学情报告、离线缓存、学习小组（4张）、资源推荐、口语评测
-- ========================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 使用数据库
USE edu_education_platform;

-- ========================================
-- 1. 学情报告表 (learning_analytics_reports)
-- 需求：16.1 - 智能学情分析与可视化报告
-- ========================================
CREATE TABLE IF NOT EXISTS learning_analytics_reports (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '报告ID',
  user_id INT NOT NULL COMMENT '用户ID（学生或班级）',
  user_type ENUM('student', 'class') NOT NULL COMMENT '用户类型',
  report_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL COMMENT '报告类型',
  start_date DATE NOT NULL COMMENT '统计开始日期',
  end_date DATE NOT NULL COMMENT '统计结束日期',
  
  -- 统计数据（JSON格式存储）
  statistics JSON COMMENT '统计数据（平均分、及格率、优秀率等）',
  trend_data JSON COMMENT '趋势数据（用于折线图）',
  weak_points JSON COMMENT '薄弱知识点数据（用于热力图）',
  ranking_data JSON COMMENT '排名数据',
  
  -- BERT分析结果
  ai_analysis TEXT COMMENT 'BERT模型生成的学情分析',
  improvement_suggestions TEXT COMMENT 'AI生成的提升建议',
  knowledge_mastery_score DECIMAL(5,2) COMMENT '知识点掌握度评分（0-100）',
  
  -- 报告元数据
  pdf_url VARCHAR(255) COMMENT 'PDF报告URL',
  file_size INT COMMENT 'PDF文件大小（字节）',
  generation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
  status ENUM('generating', 'completed', 'failed') DEFAULT 'generating' COMMENT '生成状态',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_user_type (user_type),
  INDEX idx_report_type (report_type),
  INDEX idx_date_range (start_date, end_date),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='学情报告表';

-- 插入测试数据（10条学情报告）
INSERT INTO learning_analytics_reports (
  user_id, user_type, report_type, start_date, end_date,
  statistics, trend_data, weak_points, ranking_data,
  ai_analysis, improvement_suggestions, knowledge_mastery_score,
  pdf_url, file_size, status
) VALUES
-- 学生报告
(4, 'student', 'weekly', '2026-01-08', '2026-01-15', 
 '{"average_score": 85.5, "pass_rate": 100, "excellent_rate": 80}',
 '[{"date": "2026-01-08", "score": 82}, {"date": "2026-01-15", "score": 89}]',
 '[{"knowledge_point": "函数", "error_rate": 45}]',
 '{"rank": 3, "total": 30, "improvement": 2}',
 '该学生本周表现优秀，数学函数部分需要加强练习。',
 '建议多做函数相关练习题，重点掌握函数的定义域和值域。',
 85.5,
 '/reports/student_4_weekly_20260115.pdf', 245678, 'completed'),

(5, 'student', 'monthly', '2025-12-15', '2026-01-15',
 '{"average_score": 78.2, "pass_rate": 95, "excellent_rate": 60}',
 '[{"date": "2025-12-15", "score": 75}, {"date": "2026-01-01", "score": 80}, {"date": "2026-01-15", "score": 82}]',
 '[{"knowledge_point": "几何", "error_rate": 52}, {"knowledge_point": "代数", "error_rate": 38}]',
 '{"rank": 8, "total": 30, "improvement": 3}',
 '该学生本月进步明显，几何部分是主要薄弱点。',
 '建议加强几何图形的空间想象能力训练。',
 78.2,
 '/reports/student_5_monthly_20260115.pdf', 312456, 'completed'),

(6, 'student', 'weekly', '2026-01-08', '2026-01-15',
 '{"average_score": 92.3, "pass_rate": 100, "excellent_rate": 100}',
 '[{"date": "2026-01-08", "score": 90}, {"date": "2026-01-15", "score": 95}]',
 '[]',
 '{"rank": 1, "total": 30, "improvement": 0}',
 '该学生表现优异，各知识点掌握扎实。',
 '建议挑战更高难度的题目，拓展知识面。',
 92.3,
 '/reports/student_6_weekly_20260115.pdf', 198765, 'completed'),

(7, 'student', 'daily', '2026-01-15', '2026-01-15',
 '{"average_score": 88.0, "pass_rate": 100, "excellent_rate": 100}',
 '[{"date": "2026-01-15", "score": 88}]',
 '[{"knowledge_point": "阅读理解", "error_rate": 42}]',
 '{"rank": 5, "total": 30, "improvement": 1}',
 '今日作业完成质量较高，阅读理解部分需要提升。',
 '建议每天坚持阅读30分钟，提高阅读速度和理解能力。',
 88.0,
 '/reports/student_7_daily_20260115.pdf', 156789, 'completed'),

(8, 'student', 'weekly', '2026-01-08', '2026-01-15',
 '{"average_score": 72.5, "pass_rate": 85, "excellent_rate": 40}',
 '[{"date": "2026-01-08", "score": 70}, {"date": "2026-01-15", "score": 75}]',
 '[{"knowledge_point": "化学方程式", "error_rate": 58}, {"knowledge_point": "物质分类", "error_rate": 46}]',
 '{"rank": 15, "total": 30, "improvement": -1}',
 '该学生化学基础知识掌握不够扎实，需要系统复习。',
 '建议从基础概念开始，逐步掌握化学方程式的配平方法。',
 72.5,
 '/reports/student_8_weekly_20260115.pdf', 267890, 'completed'),

-- 班级报告
(1, 'class', 'weekly', '2026-01-08', '2026-01-15',
 '{"average_score": 82.3, "pass_rate": 93, "excellent_rate": 65}',
 '[{"date": "2026-01-08", "score": 80}, {"date": "2026-01-15", "score": 85}]',
 '[{"knowledge_point": "函数", "error_rate": 48}, {"knowledge_point": "几何", "error_rate": 41}]',
 '{"top_students": [6, 4, 9], "bottom_students": [12, 18, 22]}',
 '本周班级整体表现良好，函数和几何是主要薄弱点。',
 '建议针对薄弱知识点进行专项训练，加强课堂互动。',
 82.3,
 '/reports/class_1_weekly_20260115.pdf', 456789, 'completed'),

(2, 'class', 'monthly', '2025-12-15', '2026-01-15',
 '{"average_score": 79.8, "pass_rate": 90, "excellent_rate": 58}',
 '[{"date": "2025-12-15", "score": 77}, {"date": "2026-01-01", "score": 80}, {"date": "2026-01-15", "score": 83}]',
 '[{"knowledge_point": "阅读理解", "error_rate": 52}, {"knowledge_point": "写作", "error_rate": 45}]',
 '{"top_students": [15, 16, 17], "bottom_students": [25, 26, 27]}',
 '本月班级进步明显，语文阅读和写作能力需要提升。',
 '建议增加阅读量，定期组织写作训练。',
 79.8,
 '/reports/class_2_monthly_20260115.pdf', 523456, 'completed'),

(3, 'class', 'weekly', '2026-01-08', '2026-01-15',
 '{"average_score": 86.5, "pass_rate": 96, "excellent_rate": 72}',
 '[{"date": "2026-01-08", "score": 85}, {"date": "2026-01-15", "score": 88}]',
 '[{"knowledge_point": "物理实验", "error_rate": 43}]',
 '{"top_students": [28, 29, 30], "bottom_students": [31, 32, 33]}',
 '本周班级表现优秀，物理实验操作需要加强。',
 '建议增加实验课时，提高学生动手能力。',
 86.5,
 '/reports/class_3_weekly_20260115.pdf', 389012, 'completed'),

(1, 'class', 'custom', '2026-01-01', '2026-01-15',
 '{"average_score": 83.7, "pass_rate": 94, "excellent_rate": 68}',
 '[{"date": "2026-01-01", "score": 82}, {"date": "2026-01-08", "score": 84}, {"date": "2026-01-15", "score": 85}]',
 '[{"knowledge_point": "综合应用", "error_rate": 47}]',
 '{"top_students": [6, 4, 9], "bottom_students": [12, 18, 22]}',
 '本期班级整体稳步提升，综合应用能力是提升重点。',
 '建议多做综合性题目，培养学生的综合分析能力。',
 83.7,
 '/reports/class_1_custom_20260115.pdf', 412345, 'completed'),

(9, 'student', 'weekly', '2026-01-08', '2026-01-15',
 '{"average_score": 90.2, "pass_rate": 100, "excellent_rate": 95}',
 '[{"date": "2026-01-08", "score": 88}, {"date": "2026-01-15", "score": 93}]',
 '[{"knowledge_point": "英语听力", "error_rate": 38}]',
 '{"rank": 2, "total": 30, "improvement": 1}',
 '该学生英语综合能力强，听力部分略有不足。',
 '建议每天听英语新闻或播客，提高听力理解能力。',
 90.2,
 '/reports/student_9_weekly_20260115.pdf', 223456, 'completed');

SELECT '学情报告表创建完成，已插入10条测试数据！' AS message;


-- ========================================
-- 2. 离线缓存记录表 (offline_cache_records)
-- 需求：17.1 - 离线模式与本地缓存
-- ========================================
CREATE TABLE IF NOT EXISTS offline_cache_records (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '缓存记录ID',
  user_id INT NOT NULL COMMENT '用户ID',
  data_type ENUM('learning_path', 'error_book', 'assignment', 'report', 'notes', 'mindmap') NOT NULL COMMENT '数据类型',
  data_id INT NOT NULL COMMENT '数据ID（对应各表的主键）',
  
  -- 缓存数据
  cache_data JSON NOT NULL COMMENT '缓存的数据内容（JSON格式）',
  encrypted_data TEXT COMMENT 'AES-256加密后的敏感数据',
  
  -- 同步状态
  sync_status ENUM('synced', 'pending', 'conflict', 'failed') DEFAULT 'synced' COMMENT '同步状态',
  last_sync_time TIMESTAMP NULL COMMENT '最后同步时间',
  local_modified_time TIMESTAMP NULL COMMENT '本地修改时间',
  server_modified_time TIMESTAMP NULL COMMENT '服务器修改时间',
  
  -- 缓存元数据
  cache_size INT COMMENT '缓存大小（字节）',
  access_count INT DEFAULT 0 COMMENT '访问次数',
  last_access_time TIMESTAMP NULL COMMENT '最后访问时间',
  expires_at TIMESTAMP NULL COMMENT '过期时间（30天后）',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_data_type (data_type),
  INDEX idx_sync_status (sync_status),
  INDEX idx_last_access (last_access_time),
  INDEX idx_expires_at (expires_at),
  UNIQUE KEY uk_user_data (user_id, data_type, data_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='离线缓存记录表';

-- 插入测试数据（50条缓存记录）
INSERT INTO offline_cache_records (
  user_id, data_type, data_id, cache_data, encrypted_data,
  sync_status, last_sync_time, local_modified_time, server_modified_time,
  cache_size, access_count, last_access_time, expires_at
) VALUES
-- 学生4的缓存记录（学习路径、错题本、作业）
(4, 'learning_path', 1, '{"path_name": "数学函数专项", "progress": 75, "total_steps": 20}', NULL,
 'synced', '2026-01-15 10:30:00', '2026-01-15 10:25:00', '2026-01-15 10:30:00',
 2048, 15, '2026-01-15 14:20:00', '2026-02-14 10:30:00'),

(4, 'error_book', 1, '{"question_id": 101, "error_count": 3, "last_error": "2026-01-14"}', 
 'U2FsdGVkX1+encrypted_error_data_here',
 'synced', '2026-01-15 09:15:00', '2026-01-15 09:10:00', '2026-01-15 09:15:00',
 1536, 8, '2026-01-15 13:45:00', '2026-02-14 09:15:00'),

(4, 'assignment', 1, '{"assignment_id": 1, "title": "数学作业1", "deadline": "2026-01-20", "status": "pending"}', NULL,
 'synced', '2026-01-15 08:00:00', '2026-01-15 07:55:00', '2026-01-15 08:00:00',
 3072, 22, '2026-01-15 15:30:00', '2026-02-14 08:00:00'),

(4, 'report', 1, '{"report_type": "weekly", "average_score": 85.5, "rank": 3}', NULL,
 'synced', '2026-01-15 11:00:00', '2026-01-15 10:55:00', '2026-01-15 11:00:00',
 4096, 5, '2026-01-15 12:00:00', '2026-02-14 11:00:00'),

(4, 'notes', 1, '{"note_title": "函数笔记", "content": "函数的定义域和值域..."}', NULL,
 'pending', '2026-01-14 16:00:00', '2026-01-15 10:00:00', '2026-01-14 16:00:00',
 1024, 12, '2026-01-15 10:30:00', '2026-02-14 16:00:00'),

-- 学生5的缓存记录
(5, 'learning_path', 2, '{"path_name": "几何图形专项", "progress": 60, "total_steps": 25}', NULL,
 'synced', '2026-01-15 09:30:00', '2026-01-15 09:25:00', '2026-01-15 09:30:00',
 2560, 18, '2026-01-15 14:00:00', '2026-02-14 09:30:00'),

(5, 'error_book', 2, '{"question_id": 102, "error_count": 5, "last_error": "2026-01-15"}',
 'U2FsdGVkX1+encrypted_error_data_5',
 'synced', '2026-01-15 10:00:00', '2026-01-15 09:55:00', '2026-01-15 10:00:00',
 1792, 10, '2026-01-15 13:00:00', '2026-02-14 10:00:00'),

(5, 'assignment', 2, '{"assignment_id": 2, "title": "几何作业", "deadline": "2026-01-22", "status": "submitted"}', NULL,
 'synced', '2026-01-15 07:30:00', '2026-01-15 07:25:00', '2026-01-15 07:30:00',
 2816, 16, '2026-01-15 14:30:00', '2026-02-14 07:30:00'),

(5, 'mindmap', 1, '{"title": "几何知识体系", "nodes": 15, "connections": 20}', NULL,
 'synced', '2026-01-15 11:30:00', '2026-01-15 11:25:00', '2026-01-15 11:30:00',
 3584, 7, '2026-01-15 12:30:00', '2026-02-14 11:30:00'),

(5, 'notes', 2, '{"note_title": "几何定理", "content": "三角形内角和定理..."}', NULL,
 'conflict', '2026-01-14 15:00:00', '2026-01-15 09:00:00', '2026-01-15 08:00:00',
 1280, 9, '2026-01-15 11:00:00', '2026-02-14 15:00:00'),

-- 学生6的缓存记录
(6, 'learning_path', 3, '{"path_name": "英语阅读提升", "progress": 90, "total_steps": 15}', NULL,
 'synced', '2026-01-15 10:45:00', '2026-01-15 10:40:00', '2026-01-15 10:45:00',
 2304, 25, '2026-01-15 15:00:00', '2026-02-14 10:45:00'),

(6, 'error_book', 3, '{"question_id": 103, "error_count": 1, "last_error": "2026-01-10"}',
 'U2FsdGVkX1+encrypted_error_data_6',
 'synced', '2026-01-15 08:30:00', '2026-01-15 08:25:00', '2026-01-15 08:30:00',
 1408, 4, '2026-01-15 12:00:00', '2026-02-14 08:30:00'),

(6, 'assignment', 3, '{"assignment_id": 3, "title": "英语阅读", "deadline": "2026-01-18", "status": "graded"}', NULL,
 'synced', '2026-01-15 09:00:00', '2026-01-15 08:55:00', '2026-01-15 09:00:00',
 2688, 20, '2026-01-15 14:45:00', '2026-02-14 09:00:00'),

(6, 'report', 2, '{"report_type": "weekly", "average_score": 92.3, "rank": 1}', NULL,
 'synced', '2026-01-15 12:00:00', '2026-01-15 11:55:00', '2026-01-15 12:00:00',
 3840, 6, '2026-01-15 13:00:00', '2026-02-14 12:00:00'),

(6, 'notes', 3, '{"note_title": "阅读技巧", "content": "快速阅读方法..."}', NULL,
 'synced', '2026-01-15 10:00:00', '2026-01-15 09:55:00', '2026-01-15 10:00:00',
 1152, 11, '2026-01-15 11:30:00', '2026-02-14 10:00:00'),

-- 学生7的缓存记录
(7, 'learning_path', 4, '{"path_name": "化学实验", "progress": 45, "total_steps": 30}', NULL,
 'synced', '2026-01-15 11:15:00', '2026-01-15 11:10:00', '2026-01-15 11:15:00',
 2944, 14, '2026-01-15 14:15:00', '2026-02-14 11:15:00'),

(7, 'error_book', 4, '{"question_id": 104, "error_count": 4, "last_error": "2026-01-13"}',
 'U2FsdGVkX1+encrypted_error_data_7',
 'synced', '2026-01-15 09:45:00', '2026-01-15 09:40:00', '2026-01-15 09:45:00',
 1664, 9, '2026-01-15 13:15:00', '2026-02-14 09:45:00'),

(7, 'assignment', 4, '{"assignment_id": 4, "title": "化学实验报告", "deadline": "2026-01-25", "status": "pending"}', NULL,
 'pending', '2026-01-14 17:00:00', '2026-01-15 11:00:00', '2026-01-14 17:00:00',
 3200, 13, '2026-01-15 15:15:00', '2026-02-14 17:00:00'),

(7, 'mindmap', 2, '{"title": "化学元素周期表", "nodes": 25, "connections": 35}', NULL,
 'synced', '2026-01-15 12:30:00', '2026-01-15 12:25:00', '2026-01-15 12:30:00',
 4224, 8, '2026-01-15 13:30:00', '2026-02-14 12:30:00'),

(7, 'notes', 4, '{"note_title": "化学方程式", "content": "配平方法总结..."}', NULL,
 'synced', '2026-01-15 10:30:00', '2026-01-15 10:25:00', '2026-01-15 10:30:00',
 1344, 10, '2026-01-15 12:00:00', '2026-02-14 10:30:00'),

-- 学生8的缓存记录
(8, 'learning_path', 5, '{"path_name": "物理力学", "progress": 55, "total_steps": 22}', NULL,
 'synced', '2026-01-15 10:00:00', '2026-01-15 09:55:00', '2026-01-15 10:00:00',
 2432, 17, '2026-01-15 14:30:00', '2026-02-14 10:00:00'),

(8, 'error_book', 5, '{"question_id": 105, "error_count": 6, "last_error": "2026-01-15"}',
 'U2FsdGVkX1+encrypted_error_data_8',
 'synced', '2026-01-15 11:00:00', '2026-01-15 10:55:00', '2026-01-15 11:00:00',
 1920, 11, '2026-01-15 13:45:00', '2026-02-14 11:00:00'),

(8, 'assignment', 5, '{"assignment_id": 5, "title": "力学作业", "deadline": "2026-01-21", "status": "submitted"}', NULL,
 'synced', '2026-01-15 08:15:00', '2026-01-15 08:10:00', '2026-01-15 08:15:00',
 2752, 19, '2026-01-15 15:00:00', '2026-02-14 08:15:00'),

(8, 'report', 3, '{"report_type": "weekly", "average_score": 72.5, "rank": 15}', NULL,
 'synced', '2026-01-15 12:15:00', '2026-01-15 12:10:00', '2026-01-15 12:15:00',
 3456, 5, '2026-01-15 13:15:00', '2026-02-14 12:15:00'),

(8, 'notes', 5, '{"note_title": "牛顿定律", "content": "三大定律详解..."}', NULL,
 'failed', '2026-01-14 14:00:00', '2026-01-15 10:00:00', '2026-01-14 14:00:00',
 1216, 8, '2026-01-15 11:00:00', '2026-02-14 14:00:00'),

-- 学生9的缓存记录
(9, 'learning_path', 6, '{"path_name": "语文古诗词", "progress": 80, "total_steps": 18}', NULL,
 'synced', '2026-01-15 09:45:00', '2026-01-15 09:40:00', '2026-01-15 09:45:00',
 2176, 21, '2026-01-15 14:45:00', '2026-02-14 09:45:00'),

(9, 'error_book', 6, '{"question_id": 106, "error_count": 2, "last_error": "2026-01-12"}',
 'U2FsdGVkX1+encrypted_error_data_9',
 'synced', '2026-01-15 08:45:00', '2026-01-15 08:40:00', '2026-01-15 08:45:00',
 1472, 6, '2026-01-15 12:30:00', '2026-02-14 08:45:00'),

(9, 'assignment', 6, '{"assignment_id": 6, "title": "古诗词鉴赏", "deadline": "2026-01-19", "status": "graded"}', NULL,
 'synced', '2026-01-15 07:45:00', '2026-01-15 07:40:00', '2026-01-15 07:45:00',
 2624, 18, '2026-01-15 14:00:00', '2026-02-14 07:45:00'),

(9, 'mindmap', 3, '{"title": "唐诗宋词体系", "nodes": 30, "connections": 40}', NULL,
 'synced', '2026-01-15 11:45:00', '2026-01-15 11:40:00', '2026-01-15 11:45:00',
 3968, 9, '2026-01-15 13:00:00', '2026-02-14 11:45:00'),

(9, 'notes', 6, '{"note_title": "诗词鉴赏技巧", "content": "意象分析方法..."}', NULL,
 'synced', '2026-01-15 10:15:00', '2026-01-15 10:10:00', '2026-01-15 10:15:00',
 1088, 13, '2026-01-15 11:45:00', '2026-02-14 10:15:00'),

-- 学生10的缓存记录
(10, 'learning_path', 7, '{"path_name": "生物细胞", "progress": 70, "total_steps": 20}', NULL,
 'synced', '2026-01-15 10:30:00', '2026-01-15 10:25:00', '2026-01-15 10:30:00',
 2368, 16, '2026-01-15 14:20:00', '2026-02-14 10:30:00'),

(10, 'error_book', 7, '{"question_id": 107, "error_count": 3, "last_error": "2026-01-14"}',
 'U2FsdGVkX1+encrypted_error_data_10',
 'synced', '2026-01-15 09:30:00', '2026-01-15 09:25:00', '2026-01-15 09:30:00',
 1600, 7, '2026-01-15 13:00:00', '2026-02-14 09:30:00'),

(10, 'assignment', 7, '{"assignment_id": 7, "title": "细胞结构", "deadline": "2026-01-23", "status": "pending"}', NULL,
 'synced', '2026-01-15 08:30:00', '2026-01-15 08:25:00', '2026-01-15 08:30:00',
 2880, 15, '2026-01-15 15:15:00', '2026-02-14 08:30:00'),

(10, 'report', 4, '{"report_type": "daily", "average_score": 88.0, "rank": 5}', NULL,
 'synced', '2026-01-15 12:45:00', '2026-01-15 12:40:00', '2026-01-15 12:45:00',
 3712, 4, '2026-01-15 13:45:00', '2026-02-14 12:45:00'),

(10, 'notes', 7, '{"note_title": "细胞分裂", "content": "有丝分裂过程..."}', NULL,
 'synced', '2026-01-15 10:45:00', '2026-01-15 10:40:00', '2026-01-15 10:45:00',
 1248, 12, '2026-01-15 12:15:00', '2026-02-14 10:45:00'),

-- 学生11-13的缓存记录（补充到50条）
(11, 'learning_path', 8, '{"path_name": "历史近代史", "progress": 65, "total_steps": 24}', NULL,
 'synced', '2026-01-15 11:00:00', '2026-01-15 10:55:00', '2026-01-15 11:00:00',
 2496, 14, '2026-01-15 14:00:00', '2026-02-14 11:00:00'),

(11, 'error_book', 8, '{"question_id": 108, "error_count": 4, "last_error": "2026-01-13"}',
 'U2FsdGVkX1+encrypted_error_data_11',
 'synced', '2026-01-15 10:00:00', '2026-01-15 09:55:00', '2026-01-15 10:00:00',
 1728, 8, '2026-01-15 13:30:00', '2026-02-14 10:00:00'),

(11, 'assignment', 8, '{"assignment_id": 8, "title": "近代史论述", "deadline": "2026-01-24", "status": "submitted"}', NULL,
 'synced', '2026-01-15 09:00:00', '2026-01-15 08:55:00', '2026-01-15 09:00:00',
 3008, 17, '2026-01-15 15:30:00', '2026-02-14 09:00:00'),

(11, 'mindmap', 4, '{"title": "近代史时间轴", "nodes": 20, "connections": 28}', NULL,
 'synced', '2026-01-15 12:00:00', '2026-01-15 11:55:00', '2026-01-15 12:00:00',
 3328, 6, '2026-01-15 13:00:00', '2026-02-14 12:00:00'),

(11, 'notes', 8, '{"note_title": "重大历史事件", "content": "辛亥革命..."}', NULL,
 'synced', '2026-01-15 11:00:00', '2026-01-15 10:55:00', '2026-01-15 11:00:00',
 1376, 10, '2026-01-15 12:30:00', '2026-02-14 11:00:00'),

(12, 'learning_path', 9, '{"path_name": "地理气候", "progress": 50, "total_steps": 26}', NULL,
 'synced', '2026-01-15 10:15:00', '2026-01-15 10:10:00', '2026-01-15 10:15:00',
 2624, 13, '2026-01-15 14:15:00', '2026-02-14 10:15:00'),

(12, 'error_book', 9, '{"question_id": 109, "error_count": 5, "last_error": "2026-01-15"}',
 'U2FsdGVkX1+encrypted_error_data_12',
 'synced', '2026-01-15 10:30:00', '2026-01-15 10:25:00', '2026-01-15 10:30:00',
 1856, 9, '2026-01-15 13:45:00', '2026-02-14 10:30:00'),

(12, 'assignment', 9, '{"assignment_id": 9, "title": "气候类型", "deadline": "2026-01-26", "status": "pending"}', NULL,
 'pending', '2026-01-14 18:00:00', '2026-01-15 12:00:00', '2026-01-14 18:00:00',
 3136, 12, '2026-01-15 15:45:00', '2026-02-14 18:00:00'),

(12, 'report', 5, '{"report_type": "weekly", "average_score": 75.8, "rank": 12}', NULL,
 'synced', '2026-01-15 13:00:00', '2026-01-15 12:55:00', '2026-01-15 13:00:00',
 3584, 5, '2026-01-15 14:00:00', '2026-02-14 13:00:00'),

(12, 'notes', 9, '{"note_title": "气候特征", "content": "温带季风气候..."}', NULL,
 'synced', '2026-01-15 11:15:00', '2026-01-15 11:10:00', '2026-01-15 11:15:00',
 1184, 11, '2026-01-15 12:45:00', '2026-02-14 11:15:00'),

(13, 'learning_path', 10, '{"path_name": "政治哲学", "progress": 40, "total_steps": 28}', NULL,
 'synced', '2026-01-15 09:30:00', '2026-01-15 09:25:00', '2026-01-15 09:30:00',
 2752, 12, '2026-01-15 14:30:00', '2026-02-14 09:30:00'),

(13, 'error_book', 10, '{"question_id": 110, "error_count": 7, "last_error": "2026-01-15"}',
 'U2FsdGVkX1+encrypted_error_data_13',
 'synced', '2026-01-15 11:15:00', '2026-01-15 11:10:00', '2026-01-15 11:15:00',
 1984, 10, '2026-01-15 14:00:00', '2026-02-14 11:15:00'),

(13, 'assignment', 10, '{"assignment_id": 10, "title": "哲学思想", "deadline": "2026-01-27", "status": "submitted"}', NULL,
 'synced', '2026-01-15 09:30:00', '2026-01-15 09:25:00', '2026-01-15 09:30:00',
 3264, 16, '2026-01-15 16:00:00', '2026-02-14 09:30:00'),

(13, 'mindmap', 5, '{"title": "哲学流派", "nodes": 18, "connections": 24}', NULL,
 'synced', '2026-01-15 12:30:00', '2026-01-15 12:25:00', '2026-01-15 12:30:00',
 3648, 7, '2026-01-15 13:30:00', '2026-02-14 12:30:00'),

(13, 'notes', 10, '{"note_title": "唯物主义", "content": "辩证唯物主义..."}', NULL,
 'conflict', '2026-01-14 16:00:00', '2026-01-15 11:00:00', '2026-01-15 10:00:00',
 1312, 9, '2026-01-15 13:00:00', '2026-02-14 16:00:00');

SELECT '离线缓存记录表创建完成，已插入50条测试数据！' AS message;


-- ========================================
-- 3. 学习小组表 (teams)
-- 需求：18.1 - 多端协作学习（组队+打卡+互评）
-- ========================================
CREATE TABLE IF NOT EXISTS teams (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '小组ID',
  name VARCHAR(100) NOT NULL COMMENT '小组名称',
  description TEXT COMMENT '小组描述',
  learning_goal TEXT COMMENT '学习目标',
  creator_id INT NOT NULL COMMENT '创建者ID',
  invite_code VARCHAR(20) NOT NULL UNIQUE COMMENT '邀请码',
  member_limit INT DEFAULT 10 COMMENT '成员上限',
  member_count INT DEFAULT 1 COMMENT '当前成员数',
  status ENUM('active', 'disbanded') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_creator (creator_id),
  INDEX idx_invite_code (invite_code),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='学习小组表';

-- ========================================
-- 4. 小组成员关联表 (team_members)
-- ========================================
CREATE TABLE IF NOT EXISTS team_members (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  team_id INT NOT NULL COMMENT '小组ID',
  user_id INT NOT NULL COMMENT '用户ID',
  role ENUM('creator', 'member') DEFAULT 'member' COMMENT '角色',
  contribution_score INT DEFAULT 0 COMMENT '贡献度评分',
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_team_user (team_id, user_id),
  INDEX idx_team (team_id),
  INDEX idx_user (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='小组成员关联表';

-- ========================================
-- 5. 打卡记录表 (check_ins)
-- 需求：18.3 - 每日打卡功能
-- ========================================
CREATE TABLE IF NOT EXISTS check_ins (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '打卡ID',
  team_id INT NOT NULL COMMENT '小组ID',
  user_id INT NOT NULL COMMENT '用户ID',
  check_in_date DATE NOT NULL COMMENT '打卡日期',
  study_duration INT DEFAULT 0 COMMENT '学习时长（分钟）',
  completed_tasks INT DEFAULT 0 COMMENT '完成任务数',
  notes TEXT COMMENT '打卡笔记',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
  
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_team_user_date (team_id, user_id, check_in_date),
  INDEX idx_team (team_id),
  INDEX idx_user (user_id),
  INDEX idx_date (check_in_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='打卡记录表';

-- ========================================
-- 6. 互评记录表 (peer_reviews)
-- 需求：18.5 - 互评功能
-- ========================================
CREATE TABLE IF NOT EXISTS peer_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '互评ID',
  team_id INT NOT NULL COMMENT '小组ID',
  reviewer_id INT NOT NULL COMMENT '评价人ID',
  reviewee_id INT NOT NULL COMMENT '被评价人ID',
  assignment_id INT COMMENT '作业ID（可选）',
  score INT NOT NULL COMMENT '评分（0-100）',
  comment TEXT COMMENT '评语（≤200字）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
  
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL,
  INDEX idx_team (team_id),
  INDEX idx_reviewer (reviewer_id),
  INDEX idx_reviewee (reviewee_id),
  INDEX idx_assignment (assignment_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='互评记录表';

-- 插入测试数据 - 学习小组（5个小组）
INSERT INTO teams (name, description, learning_goal, creator_id, invite_code, member_limit, member_count, status) VALUES
('数学学霸小组', '专注数学学习，互相帮助提升', '期末数学成绩平均分达到90分以上', 4, 'MATH2026A', 10, 6, 'active'),
('英语口语练习组', '每天练习英语口语，提升听说能力', '能够流利进行日常英语对话', 6, 'ENG2026B', 8, 5, 'active'),
('物理实验探究组', '动手做实验，理解物理原理', '完成所有物理实验并撰写报告', 7, 'PHY2026C', 10, 7, 'active'),
('化学竞赛冲刺组', '备战化学竞赛，冲击省级奖项', '获得省级化学竞赛二等奖以上', 8, 'CHEM2026D', 6, 4, 'active'),
('语文阅读分享组', '分享阅读心得，提升文学素养', '每月阅读3本经典名著', 9, 'CHIN2026E', 12, 8, 'active');

-- 插入测试数据 - 小组成员（30个成员关系）
INSERT INTO team_members (team_id, user_id, role, contribution_score) VALUES
-- 数学学霸小组（6人）
(1, 4, 'creator', 95),
(1, 5, 'member', 88),
(1, 10, 'member', 82),
(1, 11, 'member', 90),
(1, 12, 'member', 75),
(1, 13, 'member', 85),

-- 英语口语练习组（5人）
(2, 6, 'creator', 98),
(2, 9, 'member', 92),
(2, 14, 'member', 87),
(2, 15, 'member', 90),
(2, 16, 'member', 85),

-- 物理实验探究组（7人）
(3, 7, 'creator', 91),
(3, 8, 'member', 86),
(3, 17, 'member', 88),
(3, 18, 'member', 83),
(3, 19, 'member', 90),
(3, 20, 'member', 85),
(3, 21, 'member', 87),

-- 化学竞赛冲刺组（4人）
(4, 8, 'creator', 94),
(4, 22, 'member', 89),
(4, 23, 'member', 92),
(4, 24, 'member', 87),

-- 语文阅读分享组（8人）
(5, 9, 'creator', 96),
(5, 4, 'member', 88),
(5, 6, 'member', 93),
(5, 25, 'member', 85),
(5, 26, 'member', 90),
(5, 27, 'member', 87),
(5, 28, 'member', 91),
(5, 29, 'member', 89);

-- 插入测试数据 - 打卡记录（100条）
INSERT INTO check_ins (team_id, user_id, check_in_date, study_duration, completed_tasks, notes) VALUES
-- 数学学霸小组打卡记录（20条）
(1, 4, '2026-01-15', 120, 5, '今天完成了函数专项练习，感觉进步很大'),
(1, 4, '2026-01-14', 90, 4, '复习了导数知识点'),
(1, 4, '2026-01-13', 105, 3, '做了几何证明题'),
(1, 5, '2026-01-15', 80, 3, '学习了三角函数'),
(1, 5, '2026-01-14', 95, 4, '完成了代数练习'),
(1, 10, '2026-01-15', 110, 5, '复习了数列知识'),
(1, 10, '2026-01-13', 85, 3, '做了立体几何题'),
(1, 11, '2026-01-15', 100, 4, '学习了概率统计'),
(1, 11, '2026-01-14', 90, 3, '复习了不等式'),
(1, 12, '2026-01-15', 75, 2, '完成了基础练习'),
(1, 12, '2026-01-13', 80, 3, '学习了集合'),
(1, 13, '2026-01-15', 95, 4, '做了综合题'),
(1, 13, '2026-01-14', 88, 3, '复习了函数'),
(1, 4, '2026-01-12', 115, 5, '完成了周测试卷'),
(1, 5, '2026-01-12', 92, 4, '学习了向量'),
(1, 10, '2026-01-12', 88, 3, '做了解析几何'),
(1, 11, '2026-01-12', 105, 4, '复习了数学归纳法'),
(1, 12, '2026-01-11', 70, 2, '完成了作业'),
(1, 13, '2026-01-11', 90, 3, '学习了排列组合'),
(1, 4, '2026-01-11', 125, 6, '做了竞赛题'),

-- 英语口语练习组打卡记录（20条）
(2, 6, '2026-01-15', 60, 3, '练习了日常对话'),
(2, 6, '2026-01-14', 55, 2, '听了英语新闻'),
(2, 9, '2026-01-15', 65, 3, '跟读了课文'),
(2, 9, '2026-01-14', 70, 4, '练习了发音'),
(2, 14, '2026-01-15', 50, 2, '背诵了单词'),
(2, 14, '2026-01-13', 60, 3, '练习了口语'),
(2, 15, '2026-01-15', 55, 2, '听了播客'),
(2, 15, '2026-01-14', 65, 3, '练习了对话'),
(2, 16, '2026-01-15', 58, 3, '跟读了文章'),
(2, 16, '2026-01-13', 62, 3, '练习了听力'),
(2, 6, '2026-01-13', 68, 4, '参加了口语角'),
(2, 9, '2026-01-13', 72, 4, '练习了演讲'),
(2, 14, '2026-01-12', 55, 2, '背诵了课文'),
(2, 15, '2026-01-12', 60, 3, '练习了发音'),
(2, 16, '2026-01-12', 58, 2, '听了英语歌'),
(2, 6, '2026-01-12', 70, 4, '做了口语练习'),
(2, 9, '2026-01-12', 68, 3, '跟读了新闻'),
(2, 14, '2026-01-11', 52, 2, '背诵了单词'),
(2, 15, '2026-01-11', 58, 3, '练习了对话'),
(2, 16, '2026-01-11', 60, 3, '听了播客'),

-- 物理实验探究组打卡记录（20条）
(3, 7, '2026-01-15', 90, 2, '完成了力学实验'),
(3, 7, '2026-01-14', 85, 2, '做了电学实验'),
(3, 8, '2026-01-15', 95, 3, '完成了光学实验'),
(3, 8, '2026-01-13', 88, 2, '做了热学实验'),
(3, 17, '2026-01-15', 80, 2, '完成了实验报告'),
(3, 17, '2026-01-14', 92, 3, '做了声学实验'),
(3, 18, '2026-01-15', 85, 2, '完成了力学实验'),
(3, 18, '2026-01-13', 90, 2, '做了电磁实验'),
(3, 19, '2026-01-15', 88, 3, '完成了综合实验'),
(3, 19, '2026-01-14', 82, 2, '做了光学实验'),
(3, 20, '2026-01-15', 78, 2, '完成了实验预习'),
(3, 20, '2026-01-13', 85, 2, '做了力学实验'),
(3, 21, '2026-01-15', 92, 3, '完成了实验报告'),
(3, 21, '2026-01-14', 87, 2, '做了电学实验'),
(3, 7, '2026-01-13', 93, 3, '完成了综合实验'),
(3, 8, '2026-01-12', 90, 2, '做了热学实验'),
(3, 17, '2026-01-12', 85, 2, '完成了实验预习'),
(3, 18, '2026-01-12', 88, 2, '做了声学实验'),
(3, 19, '2026-01-12', 86, 3, '完成了实验报告'),
(3, 20, '2026-01-12', 80, 2, '做了光学实验'),

-- 化学竞赛冲刺组打卡记录（20条）
(4, 8, '2026-01-15', 100, 4, '完成了有机化学练习'),
(4, 8, '2026-01-14', 95, 3, '学习了化学反应'),
(4, 22, '2026-01-15', 90, 3, '做了无机化学题'),
(4, 22, '2026-01-13', 88, 3, '学习了化学平衡'),
(4, 23, '2026-01-15', 105, 4, '完成了竞赛题'),
(4, 23, '2026-01-14', 98, 4, '学习了电化学'),
(4, 24, '2026-01-15', 85, 3, '做了基础练习'),
(4, 24, '2026-01-13', 92, 3, '学习了化学键'),
(4, 8, '2026-01-13', 102, 4, '完成了综合题'),
(4, 22, '2026-01-12', 87, 3, '学习了氧化还原'),
(4, 23, '2026-01-12', 100, 4, '做了竞赛模拟'),
(4, 24, '2026-01-12', 88, 3, '学习了化学计算'),
(4, 8, '2026-01-12', 98, 4, '完成了实验题'),
(4, 22, '2026-01-11', 90, 3, '学习了元素周期表'),
(4, 23, '2026-01-11', 103, 4, '做了竞赛真题'),
(4, 24, '2026-01-11', 86, 3, '学习了化学方程式'),
(4, 8, '2026-01-11', 96, 4, '完成了综合练习'),
(4, 22, '2026-01-10', 89, 3, '学习了化学实验'),
(4, 23, '2026-01-10', 101, 4, '做了竞赛题'),
(4, 24, '2026-01-10', 87, 3, '学习了化学反应'),

-- 语文阅读分享组打卡记录（20条）
(5, 9, '2026-01-15', 75, 3, '阅读了《红楼梦》第10章'),
(5, 9, '2026-01-14', 80, 3, '写了读书笔记'),
(5, 4, '2026-01-15', 70, 2, '阅读了《三国演义》'),
(5, 4, '2026-01-13', 68, 2, '分享了阅读心得'),
(5, 6, '2026-01-15', 85, 4, '阅读了《西游记》'),
(5, 6, '2026-01-14', 78, 3, '写了读后感'),
(5, 25, '2026-01-15', 65, 2, '阅读了《水浒传》'),
(5, 25, '2026-01-13', 72, 3, '分享了读书心得'),
(5, 26, '2026-01-15', 77, 3, '阅读了古诗词'),
(5, 26, '2026-01-14', 70, 2, '背诵了诗词'),
(5, 27, '2026-01-15', 73, 3, '阅读了散文'),
(5, 27, '2026-01-13', 68, 2, '写了读书笔记'),
(5, 28, '2026-01-15', 80, 3, '阅读了小说'),
(5, 28, '2026-01-14', 75, 3, '分享了阅读感悟'),
(5, 29, '2026-01-15', 78, 3, '阅读了名著'),
(5, 29, '2026-01-13', 72, 2, '写了读后感'),
(5, 9, '2026-01-13', 82, 4, '完成了阅读任务'),
(5, 4, '2026-01-12', 69, 2, '阅读了经典文学'),
(5, 6, '2026-01-12', 83, 4, '分享了阅读心得'),
(5, 25, '2026-01-12', 67, 2, '阅读了现代文学');

-- 插入测试数据 - 互评记录（40条）
INSERT INTO peer_reviews (team_id, reviewer_id, reviewee_id, assignment_id, score, comment) VALUES
-- 数学学霸小组互评（10条）
(1, 4, 5, 1, 88, '解题思路清晰，步骤完整，建议加强计算准确性'),
(1, 5, 4, 1, 92, '答案正确，过程详细，非常优秀'),
(1, 10, 11, 1, 85, '基础扎实，但部分题目可以用更简便的方法'),
(1, 11, 10, 1, 87, '做得不错，几何证明部分需要加强'),
(1, 12, 13, 1, 90, '进步明显，继续保持'),
(1, 13, 12, 1, 82, '基础题做得好，难题需要多练习'),
(1, 4, 10, 2, 89, '函数题做得很好，建议多做综合题'),
(1, 5, 11, 2, 91, '解题方法灵活，值得学习'),
(1, 10, 4, 2, 93, '非常优秀，思路独特'),
(1, 11, 5, 2, 86, '做得不错，注意细节'),

-- 英语口语练习组互评（8条）
(2, 6, 9, 3, 95, '发音标准，语调自然，表达流畅'),
(2, 9, 6, 3, 97, '口语能力强，词汇丰富'),
(2, 14, 15, 3, 88, '进步很大，继续加油'),
(2, 15, 14, 3, 90, '表达清晰，建议多练习连读'),
(2, 16, 6, 3, 96, '非常优秀，是我们的榜样'),
(2, 6, 14, NULL, 89, '日常对话练习表现不错'),
(2, 9, 15, NULL, 92, '听力理解能力强'),
(2, 14, 16, NULL, 87, '发音准确，需要提高流利度'),

-- 物理实验探究组互评（10条）
(3, 7, 8, 4, 90, '实验操作规范，数据记录完整'),
(3, 8, 7, 4, 92, '实验设计合理，结论准确'),
(3, 17, 18, 4, 86, '实验态度认真，报告撰写规范'),
(3, 18, 17, 4, 88, '实验过程细致，数据分析到位'),
(3, 19, 20, 4, 91, '实验能力强，值得学习'),
(3, 20, 19, 4, 85, '基础扎实，建议加强理论联系实际'),
(3, 21, 7, 4, 93, '实验报告写得非常好'),
(3, 7, 17, NULL, 89, '实验预习充分'),
(3, 8, 18, NULL, 90, '实验操作熟练'),
(3, 17, 19, NULL, 87, '数据处理准确'),

-- 化学竞赛冲刺组互评（6条）
(4, 8, 22, 5, 94, '竞赛题做得很好，思路清晰'),
(4, 22, 8, 5, 96, '化学功底深厚，解题能力强'),
(4, 23, 24, 5, 91, '进步明显，继续努力'),
(4, 24, 23, 5, 93, '做得非常好，值得学习'),
(4, 8, 23, NULL, 95, '有机化学掌握得很好'),
(4, 22, 24, NULL, 89, '基础扎实，需要提高解题速度'),

-- 语文阅读分享组互评（6条）
(5, 9, 4, 6, 90, '读后感写得很有深度'),
(5, 4, 9, 6, 94, '阅读理解能力强，分析透彻'),
(5, 6, 25, 6, 88, '阅读笔记整理得很好'),
(5, 25, 6, 6, 92, '文学素养高，见解独到'),
(5, 26, 27, NULL, 87, '阅读量大，值得学习'),
(5, 27, 26, NULL, 89, '读书心得写得很真诚');

SELECT '学习小组相关表创建完成，已插入5个小组、30个成员、100条打卡记录！' AS message;


-- ========================================
-- 7. 资源推荐表 (resource_recommendations)
-- 需求：19.2 - 个性化资源推荐（基于学习行为）
-- ========================================
CREATE TABLE IF NOT EXISTS resource_recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '推荐ID',
  user_id INT NOT NULL COMMENT '用户ID',
  resource_type ENUM('article', 'video', 'exercise', 'tutorial', 'course') NOT NULL COMMENT '资源类型',
  resource_id INT NOT NULL COMMENT '资源ID',
  resource_title VARCHAR(200) NOT NULL COMMENT '资源标题',
  resource_url VARCHAR(255) COMMENT '资源URL',
  
  -- 推荐算法相关
  recommendation_score DECIMAL(5,2) NOT NULL COMMENT '推荐评分（0-100）',
  recommendation_reason TEXT COMMENT '推荐理由',
  related_knowledge_points JSON COMMENT '相关知识点',
  
  -- 用户反馈
  is_clicked BOOLEAN DEFAULT FALSE COMMENT '是否点击',
  click_time TIMESTAMP NULL COMMENT '点击时间',
  feedback ENUM('interested', 'not_interested', 'completed') COMMENT '用户反馈',
  feedback_time TIMESTAMP NULL COMMENT '反馈时间',
  
  -- 会员权益
  is_exclusive BOOLEAN DEFAULT FALSE COMMENT '是否独家资源（会员专享）',
  member_level_required ENUM('basic', 'advanced', 'premium') DEFAULT 'basic' COMMENT '所需会员等级',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '推荐时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_resource_type (resource_type),
  INDEX idx_score (recommendation_score),
  INDEX idx_is_clicked (is_clicked),
  INDEX idx_feedback (feedback),
  INDEX idx_is_exclusive (is_exclusive),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资源推荐表';

-- 插入测试数据 - 资源推荐（100条）
INSERT INTO resource_recommendations (
  user_id, resource_type, resource_id, resource_title, resource_url,
  recommendation_score, recommendation_reason, related_knowledge_points,
  is_clicked, click_time, feedback, feedback_time,
  is_exclusive, member_level_required
) VALUES
-- 学生4的推荐（数学函数薄弱）
(4, 'video', 1001, '函数的定义域和值域详解', '/resources/video/1001', 95.5,
 '根据您在函数知识点的错误率，推荐此视频帮助您理解函数的基本概念',
 '["函数", "定义域", "值域"]', TRUE, '2026-01-15 10:30:00', 'completed', '2026-01-15 11:00:00',
 FALSE, 'basic'),

(4, 'exercise', 2001, '函数专项练习100题', '/resources/exercise/2001', 92.3,
 '针对函数薄弱点的专项练习，难度适中',
 '["函数", "函数图像", "函数性质"]', TRUE, '2026-01-15 11:15:00', 'interested', '2026-01-15 11:20:00',
 FALSE, 'basic'),

(4, 'article', 3001, '函数学习方法总结', '/resources/article/3001', 88.7,
 '系统总结函数学习的方法和技巧',
 '["函数", "学习方法"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(4, 'tutorial', 4001, '函数图像绘制教程', '/resources/tutorial/4001', 90.2,
 '手把手教您绘制各类函数图像',
 '["函数", "函数图像", "坐标系"]', TRUE, '2026-01-15 14:00:00', 'completed', '2026-01-15 14:30:00',
 TRUE, 'advanced'),

(4, 'course', 5001, '高中数学函数系统课程', '/resources/course/5001', 94.8,
 '完整的函数知识体系课程，适合系统学习',
 '["函数", "定义域", "值域", "函数图像", "函数性质"]', FALSE, NULL, NULL, NULL,
 TRUE, 'premium'),

-- 学生5的推荐（几何薄弱）
(5, 'video', 1002, '几何图形性质详解', '/resources/video/1002', 93.2,
 '根据您在几何知识点的错误率，推荐此视频',
 '["几何", "三角形", "四边形"]', TRUE, '2026-01-15 09:00:00', 'completed', '2026-01-15 09:45:00',
 FALSE, 'basic'),

(5, 'exercise', 2002, '几何证明题专项训练', '/resources/exercise/2002', 91.5,
 '针对几何证明的专项练习',
 '["几何", "几何证明", "辅助线"]', TRUE, '2026-01-15 10:00:00', 'interested', '2026-01-15 10:05:00',
 FALSE, 'basic'),

(5, 'article', 3002, '几何辅助线添加技巧', '/resources/article/3002', 89.3,
 '总结常见的辅助线添加方法',
 '["几何", "辅助线", "解题技巧"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(5, 'tutorial', 4002, '立体几何空间想象训练', '/resources/tutorial/4002', 92.7,
 '提升空间想象能力的训练教程',
 '["几何", "立体几何", "空间想象"]', TRUE, '2026-01-15 13:00:00', 'completed', '2026-01-15 13:45:00',
 TRUE, 'advanced'),

(5, 'video', 1003, '解析几何坐标系应用', '/resources/video/1003', 90.8,
 '解析几何的坐标系应用方法',
 '["几何", "解析几何", "坐标系"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

-- 学生6的推荐（英语听力略有不足）
(6, 'video', 1004, '英语听力技巧提升', '/resources/video/1004', 88.5,
 '根据您的学习情况，推荐此听力技巧视频',
 '["英语", "听力", "听力技巧"]', TRUE, '2026-01-15 11:00:00', 'completed', '2026-01-15 11:30:00',
 FALSE, 'basic'),

(6, 'exercise', 2003, '英语听力专项练习', '/resources/exercise/2003', 91.2,
 '精选听力练习材料，难度适中',
 '["英语", "听力", "听力理解"]', TRUE, '2026-01-15 12:00:00', 'interested', '2026-01-15 12:05:00',
 FALSE, 'basic'),

(6, 'article', 3003, 'BBC新闻听力材料推荐', '/resources/article/3003', 87.9,
 '优质的英语新闻听力资源',
 '["英语", "听力", "新闻"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(6, 'tutorial', 4003, '英语听力笔记方法', '/resources/tutorial/4003', 89.6,
 '教您如何做好听力笔记',
 '["英语", "听力", "笔记方法"]', TRUE, '2026-01-15 14:30:00', 'completed', '2026-01-15 15:00:00',
 TRUE, 'advanced'),

(6, 'course', 5002, '英语听力系统提升课程', '/resources/course/5002', 93.4,
 '完整的听力提升课程',
 '["英语", "听力", "听力技巧", "听力理解"]', FALSE, NULL, NULL, NULL,
 TRUE, 'premium'),

-- 学生7的推荐（化学方程式薄弱）
(7, 'video', 1005, '化学方程式配平方法', '/resources/video/1005', 94.1,
 '根据您在化学方程式的错误率，推荐此视频',
 '["化学", "化学方程式", "配平"]', TRUE, '2026-01-15 10:00:00', 'completed', '2026-01-15 10:40:00',
 FALSE, 'basic'),

(7, 'exercise', 2004, '化学方程式配平练习', '/resources/exercise/2004', 92.8,
 '针对化学方程式配平的专项练习',
 '["化学", "化学方程式", "配平", "氧化还原"]', TRUE, '2026-01-15 11:00:00', 'interested', '2026-01-15 11:05:00',
 FALSE, 'basic'),

(7, 'article', 3004, '化学方程式配平技巧总结', '/resources/article/3004', 90.5,
 '总结常见的配平方法和技巧',
 '["化学", "化学方程式", "配平技巧"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(7, 'tutorial', 4004, '化学实验操作规范', '/resources/tutorial/4004', 91.7,
 '化学实验的标准操作流程',
 '["化学", "化学实验", "实验操作"]', TRUE, '2026-01-15 13:30:00', 'completed', '2026-01-15 14:15:00',
 TRUE, 'advanced'),

(7, 'video', 1006, '化学反应类型详解', '/resources/video/1006', 89.9,
 '系统讲解各类化学反应',
 '["化学", "化学反应", "反应类型"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

-- 学生8的推荐（物理力学薄弱）
(8, 'video', 1007, '牛顿三大定律详解', '/resources/video/1007', 93.6,
 '根据您在力学知识点的错误率，推荐此视频',
 '["物理", "力学", "牛顿定律"]', TRUE, '2026-01-15 09:30:00', 'completed', '2026-01-15 10:15:00',
 FALSE, 'basic'),

(8, 'exercise', 2005, '力学综合题专项训练', '/resources/exercise/2005', 91.9,
 '针对力学的综合练习题',
 '["物理", "力学", "受力分析"]', TRUE, '2026-01-15 11:00:00', 'interested', '2026-01-15 11:05:00',
 FALSE, 'basic'),

(8, 'article', 3005, '受力分析方法总结', '/resources/article/3005', 88.4,
 '系统总结受力分析的方法',
 '["物理", "力学", "受力分析"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(8, 'tutorial', 4005, '物理实验数据处理', '/resources/tutorial/4005', 90.3,
 '教您如何处理实验数据',
 '["物理", "物理实验", "数据处理"]', TRUE, '2026-01-15 14:00:00', 'completed', '2026-01-15 14:45:00',
 TRUE, 'advanced'),

(8, 'course', 5003, '高中物理力学系统课程', '/resources/course/5003', 94.2,
 '完整的力学知识体系课程',
 '["物理", "力学", "牛顿定律", "受力分析", "运动学"]', FALSE, NULL, NULL, NULL,
 TRUE, 'premium'),

-- 学生9的推荐（语文阅读理解）
(9, 'video', 1008, '阅读理解答题技巧', '/resources/video/1008', 92.4,
 '根据您的学习情况，推荐此阅读技巧视频',
 '["语文", "阅读理解", "答题技巧"]', TRUE, '2026-01-15 10:30:00', 'completed', '2026-01-15 11:00:00',
 FALSE, 'basic'),

(9, 'exercise', 2006, '现代文阅读专项练习', '/resources/exercise/2006', 90.7,
 '精选现代文阅读练习',
 '["语文", "阅读理解", "现代文"]', TRUE, '2026-01-15 12:00:00', 'interested', '2026-01-15 12:05:00',
 FALSE, 'basic'),

(9, 'article', 3006, '古诗词鉴赏方法', '/resources/article/3006', 89.1,
 '古诗词鉴赏的方法和技巧',
 '["语文", "古诗词", "鉴赏方法"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(9, 'tutorial', 4006, '作文写作技巧提升', '/resources/tutorial/4006', 91.5,
 '提升作文写作能力的教程',
 '["语文", "作文", "写作技巧"]', TRUE, '2026-01-15 15:00:00', 'completed', '2026-01-15 15:45:00',
 TRUE, 'advanced'),

(9, 'video', 1009, '文言文翻译方法', '/resources/video/1009', 88.8,
 '文言文翻译的方法和技巧',
 '["语文", "文言文", "翻译"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

-- 学生10的推荐（生物细胞）
(10, 'video', 1010, '细胞结构与功能', '/resources/video/1010', 93.8,
 '根据您的学习情况，推荐此细胞知识视频',
 '["生物", "细胞", "细胞结构"]', TRUE, '2026-01-15 09:00:00', 'completed', '2026-01-15 09:45:00',
 FALSE, 'basic'),

(10, 'exercise', 2007, '细胞分裂专项练习', '/resources/exercise/2007', 91.6,
 '针对细胞分裂的专项练习',
 '["生物", "细胞", "细胞分裂"]', TRUE, '2026-01-15 10:30:00', 'interested', '2026-01-15 10:35:00',
 FALSE, 'basic'),

(10, 'article', 3007, '细胞代谢知识总结', '/resources/article/3007', 89.7,
 '系统总结细胞代谢知识',
 '["生物", "细胞", "细胞代谢"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(10, 'tutorial', 4007, '生物实验显微镜使用', '/resources/tutorial/4007', 90.9,
 '教您如何正确使用显微镜',
 '["生物", "生物实验", "显微镜"]', TRUE, '2026-01-15 13:00:00', 'completed', '2026-01-15 13:30:00',
 TRUE, 'advanced'),

(10, 'course', 5004, '高中生物细胞系统课程', '/resources/course/5004', 94.5,
 '完整的细胞知识体系课程',
 '["生物", "细胞", "细胞结构", "细胞分裂", "细胞代谢"]', FALSE, NULL, NULL, NULL,
 TRUE, 'premium'),

-- 学生11-13的推荐（补充到100条）
(11, 'video', 1011, '近代史重大事件解析', '/resources/video/1011', 92.1,
 '根据您的学习情况，推荐此历史视频',
 '["历史", "近代史", "历史事件"]', TRUE, '2026-01-15 10:00:00', 'completed', '2026-01-15 10:45:00',
 FALSE, 'basic'),

(11, 'exercise', 2008, '历史材料分析练习', '/resources/exercise/2008', 90.3,
 '历史材料分析专项练习',
 '["历史", "材料分析", "史料"]', TRUE, '2026-01-15 11:30:00', 'interested', '2026-01-15 11:35:00',
 FALSE, 'basic'),

(11, 'article', 3008, '历史时间轴记忆方法', '/resources/article/3008', 88.6,
 '历史时间轴的记忆技巧',
 '["历史", "记忆方法", "时间轴"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(11, 'tutorial', 4008, '历史论述题答题技巧', '/resources/tutorial/4008', 91.2,
 '历史论述题的答题方法',
 '["历史", "论述题", "答题技巧"]', TRUE, '2026-01-15 14:00:00', 'completed', '2026-01-15 14:30:00',
 TRUE, 'advanced'),

(11, 'video', 1012, '中国古代史专题', '/resources/video/1012', 89.4,
 '中国古代史的系统讲解',
 '["历史", "古代史", "中国历史"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(12, 'video', 1013, '世界气候类型分布', '/resources/video/1013', 93.3,
 '根据您的学习情况，推荐此地理视频',
 '["地理", "气候", "气候类型"]', TRUE, '2026-01-15 09:30:00', 'completed', '2026-01-15 10:15:00',
 FALSE, 'basic'),

(12, 'exercise', 2009, '地理区域分析练习', '/resources/exercise/2009', 91.1,
 '地理区域分析专项练习',
 '["地理", "区域分析", "地理特征"]', TRUE, '2026-01-15 11:00:00', 'interested', '2026-01-15 11:05:00',
 FALSE, 'basic'),

(12, 'article', 3009, '地理地图判读技巧', '/resources/article/3009', 89.8,
 '地图判读的方法和技巧',
 '["地理", "地图", "判读技巧"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(12, 'tutorial', 4009, '地理实地考察方法', '/resources/tutorial/4009', 90.6,
 '地理实地考察的方法',
 '["地理", "实地考察", "考察方法"]', TRUE, '2026-01-15 13:30:00', 'completed', '2026-01-15 14:00:00',
 TRUE, 'advanced'),

(12, 'course', 5005, '高中地理系统课程', '/resources/course/5005', 94.0,
 '完整的地理知识体系课程',
 '["地理", "气候", "地形", "人文地理", "自然地理"]', FALSE, NULL, NULL, NULL,
 TRUE, 'premium'),

(13, 'video', 1014, '哲学基本问题解析', '/resources/video/1014', 92.7,
 '根据您的学习情况，推荐此哲学视频',
 '["政治", "哲学", "哲学问题"]', TRUE, '2026-01-15 10:30:00', 'completed', '2026-01-15 11:15:00',
 FALSE, 'basic'),

(13, 'exercise', 2010, '政治主观题练习', '/resources/exercise/2010', 90.9,
 '政治主观题专项练习',
 '["政治", "主观题", "答题技巧"]', TRUE, '2026-01-15 12:00:00', 'interested', '2026-01-15 12:05:00',
 FALSE, 'basic'),

(13, 'article', 3010, '时事政治热点分析', '/resources/article/3010', 88.2,
 '当前时事政治热点解析',
 '["政治", "时事", "热点分析"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

(13, 'tutorial', 4010, '政治材料分析方法', '/resources/tutorial/4010', 91.4,
 '政治材料分析的方法',
 '["政治", "材料分析", "分析方法"]', TRUE, '2026-01-15 14:30:00', 'completed', '2026-01-15 15:00:00',
 TRUE, 'advanced'),

(13, 'video', 1015, '经济生活知识点', '/resources/video/1015', 89.6,
 '经济生活的系统讲解',
 '["政治", "经济生活", "经济知识"]', FALSE, NULL, NULL, NULL,
 FALSE, 'basic'),

-- 补充更多推荐记录（达到100条）
(4, 'video', 1016, '导数应用详解', '/resources/video/1016', 91.8, '导数在实际问题中的应用', '["数学", "导数", "应用"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(4, 'article', 3011, '数学思维训练方法', '/resources/article/3011', 87.5, '培养数学思维的方法', '["数学", "思维训练"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(5, 'video', 1017, '平面几何定理总结', '/resources/video/1017', 90.4, '平面几何重要定理', '["几何", "定理"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(5, 'exercise', 2011, '几何综合题训练', '/resources/exercise/2011', 89.6, '几何综合题专项', '["几何", "综合题"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(6, 'video', 1018, '英语语法精讲', '/resources/video/1018', 88.9, '英语语法系统讲解', '["英语", "语法"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(6, 'article', 3012, '英语学习方法分享', '/resources/article/3012', 86.7, '高效英语学习方法', '["英语", "学习方法"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(7, 'video', 1019, '化学实验安全', '/resources/video/1019', 89.3, '化学实验安全规范', '["化学", "实验安全"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(7, 'exercise', 2012, '化学计算题练习', '/resources/exercise/2012', 90.1, '化学计算专项练习', '["化学", "计算题"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(8, 'video', 1020, '电磁学基础', '/resources/video/1020', 91.2, '电磁学基础知识', '["物理", "电磁学"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(8, 'article', 3013, '物理学习技巧', '/resources/article/3013', 87.8, '物理学习的技巧', '["物理", "学习技巧"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(9, 'video', 1021, '文学作品赏析', '/resources/video/1021', 90.5, '经典文学作品赏析', '["语文", "文学赏析"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(9, 'exercise', 2013, '语文综合题训练', '/resources/exercise/2013', 89.2, '语文综合题专项', '["语文", "综合题"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(10, 'video', 1022, '遗传学基础', '/resources/video/1022', 92.0, '遗传学基础知识', '["生物", "遗传学"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(10, 'article', 3014, '生物学习方法', '/resources/article/3014', 88.1, '生物学习的方法', '["生物", "学习方法"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(11, 'video', 1023, '世界近代史', '/resources/video/1023', 91.5, '世界近代史讲解', '["历史", "世界史"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(11, 'exercise', 2014, '历史综合题训练', '/resources/exercise/2014', 89.8, '历史综合题专项', '["历史", "综合题"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(12, 'video', 1024, '人文地理专题', '/resources/video/1024', 90.7, '人文地理知识讲解', '["地理", "人文地理"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(12, 'article', 3015, '地理学习技巧', '/resources/article/3015', 87.4, '地理学习的技巧', '["地理", "学习技巧"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(13, 'video', 1025, '政治生活知识点', '/resources/video/1025', 91.9, '政治生活系统讲解', '["政治", "政治生活"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(13, 'exercise', 2015, '政治综合题训练', '/resources/exercise/2015', 90.3, '政治综合题专项', '["政治", "综合题"]', FALSE, NULL, NULL, NULL, FALSE, 'basic'),
(4, 'course', 5006, '数学竞赛课程', '/resources/course/5006', 95.2, '数学竞赛系统课程', '["数学", "竞赛"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(5, 'course', 5007, '几何专题课程', '/resources/course/5007', 93.8, '几何专题系统课程', '["几何", "专题"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(6, 'course', 5008, '英语提升课程', '/resources/course/5008', 94.6, '英语综合提升课程', '["英语", "提升"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(7, 'course', 5009, '化学竞赛课程', '/resources/course/5009', 95.5, '化学竞赛系统课程', '["化学", "竞赛"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(8, 'course', 5010, '物理提升课程', '/resources/course/5010', 94.1, '物理综合提升课程', '["物理", "提升"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(9, 'course', 5011, '语文阅读课程', '/resources/course/5011', 93.7, '语文阅读系统课程', '["语文", "阅读"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(10, 'course', 5012, '生物专题课程', '/resources/course/5012', 94.3, '生物专题系统课程', '["生物", "专题"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(11, 'course', 5013, '历史提升课程', '/resources/course/5013', 93.9, '历史综合提升课程', '["历史", "提升"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(12, 'course', 5014, '地理专题课程', '/resources/course/5014', 94.4, '地理专题系统课程', '["地理", "专题"]', FALSE, NULL, NULL, NULL, TRUE, 'premium'),
(13, 'course', 5015, '政治提升课程', '/resources/course/5015', 95.0, '政治综合提升课程', '["政治", "提升"]', FALSE, NULL, NULL, NULL, TRUE, 'premium');

SELECT '资源推荐表创建完成，已插入100条测试数据！' AS message;


-- ========================================
-- 8. 口语评测表 (speech_assessments)
-- 需求：20.3 - AI口语评测（英文/中文发音批改）
-- ========================================
CREATE TABLE IF NOT EXISTS speech_assessments (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评测ID',
  user_id INT NOT NULL COMMENT '用户ID',
  assignment_id INT COMMENT '作业ID（可选）',
  language ENUM('english', 'chinese') NOT NULL COMMENT '语言类型',
  
  -- 音频文件信息
  audio_url VARCHAR(255) NOT NULL COMMENT '音频文件URL',
  audio_format VARCHAR(20) NOT NULL COMMENT '音频格式（MP3/WAV）',
  audio_duration INT NOT NULL COMMENT '音频时长（秒）',
  file_size INT NOT NULL COMMENT '文件大小（字节）',
  
  -- Wav2Vec2评测结果
  pronunciation_score DECIMAL(5,2) COMMENT '发音准确率（0-100）',
  intonation_score DECIMAL(5,2) COMMENT '语调评分（0-100）',
  fluency_score DECIMAL(5,2) COMMENT '流畅度评分（0-100）',
  overall_score DECIMAL(5,2) COMMENT '综合评分（0-100）',
  
  -- 详细批改报告
  detailed_report JSON COMMENT '逐句批改报告（JSON格式）',
  error_points JSON COMMENT '发音错误点标注',
  improvement_suggestions TEXT COMMENT '改进建议',
  standard_audio_url VARCHAR(255) COMMENT '标准发音示范URL',
  
  -- 评测元数据
  processing_time INT COMMENT '评测处理时间（毫秒）',
  model_version VARCHAR(50) COMMENT 'Wav2Vec2模型版本',
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing' COMMENT '评测状态',
  
  -- 会员优先级
  is_priority BOOLEAN DEFAULT FALSE COMMENT '是否优先评测（会员）',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_assignment (assignment_id),
  INDEX idx_language (language),
  INDEX idx_status (status),
  INDEX idx_is_priority (is_priority),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='口语评测表';

-- 插入测试数据 - 口语评测（20条）
INSERT INTO speech_assessments (
  user_id, assignment_id, language,
  audio_url, audio_format, audio_duration, file_size,
  pronunciation_score, intonation_score, fluency_score, overall_score,
  detailed_report, error_points, improvement_suggestions, standard_audio_url,
  processing_time, model_version, status, is_priority, completed_at
) VALUES
-- 英语口语评测（12条）
(6, 3, 'english', '/audio/speech/user6_english_1.mp3', 'MP3', 45, 1024000,
 94.5, 92.3, 95.8, 94.2,
 '[{"sentence": "Hello, my name is Tom.", "score": 95, "errors": []}, {"sentence": "I am a student.", "score": 93, "errors": ["student发音略重"]}]',
 '[{"word": "student", "position": "0:15", "error": "重音位置不准确"}]',
 '发音整体优秀，注意student的重音在第一个音节。建议多听标准发音，模仿语调。',
 '/audio/standard/english_demo_1.mp3',
 850, 'wav2vec2-base-960h-v1.0', 'completed', TRUE, '2026-01-15 10:30:15'),

(9, 3, 'english', '/audio/speech/user9_english_1.mp3', 'MP3', 52, 1152000,
 96.2, 94.8, 97.1, 96.0,
 '[{"sentence": "Good morning, teacher.", "score": 97, "errors": []}, {"sentence": "How are you today?", "score": 95, "errors": []}]',
 '[]',
 '发音非常标准，语调自然流畅。继续保持，可以尝试更复杂的句子。',
 '/audio/standard/english_demo_2.mp3',
 780, 'wav2vec2-base-960h-v1.0', 'completed', TRUE, '2026-01-15 11:15:22'),

(14, 3, 'english', '/audio/speech/user14_english_1.mp3', 'MP3', 38, 896000,
 88.3, 86.5, 89.7, 88.2,
 '[{"sentence": "I like reading books.", "score": 90, "errors": ["reading发音不清晰"]}, {"sentence": "Books are my friends.", "score": 86, "errors": ["friends发音略重"]}]',
 '[{"word": "reading", "position": "0:08", "error": "元音发音不准确"}, {"word": "friends", "position": "0:25", "error": "尾音不清晰"}]',
 '发音基础较好，但部分单词的元音和尾音需要加强。建议多练习元音发音，注意尾音的清晰度。',
 '/audio/standard/english_demo_3.mp3',
 920, 'wav2vec2-base-960h-v1.0', 'completed', FALSE, '2026-01-15 12:45:18'),

(15, NULL, 'english', '/audio/speech/user15_english_1.mp3', 'MP3', 41, 968000,
 90.7, 89.2, 91.5, 90.5,
 '[{"sentence": "The weather is nice today.", "score": 92, "errors": []}, {"sentence": "Let us go outside.", "score": 89, "errors": ["outside发音略快"]}]',
 '[{"word": "outside", "position": "0:18", "error": "语速过快，影响清晰度"}]',
 '发音准确度较高，但语速稍快。建议放慢语速，注意每个单词的清晰度。',
 '/audio/standard/english_demo_4.mp3',
 890, 'wav2vec2-base-960h-v1.0', 'completed', FALSE, '2026-01-15 13:20:35'),

(16, 3, 'english', '/audio/speech/user16_english_1.mp3', 'MP3', 47, 1088000,
 92.1, 90.8, 93.4, 92.1,
 '[{"sentence": "I enjoy playing basketball.", "score": 93, "errors": []}, {"sentence": "It is my favorite sport.", "score": 91, "errors": ["favorite发音略轻"]}]',
 '[{"word": "favorite", "position": "0:22", "error": "重音不够明显"}]',
 '发音整体良好，注意favorite的重音。建议多听标准发音，加强重音练习。',
 '/audio/standard/english_demo_5.mp3',
 870, 'wav2vec2-base-960h-v1.0', 'completed', FALSE, '2026-01-15 14:05:42'),

(6, NULL, 'english', '/audio/speech/user6_english_2.mp3', 'MP3', 50, 1120000,
 95.8, 93.7, 96.2, 95.2,
 '[{"sentence": "Learning English is important.", "score": 96, "errors": []}, {"sentence": "I practice every day.", "score": 94, "errors": []}]',
 '[]',
 '发音优秀，语调自然。继续保持每日练习的好习惯。',
 '/audio/standard/english_demo_6.mp3',
 810, 'wav2vec2-base-960h-v1.0', 'completed', TRUE, '2026-01-15 15:30:28'),

(9, NULL, 'english', '/audio/speech/user9_english_2.mp3', 'MP3', 55, 1216000,
 97.3, 95.6, 98.1, 97.0,
 '[{"sentence": "The book is on the table.", "score": 98, "errors": []}, {"sentence": "Please give it to me.", "score": 96, "errors": []}]',
 '[]',
 '发音非常标准，流畅度极高。可以尝试更长的段落朗读。',
 '/audio/standard/english_demo_7.mp3',
 760, 'wav2vec2-base-960h-v1.0', 'completed', TRUE, '2026-01-15 16:10:15'),

(14, NULL, 'english', '/audio/speech/user14_english_2.mp3', 'MP3', 43, 1024000,
 89.5, 87.8, 90.3, 89.2,
 '[{"sentence": "My family is very happy.", "score": 91, "errors": []}, {"sentence": "We love each other.", "score": 87, "errors": ["other发音不清"]}]',
 '[{"word": "other", "position": "0:20", "error": "尾音模糊"}]',
 '发音进步明显，继续加强尾音的清晰度练习。',
 '/audio/standard/english_demo_8.mp3',
 940, 'wav2vec2-base-960h-v1.0', 'completed', FALSE, '2026-01-15 09:25:50'),

(15, NULL, 'english', '/audio/speech/user15_english_2.mp3', 'MP3', 46, 1056000,
 91.8, 90.5, 92.7, 91.7,
 '[{"sentence": "I want to be a teacher.", "score": 93, "errors": []}, {"sentence": "Teaching is meaningful.", "score": 90, "errors": ["meaningful发音略长"]}]',
 '[{"word": "meaningful", "position": "0:18", "error": "音节拖长"}]',
 '发音准确，注意控制音节长度。建议多练习多音节单词。',
 '/audio/standard/english_demo_9.mp3',
 900, 'wav2vec2-base-960h-v1.0', 'completed', FALSE, '2026-01-15 10:40:33'),

(16, NULL, 'english', '/audio/speech/user16_english_2.mp3', 'MP3', 49, 1104000,
 93.4, 91.9, 94.1, 93.1,
 '[{"sentence": "Science is fascinating.", "score": 94, "errors": []}, {"sentence": "I love doing experiments.", "score": 92, "errors": []}]',
 '[]',
 '发音良好，语调自然。继续保持练习。',
 '/audio/standard/english_demo_10.mp3',
 860, 'wav2vec2-base-960h-v1.0', 'completed', FALSE, '2026-01-15 11:55:47'),

(6, NULL, 'english', '/audio/speech/user6_english_3.mp3', 'MP3', 53, 1184000,
 96.5, 94.3, 97.0, 95.9,
 '[{"sentence": "Communication is the key to success.", "score": 97, "errors": []}, {"sentence": "We should practice more.", "score": 95, "errors": []}]',
 '[]',
 '发音优秀，表达流畅。可以尝试即兴演讲练习。',
 '/audio/standard/english_demo_11.mp3',
 790, 'wav2vec2-base-960h-v1.0', 'completed', TRUE, '2026-01-15 13:15:20'),

(9, NULL, 'english', '/audio/speech/user9_english_3.mp3', 'MP3', 58, 1280000,
 98.1, 96.4, 98.7, 97.7,
 '[{"sentence": "Practice makes perfect.", "score": 99, "errors": []}, {"sentence": "Never give up on your dreams.", "score": 97, "errors": []}]',
 '[]',
 '发音完美，语调优美。已达到母语水平，继续保持。',
 '/audio/standard/english_demo_12.mp3',
 740, 'wav2vec2-base-960h-v1.0', 'completed', TRUE, '2026-01-15 14:50:38'),

-- 中文口语评测（8条）
(4, NULL, 'chinese', '/audio/speech/user4_chinese_1.mp3', 'MP3', 40, 960000,
 91.2, 89.5, 92.8, 91.2,
 '[{"sentence": "大家好，我叫李明。", "score": 93, "errors": []}, {"sentence": "我是一名高中生。", "score": 89, "errors": ["高中生发音略快"]}]',
 '[{"word": "高中生", "position": "0:15", "error": "语速过快"}]',
 '普通话发音标准，但语速稍快。建议放慢语速，注意字音的清晰度。',
 '/audio/standard/chinese_demo_1.mp3',
 920, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 09:45:25'),

(5, NULL, 'chinese', '/audio/speech/user5_chinese_1.mp3', 'MP3', 44, 1024000,
 88.7, 87.2, 89.5, 88.5,
 '[{"sentence": "学习是一件快乐的事情。", "score": 90, "errors": []}, {"sentence": "我喜欢数学和物理。", "score": 87, "errors": ["物理发音不清"]}]',
 '[{"word": "物理", "position": "0:18", "error": "声调不准确"}]',
 '普通话基础较好，注意声调的准确性。建议多练习声调变化。',
 '/audio/standard/chinese_demo_2.mp3',
 950, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 10:20:42'),

(7, NULL, 'chinese', '/audio/speech/user7_chinese_1.mp3', 'MP3', 38, 912000,
 93.5, 91.8, 94.2, 93.2,
 '[{"sentence": "化学是一门有趣的学科。", "score": 94, "errors": []}, {"sentence": "我喜欢做实验。", "score": 92, "errors": []}]',
 '[]',
 '普通话发音标准，语调自然。继续保持练习。',
 '/audio/standard/chinese_demo_3.mp3',
 880, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 11:35:18'),

(10, NULL, 'chinese', '/audio/speech/user10_chinese_1.mp3', 'MP3', 42, 992000,
 90.3, 88.9, 91.7, 90.3,
 '[{"sentence": "生物学研究生命的奥秘。", "score": 92, "errors": []}, {"sentence": "细胞是生命的基本单位。", "score": 88, "errors": ["基本单位发音略重"]}]',
 '[{"word": "基本单位", "position": "0:20", "error": "重音过重"}]',
 '普通话发音良好，注意轻重音的控制。建议多练习轻声和重音。',
 '/audio/standard/chinese_demo_4.mp3',
 910, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 12:50:55'),

(4, NULL, 'chinese', '/audio/speech/user4_chinese_2.mp3', 'MP3', 45, 1056000,
 92.8, 90.7, 93.5, 92.3,
 '[{"sentence": "读书使人明智。", "score": 94, "errors": []}, {"sentence": "我们要多读好书。", "score": 91, "errors": []}]',
 '[]',
 '普通话发音标准，表达流畅。继续保持阅读习惯。',
 '/audio/standard/chinese_demo_5.mp3',
 890, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 14:10:30'),

(5, NULL, 'chinese', '/audio/speech/user5_chinese_2.mp3', 'MP3', 47, 1088000,
 89.9, 88.5, 90.8, 89.7,
 '[{"sentence": "坚持就是胜利。", "score": 91, "errors": []}, {"sentence": "我会努力学习。", "score": 88, "errors": ["努力发音略轻"]}]',
 '[{"word": "努力", "position": "0:12", "error": "声音偏轻"}]',
 '普通话发音进步明显，注意音量的控制。建议多练习发声。',
 '/audio/standard/chinese_demo_6.mp3',
 930, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 15:25:48'),

(7, NULL, 'chinese', '/audio/speech/user7_chinese_2.mp3', 'MP3', 41, 976000,
 94.2, 92.5, 95.0, 93.9,
 '[{"sentence": "科学改变世界。", "score": 95, "errors": []}, {"sentence": "创新推动进步。", "score": 93, "errors": []}]',
 '[]',
 '普通话发音优秀，语调自然。可以尝试朗诵更长的文章。',
 '/audio/standard/chinese_demo_7.mp3',
 860, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 16:40:12'),

(10, NULL, 'chinese', '/audio/speech/user10_chinese_2.mp3', 'MP3', 43, 1008000,
 91.5, 89.8, 92.3, 91.2,
 '[{"sentence": "保护环境，人人有责。", "score": 93, "errors": []}, {"sentence": "让我们共同努力。", "score": 90, "errors": []}]',
 '[]',
 '普通话发音良好，表达清晰。继续保持环保意识。',
 '/audio/standard/chinese_demo_8.mp3',
 900, 'wav2vec2-large-chinese-v1.0', 'completed', FALSE, '2026-01-15 09:15:37');

SELECT '口语评测表创建完成，已插入20条测试数据（12条英语+8条中文）！' AS message;

-- ========================================
-- 新增功能数据库表结构创建完成
-- 总计新增8张表：
-- 1. learning_analytics_reports (学情报告表) - 10条数据
-- 2. offline_cache_records (离线缓存记录表) - 50条数据
-- 3. teams (学习小组表) - 5条数据
-- 4. team_members (小组成员关联表) - 30条数据
-- 5. check_ins (打卡记录表) - 100条数据
-- 6. peer_reviews (互评记录表) - 40条数据
-- 7. resource_recommendations (资源推荐表) - 100条数据
-- 8. speech_assessments (口语评测表) - 20条数据
-- ========================================
SELECT '所有新增表创建完成！总计8张表，335条测试数据！' AS final_message;

