import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getUserCollections,
  getCollectionResources,
  addToFavorite,
  removeFromFavorite,
  checkIsFavorite,
  renameCollection,
  deleteCollection,
} from '../controllers/favoritesController.js';

const router = express.Router();

// 收藏夹相关路由
router.use(auth); // 所有收藏相关路由都需要认证

// 获取用户收藏夹列表
router.get('/', getUserCollections);

// 获取指定收藏夹内的资源
router.get('/:collectionName', getCollectionResources);

// 添加资源到收藏夹
router.post('/', addToFavorite);

// 从收藏夹中移除资源
router.delete('/:resourceType/:resourceId', removeFromFavorite);

// 检查资源是否已收藏
router.get('/check/:resourceType/:resourceId', checkIsFavorite);

// 重命名收藏夹
router.put('/rename', renameCollection);

// 删除收藏夹
router.delete('/:collectionName', deleteCollection);

export default router;
