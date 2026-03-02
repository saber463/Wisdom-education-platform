-- ========================================
-- 智慧教育学习平台 - 推送相关表结构
-- 数据库: edu_education_platform
-- 字符集: UTF8MB4
-- 排序规则: utf8mb4_general_ci
-- ========================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 使用数据库
USE edu_education_platform;

-- ========================================
-- 1. 推送任务表 (push_tasks)
-- ========================================
CREATE TABLE IF NOT EXISTS push_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID',
  user_id INT NOT NULL COMMENT '用户ID',
  push_type ENUM('check_in_reminder', 'task_reminder', 'class_notification', 'custom') NOT NULL COMMENT '推送类型',
  push_content TEXT NOT NULL COMMENT '推送内容',
  scheduled_time TIMESTAMP NOT NULL COMMENT '计划推送时间',
  executed_time TIMESTAMP NULL COMMENT '实际执行时间',
  status ENUM('pending', 'executing', 'success', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  retry_count INT DEFAULT 0 COMMENT '重试次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_time (scheduled_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='推送任务表';

-- ========================================
-- 2. 推送日志表 (push_logs)
-- ========================================
CREATE TABLE IF NOT EXISTS push_logs (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  task_id INT NOT NULL COMMENT '任务ID',
  user_id INT NOT NULL COMMENT '用户ID',
  push_content TEXT NOT NULL COMMENT '推送内容',
  sent_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  receive_status ENUM('pending', 'received', 'failed', 'timeout') DEFAULT 'pending' COMMENT '接收状态',
  error_message VARCHAR(500) COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (task_id) REFERENCES push_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_receive_status (receive_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='推送日志表';

-- ========================================
-- 3. 推送配置表 (push_config)
-- ========================================
CREATE TABLE IF NOT EXISTS push_config (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  send_key VARCHAR(255) NOT NULL UNIQUE COMMENT 'Server酱SendKey',
  push_times VARCHAR(100) NOT NULL COMMENT '推送时间（格式：08:00,15:00,20:00）',
  is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='推送配置表';

-- ========================================
-- 4. 用户推送偏好表 (user_push_preferences)
-- ========================================
CREATE TABLE IF NOT EXISTS user_push_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '偏好ID',
  user_id INT NOT NULL COMMENT '用户ID',
  receive_check_in_reminder BOOLEAN DEFAULT TRUE COMMENT '是否接收打卡提醒',
  receive_task_reminder BOOLEAN DEFAULT TRUE COMMENT '是否接收任务提醒',
  receive_class_notification BOOLEAN DEFAULT TRUE COMMENT '是否接收班级通知',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_id (user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户推送偏好表';

-- ========================================
-- 初始化推送配置
-- ========================================
INSERT INTO push_config (send_key, push_times, is_enabled) 
VALUES ('SCT309765TcNT6iaZFzS9hjkzRvmo5jmpj', '08:00,15:00,20:00', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
