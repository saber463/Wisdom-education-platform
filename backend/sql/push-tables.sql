-- Server酱微信推送相关表

-- 推送任务表
CREATE TABLE push_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '推送任务ID',
  user_id INT NOT NULL COMMENT '用户ID',
  push_type ENUM('check_in_reminder', 'task_reminder', 'class_notification') NOT NULL COMMENT '推送类型',
  push_content TEXT NOT NULL COMMENT '推送内容',
  scheduled_time TIMESTAMP NOT NULL COMMENT '计划推送时间',
  executed_time TIMESTAMP NULL COMMENT '实际执行时间',
  status ENUM('pending', 'executing', 'success', 'failed') DEFAULT 'pending' COMMENT '状态',
  retry_count INT DEFAULT 0 COMMENT '重试次数',
  error_message TEXT COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_time (scheduled_time),
  INDEX idx_push_type (push_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='推送任务表';

-- 推送日志表
CREATE TABLE push_logs (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '推送日志ID',
  task_id INT COMMENT '推送任务ID',
  user_id INT NOT NULL COMMENT '用户ID',
  push_content TEXT NOT NULL COMMENT '推送内容',
  push_title VARCHAR(255) COMMENT '推送标题',
  action_url VARCHAR(500) COMMENT '点击推送后的跳转链接',
  push_type VARCHAR(50) COMMENT '推送类型（check_in_reminder/task_reminder/class_notification）',
  sent_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  receive_status ENUM('success', 'failed', 'pending') DEFAULT 'pending' COMMENT '接收状态',
  error_message TEXT COMMENT '错误信息',
  response_code INT COMMENT 'Server酱API响应码',
  response_data JSON COMMENT 'Server酱API响应数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (task_id) REFERENCES push_tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_task (task_id),
  INDEX idx_receive_status (receive_status),
  INDEX idx_created_at (created_at),
  INDEX idx_action_url (action_url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='推送日志表';

-- 推送配置表
CREATE TABLE push_config (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  send_key VARCHAR(255) NOT NULL UNIQUE COMMENT 'Server酱SendKey',
  push_times JSON NOT NULL COMMENT '推送时间列表（JSON格式：["08:00", "15:00", "20:00"]）',
  is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用推送',
  max_concurrent_tasks INT DEFAULT 100 COMMENT '最大并发推送任务数',
  retry_times INT DEFAULT 3 COMMENT '失败重试次数',
  retry_interval INT DEFAULT 300 COMMENT '重试间隔（秒）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='推送配置表';

-- 用户推送偏好表
CREATE TABLE user_push_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '偏好ID',
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  receive_check_in_reminder BOOLEAN DEFAULT TRUE COMMENT '是否接收打卡提醒',
  receive_task_reminder BOOLEAN DEFAULT TRUE COMMENT '是否接收任务提醒',
  receive_class_notification BOOLEAN DEFAULT TRUE COMMENT '是否接收班级通知',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户推送偏好表';

-- 初始化推送配置（Server酱SendKey）
INSERT INTO push_config (send_key, push_times, is_enabled, max_concurrent_tasks, retry_times, retry_interval)
VALUES (
  'SCT309765TcNT6iaZFzS9hjkzRvmo5jmpj',
  '["08:00", "15:00", "20:00"]',
  TRUE,
  100,
  3,
  300
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
