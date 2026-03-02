/**
 * API速率限制中间件
 * 实现API速率限制，防止滥用
 * Requirements: 安全要求
 * Task: 21
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// 清理过期记录
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // 每分钟清理一次

/**
 * 速率限制中间件
 * @param maxRequests 最大请求数
 * @param windowMs 时间窗口（毫秒）
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getRateLimitKey(req as AuthRequest);
    const now = Date.now();

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      next();
      return;
    }

    if (now > store[key].resetTime) {
      // 重置窗口
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      next();
      return;
    }

    if (store[key].count >= maxRequests) {
      res.status(429).json({
        code: 429,
        msg: '请求过于频繁，请稍后再试',
        data: null
      });
      return;
    }

    store[key].count++;
    next();
  };
}

/**
 * 获取速率限制键
 */
function getRateLimitKey(req: AuthRequest): string {
  // 优先使用用户ID
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // 否则使用IP地址
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * 严格速率限制（用于敏感操作）
 */
export const strictRateLimit = rateLimit(10, 60000); // 每分钟10次

/**
 * 中等速率限制（用于一般操作）
 */
export const mediumRateLimit = rateLimit(100, 60000); // 每分钟100次

/**
 * 宽松速率限制（用于公开接口）
 */
export const looseRateLimit = rateLimit(1000, 60000); // 每分钟1000次

