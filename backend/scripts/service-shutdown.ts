/**
 * 服务关闭管理模块
 * 负责安全关闭所有服务并释放端口
 */

import { execSync } from 'child_process';
import { isPortInUse, SERVICES, Service } from './startup-order.js';

/**
 * 服务关闭结果
 */
export interface ShutdownResult {
  service: string;
  port: number;
  stopped: boolean;
  portReleased: boolean;
  error?: string;
}

/**
 * 批量关闭结果
 */
export interface BatchShutdownResult {
  success: boolean;
  results: ShutdownResult[];
  totalStopped: number;
  totalPortsReleased: number;
}

/**
 * 查找占用指定端口的进程ID
 */
export function findProcessByPort(port: number): number[] {
  try {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr ":${port}" | findstr "LISTENING"`
      : `lsof -ti:${port}`;
    
    const result = execSync(command, { encoding: 'utf-8' });
    
    if (process.platform === 'win32') {
      // Windows: 解析netstat输出
      const lines = result.trim().split('\n');
      const pids = lines
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return parseInt(parts[parts.length - 1], 10);
        })
        .filter(pid => !isNaN(pid) && pid > 0);
      
      // 去重
      return [...new Set(pids)];
    } else {
      // Unix: lsof直接返回PID
      return result
        .trim()
        .split('\n')
        .map(pid => parseInt(pid, 10))
        .filter(pid => !isNaN(pid) && pid > 0);
    }
  } catch {
    return [];
  }
}

/**
 * 停止指定进程
 */
export function killProcess(pid: number): boolean {
  try {
    const command = process.platform === 'win32'
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`;
    
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 停止占用指定端口的所有进程
 */
export function stopProcessesByPort(port: number): {
  stopped: number;
  failed: number;
} {
  const pids = findProcessByPort(port);
  let stopped = 0;
  let failed = 0;
  
  for (const pid of pids) {
    if (killProcess(pid)) {
      stopped++;
    } else {
      failed++;
    }
  }
  
  return { stopped, failed };
}

/**
 * 停止MySQL服务
 */
export function stopMySQLService(): boolean {
  try {
    if (process.platform === 'win32') {
      // 尝试停止Windows服务
      try {
        execSync('net stop MySQL80', { stdio: 'ignore' });
        return true;
      } catch {
        // 如果服务不存在或已停止，尝试停止进程
        const result = stopProcessesByPort(3306);
        return result.stopped > 0;
      }
    } else {
      // Unix系统
      const result = stopProcessesByPort(3306);
      return result.stopped > 0;
    }
  } catch {
    return false;
  }
}

/**
 * 停止单个服务
 */
export async function stopService(service: Service): Promise<ShutdownResult> {
  const result: ShutdownResult = {
    service: service.name,
    port: service.port,
    stopped: false,
    portReleased: false
  };

  try {
    // 特殊处理MySQL
    if (service.name === 'MySQL') {
      result.stopped = stopMySQLService();
    } else {
      // 停止占用端口的进程
      const stopResult = stopProcessesByPort(service.port);
      result.stopped = stopResult.stopped > 0;
    }

    // 等待一小段时间让进程完全停止
    await new Promise(resolve => setTimeout(resolve, 500));

    // 检查端口是否已释放
    result.portReleased = !(await isPortInUse(service.port));
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

/**
 * 停止所有服务
 */
export async function stopAllServices(): Promise<BatchShutdownResult> {
  const results: ShutdownResult[] = [];
  
  // 按照相反的顺序停止服务（Frontend → Node → Python → Rust → MySQL）
  const servicesReversed = [...SERVICES].sort((a, b) => b.order - a.order);
  
  for (const service of servicesReversed) {
    const result = await stopService(service);
    results.push(result);
  }

  const totalStopped = results.filter(r => r.stopped).length;
  const totalPortsReleased = results.filter(r => r.portReleased).length;

  return {
    success: totalPortsReleased === SERVICES.length,
    results,
    totalStopped,
    totalPortsReleased
  };
}

/**
 * 检查所有服务是否已停止
 */
export async function areAllServicesStopped(): Promise<boolean> {
  for (const service of SERVICES) {
    const inUse = await isPortInUse(service.port);
    if (inUse) {
      return false;
    }
  }
  return true;
}

/**
 * 获取正在运行的服务端口列表
 */
export async function getRunningPorts(): Promise<number[]> {
  const runningPorts: number[] = [];
  
  for (const service of SERVICES) {
    const inUse = await isPortInUse(service.port);
    if (inUse) {
      runningPorts.push(service.port);
    }
  }
  
  return runningPorts;
}

/**
 * 清理临时文件
 */
export function cleanupTempFiles(): {
  cleaned: string[];
  failed: string[];
} {
  const cleaned: string[] = [];
  const failed: string[] = [];
  
  const pathsToClean = [
    'backend/node_modules/.cache',
    'frontend/node_modules/.cache',
    'python-ai/__pycache__'
  ];

  for (const path of pathsToClean) {
    try {
      const command = process.platform === 'win32'
        ? `rd /S /Q "${path}"`
        : `rm -rf "${path}"`;
      
      execSync(command, { stdio: 'ignore' });
      cleaned.push(path);
    } catch {
      failed.push(path);
    }
  }

  return { cleaned, failed };
}
