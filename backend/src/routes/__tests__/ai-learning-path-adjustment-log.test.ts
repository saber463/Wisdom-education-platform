/**
 * AI Learning Path Adjustment Log API Tests
 * Requirements: 21.16, 21.17
 */

import request from 'supertest';
import express from 'express';
import aiLearningPathRouter from '../ai-learning-path.js';
import { aiLearningPathService } from '../../services/ai-learning-path.service.js';

// Mock dependencies
jest.mock('../../services/ai-learning-path.service.js');
jest.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, role: 'student' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/ai-learning-path', aiLearningPathRouter);

describe('AI Learning Path Adjustment Log API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ai-learning-path/adjustment-log', () => {
    it('应该成功返回调整日志列表', async () => {
      // Mock service response
      const mockLogs = {
        total: 2,
        logs: [
          {
            id: '507f1f77bcf86cd799439011',
            learning_path_id: 5,
            adjustment_type: 'knowledge_evaluation',
            trigger_event: '用户请求路径调整',
            adjustment_details: [
              {
                knowledge_point_id: 10,
                knowledge_point_name: '装饰器',
                old_mastery_level: 'consolidating',
                new_mastery_level: 'mastered',
                action: 'skip',
                reason: '知识点已掌握，跳过相关课节'
              }
            ],
            learning_ability_tag: 'efficient',
            evaluation_score: 85.5,
            adjustment_summary: '跳过步骤3：装饰器基础（已掌握）',
            created_at: new Date('2026-01-23T10:30:00.000Z')
          },
          {
            id: '507f1f77bcf86cd799439012',
            learning_path_id: 5,
            adjustment_type: 'ability_adaptation',
            trigger_event: '能力标签变更',
            adjustment_details: [
              {
                knowledge_point_id: 15,
                knowledge_point_name: '闭包',
                old_mastery_level: 'weak',
                new_mastery_level: 'consolidating',
                action: 'add_practice',
                reason: '知识点薄弱，添加补强内容'
              }
            ],
            learning_ability_tag: 'steady',
            evaluation_score: 72.3,
            adjustment_summary: '为薄弱知识点"闭包"添加补强内容',
            created_at: new Date('2026-01-23T09:15:00.000Z')
          }
        ]
      };

      (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.msg).toBe('获取调整日志成功');
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.logs[0].learning_path_id).toBe(5);
      expect(response.body.data.logs[0].adjustment_type).toBe('knowledge_evaluation');
    });

    it('应该支持按learning_path_id筛选', async () => {
      const mockLogs = {
        total: 1,
        logs: [
          {
            id: '507f1f77bcf86cd799439011',
            learning_path_id: 5,
            adjustment_type: 'knowledge_evaluation',
            trigger_event: '用户请求路径调整',
            adjustment_details: [],
            learning_ability_tag: 'efficient',
            evaluation_score: 85.5,
            adjustment_summary: '路径调整完成',
            created_at: new Date('2026-01-23T10:30:00.000Z')
          }
        ]
      };

      (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log?learning_path_id=5')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.total).toBe(1);
      expect(aiLearningPathService.getAdjustmentLogs).toHaveBeenCalledWith(
        1, // userId
        5, // learningPathId
        20, // default limit
        undefined // adjustmentType
      );
    });

    it('应该支持按adjustment_type筛选', async () => {
      const mockLogs = {
        total: 1,
        logs: []
      };

      (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log?adjustment_type=knowledge_evaluation')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(aiLearningPathService.getAdjustmentLogs).toHaveBeenCalledWith(
        1,
        undefined,
        20,
        'knowledge_evaluation'
      );
    });

    it('应该支持自定义limit参数', async () => {
      const mockLogs = {
        total: 50,
        logs: []
      };

      (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log?limit=50')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(aiLearningPathService.getAdjustmentLogs).toHaveBeenCalledWith(
        1,
        undefined,
        50,
        undefined
      );
    });

    it('应该限制limit最大值为100', async () => {
      const mockLogs = {
        total: 200,
        logs: []
      };

      (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log?limit=200')
        .expect(200);

      expect(response.body.code).toBe(200);
      // Should be capped at 100
      expect(aiLearningPathService.getAdjustmentLogs).toHaveBeenCalledWith(
        1,
        undefined,
        100,
        undefined
      );
    });

    it('应该在adjustment_type无效时返回400错误', async () => {
      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log?adjustment_type=invalid_type')
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.msg).toContain('adjustment_type必须是');
    });

    it('应该在服务失败时返回500错误', async () => {
      (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockRejectedValue(
        new Error('数据库连接失败')
      );

      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log')
        .expect(500);

      expect(response.body.code).toBe(500);
      expect(response.body.msg).toContain('获取调整日志失败');
    });

    it('应该返回按时间倒序排列的日志', async () => {
      const mockLogs = {
        total: 2,
        logs: [
          {
            id: '1',
            learning_path_id: 5,
            adjustment_type: 'knowledge_evaluation',
            trigger_event: '最新调整',
            adjustment_details: [],
            learning_ability_tag: 'efficient',
            evaluation_score: 85.5,
            adjustment_summary: '最新调整',
            created_at: new Date('2026-01-23T12:00:00.000Z')
          },
          {
            id: '2',
            learning_path_id: 5,
            adjustment_type: 'knowledge_evaluation',
            trigger_event: '较早调整',
            adjustment_details: [],
            learning_ability_tag: 'efficient',
            evaluation_score: 80.0,
            adjustment_summary: '较早调整',
            created_at: new Date('2026-01-23T10:00:00.000Z')
          }
        ]
      };

      (aiLearningPathService.getAdjustmentLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/ai-learning-path/adjustment-log')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.logs[0].trigger_event).toBe('最新调整');
      expect(response.body.data.logs[1].trigger_event).toBe('较早调整');
    });
  });
});
