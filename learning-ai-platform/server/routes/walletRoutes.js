import express from 'express';
import {
  getWalletBalance,
  rechargeWallet,
  getTransactionHistory,
  purchaseMembership,
  getMembershipInfo,
} from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/balance', getWalletBalance);
router.post('/recharge', rechargeWallet);
router.get('/transactions', getTransactionHistory);
router.post('/purchase-membership', purchaseMembership);
router.get('/membership', getMembershipInfo);

export default router;
