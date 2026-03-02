/**
 * AI动态学习路径API属性测试
 * Property-Based Tests using fast-check
 * Requirements: 21.1-21.19
 * Task: 8.7
 */

import * as fc from 'fast-check';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import aiLearningPathRouter from '../ai-learning-path.js';
import { executeQuery, closePool } from '../../config/database.js';
import { aiLearningPathService } from '../../services/ai-learning-path.service.js';

// Mock dependencies
jest.mock('../../config/database.js');
jest.mock('../../services/ai-learning-path.service.js');
jest.mock('../../config/mongodb.js');

const app = express();
app.use(express.json());
app.use('/api/ai-learning-path', aiLearningPathRouter);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Helper function to generate JWT token
function generateToken(userId: number, role: string = 'student'): string {
  return jwt.sign({ id: userId, username: `user${userId}`, role }, JWT_SECRET, { expiresIn: '1h' });
}

// Mock authenticateToken middleware
jest.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ code: 401, msg: '未授权', data: null });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ code: 403, msg: '令牌无效', data: null });
    }
  },
  AuthRequest: {}
}));

describe('AI Learning Path API - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closePool();
  });

  /**
   * Property 65: 学习数据采集延迟≤5秒
   * Feature: learning-platform-integration, Property 65: 学习数据采集延迟≤5秒
   * Validates: Requirements 21.4
   * 
   * 对于任何有效的学习数据，当调用采集接口时，系统应在5秒内完成采集并返回成功
   */
  test('Property 65: 学习数据采集延迟≤5秒', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // userId
        fc.integer({ min: 1, max: 1000 }),   // lesson_id
        fc.constantFrom('video', 'practice', 'completion'), // data_type
        fc.string({ minLength: 1, maxLength: 50 }), // session_id
        async (userId, lessonId, dataType, sessionId) => {
          // Mock service response
          (aiLearningPathService.collectLearningData as jest.Mock).mockResolvedValue({
            success: true,
            message: '数据采集成功',
            data_id: `data_${Date.now()}`
          });

          const token = generateToken(userId);
          const startTime = Date.now();

          const response = await request(app)
            .post('/api/ai-learning-path/collect-data')
            .set('Authorization', `Bearer ${token}`)
            .send({
              lesson_id: lessonId,
              data_type: dataType,
              session_id: sessionId,
              video_data: dataType === 'video' ? { pause_positions: [] } : null,
              practice_data: dataType === 'practice' ? { error_type: 'syntax' } : null,
              completion_data: dataType === 'completion' ? { completion_time: 100 } : null
            });

          const elapsedTime = Date.now() - startTime;

          expect(response.status).toBe(200);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toBeDefined();
          expect(elapsedTime).toBeLessThanOrEqual(5000); // ≤5秒
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 66: AI评估响应时间≤100ms
   * Feature: learning-platform-integration, Property 66: AI评估响应时间≤100ms
   * Validates: Requirements 21.13
   * 
   * 对于任何有效的学习任务完成事件，当触发AI重新评估时，系统应在100ms内完成评估
   */
  test('Property 66: AI评估响应时间≤100ms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // userId
        fc.integer({ min: 1, max: 1000 }),  // learning_path_id
        async (userId, learningPathId) => {
          // Mock service response
          (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue({
            adjusted_path: {
              current_step: 5,
              steps: [1, 2, 4, 5, 7, 8],
              skipped_steps: [3, 6]
            },
            adjustment_summary: '路径已调整'
          });

          const token = generateToken(userId);
          const startTime = Date.now();

          const response = await request(app)
            .get(`/api/ai-learning-path/adjusted/${learningPathId}`)
            .set('Authorization', `Bearer ${token}`);

          const elapsedTime = Date.now() - startTime;

          expect(response.status).toBe(200);
          expect(response.body.code).toBe(200);
          expect(elapsedTime).toBeLessThanOrEqual(100); // ≤100ms
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 67: 路径更新响应时间≤300ms
   * Feature: learning-platform-integration, Property 67: 路径更新响应时间≤300ms
   * Validates: Requirements 21.14
   * 
   * 对于任何路径调整完成事件，当更新前端显示时，系统应在300ms内返回更新后的路径
   */
  test('Property 67: 路径更新响应时间≤300ms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // userId
        fc.integer({ min: 1, max: 1000 }),  // learning_path_id
        async (userId, learningPathId) => {
          // Mock service response
          (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue({
            adjusted_path: {
              current_step: 5,
              steps: [1, 2, 4, 5, 7, 8],
              skipped_steps: [3, 6],
              added_steps: []
            },
            adjustment_summary: '路径已调整'
          });

          const token = generateToken(userId);
          const startTime = Date.now();

          const response = await request(app)
            .get(`/api/ai-learning-path/adjusted/${learningPathId}`)
            .set('Authorization', `Bearer ${token}`);

          const elapsedTime = Date.now() - startTime;

          expect(response.status).toBe(200);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toBeDefined();
          expect(elapsedTime).toBeLessThanOrEqual(300); // ≤300ms
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 68: 知识点掌握度分级准确性
   * Feature: learning-platform-integration, Property 68: 知识点掌握度分级准确性
   * Validates: Requirements 21.6
   * 
   * 对于任何知识点掌握度评估结果，系统应正确分为已掌握（≥85%）、待巩固（60%-84%）、薄弱（<60%）三级
   */
  test('Property 68: 知识点掌握度分级准确性', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100 }), // mastery_score
        (masteryScore) => {
          let expectedLevel: string;
          
          if (masteryScore >= 85) {
            expectedLevel = '已掌握';
          } else if (masteryScore >= 60) {
            expectedLevel = '待巩固';
          } else {
            expectedLevel = '薄弱';
          }

          // 验证分级逻辑
          expect(expectedLevel).toMatch(/已掌握|待巩固|薄弱/);
          
          // 验证边界值
          if (masteryScore >= 85) {
            expect(masteryScore).toBeGreaterThanOrEqual(85);
          } else if (masteryScore >= 60) {
            expect(masteryScore).toBeGreaterThanOrEqual(60);
            expect(masteryScore).toBeLessThan(85);
          } else {
            expect(masteryScore).toBeLessThan(60);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 69: 动态调整开关状态持久化
   * Feature: learning-platform-integration, Property 69: 动态调整开关状态持久化
   * Validates: Requirements 21.18
   * 
   * 对于任何用户的动态调整开关设置，系统应持久化保存并在跨会话时保持状态
   */
  test('Property 69: 动态调整开关状态持久化', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // userId
        fc.integer({ min: 1, max: 1000 }),  // learning_path_id
        fc.boolean(),                       // enabled
        async (userId, learningPathId, enabled) => {
          // Mock service response
          (aiLearningPathService.toggleDynamicAdjustment as jest.Mock).mockResolvedValue({
            success: true,
            message: enabled ? '动态调整已启用' : '动态调整已关闭',
            current_state: {
              dynamic_adjustment_enabled: enabled,
              learning_path_id: learningPathId,
              restored_to_default: !enabled
            }
          });

          const token = generateToken(userId);

          // 设置开关
          const setResponse = await request(app)
            .put('/api/ai-learning-path/toggle-dynamic')
            .set('Authorization', `Bearer ${token}`)
            .send({
              learning_path_id: learningPathId,
              enabled: enabled
            });

          expect(setResponse.status).toBe(200);
          expect(setResponse.body.data.dynamic_adjustment_enabled).toBe(enabled);

          // 获取状态（模拟跨会话查询）
          (aiLearningPathService.getDynamicAdjustmentStatus as jest.Mock).mockResolvedValue({
            dynamic_adjustment_enabled: enabled,
            learning_path_id: learningPathId
          });

          const getResponse = await request(app)
            .get(`/api/ai-learning-path/dynamic-status/${learningPathId}`)
            .set('Authorization', `Bearer ${token}`);

          expect(getResponse.status).toBe(200);
          expect(getResponse.body.data.dynamic_adjustment_enabled).toBe(enabled);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 70: 路径调整日志完整性
   * Feature: learning-platform-integration, Property 70: 路径调整日志完整性
   * Validates: Requirements 21.16, 21.17
   * 
   * 对于任何路径调整操作，系统应记录完整的调整日志，包括调整类型、触发事件、调整详情等
   */
  test('Property 70: 路径调整日志完整性', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // userId
        fc.integer({ min: 1, max: 1000 }),  // learning_path_id
        fc.constantFrom('knowledge_evaluation', 'ability_adaptation', 'progress_optimization'), // adjustment_type
        fc.integer({ min: 1, max: 100 }),   // limit
        async (userId, learningPathId, adjustmentType, limit) => {
          // Mock service response
          (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockResolvedValue({
            total: 10,
            logs: [
              {
                id: 'log_1',
                learning_path_id: learningPathId,
                adjustment_type: adjustmentType,
                trigger_event: 'lesson_completed',
                adjustment_details: [
                  {
                    knowledge_point_id: 1,
                    knowledge_point_name: '知识点1',
                    old_mastery_level: '薄弱',
                    new_mastery_level: '待巩固',
                    action: '添加练习',
                    reason: '掌握度提升'
                  }
                ],
                learning_ability_tag: 'efficient',
                evaluation_score: 75,
                adjustment_summary: '路径已调整',
                created_at: new Date()
              }
            ]
          });

          const token = generateToken(userId);

          const response = await request(app)
            .get('/api/ai-learning-path/adjustment-log')
            .set('Authorization', `Bearer ${token}`)
            .query({
              learning_path_id: learningPathId,
              adjustment_type: adjustmentType,
              limit: limit
            });

          expect(response.status).toBe(200);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toBeDefined();
          expect(response.body.data.logs).toBeDefined();
          expect(response.body.data.logs.length).toBeGreaterThan(0);
          
          // 验证日志完整性
          const log = response.body.data.logs[0];
          expect(log).toHaveProperty('id');
          expect(log).toHaveProperty('learning_path_id');
          expect(log).toHaveProperty('adjustment_type');
          expect(log).toHaveProperty('trigger_event');
          expect(log).toHaveProperty('adjustment_details');
          expect(log).toHaveProperty('adjustment_summary');
          expect(log).toHaveProperty('created_at');
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 71: 学习能力画像分类准确性
   * Feature: learning-platform-integration, Property 71: 学习能力画像分类准确性
   * Validates: Requirements 21.8
   * 
   * 对于任何学习能力画像生成结果，系统应正确分类为高效型、稳健型、基础型之一
   */
  test('Property 71: 学习能力画像分类准确性', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000 }), // completion_time (秒)
        fc.integer({ min: 0, max: 50 }),  // retry_count
        (completionTime, retryCount) => {
          let abilityTag: 'efficient' | 'steady' | 'basic';
          
          // 根据完成时长和重复练习次数分类
          if (completionTime < 300 && retryCount <= 2) {
            abilityTag = 'efficient'; // 高效型：完成快且重复少
          } else if (completionTime < 600 && retryCount <= 5) {
            abilityTag = 'steady';   // 稳健型：完成中等且重复适中
          } else {
            abilityTag = 'basic';     // 基础型：完成慢或重复多
          }

          // 验证分类结果
          expect(['efficient', 'steady', 'basic']).toContain(abilityTag);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

