import express from 'express';
import {
  getLearningProgress,
  setCurrentPath,
  updateProgress,
  resetProgress,
} from '../controllers/learningProgressController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// 学习进度路由
router.get('/', getLearningProgress);
router.put('/current-path', setCurrentPath);
router.put('/update', updateProgress);
router.put('/reset', resetProgress);

export default router;
