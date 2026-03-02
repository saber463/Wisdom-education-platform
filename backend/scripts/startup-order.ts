/**
 * 服务启动顺序管理模块
 * 确保服务按照正确的顺序启动：MySQL → Rust → Python → Node → Frontend
 */

import * as net from 'net';

/**
 * 服务定义
 */
export interface Service {
  name: string;
  port: number;
  order: number;
  command?: string;
  checkCommand?: string;
}

/**
 * 预定义的服务启动顺序
 */
export const SERVICES: Service[] = [
  {
    name: 'MySQL',
    port: 3306,
    order: 1,
    checkCommand: 'mysql --version'
  },
  {
    name: 'Rust',
    port: 8080,
    order: 2,
    command: 'cargo run --release'
  },
  {
    name: 'Python',
    port: 5000,
    order: 3,
    command: 'python app.py'
  },
  {
    name: 'Node',
    port: 3000,
    order: 4,
    command: 'npm run start'
  },
  {
    name: 'Frontend',
    port: 5173,
    order: 5,
    command: 'npm run dev'
  }
];

/**
 * 获取服务启动顺序
 */
export function getStartupOrder(): Service[] {
  return [...SERVICES].sort((a, b) => a.order - b.order);
}

/**
 * 验证服务顺序是否正确
 */
export function validateStartupOrder(services: Service[]): boolean {
  if (services.length !== SERVICES.length) {
    return false;
  }

  for (let i = 0; i < services.length; i++) {
    if (services[i].order !== i + 1) {
      return false;
    }
  }

  return true;
}

/**
 * 检查端口是否被占用
 */
export async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

/**
 * 检查服务是否正在运行
 */
export async function isServiceRunning(service: Service): Promise<boolean> {
  return await isPortInUse(service.port);
}

/**
 * 获取正在运行的服务列表
 */
export async function getRunningServices(): Promise<Service[]> {
  const runningServices: Service[] = [];
  
  for (const service of SERVICES) {
    const isRunning = await isServiceRunning(service);
    if (isRunning) {
      runningServices.push(service);
    }
  }
  
  return runningServices;
}

/**
 * 验证服务是否按正确顺序启动
 * 通过检查端口占用情况来推断启动顺序
 */
export async function verifyStartupSequence(): Promise<{
  valid: boolean;
  runningServices: Service[];
  expectedOrder: Service[];
}> {
  const runningServices = await getRunningServices();
  const expectedOrder = getStartupOrder();
  
  // 验证运行中的服务是否按照预期顺序
  let valid = true;
  if (runningServices.length > 0) {
    for (let i = 0; i < runningServices.length - 1; i++) {
      if (runningServices[i].order > runningServices[i + 1].order) {
        valid = false;
        break;
      }
    }
  }
  
  return {
    valid,
    runningServices,
    expectedOrder
  };
}

/**
 * 获取服务启动信息
 */
export function getServiceInfo(serviceName: string): Service | undefined {
  return SERVICES.find(s => s.name === serviceName);
}

/**
 * 检查所有服务是否已启动
 */
export async function areAllServicesRunning(): Promise<boolean> {
  const runningServices = await getRunningServices();
  return runningServices.length === SERVICES.length;
}

/**
 * 获取下一个应该启动的服务
 */
export async function getNextServiceToStart(): Promise<Service | null> {
  const runningServices = await getRunningServices();
  const expectedOrder = getStartupOrder();
  
  for (const service of expectedOrder) {
    const isRunning = runningServices.some(s => s.name === service.name);
    if (!isRunning) {
      return service;
    }
  }
  
  return null;
}

/**
 * 验证服务启动顺序的完整性
 */
export function validateServiceDefinitions(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 检查是否有重复的order
  const orders = SERVICES.map(s => s.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    errors.push('存在重复的启动顺序编号');
  }
  
  // 检查order是否连续
  const sortedOrders = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sortedOrders.length; i++) {
    if (sortedOrders[i] !== i + 1) {
      errors.push(`启动顺序编号不连续: 期望 ${i + 1}, 实际 ${sortedOrders[i]}`);
    }
  }
  
  // 检查是否有重复的端口
  const ports = SERVICES.map(s => s.port);
  const uniquePorts = new Set(ports);
  if (ports.length !== uniquePorts.size) {
    errors.push('存在重复的端口号');
  }
  
  // 检查是否有重复的服务名
  const names = SERVICES.map(s => s.name);
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    errors.push('存在重复的服务名称');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
