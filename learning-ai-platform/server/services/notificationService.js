import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';
import { sendEmail } from './emailService.js';
import { sendEmailWithQueue, getPendingEmailCount } from './emailQueueService.js';

/**
 * 通知服务 - 当有课程更新时，批量发送邮件通知
 */

// 创建通知（站内通知）
export const createNotification = async (toUser, title, content, type, link, fromUser = null) => {
  try {
    const notification = await Notification.create({
      user: toUser,
      fromUser,
      title,
      content,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error('📬 创建通知失败:', error.message);
    throw error;
  }
};

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 通知新课程上线
export const notifyNewCourse = async course => {
  try {
    const subscribers = await Subscription.getActiveSubscriptions('newCourse');

    if (subscribers.length === 0) {
      console.log('📧 没有订阅新课程的用户');
      return { sent: 0, queued: 0 };
    }

    // 使用邮件队列异步发送
    let queued = 0;
    for (const subscriber of subscribers) {
      const success = await sendEmailWithQueue({
        to: subscriber.email,
        subject: `🆕 新课程上线 | ${course.title}`,
        template: 'newCourse',
        data: {
          email: subscriber.email,
          courseName: course.title,
          courseDescription: course.description,
          teacherName: course.teacher?.name || '平台讲师',
          category: course.category?.name || '综合',
          duration: course.duration || '未知',
          isVip: course.isVip,
          courseUrl: `${BASE_URL}/course/${course._id}`,
        },
      });
      if (success) queued++;
    }

    console.log(`📧 新课程通知已加入队列，将发送给 ${queued} 位用户`);
    return { sent: 0, queued };
  } catch (error) {
    console.error('📧 发送新课程通知失败:', error);
    throw error;
  }
};

// 通知课程更新
export const notifyCourseUpdate = async (course, updateInfo) => {
  try {
    const subscribers = await Subscription.getActiveSubscriptions('courseUpdate');

    if (subscribers.length === 0) {
      console.log('📧 没有订阅课程更新的用户');
      return { sent: 0, queued: 0 };
    }

    // 使用邮件队列异步发送
    let queued = 0;
    for (const subscriber of subscribers) {
      const success = await sendEmailWithQueue({
        to: subscriber.email,
        subject: `📚 课程更新 | ${course.title}`,
        template: 'courseUpdate',
        data: {
          email: subscriber.email,
          courseName: course.title,
          updateDescription: updateInfo.description,
          updateItems: updateInfo.items || [],
          courseUrl: `${BASE_URL}/course/${course._id}`,
        },
      });
      if (success) queued++;
    }

    console.log(`📧 课程更新通知已加入队列，将发送给 ${queued} 位用户`);
    return { sent: 0, queued };
  } catch (error) {
    console.error('📧 发送课程更新通知失败:', error);
    throw error;
  }
};

// 通知明星老师动态
export const notifyTeacherNews = async (teacher, news) => {
  try {
    const subscribers = await Subscription.getActiveSubscriptions('teacherNews');

    if (subscribers.length === 0) {
      console.log('📧 没有订阅老师动态的用户');
      return { sent: 0, queued: 0 };
    }

    // 使用邮件队列异步发送
    let queued = 0;
    for (const subscriber of subscribers) {
      const success = await sendEmailWithQueue({
        to: subscriber.email,
        subject: `⭐ 老师动态 | ${teacher.name}`,
        template: 'teacherNews',
        data: {
          email: subscriber.email,
          teacherName: teacher.name,
          teacherTitle: teacher.title,
          teacherAvatar: teacher.avatar,
          newsContent: news.content,
          newCourse: news.newCourse || null,
          teacherUrl: `${BASE_URL}/star-teachers`,
        },
      });
      if (success) queued++;
    }

    console.log(`📧 老师动态通知已加入队列，将发送给 ${queued} 位用户`);
    return { sent: 0, queued };
  } catch (error) {
    console.error('📧 发送老师动态通知失败:', error);
    throw error;
  }
};

// 通知VIP内容
export const notifyVipContent = async content => {
  try {
    const subscribers = await Subscription.getActiveSubscriptions('vipNews');

    if (subscribers.length === 0) {
      console.log('📧 没有订阅VIP内容的用户');
      return { sent: 0, queued: 0 };
    }

    // 使用邮件队列异步发送
    let queued = 0;
    for (const subscriber of subscribers) {
      const success = await sendEmailWithQueue({
        to: subscriber.email,
        subject: `👑 VIP专属内容 | ${content.title}`,
        template: 'vipNews',
        data: {
          email: subscriber.email,
          title: content.title,
          content: content.description,
          vipGift: content.gift || null,
          contentUrl: `${BASE_URL}${content.url || '/vip'}`,
        },
      });
      if (success) queued++;
    }

    console.log(`📧 VIP通知已加入队列，将发送给 ${queued} 位用户`);
    return { sent: 0, queued };
  } catch (error) {
    console.error('📧 发送VIP通知失败:', error);
    throw error;
  }
};

// 发送系统通知
export const notifySystem = async (title, content, actionText, actionUrl) => {
  try {
    const subscribers = await Subscription.getActiveSubscriptions('systemNotice');

    if (subscribers.length === 0) {
      console.log('📧 没有订阅系统通知的用户');
      return { sent: 0, queued: 0 };
    }

    // 使用邮件队列异步发送
    let queued = 0;
    for (const subscriber of subscribers) {
      const success = await sendEmailWithQueue({
        to: subscriber.email,
        subject: `📢 系统通知 | ${title}`,
        template: 'systemNotice',
        data: {
          email: subscriber.email,
          title,
          content,
          actionText,
          actionUrl: actionUrl ? `${BASE_URL}${actionUrl}` : null,
        },
      });
      if (success) queued++;
    }

    console.log(`📧 系统通知已加入队列，将发送给 ${queued} 位用户`);
    return { sent: 0, queued };
  } catch (error) {
    console.error('📧 发送系统通知失败:', error);
    throw error;
  }
};

export default {
  createNotification,
  notifyNewCourse,
  notifyCourseUpdate,
  notifyTeacherNews,
  notifyVipContent,
  notifySystem,
};
