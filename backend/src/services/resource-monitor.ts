/**
 * 资源监控模块
 * 功能：监控CPU使用率和内存占用，当资源使用过高时降低服务负载
 * 需求：10.1, 10.8
 */

import os from 'os';
import fs from 'fs';
import path from 'path';

// 资源监控配置
const RESOURCE_CONFIG = {
  CPU_THRESHOLD: 0.70,      // CPU使用率阈值 70%
  MEMORY_THRESHOLD: 0.60,   // 内存占用阈值 60%
  CHECK_INTERVAL: 5000,     // 检查间隔 5秒
  LOG_DIR: path.join(__dirname, '../../logs'),
  LOG_FILE: 'resource-monitor.log'
};

// 资源状态
interface ResourceStatus {
  cpuUsage: number;
  memoryUsage: number;
  timestamp: Date;
  isOverloaded: boolean;
  action: string;
}

// 全局负载控制
let currentLoadLevel: 'normal' | 'reduced' | 'minimal' = 'normal';
let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * 获取CPU使用率
 */
function getCPUUsage(): number {
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
  const usage = 1 - idle / total;

  return Math.max(0, Math.min(1, usage));
}

/**
 * 获取内存使用率
 */
function getMemoryUsage(): number {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  return usedMemory / totalMemory;
}

/**
 * 记录监控日志
 */
function logResourceStatus(status: ResourceStatus): void {
  // 确保日志目录存在
  if (!fs.existsSync(RESOURCE_CONFIG.LOG_DIR)) {
    fs.mkdirSync(RESOURCE_CONFIG.LOG_DIR, { recursive: true });
  }

  const logPath = path.join(RESOURCE_CONFIG.LOG_DIR, RESOURCE_CONFIG.LOG_FILE);
  const logEntry = `[${status.timestamp.toISOString()}] CPU: ${(status.cpuUsage * 100).toFixed(2)}%, Memory: ${(status.memoryUsage * 100).toFixed(2)}%, Overloaded: ${status.isOverloaded}, Action: ${status.action}\n`;

  fs.appendFileSync(logPath, logEntry, 'utf8');
}

/**
 * 降低服务负载
 */
function reduceServiceLoad(cpuUsage: number, memoryUsage: number): string {
  let action = 'none';

  // 根据资源使用情况调整负载级别
  if (cpuUsage >= RESOURCE_CONFIG.CPU_THRESHOLD || memoryUsage >= RESOURCE_CONFIG.MEMORY_THRESHOLD) {
    if (cpuUsage >= 0.85 || memoryUsage >= 0.80) {
      // 严重过载：最小负载模式
      currentLoadLevel = 'minimal';
      action = 'switched to minimal load mode';
      
      // 设置最小并发请求数
      if (global.maxConcurrentRequests !== 2) {
        global.maxConcurrentRequests = 2;
      }
      
      // 触发垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
        action += ', triggered GC';
      }
    } else {
      // 中度过载：降低负载模式
      currentLoadLevel = 'reduced';
      action = 'switched to reduced load mode';
      
      // 限制并发请求数
      if (global.maxConcurrentRequests !== 5) {
        global.maxConcurrentRequests = 5;
      }
    }
  } else if (cpuUsage < 0.50 && memoryUsage < 0.40) {
    // 资源充足：恢复正常模式
    if (currentLoadLevel !== 'normal') {
      currentLoadLevel = 'normal';
      action = 'restored to normal load mode';
      global.maxConcurrentRequests = 20;
    }
  }

  return action;
}

/**
 * 执行资源监控检查
 */
function performResourceCheck(): ResourceStatus {
  const cpuUsage = getCPUUsage();
  const memoryUsage = getMemoryUsage();
  const isOverloaded = cpuUsage >= RESOURCE_CONFIG.CPU_THRESHOLD || 
                       memoryUsage >= RESOURCE_CONFIG.MEMORY_THRESHOLD;
  
  const action = isOverloaded ? reduceServiceLoad(cpuUsage, memoryUsage) : 'normal operation';

  const status: ResourceStatus = {
    cpuUsage,
    memoryUsage,
    timestamp: new Date(),
    isOverloaded,
    action
  };

  // 记录日志
  logResourceStatus(status);

  // 如果资源过载，输出警告
  if (isOverloaded) {
    console.warn(`⚠️ 资源使用过高 - CPU: ${(cpuUsage * 100).toFixed(2)}%, Memory: ${(memoryUsage * 100).toFixed(2)}%`);
    console.warn(`   采取措施: ${action}`);
  }

  return status;
}

/**
 * 启动资源监控
 */
export function startResourceMonitoring(): void {
  if (monitoringInterval) {
    console.log('资源监控已在运行中');
    return;
  }

  console.log('🔍 启动资源监控...');
  console.log(`   CPU阈值: ${RESOURCE_CONFIG.CPU_THRESHOLD * 100}%`);
  console.log(`   内存阈值: ${RESOURCE_CONFIG.MEMORY_THRESHOLD * 100}%`);
  console.log(`   检查间隔: ${RESOURCE_CONFIG.CHECK_INTERVAL / 1000}秒`);

  // 初始化全局并发限制
  global.maxConcurrentRequests = 20;

  // 立即执行一次检查
  performResourceCheck();

  // 定期执行检查
  monitoringInterval = setInterval(() => {
    performResourceCheck();
  }, RESOURCE_CONFIG.CHECK_INTERVAL);
}

/**
 * 停止资源监控
 */
export function stopResourceMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('✅ 资源监控已停止');
  }
}

/**
 * 获取当前资源状态
 */
export function getCurrentResourceStatus(): ResourceStatus {
  return performResourceCheck();
}

/**
 * 获取当前负载级别
 */
export function getCurrentLoadLevel(): string {
  return currentLoadLevel;
}

/**
 * 手动设置负载级别
 */
export function setLoadLevel(level: 'normal' | 'reduced' | 'minimal'): void {
  currentLoadLevel = level;
  
  switch (level) {
    case 'normal':
      global.maxConcurrentRequests = 20;
      break;
    case 'reduced':
      global.maxConcurrentRequests = 5;
      break;
    case 'minimal':
      global.maxConcurrentRequests = 2;
      break;
  }
  
  console.log(`负载级别已设置为: ${level}`);
}

// 扩展全局类型定义
declare global {
  // eslint-disable-next-line no-var
  var maxConcurrentRequests: number;
}
