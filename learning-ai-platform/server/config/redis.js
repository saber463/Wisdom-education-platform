import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

// Redis连接配置
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: retries => {
      // 如果已明确连接失败并降级，则不再重连
      if (!redisConnected && connectionAttempts > 0) {
        return false;
      }
      if (retries > 3) {
        console.warn('⚠️ Redis重连达到上限，将使用内存缓存模式运行');
        return false; // 返回 false 停止重连
      }
      const delay = Math.min(retries * 100, 3000);
      return delay;
    },
    connectTimeout: 5000, // 5秒连接超时
    lazyConnect: true, // 延迟连接，在显式调用 connect 时连接
  },
  legacyMode: true, // 启用旧版模式以兼容connect-redis
  password: process.env.REDIS_PASSWORD || undefined, // Redis密码
  database: parseInt(process.env.REDIS_DB || '0'), // Redis数据库编号
};

// Redis连接状态
let redisConnected = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 3;
let connectionPromise = null;

// 创建Redis客户端
let redisClient = createClient(redisConfig);

// 为了避免控制台被无限重试的错误刷屏，我们给 error 事件绑定一个空处理
redisClient.on('error', () => {});

// 连接Redis服务器
const connectRedis = async () => {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      console.log('🔄 正在尝试连接 Redis...');
      // 捕获连接错误
      await redisClient.connect();
      console.log('✅ Redis 连接成功');
      redisConnected = true;
      connectionAttempts = 0;
      return true;
    } catch (err) {
      console.log(`⚠️ Redis 连接失败，已自动切换为内存缓存模式`);
      redisConnected = false;
      // 在这里强制断开并销毁客户端，避免内部重连机制不断报错
      try {
        await redisClient.quit();
      } catch(e) {
        try {
           redisClient.disconnect();
        } catch(e2) {}
      }
      // 将 redisClient 指向一个虚拟对象，防止后续代码调用出错
      redisClient = {
         get: async () => null,
         setEx: async () => null,
         keys: async () => [],
         del: async () => null,
         on: () => {},
         quit: async () => null,
         disconnect: async () => null
      };
      return false; // 不再递归重连，直接返回 false
    }
  })();

  return connectionPromise;
};

// 初始化连接（不等待，避免阻塞应用启动）
connectRedis().catch(() => {
  console.log('ℹ️  Redis 连接初始化完成（使用内存缓存模式）');
});

// 内存缓存实现（带LRU淘汰策略）
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // LRU：重新插入到末尾
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.data;
  }

  set(key, value, ttl) {
    // 如果缓存已满，删除最早的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  clearPattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }
}

const memoryCache = new LRUCache(1000);

// 缓存配置
const cacheConfig = {
  ttl: 3600, // 默认缓存时间（秒）
  max: 1000, // 最大缓存条目数
  redisClient: redisClient,
  store: new RedisStore({ client: redisClient }),
};

// 缓存中间件函数
const cacheMiddleware = (duration = cacheConfig.ttl) => {
  return async (req, res, next) => {
    // 只有GET请求才缓存
    if (req.method !== 'GET') {
      return next();
    }

    const key = '__express__' + req.originalUrl || req.url;

    // 如果Redis连接成功，使用Redis缓存
    if (redisConnected) {
      try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
          res.send(JSON.parse(cachedData));
          return;
        }
      } catch (err) {
        console.error('Redis缓存读取失败:', err.message);
        redisConnected = false;
      }
    }

    // 使用内存缓存或降级处理
    handleMemoryCache(key, duration, req, res, next);
  };
};

// 处理内存缓存
const handleMemoryCache = (key, duration, req, res, next) => {
  const cachedItem = memoryCache.get(key);
  if (cachedItem) {
    res.send(cachedItem);
    return;
  }

  res.sendResponse = res.send;
  res.send = async body => {
    if (res.statusCode === 200) {
      memoryCache.set(key, JSON.parse(body), duration);

      if (redisConnected) {
        try {
          await redisClient.setEx(key, duration, JSON.stringify(body));
        } catch (err) {
          console.error('Redis缓存写入失败:', err.message);
          redisConnected = false;
        }
      }
    }
    res.sendResponse(body);
  };
  next();
};

// 清除缓存的工具函数
const clearCache = async pattern => {
  if (redisConnected) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`✅ 成功清除 ${keys.length} 个Redis缓存条目`);
      }
    } catch (err) {
      console.error('清除Redis缓存失败:', err.message);
      redisConnected = false;
      const count = memoryCache.clearPattern(pattern);
      console.log(`✅ 成功清除 ${count} 个内存缓存条目（降级）`);
    }
  } else {
    const count = memoryCache.clearPattern(pattern);
    console.log(`✅ 成功清除 ${count} 个内存缓存条目`);
  }
};

// 健康检查函数
const healthCheck = () => {
  return {
    redis: redisConnected ? 'connected' : 'disconnected',
    memoryCache: {
      size: memoryCache.size(),
      maxSize: cacheConfig.max,
    },
  };
};

// 手动重连函数
const reconnect = () => {
  console.log('🔄 手动触发Redis重连...');
  connectionAttempts = 0;
  return connectRedis();
};

export const clearCacheByPattern = clearCache;

export default {
  redisClient,
  cacheConfig,
  cacheMiddleware,
  clearCache,
  sessionStore: cacheConfig.store,
  redisConnected,
  healthCheck,
  reconnect,
  memoryCache,
};
