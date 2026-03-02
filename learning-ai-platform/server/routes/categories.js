import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAllCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from '../controllers/categoryController.js';

const router = express.Router();

// 分类相关路由

// 获取所有分类（公开接口）
router.get('/', getAllCategories);

// 获取分类树结构（公开接口）
router.get('/tree', getCategoryTree);

// 获取分类详情（公开接口）
router.get('/:id', getCategoryById);

// 以下路由需要管理员权限
router.use(auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '权限不足' });
  }
  next();
});

// 创建分类
router.post('/', createCategory);

// 更新分类
router.put('/:id', updateCategory);

// 删除分类
router.delete('/:id', deleteCategory);

export default router;
