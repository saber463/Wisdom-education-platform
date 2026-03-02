-- ========================================
-- 智慧教育学习平台 - 数据库表结构
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
-- 1. 用户表 (users)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt密码哈希',
  real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
  role ENUM('teacher', 'student', 'parent') NOT NULL COMMENT '角色',
  email VARCHAR(100) COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '手机号',
  avatar_url VARCHAR(255) COMMENT '头像URL',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- ========================================
-- 2. 班级表 (classes)
-- ========================================
CREATE TABLE IF NOT EXISTS classes (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '班级ID',
  name VARCHAR(100) NOT NULL COMMENT '班级名称',
  grade VARCHAR(20) NOT NULL COMMENT '年级',
  teacher_id INT NOT NULL COMMENT '班主任ID',
  student_count INT DEFAULT 0 COMMENT '学生人数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher (teacher_id),
  INDEX idx_grade (grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='班级表';

-- ========================================
-- 3. 学生班级关联表 (class_students)
-- ========================================
CREATE TABLE IF NOT EXISTS class_students (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  class_id INT NOT NULL COMMENT '班级ID',
  student_id INT NOT NULL COMMENT '学生ID',
  join_date DATE NOT NULL COMMENT '加入日期',
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_class_student (class_id, student_id),
  INDEX idx_class (class_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='学生班级关联表';

-- ========================================
-- 4. 家长学生关联表 (parent_students)
-- ========================================
CREATE TABLE IF NOT EXISTS parent_students (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  parent_id INT NOT NULL COMMENT '家长ID',
  student_id INT NOT NULL COMMENT '学生ID',
  relationship VARCHAR(20) NOT NULL COMMENT '关系（父亲/母亲/监护人）',
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_parent_student (parent_id, student_id),
  INDEX idx_parent (parent_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='家长学生关联表';

-- ========================================
-- 5. 作业表 (assignments)
-- ========================================
CREATE TABLE IF NOT EXISTS assignments (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '作业ID',
  title VARCHAR(200) NOT NULL COMMENT '作业标题',
  description TEXT COMMENT '作业描述',
  class_id INT NOT NULL COMMENT '班级ID',
  teacher_id INT NOT NULL COMMENT '教师ID',
  difficulty ENUM('basic', 'medium', 'advanced') DEFAULT 'medium' COMMENT '难度等级',
  total_score INT NOT NULL COMMENT '总分',
  deadline TIMESTAMP NOT NULL COMMENT '截止时间',
  status ENUM('draft', 'published', 'closed') DEFAULT 'draft' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_status (status),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='作业表';

-- ========================================
-- 6. 题目表 (questions)
-- ========================================
CREATE TABLE IF NOT EXISTS questions (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '题目ID',
  assignment_id INT NOT NULL COMMENT '作业ID',
  question_number INT NOT NULL COMMENT '题号',
  question_type ENUM('choice', 'fill', 'judge', 'subjective') NOT NULL COMMENT '题型',
  question_content TEXT NOT NULL COMMENT '题目内容',
  standard_answer TEXT COMMENT '标准答案',
  score INT NOT NULL COMMENT '分值',
  knowledge_point_id INT COMMENT '知识点ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  INDEX idx_assignment (assignment_id),
  INDEX idx_type (question_type),
  INDEX idx_knowledge_point (knowledge_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='题目表';

-- ========================================
-- 7. 作业提交表 (submissions)
-- ========================================
CREATE TABLE IF NOT EXISTS submissions (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '提交ID',
  assignment_id INT NOT NULL COMMENT '作业ID',
  student_id INT NOT NULL COMMENT '学生ID',
  file_url VARCHAR(255) COMMENT '作业文件URL',
  submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  status ENUM('submitted', 'grading', 'graded', 'reviewed') DEFAULT 'submitted' COMMENT '状态',
  total_score INT COMMENT '总得分',
  grading_time TIMESTAMP NULL COMMENT '批改时间',
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_assignment_student (assignment_id, student_id),
  INDEX idx_assignment (assignment_id),
  INDEX idx_student (student_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='作业提交表';

-- ========================================
-- 8. 答题记录表 (answers)
-- ========================================
CREATE TABLE IF NOT EXISTS answers (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '答题ID',
  submission_id INT NOT NULL COMMENT '提交ID',
  question_id INT NOT NULL COMMENT '题目ID',
  student_answer TEXT NOT NULL COMMENT '学生答案',
  score INT COMMENT '得分',
  is_correct BOOLEAN COMMENT '是否正确',
  ai_feedback TEXT COMMENT 'AI反馈',
  needs_review BOOLEAN DEFAULT FALSE COMMENT '是否需要人工复核',
  reviewed_by INT COMMENT '复核教师ID',
  review_comment TEXT COMMENT '复核意见',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_submission (submission_id),
  INDEX idx_question (question_id),
  INDEX idx_needs_review (needs_review)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='答题记录表';

-- ========================================
-- 9. 知识点表 (knowledge_points)
-- ========================================
CREATE TABLE IF NOT EXISTS knowledge_points (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '知识点ID',
  name VARCHAR(100) NOT NULL COMMENT '知识点名称',
  subject VARCHAR(50) NOT NULL COMMENT '学科',
  grade VARCHAR(20) NOT NULL COMMENT '年级',
  parent_id INT COMMENT '父知识点ID',
  description TEXT COMMENT '描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_subject (subject),
  INDEX idx_grade (grade),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='知识点表';

-- ========================================
-- 10. 学生薄弱点表 (student_weak_points)
-- ========================================
CREATE TABLE IF NOT EXISTS student_weak_points (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '薄弱点ID',
  student_id INT NOT NULL COMMENT '学生ID',
  knowledge_point_id INT NOT NULL COMMENT '知识点ID',
  error_count INT DEFAULT 0 COMMENT '错误次数',
  total_count INT DEFAULT 0 COMMENT '总答题次数',
  error_rate DECIMAL(5,2) COMMENT '错误率',
  last_practice_time TIMESTAMP NULL COMMENT '最后练习时间',
  status ENUM('weak', 'improving', 'mastered') DEFAULT 'weak' COMMENT '状态',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_knowledge (student_id, knowledge_point_id),
  INDEX idx_student (student_id),
  INDEX idx_knowledge_point (knowledge_point_id),
  INDEX idx_error_rate (error_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='学生薄弱点表';

-- ========================================
-- 11. 题库表 (exercise_bank)
-- ========================================
CREATE TABLE IF NOT EXISTS exercise_bank (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '题目ID',
  title VARCHAR(200) NOT NULL COMMENT '题目标题',
  content TEXT NOT NULL COMMENT '题目内容',
  question_type ENUM('choice', 'fill', 'judge', 'subjective') NOT NULL COMMENT '题型',
  difficulty ENUM('basic', 'medium', 'advanced') NOT NULL COMMENT '难度',
  knowledge_point_id INT NOT NULL COMMENT '知识点ID',
  standard_answer TEXT NOT NULL COMMENT '标准答案',
  explanation TEXT COMMENT '解析',
  usage_count INT DEFAULT 0 COMMENT '使用次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
  INDEX idx_knowledge_point (knowledge_point_id),
  INDEX idx_difficulty (difficulty),
  INDEX idx_type (question_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='题库表';

-- ========================================
-- 12. AI问答记录表 (qa_records)
-- ========================================
CREATE TABLE IF NOT EXISTS qa_records (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '问答ID',
  student_id INT NOT NULL COMMENT '学生ID',
  question TEXT NOT NULL COMMENT '问题',
  answer TEXT NOT NULL COMMENT '答案',
  satisfaction ENUM('satisfied', 'unsatisfied', 'neutral') COMMENT '满意度',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='AI问答记录表';

-- ========================================
-- 13. 通知表 (notifications)
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID',
  user_id INT NOT NULL COMMENT '用户ID',
  type ENUM('assignment', 'grading', 'system', 'message') NOT NULL COMMENT '通知类型',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT NOT NULL COMMENT '内容',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='通知表';

-- ========================================
-- 14. 系统日志表 (system_logs)
-- ========================================
CREATE TABLE IF NOT EXISTS system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  log_type ENUM('error', 'warning', 'info', 'debug') NOT NULL COMMENT '日志类型',
  service VARCHAR(50) NOT NULL COMMENT '服务名称',
  message TEXT NOT NULL COMMENT '日志消息',
  stack_trace TEXT COMMENT '堆栈跟踪',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_log_type (log_type),
  INDEX idx_service (service),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统日志表';

-- ========================================
-- 表创建完成
-- ========================================
SELECT '数据库表结构创建完成！' AS message;
SELECT COUNT(*) AS table_count FROM information_schema.tables 
WHERE table_schema = 'edu_education_platform';
