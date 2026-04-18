import express from 'express';
import {
  subscribe,
  unsubscribe,
  updatePreferences,
  getPreferences,
  verifySubscription,
  checkSubscription,
} from '../controllers/subscriptionController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 公开路由
router.post('/subscribe', subscribe); // 订阅（发送验证码）
router.post('/verify', verifySubscription); // 验证邮箱
router.get('/check', checkSubscription); // 检查订阅状态
router.get('/preferences', getPreferences); // 获取订阅偏好（通过邮箱）
router.delete('/unsubscribe', unsubscribe); // 取消订阅（通过token）
router.put('/preferences', updatePreferences); // 更新订阅偏好

export default router;
