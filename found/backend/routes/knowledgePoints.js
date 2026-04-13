import express from 'express';
import knowledgePointController from '../controllers/knowledgePointController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 获取所有知识点（公开）
router.get('/', knowledgePointController.getAllKnowledgePoints);

// 获取知识点树结构（公开）
router.get('/tree', knowledgePointController.getKnowledgePointTree);

// 获取知识点详情（公开）
router.get('/:id', knowledgePointController.getKnowledgePointById);

// 创建知识点（管理员）
router.post(
  '/',
  auth,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  },
  knowledgePointController.createKnowledgePoint
);

// 更新知识点（管理员）
router.put(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  },
  knowledgePointController.updateKnowledgePoint
);

// 删除知识点（管理员）
router.delete(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  },
  knowledgePointController.deleteKnowledgePoint
);

// 获取用户知识点掌握情况（认证）
router.get('/user/knowledge-points', auth, knowledgePointController.getUserKnowledgePoints);

// 获取知识点掌握度分析（认证）
router.get('/user/analysis', auth, knowledgePointController.getKnowledgePointAnalysis);

// 更新知识点掌握度（认证）
router.post('/user/mastery', auth, knowledgePointController.updateKnowledgePointMastery);

// 根据用户兴趣推荐知识库（认证）
router.get('/recommended', auth, knowledgePointController.getRecommendedKnowledgePoints);

export default router;
