import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 修复 Windows 终端乱码问题
if (process.platform === 'win32') {
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
}

dotenv.config();

// 备用端口列表
const ALTERNATIVE_PORTS = [3306, 3307, 3308];
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

// 查找可用端口
async function findAvailablePort(): Promise<number> {
  for (const port of ALTERNATIVE_PORTS) {
    try {
      // 尝试连接到MySQL端口
      const testConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: port,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'edu_education_platform',
        charset: 'utf8mb4'
      };
      
      const testPool = mysql.createPool(testConfig);
      const connection = await testPool.getConnection();
      connection.release();
      await testPool.end();
      
      console.log(`找到可用MySQL端口: ${port}`);
      return port;
    } catch (error) {
      // 端口不可用或MySQL未在此端口运行，继续尝试下一个
      continue;
    }
  }
  
  // 如果所有端口都不可用，返回默认端口
  console.warn('未找到可用MySQL端口，使用默认端口3306');
  return 3306;
}

// 数据库连接配置（性能优化版）
let currentPort = parseInt(process.env.DB_PORT || '3306');

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: currentPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edu_education_platform',
  charset: 'utf8mb4',
  // 性能优化：增加连接池大小
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  queueLimit: 0,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 已移除 acquireTimeout：mysql2 Connection 会忽略该选项并产生警告；连接超时可在连接时单独配置
};

// 创建连接池
let pool: mysql.Pool;

// 导出pool（供scripts使用）
export function getPoolSync(): mysql.Pool | undefined {
  return pool;
}

// 初始化连接池
async function initializePool(): Promise<mysql.Pool> {
  const availablePort = await findAvailablePort();
  currentPort = availablePort;
  dbConfig.port = availablePort;
  
  pool = mysql.createPool(dbConfig);
  
  // 性能优化：监听连接事件
  // 注意：mysql2 Promise Pool 的事件监听器类型需要类型断言
  const poolWithEvents = pool as unknown as {
    on(event: 'connection', callback: (connection: mysql.PoolConnection) => void): void;
    on(event: 'error', callback: (err: NodeJS.ErrnoException) => void): void;
  };
  
  poolWithEvents.on('connection', (connection) => {
    console.log(`[数据库] 新连接建立: ${connection.threadId}`);
  });
  
  poolWithEvents.on('error', (err: NodeJS.ErrnoException) => {
    console.error('[数据库] 连接池错误:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('[数据库] 尝试重新连接...');
      initializePool();
    }
  });
  
  return pool;
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 带重试机制的数据库连接
export async function connectWithRetry(retryCount = 0): Promise<mysql.PoolConnection> {
  try {
    if (!pool) {
      await initializePool();
    }
    
    const connection = await pool.getConnection();
    if (retryCount > 0) {
      console.log(`数据库连接成功（重试${retryCount}次后）`);
    } else {
      console.log('数据库连接成功');
    }
    return connection;
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.warn(`数据库连接失败，${RETRY_DELAY_MS}ms后进行第${retryCount + 1}次重试...`);
      await delay(RETRY_DELAY_MS);
      return connectWithRetry(retryCount + 1);
    } else {
      console.error(`数据库连接失败，已重试${MAX_RETRY_ATTEMPTS}次:`, error);
      throw new Error(`数据库连接失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await connectWithRetry();
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
}

// 获取连接池（懒加载）
export async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    await initializePool();
  }
  return pool;
}

// 执行查询（带自动重试和性能监控）
export async function executeQuery<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T> {
  const startTime = Date.now();
  const connection = await connectWithRetry();

  try {
    // 使用 query 而不是 execute，因为 execute 在某些 MySQL 版本中
    // 对 LIMIT ? OFFSET ? 参数绑定有问题
    const [results] = await connection.query(sql, params);

    const duration = Date.now() - startTime;

    // 性能监控：记录慢查询（阈值可由 DB_SLOW_QUERY_MS 配置，默认 500ms）
    const slowThreshold = parseInt(process.env.DB_SLOW_QUERY_MS || '500', 10);
    if (duration > slowThreshold) {
      console.warn(`[数据库性能] 慢查询 (${duration}ms): ${sql.substring(0, 100)}...`);
    }

    // 统一结果结构：
    // - 对于 SELECT 查询，始终返回数组（即使没有记录或驱动返回了非数组）
    //   这样调用方在直接使用 forEach / length 时不会因为类型不一致而报错
    const isSelectQuery = /^\s*select/i.test(sql);
    if (isSelectQuery) {
      if (Array.isArray(results)) {
        return results as T;
      }
      // 极端情况下（驱动或中间层返回了非数组 / undefined），强制包装成空数组
      return [] as T;
    }

    // 非 SELECT（INSERT/UPDATE/DELETE 等）保持原有返回结构（OkPacket 等）
    return results as T;
  } finally {
    connection.release();
  }
}

// 导出当前端口（用于测试）
export function getCurrentPort(): number {
  return currentPort;
}

// 关闭连接池
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    console.log('数据库连接池已关闭');
  }
}

// 性能优化：批量查询
export async function executeBatchQueries<T = unknown>(
  queries: Array<{ sql: string; params?: unknown[] }>
): Promise<T[]> {
  const connection = await connectWithRetry();
  const results: T[] = [];
  
  try {
    await connection.beginTransaction();
    
    for (const query of queries) {
      const [result] = await connection.query(query.sql, query.params);
      results.push(result as T);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
