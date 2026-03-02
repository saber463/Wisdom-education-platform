// IP限制中间件，用于防止恶意注册

// 存储IP地址和注册时间的对象
const registrationAttempts = {};

// 配置参数
const RATE_LIMIT = {
  MAX_ATTEMPTS: 20, // 增加允许的尝试次数，方便测试
  WINDOW_MS: 60 * 1000, // 时间窗口（毫秒）
};

/**
 * IP注册限制中间件
 */
const rateLimitMiddleware = (req, res, next) => {
  try {
    // 获取客户端IP地址
    const clientIp =
      req.ip ||
      req.socket.remoteAddress ||
      (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0]) ||
      'unknown';

    // 当前时间
    const now = Date.now();

    // 如果IP不存在，初始化
    if (!registrationAttempts[clientIp]) {
      registrationAttempts[clientIp] = {
        count: 0,
        attempts: [],
      };
    }

    // 清理过期的尝试记录
    registrationAttempts[clientIp].attempts = registrationAttempts[clientIp].attempts.filter(
      timestamp => now - timestamp < RATE_LIMIT.WINDOW_MS
    );

    // 更新尝试计数
    registrationAttempts[clientIp].count = registrationAttempts[clientIp].attempts.length;

    // 检查是否超过限制
    if (registrationAttempts[clientIp].count >= RATE_LIMIT.MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: `注册请求过于频繁，请${Math.ceil((registrationAttempts[clientIp].attempts[0] + RATE_LIMIT.WINDOW_MS - now) / 1000)}秒后再试`,
      });
    }

    // 记录这次尝试
    registrationAttempts[clientIp].attempts.push(now);

    // 继续处理请求
    next();
  } catch (error) {
    console.error('IP限制中间件错误:', error);
    // 如果中间件出错，允许请求继续处理
    next();
  }
};

/**
 * 清理过期的IP记录
 */
const cleanupExpiredRecords = () => {
  const now = Date.now();

  for (const ip in registrationAttempts) {
    registrationAttempts[ip].attempts = registrationAttempts[ip].attempts.filter(
      timestamp => now - timestamp < RATE_LIMIT.WINDOW_MS
    );

    registrationAttempts[ip].count = registrationAttempts[ip].attempts.length;

    // 如果没有尝试记录，删除该IP
    if (registrationAttempts[ip].count === 0) {
      delete registrationAttempts[ip];
    }
  }
};

// 每5分钟清理一次过期记录
setInterval(cleanupExpiredRecords, 5 * 60 * 1000);

export default rateLimitMiddleware;
