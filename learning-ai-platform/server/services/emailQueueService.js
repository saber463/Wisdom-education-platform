import { pushToQueue, popFromQueue, getQueueLength } from './redisService.js';
import { sendEmail } from './emailService.js';

const EMAIL_QUEUE_NAME = 'email:queue';
const WORKER_INTERVAL = 3000; // 3秒处理一封邮件
const MAX_RETRIES = 3;

// 邮件任务处理器
const processEmailJob = async job => {
  const { to, subject, template, data, retries = 0 } = job;

  try {
    console.log(`📧 正在发送邮件到: ${to}`);
    await sendEmail({ to, subject, template, data });
    console.log(`✅ 邮件发送成功: ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ 邮件发送失败: ${to}`, err.message);

    // 重试逻辑
    if (retries < MAX_RETRIES) {
      console.log(`🔄 将在 5 秒后重试 (${retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 重新放回队列
      await pushToQueue(EMAIL_QUEUE_NAME, {
        ...job,
        retries: retries + 1,
      });
    } else {
      console.error(`🚫 邮件发送最终失败: ${to}，已放弃`);
    }
    return false;
  }
};

// 邮件队列工作器
let isWorkerRunning = false;
let workerInterval = null;

/**
 * 启动邮件队列工作器
 */
export const startEmailWorker = () => {
  if (isWorkerRunning) {
    console.log('📧 邮件队列工作器已在运行');
    return;
  }

  isWorkerRunning = true;
  console.log('📧 邮件队列工作器已启动');

  const processQueue = async () => {
    while (true) {
      try {
        const job = await popFromQueue(EMAIL_QUEUE_NAME, 2);
        if (job) {
          await processEmailJob(job);
        }
      } catch (err) {
        console.error('❌ 处理邮件队列时出错:', err.message);
      }
    }
  };

  // 启动处理循环
  processQueue();
};

/**
 * 停止邮件队列工作器
 */
export const stopEmailWorker = () => {
  isWorkerRunning = false;
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
  console.log('📧 邮件队列工作器已停止');
};

/**
 * 获取队列中的邮件数量
 */
export const getPendingEmailCount = async () => {
  return await getQueueLength(EMAIL_QUEUE_NAME);
};

/**
 * 添加邮件到发送队列（非阻塞）
 * @param {string} to - 收件人
 * @param {string} subject - 主题
 * @param {string} template - 模板名
 * @param {object} data - 模板数据
 */
export const queueEmail = async (to, subject, template, data) => {
  const job = { to, subject, template, data, retries: 0 };
  const success = await pushToQueue(EMAIL_QUEUE_NAME, job);

  if (success) {
    console.log(`📬 邮件已加入队列: ${to}`);
  } else {
    console.error(`❌ 邮件入队失败: ${to}`);
  }

  return success;
};

// 覆盖原有直接发送邮件的方法
export const sendEmailWithQueue = async emailData => {
  // 如果配置了 REDIS_EMAIL_ENABLED=true，则使用队列
  if (process.env.REDIS_EMAIL_ENABLED === 'true') {
    return await queueEmail(emailData.to, emailData.subject, emailData.template, emailData.data);
  }

  // 否则直接发送
  return await sendEmail(emailData);
};

export default {
  startEmailWorker,
  stopEmailWorker,
  getPendingEmailCount,
  queueEmail,
  sendEmailWithQueue,
};
