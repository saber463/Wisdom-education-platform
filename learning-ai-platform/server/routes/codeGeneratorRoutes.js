import express from 'express';
import { auth } from '../middleware/auth.js';
import { generateCode } from '../controllers/codeGeneratorController.js';

const router = express.Router();

// 生成代码 - 需要认证
router.post('/generate', auth, generateCode);

export default router;
