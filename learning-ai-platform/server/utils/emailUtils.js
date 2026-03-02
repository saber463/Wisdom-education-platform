const nodemailer = require('nodemailer');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  // 默认使用SMTP传输，这里使用一个简单的配置
  host: 'smtp.example.com', // 你的SMTP服务器地址
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'your-email@example.com', // 你的邮箱
    pass: 'your-email-password', // 你的邮箱密码
  },
});

/**
 * 发送密码重置邮件
 * @param {string} to - 收件人邮箱
 * @param {string} token - 密码重置令牌
 * @returns {Promise<boolean>} 是否发送成功
 */
const sendPasswordResetEmail = async (to, token) => {
  try {
    // 密码重置链接
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    // 邮件选项
    const mailOptions = {
      from: '"学习平台" <no-reply@learning-platform.com>',
      to,
      subject: '重置您的密码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">密码重置请求</h2>
          <p>您好，</p>
          <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
          <p style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">重置密码</a>
          </p>
          <p>如果您没有请求重置密码，请忽略此邮件。</p>
          <p>此链接将在1小时后过期。</p>
          <p>谢谢，<br>学习平台团队</p>
        </div>
      `,
    };

    // 发送邮件
    await transporter.sendMail(mailOptions);
    console.log(`密码重置邮件已发送到: ${to}`);
    return true;
  } catch (error) {
    console.error('发送密码重置邮件失败:', error);
    throw new Error('发送邮件失败，请稍后重试');
  }
};

module.exports = {
  sendPasswordResetEmail,
};
