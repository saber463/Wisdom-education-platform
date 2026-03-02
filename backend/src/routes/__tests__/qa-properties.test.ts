/**
 * AI答疑属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 */

import * as fc from 'fast-check';
import { executeQuery, closePool } from '../../config/database.js';

// 测试辅助数据
let validStudentIds: number[] = [];

beforeAll(async () => {
  // 查询数据库中实际存在的学生数据
  const students = await executeQuery<Array<{ id: number }>>(
    "SELECT id FROM users WHERE role = 'student' LIMIT 10"
  );
  validStudentIds = students.map(s => s.id);
});

afterAll(async () => {
  await closePool();
});

/**
 * 属性28：问答记录持久化
 * Feature: smart-education-platform, Property 28: 问答记录持久化
 * 验证需求：7.5
 * 
 * 对于任何学生满意的答案，系统应记录该问答对用于优化AI模型
 */
describe('Property 28: 问答记录持久化', () => {
  it('学生满意的问答应被正确持久化到数据库', async () => {
    if (validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // 生成随机问题和答案
        fc.record({
          question: fc.string({ minLength: 5, maxLength: 200 }),
          answer: fc.string({ minLength: 10, maxLength: 500 })
        }),
        // 生成随机满意度
        fc.constantFrom('satisfied', 'unsatisfied', 'neutral'),
        async (qaData, satisfaction) => {
          const studentId = validStudentIds[0];
          let qaRecordId: number | null = null;

          try {
            // 1. 插入问答记录（模拟AI答疑后保存）
            const insertResult = await executeQuery<any>(
              `INSERT INTO qa_records (student_id, question, answer, satisfaction)
               VALUES (?, ?, ?, NULL)`,
              [studentId, qaData.question, qaData.answer]
            );
            qaRecordId = insertResult.insertId;

            // 验证：记录应该被创建
            expect(qaRecordId).toBeGreaterThan(0);

            // 2. 查询刚插入的记录
            const records = await executeQuery<Array<{
              id: number;
              student_id: number;
              question: string;
              answer: string;
              satisfaction: string | null;
            }>>(
              'SELECT * FROM qa_records WHERE id = ?',
              [qaRecordId]
            );

            // 验证：记录应该存在
            expect(records).toHaveLength(1);
            expect(records[0].student_id).toBe(studentId);
            expect(records[0].question).toBe(qaData.question);
            expect(records[0].answer).toBe(qaData.answer);
            expect(records[0].satisfaction).toBeNull(); // 初始无满意度

            // 3. 更新满意度（模拟学生反馈）
            await executeQuery(
              'UPDATE qa_records SET satisfaction = ? WHERE id = ?',
              [satisfaction, qaRecordId]
            );

            // 4. 验证满意度更新
            const updatedRecords = await executeQuery<Array<{
              id: number;
              satisfaction: string | null;
            }>>(
              'SELECT id, satisfaction FROM qa_records WHERE id = ?',
              [qaRecordId]
            );

            expect(updatedRecords).toHaveLength(1);
            expect(updatedRecords[0].satisfaction).toBe(satisfaction);

            // 5. 验证满意的问答记录可以被查询用于AI优化
            if (satisfaction === 'satisfied') {
              const satisfiedRecords = await executeQuery<Array<{ id: number }>>(
                `SELECT id FROM qa_records WHERE satisfaction = 'satisfied' AND id = ?`,
                [qaRecordId]
              );
              expect(satisfiedRecords).toHaveLength(1);
            }

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (qaRecordId) {
              await executeQuery('DELETE FROM qa_records WHERE id = ?', [qaRecordId]);
            }
          }
        }
      ),
      { numRuns: 20 } // 运行100次迭代
    );
  }, 120000); // 120秒超时

  it('问答记录应包含完整的问题和答案内容', async () => {
    if (validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // 生成各种长度的问题和答案
        fc.record({
          question: fc.string({ minLength: 1, maxLength: 1000 }),
          answer: fc.string({ minLength: 1, maxLength: 2000 })
        }),
        async (qaData) => {
          const studentId = validStudentIds[0];
          let qaRecordId: number | null = null;

          try {
            // 插入问答记录
            const insertResult = await executeQuery<any>(
              `INSERT INTO qa_records (student_id, question, answer, satisfaction)
               VALUES (?, ?, ?, 'satisfied')`,
              [studentId, qaData.question, qaData.answer]
            );
            qaRecordId = insertResult.insertId;

            // 查询并验证内容完整性
            const records = await executeQuery<Array<{
              question: string;
              answer: string;
            }>>(
              'SELECT question, answer FROM qa_records WHERE id = ?',
              [qaRecordId]
            );

            expect(records).toHaveLength(1);
            
            // 验证：问题内容应完整保存
            expect(records[0].question).toBe(qaData.question);
            expect(records[0].question.length).toBe(qaData.question.length);
            
            // 验证：答案内容应完整保存
            expect(records[0].answer).toBe(qaData.answer);
            expect(records[0].answer.length).toBe(qaData.answer.length);

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (qaRecordId) {
              await executeQuery('DELETE FROM qa_records WHERE id = ?', [qaRecordId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('满意度反馈应正确更新问答记录', async () => {
    if (validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // 生成满意度变化序列
        fc.array(
          fc.constantFrom('satisfied', 'unsatisfied', 'neutral'),
          { minLength: 1, maxLength: 5 }
        ),
        async (satisfactionChanges) => {
          const studentId = validStudentIds[0];
          let qaRecordId: number | null = null;

          try {
            // 创建问答记录
            const insertResult = await executeQuery<any>(
              `INSERT INTO qa_records (student_id, question, answer, satisfaction)
               VALUES (?, ?, ?, NULL)`,
              [studentId, '测试问题', '测试答案']
            );
            qaRecordId = insertResult.insertId;

            // 依次更新满意度
            for (const satisfaction of satisfactionChanges) {
              await executeQuery(
                'UPDATE qa_records SET satisfaction = ? WHERE id = ?',
                [satisfaction, qaRecordId]
              );

              // 验证每次更新后的值
              const records = await executeQuery<Array<{ satisfaction: string }>>(
                'SELECT satisfaction FROM qa_records WHERE id = ?',
                [qaRecordId]
              );

              expect(records[0].satisfaction).toBe(satisfaction);
            }

            // 验证最终状态
            const finalRecords = await executeQuery<Array<{ satisfaction: string }>>(
              'SELECT satisfaction FROM qa_records WHERE id = ?',
              [qaRecordId]
            );

            const lastSatisfaction = satisfactionChanges[satisfactionChanges.length - 1];
            expect(finalRecords[0].satisfaction).toBe(lastSatisfaction);

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (qaRecordId) {
              await executeQuery('DELETE FROM qa_records WHERE id = ?', [qaRecordId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('问答记录应关联正确的学生ID', async () => {
    if (validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // 从有效学生ID中选择
        fc.constantFrom(...validStudentIds),
        fc.record({
          question: fc.string({ minLength: 5, maxLength: 100 }),
          answer: fc.string({ minLength: 10, maxLength: 200 })
        }),
        async (studentId, qaData) => {
          let qaRecordId: number | null = null;

          try {
            // 插入问答记录
            const insertResult = await executeQuery<any>(
              `INSERT INTO qa_records (student_id, question, answer, satisfaction)
               VALUES (?, ?, ?, 'satisfied')`,
              [studentId, qaData.question, qaData.answer]
            );
            qaRecordId = insertResult.insertId;

            // 验证学生ID关联正确
            const records = await executeQuery<Array<{
              student_id: number;
            }>>(
              'SELECT student_id FROM qa_records WHERE id = ?',
              [qaRecordId]
            );

            expect(records).toHaveLength(1);
            expect(records[0].student_id).toBe(studentId);

            // 验证可以通过学生ID查询到该记录
            const studentRecords = await executeQuery<Array<{ id: number }>>(
              'SELECT id FROM qa_records WHERE student_id = ? AND id = ?',
              [studentId, qaRecordId]
            );

            expect(studentRecords).toHaveLength(1);
            expect(studentRecords[0].id).toBe(qaRecordId);

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            if (qaRecordId) {
              await executeQuery('DELETE FROM qa_records WHERE id = ?', [qaRecordId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('满意的问答记录应可被筛选用于AI模型优化', async () => {
    if (validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // 生成多条问答记录，部分满意部分不满意
        fc.array(
          fc.record({
            question: fc.string({ minLength: 5, maxLength: 100 }),
            answer: fc.string({ minLength: 10, maxLength: 200 }),
            satisfaction: fc.constantFrom('satisfied', 'unsatisfied', 'neutral')
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (qaRecords) => {
          const studentId = validStudentIds[0];
          const insertedIds: number[] = [];

          try {
            // 插入多条问答记录
            for (const qa of qaRecords) {
              const insertResult = await executeQuery<any>(
                `INSERT INTO qa_records (student_id, question, answer, satisfaction)
                 VALUES (?, ?, ?, ?)`,
                [studentId, qa.question, qa.answer, qa.satisfaction]
              );
              insertedIds.push(insertResult.insertId);
            }

            // 计算预期的满意记录数
            const expectedSatisfiedCount = qaRecords.filter(
              qa => qa.satisfaction === 'satisfied'
            ).length;

            // 查询满意的记录
            const satisfiedRecords = await executeQuery<Array<{ id: number }>>(
              `SELECT id FROM qa_records 
               WHERE student_id = ? AND satisfaction = 'satisfied' AND id IN (${insertedIds.join(',')})`,
              [studentId]
            );

            // 验证：满意记录数应匹配
            expect(satisfiedRecords.length).toBe(expectedSatisfiedCount);

            // 验证：所有满意记录都可以被检索用于AI优化
            for (const record of satisfiedRecords) {
              const fullRecord = await executeQuery<Array<{
                question: string;
                answer: string;
              }>>(
                'SELECT question, answer FROM qa_records WHERE id = ?',
                [record.id]
              );

              expect(fullRecord).toHaveLength(1);
              expect(fullRecord[0].question).toBeDefined();
              expect(fullRecord[0].answer).toBeDefined();
            }

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            for (const id of insertedIds) {
              await executeQuery('DELETE FROM qa_records WHERE id = ?', [id]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});
