-- 口语评测表
-- 需求：20.1-20.8

CREATE TABLE IF NOT EXISTS speech_assessments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  assignment_id INT NULL,
  language ENUM('english', 'chinese') NOT NULL,
  audio_url VARCHAR(500) NOT NULL,
  audio_format ENUM('MP3', 'WAV') NOT NULL DEFAULT 'MP3',
  audio_duration INT COMMENT '音频时长（秒）',
  file_size INT COMMENT '文件大小（字节）',
  is_priority TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否优先处理（会员）',
  status ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing',
  pronunciation_score DECIMAL(5,2) NULL COMMENT '发音得分 0-100',
  intonation_score DECIMAL(5,2) NULL COMMENT '语调得分 0-100',
  fluency_score DECIMAL(5,2) NULL COMMENT '流利度得分 0-100',
  overall_score DECIMAL(5,2) NULL COMMENT '综合得分 0-100',
  detailed_report JSON NULL COMMENT '详细评测报告',
  error_points JSON NULL COMMENT '错误点列表',
  improvement_suggestions TEXT NULL COMMENT '改进建议',
  standard_audio_url VARCHAR(500) NULL COMMENT '标准发音音频URL',
  processing_time INT NULL COMMENT '处理时长（毫秒）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
