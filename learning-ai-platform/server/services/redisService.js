import redis from 'redis';

// Redis 客户端
const createRedisClient = () => {
  const client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', err => {
    console.error('❌ Redis 连接错误:', err.message);
  });

  client.on('connect', () => {
    console.log('✅ Redis 已连接');
  });

  client.on('ready', () => {
    console.log('✅ Redis 就绪');
  });

  return client;
};

let redisClient = null;
let isConnected = false;

// 获取或创建 Redis 客户端
export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }

  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (err) {
      console.error('❌ Redis 连接失败:', err.message);
      isConnected = false;
      return null;
    }
  }

  return redisClient;
};

// 断开 Redis 连接
export const disconnectRedis = async () => {
  if (redisClient && isConnected) {
    await redisClient.quit();
    isConnected = false;
    redisClient = null;
    console.log('Redis 连接已关闭');
  }
};

// ============ 缓存工具函数 ============

/**
 * 设置缓存（带过期时间）
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值（会自动 JSON 序列化）
 * @param {number} expireSeconds - 过期时间（秒），默认 300（5分钟）
 */
export const setCache = async (key, value, expireSeconds = 300) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const serialized = JSON.stringify(value);
    await client.setEx(key, expireSeconds, serialized);
    return true;
  } catch (err) {
    console.error('❌ setCache 错误:', err.message);
    return false;
  }
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {any} 缓存值（自动反序列化），不存在返回 null
 */
export const getCache = async key => {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const value = await client.get(key);
    if (!value) return null;

    return JSON.parse(value);
  } catch (err) {
    console.error('❌ getCache 错误:', err.message);
    return null;
  }
};

/**
 * 删除缓存
 * @param {string} key - 缓存键
 */
export const deleteCache = async key => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (err) {
    console.error('❌ deleteCache 错误:', err.message);
    return false;
  }
};

/**
 * 清除所有匹配模式的缓存
 * @param {string} pattern - 匹配模式，如 'course:*'
 */
export const deleteCachePattern = async pattern => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (err) {
    console.error('❌ deleteCachePattern 错误:', err.message);
    return false;
  }
};

// ============ 队列工具函数 ============

/**
 * 添加到队列
 * @param {string} queueName - 队列名
 * @param {any} data - 数据
 */
export const pushToQueue = async (queueName, data) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const serialized = JSON.stringify(data);
    await client.lPush(queueName, serialized);
    return true;
  } catch (err) {
    console.error('❌ pushToQueue 错误:', err.message);
    return false;
  }
};

/**
 * 从队列取出（阻塞）
 * @param {string} queueName - 队列名
 * @param {number} timeout - 阻塞超时（秒）
 */
export const popFromQueue = async (queueName, timeout = 5) => {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const result = await client.brPop(queueName, timeout);
    if (!result) return null;

    return JSON.parse(result.element);
  } catch (err) {
    console.error('❌ popFromQueue 错误:', err.message);
    return null;
  }
};

/**
 * 获取队列长度
 * @param {string} queueName - 队列名
 */
export const getQueueLength = async queueName => {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    return await client.lLen(queueName);
  } catch (err) {
    console.error('❌ getQueueLength 错误:', err.message);
    return 0;
  }
};

// ============ 计数器工具函数 ============

/**
 * 增加计数
 * @param {string} key - 键
 * @param {number} increment - 增量，默认 1
 */
export const incrementCounter = async (key, increment = 1) => {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    return await client.incrBy(key, increment);
  } catch (err) {
    console.error('❌ incrementCounter 错误:', err.message);
    return 0;
  }
};

/**
 * 获取计数
 * @param {string} key - 键
 */
export const getCounter = async key => {
  try {
    const client = await getRedisClient();
    if (!client) return 0;

    const value = await client.get(key);
    return parseInt(value) || 0;
  } catch (err) {
    console.error('❌ getCounter 错误:', err.message);
    return 0;
  }
};

/**
 * 设置计数（带过期）
 * @param {string} key - 键
 * @param {number} value - 值
 * @param {number} expireSeconds - 过期时间
 */
export const setCounter = async (key, value, expireSeconds) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    if (expireSeconds) {
      await client.setEx(key, expireSeconds, value.toString());
    } else {
      await client.set(key, value.toString());
    }
    return true;
  } catch (err) {
    console.error('❌ setCounter 错误:', err.message);
    return false;
  }
};

export default {
  getRedisClient,
  disconnectRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  pushToQueue,
  popFromQueue,
  getQueueLength,
  incrementCounter,
  getCounter,
  setCounter,
};
