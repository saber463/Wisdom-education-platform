import express from 'express';
import {
  getUserInfo,
  updateProfile,
  updatePassword,
  checkDailyQuiz,
  completeDailyQuiz,
  getPresetAvatars,
  getAllUsers,
  getSystemStats,
  uploadAvatar,
} from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import { checkSensitive } from '../middleware/sensitiveCheck.js';
import { validate } from '../middleware/validation/validationUtils.js';
import {
  updateProfileSchema,
  updatePasswordSchema,
} from '../middleware/validation/userValidation.js';
import { uploadAvatarImage } from '../middleware/upload.js';
import { verifyCsrfToken } from '../middleware/csrf.js';

const router = express.Router();

router.get('/preset-avatars', getPresetAvatars);

router.get('/info', auth, getUserInfo);
router.put(
  '/update-profile',
  auth,
  verifyCsrfToken,
  validate(updateProfileSchema),
  checkSensitive,
  updateProfile
);
router.put(
  '/update-password',
  auth,
  verifyCsrfToken,
  validate(updatePasswordSchema),
  updatePassword
);
router.put('/update-avatar', auth, verifyCsrfToken, validate(updateProfileSchema), updateProfile);
router.post('/upload-avatar', auth, verifyCsrfToken, uploadAvatarImage, uploadAvatar);
router.get('/daily-quiz', auth, checkDailyQuiz);
router.post('/daily-quiz/complete', auth, verifyCsrfToken, completeDailyQuiz);

router.get('/all-users', auth, getAllUsers);
router.get('/system-stats', auth, getSystemStats);

export default router;
