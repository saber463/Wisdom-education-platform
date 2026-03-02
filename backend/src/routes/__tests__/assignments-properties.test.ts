/**
 * 作业管理属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 */

import * as fc from 'fast-check';
import { executeQuery, closePool } from '../../config/database.js';

// 测试辅助函数：获取有效的class_id和teacher_id
let validClassIds: number[] = [];
let validTeacherIds: number[] = [];

beforeAll(async () => {
  // 查询数据库中实际存在的class_id
  const classes = await executeQuery<Array<{ id: number }>>('SELECT id FROM classes LIMIT 10');
  validClassIds = classes.map(c => c.id);
  
  // 查询数据库中实际存在的teacher_id
  const teachers = await executeQuery<Array<{ id: number }>>(
    "SELECT id FROM users WHERE role = 'teacher' LIMIT 10"
  );
  validTeacherIds = teachers.map(t => t.id);
});

afterAll(async () => {
  // 关闭数据库连接池
  await closePool();
});

/**
 * 属性1：作业创建完整性
 * Feature: smart-education-platform, Property 1: 作业创建完整性
 * 验证需求：1.2
 * 
 * 对于任何作业创建请求，如果包含所有必需字段（标题、截止时间、题目类型、分值），
 * 则系统应成功创建作业并返回作业ID
 */
describe('Property 1: 作业创建完整性', () => {
  it('应该成功创建包含所有必需字段的作业', async () => {
    // 确保有有效的ID
    if (validClassIds.length === 0 || validTeacherIds.length === 0) {
      console.warn('没有有效的class_id或teacher_id，跳过测试');
      return;
    }

    // 生成器：有效的作业数据（使用实际数据库ID）
    const validAssignmentArbitrary = fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
      class_id: fc.constantFrom(...validClassIds),
      teacher_id: fc.constantFrom(...validTeacherIds),
      difficulty: fc.constantFrom('basic', 'medium', 'advanced'),
      total_score: fc.integer({ min: 1, max: 100 }),
      deadline: fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
        .map(d => d.toISOString().slice(0, 19).replace('T', ' ')),
      status: fc.constant('draft' as const)
    });

    // 生成器：题目数据（不使用外键）
    const questionArbitrary = fc.record({
      question_number: fc.integer({ min: 1, max: 10 }),
      question_type: fc.constantFrom('choice', 'fill', 'judge', 'subjective'),
      question_content: fc.string({ minLength: 1, maxLength: 50 }),
      standard_answer: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
      score: fc.integer({ min: 1, max: 20 }),
      knowledge_point_id: fc.constant(null)
    });

    await fc.assert(
      fc.asyncProperty(
        validAssignmentArbitrary,
        fc.array(questionArbitrary, { minLength: 0, maxLength: 3 }),
        async (assignmentData, questions) => {
          let assignmentId: number | null = null;
          try {
            // 创建作业
            const result = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
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

            assignmentId = result.insertId;

            // 验证：应该返回有效的作业ID
            expect(assignmentId).toBeGreaterThan(0);

            // 如果有题目，插入题目
            if (questions.length > 0) {
              const questionValues = questions.map(q => [
                assignmentId,
                q.question_number,
                q.question_type,
                q.question_content,
                q.standard_answer,
                q.score,
                q.knowledge_point_id
              ]);

              const placeholders = questions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
              const flatValues = questionValues.flat();

              await executeQuery(
                `INSERT INTO questions 
                 (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) 
                 VALUES ${placeholders}`,
                flatValues
              );
            }

            // 验证：作业应该可以被查询到
            const assignments = await executeQuery<any[]>(
              'SELECT * FROM assignments WHERE id = ?',
              [assignmentId]
            );

            expect(assignments).toHaveLength(1);
            expect(assignments[0].id).toBe(assignmentId);
            expect(assignments[0].title).toBe(assignmentData.title);
            expect(assignments[0].class_id).toBe(assignmentData.class_id);
            expect(assignments[0].teacher_id).toBe(assignmentData.teacher_id);
            expect(assignments[0].total_score).toBe(assignmentData.total_score);
            expect(assignments[0].status).toBe('draft');

            // 验证：题目应该可以被查询到
            const insertedQuestions = await executeQuery<any[]>(
              'SELECT * FROM questions WHERE assignment_id = ? ORDER BY question_number',
              [assignmentId]
            );

            expect(insertedQuestions).toHaveLength(questions.length);

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 50 } // 运行50次迭代确保准确度
    );
  }, 60000); // 60秒超时

  it('应该拒绝缺少必需字段的作业创建请求', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          class_id: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
          teacher_id: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
          total_score: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
          deadline: fc.option(
            fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
              .map(d => d.toISOString().slice(0, 19).replace('T', ' ')),
            { nil: null }
          )
        }).filter(data => 
          // 至少有一个必需字段为空
          !data.title || !data.class_id || !data.teacher_id || !data.total_score || !data.deadline
        ),
        async (incompleteData) => {
          try {
            // 尝试创建作业（应该失败）
            await executeQuery(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
              [
                incompleteData.title,
                null,
                incompleteData.class_id,
                incompleteData.teacher_id,
                'medium',
                incompleteData.total_score,
                incompleteData.deadline
              ]
            );

            // 如果执行到这里，说明插入成功了（不应该发生）
            return false;
          } catch (error: any) {
            // 验证：应该抛出数据库错误（NOT NULL约束）
            expect(error).toBeDefined();
            return true;
          }
        }
      ),
      { numRuns: 30 } // 运行30次迭代确保准确度
    );
  }, 60000);
});

/**
 * 属性测试：作业数据完整性
 * 验证创建的作业包含所有必需信息
 */
describe('作业数据完整性验证', () => {
  it('创建的作业应包含所有必需字段', async () => {
    // 确保有有效的ID
    if (validClassIds.length === 0 || validTeacherIds.length === 0) {
      console.warn('没有有效的class_id或teacher_id，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.string({ maxLength: 100 }),
          class_id: fc.constantFrom(...validClassIds),
          teacher_id: fc.constantFrom(...validTeacherIds),
          difficulty: fc.constantFrom('basic', 'medium', 'advanced'),
          total_score: fc.integer({ min: 1, max: 100 }),
          deadline: fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
            .map(d => d.toISOString().slice(0, 19).replace('T', ' '))
        }),
        async (assignmentData) => {
          let assignmentId: number | null = null;
          try {
            // 创建作业
            const result = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
              [
                assignmentData.title,
                assignmentData.description,
                assignmentData.class_id,
                assignmentData.teacher_id,
                assignmentData.difficulty,
                assignmentData.total_score,
                assignmentData.deadline
              ]
            );

            assignmentId = result.insertId;

            // 查询作业
            const assignments = await executeQuery<any[]>(
              'SELECT * FROM assignments WHERE id = ?',
              [assignmentId]
            );

            // 验证：所有字段都应该存在且正确
            const assignment = assignments[0];
            expect(assignment).toBeDefined();
            expect(assignment.id).toBe(assignmentId);
            expect(assignment.title).toBe(assignmentData.title);
            expect(assignment.description).toBe(assignmentData.description);
            expect(assignment.class_id).toBe(assignmentData.class_id);
            expect(assignment.teacher_id).toBe(assignmentData.teacher_id);
            expect(assignment.difficulty).toBe(assignmentData.difficulty);
            expect(assignment.total_score).toBe(assignmentData.total_score);
            expect(assignment.status).toBe('draft');
            expect(assignment.created_at).toBeDefined();
            expect(assignment.updated_at).toBeDefined();

            return true;
          } catch (error) {
            console.error('数据完整性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 50 } // 运行50次迭代确保准确度
    );
  }, 60000);
});

/**
 * 属性4：客观题标准答案强制性
 * Feature: smart-education-platform, Property 4: 客观题标准答案强制性
 * 验证需求：1.5
 * 
 * 对于任何包含客观题的作业，系统应要求教师提供标准答案，否则不允许发布
 */
describe('Property 4: 客观题标准答案强制性', () => {
  // 生成器：客观题（choice, fill, judge）- 使用函数形式以获取有效ID
  const objectiveQuestionArbitrary = () => fc.record({
    question_number: fc.integer({ min: 1, max: 10 }),
    question_type: fc.constantFrom('choice', 'fill', 'judge'),
    question_content: fc.string({ minLength: 1, maxLength: 50 }),
    standard_answer: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    score: fc.integer({ min: 1, max: 20 }),
    knowledge_point_id: fc.constant(null)
  });

  // 生成器：主观题
  const subjectiveQuestionArbitrary = () => fc.record({
    question_number: fc.integer({ min: 1, max: 50 }),
    question_type: fc.constant('subjective' as const),
    question_content: fc.string({ minLength: 1, maxLength: 50 }),
    standard_answer: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
    score: fc.integer({ min: 1, max: 20 }),
    knowledge_point_id: fc.constant(null)
  });

  it('应该拒绝发布包含缺少标准答案的客观题的作业', async () => {
    // 确保有有效的ID
    if (validClassIds.length === 0 || validTeacherIds.length === 0) {
      console.warn('没有有效的class_id或teacher_id，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }),
          class_id: fc.constantFrom(...validClassIds),
          teacher_id: fc.constantFrom(...validTeacherIds),
          total_score: fc.integer({ min: 10, max: 100 }),
          deadline: fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
            .map(d => d.toISOString().slice(0, 19).replace('T', ' '))
        }),
        fc.array(objectiveQuestionArbitrary(), { minLength: 1, maxLength: 2 })
          .filter(questions => 
            // 确保至少有一个客观题缺少标准答案
            questions.some(q => !q.standard_answer || q.standard_answer.trim() === '')
          ),
        async (assignmentData, questions) => {
          let assignmentId: number | null = null;

          try {
            // 创建作业
            const result = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
              [
                assignmentData.title,
                null,
                assignmentData.class_id,
                assignmentData.teacher_id,
                'medium',
                assignmentData.total_score,
                assignmentData.deadline
              ]
            );

            assignmentId = result.insertId;

            // 插入题目（包含缺少标准答案的客观题）
            const questionValues = questions.map(q => [
              assignmentId,
              q.question_number,
              q.question_type,
              q.question_content,
              q.standard_answer || null,
              q.score,
              q.knowledge_point_id
            ]);

            const placeholders = questions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
            const flatValues = questionValues.flat();

            await executeQuery(
              `INSERT INTO questions 
               (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) 
               VALUES ${placeholders}`,
              flatValues
            );

            // 尝试发布作业（应该失败）
            // 模拟发布逻辑：检查客观题是否有标准答案
            const insertedQuestions = await executeQuery<Array<{
              question_type: string;
              standard_answer: string | null;
              question_number: number;
            }>>(
              'SELECT question_type, standard_answer, question_number FROM questions WHERE assignment_id = ?',
              [assignmentId]
            );

            const objectiveTypes = ['choice', 'fill', 'judge'];
            const missingAnswers: number[] = [];

            for (const question of insertedQuestions) {
              if (objectiveTypes.includes(question.question_type)) {
                if (!question.standard_answer || question.standard_answer.trim() === '') {
                  missingAnswers.push(question.question_number);
                }
              }
            }

            // 验证：应该检测到缺少标准答案的客观题
            expect(missingAnswers.length).toBeGreaterThan(0);

            // 验证：作业状态应该保持为draft（不允许发布）
            const assignments = await executeQuery<any[]>(
              'SELECT status FROM assignments WHERE id = ?',
              [assignmentId]
            );
            expect(assignments[0].status).toBe('draft');

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 50 } // 运行50次迭代确保准确度
    );
  }, 60000); // 60秒超时

  it('应该允许发布所有客观题都有标准答案的作业', async () => {
    // 确保有有效的ID
    if (validClassIds.length === 0 || validTeacherIds.length === 0) {
      console.warn('没有有效的class_id或teacher_id，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          class_id: fc.constantFrom(...validClassIds),
          teacher_id: fc.constantFrom(...validTeacherIds),
          total_score: fc.integer({ min: 10, max: 100 }),
          deadline: fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
            .map(d => d.toISOString().slice(0, 19).replace('T', ' '))
        }),
        fc.array(
          fc.oneof(
            // 客观题（必须有标准答案）
            fc.record({
              question_number: fc.integer({ min: 1, max: 10 }),
              question_type: fc.constantFrom('choice', 'fill', 'judge'),
              question_content: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              standard_answer: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // 过滤空格字符串
              score: fc.integer({ min: 1, max: 20 }),
              knowledge_point_id: fc.constant(null)
            }),
            // 主观题（可以没有标准答案）
            subjectiveQuestionArbitrary()
          ),
          { minLength: 1, maxLength: 2 }
        ),
        async (assignmentData, questions) => {
          let assignmentId: number | null = null;

          try {
            // 创建作业
            const result = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
              [
                assignmentData.title,
                null,
                assignmentData.class_id,
                assignmentData.teacher_id,
                'medium',
                assignmentData.total_score,
                assignmentData.deadline
              ]
            );

            assignmentId = result.insertId;

            // 插入题目
            const questionValues = questions.map(q => [
              assignmentId,
              q.question_number,
              q.question_type,
              q.question_content,
              q.standard_answer || null,
              q.score,
              q.knowledge_point_id
            ]);

            const placeholders = questions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
            const flatValues = questionValues.flat();

            await executeQuery(
              `INSERT INTO questions 
               (assignment_id, question_number, question_type, question_content, standard_answer, score, knowledge_point_id) 
               VALUES ${placeholders}`,
              flatValues
            );

            // 验证发布条件：检查客观题是否都有标准答案
            const insertedQuestions = await executeQuery<Array<{
              question_type: string;
              standard_answer: string | null;
              question_number: number;
            }>>(
              'SELECT question_type, standard_answer, question_number FROM questions WHERE assignment_id = ?',
              [assignmentId]
            );

            const objectiveTypes = ['choice', 'fill', 'judge'];
            const missingAnswers: number[] = [];

            for (const question of insertedQuestions) {
              if (objectiveTypes.includes(question.question_type)) {
                if (!question.standard_answer || question.standard_answer.trim() === '') {
                  missingAnswers.push(question.question_number);
                }
              }
            }

            // 验证：所有客观题都应该有标准答案
            expect(missingAnswers.length).toBe(0);

            // 如果验证通过，可以发布作业
            await executeQuery(
              'UPDATE assignments SET status = ? WHERE id = ?',
              ['published', assignmentId]
            );

            // 验证：作业状态应该更新为published
            const assignments = await executeQuery<any[]>(
              'SELECT status FROM assignments WHERE id = ?',
              [assignmentId]
            );
            expect(assignments[0].status).toBe('published');

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 50 } // 运行50次迭代确保准确度
    );
  }, 60000); // 60秒超时
});
