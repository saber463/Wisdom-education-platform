import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAchievements,
  getUserAchievements,
  updateAchievements,
  getRecentAchievements,
} from '../controllers/achievementController.js';
import { verifyCsrfToken } from '../middleware/csrf.js';

const router = express.Router();

router.get('/', getAchievements);

router.use(auth);

router.get('/user', getUserAchievements);
router.post('/update', verifyCsrfToken, updateAchievements);
router.get('/recent', getRecentAchievements);

export default router;
