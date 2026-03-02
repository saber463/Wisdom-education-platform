import User from '../models/User.js';

export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: {
        balance: user.wallet?.balance || 0,
        transactionCount: user.wallet?.transactions?.length || 0,
      },
    });
  } catch (error) {
    console.error('获取钱包余额失败:', error);
    res.status(500).json({
      success: false,
      message: '获取钱包余额失败',
    });
  }
};

export const rechargeWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '充值金额必须大于0',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    if (!user.wallet) {
      user.wallet = {
        balance: 0,
        transactions: [],
      };
    }

    user.wallet.balance += amount;
    user.wallet.transactions.push({
      type: 'recharge',
      amount: amount,
      description: description || '账户充值',
      createdAt: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      data: {
        balance: user.wallet.balance,
        transaction: user.wallet.transactions[user.wallet.transactions.length - 1],
      },
    });
  } catch (error) {
    console.error('充值失败:', error);
    res.status(500).json({
      success: false,
      message: '充值失败',
    });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const user = await User.findById(req.user._id).select('wallet');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    let transactions = user.wallet?.transactions || [];

    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        total: transactions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(transactions.length / limit),
      },
    });
  } catch (error) {
    console.error('获取交易记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取交易记录失败',
    });
  }
};

export const purchaseMembership = async (req, res) => {
  try {
    const { level, duration } = req.body;

    if (!level || !['silver', 'gold'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: '无效的会员等级',
      });
    }

    const validDurations = [1, 3, 6, 12];
    if (!duration || !validDurations.includes(duration)) {
      return res.status(400).json({
        success: false,
        message: '无效的会员时长',
      });
    }

    const membershipPrices = {
      silver: { 1: 29, 3: 79, 6: 149, 12: 279 },
      gold: { 1: 99, 3: 279, 6: 499, 12: 899 },
    };

    const price = membershipPrices[level][duration];

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    if (!user.wallet) {
      user.wallet = {
        balance: 0,
        transactions: [],
      };
    }

    if (user.wallet.balance < price) {
      return res.status(400).json({
        success: false,
        message: '余额不足，请先充值',
      });
    }

    user.wallet.balance -= price;
    user.wallet.transactions.push({
      type: 'purchase',
      amount: -price,
      description: `购买${level === 'silver' ? '白银' : '黄金'}会员 - ${duration}个月`,
      createdAt: new Date(),
    });

    const now = new Date();
    const currentExpireDate = user.membership?.expireDate && new Date(user.membership.expireDate) > now
      ? new Date(user.membership.expireDate)
      : now;

    user.membership = {
      level: level,
      expireDate: new Date(currentExpireDate.getTime() + duration * 30 * 24 * 60 * 60 * 1000),
    };

    await user.save();

    res.json({
      success: true,
      data: {
        balance: user.wallet.balance,
        membership: user.membership,
        transaction: user.wallet.transactions[user.wallet.transactions.length - 1],
      },
    });
  } catch (error) {
    console.error('购买会员失败:', error);
    res.status(500).json({
      success: false,
      message: '购买会员失败',
    });
  }
};

export const getMembershipInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('membership');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    const now = new Date();
    const isExpired = user.membership?.expireDate && new Date(user.membership.expireDate) < now;

    res.json({
      success: true,
      data: {
        level: isExpired ? 'free' : (user.membership?.level || 'free'),
        expireDate: user.membership?.expireDate,
        isExpired: isExpired,
        daysRemaining: user.membership?.expireDate
          ? Math.max(0, Math.ceil((new Date(user.membership.expireDate) - now) / (1000 * 60 * 60 * 24)))
          : 0,
      },
    });
  } catch (error) {
    console.error('获取会员信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会员信息失败',
    });
  }
};
