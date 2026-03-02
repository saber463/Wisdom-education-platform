import Notification from '../models/Notification.js';

export const createNotification = async (userId, title, content, type, link, fromUser) => {
  try {
    const notificationData = {
      user: userId,
      title,
      content,
      type,
      link,
    };

    if (fromUser) {
      notificationData.fromUser = fromUser;
    }

    await Notification.create(notificationData);
  } catch (error) {
    console.error('创建通知失败:', error);
  }
};

export default {
  createNotification,
};
