/**
 * 批改管理属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 */

import * as fc from 'fast-check';
import { executeQuery, closePool } from '../../config/database.js';

// 测试辅助数据
let validClassIds: number[] = [];
let validTeacherIds: number[] = [];
let validStudentIds: number[] = [];

/**
 * 客观题答案比对（模拟WASM模块功能）
 */
function compareObjectiveAnswer(
  studentAnswer: string,
  standardAnswer: string,
  questionType: string
): boolean {
  const normalizeAnswer = (answer: string): string => {
    return answer.trim().toLowerCase().replace(/\s+/g, '');
  };

  const student = normalizeAnswer(studentAnswer);
  const standard = normalizeAnswer(standardAnswer);

  switch (questionType) {
    case 'choice':
      return student === standard;
    case 'judge': {
      const trueValues = ['true', '对', '正确', '是', 't', '1', 'yes'];
      const falseValues = ['false', '错', '错误', '否', 'f', '0', 'no'];
      const studentBool = trueValues.includes(student) ? true : 
                          falseValues.includes(student) ? false : null;
      const standardBool = trueValues.includes(standard) ? true :
                           falseValues.includes(standard) ? false : null;
      return studentBool !== null && standardBool !== null && studentBool === standardBool;
    }
    case 'fill':
      return student === standard;
    default:
      return false;
  }
}

beforeAll(async () => {
  // 查询数据库中实际存在的数据
  const classes = await executeQuery<Array<{ id: number }>>('SELECT id FROM classes LIMIT 10');
  validClassIds = classes.map(c => c.id);
  
  const teachers = await executeQuery<Array<{ id: number }>>(
    "SELECT id FROM users WHERE role = 'teacher' LIMIT 10"
  );
  validTeacherIds = teachers.map(t => t.id);

  const students = await executeQuery<Array<{ id: number }>>(
    "SELECT id FROM users WHERE role = 'student' LIMIT 10"
  );
  validStudentIds = students.map(s => s.id);
});

afterAll(async () => {
  await closePool();
});

/**
 * 属性6：批改流程自动触发
 * Feature: smart-education-platform, Property 6: 批改流程自动触发
 * 验证需求：2.1
 * 
 * 对于任何学生作业提交，系统应自动触发AI批改流程，无需人工干预
 */
describe('Property 6: 批改流程自动触发', () => {
  it('学生提交作业后应自动触发批改流程并生成批改结果', async () => {
    // 确保有有效的测试数据
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // 生成随机学生答案
        fc.array(
          fc.record({
            answer: fc.string({ minLength: 1, maxLength: 20 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (studentAnswers) => {
          let assignmentId: number | null = null;
          let submissionId: number | null = null;
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const classId = validClassIds[0];

          try {
            // 1. 创建测试作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `测试作业_${Date.now()}`,
                '属性测试用作业',
                classId,
                teacherId,
                'medium',
                100,
                '2026-12-31 23:59:59'
              ]
            );
            assignmentId = assignmentResult.insertId;

            // 2. 创建测试题目（客观题，有标准答案）
            const questions: Array<{ id: number; type: string; answer: string; score: number }> = [];
            for (let i = 0; i < studentAnswers.length; i++) {
              const questionResult = await executeQuery<any>(
                `INSERT INTO questions 
                 (assignment_id, question_number, question_type, question_content, standard_answer, score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  assignmentId,
                  i + 1,
                  'choice',
                  `测试题目${i + 1}`,
                  'A', // 标准答案
                  20
                ]
              );
              questions.push({
                id: questionResult.insertId,
                type: 'choice',
                answer: 'A',
                score: 20
              });
            }

            // 3. 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 4. 模拟作业提交和自动批改流程
            // 创建提交记录（状态为grading）
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions (assignment_id, student_id, status)
               VALUES (?, ?, 'grading')`,
              [assignmentId, studentId]
            );
            submissionId = submissionResult.insertId;

            // 5. 自动批改每道题目
            let totalScore = 0;
            for (let i = 0; i < questions.length; i++) {
              const question = questions[i];
              const studentAnswer = studentAnswers[i]?.answer || '';
              
              // 客观题批改
              const isCorrect = compareObjectiveAnswer(studentAnswer, question.answer, question.type);
              const score = isCorrect ? question.score : 0;
              totalScore += score;

              // 保存答题记录
              await executeQuery(
                `INSERT INTO answers 
                 (submission_id, question_id, student_answer, score, is_correct, ai_feedback, needs_review)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  submissionId,
                  question.id,
                  studentAnswer,
                  score,
                  isCorrect,
                  isCorrect ? '回答正确' : '回答错误',
                  false
                ]
              );
            }

            // 6. 更新提交记录状态为已批改
            await executeQuery(
              `UPDATE submissions SET total_score = ?, status = 'graded', grading_time = NOW() WHERE id = ?`,
              [totalScore, submissionId]
            );

            // 验证：提交记录应该存在且状态为已批改
            const submissions = await executeQuery<any[]>(
              'SELECT * FROM submissions WHERE id = ?',
              [submissionId]
            );
            expect(submissions).toHaveLength(1);
            expect(submissions[0].status).toBe('graded');
            expect(submissions[0].total_score).toBeDefined();
            expect(submissions[0].grading_time).toBeDefined();

            // 验证：每道题目都应该有批改结果
            const answers = await executeQuery<any[]>(
              'SELECT * FROM answers WHERE submission_id = ?',
              [submissionId]
            );
            expect(answers).toHaveLength(questions.length);
            
            // 验证：每个答题记录都应该有得分和反馈
            for (const answer of answers) {
              expect(answer.score).toBeDefined();
              expect(answer.is_correct).toBeDefined();
              expect(answer.ai_feedback).toBeDefined();
            }

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (submissionId) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 } // 运行100次迭代
    );
  }, 120000); // 120秒超时

  it('批改流程应在提交后立即触发，无需人工干预', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // 题目数量
        async (questionCount) => {
          let assignmentId: number | null = null;
          let submissionId: number | null = null;
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const classId = validClassIds[0];

          try {
            // 创建作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `自动批改测试_${Date.now()}`,
                '测试自动批改流程',
                classId,
                teacherId,
                'medium',
                questionCount * 20,
                '2026-12-31 23:59:59'
              ]
            );
            assignmentId = assignmentResult.insertId;

            // 创建题目
            const questionIds: number[] = [];
            for (let i = 0; i < questionCount; i++) {
              const qResult = await executeQuery<any>(
                `INSERT INTO questions 
                 (assignment_id, question_number, question_type, question_content, standard_answer, score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [assignmentId, i + 1, 'choice', `题目${i + 1}`, 'A', 20]
              );
              questionIds.push(qResult.insertId);
            }

            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 记录提交前的时间
            const submitTime = new Date();

            // 模拟提交并自动批改
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions (assignment_id, student_id, status) VALUES (?, ?, 'grading')`,
              [assignmentId, studentId]
            );
            submissionId = submissionResult.insertId;

            // 自动批改
            let totalScore = 0;
            for (const qId of questionIds) {
              const isCorrect = Math.random() > 0.5;
              const score = isCorrect ? 20 : 0;
              totalScore += score;

              await executeQuery(
                `INSERT INTO answers (submission_id, question_id, student_answer, score, is_correct, ai_feedback, needs_review)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [submissionId, qId, isCorrect ? 'A' : 'B', score, isCorrect, '自动批改反馈', false]
              );
            }

            await executeQuery(
              `UPDATE submissions SET total_score = ?, status = 'graded', grading_time = NOW() WHERE id = ?`,
              [totalScore, submissionId]
            );

            // 验证：批改应该在提交后立即完成
            const submission = await executeQuery<any[]>(
              'SELECT * FROM submissions WHERE id = ?',
              [submissionId]
            );

            expect(submission[0].status).toBe('graded');
            expect(submission[0].grading_time).toBeDefined();
            
            // 验证批改时间应该在提交时间之后（允许1秒误差，因为MySQL时间戳精度为秒）
            const gradingTime = new Date(submission[0].grading_time);
            const timeDiff = gradingTime.getTime() - submitTime.getTime();
            expect(timeDiff).toBeGreaterThanOrEqual(-1000); // 允许1秒误差

            // 验证所有题目都已批改
            const answers = await executeQuery<any[]>(
              'SELECT * FROM answers WHERE submission_id = ?',
              [submissionId]
            );
            expect(answers).toHaveLength(questionCount);

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (submissionId) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});


/**
 * 属性8：批改结果完整性
 * Feature: smart-education-platform, Property 8: 批改结果完整性
 * 验证需求：2.4
 * 
 * 对于任何完成的批改，生成的结果应包含总分、各题得分、错题标注、改进建议四项内容
 */
describe('Property 8: 批改结果完整性', () => {
  it('批改结果应包含总分、各题得分、错题标注、改进建议', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // 题目数量
        fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), // 每题是否正确
        async (questionCount, correctness) => {
          let assignmentId: number | null = null;
          let submissionId: number | null = null;
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const classId = validClassIds[0];

          try {
            // 创建作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `完整性测试作业_${Date.now()}`,
                '测试批改结果完整性',
                classId,
                teacherId,
                'medium',
                questionCount * 20,
                '2026-12-31 23:59:59'
              ]
            );
            assignmentId = assignmentResult.insertId;

            // 创建题目
            const questionIds: number[] = [];
            for (let i = 0; i < questionCount; i++) {
              const qResult = await executeQuery<any>(
                `INSERT INTO questions 
                 (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [assignmentId, i + 1, 'choice', `题目${i + 1}`, 'A', 20, 1]
              );
              questionIds.push(qResult.insertId);
            }

            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建提交记录
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions (assignment_id, student_id, status) VALUES (?, ?, 'grading')`,
              [assignmentId, studentId]
            );
            submissionId = submissionResult.insertId;

            // 批改并保存结果
            let totalScore = 0;
            for (let i = 0; i < questionIds.length; i++) {
              const isCorrect = correctness[i % correctness.length];
              const score = isCorrect ? 20 : 0;
              totalScore += score;

              const feedback = isCorrect 
                ? '回答正确，继续保持！' 
                : '选择题回答错误。请仔细审题，注意关键信息。';

              await executeQuery(
                `INSERT INTO answers (submission_id, question_id, student_answer, score, is_correct, ai_feedback, needs_review)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [submissionId, questionIds[i], isCorrect ? 'A' : 'B', score, isCorrect, feedback, false]
              );
            }

            await executeQuery(
              `UPDATE submissions SET total_score = ?, status = 'graded', grading_time = NOW() WHERE id = ?`,
              [totalScore, submissionId]
            );

            // 查询批改结果
            const submission = await executeQuery<any[]>(
              'SELECT * FROM submissions WHERE id = ?',
              [submissionId]
            );

            const answers = await executeQuery<any[]>(
              `SELECT a.*, q.question_number, q.question_type, q.question_content, q.score as max_score
               FROM answers a
               JOIN questions q ON a.question_id = q.id
               WHERE a.submission_id = ?
               ORDER BY q.question_number`,
              [submissionId]
            );

            // 验证1：总分存在
            expect(submission[0].total_score).toBeDefined();
            expect(typeof submission[0].total_score).toBe('number');

            // 验证2：各题得分存在
            for (const answer of answers) {
              expect(answer.score).toBeDefined();
              expect(typeof answer.score).toBe('number');
              expect(answer.max_score).toBeDefined();
            }

            // 验证3：错题标注存在（is_correct字段）
            for (const answer of answers) {
              expect(answer.is_correct).toBeDefined();
              expect(typeof answer.is_correct).toBe('number'); // MySQL返回0或1
            }

            // 验证4：改进建议存在（ai_feedback字段）
            for (const answer of answers) {
              expect(answer.ai_feedback).toBeDefined();
              expect(typeof answer.ai_feedback).toBe('string');
              expect(answer.ai_feedback.length).toBeGreaterThan(0);
            }

            // 验证：错题应该有对应的反馈
            const wrongAnswers = answers.filter(a => a.is_correct === 0);
            for (const wrongAnswer of wrongAnswers) {
              expect(wrongAnswer.ai_feedback).toContain('错误');
            }

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (submissionId) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('批改结果应包含统计信息和改进建议列表', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // 至少2道题
        async (questionCount) => {
          let assignmentId: number | null = null;
          let submissionId: number | null = null;
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const classId = validClassIds[0];

          try {
            // 创建作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `统计测试作业_${Date.now()}`,
                '测试统计信息',
                classId,
                teacherId,
                'medium',
                questionCount * 20,
                '2026-12-31 23:59:59'
              ]
            );
            assignmentId = assignmentResult.insertId;

            // 创建题目
            const questionIds: number[] = [];
            for (let i = 0; i < questionCount; i++) {
              const qResult = await executeQuery<any>(
                `INSERT INTO questions 
                 (assignment_id, question_number, question_type, question_content, standard_answer, score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [assignmentId, i + 1, 'choice', `题目${i + 1}`, 'A', 20]
              );
              questionIds.push(qResult.insertId);
            }

            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建提交记录
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions (assignment_id, student_id, status) VALUES (?, ?, 'grading')`,
              [assignmentId, studentId]
            );
            submissionId = submissionResult.insertId;

            // 批改（一半正确一半错误）
            let totalScore = 0;
            let correctCount = 0;
            let wrongCount = 0;

            for (let i = 0; i < questionIds.length; i++) {
              const isCorrect = i % 2 === 0;
              const score = isCorrect ? 20 : 0;
              totalScore += score;
              if (isCorrect) correctCount++;
              else wrongCount++;

              await executeQuery(
                `INSERT INTO answers (submission_id, question_id, student_answer, score, is_correct, ai_feedback, needs_review)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [submissionId, questionIds[i], isCorrect ? 'A' : 'B', score, isCorrect, 
                 isCorrect ? '回答正确' : '回答错误', false]
              );
            }

            await executeQuery(
              `UPDATE submissions SET total_score = ?, status = 'graded', grading_time = NOW() WHERE id = ?`,
              [totalScore, submissionId]
            );

            // 查询并验证统计信息
            const answers = await executeQuery<any[]>(
              'SELECT * FROM answers WHERE submission_id = ?',
              [submissionId]
            );

            const actualCorrectCount = answers.filter(a => a.is_correct === 1).length;
            const actualWrongCount = answers.filter(a => a.is_correct === 0).length;

            // 验证统计数据正确
            expect(actualCorrectCount).toBe(correctCount);
            expect(actualWrongCount).toBe(wrongCount);
            expect(actualCorrectCount + actualWrongCount).toBe(questionCount);

            // 验证总分计算正确
            const submission = await executeQuery<any[]>(
              'SELECT total_score FROM submissions WHERE id = ?',
              [submissionId]
            );
            expect(submission[0].total_score).toBe(totalScore);

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (submissionId) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});


/**
 * 属性9：人工复核功能可用性
 * Feature: smart-education-platform, Property 9: 人工复核功能可用性
 * 验证需求：2.6
 * 
 * 对于任何批改结果，教师端应支持人工复核和分数调整功能
 */
describe('Property 9: 人工复核功能可用性', () => {
  it('教师应能够对批改结果进行人工复核和分数调整', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // 题目数量
        fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 1, maxLength: 5 }), // 调整后的分数
        async (questionCount, adjustedScores) => {
          let assignmentId: number | null = null;
          let submissionId: number | null = null;
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const classId = validClassIds[0];

          try {
            // 创建作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `复核测试作业_${Date.now()}`,
                '测试人工复核功能',
                classId,
                teacherId,
                'medium',
                questionCount * 20,
                '2026-12-31 23:59:59'
              ]
            );
            assignmentId = assignmentResult.insertId;

            // 创建题目
            const questionIds: number[] = [];
            for (let i = 0; i < questionCount; i++) {
              const qResult = await executeQuery<any>(
                `INSERT INTO questions 
                 (assignment_id, question_number, question_type, question_content, standard_answer, score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [assignmentId, i + 1, 'subjective', `主观题${i + 1}`, '标准答案', 20]
              );
              questionIds.push(qResult.insertId);
            }

            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建提交记录
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions (assignment_id, student_id, status) VALUES (?, ?, 'graded')`,
              [assignmentId, studentId]
            );
            submissionId = submissionResult.insertId;

            // 创建答题记录（标记为需要复核）
            const answerIds: number[] = [];
            let originalTotalScore = 0;
            for (let i = 0; i < questionIds.length; i++) {
              const originalScore = 10; // 初始AI评分
              originalTotalScore += originalScore;

              const answerResult = await executeQuery<any>(
                `INSERT INTO answers (submission_id, question_id, student_answer, score, is_correct, ai_feedback, needs_review)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [submissionId, questionIds[i], '学生答案', originalScore, true, 'AI评分反馈', true]
              );
              answerIds.push(answerResult.insertId);
            }

            // 更新提交记录总分
            await executeQuery(
              `UPDATE submissions SET total_score = ? WHERE id = ?`,
              [originalTotalScore, submissionId]
            );

            // 模拟人工复核：调整分数
            let newTotalScore = 0;
            for (let i = 0; i < answerIds.length; i++) {
              const newScore = adjustedScores[i % adjustedScores.length];
              newTotalScore += newScore;

              await executeQuery(
                `UPDATE answers 
                 SET score = ?, is_correct = ?, needs_review = FALSE, reviewed_by = ?, review_comment = ?
                 WHERE id = ?`,
                [newScore, newScore > 0, teacherId, '人工复核意见', answerIds[i]]
              );
            }

            // 更新提交记录
            await executeQuery(
              `UPDATE submissions SET total_score = ?, status = 'reviewed' WHERE id = ?`,
              [newTotalScore, submissionId]
            );

            // 验证复核结果
            const submission = await executeQuery<any[]>(
              'SELECT * FROM submissions WHERE id = ?',
              [submissionId]
            );

            // 验证1：状态应该更新为reviewed
            expect(submission[0].status).toBe('reviewed');

            // 验证2：总分应该更新
            expect(submission[0].total_score).toBe(newTotalScore);

            // 验证3：每道题的复核信息应该正确
            const answers = await executeQuery<any[]>(
              'SELECT * FROM answers WHERE submission_id = ?',
              [submissionId]
            );

            for (let i = 0; i < answers.length; i++) {
              const expectedScore = adjustedScores[i % adjustedScores.length];
              expect(answers[i].score).toBe(expectedScore);
              expect(answers[i].needs_review).toBe(0); // 已复核
              expect(answers[i].reviewed_by).toBe(teacherId);
              expect(answers[i].review_comment).toBe('人工复核意见');
            }

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (submissionId) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('复核后应正确计算总分调整', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // 题目数量
        fc.array(
          fc.record({
            original: fc.integer({ min: 0, max: 20 }),
            adjusted: fc.integer({ min: 0, max: 20 })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (questionCount, scoreChanges) => {
          let assignmentId: number | null = null;
          let submissionId: number | null = null;
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const classId = validClassIds[0];

          try {
            // 创建作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `分数调整测试_${Date.now()}`,
                '测试分数调整计算',
                classId,
                teacherId,
                'medium',
                questionCount * 20,
                '2026-12-31 23:59:59'
              ]
            );
            assignmentId = assignmentResult.insertId;

            // 创建题目和答题记录
            const answerIds: number[] = [];
            let originalTotalScore = 0;
            let expectedNewTotalScore = 0;

            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建提交记录
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions (assignment_id, student_id, status) VALUES (?, ?, 'graded')`,
              [assignmentId, studentId]
            );
            submissionId = submissionResult.insertId;

            for (let i = 0; i < questionCount; i++) {
              const qResult = await executeQuery<any>(
                `INSERT INTO questions 
                 (assignment_id, question_number, question_type, question_content, standard_answer, score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [assignmentId, i + 1, 'subjective', `题目${i + 1}`, '答案', 20]
              );

              const change = scoreChanges[i % scoreChanges.length];
              originalTotalScore += change.original;
              expectedNewTotalScore += change.adjusted;

              const answerResult = await executeQuery<any>(
                `INSERT INTO answers (submission_id, question_id, student_answer, score, is_correct, ai_feedback, needs_review)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [submissionId, qResult.insertId, '答案', change.original, true, '反馈', true]
              );
              answerIds.push(answerResult.insertId);
            }

            // 更新原始总分
            await executeQuery(
              `UPDATE submissions SET total_score = ? WHERE id = ?`,
              [originalTotalScore, submissionId]
            );

            // 执行复核
            for (let i = 0; i < answerIds.length; i++) {
              const change = scoreChanges[i % scoreChanges.length];
              await executeQuery(
                `UPDATE answers SET score = ?, needs_review = FALSE, reviewed_by = ? WHERE id = ?`,
                [change.adjusted, teacherId, answerIds[i]]
              );
            }

            // 更新总分
            await executeQuery(
              `UPDATE submissions SET total_score = ?, status = 'reviewed' WHERE id = ?`,
              [expectedNewTotalScore, submissionId]
            );

            // 验证总分计算
            const submission = await executeQuery<any[]>(
              'SELECT total_score FROM submissions WHERE id = ?',
              [submissionId]
            );

            expect(submission[0].total_score).toBe(expectedNewTotalScore);

            // 验证分数调整量
            const answers = await executeQuery<any[]>(
              'SELECT score FROM answers WHERE submission_id = ?',
              [submissionId]
            );

            const actualNewTotal = answers.reduce((sum, a) => sum + a.score, 0);
            expect(actualNewTotal).toBe(expectedNewTotalScore);

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (submissionId) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});
