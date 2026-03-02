-- 智慧教育平台 MySQL 索引优化脚本
-- 用于加速常用查询，建议在首次部署或数据量增大后执行
-- 执行前请确认表已存在。若索引已存在会报错，可忽略或先查询 information_schema 再创建。

-- users 表：登录、按角色查询
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- classes 表：按教师、班级查询
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);

-- assignments 表：列表分页、按班级/状态/截止时间
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_deadline ON assignments(deadline);
CREATE INDEX idx_assignments_created_at ON assignments(created_at);
CREATE INDEX idx_assignments_class_status ON assignments(class_id, status);

-- questions 表：按作业查询
CREATE INDEX idx_questions_assignment_id ON questions(assignment_id);

-- submissions 表：按作业/学生/状态查询、列表分页
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submit_time ON submissions(submit_time);
CREATE INDEX idx_submissions_assignment_student ON submissions(assignment_id, student_id);
