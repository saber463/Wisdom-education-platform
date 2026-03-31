/**
 * 性能优化中间件
 * 实现响应压缩、缓存头、性能监控
 */

import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import compression from 'compression';

// 慢请求阈值（毫秒），可通过环境变量 SLOW_REQUEST_MS 调整，默认 1000
const SLOW_REQUEST_MS = parseInt(process.env.SLOW_REQUEST_MS || '1000', 10);

// 响应时间监控
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const path = req.path;
    
    if (duration > SLOW_REQUEST_MS) {
      console.warn(`[性能警告] 慢请求: ${req.method} ${path} - ${duration}ms (阈值: ${SLOW_REQUEST_MS}ms)`);
    }
    
    // res.setHeader('X-Response-Time', `${duration}ms`); // Cannot set headers after finish
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
  threshold: 512, // 只压缩大于512B的响应（降低阈值可略减小 JSON 体积）
});

// 缓存头中间件
export function cacheHeaders(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;
  
  // 静态资源缓存（1年）
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  // API响应缓存（根据路径决定，仅用于公开只读数据）
  else if (path.startsWith('/api/')) {
    const readOnlyCachePaths = [
      '/courses',
      '/statistics',
      '/recommendations',
      '/branches'  // 课程分支列表（公开结构）
    ];
    const isCacheableGet = req.method === 'GET' && readOnlyCachePaths.some(p => path.includes(p));
    if (isCacheableGet) {
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

