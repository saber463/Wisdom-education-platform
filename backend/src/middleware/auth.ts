/**
 * 认证和权限控制中间件
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edu-platform-secret-key-2024';

export type UserRole = 'teacher' | 'student' | 'parent' | 'admin';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
}

/**
 * JWT认证中间件
 * 验证请求中的JWT令牌
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ 
      success: false,
      message: '未提供认证令牌' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false,
      message: '令牌无效或已过期' 
    });
  }
}

/**
 * 角色验证中间件
 * 验证用户是否具有指定角色
 * 
 * @param roles 允许的角色列表
 * @returns Express中间件函数
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: '未认证' 
      });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      // 记录未授权访问日志
      try {
        await executeQuery(
          `INSERT INTO system_logs (log_type, service, message) 
           VALUES (?, ?, ?)`,
          [
            'warning',
            'auth',
            `未授权访问: 用户${req.user.username}(${req.user.role})尝试访问需要${roles.join('/')}权限的资源`
          ]
        );
      } catch (error) {
        console.error('记录访问日志失败:', error);
      }
      
      res.status(403).json({ 
        success: false,
        message: '权限不足' 
      });
      return;
    }
    
    next();
  };
}

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
  } catch (error) {
    // 令牌无效，但不阻止请求
    console.warn('可选认证：令牌无效');
  }
  
  next();
}

/**
 * authMiddleware 别名，用于兼容
 */
export const authMiddleware = authenticateToken;
