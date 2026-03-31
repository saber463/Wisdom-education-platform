-- ============================================================
-- 智慧教育平台 V2.0 数据库升级脚本
-- 功能：防刷课、异常上报、视频智能上下架、错题智能推送
-- ============================================================

-- 1. 人脸特征表（注册时录入）
CREATE TABLE IF NOT EXISTS face_features (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID，一人一条',
  feature_vector JSON NOT NULL COMMENT '128维人脸特征向量',
  register_photo_url VARCHAR(500) COMMENT '注册时照片存储路径',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='人脸特征表';

-- 2. 人脸核验日志表（每2分钟写入一条）
CREATE TABLE IF NOT EXISTS face_verify_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  course_id INT NOT NULL,
  verify_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  similarity DECIMAL(5,4) COMMENT '余弦相似度，范围0-1',
  result ENUM('pass', 'warning', 'fail') NOT NULL COMMENT '核验结果',
  snapshot_url VARCHAR(500) COMMENT '异常时的抓拍图片URL',
  is_reported BOOLEAN DEFAULT FALSE COMMENT '是否已被异常上报系统处理',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_lesson (user_id, lesson_id),
  INDEX idx_course_time (course_id, verify_time),
  INDEX idx_result_reported (result, is_reported),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='人脸核验日志表';

-- 3. 异常上报推送记录表（差分去重用）
CREATE TABLE IF NOT EXISTS alert_push_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL COMMENT '教师ID',
  course_id INT NOT NULL COMMENT '课程ID',
  report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  content_hash VARCHAR(32) NOT NULL COMMENT 'MD5内容哈希，防重复推送',
  student_count INT DEFAULT 0 COMMENT '本次上报的异常学生数',
  push_status ENUM('success', 'failed') DEFAULT 'success',
  detail JSON COMMENT '异常学生详情JSON列表',
  INDEX idx_teacher_course (teacher_id, course_id),
  INDEX idx_report_time (report_time),
  UNIQUE KEY uk_content_hash (content_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='异常上报推送记录表';

-- 4. 视频上下架审计日志表
CREATE TABLE IF NOT EXISTS video_publish_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lesson_id INT NOT NULL COMMENT '课节ID',
  action ENUM('publish', 'unpublish', 'skip_protected') NOT NULL COMMENT '操作类型',
  completion_rate DECIMAL(5,2) COMMENT '触发时的完成率（%）',
  enrolled_count INT DEFAULT 0 COMMENT '参与学习的学生数',
  reason VARCHAR(255) COMMENT '操作原因说明',
  triggered_by ENUM('auto', 'manual') DEFAULT 'auto' COMMENT '触发来源',
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lesson (lesson_id),
  INDEX idx_triggered_at (triggered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='视频上下架审计日志表';

-- 5. 错题推送记录表（7天去重用）
CREATE TABLE IF NOT EXISTS wrong_question_pushes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  push_type ENUM('wrong', 'predicted') NOT NULL COMMENT '推送类型：已答错/预测易错',
  pushed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP GENERATED ALWAYS AS (DATE_ADD(pushed_at, INTERVAL 7 DAY)) STORED COMMENT '7天后可再次推送',
  INDEX idx_user_question (user_id, question_id),
  INDEX idx_expires (expires_at),
  UNIQUE KEY uk_user_question (user_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='错题推送记录表';

-- 6. 为 lessons 表新增智能上下架字段
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE COMMENT '是否上架',
  ADD COLUMN IF NOT EXISTS publish_reason VARCHAR(255) COMMENT '上下架原因',
  ADD COLUMN IF NOT EXISTS protected_until DATETIME COMMENT '保护期截止时间（新视频7天保护）',
  ADD COLUMN IF NOT EXISTS last_completion_rate DECIMAL(5,2) COMMENT '最近一次统计的完成率';

-- 初始化保护期：所有现有视频视为已过保护期
UPDATE lessons SET protected_until = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE protected_until IS NULL;

-- 新增索引
ALTER TABLE lessons ADD INDEX IF NOT EXISTS idx_published (is_published);
ALTER TABLE lessons ADD INDEX IF NOT EXISTS idx_protected_until (protected_until);
