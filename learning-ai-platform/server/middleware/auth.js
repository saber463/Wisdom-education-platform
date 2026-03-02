import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import 'dotenv/config';

// 简单的内存缓存，用于缓存已验证的用户（有效期30秒）
const userCache = new Map();

/**
 * JWT认证中间件
 * 支持Bearer Token认证和开发环境测试Token
 */
const auth = async (req, res, next) => {
  try {
    // 从请求头获取Bearer令牌
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 开发环境：支持测试token（仅开发环境）
    if (!token && process.env.NODE_ENV === 'development') {
      const testToken = req.headers['x-test-token'];
      if (testToken) {
        token = testToken;
      }
    }

    // 检查token是否存在
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌，请先登录',
      });
    }

    // 验证JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: '无效的认证令牌',
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '登录已过期，请重新登录',
        });
      }

      return res.status(401).json({
        success: false,
        message: '令牌验证失败',
      });
    }

    // 检查缓存
    const cacheKey = `user_${decoded.id}_${token.substring(0, 20)}`;
    let cachedUser = userCache.get(cacheKey);

    if (cachedUser) {
      // 验证缓存是否过期（30秒）
      if (Date.now() - cachedUser.cacheTime < 30000) {
        req.user = cachedUser.user;
        return next();
      } else {
        userCache.delete(cacheKey);
      }
    }

    // 查询用户
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被删除',
      });
    }

    // 检查用户状态
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: '您的账号已被禁用，请联系管理员',
      });
    }

    // 缓存用户信息
    userCache.set(cacheKey, {
      user,
      cacheTime: Date.now(),
    });

    // 限制缓存数量
    if (userCache.size > 1000) {
      // 清除最旧的10个缓存
      const entries = Array.from(userCache.entries());
      entries.slice(0, 10).forEach(([key]) => userCache.delete(key));
    }

    // 将用户信息添加到请求对象
    req.user = user;

    next();
  } catch (error) {
    console.error('认证中间件错误:', error.message);

    return res.status(500).json({
      success: false,
      message: '服务器错误，认证失败',
    });
  }
};

/**
 * 可选认证中间件
 * 用户未登录时不会返回错误，但会设置req.user（如果已登录）
 */
const optionalAuth = async (req, res, next) => {
  try {
    // 从请求头获取Bearer令牌
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 开发环境：支持测试token
    if (!token && process.env.NODE_ENV === 'development') {
      const testToken = req.headers['x-test-token'];
      if (testToken) {
        token = testToken;
      }
    }

    // 如果没有token，跳过认证
    if (!token) {
      req.user = null;
      return next();
    }

    // 验证JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      req.user = null;
      return next();
    }

    // 查询用户
    const user = await User.findById(decoded.id).select('-password');

    if (user && !user.isBanned) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error.message);
    req.user = null;
    next();
  }
};

/**
 * 角色检查中间件工厂
 * @param {string[]} allowedRoles - 允许的角色数组
 */
const checkRole = allowedRoles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '您没有权限执行此操作',
      });
    }

    next();
  };
};

/**
 * 清除用户缓存
 * @param {string} userId - 用户ID
 * @param {string} token - 用户token
 */
const clearUserCache = (userId, token) => {
  const prefix = `user_${userId}_`;
  for (const key of userCache.keys()) {
    if (key.startsWith(prefix) || (token && key.includes(token.substring(0, 20)))) {
      userCache.delete(key);
    }
  }
};

// 定时清理过期缓存（每5分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.cacheTime > 60000) {
      // 超过1分钟的缓存都清除
      userCache.delete(key);
    }
  }
}, 300000);

// 导出中间件
export { auth, optionalAuth, checkRole, clearUserCache };

// 保持向后兼容
export const protect = auth;
