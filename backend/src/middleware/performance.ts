/**
 * 性能优化中间件
 * 实现响应压缩、缓存头、性能监控
 */

import { Request, Response, NextFunction } from 'express';
// @ts-expect-error - compression类型定义可能缺失
import compression from 'compression';

// 响应时间监控
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const path = req.path;
    
    // 记录慢请求（超过1秒）
    if (duration > 1000) {
      console.warn(`[性能警告] 慢请求: ${req.method} ${path} - ${duration}ms`);
    }
    
    // 设置响应时间头
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
}

// 压缩中间件配置
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // 只压缩文本类型的响应
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // 压缩级别（1-9，6是平衡点）
  threshold: 1024, // 只压缩大于1KB的响应
});

// 缓存头中间件
export function cacheHeaders(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;
  
  // 静态资源缓存（1年）
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  // API响应缓存（根据路径决定）
  else if (path.startsWith('/api/')) {
    // 只读API可以缓存短时间
    if (req.method === 'GET' && (
      path.includes('/courses') ||
      path.includes('/statistics') ||
      path.includes('/recommendations')
    )) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5分钟
    } else {
      // 其他API不缓存
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
  
  next();
}

// ETag支持（用于304 Not Modified）
export function etagMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Express默认支持ETag，这里可以自定义逻辑
  next();
}

