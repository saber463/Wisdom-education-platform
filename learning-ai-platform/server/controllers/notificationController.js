import Notification from '../models/Notification.js';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  InternalServerError,
} from '../utils/errorResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('未提供认证令牌'));
    }

    const notifications = await Notification.find({ user: req.user._id }).sort({ time: -1 });

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    return next(new InternalServerError('获取通知列表失败，请稍后重试'));
  }
};

export const addNotification = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('未提供认证令牌'));
    }

    const { title, content, type, link } = req.body;

    if (!title || !content || !type) {
      return next(new BadRequestError('标题、内容和类型为必填项'));
    }

    const notification = await Notification.create({
      user: req.user._id,
      title,
      content,
      type,
      link: link || null,
    });

    res.status(201).json({
      success: true,
      data: {
        notification,
      },
    });
  } catch (error) {
    console.error('添加通知失败:', error);
    return next(new InternalServerError('添加通知失败，请稍后重试'));
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('未提供认证令牌'));
    }

    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    return next(new InternalServerError('获取未读通知数量失败，请稍后重试'));
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('未提供认证令牌'));
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return next(new NotFoundError('通知不存在'));
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    return next(new InternalServerError('标记通知为已读失败，请稍后重试'));
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('未提供认证令牌'));
    }

    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });

    res.status(200).json({
      success: true,
      message: '所有通知已标记为已读',
    });
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    return next(new InternalServerError('标记所有通知为已读失败，请稍后重试'));
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('未提供认证令牌'));
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return next(new NotFoundError('通知不存在'));
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: '通知已删除',
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    return next(new InternalServerError('删除通知失败，请稍后重试'));
  }
};

export const clearAllNotifications = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('未提供认证令牌'));
    }

    await Notification.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: '所有通知已清除',
    });
  } catch (error) {
    console.error('清除所有通知失败:', error);
    return next(new InternalServerError('清除所有通知失败，请稍后重试'));
  }
};

export default {
  getNotifications,
  addNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
