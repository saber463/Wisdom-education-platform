import Subscription from '../models/Subscription.js';
import {
  sendVerificationEmail,
  verifyEmail as verifyEmailService,
} from '../services/emailService.js';
import { BadRequestError, NotFoundError, InternalServerError } from '../utils/errorResponse.js';

// 订阅（发送验证码）
export const subscribe = async (req, res, next) => {
  try {
    const { email, userId } = req.body;

    if (!email) {
      return next(new BadRequestError('请输入邮箱地址'));
    }

    // 发送验证邮件
    const result = await sendVerificationEmail(email);

    if (!result.success) {
      return next(new InternalServerError('邮件发送失败，请稍后重试'));
    }

    res.status(200).json({
      success: true,
      message: '验证邮件已发送，请查收',
      previewUrl: result.previewUrl || null, // 测试用
    });
  } catch (error) {
    console.error('订阅失败:', error);
    return next(new InternalServerError('订阅失败，请稍后重试'));
  }
};

// 验证邮箱
export const verifySubscription = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return next(new BadRequestError('邮箱和验证码为必填项'));
    }

    const result = await verifyEmailService(email, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: '邮箱验证成功',
    });
  } catch (error) {
    console.error('验证失败:', error);
    return next(new InternalServerError('验证失败，请稍后重试'));
  }
};

// 检查订阅状态
export const checkSubscription = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return next(new BadRequestError('请提供邮箱地址'));
    }

    const subscription = await Subscription.findOne({ email });

    res.status(200).json({
      success: true,
      data: {
        isSubscribed: !!subscription,
        isVerified: subscription?.isVerified || false,
        subscriptions: subscription?.subscriptions || null,
      },
    });
  } catch (error) {
    console.error('检查订阅状态失败:', error);
    return next(new InternalServerError('检查订阅状态失败'));
  }
};

// 获取订阅偏好
export const getPreferences = async (req, res, next) => {
  try {
    const { email, token } = req.query;

    let subscription;
    if (token) {
      subscription = await Subscription.findOne({ unsubscribeToken: token });
    } else if (email) {
      subscription = await Subscription.findOne({ email });
    } else {
      return next(new BadRequestError('请提供邮箱地址或订阅令牌'));
    }

    if (!subscription) {
      return next(new NotFoundError('未找到订阅记录'));
    }

    res.status(200).json({
      success: true,
      data: {
        email: subscription.email,
        subscriptions: subscription.subscriptions,
        isVerified: subscription.isVerified,
      },
    });
  } catch (error) {
    console.error('获取订阅偏好失败:', error);
    return next(new InternalServerError('获取订阅偏好失败'));
  }
};

// 更新订阅偏好
export const updatePreferences = async (req, res, next) => {
  try {
    const { email, token, subscriptions } = req.body;

    let subscription;
    if (token) {
      subscription = await Subscription.findOne({ unsubscribeToken: token });
    } else if (email) {
      subscription = await Subscription.findOne({ email });
    } else {
      return next(new BadRequestError('请提供邮箱地址或订阅令牌'));
    }

    if (!subscription) {
      return next(new NotFoundError('未找到订阅记录'));
    }

    // 更新订阅偏好
    if (subscriptions) {
      subscription.subscriptions = {
        ...subscription.subscriptions,
        ...subscriptions,
      };
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: '订阅偏好已更新',
      data: {
        email: subscription.email,
        subscriptions: subscription.subscriptions,
      },
    });
  } catch (error) {
    console.error('更新订阅偏好失败:', error);
    return next(new InternalServerError('更新订阅偏好失败'));
  }
};

// 取消订阅
export const unsubscribe = async (req, res, next) => {
  try {
    const { token, email } = req.query;

    let subscription;
    if (token) {
      subscription = await Subscription.findOne({ unsubscribeToken: token });
    } else if (email) {
      subscription = await Subscription.findOne({ email });
    } else {
      return next(new BadRequestError('请提供取消订阅令牌或邮箱地址'));
    }

    if (!subscription) {
      return next(new NotFoundError('未找到订阅记录'));
    }

    // 删除订阅记录
    await subscription.deleteOne();

    res.status(200).json({
      success: true,
      message: '已取消订阅',
    });
  } catch (error) {
    console.error('取消订阅失败:', error);
    return next(new InternalServerError('取消订阅失败'));
  }
};

export default {
  subscribe,
  unsubscribe,
  updatePreferences,
  getPreferences,
  verifySubscription,
  checkSubscription,
};
