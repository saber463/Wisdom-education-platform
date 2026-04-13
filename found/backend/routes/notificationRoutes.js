import express from 'express';
import {
  getNotifications,
  addNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// 通知路由
router.post('/', addNotification);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/clear-all', clearAllNotifications);

export default router;
