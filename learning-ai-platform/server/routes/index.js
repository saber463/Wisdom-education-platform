import express from 'express';
const router = express.Router();

// 加载所有路由
import userRoutes from './userRoutes.js';
import authRoutes from './authRoutes.js';
import aiRoutes from './ai.js'; // 添加AI路由
// import questionnaireRoutes from './questionnaireRoutes.js'; // 暂时注释问卷路由
import historyRoutes from './historyRoutes.js'; // 取消注释
import tweetRoutes from './tweetRoutes.js'; // 取消注释
import achievementsRoutes from './achievements.js'; // 添加成就路由
import favoritesRoutes from './favorites.js'; // 添加收藏路由
import categoriesRoutes from './categories.js'; // 添加分类路由
import testsRoutes from './tests.js';
import knowledgePointsRoutes from './knowledgePoints.js';
import groupRoutes from './groupRoutes.js'; // 添加学习小组路由
// import wrongQuestionsRoutes from './wrongQuestions.js'; // 添加错题本路由
// 新增路由 - 本地存储数据迁移到数据库
import learningProgressRoutes from './learningProgressRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import membershipRoutes from './membershipRoutes.js'; // 添加会员路由
import walletRoutes from './walletRoutes.js'; // 添加钱包路由
import subscriptionRoutes from './subscriptionRoutes.js'; // 添加订阅路由
import roadmapRoutes from './roadmapRoutes.js'; // 添加路线图路由
import codeGeneratorRoutes from './codeGeneratorRoutes.js'; // 代码生成路由
import knowledgeBaseRoutes from './knowledgeBaseRoutes.js'; // 知识库路由
import batchRoutes from './batchRoutes.js'; // 批处理API路由

const API_PREFIX = '';

// 挂载所有路由
router.use(`${API_PREFIX}/auth`, authRoutes); // 添加认证路由挂载
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/ai`, aiRoutes); // 添加AI路由挂载
// router.use(`${API_PREFIX}/questionnaire`, questionnaireRoutes); // 暂时注释问卷路由挂载
router.use(`${API_PREFIX}/history`, historyRoutes); // 取消注释
router.use(`${API_PREFIX}/tweets`, tweetRoutes); // 取消注释
router.use(`${API_PREFIX}/achievements`, achievementsRoutes); // 添加成就路由挂载
router.use(`${API_PREFIX}/favorites`, favoritesRoutes); // 添加收藏路由挂载
router.use(`${API_PREFIX}/categories`, categoriesRoutes); // 添加分类路由挂载
router.use(`${API_PREFIX}/tests`, testsRoutes);
router.use(`${API_PREFIX}/knowledge-points`, knowledgePointsRoutes);
router.use(`${API_PREFIX}/groups`, groupRoutes); // 添加学习小组路由挂载
// router.use(`${API_PREFIX}/wrong-questions`, wrongQuestionsRoutes); // 挂载错题本路由

// 挂载新增路由 - 本地存储数据迁移到数据库
router.use(`${API_PREFIX}/learning-progress`, learningProgressRoutes);
router.use(`${API_PREFIX}/notifications`, notificationRoutes);
router.use(`${API_PREFIX}/membership`, membershipRoutes); // 添加会员路由挂载
router.use(`${API_PREFIX}/wallet`, walletRoutes); // 添加钱包路由挂载
router.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes); // 添加订阅路由挂载
router.use(`${API_PREFIX}/roadmaps`, roadmapRoutes); // 添加路线图路由挂载
router.use(`${API_PREFIX}/code`, codeGeneratorRoutes); // 代码生成路由挂载
router.use(`${API_PREFIX}/knowledge`, knowledgeBaseRoutes); // 知识库路由挂载
router.use(`${API_PREFIX}/ai/batch`, batchRoutes); // 批处理API路由挂载

// 健康检查路由已移至app.js（无需API前缀即可访问）

export default router;
