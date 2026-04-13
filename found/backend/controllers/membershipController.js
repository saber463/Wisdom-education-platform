import User from '../models/User.js';
import { NotFoundError, BadRequestError } from '../utils/errorResponse.js';

export const getMembershipInfo = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const now = new Date();
    const membership = user.membership || { level: 'free', expireDate: null };

    let effectiveLevel = membership.level;
    let isExpired = false;

    if (membership.expireDate && new Date(membership.expireDate) < now) {
      effectiveLevel = 'free';
      isExpired = true;

      await User.findByIdAndUpdate(userId, {
        'membership.level': 'free',
        'membership.expireDate': null,
      });
    }

    let remainingDays = 0;
    if (membership.expireDate && !isExpired) {
      const expireDate = new Date(membership.expireDate);
      const diffTime = expireDate - now;
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const gmt8Offset = 8 * 60 * 60 * 1000;
    const gmt8Now = new Date(now.getTime() + gmt8Offset);
    const gmt8Today = new Date(gmt8Now.getFullYear(), gmt8Now.getMonth(), gmt8Now.getDate());

    const lastResetDate = user.learningStats?.lastResetDate;
    const gmt8LastReset = lastResetDate ? new Date(lastResetDate.getTime() + gmt8Offset) : null;
    const gmt8LastResetDay = gmt8LastReset
      ? new Date(gmt8LastReset.getFullYear(), gmt8LastReset.getMonth(), gmt8LastReset.getDate())
      : null;

    let dailyCount = user.learningStats?.dailyGenerationCount || 0;

    if (!gmt8LastResetDay || gmt8LastResetDay.getTime() !== gmt8Today.getTime()) {
      dailyCount = 0;
    }

    let dailyLimit;
    switch (effectiveLevel) {
      case 'gold':
        dailyLimit = Infinity;
        break;
      case 'silver':
        dailyLimit = 20;
        break;
      default:
        dailyLimit = 3;
    }

    res.status(200).json({
      success: true,
      data: {
        level: effectiveLevel,
        expireDate: membership.expireDate,
        remainingDays: remainingDays,
        isExpired: isExpired,
        dailyGenerationCount: dailyCount,
        dailyGenerationLimit: dailyLimit,
        remainingGenerations:
          dailyLimit === Infinity ? Infinity : Math.max(0, dailyLimit - dailyCount),
        benefits: {
          free: {
            dailyLimit: 3,
            features: ['基础学习路径生成', '每日3次生成机会'],
          },
          silver: {
            dailyLimit: 20,
            features: ['增强学习路径生成', '每日20次生成机会', '优先技术支持'],
          },
          gold: {
            dailyLimit: Infinity,
            features: ['无限学习路径生成', '无限制生成机会', '专属客服支持', '高级AI模型访问'],
          },
        }[effectiveLevel],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const upgradeMembership = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { level, duration } = req.body;

    const validLevels = ['silver', 'gold'];
    if (!validLevels.includes(level)) {
      throw new BadRequestError('无效的会员等级');
    }

    const validDurations = [1, 3, 6, 12];
    if (!validDurations.includes(duration)) {
      throw new BadRequestError('无效的会员时长');
    }

    const prices = {
      silver: { 1: 29, 3: 79, 6: 149, 12: 279 },
      gold: { 1: 99, 3: 279, 6: 499, 12: 899 },
    };

    const price = prices[level][duration];

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (!user.wallet) {
      user.wallet = {
        balance: 0,
        transactions: [],
      };
    }

    if (user.wallet.balance < price) {
      throw new BadRequestError('余额不足，请先充值');
    }

    user.wallet.balance -= price;
    user.wallet.transactions.push({
      type: 'purchase',
      amount: -price,
      description: `购买${level === 'silver' ? '白银' : '黄金'}会员 - ${duration}个月`,
      createdAt: new Date(),
    });

    const now = new Date();
    let newExpireDate;

    const currentExpireDate = user.membership?.expireDate;
    const currentLevel = user.membership?.level || 'free';

    if (currentExpireDate && new Date(currentExpireDate) > now && currentLevel === level) {
      newExpireDate = new Date(
        new Date(currentExpireDate).getTime() + duration * 30 * 24 * 60 * 60 * 1000
      );
    } else {
      newExpireDate = new Date(now.getTime() + duration * 30 * 24 * 60 * 60 * 1000);
    }

    user.membership = {
      level: level,
      expireDate: newExpireDate,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: '会员升级成功',
      data: {
        level: level,
        expireDate: newExpireDate,
        duration: duration,
        price: price,
        currency: 'CNY',
        balance: user.wallet.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMembershipPlans = async (req, res, next) => {
  try {
    const plans = {
      silver: {
        name: '白银会员',
        description: '适合经常学习的用户',
        dailyLimit: 20,
        recommended: false,
        features: ['每日20次学习路径生成', '优先技术支持', '学习数据分析报告', '个性化学习建议'],
        pricing: [
          { duration: 1, price: 29, label: '1个月' },
          { duration: 3, price: 79, label: '3个月', discount: '9折' },
          { duration: 6, price: 149, label: '6个月', discount: '8.5折' },
          { duration: 12, price: 279, label: '12个月', discount: '8折' },
        ],
      },
      gold: {
        name: '黄金会员',
        description: '适合深度学习者和专业用户',
        dailyLimit: Infinity,
        recommended: true,
        features: [
          '无限次学习路径生成',
          '专属客服支持',
          '高级AI模型访问',
          '学习数据分析报告',
          '个性化学习建议',
          '优先功能体验',
        ],
        pricing: [
          { duration: 1, price: 99, label: '1个月' },
          { duration: 3, price: 279, label: '3个月', discount: '9.4折' },
          { duration: 6, price: 499, label: '6个月', discount: '8.4折' },
          { duration: 12, price: 899, label: '12个月', discount: '7.6折' },
        ],
      },
    };

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMembershipInfo,
  upgradeMembership,
  getMembershipPlans,
};
