import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getGroups,
  getUserGroups,
  createGroup,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  createGroupPost,
  likeGroupPost,
  addGroupPostComment,
  getGroupPostComments,
} from '../controllers/groupController.js';

const router = express.Router();

// 学习小组相关路由

// 获取小组列表（公开接口）
router.get('/', getGroups);

// 获取用户加入的小组
router.get('/user', auth, getUserGroups);

// 创建小组
router.post('/', auth, createGroup);

// 获取小组详情
router.get('/:id', auth, getGroupDetail);

// 更新小组信息
router.put('/:id', auth, updateGroup);

// 删除小组
router.delete('/:id', auth, deleteGroup);

// 加入小组
router.post('/:id/join', auth, joinGroup);

// 退出小组
router.post('/:id/leave', auth, leaveGroup);

// 小组帖子相关路由

// 获取小组帖子列表
router.get('/:id/posts', auth, getGroupPosts);

// 发布小组帖子
router.post('/:id/posts', auth, createGroupPost);

// 小组帖子点赞
router.post('/:id/posts/:postId/like', auth, likeGroupPost);

// 小组帖子评论
router.post('/:id/posts/:postId/comments', auth, addGroupPostComment);
router.get('/:id/posts/:postId/comments', auth, getGroupPostComments);

export default router;
