/**
 * 内存缓存模块 - Redis降级方案
 * 当Redis不可用时使用内存缓存
 */

interface CacheEntry {
  value: unknown;
  expireAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每5分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 设置缓存
   */
  set(key: string, value: unknown, ttl: number = 86400): boolean {
    try {
      const expireAt = Date.now() + ttl * 1000;
      this.cache.set(key, { value, expireAt });
      return true;
    } catch (error) {
      console.warn('内存缓存设置失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  get(key: string): unknown | null {
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        return null;
      }

      // 检查是否过期
      if (Date.now() > entry.expireAt) {
        this.cache.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.warn('内存缓存获取失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    try {
      return this.cache.delete(key);
    } catch (error) {
      console.warn('内存缓存删除失败:', error);
      return false;
    }
  }

  /**
   * 获取匹配的键
   */
  keys(pattern: string): string[] {
    try {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Array.from(this.cache.keys()).filter(key => regex.test(key));
    } catch (error) {
      console.warn('内存缓存键查询失败:', error);
      return [];
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expireAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`内存缓存清理: 删除了 ${cleanedCount} 个过期条目`);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    console.log('内存缓存已清空');
  }

  /**
   * 销毁缓存（清理定时器）
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// 创建全局内存缓存实例
export const memoryCache = new MemoryCache();

console.log('✓ 内存缓存已初始化（Redis降级方案）');
