/**
 * Redis客户端配置模块
 * 用于缓存热门推荐资源
 * 需求：19.6
 */

import { createClient, RedisClientType } from 'redis';
import { memoryCache } from './memory-cache.js';

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;
let useMemoryCache = false;

/**
 * 初始化Redis客户端
 */
export async function initRedisClient(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('Redis连接失败，已重试3次，将在后台继续尝试');
            return false; // 停止重试，但不抛出错误
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.warn('Redis客户端错误:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis客户端已连接');
      isRedisAvailable = true;
    });

    redisClient.on('ready', () => {
      console.log('Redis客户端就绪');
      isRedisAvailable = true;
    });

    redisClient.on('end', () => {
      console.log('Redis连接已关闭');
      isRedisAvailable = false;
    });

    await redisClient.connect();
    console.log('Redis客户端初始化成功');
  } catch (error) {
    console.warn('Redis初始化失败，将使用内存缓存模式:', error);
    isRedisAvailable = false;
    redisClient = null;
    useMemoryCache = true;
    console.log('✓ 已启用内存缓存降级方案');
  }
}

/**
 * 获取Redis客户端
 * @returns Redis客户端实例或null
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * 检查Redis是否可用
 * @returns Redis是否可用
 */
export function isRedisClientAvailable(): boolean {
  return isRedisAvailable && redisClient !== null && redisClient.isOpen;
}

/**
 * 关闭Redis连接
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis连接已关闭');
  }
}

/**
 * 缓存热门推荐资源
 * 需求：19.6
 * 
 * @param key 缓存键
 * @param value 缓存值
 * @param ttl 过期时间（秒），默认24小时
 */
export async function cacheHotResource(
  key: string,
  value: any,
  ttl: number = 86400 // 24小时
): Promise<boolean> {
  // 优先使用Redis
  if (isRedisClientAvailable()) {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient!.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.warn('Redis缓存失败，降级到内存缓存:', error);
    }
  }

  // 降级到内存缓存
  if (useMemoryCache) {
    return memoryCache.set(key, value, ttl);
  }

  return false;
}

/**
 * 获取缓存的热门推荐资源
 * 
 * @param key 缓存键
 * @returns 缓存值或null
 */
export async function getCachedHotResource(key: string): Promise<any | null> {
  // 优先使用Redis
  if (isRedisClientAvailable()) {
    try {
      const cachedValue = await redisClient!.get(key);
      if (cachedValue) {
        return JSON.parse(cachedValue);
      }
    } catch (error) {
      console.warn('Redis获取缓存失败，降级到内存缓存:', error);
    }
  }

  // 降级到内存缓存
  if (useMemoryCache) {
    return memoryCache.get(key);
  }

  return null;
}

/**
 * 删除缓存
 * 
 * @param key 缓存键
 */
export async function deleteCachedResource(key: string): Promise<boolean> {
  let success = false;

  // 尝试从Redis删除
  if (isRedisClientAvailable()) {
    try {
      await redisClient!.del(key);
      success = true;
    } catch (error) {
      console.warn('Redis删除缓存失败:', error);
    }
  }

  // 从内存缓存删除
  if (useMemoryCache) {
    success = memoryCache.delete(key) || success;
  }

  return success;
}

/**
 * 清空所有推荐缓存
 */
export async function clearAllRecommendationCache(): Promise<boolean> {
  let success = false;

  // 尝试从Redis清空
  if (isRedisClientAvailable()) {
    try {
      const keys = await redisClient!.keys('recommendation:*');
      if (keys.length > 0) {
        await redisClient!.del(keys);
      }
      success = true;
    } catch (error) {
      console.warn('Redis清空推荐缓存失败:', error);
    }
  }

  // 从内存缓存清空
  if (useMemoryCache) {
    const keys = memoryCache.keys('recommendation:*');
    keys.forEach(key => memoryCache.delete(key));
    success = true;
  }

  return success;
}
