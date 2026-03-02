/**
 * 服务健康检查与自动重启模块
 * 功能：定期检查服务状态，服务崩溃时自动重启
 * 需求：10.6
 */

import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

// 健康检查配置
const HEALTH_CHECK_CONFIG = {
  CHECK_INTERVAL: 5000,      // 检查间隔 5秒
  RESTART_DELAY: 2000,       // 重启延迟 2秒
  MAX_RESTART_ATTEMPTS: 3,   // 最大重启尝试次数
  LOG_DIR: path.join(__dirname, '../../logs'),
  LOG_FILE: 'health-monitor.log'
};

// 服务配置
interface ServiceConfig {
  name: string;
  healthCheckUrl?: string;
  healthCheckPort?: number;
  command: string;
  args: string[];
  cwd: string;
  enabled: boolean;
}

const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    name: 'backend',
    healthCheckUrl: 'http://localhost:3000/health',
    healthCheckPort: 3000,
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, '../..'),
    enabled: true
  },
  {
    name: 'python-ai',
    healthCheckPort: 5000,
    command: 'python',
    args: ['app.py'],
    cwd: path.join(__dirname, '../../../python-ai'),
    enabled: false // 默认不启用，需要手动配置
  },
  {
    name: 'rust-service',
    healthCheckPort: 8080,
    command: 'cargo',
    args: ['run'],
    cwd: path.join(__dirname, '../../../rust-service'),
    enabled: false // 默认不启用，需要手动配置
  }
];

// 服务状态
interface ServiceStatus {
  name: string;
  isRunning: boolean;
  process: ChildProcess | null;
  restartCount: number;
  lastRestartTime: Date | null;
  lastCheckTime: Date;
}

// 全局服务状态映射
const serviceStatuses = new Map<string, ServiceStatus>();
let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * 记录健康检查日志
 */
function logHealthStatus(message: string): void {
  // 确保日志目录存在
  if (!fs.existsSync(HEALTH_CHECK_CONFIG.LOG_DIR)) {
    fs.mkdirSync(HEALTH_CHECK_CONFIG.LOG_DIR, { recursive: true });
  }

  const logPath = path.join(HEALTH_CHECK_CONFIG.LOG_DIR, HEALTH_CHECK_CONFIG.LOG_FILE);
  const logEntry = `[${new Date().toISOString()}] ${message}\n`;

  fs.appendFileSync(logPath, logEntry, 'utf8');
}

/**
 * 检查服务健康状态
 */
async function checkServiceHealth(config: ServiceConfig): Promise<boolean> {
  if (!config.healthCheckPort) {
    return false;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: config.healthCheckPort,
      path: config.healthCheckUrl || '/health',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * 启动服务
 */
function startService(config: ServiceConfig): ChildProcess | null {
  try {
    console.log(`🚀 启动服务: ${config.name}`);
    logHealthStatus(`启动服务: ${config.name}`);

    const process = spawn(config.command, config.args, {
      cwd: config.cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('error', (error) => {
      console.error(`服务 ${config.name} 启动失败:`, error);
      logHealthStatus(`服务 ${config.name} 启动失败: ${error.message}`);
    });

    process.on('exit', (code) => {
      console.log(`服务 ${config.name} 退出，退出码: ${code}`);
      logHealthStatus(`服务 ${config.name} 退出，退出码: ${code}`);
    });

    return process;
  } catch (error) {
    console.error(`启动服务 ${config.name} 时发生错误:`, error);
    logHealthStatus(`启动服务 ${config.name} 时发生错误: ${error}`);
    return null;
  }
}

/**
 * 重启服务
 */
async function restartService(serviceName: string): Promise<void> {
  const status = serviceStatuses.get(serviceName);
  const config = SERVICE_CONFIGS.find(c => c.name === serviceName);

  if (!status || !config) {
    console.error(`未找到服务 ${serviceName} 的配置或状态`);
    return;
  }

  // 检查重启次数限制
  if (status.restartCount >= HEALTH_CHECK_CONFIG.MAX_RESTART_ATTEMPTS) {
    console.error(`服务 ${serviceName} 已达到最大重启次数 (${HEALTH_CHECK_CONFIG.MAX_RESTART_ATTEMPTS})，停止自动重启`);
    logHealthStatus(`服务 ${serviceName} 已达到最大重启次数，停止自动重启`);
    return;
  }

  console.warn(`⚠️ 服务 ${serviceName} 崩溃，准备重启...`);
  logHealthStatus(`服务 ${serviceName} 崩溃，准备重启 (第 ${status.restartCount + 1} 次)`);

  // 停止现有进程
  if (status.process && !status.process.killed) {
    status.process.kill();
  }

  // 等待一段时间后重启
  await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_CONFIG.RESTART_DELAY));

  // 启动新进程
  const newProcess = startService(config);
  if (newProcess) {
    status.process = newProcess;
    status.isRunning = true;
    status.restartCount++;
    status.lastRestartTime = new Date();
    
    console.log(`✓ 服务 ${serviceName} 已重启`);
    logHealthStatus(`服务 ${serviceName} 重启成功`);
  } else {
    status.isRunning = false;
    console.error(`✗ 服务 ${serviceName} 重启失败`);
    logHealthStatus(`服务 ${serviceName} 重启失败`);
  }
}

/**
 * 执行健康检查
 */
async function performHealthCheck(): Promise<void> {
  for (const config of SERVICE_CONFIGS) {
    if (!config.enabled) {
      continue;
    }

    const status = serviceStatuses.get(config.name);
    if (!status) {
      continue;
    }

    const isHealthy = await checkServiceHealth(config);
    status.lastCheckTime = new Date();

    if (!isHealthy && status.isRunning) {
      // 服务不健康，触发重启
      await restartService(config.name);
    } else if (isHealthy && !status.isRunning) {
      // 服务恢复健康
      status.isRunning = true;
      status.restartCount = 0; // 重置重启计数
      console.log(`✓ 服务 ${config.name} 健康状态恢复`);
      logHealthStatus(`服务 ${config.name} 健康状态恢复`);
    }
  }
}

/**
 * 启动健康监控
 */
export function startHealthMonitoring(): void {
  if (monitoringInterval) {
    console.log('健康监控已在运行中');
    return;
  }

  console.log('🏥 启动服务健康监控...');
  console.log(`   检查间隔: ${HEALTH_CHECK_CONFIG.CHECK_INTERVAL / 1000}秒`);
  console.log(`   最大重启次数: ${HEALTH_CHECK_CONFIG.MAX_RESTART_ATTEMPTS}`);

  // 初始化服务状态
  for (const config of SERVICE_CONFIGS) {
    if (config.enabled) {
      serviceStatuses.set(config.name, {
        name: config.name,
        isRunning: false,
        process: null,
        restartCount: 0,
        lastRestartTime: null,
        lastCheckTime: new Date()
      });
    }
  }

  // 立即执行一次检查
  performHealthCheck();

  // 定期执行检查
  monitoringInterval = setInterval(() => {
    performHealthCheck();
  }, HEALTH_CHECK_CONFIG.CHECK_INTERVAL);
}

/**
 * 停止健康监控
 */
export function stopHealthMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    
    // 停止所有服务进程
    for (const status of serviceStatuses.values()) {
      if (status.process && !status.process.killed) {
        status.process.kill();
      }
    }
    
    serviceStatuses.clear();
    console.log('✅ 健康监控已停止');
    logHealthStatus('健康监控已停止');
  }
}

/**
 * 获取服务状态
 */
export function getServiceStatus(serviceName: string): ServiceStatus | null {
  return serviceStatuses.get(serviceName) || null;
}

/**
 * 获取所有服务状态
 */
export function getAllServiceStatuses(): Map<string, ServiceStatus> {
  return new Map(serviceStatuses);
}

/**
 * 手动重启服务
 */
export async function manualRestartService(serviceName: string): Promise<void> {
  const status = serviceStatuses.get(serviceName);
  if (status) {
    status.restartCount = 0; // 重置重启计数
    await restartService(serviceName);
  } else {
    console.error(`服务 ${serviceName} 未在监控中`);
  }
}
