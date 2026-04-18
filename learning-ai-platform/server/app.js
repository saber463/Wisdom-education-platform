import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { auditLog } from './middleware/auditLog.js';
import compression from 'compression';
import { getCsrfToken } from './middleware/csrf.js';
import rateLimitMiddleware from './middleware/rateLimit.js';
import cleanParams from './middleware/cleanParams.js';
import redisCache from './config/redis.js';
import errorHandler from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config();

// 创建 Express 实例（关键！之前可能漏了或错了）
const app = express();

// 速率限制中间件，防止暴力攻击
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求（临时提高限制）
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试',
});

// 全局中间件（跨域+解析请求体+安全防护）
app.use(cookieParser());
// 更新CORS配置，使其更加严格
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // 限制允许的来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 限制允许的HTTP方法
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // 限制允许的请求头
    credentials: true, // 允许发送凭证
    maxAge: 86400, // 预检请求的缓存时间（秒）
    preflightContinue: false, // 直接响应预检请求
    optionsSuccessStatus: 204, // OPTIONS请求的成功状态码
  })
);

// 配置静态资源目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 启用Gzip压缩
app.use(
  compression({
    level: 6, // 压缩级别（0-9），6是默认值，平衡压缩率和性能
    threshold: 1024, // 仅压缩大于1KB的响应
    filter: (req, res) => {
      // 对特定MIME类型不进行压缩
      const contentType = res.getHeader('Content-Type');
      return !contentType || !contentType.includes('image/');
    },
  })
);

// 审计日志中间件（记录所有API请求）
app.use('/api', auditLog);

// 安全头部设置（详细配置增强安全性）
app.use(
  helmet({
    // 防止点击劫持攻击
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },

    // 防止DNS预取攻击
    dnsPrefetchControl: { allow: false },

    // 防止MIME类型嗅探
    noSniff: true,

    // 防止iframe嵌入攻击
    frameguard: { action: 'deny' },

    // 隐藏X-Powered-By头部
    hidePoweredBy: true,

    // 严格传输安全策略（HSTS）
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true,
    },

    // 内容安全策略（CSP）
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'http://localhost:4000',
          'http://localhost:3000',
          'http://localhost:4001',
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // 参考策略
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // 期望证书透明度
    expectCt: {
      enforce: true,
      maxAge: 86400, // 1天
    },

    // 清除站点数据（可选）
    clearSiteData: {
      directives: {
        cache: true,
        cookies: true,
        storage: true,
        executionContexts: true,
      },
    },
  })
);

// 防止NoSQL注入攻击
app.use(mongoSanitize());

// 防止XSS攻击
app.use(xss());

// 速率限制
app.use('/api', limiter);

// 添加请求大小限制，防止DoS攻击
app.use(express.json({ limit: '5mb' })); // 限制JSON请求体大小
app.use(express.urlencoded({ extended: false, limit: '5mb' })); // 限制URL编码请求体大小

// 添加防暴力攻击中间件
app.use('/api/auth/register', rateLimitMiddleware); // 对注册接口进行IP限制

// 添加请求参数清理中间件
app.use(cleanParams);

// 添加安全响应头中间件
app.use((req, res, next) => {
  // 添加X-Content-Type-Options头部
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 添加X-Frame-Options头部
  res.setHeader('X-Frame-Options', 'DENY');

  // 添加X-XSS-Protection头部
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 添加Strict-Transport-Security头部（如果使用HTTPS）
  if (req.secure || process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 添加Referrer-Policy头部
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// 添加Redis缓存配置

// 在路由挂载之前添加全局缓存中间件
// 注意：这个中间件会缓存所有GET请求的响应
// 对于不需要缓存的路由，可以在路由处理函数中使用redisCache.noCache()中间件
// app.use('/api', redisCache.cacheMiddleware(60 * 60)); // 默认缓存1小时

// 健康检查路由（不需要API前缀）
app.get('/health', (req, res) => {
  const redisHealth = redisCache.healthCheck();
  res.status(200).json({
    success: true,
    message: 'API服务正常运行',
    timestamp: new Date().toISOString(),
    cache: redisHealth,
  });
});

app.get('/api/csrf-token', getCsrfToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CSRF Token已生成',
  });
});

// Redis重连路由（仅用于开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/admin/redis/reconnect', (req, res) => {
    redisCache
      .reconnect()
      .then(() => {
        res.status(200).json({
          success: true,
          message: 'Redis重连已触发',
        });
      })
      .catch(err => {
        res.status(500).json({
          success: false,
          message: 'Redis重连失败',
          error: err.message,
        });
      });
  });
}

// 挂载路由
app.use('/api', routes);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ success: false, code: 404, message: `接口 ${req.originalUrl} 不存在` });
});

// 使用错误处理中间件
app.use(errorHandler);

// 导出 app 实例
export default app;
