/**
 * 启动自动同步服务
 * 定期同步MySQL和MongoDB之间的数据
 * Requirements: 6.8, 21.19
 */

import { databaseSyncService } from '../src/services/database-sync.service.js';
import { connectMongoDB } from '../src/config/mongodb.js';
import { getPool } from '../src/config/database.js';

async function main() {
  console.log('='.repeat(60));
  console.log('数据库自动同步服务');
  console.log('='.repeat(60));
  console.log();

  try {
    // 连接MongoDB
    console.log('正在连接MongoDB...');
    await connectMongoDB();
    console.log('✓ MongoDB连接成功');
    console.log();

    // 测试MySQL连接
    console.log('正在测试MySQL连接...');
    const pool = await getPool();
    await pool.query('SELECT 1');
    console.log('✓ MySQL连接成功');
    console.log();

    // 启动自动同步
    console.log('启动自动同步服务...');
    databaseSyncService.startAutoSync();
    console.log('✓ 自动同步服务已启动');
    console.log('  同步间隔: 5分钟');
    console.log('  按 Ctrl+C 停止服务');
    console.log();

    // 处理退出信号
    process.on('SIGINT', () => {
      console.log();
      console.log('正在停止自动同步服务...');
      databaseSyncService.stopAutoSync();
      console.log('✓ 自动同步服务已停止');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log();
      console.log('正在停止自动同步服务...');
      databaseSyncService.stopAutoSync();
      console.log('✓ 自动同步服务已停止');
      process.exit(0);
    });

    // 保持进程运行
    await new Promise(() => {});
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

main();
