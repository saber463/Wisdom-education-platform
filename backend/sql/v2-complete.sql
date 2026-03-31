-- ============================================================
-- EduAI智慧教育平台 V2.0 完整数据库表结构
-- 包含：防刷课、异常上报、视频上下架、错题推送、
--       代码编辑器、AI社区、用户画像、申诉机制
-- ============================================================

-- =====================
-- 补丁：teams 表补充 learning_goal 字段（若尚未存在）
-- =====================
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS learning_goal ENUM('employment','hobby','exam','project')
    COMMENT '学习目标' AFTER name;

-- =====================
-- 模块一：人脸核验体系
-- =====================

-- 人脸特征表（加密存储特征向量，不存原图）
CREATE TABLE IF NOT EXISTS face_features (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  feature_vector JSON NOT NULL COMMENT '128维特征向量（AES加密存储）',
  liveness_certified BOOLEAN DEFAULT FALSE COMMENT '是否完成过活体认证',
  data_consent_at TIMESTAMP NULL COMMENT '用户知情同意时间',
  delete_requested_at TIMESTAMP NULL COMMENT '用户申请删除时间',
  expires_at TIMESTAMP NOT NULL COMMENT '数据留存截止（2年）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人脸特征表（加密）';

-- 人脸核验日志表
CREATE TABLE IF NOT EXISTS face_verify_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  course_id INT NOT NULL,
  verify_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  similarity DECIMAL(5,4) COMMENT '余弦相似度 0~1',
  liveness_passed BOOLEAN DEFAULT FALSE COMMENT '活体检测是否通过',
  result ENUM('pass', 'warning', 'fail') NOT NULL,
  trigger_reason VARCHAR(100) COMMENT '触发原因：idle/speed_abuse/tab_switch/geo_anomaly/night',
  snapshot_encrypted VARCHAR(500) COMMENT '加密快照URL（仅异常时保留）',
  device_fingerprint VARCHAR(64) COMMENT '设备指纹（7天同设备免高频核验）',
  is_reported BOOLEAN DEFAULT FALSE COMMENT '是否已上报',
  INDEX idx_user_lesson (user_id, lesson_id),
  INDEX idx_course_time (course_id, verify_time),
  INDEX idx_result (result, is_reported),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人脸核验日志';

-- 核验申诉表
CREATE TABLE IF NOT EXISTS verify_appeals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  log_id BIGINT NOT NULL COMMENT '关联核验日志ID',
  appeal_reason TEXT NOT NULL COMMENT '申诉原因',
  evidence_url VARCHAR(500) COMMENT '申诉证据图片URL',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by INT NULL COMMENT '教师ID',
  review_note VARCHAR(500) COMMENT '审核备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (log_id) REFERENCES face_verify_logs(id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='核验申诉表';

-- 设备信任记录表（7天内同设备免高频核验）
CREATE TABLE IF NOT EXISTS trusted_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_fingerprint VARCHAR(64) NOT NULL,
  trusted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL COMMENT '7天后失效',
  UNIQUE KEY uk_user_device (user_id, device_fingerprint),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备信任记录';

-- =====================
-- 模块二：异常上报体系
-- =====================

-- 异常上报推送记录（MD5差分去重）
CREATE TABLE IF NOT EXISTS alert_push_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  course_id INT NOT NULL,
  report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  content_hash VARCHAR(32) NOT NULL COMMENT 'MD5，防重复推送',
  student_count INT DEFAULT 0,
  push_status ENUM('success', 'failed') DEFAULT 'success',
  is_realtime BOOLEAN DEFAULT FALSE COMMENT '是否实时预警',
  detail JSON COMMENT '学生列表详情',
  UNIQUE KEY uk_hash (content_hash),
  INDEX idx_teacher_course (teacher_id, course_id),
  INDEX idx_time (report_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常上报推送记录';

-- =====================
-- 模块三：视频智能上下架
-- =====================

-- 为 lessons 表补充字段
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE COMMENT '是否上架',
  ADD COLUMN IF NOT EXISTS publish_reason VARCHAR(255) COMMENT '上下架原因',
  ADD COLUMN IF NOT EXISTS protected_until DATETIME COMMENT '保护期（新视频7天）',
  ADD COLUMN IF NOT EXISTS last_completion_rate DECIMAL(5,2) COMMENT '最近统计完成率',
  ADD COLUMN IF NOT EXISTS is_teacher_pinned BOOLEAN DEFAULT FALSE COMMENT '教师推荐不参与自动下架',
  ADD COLUMN IF NOT EXISTS difficulty_level ENUM('normal', 'hard') DEFAULT 'normal' COMMENT '难点视频阈值放宽至25%',
  ADD COLUMN IF NOT EXISTS completion_threshold DECIMAL(5,2) GENERATED ALWAYS AS (
    IF(difficulty_level = 'hard', 25.00, 30.00)
  ) STORED COMMENT '自动计算下架阈值';

-- 视频上下架审计日志
CREATE TABLE IF NOT EXISTS video_publish_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lesson_id INT NOT NULL,
  action ENUM('publish', 'unpublish', 'skip_protected', 'skip_pinned', 'manual') NOT NULL,
  completion_rate DECIMAL(5,2),
  enrolled_count INT DEFAULT 0,
  reason VARCHAR(255),
  triggered_by ENUM('auto', 'manual') DEFAULT 'auto',
  operator_id INT NULL COMMENT '手动操作者ID',
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lesson (lesson_id),
  INDEX idx_time (triggered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频上下架审计日志';

-- =====================
-- 模块四：错题智能推送
-- =====================

-- 错题推送记录（7天去重）
CREATE TABLE IF NOT EXISTS wrong_question_pushes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  push_type ENUM('wrong', 'predicted') NOT NULL COMMENT '答错推送/预测推送',
  mastery_level ENUM('weak', 'learning', 'mastered') DEFAULT 'weak' COMMENT '掌握度',
  review_count INT DEFAULT 0 COMMENT '已复习次数',
  next_review_at TIMESTAMP NULL COMMENT '遗忘曲线下次复习时间',
  pushed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_question (user_id, question_id),
  INDEX idx_next_review (next_review_at),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题推送记录';

-- 题目知识点标签表
CREATE TABLE IF NOT EXISTS question_knowledge_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  knowledge_tag VARCHAR(100) NOT NULL COMMENT '知识点标签',
  difficulty ENUM('basic', 'advanced', 'challenge') DEFAULT 'basic',
  INDEX idx_question (question_id),
  INDEX idx_tag (knowledge_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目知识点标签';

-- =====================
-- 模块五：代码编辑器
-- =====================

-- 代码片段收藏表
CREATE TABLE IF NOT EXISTS code_snippets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT '片段名称',
  language VARCHAR(20) NOT NULL COMMENT 'python/java/cpp/javascript',
  code_content TEXT NOT NULL COMMENT '代码内容',
  tags VARCHAR(200) COMMENT '标签，逗号分隔',
  is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_language (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='代码片段收藏';

-- 代码分析缓存表（减少重复AI调用）
CREATE TABLE IF NOT EXISTS code_analysis_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code_hash VARCHAR(32) NOT NULL UNIQUE COMMENT 'MD5(code+lang)',
  language VARCHAR(20) NOT NULL,
  flow_data JSON NOT NULL COMMENT '流程图数据',
  analysis JSON NOT NULL COMMENT '分析结果',
  hit_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL COMMENT '缓存过期时间',
  INDEX idx_hash (code_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='代码分析结果缓存';

-- 作业代码提交表（扩展）
ALTER TABLE assignment_submissions
  ADD COLUMN IF NOT EXISTS code_content MEDIUMTEXT COMMENT '提交的代码内容',
  ADD COLUMN IF NOT EXISTS code_language VARCHAR(20) COMMENT '代码语言',
  ADD COLUMN IF NOT EXISTS flowchart_data JSON COMMENT '流程图数据快照',
  ADD COLUMN IF NOT EXISTS note TEXT COMMENT '提交说明';

-- =====================
-- 模块六：AI教育社区
-- =====================

-- 社区热点表（AI过滤后的合规内容）
CREATE TABLE IF NOT EXISTS community_hot_topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  category VARCHAR(50) NOT NULL COMMENT 'ai/code/contest/research/career',
  source VARCHAR(200) COMMENT '内容来源',
  source_url VARCHAR(500) COMMENT '原文链接',
  ai_summary TEXT COMMENT 'AI提取的学习要点',
  heat_score DECIMAL(10,2) DEFAULT 0 COMMENT '热度分',
  is_ai_filtered BOOLEAN DEFAULT FALSE COMMENT '是否经过AI内容过滤',
  is_active BOOLEAN DEFAULT TRUE COMMENT '7天后自动设为false',
  published_at TIMESTAMP NOT NULL COMMENT '内容发布时间',
  expires_at TIMESTAMP NOT NULL COMMENT '7天后自动归档',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_heat (heat_score DESC),
  INDEX idx_expires (expires_at),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI教育热点';

-- 社区帖子表（用户发布）
CREATE TABLE IF NOT EXISTS community_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NOT NULL COMMENT '帖子内容',
  is_teacher_post BOOLEAN DEFAULT FALSE COMMENT '教师动态',
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '置顶',
  ai_review_passed BOOLEAN DEFAULT TRUE COMMENT 'AI内容审核通过',
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_pinned (is_pinned, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区帖子';

-- 社区评论表
CREATE TABLE IF NOT EXISTS community_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NULL COMMENT '评论所属帖子',
  topic_id INT NULL COMMENT '评论所属热点',
  user_id INT NOT NULL,
  content VARCHAR(1000) NOT NULL,
  ai_review_passed BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_post (post_id),
  INDEX idx_topic (topic_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区评论';

-- 点赞记录表（防重复点赞）
CREATE TABLE IF NOT EXISTS community_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  target_type ENUM('post', 'topic', 'comment') NOT NULL,
  target_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_like (user_id, target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞记录';

-- 社区限流记录（防刷屏）
CREATE TABLE IF NOT EXISTS community_rate_limits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL COMMENT 'post/comment/like',
  action_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_action (user_id, action_type),
  INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区限流';

-- =====================
-- 初始化数据
-- =====================

-- 为现有 lessons 设置保护期为过去（即不受保护）
UPDATE lessons SET protected_until = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE protected_until IS NULL;

-- 为现有 lessons 设置上架状态
UPDATE lessons SET is_published = TRUE WHERE is_published IS NULL;

-- 初始化社区演示数据
INSERT IGNORE INTO community_hot_topics
  (title, summary, category, source, ai_summary, heat_score, is_ai_filtered, published_at, expires_at)
VALUES
  ('国产大模型持续进化，教育AI应用成本大幅下降', 'AI大模型在教育领域的应用正在快速普及，自动批改、个性化推荐等功能的实现成本降低80%以上。', 'ai', '学术研究', '要点：低成本AI将加速教育信息化进程，个性化学习将成为标配。', 85.3, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),
  ('Python 4.0 GIL移除特性公布，并发编程迎来历史性变革', 'Python指导委员会确认4.0将默认禁用GIL，多线程并发性能大幅提升。', 'code', 'Python官方', '要点：GIL移除改变并发编程模型，需重新理解线程安全概念。', 72.1, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY));
