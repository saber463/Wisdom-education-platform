-- ========================================
-- 学习平台集成 - 数据库表结构
-- 数据库: edu_education_platform
-- 字符集: UTF8MB4
-- 排序规则: utf8mb4_unicode_ci
-- 创建时间: 2026-01-23
-- ========================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 使用数据库
USE edu_education_platform;

-- ========================================
-- 第一部分：课程体系相关表
-- Requirements: 1.1-1.8
-- ========================================

-- 1. 课程表 (courses)
CREATE TABLE IF NOT EXISTS courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  language_name VARCHAR(100) NOT NULL COMMENT '编程语言名称（如Python、JavaScript）',
  display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
  description TEXT COMMENT '课程描述',
  icon_url VARCHAR(255) COMMENT '语言图标URL',
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  price DECIMAL(10,2) DEFAULT 0.00 COMMENT '课程价格（0为免费）',
  is_hot BOOLEAN DEFAULT FALSE COMMENT '是否热门',
  hot_rank INT DEFAULT 0 COMMENT '热门排名',
  total_students INT DEFAULT 0 COMMENT '总学习人数',
  total_lessons INT DEFAULT 0 COMMENT '总课节数',
  avg_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分',
  rating_count INT DEFAULT 0 COMMENT '评价数量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_language (language_name),
  INDEX idx_hot (is_hot, hot_rank),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- 2. 课程分支表 (course_branches)
CREATE TABLE IF NOT EXISTS course_branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL COMMENT '所属课程ID',
  branch_name VARCHAR(100) NOT NULL COMMENT '分支名称（如Web开发、数据分析）',
  description TEXT COMMENT '分支描述',
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  estimated_hours INT COMMENT '预计学习时长（小时）',
  order_num INT DEFAULT 0 COMMENT '排序序号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_order (order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程分支表';

-- 3. 课节表 (course_lessons)
CREATE TABLE IF NOT EXISTS course_lessons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL COMMENT '所属分支ID',
  lesson_number INT NOT NULL COMMENT '课节编号',
  title VARCHAR(255) NOT NULL COMMENT '课节标题',
  description TEXT COMMENT '课节描述',
  video_url VARCHAR(500) COMMENT '视频URL',
  video_duration INT COMMENT '视频时长（秒）',
  content TEXT COMMENT '课节内容（Markdown）',
  code_example TEXT COMMENT '代码示例',
  exercise_content TEXT COMMENT '练习题内容',
  is_free BOOLEAN DEFAULT FALSE COMMENT '是否免费试看',
  order_num INT DEFAULT 0 COMMENT '排序序号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES course_branches(id) ON DELETE CASCADE,
  INDEX idx_branch (branch_id),
  INDEX idx_order (order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课节表';

-- 4. 课程购买表 (course_purchases)
CREATE TABLE IF NOT EXISTS course_purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '学生ID',
  course_id INT NOT NULL COMMENT '课程ID',
  branch_id INT COMMENT '分支ID（如果购买单个分支）',
  price DECIMAL(10,2) NOT NULL COMMENT '购买价格',
  payment_method ENUM('alipay', 'wechat', 'balance', 'free') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  assigned_class_id INT COMMENT '分配的班级ID',
  purchase_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_course (user_id, course_id),
  INDEX idx_user (user_id),
  INDEX idx_course (course_id),
  INDEX idx_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程购买表';

-- 5. 课程班级表 (course_classes)
CREATE TABLE IF NOT EXISTS course_classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL COMMENT '课程ID',
  branch_id INT NOT NULL COMMENT '分支ID',
  class_number INT NOT NULL COMMENT '班级编号（1-6）',
  class_name VARCHAR(100) NOT NULL COMMENT '班级名称',
  teacher_id INT NOT NULL COMMENT '教师ID',
  student_count INT DEFAULT 0 COMMENT '学生人数',
  max_students INT DEFAULT 100 COMMENT '最大学生数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES course_branches(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_branch_class (branch_id, class_number),
  INDEX idx_course (course_id),
  INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程班级表';

-- 6. 课程评价表 (course_reviews)
CREATE TABLE IF NOT EXISTS course_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '评价用户ID',
  course_id INT NOT NULL COMMENT '课程ID',
  rating INT NOT NULL COMMENT '评分（1-5）',
  content TEXT COMMENT '评价内容',
  tags JSON COMMENT '标签数组',
  helpful_count INT DEFAULT 0 COMMENT '有帮助数',
  teacher_reply TEXT COMMENT '教师回复',
  is_anonymous BOOLEAN DEFAULT FALSE COMMENT '是否匿名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_course (course_id),
  INDEX idx_rating (rating),
  INDEX idx_helpful (helpful_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程评价表';

-- 7. 会员表 (memberships)
CREATE TABLE IF NOT EXISTS memberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  membership_type ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
  start_date TIMESTAMP NOT NULL COMMENT '开始时间',
  end_date TIMESTAMP NOT NULL COMMENT '结束时间',
  price DECIMAL(10,2) NOT NULL COMMENT '购买价格',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否有效',
  auto_renew BOOLEAN DEFAULT FALSE COMMENT '是否自动续费',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_active (is_active),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员表';

-- 8. 积分表 (user_points)
CREATE TABLE IF NOT EXISTS user_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  total_points INT DEFAULT 0 COMMENT '总积分',
  available_points INT DEFAULT 0 COMMENT '可用积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分表';

-- 9. 积分交易表 (point_transactions)
CREATE TABLE IF NOT EXISTS point_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  points INT NOT NULL COMMENT '积分变动（正数为增加，负数为减少）',
  type ENUM('earn', 'spend') NOT NULL,
  reason VARCHAR(255) NOT NULL COMMENT '原因',
  reference_id INT COMMENT '关联ID（如课程ID、帖子ID）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分交易表';

-- ========================================
-- 第二部分：学习路径相关表
-- Requirements: 8.1-8.14
-- ========================================

-- 10. 学习路径表 (learning_paths)
CREATE TABLE IF NOT EXISTS learning_paths (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '创建者ID（教师）',
  title VARCHAR(255) NOT NULL COMMENT '学习路径标题',
  description TEXT COMMENT '学习路径描述',
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  estimated_hours INT COMMENT '预计学习时长（小时）',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  enrollment_count INT DEFAULT 0 COMMENT '选择人数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_difficulty (difficulty),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习路径表';

-- 11. 学习路径步骤表 (learning_path_steps)
CREATE TABLE IF NOT EXISTS learning_path_steps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  learning_path_id INT NOT NULL,
  step_number INT NOT NULL COMMENT '步骤编号',
  title VARCHAR(255) NOT NULL COMMENT '步骤标题',
  content TEXT COMMENT '步骤内容',
  resource_type ENUM('article', 'video', 'exercise', 'quiz', 'document') NOT NULL,
  resource_id INT COMMENT '关联资源ID',
  resource_url VARCHAR(500) COMMENT '外部资源URL',
  estimated_minutes INT COMMENT '预计完成时间（分钟）',
  is_required BOOLEAN DEFAULT TRUE COMMENT '是否必须完成',
  assignment_id INT NULL COMMENT '关联的作业ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL,
  INDEX idx_learning_path (learning_path_id),
  INDEX idx_step_number (step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习路径步骤表';

-- 12. 学习资源表 (learning_resources)
CREATE TABLE IF NOT EXISTS learning_resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '资源标题',
  description TEXT COMMENT '资源描述',
  type ENUM('article', 'video', 'document', 'link', 'course') NOT NULL,
  url VARCHAR(500) COMMENT '资源URL',
  content TEXT COMMENT '资源内容（文章类型）',
  category VARCHAR(100) COMMENT '分类',
  tags JSON COMMENT '标签数组',
  author_id INT NOT NULL COMMENT '作者ID',
  is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  favorite_count INT DEFAULT 0 COMMENT '收藏数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author (author_id),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_is_public (is_public),
  FULLTEXT INDEX ft_title_desc (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习资源表';

-- 13. 资源收藏表 (resource_favorites)
CREATE TABLE IF NOT EXISTS resource_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES learning_resources(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_resource (user_id, resource_id),
  INDEX idx_user (user_id),
  INDEX idx_resource (resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源收藏表';

-- 14. 学习进度表 (learning_progress)
CREATE TABLE IF NOT EXISTS learning_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '学生ID',
  learning_path_id INT NOT NULL,
  current_step INT DEFAULT 1 COMMENT '当前步骤',
  completed_steps JSON COMMENT '已完成步骤数组',
  progress_percentage INT DEFAULT 0 COMMENT '完成百分比',
  total_time_spent INT DEFAULT 0 COMMENT '总学习时间（分钟）',
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  status ENUM('in_progress', 'completed', 'paused') DEFAULT 'in_progress',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_path (user_id, learning_path_id),
  INDEX idx_user (user_id),
  INDEX idx_path (learning_path_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习进度表';

-- 15. 资源知识点关联表 (resource_knowledge_points)
CREATE TABLE IF NOT EXISTS resource_knowledge_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resource_id INT NOT NULL,
  knowledge_point_id INT NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0 COMMENT '相关度评分',
  FOREIGN KEY (resource_id) REFERENCES learning_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
  UNIQUE KEY unique_resource_kp (resource_id, knowledge_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源知识点关联表';

-- ========================================
-- 第三部分：用户兴趣调查相关表
-- Requirements: 20.10
-- ========================================

-- 16. 用户兴趣表 (user_interests)
CREATE TABLE IF NOT EXISTS user_interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  learning_goal ENUM('employment', 'hobby', 'exam', 'project') COMMENT '学习目标',
  interested_languages JSON COMMENT '感兴趣的编程语言数组',
  interested_directions JSON COMMENT '感兴趣的技术方向数组',
  skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
  weekly_hours ENUM('less_5', 'hours_5_10', 'hours_10_20', 'more_20') COMMENT '每周学习时间',
  learning_style JSON COMMENT '偏好的学习方式数组',
  survey_completed BOOLEAN DEFAULT FALSE COMMENT '是否完成问卷',
  survey_completed_at TIMESTAMP NULL COMMENT '问卷完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id),
  INDEX idx_survey_completed (survey_completed),
  INDEX idx_learning_goal (learning_goal),
  INDEX idx_skill_level (skill_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户兴趣表';

-- ========================================
-- 第四部分：AI动态学习路径相关表
-- Requirements: 21.6
-- ========================================

-- 17. 知识点掌握度表 (knowledge_mastery)
CREATE TABLE IF NOT EXISTS knowledge_mastery (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  knowledge_point_id INT NOT NULL COMMENT '知识点ID',
  mastery_level ENUM('mastered', 'consolidating', 'weak') DEFAULT 'weak' COMMENT '掌握等级',
  practice_correct_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '练习正确率',
  code_error_count INT DEFAULT 0 COMMENT '代码错误次数',
  video_rewatch_count INT DEFAULT 0 COMMENT '视频回看次数',
  lesson_completion_time INT DEFAULT 0 COMMENT '课节完成时长（秒）',
  comprehensive_score DECIMAL(5,2) DEFAULT 0.00 COMMENT '综合得分',
  last_evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后评估时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_kp (user_id, knowledge_point_id),
  INDEX idx_user (user_id),
  INDEX idx_mastery_level (mastery_level),
  INDEX idx_score (comprehensive_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识点掌握度表';

-- 17.5. 课节知识点关联表 (lesson_knowledge_points)
-- 用于关联课节和知识点，支持知识点评估功能
CREATE TABLE IF NOT EXISTS lesson_knowledge_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lesson_id INT NOT NULL COMMENT '课节ID',
  knowledge_point_id INT NOT NULL COMMENT '知识点ID',
  importance ENUM('primary', 'secondary', 'supplementary') DEFAULT 'primary' COMMENT '重要程度',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
  UNIQUE KEY unique_lesson_kp (lesson_id, knowledge_point_id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_knowledge_point (knowledge_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课节知识点关联表';

-- ========================================
-- 第五部分：虚拟学习伙伴相关表
-- Requirements: 22.1
-- ========================================

-- 18. 虚拟学习伙伴表 (virtual_partners)
CREATE TABLE IF NOT EXISTS virtual_partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  partner_name VARCHAR(100) NOT NULL COMMENT '伙伴姓名',
  partner_avatar VARCHAR(255) COMMENT '伙伴头像URL',
  partner_signature VARCHAR(255) COMMENT '个性签名',
  learning_ability_tag ENUM('efficient', 'steady', 'basic') COMMENT '学习能力标签',
  partner_level INT DEFAULT 1 COMMENT '伙伴等级',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  interaction_frequency ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '互动频率',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='虚拟学习伙伴表';

-- 19. 共同任务表 (collaborative_tasks)
CREATE TABLE IF NOT EXISTS collaborative_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  partner_id INT NOT NULL COMMENT '伙伴ID',
  task_type ENUM('practice', 'video', 'lesson', 'project') NOT NULL COMMENT '任务类型',
  task_description VARCHAR(500) NOT NULL COMMENT '任务描述',
  target_count INT DEFAULT 1 COMMENT '目标数量',
  user_progress INT DEFAULT 0 COMMENT '用户进度',
  partner_progress INT DEFAULT 0 COMMENT '伙伴进度（模拟）',
  reward_points INT DEFAULT 0 COMMENT '奖励积分',
  reward_badge VARCHAR(100) COMMENT '奖励徽章',
  status ENUM('pending', 'in_progress', 'completed', 'expired') DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES virtual_partners(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='共同任务表';

-- ========================================
-- 第六部分：视频答题与错题本相关表
-- Requirements: 23.6
-- ========================================

-- 20. 视频答题题库表 (video_quiz_questions)
CREATE TABLE IF NOT EXISTS video_quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lesson_id INT NOT NULL COMMENT '课节ID',
  video_url VARCHAR(500) NOT NULL COMMENT '视频URL',
  trigger_time_range_start INT NOT NULL COMMENT '触发时间范围开始（秒）',
  trigger_time_range_end INT NOT NULL COMMENT '触发时间范围结束（秒）',
  question_type ENUM('single_choice', 'multiple_choice', 'fill_blank') NOT NULL COMMENT '题目类型',
  question_content TEXT NOT NULL COMMENT '题目内容',
  options JSON COMMENT '选项（选择题）',
  correct_answer VARCHAR(500) NOT NULL COMMENT '正确答案',
  explanation TEXT COMMENT '答案解析',
  knowledge_point_ids JSON COMMENT '关联知识点ID数组',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  reward_points INT DEFAULT 5 COMMENT '答对奖励积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
  INDEX idx_lesson (lesson_id),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频答题题库表';

-- 21. 错题本表 (wrong_question_book)
CREATE TABLE IF NOT EXISTS wrong_question_book (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  question_id INT NOT NULL COMMENT '题目ID',
  lesson_id INT NOT NULL COMMENT '课节ID',
  video_url VARCHAR(500) COMMENT '视频URL',
  question_content TEXT NOT NULL COMMENT '题目内容',
  user_answer VARCHAR(500) NOT NULL COMMENT '用户答案',
  correct_answer VARCHAR(500) NOT NULL COMMENT '正确答案',
  explanation TEXT COMMENT '答案解析',
  knowledge_point_ids JSON COMMENT '关联知识点ID数组',
  answered_at TIMESTAMP NOT NULL COMMENT '答题时间',
  retry_count INT DEFAULT 0 COMMENT '重做次数',
  is_mastered BOOLEAN DEFAULT FALSE COMMENT '是否已掌握',
  mastered_at TIMESTAMP NULL COMMENT '掌握时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES video_quiz_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_mastered (is_mastered),
  INDEX idx_answered_at (answered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错题本表';

-- 22. 视频答题记录表 (video_quiz_records)
CREATE TABLE IF NOT EXISTS video_quiz_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  lesson_id INT NOT NULL COMMENT '课节ID',
  question_id INT NOT NULL COMMENT '题目ID',
  video_position INT NOT NULL COMMENT '视频触发位置（秒）',
  user_answer VARCHAR(500) COMMENT '用户答案',
  is_correct BOOLEAN NOT NULL COMMENT '是否正确',
  answer_time INT COMMENT '答题用时（秒）',
  is_timeout BOOLEAN DEFAULT FALSE COMMENT '是否超时',
  points_earned INT DEFAULT 0 COMMENT '获得积分',
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES video_quiz_questions(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_lesson (lesson_id),
  INDEX idx_correct (is_correct),
  INDEX idx_answered_at (answered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频答题记录表';

-- ========================================
-- 第七部分：扩展现有通知表
-- ========================================

-- 扩展现有通知表 (notifications)（兼容 MySQL 5.7+，不使用 ADD COLUMN IF NOT EXISTS）
ALTER TABLE notifications 
  ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' 
    AFTER type COMMENT '优先级',
  ADD COLUMN action_url VARCHAR(500) 
    AFTER content COMMENT '操作链接',
  ADD COLUMN expires_at TIMESTAMP NULL 
    AFTER action_url COMMENT '过期时间',
  ADD COLUMN metadata JSON 
    AFTER expires_at COMMENT '元数据';

ALTER TABLE notifications 
  ADD INDEX idx_priority (priority),
  ADD INDEX idx_expires (expires_at);

-- 修改通知类型枚举（添加新类型）
ALTER TABLE notifications 
  MODIFY COLUMN type ENUM(
    'assignment',
    'grading',
    'system',
    'message',
    'learning_path',
    'resource',
    'progress',
    'recommendation',
    'course',
    'partner',
    'quiz'
  ) NOT NULL COMMENT '通知类型';

-- ========================================
-- 第八部分：扩展作业表（关联学习路径）
-- ========================================

-- 扩展作业表 (assignments)（兼容 MySQL 5.7+）
ALTER TABLE assignments
  ADD COLUMN learning_path_id INT NULL COMMENT '所属学习路径ID'
    AFTER teacher_id;

ALTER TABLE assignments
  ADD CONSTRAINT fk_assignments_learning_path
  FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE SET NULL;

-- ========================================
-- 表创建完成
-- ========================================

SELECT '学习平台集成数据库表结构创建完成！' AS message;

-- 统计新创建的表数量
SELECT COUNT(*) AS new_table_count 
FROM information_schema.tables 
WHERE table_schema = 'edu_education_platform'
  AND table_name IN (
    'courses', 'course_branches', 'course_lessons', 'course_purchases', 'course_classes',
    'course_reviews', 'memberships', 'user_points', 'point_transactions',
    'learning_paths', 'learning_path_steps', 'learning_resources', 'resource_favorites',
    'learning_progress', 'resource_knowledge_points', 'user_interests',
    'knowledge_mastery', 'virtual_partners', 'collaborative_tasks',
    'video_quiz_questions', 'wrong_question_book', 'video_quiz_records'
  );

-- 显示所有表的索引信息
SELECT 
  table_name,
  COUNT(*) AS index_count
FROM information_schema.statistics
WHERE table_schema = 'edu_education_platform'
  AND table_name IN (
    'courses', 'course_branches', 'course_lessons', 'course_purchases', 'course_classes',
    'course_reviews', 'memberships', 'user_points', 'point_transactions',
    'learning_paths', 'learning_path_steps', 'learning_resources', 'resource_favorites',
    'learning_progress', 'resource_knowledge_points', 'user_interests',
    'knowledge_mastery', 'virtual_partners', 'collaborative_tasks',
    'video_quiz_questions', 'wrong_question_book', 'video_quiz_records'
  )
GROUP BY table_name
ORDER BY table_name;
