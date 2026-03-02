import express from 'express';
import {
  addBrowseHistory,
  getBrowseHistory,
  clearBrowseHistory,
  removeBrowseHistoryItem,
} from '../controllers/historyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// 所有路由需登录
router.post('/', protect, addBrowseHistory); // 添加浏览记录
router.get('/', protect, getBrowseHistory); // 获取浏览记录（支持分页）
router.delete('/', protect, clearBrowseHistory); // 清空所有浏览记录
router.delete('/item', protect, removeBrowseHistoryItem); // 删除单条浏览记录

export default router;
