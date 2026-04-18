/**
 * 路线图路由
 */

import express from 'express';
import roadmapController from '../controllers/roadmapController.js';

const router = express.Router();

// 获取路线图列表
router.get('/list', roadmapController.getRoadmapList);

// 获取路线图详情
router.get('/detail/:id', roadmapController.getRoadmapDetail);

// AI生成学习路径（讯飞API）
router.post('/generate', roadmapController.generateAILearningPath);

// 路线图对比
router.get('/compare', roadmapController.compareRoadmaps);

export default router;
