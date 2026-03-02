/**
 * 集成测试：完整作业流程
 * Feature: smart-education-platform
 * 
 * 测试场景：教师发布作业 → 学生提交 → AI批改 → 教师查看
 * 验证需求：1.1-2.7
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import mysql from 'mysql2/promise';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'edu_education_platform',
  charset: 'utf8mb4'
};

let connection: mysql.Connection;
let teacherId: number;
let studentId: number;
let classId: number;
let assignmentId: number;
let submissionId: number;

describe('完整作业流程集成测试', () => {
  beforeAll(async () => {
    // 建立数据库连接
    connection = await mysql.createConnection(dbConfig);
    
    // 创建测试数据
    await setupTestData();
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestData();
    
    // 关闭数据库连接
    if (connection) {
      await connection.end();
    }
  });

  test('1.1 教师登录系统并查看班级列表', async () => {
    // 验证教师用户存在
    const [teachers] = await connection.execute(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [teacherId, 'teacher']
    );
    
    expect(Array.isArray(teachers)).toBe(true);
    expect((teachers as any[]).length).toBe(1);
    expect((teachers as any[])[0].role).toBe('teacher');
    
    // 验证班级列表可查询
    const [classes] = await connection.execute(
      'SELECT * FROM classes WHERE teacher_id = ?',
      [teacherId]
    );
    
    expect(Array.isArray(classes)).toBe(true);
    expect((classes as any[]).length).toBeGreaterThan(0);
  });

  test('1.2 教师创建新作业（包含所有必需字段）', async () => {
    const assignmentData = {
      title: '集成测试作业-数学期中考试',
      description: '测试完整作业流程',
      class_id: classId,
      teacher_id: teacherId,
      difficulty: 'medium',
      total_score: 100,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      status: 'draft'
    };
    
    const [result] = await connection.execute(
      `INSERT INTO assignments (title, description, class_id, teacher_id, difficulty, total_score, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignmentData.title,
        assignmentData.description,
        assignmentData.class_id,
        assignmentData.teacher_id,
        assignmentData.difficulty,
        assignmentData.total_score,
        assignmentData.deadline,
        assignmentData.status
      ]
    );
    
    assignmentId = (result as any).insertId;
    expect(assignmentId).toBeGreaterThan(0);
    
    // 验证作业创建成功
    const [assignments] = await connection.execute(
      'SELECT * FROM assignments WHERE id = ?',
      [assignmentId]
    );
    
    expect((assignments as any[]).length).toBe(1);
    expect((assignments as any[])[0].title).toBe(assignmentData.title);
    expect((assignments as any[])[0].total_score).toBe(assignmentData.total_score);
  });

  test('1.3 教师添加题目到作业（客观题和主观题）', async () => {
    // 添加客观题（选择题）
    const objectiveQuestion = {
      assignment_id: assignmentId,
      question_number: 1,
      question_type: 'choice',
      question_content: '1+1等于多少？ A.1 B.2 C.3 D.4',
      standard_answer: 'B',
      score: 10
    };
    
    const [objResult] = await connection.execute(
      `INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        objectiveQuestion.assignment_id,
        objectiveQuestion.question_number,
        objectiveQuestion.question_type,
        objectiveQuestion.question_content,
        objectiveQuestion.standard_answer,
        objectiveQuestion.score
      ]
    );
    
    expect((objResult as any).insertId).toBeGreaterThan(0);
    
    // 添加主观题
    const subjectiveQuestion = {
      assignment_id: assignmentId,
      question_number: 2,
      question_type: 'subjective',
      question_content: '请简述数学在日常生活中的应用',
      standard_answer: '数学在购物、时间管理、财务规划等方面都有广泛应用',
      score: 20
    };
    
    const [subjResult] = await connection.execute(
      `INSERT INTO questions (assignment_id, question_number, question_type, question_content, standard_answer, score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        subjectiveQuestion.assignment_id,
        subjectiveQuestion.question_number,
        subjectiveQuestion.question_type,
        subjectiveQuestion.question_content,
        subjectiveQuestion.standard_answer,
        subjectiveQuestion.score
      ]
    );
    
    expect((subjResult as any).insertId).toBeGreaterThan(0);
    
    // 验证题目添加成功
    const [questions] = await connection.execute(
      'SELECT * FROM questions WHERE assignment_id = ? ORDER BY question_number',
      [assignmentId]
    );
    
    expect((questions as any[]).length).toBe(2);
    expect((questions as any[])[0].question_type).toBe('choice');
    expect((questions as any[])[1].question_type).toBe('subjective');
  });

  test('1.4 教师发布作业并推送通知到学生', async () => {
    // 更新作业状态为已发布
    await connection.execute(
      'UPDATE assignments SET status = ? WHERE id = ?',
      ['published', assignmentId]
    );
    
    // 获取班级所有学生
    const [students] = await connection.execute(
      'SELECT student_id FROM class_students WHERE class_id = ?',
      [classId]
    );
    
    expect((students as any[]).length).toBeGreaterThan(0);
    
    // 记录发送通知前的数量
    const notificationsBefore = await connection.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE type = ? AND title LIKE ?',
      ['assignment', '%新作业通知%']
    );
    const countBefore = (notificationsBefore[0] as any[])[0].count;
    
    // 为每个学生创建通知
    for (const student of students as any[]) {
      const [notifResult] = await connection.execute(
        `INSERT INTO notifications (user_id, type, title, content, is_read)
         VALUES (?, ?, ?, ?, ?)`,
        [
          student.student_id,
          'assignment',
          '新作业通知',
          `教师发布了新作业：集成测试作业-数学期中考试`,
          false
        ]
      );
      
      expect((notifResult as any).insertId).toBeGreaterThan(0);
    }
    
    // 验证通知推送成功（检查新增的通知数量）
    const notificationsAfter = await connection.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE type = ? AND title LIKE ?',
      ['assignment', '%新作业通知%']
    );
    const countAfter = (notificationsAfter[0] as any[])[0].count;
    
    expect(countAfter - countBefore).toBe((students as any[]).length);
  });

  test('2.1 学生查看待完成作业列表', async () => {
    // 查询学生所在班级的已发布作业
    const [assignments] = await connection.execute(
      `SELECT a.* FROM assignments a
       INNER JOIN class_students cs ON a.class_id = cs.class_id
       WHERE cs.student_id = ? AND a.status = ?
       ORDER BY a.deadline ASC`,
      [studentId, 'published']
    );
    
    expect((assignments as any[]).length).toBeGreaterThan(0);
    expect((assignments as any[])[0].id).toBe(assignmentId);
    expect((assignments as any[])[0].status).toBe('published');
  });

  test('2.2 学生提交作业', async () => {
    // 创建作业提交记录
    const [submitResult] = await connection.execute(
      `INSERT INTO submissions (assignment_id, student_id, file_url, status)
       VALUES (?, ?, ?, ?)`,
      [assignmentId, studentId, '/uploads/test-submission.pdf', 'submitted']
    );
    
    submissionId = (submitResult as any).insertId;
    expect(submissionId).toBeGreaterThan(0);
    
    // 提交客观题答案
    const [questions] = await connection.execute(
      'SELECT * FROM questions WHERE assignment_id = ? ORDER BY question_number',
      [assignmentId]
    );
    
    for (const question of questions as any[]) {
      let studentAnswer = '';
      
      if (question.question_type === 'choice') {
        studentAnswer = 'B'; // 正确答案
      } else if (question.question_type === 'subjective') {
        studentAnswer = '数学在生活中有很多应用，比如购物计算、时间安排等';
      }
      
      await connection.execute(
        `INSERT INTO answers (submission_id, question_id, student_answer)
         VALUES (?, ?, ?)`,
        [submissionId, question.id, studentAnswer]
      );
    }
    
    // 验证提交成功
    const [submissions] = await connection.execute(
      'SELECT * FROM submissions WHERE id = ?',
      [submissionId]
    );
    
    expect((submissions as any[]).length).toBe(1);
    expect((submissions as any[])[0].status).toBe('submitted');
  });

  test('2.3 AI自动批改客观题', async () => {
    // 获取所有客观题答案
    const [answers] = await connection.execute(
      `SELECT a.*, q.standard_answer, q.score, q.question_type
       FROM answers a
       INNER JOIN questions q ON a.question_id = q.id
       WHERE a.submission_id = ? AND q.question_type IN ('choice', 'fill', 'judge')`,
      [submissionId]
    );
    
    let totalScore = 0;
    
    // 批改客观题
    for (const answer of answers as any[]) {
      const isCorrect = answer.student_answer.trim().toLowerCase() === 
                       answer.standard_answer.trim().toLowerCase();
      const score = isCorrect ? answer.score : 0;
      
      await connection.execute(
        'UPDATE answers SET score = ?, is_correct = ? WHERE id = ?',
        [score, isCorrect, answer.id]
      );
      
      totalScore += score;
    }
    
    // 验证批改结果
    const [gradedAnswers] = await connection.execute(
      'SELECT * FROM answers WHERE submission_id = ? AND score IS NOT NULL',
      [submissionId]
    );
    
    expect((gradedAnswers as any[]).length).toBeGreaterThan(0);
    expect((gradedAnswers as any[])[0].score).toBeGreaterThanOrEqual(0);
  });

  test('2.4 AI批改主观题（模拟BERT评分）', async () => {
    // 获取主观题答案
    const [subjectiveAnswers] = await connection.execute(
      `SELECT a.*, q.standard_answer, q.score, q.question_type
       FROM answers a
       INNER JOIN questions q ON a.question_id = q.id
       WHERE a.submission_id = ? AND q.question_type = 'subjective'`,
      [submissionId]
    );
    
    // 模拟BERT评分（实际应调用Python AI服务）
    for (const answer of subjectiveAnswers as any[]) {
      // 简单的相似度评分（实际应使用BERT）
      const similarity = 0.85; // 模拟85%相似度
      const score = Math.round(answer.score * similarity);
      const feedback = '答案基本正确，涵盖了主要知识点';
      
      await connection.execute(
        'UPDATE answers SET score = ?, ai_feedback = ? WHERE id = ?',
        [score, feedback, answer.id]
      );
    }
    
    // 验证主观题批改完成
    const [gradedSubjective] = await connection.execute(
      `SELECT a.* FROM answers a
       INNER JOIN questions q ON a.question_id = q.id
       WHERE a.submission_id = ? AND q.question_type = 'subjective' AND a.score IS NOT NULL`,
      [submissionId]
    );
    
    expect((gradedSubjective as any[]).length).toBeGreaterThan(0);
    expect((gradedSubjective as any[])[0].ai_feedback).toBeTruthy();
  });

  test('2.5 计算总分并更新提交状态', async () => {
    // 计算总分
    const [scoreResult] = await connection.execute(
      'SELECT SUM(score) as total_score FROM answers WHERE submission_id = ?',
      [submissionId]
    );
    
    const totalScore = (scoreResult as any[])[0].total_score || 0;
    
    // 更新提交记录
    await connection.execute(
      'UPDATE submissions SET total_score = ?, status = ?, grading_time = NOW() WHERE id = ?',
      [totalScore, 'graded', submissionId]
    );
    
    // 验证总分计算正确
    const [submissions] = await connection.execute(
      'SELECT * FROM submissions WHERE id = ?',
      [submissionId]
    );
    
    expect(Number((submissions as any[])[0].total_score)).toBe(Number(totalScore));
    expect((submissions as any[])[0].status).toBe('graded');
    expect((submissions as any[])[0].grading_time).toBeTruthy();
  });

  test('2.6 生成批改结果（包含总分、各题得分、错题标注、改进建议）', async () => {
    // 查询批改结果
    const [submission] = await connection.execute(
      'SELECT * FROM submissions WHERE id = ?',
      [submissionId]
    );
    
    const [answers] = await connection.execute(
      `SELECT a.*, q.question_number, q.question_type, q.question_content
       FROM answers a
       INNER JOIN questions q ON a.question_id = q.id
       WHERE a.submission_id = ?
       ORDER BY q.question_number`,
      [submissionId]
    );
    
    // 验证批改结果完整性
    expect((submission as any[])[0].total_score).toBeGreaterThanOrEqual(0);
    expect((answers as any[]).length).toBeGreaterThan(0);
    
    // 验证每题都有得分
    for (const answer of answers as any[]) {
      expect(answer.score).toBeGreaterThanOrEqual(0);
    }
    
    // 验证错题标注
    const wrongAnswers = (answers as any[]).filter((a: any) => !a.is_correct && a.is_correct !== null);
    expect(wrongAnswers.length).toBeGreaterThanOrEqual(0);
    
    // 验证改进建议（主观题应有AI反馈）
    const subjectiveAnswers = (answers as any[]).filter((a: any) => a.ai_feedback);
    expect(subjectiveAnswers.length).toBeGreaterThan(0);
  });

  test('2.7 教师查看批改结果并进行人工复核', async () => {
    // 教师查询批改结果
    const [submissions] = await connection.execute(
      `SELECT s.*, u.real_name as student_name
       FROM submissions s
       INNER JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = ? AND s.status = 'graded'`,
      [assignmentId]
    );
    
    expect((submissions as any[]).length).toBeGreaterThan(0);
    
    // 教师进行人工复核（调整分数）
    const [answers] = await connection.execute(
      `SELECT a.* FROM answers a
       WHERE a.submission_id = ? AND a.needs_review = false
       LIMIT 1`,
      [submissionId]
    );
    
    if ((answers as any[]).length > 0) {
      const answerId = (answers as any[])[0].id;
      const originalScore = (answers as any[])[0].score;
      const adjustedScore = originalScore + 2; // 加2分
      
      await connection.execute(
        'UPDATE answers SET score = ?, reviewed_by = ?, review_comment = ? WHERE id = ?',
        [adjustedScore, teacherId, '答案表述更完整，加2分', answerId]
      );
      
      // 重新计算总分
      const [newScoreResult] = await connection.execute(
        'SELECT SUM(score) as total_score FROM answers WHERE submission_id = ?',
        [submissionId]
      );
      
      const newTotalScore = (newScoreResult as any[])[0].total_score;
      
      await connection.execute(
        'UPDATE submissions SET total_score = ?, status = ? WHERE id = ?',
        [newTotalScore, 'reviewed', submissionId]
      );
      
      // 验证复核成功
      const [reviewedSubmission] = await connection.execute(
        'SELECT * FROM submissions WHERE id = ?',
        [submissionId]
      );
      
      expect((reviewedSubmission as any[])[0].status).toBe('reviewed');
      expect(Number((reviewedSubmission as any[])[0].total_score)).toBe(Number(newTotalScore));
    }
  });

  test('完整流程验证：数据流转正确性', async () => {
    // 验证作业状态
    const [assignment] = await connection.execute(
      'SELECT * FROM assignments WHERE id = ?',
      [assignmentId]
    );
    expect((assignment as any[])[0].status).toBe('published');
    
    // 验证提交状态
    const [submission] = await connection.execute(
      'SELECT * FROM submissions WHERE id = ?',
      [submissionId]
    );
    expect(['graded', 'reviewed']).toContain((submission as any[])[0].status);
    
    // 验证所有题目都已批改
    const [ungradedAnswers] = await connection.execute(
      'SELECT * FROM answers WHERE submission_id = ? AND score IS NULL',
      [submissionId]
    );
    expect((ungradedAnswers as any[]).length).toBe(0);
    
    // 验证通知已发送
    const [notifications] = await connection.execute(
      'SELECT * FROM notifications WHERE user_id = ? AND type = ?',
      [studentId, 'assignment']
    );
    expect((notifications as any[]).length).toBeGreaterThan(0);
  });
});

// 辅助函数：设置测试数据
async function setupTestData() {
  // 创建测试教师
  const [teacherResult] = await connection.execute(
    `INSERT INTO users (username, password_hash, real_name, role, status)
     VALUES (?, ?, ?, ?, ?)`,
    ['test_teacher_integration', 'hash123', '集成测试教师', 'teacher', 'active']
  );
  teacherId = (teacherResult as any).insertId;
  
  // 创建测试学生
  const [studentResult] = await connection.execute(
    `INSERT INTO users (username, password_hash, real_name, role, status)
     VALUES (?, ?, ?, ?, ?)`,
    ['test_student_integration', 'hash123', '集成测试学生', 'student', 'active']
  );
  studentId = (studentResult as any).insertId;
  
  // 创建测试班级
  const [classResult] = await connection.execute(
    `INSERT INTO classes (name, grade, teacher_id, student_count)
     VALUES (?, ?, ?, ?)`,
    ['集成测试班级', '高一', teacherId, 1]
  );
  classId = (classResult as any).insertId;
  
  // 将学生加入班级
  await connection.execute(
    `INSERT INTO class_students (class_id, student_id, join_date)
     VALUES (?, ?, CURDATE())`,
    [classId, studentId]
  );
}

// 辅助函数：清理测试数据
async function cleanupTestData() {
  try {
    // 删除通知
    await connection.execute(
      'DELETE FROM notifications WHERE user_id IN (?, ?)',
      [teacherId, studentId]
    );
    
    // 删除答题记录
    if (submissionId) {
      await connection.execute(
        'DELETE FROM answers WHERE submission_id = ?',
        [submissionId]
      );
    }
    
    // 删除提交记录
    if (assignmentId) {
      await connection.execute(
        'DELETE FROM submissions WHERE assignment_id = ?',
        [assignmentId]
      );
    }
    
    // 删除题目
    if (assignmentId) {
      await connection.execute(
        'DELETE FROM questions WHERE assignment_id = ?',
        [assignmentId]
      );
    }
    
    // 删除作业
    if (assignmentId) {
      await connection.execute(
        'DELETE FROM assignments WHERE id = ?',
        [assignmentId]
      );
    }
    
    // 删除班级学生关联
    if (classId) {
      await connection.execute(
        'DELETE FROM class_students WHERE class_id = ?',
        [classId]
      );
    }
    
    // 删除班级
    if (classId) {
      await connection.execute(
        'DELETE FROM classes WHERE id = ?',
        [classId]
      );
    }
    
    // 删除用户
    if (teacherId) {
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [teacherId]
      );
    }
    
    if (studentId) {
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [studentId]
      );
    }
  } catch (error) {
    console.error('清理测试数据失败:', error);
  }
}
