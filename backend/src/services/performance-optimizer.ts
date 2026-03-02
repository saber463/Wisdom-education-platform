/**
 * 性能优化模块
 * 实现报告生成、推荐计算、口语评测的性能优化
 * 需求：16.6, 19.7, 20.6
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CPU空闲时段检测
 * 返回当前CPU使用率（0-100）
 */
export function getCPUUsage(): number {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);

  return usage;
}

/**
 * 内存使用率检测
 * 返回内存使用率（0-100）
 */
export function getMemoryUsage(): number {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usage = Math.round((usedMemory / totalMemory) * 100);

  return usage;
}

/**
 * 检查是否为CPU空闲时段
 * 空闲时段定义：CPU使用率 < 30%
 * 
 * 需求：16.6
 */
export function isCPUIdleTime(): boolean {
  const cpuUsage = getCPUUsage();
  return cpuUsage < 30;
}

/**
 * 等待CPU空闲时段
 * 最多等待30秒，每秒检查一次
 * 
 * 需求：16.6
 */
export async function waitForCPUIdleTime(maxWaitSeconds: number = 30): Promise<boolean> {
  let waitedSeconds = 0;

  while (waitedSeconds < maxWaitSeconds) {
    if (isCPUIdleTime()) {
      console.log(`CPU已空闲，可以执行报告生成任务（CPU使用率: ${getCPUUsage()}%）`);
      return true;
    }

    // 等待1秒后重新检查
    await new Promise(resolve => setTimeout(resolve, 1000));
    waitedSeconds++;

    if (waitedSeconds % 5 === 0) {
      console.log(`等待CPU空闲中... (${waitedSeconds}/${maxWaitSeconds}秒, 当前CPU使用率: ${getCPUUsage()}%)`);
    }
  }

  console.warn(`等待CPU空闲超时，将继续执行任务（当前CPU使用率: ${getCPUUsage()}%）`);
  return false;
}

/**
 * 本地缓存管理
 * 用于缓存生成的报告结果
 */
export class LocalCache {
  private cacheDir: string;
  private maxCacheSize: number; // 字节
  private cacheTTL: number; // 毫秒

  constructor(
    cacheDir: string = './cache',
    maxCacheSizeMB: number = 500,
    cacheTTLHours: number = 24
  ) {
    this.cacheDir = cacheDir;
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024;
    this.cacheTTL = cacheTTLHours * 60 * 60 * 1000;

    // 创建缓存目录
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    try {
      const cacheFile = this.generateCacheKey(key);

      if (!fs.existsSync(cacheFile)) {
        return null;
      }

      const stats = fs.statSync(cacheFile);
      const now = Date.now();

      // 检查缓存是否过期
      if (now - stats.mtimeMs > this.cacheTTL) {
        fs.unlinkSync(cacheFile);
        return null;
      }

      const data = fs.readFileSync(cacheFile, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`获取缓存失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T): boolean {
    try {
      const cacheFile = this.generateCacheKey(key);
      const data = JSON.stringify(value);

      // 检查缓存大小
      const currentSize = this.getCacheSize();
      const newSize = Buffer.byteLength(data, 'utf-8');

      if (currentSize + newSize > this.maxCacheSize) {
        console.warn(`缓存大小超过限制，清理最旧的缓存文件`);
        this.cleanOldestCache();
      }

      fs.writeFileSync(cacheFile, data, 'utf-8');
      return true;
    } catch (error) {
      console.error(`设置缓存失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    try {
      const cacheFile = this.generateCacheKey(key);

      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`删除缓存失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): boolean {
    try {
      const files = fs.readdirSync(this.cacheDir);

      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        fs.unlinkSync(filePath);
      });

      return true;
    } catch (error) {
      console.error('清空缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存总大小
   */
  private getCacheSize(): number {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let totalSize = 0;

      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return totalSize;
    } catch (error) {
      console.error('获取缓存大小失败:', error);
      return 0;
    }
  }

  /**
   * 清理最旧的缓存文件
   */
  private cleanOldestCache(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);

      if (files.length === 0) {
        return;
      }

      // 获取所有文件的修改时间
      const fileStats = files.map(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        return { file, mtime: stats.mtimeMs };
      });

      // 按修改时间排序，删除最旧的10%
      fileStats.sort((a, b) => a.mtime - b.mtime);
      const filesToDelete = Math.max(1, Math.ceil(files.length * 0.1));

      for (let i = 0; i < filesToDelete; i++) {
        const filePath = path.join(this.cacheDir, fileStats[i].file);
        fs.unlinkSync(filePath);
        console.log(`已删除过期缓存: ${fileStats[i].file}`);
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }
}

/**
 * 资源限制管理器
 * 用于限制并发任务数量和资源占用
 */
export class ResourceLimiter {
  private maxConcurrentTasks: number;
  private currentTasks: number = 0;
  private taskQueue: Array<() => Promise<any>> = [];
  private maxCPUUsage: number;
  private maxMemoryUsage: number;

  constructor(
    maxConcurrentTasks: number = 5,
    maxCPUUsage: number = 20,
    maxMemoryUsage: number = 150 // MB
  ) {
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.maxCPUUsage = maxCPUUsage;
    this.maxMemoryUsage = maxMemoryUsage;
  }

  /**
   * 检查资源是否充足
   */
  private async checkResources(): Promise<boolean> {
    const cpuUsage = getCPUUsage();
    const memoryUsage = getMemoryUsage();

    if (cpuUsage > this.maxCPUUsage) {
      console.warn(`CPU使用率过高 (${cpuUsage}% > ${this.maxCPUUsage}%)，等待中...`);
      return false;
    }

    if (memoryUsage > this.maxMemoryUsage) {
      console.warn(`内存使用率过高 (${memoryUsage}% > ${this.maxMemoryUsage}%)，等待中...`);
      return false;
    }

    return true;
  }

  /**
   * 执行任务（带资源限制）
   */
  async executeTask<T>(task: () => Promise<T>): Promise<T> {
    // 等待直到有可用的任务槽位
    while (this.currentTasks >= this.maxConcurrentTasks) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 等待资源充足
    while (!(await this.checkResources())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.currentTasks++;

    try {
      return await task();
    } finally {
      this.currentTasks--;
    }
  }

  /**
   * 获取当前任务数
   */
  getCurrentTaskCount(): number {
    return this.currentTasks;
  }

  /**
   * 获取队列中的任务数
   */
  getQueuedTaskCount(): number {
    return this.taskQueue.length;
  }
}

/**
 * 异步任务调度器
 * 用于在CPU空闲时段执行报告生成等耗时任务
 */
export class AsyncTaskScheduler {
  private taskQueue: Array<{
    id: string;
    task: () => Promise<any>;
    priority: number; // 优先级（1-10，10最高）
    createdAt: Date;
  }> = [];
  private isRunning: boolean = false;
  private resourceLimiter: ResourceLimiter;

  constructor(resourceLimiter?: ResourceLimiter) {
    this.resourceLimiter = resourceLimiter || new ResourceLimiter();
  }

  /**
   * 添加任务到队列
   */
  addTask(
    id: string,
    task: () => Promise<any>,
    priority: number = 5
  ): void {
    this.taskQueue.push({
      id,
      task,
      priority: Math.max(1, Math.min(10, priority)),
      createdAt: new Date()
    });

    // 按优先级排序
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    console.log(`任务已添加到队列: ${id} (优先级: ${priority})`);

    // 启动调度器
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * 启动调度器
   */
  private start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.processQueue();
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const taskItem = this.taskQueue.shift();

      if (!taskItem) {
        break;
      }

      try {
        console.log(`开始执行任务: ${taskItem.id}`);
        await this.resourceLimiter.executeTask(taskItem.task);
        console.log(`任务执行完成: ${taskItem.id}`);
      } catch (error) {
        console.error(`任务执行失败: ${taskItem.id}`, error);
      }

      // 每个任务之间等待100ms
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isRunning = false;
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    queuedTasks: number;
    isRunning: boolean;
    tasks: Array<{ id: string; priority: number; createdAt: Date }>;
  } {
    return {
      queuedTasks: this.taskQueue.length,
      isRunning: this.isRunning,
      tasks: this.taskQueue.map(t => ({
        id: t.id,
        priority: t.priority,
        createdAt: t.createdAt
      }))
    };
  }
}

// 创建全局实例
export const localCache = new LocalCache('./cache/reports', 500, 24);
export const resourceLimiter = new ResourceLimiter(5, 20, 150);
export const asyncTaskScheduler = new AsyncTaskScheduler(resourceLimiter);

