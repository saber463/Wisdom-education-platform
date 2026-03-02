/**
 * 端口管理模块
 * 功能：检测端口占用并自动切换到备用端口
 * 需求：10.2
 */

import net from 'net';
import fs from 'fs';
import path from 'path';

// 端口配置
interface PortConfig {
  service: string;
  primaryPort: number;
  backupPorts: number[];
}

const PORT_CONFIGS: PortConfig[] = [
  {
    service: 'mysql',
    primaryPort: 3306,
    backupPorts: [3307, 3308]
  },
  {
    service: 'backend',
    primaryPort: 3000,
    backupPorts: [3001, 3002]
  },
  {
    service: 'python-ai',
    primaryPort: 5000,
    backupPorts: [5001, 5002]
  },
  {
    service: 'rust-service',
    primaryPort: 8080,
    backupPorts: [8081, 8082]
  }
];

/**
 * 检查端口是否被占用
 */
export function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // 端口被占用
      } else {
        resolve(false); // 其他错误，视为不可用
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // 端口可用
    });
    
    server.listen(port);
  });
}

/**
 * 为服务查找可用端口
 */
export async function findAvailablePort(service: string): Promise<number | null> {
  const config = PORT_CONFIGS.find(c => c.service === service);
  
  if (!config) {
    console.error(`未找到服务 ${service} 的端口配置`);
    return null;
  }
  
  // 首先检查主端口
  const primaryAvailable = await checkPortAvailable(config.primaryPort);
  if (primaryAvailable) {
    console.log(`✓ 服务 ${service} 主端口 ${config.primaryPort} 可用`);
    return config.primaryPort;
  }
  
  console.warn(`⚠️ 服务 ${service} 主端口 ${config.primaryPort} 被占用，尝试备用端口...`);
  
  // 尝试备用端口
  for (const backupPort of config.backupPorts) {
    const available = await checkPortAvailable(backupPort);
    if (available) {
      console.log(`✓ 服务 ${service} 切换到备用端口 ${backupPort}`);
      return backupPort;
    }
  }
  
  console.error(`✗ 服务 ${service} 所有端口都被占用`);
  return null;
}

/**
 * 更新配置文件中的端口
 */
export function updatePortInConfig(service: string, newPort: number): void {
  const configFiles: Record<string, string> = {
    'mysql': path.join(__dirname, '../../.env'),
    'backend': path.join(__dirname, '../../.env'),
    'python-ai': path.join(__dirname, '../../../python-ai/.env'),
    'rust-service': path.join(__dirname, '../../../rust-service/.env')
  };
  
  const configFile = configFiles[service];
  if (!configFile) {
    console.error(`未找到服务 ${service} 的配置文件路径`);
    return;
  }
  
  // 检查配置文件是否存在
  if (!fs.existsSync(configFile)) {
    console.warn(`配置文件 ${configFile} 不存在，跳过更新`);
    return;
  }
  
  try {
    // 读取配置文件
    let content = fs.readFileSync(configFile, 'utf8');
    
    // 根据服务类型更新对应的端口配置
    switch (service) {
      case 'mysql':
        content = content.replace(/DB_PORT=\d+/, `DB_PORT=${newPort}`);
        break;
      case 'backend':
        content = content.replace(/PORT=\d+/, `PORT=${newPort}`);
        break;
      case 'python-ai':
        content = content.replace(/AI_SERVICE_PORT=\d+/, `AI_SERVICE_PORT=${newPort}`);
        break;
      case 'rust-service':
        content = content.replace(/RUST_SERVICE_PORT=\d+/, `RUST_SERVICE_PORT=${newPort}`);
        break;
    }
    
    // 写回配置文件
    fs.writeFileSync(configFile, content, 'utf8');
    console.log(`✓ 已更新 ${service} 配置文件中的端口为 ${newPort}`);
  } catch (error) {
    console.error(`更新配置文件失败: ${error}`);
  }
}

/**
 * 检测并切换所有服务的端口
 */
export async function detectAndSwitchPorts(): Promise<Map<string, number>> {
  const portMap = new Map<string, number>();
  
  console.log('🔍 开始检测端口占用情况...\n');
  
  for (const config of PORT_CONFIGS) {
    const availablePort = await findAvailablePort(config.service);
    
    if (availablePort) {
      portMap.set(config.service, availablePort);
      
      // 如果使用的不是主端口，更新配置文件
      if (availablePort !== config.primaryPort) {
        updatePortInConfig(config.service, availablePort);
      }
    } else {
      console.error(`✗ 无法为服务 ${config.service} 找到可用端口`);
    }
  }
  
  console.log('\n✅ 端口检测完成');
  return portMap;
}

/**
 * 获取服务的当前端口
 */
export function getServicePort(service: string): number | null {
  const config = PORT_CONFIGS.find(c => c.service === service);
  return config ? config.primaryPort : null;
}

/**
 * 获取所有服务的端口配置
 */
export function getAllPortConfigs(): PortConfig[] {
  return PORT_CONFIGS;
}
