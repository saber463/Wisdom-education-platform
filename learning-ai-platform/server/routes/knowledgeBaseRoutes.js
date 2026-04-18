import express from 'express';
import {
  getArticles,
  getArticleById,
  getCategories,
  getPopularArticles,
  searchArticles,
} from '../controllers/knowledgeBaseController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 公开路由
router.get('/articles', getArticles);
router.get('/articles/search', searchArticles);
router.get('/articles/popular', getPopularArticles);
router.get('/categories', getCategories);

// 文章详情（公开，但登录后可记录阅读历史）
router.get('/articles/:id', getArticleById);

// 需要认证的路由
router.post('/articles/:id/bookmark', auth, (req, res) => {
  res.json({ success: true, message: '收藏成功' });
});
router.post('/articles/:id/like', auth, (req, res) => {
  res.json({ success: true, message: '点赞成功' });
});

export default router;
