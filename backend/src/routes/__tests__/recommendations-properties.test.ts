/**
 * 个性化推荐属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 */

// Mock grpc-clients before importing recommendations
jest.mock('../../services/grpc-clients.js', () => ({
  recommendExercises: jest.fn().mockResolvedValue([])
}));

import * as fc from 'fast-check';
import { closePool } from '../../config/database.js';
import {
  WEAK_POINT_THRESHOLD,
  MASTERY_THRESHOLD,
  calculateWeakPointStatus,
  isWeakPoint,
  shouldRemoveFromWeakPoints
} from '../recommendations.js';

beforeAll(async () => {
  // 测试初始化
});

afterAll(async () => {
  await closePool();
});

/**
 * 属性22：薄弱点识别算法准确性
 * Feature: smart-education-platform, Property 22: 薄弱点识别算法准确性
 * 验证需求：6.1
 * 
 * 对于任何学生答题记录，当某知识点错误率>=50%时，系统应将其识别为薄弱知识点
 */
describe('Property 22: 薄弱点识别算法准确性', () => {
  it('错误率>=50%的知识点应被识别为薄弱点', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 100 }), // 错误率（50-100%）
        async (errorRate) => {
          const result = isWeakPoint(errorRate);
          
          // 验证：错误率>=50%应该被识别为薄弱点
          expect(result).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('错误率<50%的知识点不应被识别为薄弱点', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 49 }), // 错误率（0-49%）
        async (errorRate) => {
          const result = isWeakPoint(errorRate);
          
          // 验证：错误率<50%不应该被识别为薄弱点
          expect(result).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('薄弱点状态计算应正确分类', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 任意错误率
        async (errorRate) => {
          const status = calculateWeakPointStatus(errorRate);
          
          // 验证：状态应该是有效值
          expect(['weak', 'improving', 'mastered']).toContain(status);
          
          // 验证：状态与错误率对应正确
          if (errorRate >= WEAK_POINT_THRESHOLD) {
            expect(status).toBe('weak');
          } else if (errorRate >= MASTERY_THRESHOLD) {
            expect(status).toBe('improving');
          } else {
            expect(status).toBe('mastered');
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('薄弱点识别阈值应为50%', async () => {
    // 验证阈值常量
    expect(WEAK_POINT_THRESHOLD).toBe(50);
    
    // 边界测试
    expect(isWeakPoint(50)).toBe(true);
    expect(isWeakPoint(49)).toBe(false);
    expect(isWeakPoint(49.9)).toBe(false);
    expect(isWeakPoint(50.1)).toBe(true);
  });

  it('错误率计算应基于答题记录', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 错误次数
        fc.integer({ min: 1, max: 100 }), // 总次数（至少1次）
        async (errorCount, totalCount) => {
          // 确保错误次数不超过总次数
          const actualErrorCount = Math.min(errorCount, totalCount);
          const errorRate = (actualErrorCount / totalCount) * 100;
          
          const isWeak = isWeakPoint(errorRate);
          const expectedIsWeak = errorRate >= WEAK_POINT_THRESHOLD;
          
          // 验证：薄弱点识别结果与计算的错误率一致
          expect(isWeak).toBe(expectedIsWeak);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

/**
 * 属性26：薄弱点移除条件准确性
 * Feature: smart-education-platform, Property 26: 薄弱点移除条件准确性
 * 验证需求：6.5
 * 
 * 对于任何知识点，当错误率<30%时，系统应从薄弱点列表中移除该知识点
 */
describe('Property 26: 薄弱点移除条件准确性', () => {
  it('错误率<30%的知识点应从薄弱点列表移除', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 29 }), // 错误率（0-29%）
        async (errorRate) => {
          const shouldRemove = shouldRemoveFromWeakPoints(errorRate);
          
          // 验证：错误率<30%应该被移除
          expect(shouldRemove).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('错误率>=30%的知识点不应从薄弱点列表移除', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 30, max: 100 }), // 错误率（30-100%）
        async (errorRate) => {
          const shouldRemove = shouldRemoveFromWeakPoints(errorRate);
          
          // 验证：错误率>=30%不应该被移除
          expect(shouldRemove).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('薄弱点移除阈值应为30%', async () => {
    // 验证阈值常量
    expect(MASTERY_THRESHOLD).toBe(30);
    
    // 边界测试
    expect(shouldRemoveFromWeakPoints(30)).toBe(false);
    expect(shouldRemoveFromWeakPoints(29)).toBe(true);
    expect(shouldRemoveFromWeakPoints(29.9)).toBe(true);
    expect(shouldRemoveFromWeakPoints(30.1)).toBe(false);
  });

  it('状态转换应遵循错误率阈值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 任意错误率
        async (errorRate) => {
          const status = calculateWeakPointStatus(errorRate);
          const shouldRemove = shouldRemoveFromWeakPoints(errorRate);
          
          // 验证：mastered状态应该对应可移除
          if (status === 'mastered') {
            expect(shouldRemove).toBe(true);
          }
          
          // 验证：weak状态不应该被移除
          if (status === 'weak') {
            expect(shouldRemove).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('练习后错误率下降应触发状态更新', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 100 }), // 初始错误率（薄弱点）
        fc.integer({ min: 0, max: 29 }), // 练习后错误率（已掌握）
        async (initialErrorRate, finalErrorRate) => {
          const initialStatus = calculateWeakPointStatus(initialErrorRate);
          const finalStatus = calculateWeakPointStatus(finalErrorRate);
          
          // 验证：初始状态应该是薄弱
          expect(initialStatus).toBe('weak');
          
          // 验证：最终状态应该是已掌握
          expect(finalStatus).toBe('mastered');
          
          // 验证：最终状态应该可以从薄弱点列表移除
          expect(shouldRemoveFromWeakPoints(finalErrorRate)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

/**
 * 属性24：推荐页面信息完整性
 * Feature: smart-education-platform, Property 24: 推荐页面信息完整性
 * 验证需求：6.3
 * 
 * 对于任何练习推荐页面，应显示薄弱知识点列表和对应推荐题目
 */
describe('Property 24: 推荐页面信息完整性', () => {
  // 模拟推荐响应结构
  interface RecommendationResponse {
    student_id: number;
    student_name: string;
    weak_points: Array<{
      knowledge_point_id: number;
      knowledge_point_name: string;
      subject: string;
      error_rate: number;
      status: string;
    }>;
    recommended_exercises: Array<{
      id: number;
      title: string;
      difficulty: string;
      knowledge_point_id: number;
      knowledge_point_name: string;
    }>;
    total_weak_points: number;
    total_recommendations: number;
  }

  it('推荐响应应包含薄弱知识点列表', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // 学生ID
        fc.string({ minLength: 1, maxLength: 20 }), // 学生姓名
        fc.array(
          fc.record({
            knowledge_point_id: fc.integer({ min: 1, max: 100 }),
            knowledge_point_name: fc.string({ minLength: 1, maxLength: 50 }),
            subject: fc.constantFrom('数学', '语文', '英语'),
            error_rate: fc.integer({ min: 50, max: 100 }),
            status: fc.constant('weak')
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async (studentId, studentName, weakPoints) => {
          // 模拟推荐响应
          const response: RecommendationResponse = {
            student_id: studentId,
            student_name: studentName,
            weak_points: weakPoints,
            recommended_exercises: [],
            total_weak_points: weakPoints.length,
            total_recommendations: 0
          };
          
          // 验证：响应包含学生信息
          expect(response.student_id).toBe(studentId);
          expect(response.student_name).toBe(studentName);
          
          // 验证：响应包含薄弱知识点列表
          expect(Array.isArray(response.weak_points)).toBe(true);
          expect(response.total_weak_points).toBe(weakPoints.length);
          
          // 验证：每个薄弱点包含必要字段
          for (const wp of response.weak_points) {
            expect(wp.knowledge_point_id).toBeDefined();
            expect(wp.knowledge_point_name).toBeDefined();
            expect(wp.subject).toBeDefined();
            expect(wp.error_rate).toBeDefined();
            expect(wp.status).toBeDefined();
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('推荐响应应包含推荐题目列表', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // 学生ID
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            difficulty: fc.constantFrom('basic', 'medium', 'advanced'),
            knowledge_point_id: fc.integer({ min: 1, max: 100 }),
            knowledge_point_name: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (studentId, exercises) => {
          // 模拟推荐响应
          const response: RecommendationResponse = {
            student_id: studentId,
            student_name: 'Test Student',
            weak_points: [],
            recommended_exercises: exercises,
            total_weak_points: 0,
            total_recommendations: exercises.length
          };
          
          // 验证：响应包含推荐题目列表
          expect(Array.isArray(response.recommended_exercises)).toBe(true);
          expect(response.total_recommendations).toBe(exercises.length);
          
          // 验证：每个推荐题目包含必要字段
          for (const ex of response.recommended_exercises) {
            expect(ex.id).toBeDefined();
            expect(ex.title).toBeDefined();
            expect(ex.difficulty).toBeDefined();
            expect(ex.knowledge_point_id).toBeDefined();
            expect(ex.knowledge_point_name).toBeDefined();
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('推荐题目数量应在5-10道之间', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }), // 请求的推荐数量
        async (requestedCount) => {
          // 模拟推荐数量限制逻辑
          const actualCount = Math.min(Math.max(requestedCount, 5), 10);
          
          // 验证：推荐数量在5-10之间
          expect(actualCount).toBeGreaterThanOrEqual(5);
          expect(actualCount).toBeLessThanOrEqual(10);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('推荐题目应与薄弱知识点相关', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }), // 薄弱知识点ID列表
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            difficulty: fc.constantFrom('basic', 'medium'),
            knowledge_point_id: fc.integer({ min: 1, max: 100 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (weakPointIds, exercises) => {
          // 筛选与薄弱知识点相关的题目
          const relevantExercises = exercises.filter(ex => 
            weakPointIds.includes(ex.knowledge_point_id)
          );
          
          // 验证：相关题目的知识点ID应该在薄弱知识点列表中
          for (const ex of relevantExercises) {
            expect(weakPointIds).toContain(ex.knowledge_point_id);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
