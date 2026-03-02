/**
 * 数据库同步脚本
 * 用于手动触发MySQL和MongoDB之间的数据同步
 * Requirements: 6.8, 21.19
 */

import { databaseSyncService } from '../src/services/database-sync.service.js';
import { connectMongoDB } from '../src/config/mongodb.js';
import { getPool } from '../src/config/database.js';

async function main() {
  console.log('='.repeat(60));
  console.log('数据库同步脚本');
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

    // 执行手动同步
    console.log('开始执行数据库同步...');
    console.log('-'.repeat(60));
    const { syncResults, consistencyCheck } = await databaseSyncService.manualSync();
    console.log('-'.repeat(60));
    console.log();

    // 显示同步结果
    console.log('同步结果:');
    syncResults.forEach((result, index) => {
      const status = result.success ? '✓' : '✗';
      console.log(`  ${status} ${result.message}`);
      if (result.details) {
        console.log(`    详情: ${JSON.stringify(result.details)}`);
      }
    });
    console.log();

    // 显示一致性检查结果
    console.log('数据一致性检查:');
    if (consistencyCheck.consistent) {
      console.log('  ✓ 数据一致性检查通过');
    } else {
      console.log(`  ✗ 发现 ${consistencyCheck.issues.length} 个问题:`);
      consistencyCheck.issues.forEach((issue, index) => {
        console.log(`    ${index + 1}. ${issue.description}`);
        console.log(`       类型: ${issue.type}`);
        console.log(`       影响记录数: ${issue.affectedRecords}`);
      });
    }
    console.log();

    console.log('='.repeat(60));
    console.log('同步完成');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  }
}

main();
