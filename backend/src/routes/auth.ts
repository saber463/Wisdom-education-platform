/**
 * 认证路由模块
 * 实现用户登录、JWT令牌生成和验证
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { executeQuery } from '../config/database.js';
import { memoryCache } from '../config/memory-cache.js';
import { strictRateLimit } from '../middleware/rate-limit.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'edu-platform-secret-key-2024';
const JWT_EXPIRES_IN = '24h'; // 24小时有效期

interface User {
  id: number;
  username: string;
  password_hash: string;
  real_name: string;
  role: 'teacher' | 'student' | 'parent';
  email: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'banned';
}

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  real_name: string;
  role: 'teacher' | 'student' | 'parent';
  email: string;
}

/**
 * POST /api/auth/register
 * 用户注册接口
 * 
 * 请求体：
 * {
 *   "username": "用户名",
 *   "password": "密码",
 *   "real_name": "真实姓名",
 *   "role": "角色",
 *   "email": "邮箱"
 * }
 * 
 * 响应：
 * {
 *   "success": true,
 *   "message": "注册成功",
 *   "user": {
 *     "id": 用户ID,
 *     "username": "用户名",
 *     "realName": "真实姓名",
 *     "role": "角色",
 *     "email": "邮箱"
 *   }
 * }
 */
router.post('/register', strictRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, real_name, role, email } = req.body as RegisterRequest;
    
    // 验证输入
    if (!username || !password || !real_name || !role || !email) {
      res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
      return;
    }

    // 检查用户是否已存在
    const existingUsers = await executeQuery<User[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      res.status(409).json({
        success: false,
        message: '用户名已存在'
      });
      return;
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(password, 10);

    // 插入新用户
    const result = await executeQuery<any>(
      `INSERT INTO users (username, password_hash, real_name, role, email, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [username, passwordHash, real_name, role, email]
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      user: {
        id: result.insertId,
        username,
        realName: real_name,
        role,
        email
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录接口
 * 
 * 请求体：
 * {
 *   "username": "用户名",
 *   "password": "密码"
 * }
 * 
 * 响应：
 * {
 *   "success": true,
 *   "token": "JWT令牌",
 *   "user": {
 *     "id": 用户ID,
 *     "username": "用户名",
 *     "realName": "真实姓名",
 *     "role": "角色",
 *     "email": "邮箱",
 *     "phone": "手机号"
 *   }
 * }
 */
router.post('/login', strictRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginRequest;
    
    // 验证输入
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
      return;
    }
    
    // 查询用户
    const users = await executeQuery<User[]>(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    
    if (!users || users.length === 0) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }
    
    const user = users[0];
    
    // 检查用户状态
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: '账号已被禁用或停用'
      });
      return;
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // 返回成功响应
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/auth/refresh
 * 刷新JWT令牌
 * 
 * 请求头：
 * Authorization: Bearer <token>
 * 
 * 响应：
 * {
 *   "success": true,
 *   "token": "新的JWT令牌"
 * }
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
      return;
    }
    
    // 验证旧令牌（忽略过期）
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as any;
    
    // 生成新令牌
    const newToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      token: newToken
    });
    
  } catch (error) {
    console.error('令牌刷新失败:', error);
    res.status(403).json({
      success: false,
      message: '令牌无效'
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出（客户端需要删除令牌）
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

/** GET /api/auth/me 缓存 TTL（秒） */
const AUTH_ME_CACHE_TTL = 60;

/**
 * GET /api/auth/me
 * 获取当前登录用户完整信息（需认证）；短期缓存减少数据库压力
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, message: '未提供认证令牌' });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
    const cacheKey = `auth:me:${decoded.id}`;
    const cached = memoryCache.get(cacheKey);
    if (cached != null) {
      res.json(cached);
      return;
    }
    const users = await executeQuery<User[]>(
      'SELECT id, username, real_name, role, email, phone, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );
    if (!users || users.length === 0) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }
    const u = users[0] as User & { created_at: Date; updated_at: Date };
    const payload = {
      id: u.id,
      username: u.username,
      realName: u.real_name,
      role: u.role,
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      status: u.status,
      createdAt: u.created_at,
      updatedAt: u.updated_at
    };
    memoryCache.set(cacheKey, payload, AUTH_ME_CACHE_TTL);
    res.json(payload);
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: '令牌已过期' });
      return;
    }
    res.status(403).json({ success: false, message: '令牌无效' });
  }
});

/**
 * GET /api/auth/verify
 * 验证令牌有效性
 */
router.get('/verify', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    res.json({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      }
    });
    
  } catch (error) {
    res.status(403).json({
      success: false,
      message: '令牌无效或已过期'
    });
  }
});

export default router;
