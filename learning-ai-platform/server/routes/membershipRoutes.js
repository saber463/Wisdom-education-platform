import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMembershipInfo,
  upgradeMembership,
  getMembershipPlans,
} from '../controllers/membershipController.js';

const router = express.Router();

// 获取用户会员信息
router.get('/info', protect, getMembershipInfo);

// 获取会员套餐列表
router.get('/plans', getMembershipPlans);

// 升级会员
router.post('/upgrade', protect, upgradeMembership);

export default router;
