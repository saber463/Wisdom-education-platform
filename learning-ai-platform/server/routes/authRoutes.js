import express from 'express';
import { register, login, checkEmailExists } from '../controllers/authController.js';
import { checkSensitive } from '../middleware/sensitiveCheck.js';
import { validate } from '../middleware/validation/validationUtils.js';
import rateLimitMiddleware from '../middleware/rateLimit.js';
import { verifyCsrfToken, clearCsrfToken } from '../middleware/csrf.js';
import { registerSchema, loginSchema, checkEmailSchema } from '../middleware/validation/userValidation.js';

const router = express.Router();

router.post('/register', rateLimitMiddleware, validate(registerSchema), checkSensitive, register);
router.post('/login', validate(loginSchema), login);
router.get('/check-email', checkEmailExists);

router.post('/logout', verifyCsrfToken, clearCsrfToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: '登出成功',
  });
});

export default router;
