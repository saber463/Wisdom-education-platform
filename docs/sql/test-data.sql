-- ========================================
-- 智慧教育学习平台 - 测试数据初始化
-- ========================================

SET NAMES utf8mb4;
USE edu_education_platform;

-- 清空现有数据
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE system_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE qa_records;
TRUNCATE TABLE exercise_bank;
TRUNCATE TABLE student_weak_points;
TRUNCATE TABLE knowledge_points;
TRUNCATE TABLE answers;
TRUNCATE TABLE submissions;
TRUNCATE TABLE questions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE parent_students;
TRUNCATE TABLE class_students;
TRUNCATE TABLE classes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 1. 插入用户数据 (3个教师 + 30个学生 + 10个家长)
-- ========================================

-- 教师用户 (密码: teacher123, bcrypt哈希)
INSERT INTO users (username, password_hash, real_name, role, email, phone, status) VALUES
('teacher001', '$2b$10$YPV2GbpcooWfvP22TDM9Du8pbjZjuFzOIZJOd5XQbbzgpITN1v14y', '张老师', 'teacher', 'zhang@edu.com', '13800138001', 'active'),
('teacher002', '$2b$10$YPV2GbpcooWfvP22TDM9Du8pbjZjuFzOIZJOd5XQbbzgpITN1v14y', '李老师', 'teacher', 'li@edu.com', '13800138002', 'active'),
('teacher003', '$2b$10$YPV2GbpcooWfvP22TDM9Du8pbjZjuFzOIZJOd5XQbbzgpITN1v14y', '王老师', 'teacher', 'wang@edu.com', '13800138003', 'active');

-- 学生用户 (密码: student123)
INSERT INTO users (username, password_hash, real_name, role, email, phone, status) VALUES
('student001', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '张小明', 'student', 'zhangxm@stu.edu.com', '13900139001', 'active'),
('student002', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '李小红', 'student', 'lixh@stu.edu.com', '13900139002', 'active'),
('student003', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '王小刚', 'student', 'wangxg@stu.edu.com', '13900139003', 'active');


-- 继续插入学生 (4-30)
INSERT INTO users (username, password_hash, real_name, role, email, status) VALUES
('student004', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '赵小华', 'student', 'zhaoxh@stu.edu.com', 'active'),
('student005', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '钱小丽', 'student', 'qianxl@stu.edu.com', 'active'),
('student006', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '孙小军', 'student', 'sunxj@stu.edu.com', 'active'),
('student007', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '周小芳', 'student', 'zhouxf@stu.edu.com', 'active'),
('student008', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '吴小强', 'student', 'wuxq@stu.edu.com', 'active'),
('student009', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '郑小梅', 'student', 'zhengxm@stu.edu.com', 'active'),
('student010', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '冯小龙', 'student', 'fengxl@stu.edu.com', 'active'),
('student011', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '陈小燕', 'student', 'chenxy@stu.edu.com', 'active'),
('student012', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '褚小伟', 'student', 'chuxw@stu.edu.com', 'active'),
('student013', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '卫小静', 'student', 'weixj@stu.edu.com', 'active'),
('student014', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '蒋小波', 'student', 'jiangxb@stu.edu.com', 'active'),
('student015', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '沈小玲', 'student', 'shenxl@stu.edu.com', 'active'),
('student016', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '韩小峰', 'student', 'hanxf@stu.edu.com', 'active'),
('student017', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '杨小霞', 'student', 'yangxx@stu.edu.com', 'active'),
('student018', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '朱小鹏', 'student', 'zhuxp@stu.edu.com', 'active'),
('student019', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '秦小兰', 'student', 'qinxl@stu.edu.com', 'active'),
('student020', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '尤小涛', 'student', 'youxt@stu.edu.com', 'active'),
('student021', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '许小娟', 'student', 'xuxj@stu.edu.com', 'active'),
('student022', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '何小斌', 'student', 'hexb@stu.edu.com', 'active'),
('student023', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '吕小敏', 'student', 'lvxm@stu.edu.com', 'active'),
('student024', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '施小杰', 'student', 'shixj@stu.edu.com', 'active'),
('student025', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '张小慧', 'student', 'zhangxh@stu.edu.com', 'active'),
('student026', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '孔小超', 'student', 'kongxc@stu.edu.com', 'active'),
('student027', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '曹小琴', 'student', 'caoxq@stu.edu.com', 'active'),
('student028', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '严小勇', 'student', 'yanxy@stu.edu.com', 'active'),
('student029', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '华小艳', 'student', 'huaxy@stu.edu.com', 'active'),
('student030', '$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge', '金小磊', 'student', 'jinxl@stu.edu.com', 'active');

-- 家长用户 (密码: parent123)
INSERT INTO users (username, password_hash, real_name, role, email, phone, status) VALUES
('parent001', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '张父', 'parent', 'zhangf@parent.com', '13700137001', 'active'),
('parent002', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '张母', 'parent', 'zhangm@parent.com', '13700137002', 'active'),
('parent003', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '李父', 'parent', 'lif@parent.com', '13700137003', 'active'),
('parent004', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '李母', 'parent', 'lim@parent.com', '13700137004', 'active'),
('parent005', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '王父', 'parent', 'wangf@parent.com', '13700137005', 'active'),
('parent006', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '王母', 'parent', 'wangm@parent.com', '13700137006', 'active'),
('parent007', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '赵父', 'parent', 'zhaof@parent.com', '13700137007', 'active'),
('parent008', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '赵母', 'parent', 'zhaom@parent.com', '13700137008', 'active'),
('parent009', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '钱父', 'parent', 'qianf@parent.com', '13700137009', 'active'),
('parent010', '$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6', '钱母', 'parent', 'qianm@parent.com', '13700137010', 'active');

-- ========================================
-- 2. 插入班级数据 (5个班级)
-- ========================================
-- 使用子查询获取正确的教师ID
INSERT INTO classes (name, grade, teacher_id, student_count) VALUES
('一年级1班', '一年级', (SELECT id FROM users WHERE username='teacher001'), 10),
('一年级2班', '一年级', (SELECT id FROM users WHERE username='teacher002'), 10),
('二年级1班', '二年级', (SELECT id FROM users WHERE username='teacher003'), 10),
('三年级1班', '三年级', (SELECT id FROM users WHERE username='teacher001'), 0),
('四年级1班', '四年级', (SELECT id FROM users WHERE username='teacher002'), 0);

-- ========================================
-- 3. 插入学生班级关联 (30个学生分配到班级)
-- ========================================
-- 使用子查询获取正确的用户ID
INSERT INTO class_students (class_id, student_id, join_date) VALUES
-- 一年级1班 (10人)
(1, (SELECT id FROM users WHERE username='student001'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student002'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student003'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student004'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student005'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student006'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student007'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student008'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student009'), '2024-09-01'),
(1, (SELECT id FROM users WHERE username='student010'), '2024-09-01'),
-- 一年级2班 (10人)
(2, (SELECT id FROM users WHERE username='student011'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student012'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student013'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student014'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student015'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student016'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student017'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student018'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student019'), '2024-09-01'),
(2, (SELECT id FROM users WHERE username='student020'), '2024-09-01'),
-- 二年级1班 (10人)
(3, (SELECT id FROM users WHERE username='student021'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student022'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student023'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student024'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student025'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student026'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student027'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student028'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student029'), '2024-09-01'),
(3, (SELECT id FROM users WHERE username='student030'), '2024-09-01');

-- ========================================
-- 4. 插入家长学生关联 (10个家长关联前5个学生)
-- ========================================
-- 使用子查询获取正确的用户ID
INSERT INTO parent_students (parent_id, student_id, relationship) VALUES
((SELECT id FROM users WHERE username='parent001'), (SELECT id FROM users WHERE username='student001'), '父亲'),
((SELECT id FROM users WHERE username='parent002'), (SELECT id FROM users WHERE username='student001'), '母亲'),
((SELECT id FROM users WHERE username='parent003'), (SELECT id FROM users WHERE username='student002'), '父亲'),
((SELECT id FROM users WHERE username='parent004'), (SELECT id FROM users WHERE username='student002'), '母亲'),
((SELECT id FROM users WHERE username='parent005'), (SELECT id FROM users WHERE username='student003'), '父亲'),
((SELECT id FROM users WHERE username='parent006'), (SELECT id FROM users WHERE username='student003'), '母亲'),
((SELECT id FROM users WHERE username='parent007'), (SELECT id FROM users WHERE username='student004'), '父亲'),
((SELECT id FROM users WHERE username='parent008'), (SELECT id FROM users WHERE username='student004'), '母亲'),
((SELECT id FROM users WHERE username='parent009'), (SELECT id FROM users WHERE username='student005'), '父亲'),
((SELECT id FROM users WHERE username='parent010'), (SELECT id FROM users WHERE username='student005'), '母亲');

-- ========================================
-- 5. 插入知识点数据 (20个知识点)
-- ========================================
INSERT INTO knowledge_points (name, subject, grade, parent_id, description) VALUES
-- 数学知识点
('加法运算', '数学', '一年级', NULL, '10以内加法'),
('减法运算', '数学', '一年级', NULL, '10以内减法'),
('乘法口诀', '数学', '二年级', NULL, '九九乘法表'),
('除法运算', '数学', '二年级', NULL, '简单除法'),
('分数概念', '数学', '三年级', NULL, '分数的认识'),
-- 语文知识点
('拼音认读', '语文', '一年级', NULL, '声母韵母'),
('汉字书写', '语文', '一年级', NULL, '基本笔画'),
('词语理解', '语文', '二年级', NULL, '词语含义'),
('句子结构', '语文', '二年级', NULL, '主谓宾'),
('阅读理解', '语文', '三年级', NULL, '文章理解'),
-- 英语知识点
('字母认读', '英语', '一年级', NULL, '26个字母'),
('单词拼写', '英语', '一年级', NULL, '基础单词'),
('简单对话', '英语', '二年级', NULL, '日常对话'),
('语法基础', '英语', '二年级', NULL, '时态语态'),
('阅读理解', '英语', '三年级', NULL, '短文理解'),
-- 科学知识点
('动物认知', '科学', '一年级', NULL, '常见动物'),
('植物认知', '科学', '一年级', NULL, '常见植物'),
('天气现象', '科学', '二年级', NULL, '天气变化'),
('物质状态', '科学', '二年级', NULL, '固液气'),
('能量转换', '科学', '三年级', NULL, '能量形式');

-- ========================================
-- 6. 插入题库数据 (100道题目)
-- ========================================
-- 数学题目 (30道)
INSERT INTO exercise_bank (title, content, question_type, difficulty, knowledge_point_id, standard_answer, explanation) VALUES
('加法题1', '1 + 1 = ?', 'fill', 'basic', 1, '2', '1加1等于2'),
('加法题2', '2 + 3 = ?', 'fill', 'basic', 1, '5', '2加3等于5'),
('加法题3', '4 + 5 = ?', 'fill', 'basic', 1, '9', '4加5等于9'),
('加法题4', '6 + 3 = ?', 'fill', 'basic', 1, '9', '6加3等于9'),
('加法题5', '7 + 2 = ?', 'fill', 'basic', 1, '9', '7加2等于9'),
('减法题1', '5 - 2 = ?', 'fill', 'basic', 2, '3', '5减2等于3'),
('减法题2', '8 - 3 = ?', 'fill', 'basic', 2, '5', '8减3等于5'),
('减法题3', '9 - 4 = ?', 'fill', 'basic', 2, '5', '9减4等于5'),
('减法题4', '10 - 6 = ?', 'fill', 'basic', 2, '4', '10减6等于4'),
('减法题5', '7 - 5 = ?', 'fill', 'basic', 2, '2', '7减5等于2'),
('乘法题1', '2 × 3 = ?', 'fill', 'medium', 3, '6', '2乘3等于6'),
('乘法题2', '4 × 5 = ?', 'fill', 'medium', 3, '20', '4乘5等于20'),
('乘法题3', '6 × 7 = ?', 'fill', 'medium', 3, '42', '6乘7等于42'),
('乘法题4', '8 × 9 = ?', 'fill', 'medium', 3, '72', '8乘9等于72'),
('乘法题5', '3 × 8 = ?', 'fill', 'medium', 3, '24', '3乘8等于24'),
('除法题1', '6 ÷ 2 = ?', 'fill', 'medium', 4, '3', '6除以2等于3'),
('除法题2', '12 ÷ 3 = ?', 'fill', 'medium', 4, '4', '12除以3等于4'),
('除法题3', '20 ÷ 4 = ?', 'fill', 'medium', 4, '5', '20除以4等于5'),
('除法题4', '18 ÷ 6 = ?', 'fill', 'medium', 4, '3', '18除以6等于3'),
('除法题5', '24 ÷ 8 = ?', 'fill', 'medium', 4, '3', '24除以8等于3'),
('分数题1', '1/2 + 1/2 = ?', 'fill', 'advanced', 5, '1', '二分之一加二分之一等于1'),
('分数题2', '1/3 + 1/3 = ?', 'fill', 'advanced', 5, '2/3', '三分之一加三分之一等于三分之二'),
('分数题3', '1/4 + 1/4 = ?', 'fill', 'advanced', 5, '1/2', '四分之一加四分之一等于二分之一'),
('分数题4', '2/5 + 1/5 = ?', 'fill', 'advanced', 5, '3/5', '五分之二加五分之一等于五分之三'),
('分数题5', '3/8 + 1/8 = ?', 'fill', 'advanced', 5, '1/2', '八分之三加八分之一等于二分之一'),
('数学选择1', '下列哪个是偶数？A.1 B.2 C.3 D.5', 'choice', 'basic', 1, 'B', '2是偶数'),
('数学选择2', '下列哪个是质数？A.4 B.6 C.7 D.8', 'choice', 'medium', 3, 'C', '7是质数'),
('数学选择3', '1米等于多少厘米？A.10 B.100 C.1000 D.10000', 'choice', 'basic', 1, 'B', '1米=100厘米'),
('数学判断1', '5 > 3 是正确的', 'judge', 'basic', 1, '正确', '5大于3'),
('数学判断2', '0是自然数', 'judge', 'medium', 1, '正确', '0是自然数');

-- 语文题目 (30道)
INSERT INTO exercise_bank (title, content, question_type, difficulty, knowledge_point_id, standard_answer, explanation) VALUES
('拼音题1', 'b-a拼成什么？', 'fill', 'basic', 6, 'ba', 'b和a拼成ba'),
('拼音题2', 'p-o拼成什么？', 'fill', 'basic', 6, 'po', 'p和o拼成po'),
('拼音题3', 'm-a拼成什么？', 'fill', 'basic', 6, 'ma', 'm和a拼成ma'),
('拼音题4', 'f-u拼成什么？', 'fill', 'basic', 6, 'fu', 'f和u拼成fu'),
('拼音题5', 'd-e拼成什么？', 'fill', 'basic', 6, 'de', 'd和e拼成de'),
('汉字题1', '"一"字有几画？', 'fill', 'basic', 7, '1', '一字只有一画'),
('汉字题2', '"二"字有几画？', 'fill', 'basic', 7, '2', '二字有两画'),
('汉字题3', '"三"字有几画？', 'fill', 'basic', 7, '3', '三字有三画'),
('汉字题4', '"木"字有几画？', 'fill', 'basic', 7, '4', '木字有四画'),
('汉字题5', '"水"字有几画？', 'fill', 'basic', 7, '4', '水字有四画'),
('词语题1', '"高兴"的近义词是什么？', 'fill', 'medium', 8, '快乐', '高兴和快乐意思相近'),
('词语题2', '"美丽"的近义词是什么？', 'fill', 'medium', 8, '漂亮', '美丽和漂亮意思相近'),
('词语题3', '"勇敢"的反义词是什么？', 'fill', 'medium', 8, '胆小', '勇敢和胆小意思相反'),
('词语题4', '"聪明"的反义词是什么？', 'fill', 'medium', 8, '愚蠢', '聪明和愚蠢意思相反'),
('词语题5', '"温暖"的反义词是什么？', 'fill', 'medium', 8, '寒冷', '温暖和寒冷意思相反'),
('句子题1', '判断："我爱学习"是完整的句子', 'judge', 'medium', 9, '正确', '主谓宾齐全'),
('句子题2', '判断："美丽的花"是完整的句子', 'judge', 'medium', 9, '错误', '缺少谓语'),
('句子题3', '判断："小明在教室里读书"是完整的句子', 'judge', 'medium', 9, '正确', '主谓宾齐全'),
('句子题4', '判断："跑步"是完整的句子', 'judge', 'medium', 9, '错误', '缺少主语'),
('句子题5', '判断："老师讲课"是完整的句子', 'judge', 'medium', 9, '正确', '主谓齐全'),
('阅读题1', '《小猫钓鱼》中小猫为什么没钓到鱼？', 'subjective', 'advanced', 10, '因为小猫三心二意，不专心', '要专心才能成功'),
('阅读题2', '《乌鸦喝水》中乌鸦是怎么喝到水的？', 'subjective', 'advanced', 10, '乌鸦把石子放进瓶子里，水位上升后喝到了水', '遇到困难要想办法'),
('阅读题3', '《龟兔赛跑》告诉我们什么道理？', 'subjective', 'advanced', 10, '骄傲使人落后，谦虚使人进步', '不能骄傲自满'),
('语文选择1', '"春眠不觉晓"的下一句是？A.处处闻啼鸟 B.夜来风雨声 C.花落知多少', 'choice', 'medium', 10, 'A', '孟浩然《春晓》'),
('语文选择2', '"床前明月光"的作者是？A.杜甫 B.李白 C.白居易', 'choice', 'medium', 10, 'B', '李白《静夜思》'),
('语文选择3', '下列哪个字是象形字？A.日 B.上 C.好', 'choice', 'advanced', 7, 'A', '日是象形字'),
('语文判断1', '"春天"是名词', 'judge', 'medium', 8, '正确', '春天是名词'),
('语文判断2', '"跑"是动词', 'judge', 'medium', 8, '正确', '跑是动词'),
('语文判断3', '"美丽"是形容词', 'judge', 'medium', 8, '正确', '美丽是形容词'),
('语文判断4', '"快乐地"是副词', 'judge', 'medium', 8, '正确', '快乐地是副词');

-- 英语题目 (20道)
INSERT INTO exercise_bank (title, content, question_type, difficulty, knowledge_point_id, standard_answer, explanation) VALUES
('字母题1', 'A的小写字母是什么？', 'fill', 'basic', 11, 'a', 'A的小写是a'),
('字母题2', 'B的小写字母是什么？', 'fill', 'basic', 11, 'b', 'B的小写是b'),
('字母题3', 'C的小写字母是什么？', 'fill', 'basic', 11, 'c', 'C的小写是c'),
('字母题4', 'D的小写字母是什么？', 'fill', 'basic', 11, 'd', 'D的小写是d'),
('字母题5', 'E的小写字母是什么？', 'fill', 'basic', 11, 'e', 'E的小写是e'),
('单词题1', '"苹果"的英文是什么？', 'fill', 'basic', 12, 'apple', 'apple是苹果'),
('单词题2', '"香蕉"的英文是什么？', 'fill', 'basic', 12, 'banana', 'banana是香蕉'),
('单词题3', '"猫"的英文是什么？', 'fill', 'basic', 12, 'cat', 'cat是猫'),
('单词题4', '"狗"的英文是什么？', 'fill', 'basic', 12, 'dog', 'dog是狗'),
('单词题5', '"书"的英文是什么？', 'fill', 'basic', 12, 'book', 'book是书'),
('对话题1', '"你好"用英语怎么说？', 'fill', 'medium', 13, 'Hello', 'Hello是你好'),
('对话题2', '"谢谢"用英语怎么说？', 'fill', 'medium', 13, 'Thank you', 'Thank you是谢谢'),
('对话题3', '"再见"用英语怎么说？', 'fill', 'medium', 13, 'Goodbye', 'Goodbye是再见'),
('对话题4', '"早上好"用英语怎么说？', 'fill', 'medium', 13, 'Good morning', 'Good morning是早上好'),
('对话题5', '"晚安"用英语怎么说？', 'fill', 'medium', 13, 'Good night', 'Good night是晚安'),
('英语选择1', '"I am a student"中"am"是什么词？A.名词 B.动词 C.形容词', 'choice', 'medium', 14, 'B', 'am是be动词'),
('英语选择2', '"He is happy"中"happy"是什么词？A.名词 B.动词 C.形容词', 'choice', 'medium', 14, 'C', 'happy是形容词'),
('英语判断1', '"I am"可以缩写成"I\'m"', 'judge', 'medium', 14, '正确', 'I am = I\'m'),
('英语判断2', '"He is"可以缩写成"He\'s"', 'judge', 'medium', 14, '正确', 'He is = He\'s'),
('英语判断3', '"They are"可以缩写成"They\'re"', 'judge', 'medium', 14, '正确', 'They are = They\'re');

-- 科学题目 (20道)
INSERT INTO exercise_bank (title, content, question_type, difficulty, knowledge_point_id, standard_answer, explanation) VALUES
('动物题1', '猫是哺乳动物吗？', 'judge', 'basic', 16, '正确', '猫是哺乳动物'),
('动物题2', '鱼是哺乳动物吗？', 'judge', 'basic', 16, '错误', '鱼不是哺乳动物'),
('动物题3', '鸟会飞吗？', 'judge', 'basic', 16, '正确', '大多数鸟会飞'),
('动物题4', '蛇有腿吗？', 'judge', 'basic', 16, '错误', '蛇没有腿'),
('动物题5', '兔子吃肉吗？', 'judge', 'basic', 16, '错误', '兔子是草食动物'),
('植物题1', '植物需要阳光吗？', 'judge', 'basic', 17, '正确', '植物需要光合作用'),
('植物题2', '植物需要水吗？', 'judge', 'basic', 17, '正确', '植物需要水分'),
('植物题3', '植物会呼吸吗？', 'judge', 'basic', 17, '正确', '植物会呼吸'),
('植物题4', '仙人掌生长在沙漠吗？', 'judge', 'basic', 17, '正确', '仙人掌耐旱'),
('植物题5', '树叶在秋天会变色吗？', 'judge', 'basic', 17, '正确', '秋天树叶变色'),
('天气题1', '下雨天空中有什么？', 'fill', 'medium', 18, '云', '云会下雨'),
('天气题2', '彩虹有几种颜色？', 'fill', 'medium', 18, '7', '彩虹有7种颜色'),
('天气题3', '雪是什么形成的？', 'subjective', 'medium', 18, '水蒸气在高空遇冷凝结成冰晶', '雪的形成过程'),
('物质题1', '冰是固体吗？', 'judge', 'medium', 19, '正确', '冰是固体'),
('物质题2', '水是液体吗？', 'judge', 'medium', 19, '正确', '水是液体'),
('物质题3', '水蒸气是气体吗？', 'judge', 'medium', 19, '正确', '水蒸气是气体'),
('物质题4', '冰融化后变成什么？', 'fill', 'medium', 19, '水', '冰融化成水'),
('物质题5', '水加热后变成什么？', 'fill', 'medium', 19, '水蒸气', '水加热成水蒸气'),
('能量题1', '太阳能是一种能量吗？', 'judge', 'advanced', 20, '正确', '太阳能是能量'),
('能量题2', '电能可以转换成光能吗？', 'judge', 'advanced', 20, '正确', '电灯将电能转换成光能');

-- ========================================
-- 7. 插入作业数据 (20份作业)
-- ========================================
INSERT INTO assignments (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) VALUES
('数学作业1：加减法练习', '完成10道加减法题目', 1, 1, 'basic', 100, '2025-01-20 23:59:59', 'published'),
('数学作业2：乘法口诀', '背诵并默写九九乘法表', 2, 2, 'medium', 100, '2025-01-21 23:59:59', 'published'),
('数学作业3：除法运算', '完成10道除法题目', 3, 3, 'medium', 100, '2025-01-22 23:59:59', 'published'),
('数学作业4：分数计算', '完成5道分数加减法', 1, 1, 'advanced', 100, '2025-01-23 23:59:59', 'draft'),
('数学作业5：综合练习', '加减乘除综合练习', 2, 2, 'medium', 100, '2025-01-24 23:59:59', 'draft'),
('语文作业1：拼音练习', '完成拼音拼读练习', 1, 1, 'basic', 100, '2025-01-20 23:59:59', 'published'),
('语文作业2：汉字书写', '练习基本笔画和汉字', 2, 2, 'basic', 100, '2025-01-21 23:59:59', 'published'),
('语文作业3：词语积累', '学习近义词和反义词', 3, 3, 'medium', 100, '2025-01-22 23:59:59', 'published'),
('语文作业4：句子练习', '判断句子是否完整', 1, 1, 'medium', 100, '2025-01-23 23:59:59', 'draft'),
('语文作业5：阅读理解', '阅读短文并回答问题', 2, 2, 'advanced', 100, '2025-01-24 23:59:59', 'draft'),
('英语作业1：字母认读', '认读26个英文字母', 1, 1, 'basic', 100, '2025-01-20 23:59:59', 'published'),
('英语作业2：单词拼写', '拼写10个基础单词', 2, 2, 'basic', 100, '2025-01-21 23:59:59', 'published'),
('英语作业3：简单对话', '学习日常问候语', 3, 3, 'medium', 100, '2025-01-22 23:59:59', 'published'),
('英语作业4：语法练习', '练习be动词的用法', 1, 1, 'medium', 100, '2025-01-23 23:59:59', 'draft'),
('英语作业5：阅读理解', '阅读英文短文', 2, 2, 'advanced', 100, '2025-01-24 23:59:59', 'draft'),
('科学作业1：动物认知', '认识常见动物', 1, 1, 'basic', 100, '2025-01-20 23:59:59', 'published'),
('科学作业2：植物认知', '认识常见植物', 2, 2, 'basic', 100, '2025-01-21 23:59:59', 'published'),
('科学作业3：天气现象', '观察天气变化', 3, 3, 'medium', 100, '2025-01-22 23:59:59', 'published'),
('科学作业4：物质状态', '了解固液气三态', 1, 1, 'medium', 100, '2025-01-23 23:59:59', 'draft'),
('科学作业5：能量转换', '认识不同形式的能量', 2, 2, 'advanced', 100, '2025-01-24 23:59:59', 'draft');

-- ========================================
-- 8. 插入题目数据 (每份作业5道题，共100道)
-- ========================================
-- 数学作业1的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(1, 1, 'fill', '1 + 1 = ?', '2', 20, 1),
(1, 2, 'fill', '2 + 3 = ?', '5', 20, 1),
(1, 3, 'fill', '5 - 2 = ?', '3', 20, 2),
(1, 4, 'fill', '8 - 3 = ?', '5', 20, 2),
(1, 5, 'judge', '5 > 3 是正确的', '正确', 20, 1);

-- 数学作业2的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(2, 1, 'fill', '2 × 3 = ?', '6', 20, 3),
(2, 2, 'fill', '4 × 5 = ?', '20', 20, 3),
(2, 3, 'fill', '6 × 7 = ?', '42', 20, 3),
(2, 4, 'fill', '8 × 9 = ?', '72', 20, 3),
(2, 5, 'fill', '3 × 8 = ?', '24', 20, 3);

-- 数学作业3的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(3, 1, 'fill', '6 ÷ 2 = ?', '3', 20, 4),
(3, 2, 'fill', '12 ÷ 3 = ?', '4', 20, 4),
(3, 3, 'fill', '20 ÷ 4 = ?', '5', 20, 4),
(3, 4, 'fill', '18 ÷ 6 = ?', '3', 20, 4),
(3, 5, 'fill', '24 ÷ 8 = ?', '3', 20, 4);

-- 语文作业1的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(6, 1, 'fill', 'b-a拼成什么？', 'ba', 20, 6),
(6, 2, 'fill', 'p-o拼成什么？', 'po', 20, 6),
(6, 3, 'fill', 'm-a拼成什么？', 'ma', 20, 6),
(6, 4, 'fill', 'f-u拼成什么？', 'fu', 20, 6),
(6, 5, 'fill', 'd-e拼成什么？', 'de', 20, 6);

-- 语文作业2的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(7, 1, 'fill', '"一"字有几画？', '1', 20, 7),
(7, 2, 'fill', '"二"字有几画？', '2', 20, 7),
(7, 3, 'fill', '"三"字有几画？', '3', 20, 7),
(7, 4, 'fill', '"木"字有几画？', '4', 20, 7),
(7, 5, 'fill', '"水"字有几画？', '4', 20, 7);

-- 语文作业3的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(8, 1, 'fill', '"高兴"的近义词是什么？', '快乐', 20, 8),
(8, 2, 'fill', '"美丽"的近义词是什么？', '漂亮', 20, 8),
(8, 3, 'fill', '"勇敢"的反义词是什么？', '胆小', 20, 8),
(8, 4, 'fill', '"聪明"的反义词是什么？', '愚蠢', 20, 8),
(8, 5, 'fill', '"温暖"的反义词是什么？', '寒冷', 20, 8);

-- 英语作业1的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(11, 1, 'fill', 'A的小写字母是什么？', 'a', 20, 11),
(11, 2, 'fill', 'B的小写字母是什么？', 'b', 20, 11),
(11, 3, 'fill', 'C的小写字母是什么？', 'c', 20, 11),
(11, 4, 'fill', 'D的小写字母是什么？', 'd', 20, 11),
(11, 5, 'fill', 'E的小写字母是什么？', 'e', 20, 11);

-- 英语作业2的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(12, 1, 'fill', '"苹果"的英文是什么？', 'apple', 20, 12),
(12, 2, 'fill', '"香蕉"的英文是什么？', 'banana', 20, 12),
(12, 3, 'fill', '"猫"的英文是什么？', 'cat', 20, 12),
(12, 4, 'fill', '"狗"的英文是什么？', 'dog', 20, 12),
(12, 5, 'fill', '"书"的英文是什么？', 'book', 20, 12);

-- 英语作业3的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(13, 1, 'fill', '"你好"用英语怎么说？', 'Hello', 20, 13),
(13, 2, 'fill', '"谢谢"用英语怎么说？', 'Thank you', 20, 13),
(13, 3, 'fill', '"再见"用英语怎么说？', 'Goodbye', 20, 13),
(13, 4, 'fill', '"早上好"用英语怎么说？', 'Good morning', 20, 13),
(13, 5, 'fill', '"晚安"用英语怎么说？', 'Good night', 20, 13);

-- 科学作业1的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(16, 1, 'judge', '猫是哺乳动物吗？', '正确', 20, 16),
(16, 2, 'judge', '鱼是哺乳动物吗？', '错误', 20, 16),
(16, 3, 'judge', '鸟会飞吗？', '正确', 20, 16),
(16, 4, 'judge', '蛇有腿吗？', '错误', 20, 16),
(16, 5, 'judge', '兔子吃肉吗？', '错误', 20, 16);

-- 科学作业2的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(17, 1, 'judge', '植物需要阳光吗？', '正确', 20, 17),
(17, 2, 'judge', '植物需要水吗？', '正确', 20, 17),
(17, 3, 'judge', '植物会呼吸吗？', '正确', 20, 17),
(17, 4, 'judge', '仙人掌生长在沙漠吗？', '正确', 20, 17),
(17, 5, 'judge', '树叶在秋天会变色吗？', '正确', 20, 17);

-- 科学作业3的题目 (5道)
INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) VALUES
(18, 1, 'fill', '下雨天空中有什么？', '云', 20, 18),
(18, 2, 'fill', '彩虹有几种颜色？', '7', 20, 18),
(18, 3, 'subjective', '雪是什么形成的？', '水蒸气在高空遇冷凝结成冰晶', 20, 18),
(18, 4, 'judge', '冰是固体吗？', '正确', 20, 19),
(18, 5, 'judge', '水是液体吗？', '正确', 20, 19);

-- ========================================
-- 9. 插入通知数据 (示例)
-- ========================================
INSERT INTO notifications (user_id, type, title, content, is_read) VALUES
((SELECT id FROM users WHERE username='student001'), 'assignment', '新作业通知', '张老师发布了新作业：数学作业1', FALSE),
((SELECT id FROM users WHERE username='student002'), 'assignment', '新作业通知', '李老师发布了新作业：数学作业2', FALSE),
((SELECT id FROM users WHERE username='student003'), 'assignment', '新作业通知', '王老师发布了新作业：数学作业3', FALSE),
((SELECT id FROM users WHERE username='parent001'), 'system', '系统通知', '欢迎使用智慧教育学习平台', TRUE),
((SELECT id FROM users WHERE username='parent002'), 'system', '系统通知', '欢迎使用智慧教育学习平台', TRUE);

-- ========================================
-- 10. 插入系统日志 (示例)
-- ========================================
INSERT INTO system_logs (log_type, service, message) VALUES
('info', 'database', '数据库初始化完成'),
('info', 'backend', 'Node.js后端服务启动'),
('info', 'python-ai', 'Python AI服务启动'),
('info', 'rust-service', 'Rust高性能服务启动');

-- ========================================
-- 数据初始化完成
-- ========================================
SELECT '测试数据初始化完成！' AS message;
SELECT 
  (SELECT COUNT(*) FROM users) AS users_count,
  (SELECT COUNT(*) FROM classes) AS classes_count,
  (SELECT COUNT(*) FROM assignments) AS assignments_count,
  (SELECT COUNT(*) FROM questions) AS questions_count,
  (SELECT COUNT(*) FROM knowledge_points) AS knowledge_points_count,
  (SELECT COUNT(*) FROM exercise_bank) AS exercise_bank_count;
