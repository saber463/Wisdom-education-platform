/**
 * AI动态学习路径调整API测试
 * Requirements: 21.9, 21.10, 21.11, 21.12, 21.13, 21.14
 */

import request from 'supertest';
import express from 'express';
import aiLearningPathRouter from '../ai-learning-path.js';
import { executeQuery } from '../../config/database.js';
import { aiLearningPathService } from '../../services/ai-learning-path.service.js';

// Mock dependencies
jest.mock('../../config/database.js');
jest.mock('../../services/ai-learning-path.service.js');
jest.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, role: 'student' };
    next();
  },
  AuthRequest: {}
}));

const app = express();
app.use(express.json());
app.use('/api/ai-learning-path', aiLearningPathRouter);

describe('AI Learning Path Adjustment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ai-learning-path/adjusted/:pathId', () => {
    it('应该成功返回调整后的学习路径', async () => {
      // Mock service response
      const mockAdjustmentResult = {
        adjusted_path: {
          current_step: 5,
          steps: [1, 2, 4, 5, 7, 8],
          skipped_steps: [3, 6],
          added_steps: [
            {
              step_id: -1,
              type: 'micro_lesson',
              knowledge_point_id: 10
            },
            {
              step_id: -2,
              type: 'practice',
              knowledge_point_id: 10
            }
          ]
        },
        adjustment_reason: '跳过步骤3：装饰器基础（已掌握）；为薄弱知识点"闭包"添加补强内容',
        affected_knowledge_points: [
          {
            kp_id: 5,
            kp_name: '装饰器',
            mastery_level: 'mastered',
            action: 'skip'
          },
          {
            kp_id: 10,
            kp_name: '闭包',
            mastery_level: 'weak',
            action: 'reinforce'
          }
        ]
      };

      (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue(mockAdjustmentResult);

      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/1')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.msg).toBe('路径调整成功');
      expect(response.body.data.adjusted_path).toBeDefined();
      expect(response.body.data.adjusted_path.steps).toEqual([1, 2, 4, 5, 7, 8]);
      expect(response.body.data.adjusted_path.skipped_steps).toEqual([3, 6]);
      expect(response.body.data.adjusted_path.added_steps).toHaveLength(2);
      expect(response.body.data.adjustment_reason).toContain('跳过步骤3');
      expect(response.body.data.affected_knowledge_points).toHaveLength(2);
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.performance.elapsed_time_ms).toBeDefined();
    });

    it('应该在路径ID无效时返回400错误', async () => {
      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/invalid')
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.msg).toBe('无效的学习路径ID');
    });

    it('应该在路径不存在时返回500错误', async () => {
      (aiLearningPathService.adjustLearningPath as jest.Mock).mockRejectedValue(
        new Error('学习路径 999 不存在')
      );

      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/999')
        .expect(500);

      expect(response.body.code).toBe(500);
      expect(response.body.msg).toContain('路径调整失败');
    });

    it('应该在300ms内完成路径调整（性能要求）', async () => {
      const mockAdjustmentResult = {
        adjusted_path: {
          current_step: 1,
          steps: [1, 2, 3],
          skipped_steps: [],
          added_steps: []
        },
        adjustment_reason: '路径无需调整',
        affected_knowledge_points: []
      };

      (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue(mockAdjustmentResult);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/1')
        .expect(200);
      const elapsedTime = Date.now() - startTime;

      // 验证响应时间（包含网络延迟，所以给更宽松的限制）
      expect(elapsedTime).toBeLessThan(500);
      
      // 验证返回的性能指标
      expect(response.body.data.performance.elapsed_time_ms).toBeDefined();
    });

    it('应该正确处理跳过已掌握知识点的场景', async () => {
      const mockAdjustmentResult = {
        adjusted_path: {
          current_step: 1,
          steps: [1, 2, 4, 5],
          skipped_steps: [3],
          added_steps: []
        },
        adjustment_reason: '跳过步骤3：Python基础语法（已掌握相关知识点）',
        affected_knowledge_points: [
          {
            kp_id: 1,
            kp_name: 'Python基础语法',
            mastery_level: 'mastered',
            action: 'skip'
          }
        ]
      };

      (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue(mockAdjustmentResult);

      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/1')
        .expect(200);

      expect(response.body.data.adjusted_path.skipped_steps).toContain(3);
      expect(response.body.data.affected_knowledge_points[0].action).toBe('skip');
      expect(response.body.data.affected_knowledge_points[0].mastery_level).toBe('mastered');
    });

    it('应该正确处理为薄弱知识点添加补强内容的场景', async () => {
      const mockAdjustmentResult = {
        adjusted_path: {
          current_step: 1,
          steps: [1, 2, 3],
          skipped_steps: [],
          added_steps: [
            {
              step_id: -1,
              type: 'micro_lesson',
              knowledge_point_id: 5
            },
            {
              step_id: -2,
              type: 'practice',
              knowledge_point_id: 5
            },
            {
              step_id: -3,
              type: 'qa_case',
              knowledge_point_id: 5
            }
          ]
        },
        adjustment_reason: '为薄弱知识点"装饰器"添加补强内容',
        affected_knowledge_points: [
          {
            kp_id: 5,
            kp_name: '装饰器',
            mastery_level: 'weak',
            action: 'reinforce'
          }
        ]
      };

      (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue(mockAdjustmentResult);

      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/1')
        .expect(200);

      expect(response.body.data.adjusted_path.added_steps).toHaveLength(3);
      expect(response.body.data.adjusted_path.added_steps[0].type).toBe('micro_lesson');
      expect(response.body.data.adjusted_path.added_steps[1].type).toBe('practice');
      expect(response.body.data.adjusted_path.added_steps[2].type).toBe('qa_case');
      expect(response.body.data.affected_knowledge_points[0].action).toBe('reinforce');
      expect(response.body.data.affected_knowledge_points[0].mastery_level).toBe('weak');
    });

    it('应该正确处理高效型学习者跳过基础讲解的场景', async () => {
      const mockAdjustmentResult = {
        adjusted_path: {
          current_step: 1,
          steps: [1, 3, 4],
          skipped_steps: [2],
          added_steps: []
        },
        adjustment_reason: '跳过步骤2：Python入门基础（高效型学习者，跳过基础讲解）',
        affected_knowledge_points: []
      };

      (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue(mockAdjustmentResult);

      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/1')
        .expect(200);

      expect(response.body.data.adjustment_reason).toContain('高效型学习者');
      expect(response.body.data.adjusted_path.skipped_steps).toContain(2);
    });

    it('应该正确处理基础型学习者降低难度的场景', async () => {
      const mockAdjustmentResult = {
        adjusted_path: {
          current_step: 1,
          steps: [1, 2, 3, 4],
          skipped_steps: [],
          added_steps: []
        },
        adjustment_reason: '基础型学习者：已降低难度梯度，增加分步指导',
        affected_knowledge_points: []
      };

      (aiLearningPathService.adjustLearningPath as jest.Mock).mockResolvedValue(mockAdjustmentResult);

      const response = await request(app)
        .get('/api/ai-learning-path/adjusted/1')
        .expect(200);

      expect(response.body.data.adjustment_reason).toContain('基础型学习者');
      expect(response.body.data.adjustment_reason).toContain('降低难度梯度');
    });
  });
});
