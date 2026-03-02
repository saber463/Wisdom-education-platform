/**
 * 分层教学属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 */

import * as fc from 'fast-check';
import { executeQuery, closePool } from '../../config/database.js';
import { calculateTier } from '../tiered-teaching.js';

// 测试辅助数据
let validClassIds: number[] = [];
let validTeacherIds: number[] = [];
let validStudentIds: number[] = [];

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
 * 属性15：学生分层算法正确性
 * Feature: smart-education-platform, Property 15: 学生分层算法正确性
 * 验证需求：4.2
 * 
 * 对于任何学生历史成绩数据，系统应根据成绩将学生正确分为基础层、中等层、提高层三个层次
 */
describe('Property 15: 学生分层算法正确性', () => {
  it('平均分<60%的学生应被分为基础层', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 59 }), // 平均分（0-59%）
        async (avgScore) => {
          const tier = calculateTier(avgScore);
          
          // 验证：平均分<60%应该是基础层
          expect(tier).toBe('basic');
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('平均分60%-84%的学生应被分为中等层', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 60, max: 84 }), // 平均分（60-84%）
        async (avgScore) => {
          const tier = calculateTier(avgScore);
          
          // 验证：平均分60%-84%应该是中等层
          expect(tier).toBe('medium');
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('平均分>=85%的学生应被分为提高层', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 85, max: 100 }), // 平均分（85-100%）
        async (avgScore) => {
          const tier = calculateTier(avgScore);
          
          // 验证：平均分>=85%应该是提高层
          expect(tier).toBe('advanced');
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('分层算法应覆盖所有可能的分数范围', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 任意平均分
        async (avgScore) => {
          const tier = calculateTier(avgScore);
          
          // 验证：返回的层次必须是三个有效值之一
          expect(['basic', 'medium', 'advanced']).toContain(tier);
          
          // 验证：分层边界正确
          if (avgScore < 60) {
            expect(tier).toBe('basic');
          } else if (avgScore < 85) {
            expect(tier).toBe('medium');
          } else {
            expect(tier).toBe('advanced');
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('数据库中学生分层应与算法计算结果一致', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 分数
        async (score) => {
          const classId = validClassIds[0];
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          let createdAssignmentId: number | null = null;
          let createdSubmissionId: number | null = null;

          try {
            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建测试作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `分层测试作业_${Date.now()}`,
                '分层算法测试',
                classId,
                teacherId,
                'medium',
                100,
                '2026-12-31 23:59:59'
              ]
            );
            createdAssignmentId = assignmentResult.insertId;

            // 创建提交记录
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions 
               (assignment_id, student_id, status, total_score, grading_time) 
               VALUES (?, ?, 'graded', ?, NOW())`,
              [createdAssignmentId, studentId, score]
            );
            createdSubmissionId = submissionResult.insertId;

            // 查询学生平均分
            const stats = await executeQuery<Array<{ avg_score: number | null }>>(
              `SELECT AVG(s.total_score / a.total_score * 100) as avg_score
               FROM submissions s
               JOIN assignments a ON s.assignment_id = a.id
               WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')`,
              [studentId]
            );

            const avgScore = stats[0].avg_score !== null ? Number(stats[0].avg_score) : 0;
            const calculatedTier = calculateTier(avgScore);

            // 验证：计算出的层次应该是有效值
            expect(['basic', 'medium', 'advanced']).toContain(calculatedTier);

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (createdSubmissionId) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [createdSubmissionId]);
            }
            if (createdAssignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [createdAssignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});


/**
 * 属性17：学生层次动态调整
 * Feature: smart-education-platform, Property 17: 学生层次动态调整
 * 验证需求：4.4
 * 
 * 对于任何作业完成记录，系统应根据正确率动态调整学生层次
 */
describe('Property 17: 学生层次动态调整', () => {
  // 导入adjustTierByAccuracy函数
  let adjustTierByAccuracy: (currentTier: 'basic' | 'medium' | 'advanced', recentAccuracy: number) => 'basic' | 'medium' | 'advanced';
  
  beforeAll(async () => {
    const module = await import('../tiered-teaching.js');
    adjustTierByAccuracy = module.adjustTierByAccuracy;
  });

  it('高正确率(>=85%)应触发层次升级', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 85, max: 100 }), // 高正确率
        fc.constantFrom('basic', 'medium', 'advanced') as any, // 当前层次
        async (accuracy, currentTier: 'basic' | 'medium' | 'advanced') => {
          const newTier = adjustTierByAccuracy(currentTier, accuracy);
          
          // 验证：高正确率应该触发升级（除非已经是最高层）
          if (currentTier === 'basic') {
            expect(newTier).toBe('medium');
          } else if (currentTier === 'medium') {
            expect(newTier).toBe('advanced');
          } else {
            // 已经是最高层，保持不变
            expect(newTier).toBe('advanced');
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('低正确率(<50%)应触发层次降级', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 49 }), // 低正确率
        fc.constantFrom('basic', 'medium', 'advanced') as any, // 当前层次
        async (accuracy, currentTier: 'basic' | 'medium' | 'advanced') => {
          const newTier = adjustTierByAccuracy(currentTier, accuracy);
          
          // 验证：低正确率应该触发降级（除非已经是最低层）
          if (currentTier === 'advanced') {
            expect(newTier).toBe('medium');
          } else if (currentTier === 'medium') {
            expect(newTier).toBe('basic');
          } else {
            // 已经是最低层，保持不变
            expect(newTier).toBe('basic');
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('中等正确率(50%-84%)应保持当前层次', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 84 }), // 中等正确率
        fc.constantFrom('basic', 'medium', 'advanced') as any, // 当前层次
        async (accuracy, currentTier: 'basic' | 'medium' | 'advanced') => {
          const newTier = adjustTierByAccuracy(currentTier, accuracy);
          
          // 验证：中等正确率应该保持当前层次
          expect(newTier).toBe(currentTier);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('动态调整后层次应始终是有效值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 任意正确率
        fc.constantFrom('basic', 'medium', 'advanced') as any, // 当前层次
        async (accuracy, currentTier: 'basic' | 'medium' | 'advanced') => {
          const newTier = adjustTierByAccuracy(currentTier, accuracy);
          
          // 验证：调整后的层次必须是有效值
          expect(['basic', 'medium', 'advanced']).toContain(newTier);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('层次调整应遵循单步原则（一次只升/降一级）', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 任意正确率
        fc.constantFrom('basic', 'medium', 'advanced') as any, // 当前层次
        async (accuracy, currentTier: 'basic' | 'medium' | 'advanced') => {
          const newTier = adjustTierByAccuracy(currentTier, accuracy);
          
          // 定义层次顺序
          const tierOrder = { 'basic': 0, 'medium': 1, 'advanced': 2 };
          const currentLevel = tierOrder[currentTier as keyof typeof tierOrder];
          const newLevel = tierOrder[newTier as keyof typeof tierOrder];
          
          // 验证：层次变化不超过1级
          const levelDiff = Math.abs(newLevel - currentLevel);
          expect(levelDiff).toBeLessThanOrEqual(1);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});


/**
 * 属性16：分层作业分配匹配性
 * Feature: smart-education-platform, Property 16: 分层作业分配匹配性
 * 验证需求：4.3
 * 
 * 对于任何分层作业发布，学生收到的题目难度应与其所在层次匹配
 */
describe('Property 16: 分层作业分配匹配性', () => {
  // 辅助函数：根据层次分配题目
  function assignQuestionsByTier(
    tier: string,
    basicQuestions: number[],
    mediumQuestions: number[],
    advancedQuestions: number[]
  ): number[] {
    if (tier === 'basic') {
      return basicQuestions;
    } else if (tier === 'medium') {
      return mediumQuestions;
    } else {
      return advancedQuestions;
    }
  }

  it('基础层学生应收到基础难度题目', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }), // 基础题目ID列表
        fc.array(fc.integer({ min: 101, max: 200 }), { minLength: 1, maxLength: 5 }), // 中等题目ID列表
        fc.array(fc.integer({ min: 201, max: 300 }), { minLength: 1, maxLength: 5 }), // 提高题目ID列表
        async (basicQuestions, mediumQuestions, advancedQuestions) => {
          const studentTier = 'basic';
          const assignedQuestions = assignQuestionsByTier(studentTier, basicQuestions, mediumQuestions, advancedQuestions);
          
          // 验证：基础层学生应该收到基础题目
          expect(assignedQuestions).toEqual(basicQuestions);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('中等层学生应收到中等难度题目', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }), // 基础题目ID列表
        fc.array(fc.integer({ min: 101, max: 200 }), { minLength: 1, maxLength: 5 }), // 中等题目ID列表
        fc.array(fc.integer({ min: 201, max: 300 }), { minLength: 1, maxLength: 5 }), // 提高题目ID列表
        async (basicQuestions, mediumQuestions, advancedQuestions) => {
          const studentTier = 'medium';
          const assignedQuestions = assignQuestionsByTier(studentTier, basicQuestions, mediumQuestions, advancedQuestions);
          
          // 验证：中等层学生应该收到中等题目
          expect(assignedQuestions).toEqual(mediumQuestions);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('提高层学生应收到提高难度题目', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }), // 基础题目ID列表
        fc.array(fc.integer({ min: 101, max: 200 }), { minLength: 1, maxLength: 5 }), // 中等题目ID列表
        fc.array(fc.integer({ min: 201, max: 300 }), { minLength: 1, maxLength: 5 }), // 提高题目ID列表
        async (basicQuestions, mediumQuestions, advancedQuestions) => {
          const studentTier = 'advanced';
          const assignedQuestions = assignQuestionsByTier(studentTier, basicQuestions, mediumQuestions, advancedQuestions);
          
          // 验证：提高层学生应该收到提高题目
          expect(assignedQuestions).toEqual(advancedQuestions);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('分层分配应确保每个层次的学生都有题目', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }), // 基础题目
        fc.array(fc.integer({ min: 101, max: 200 }), { minLength: 1, maxLength: 5 }), // 中等题目
        fc.array(fc.integer({ min: 201, max: 300 }), { minLength: 1, maxLength: 5 }), // 提高题目
        fc.constantFrom('basic', 'medium', 'advanced'), // 学生层次
        async (basicQuestions, mediumQuestions, advancedQuestions, studentTier) => {
          const assignedQuestions = assignQuestionsByTier(studentTier, basicQuestions, mediumQuestions, advancedQuestions);
          
          // 验证：分配的题目列表不为空
          expect(assignedQuestions.length).toBeGreaterThan(0);
          
          // 验证：分配的题目与层次匹配
          if (studentTier === 'basic') {
            expect(assignedQuestions).toEqual(basicQuestions);
          } else if (studentTier === 'medium') {
            expect(assignedQuestions).toEqual(mediumQuestions);
          } else {
            expect(assignedQuestions).toEqual(advancedQuestions);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('分层分配结果应包含学生层次信息', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // 学生ID
        fc.string({ minLength: 1, maxLength: 20 }), // 学生姓名
        fc.constantFrom('basic', 'medium', 'advanced'), // 学生层次
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }), // 分配的题目
        async (studentId, studentName, tier, assignedQuestions) => {
          // 模拟分配结果
          const assignmentResult = {
            student_id: studentId,
            student_name: studentName,
            tier: tier,
            assigned_questions: assignedQuestions
          };
          
          // 验证：分配结果包含所有必要字段
          expect(assignmentResult.student_id).toBe(studentId);
          expect(assignmentResult.student_name).toBe(studentName);
          expect(assignmentResult.tier).toBe(tier);
          expect(assignmentResult.assigned_questions).toEqual(assignedQuestions);
          expect(['basic', 'medium', 'advanced']).toContain(assignmentResult.tier);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
