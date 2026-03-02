import express from 'express';
import testController from '../controllers/testController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 获取所有测试（公开）
router.get('/', testController.getAllTests);

// 获取测试详情（公开）
router.get('/:id', testController.getTestById);

// 获取测试题目（暂时禁用认证以方便测试）
router.get('/:id/questions', testController.getTestQuestions);

// 创建测试（管理员）
router.post(
  '/',
  auth,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  },
  testController.createTest
);

// 更新测试（管理员）
router.put(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  },
  testController.updateTest
);

// 删除测试（管理员）
router.delete(
  '/:id',
  auth,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  },
  testController.deleteTest
);

// 提交测试答案（认证）
router.post('/:id/submit', auth, testController.submitTest);

// 获取用户知识点掌握度分析（认证）
router.get('/knowledge-points/analysis', auth, testController.getUserKnowledgePointsAnalysis);

// 获取测试结果详情（认证）
router.get('/results/:resultId', auth, testController.getTestResultById);

export default router;
