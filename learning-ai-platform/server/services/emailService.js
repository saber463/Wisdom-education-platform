import nodemailer from 'nodemailer';
import crypto from 'crypto';
import Subscription from '../models/Subscription.js';

// 创建邮件传输器
const createTransporter = () => {
  // 如果没有配置邮件，使用 Ethereal 邮件（测试用）
  if (!process.env.SMTP_HOST) {
    console.log('📧 未配置SMTP，将使用 Ethereal 邮件服务（仅供测试）');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

let transporter = createTransporter();

// 邮件模板
const emailTemplates = {
  // 欢迎邮件
  welcome: data => ({
    subject: '🎉 欢迎订阅智慧教育平台更新通知！',
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">欢迎订阅智慧教育平台</h1>
        <p>您好，${data.email}！</p>
        <p>感谢您订阅我们的平台更新通知。您将第一时间收到：</p>
        <ul>
          <li>🆕 新课程上线通知</li>
          <li>📚 课程内容更新</li>
          <li>⭐ 明星老师动态</li>
          <li>👑 VIP专属内容</li>
        </ul>
        <p style="color: #666;">如果这不是您本人的操作，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">智慧教育AI平台</p>
      </div>
    `,
  }),

  // 验证码邮件
  verify: data => ({
    subject: '📧 验证您的订阅邮箱',
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">验证邮箱</h1>
        <p>您好！</p>
        <p>您的邮箱验证验证码是：</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #4F46E5; border-radius: 8px; margin: 20px 0;">
          ${data.code}
        </div>
        <p>验证码 <strong>5 分钟</strong>内有效，请尽快完成验证。</p>
        <p style="color: #666;">如果这不是您本人的操作，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">智慧教育AI平台</p>
      </div>
    `,
  }),

  // 新课程通知
  newCourse: data => ({
    subject: `🆕 新课程上线：《${data.courseName}》`,
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">新课程上线 🚀</h1>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0;">《${data.courseName}》</h2>
          <p style="margin: 0;">${data.courseDescription || '新课程已上线，欢迎学习！'}</p>
        </div>
        <div style="padding: 15px; background: #F9FAFB; border-radius: 8px; margin: 15px 0;">
          <p><strong>👨‍🏫 授课老师：</strong>${data.teacherName}</p>
          <p><strong>📚 课程分类：</strong>${data.category}</p>
          <p><strong>⏱️ 课程时长：</strong>${data.duration}</p>
          ${data.isVip ? '<p style="color: #E5A50A;">👑 VIP会员免费学习</p>' : ''}
        </div>
        <a href="${data.courseUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 0;">
          立即学习 →
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          <a href="${data.unsubscribeUrl}" style="color: #999;">取消订阅</a> | 
          智慧教育AI平台
        </p>
      </div>
    `,
  }),

  // 课程更新通知
  courseUpdate: data => ({
    subject: `📚 课程更新：《${data.courseName}》有新内容！`,
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">课程更新 📚</h1>
        <div style="background: #ECFDF5; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #059669;">
          <h2 style="margin: 0 0 10px 0; color: #059669;">《${data.courseName}》</h2>
          <p style="margin: 0; color: #666;">${data.updateDescription}</p>
        </div>
        <div style="padding: 15px; background: #F9FAFB; border-radius: 8px;">
          <p><strong>📅 更新内容：</strong></p>
          <ul>
            ${(data.updateItems || []).map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <a href="${data.courseUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          继续学习 →
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          <a href="${data.unsubscribeUrl}" style="color: #999;">取消订阅</a> | 
          智慧教育AI平台
        </p>
      </div>
    `,
  }),

  // 明星老师动态
  teacherNews: data => ({
    subject: `⭐ 明星老师动态：${data.teacherName}`,
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #D97706;">明星老师动态 ⭐</h1>
        <div style="display: flex; align-items: center; margin: 20px 0;">
          <img src="${data.teacherAvatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
          <div style="margin-left: 15px;">
            <h2 style="margin: 0; color: #D97706;">${data.teacherName}</h2>
            <p style="margin: 5px 0 0 0; color: #666;">${data.teacherTitle}</p>
          </div>
        </div>
        <div style="background: #FFFBEB; padding: 20px; border-radius: 12px; border-left: 4px solid #D97706;">
          <p>${data.newsContent}</p>
        </div>
        ${
          data.newCourse
            ? `
          <div style="margin: 20px 0; padding: 15px; background: #F9FAFB; border-radius: 8px;">
            <p><strong>🆕 新开课程：</strong>《${data.newCourse}》</p>
          </div>
        `
            : ''
        }
        <a href="${data.teacherUrl}" style="display: inline-block; background: #D97706; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 0;">
          查看老师 →
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          <a href="${data.unsubscribeUrl}" style="color: #999;">取消订阅</a> | 
          智慧教育AI平台
        </p>
      </div>
    `,
  }),

  // VIP专属内容
  vipNews: data => ({
    subject: `👑 VIP专属：${data.title}`,
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">👑 VIP专属内容</h1>
        </div>
        <h2 style="color: #4F46E5;">${data.title}</h2>
        <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p>${data.content}</p>
        </div>
        ${
          data.vipGift
            ? `
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0;"><strong>🎁 VIP专属福利：</strong>${data.vipGift}</p>
          </div>
        `
            : ''
        }
        <a href="${data.contentUrl}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 0;">
          立即查看 →
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          <a href="${data.unsubscribeUrl}" style="color: #999;">取消订阅</a> | 
          智慧教育AI平台
        </p>
      </div>
    `,
  }),

  // 系统通知
  systemNotice: data => ({
    subject: `📢 系统通知：${data.title}`,
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">📢 系统通知</h1>
        <div style="background: #EEF2FF; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #4F46E5;">${data.title}</h2>
          <p style="margin: 0; color: #4B5563;">${data.content}</p>
        </div>
        ${
          data.actionText && data.actionUrl
            ? `
          <a href="${data.actionUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 0;">
            ${data.actionText} →
          </a>
        `
            : ''
        }
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          <a href="${data.unsubscribeUrl}" style="color: #999;">取消订阅</a> | 
          智慧教育AI平台
        </p>
      </div>
    `,
  }),
};

// 生成取消订阅 token
const generateUnsubscribeToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 发送邮件
export const sendEmail = async (to, template, data) => {
  const templateFn = emailTemplates[template];
  if (!templateFn) {
    throw new Error('未知的邮件模板: ' + template);
  }

  const emailContent = templateFn(data);

  // 如果没有配置邮件传输器，使用 Ethereal
  if (!transporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: '"智慧教育平台" <noreply@ai-learnhub.com>',
        to,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      console.log('📧 测试邮件已发送:', nodemailer.getTestMessageUrl(info));
      return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (error) {
      console.error('📧 邮件发送失败:', error);
      return { success: false, error: error.message };
    }
  }

  try {
    const info = await transporter.sendMail({
      from: `"智慧教育平台" <${process.env.SMTP_FROM}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 邮件发送失败:', error);
    return { success: false, error: error.message };
  }
};

// 批量发送邮件
export const sendBulkEmail = async (subscribers, template, data) => {
  const results = [];
  for (const subscriber of subscribers) {
    try {
      const unsubscribeToken = subscriber.unsubscribeToken || generateUnsubscribeToken();
      const result = await sendEmail(subscriber.email, template, {
        ...data,
        unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?token=${unsubscribeToken}`,
      });
      results.push({ email: subscriber.email, ...result });

      // 添加延迟避免频率限制
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.push({ email: subscriber.email, success: false, error: error.message });
    }
  }
  return results;
};

// 发送验证邮件
export const sendVerificationEmail = async email => {
  const code = Math.random().toString().slice(2, 8);
  const verifyExpire = new Date(Date.now() + 5 * 60 * 1000); // 5分钟

  // 查找或创建订阅记录
  let subscription = await Subscription.findOne({ email });
  if (subscription) {
    subscription.verifyCode = code;
    subscription.verifyExpire = verifyExpire;
  } else {
    subscription = await Subscription.create({
      email,
      verifyCode: code,
      verifyExpire: verifyExpire,
      unsubscribeToken: generateUnsubscribeToken(),
    });
  }
  await subscription.save();

  // 发送验证邮件
  return sendEmail(email, 'verify', { code });
};

// 验证邮箱
export const verifyEmail = async (email, code) => {
  const subscription = await Subscription.findOne({ email, verifyCode: code });
  if (!subscription) {
    return { success: false, message: '验证码无效' };
  }

  if (new Date() > subscription.verifyExpire) {
    return { success: false, message: '验证码已过期' };
  }

  subscription.isVerified = true;
  subscription.verifyCode = null;
  subscription.verifyExpire = null;
  await subscription.save();

  return { success: true, message: '邮箱验证成功' };
};

export default {
  sendEmail,
  sendBulkEmail,
  sendVerificationEmail,
  verifyEmail,
};
