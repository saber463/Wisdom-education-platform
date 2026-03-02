/**
 * 数据一致性检查脚本
 * 检查MySQL和MongoDB之间的数据一致性
 * Requirements: 6.8, 21.19
 */
import { databaseSyncService } from '../src/services/database-sync.service.js';
import { connectMongoDB } from '../src/config/mongodb.js';
import { pool } from '../src/config/database.js';
async function main() {
    console.log('='.repeat(60));
    console.log('数据一致性检查脚本');
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
        await pool.query('SELECT 1');
        console.log('✓ MySQL连接成功');
        console.log();
        // 执行一致性检查
        console.log('开始检查数据一致性...');
        console.log('-'.repeat(60));
        const result = await databaseSyncService.checkDataConsistency();
        console.log('-'.repeat(60));
        console.log();
        // 显示检查结果
        console.log('检查结果:');
        console.log(`  检查时间: ${result.timestamp.toLocaleString('zh-CN')}`);
        console.log(`  数据一致: ${result.consistent ? '是' : '否'}`);
        console.log();
        if (result.issues.length > 0) {
            console.log(`发现 ${result.issues.length} 个问题:`);
            result.issues.forEach((issue, index) => {
                console.log();
                console.log(`问题 ${index + 1}:`);
                console.log(`  类型: ${issue.type}`);
                console.log(`  描述: ${issue.description}`);
                console.log(`  影响记录数: ${issue.affectedRecords}`);
            });
            console.log();
            console.log('建议: 运行 npm run sync-databases 来修复这些问题');
        }
        else {
            console.log('✓ 所有数据一致性检查通过');
        }
        console.log();
        console.log('='.repeat(60));
        console.log('检查完成');
        console.log('='.repeat(60));
        process.exit(result.consistent ? 0 : 1);
    }
    catch (error) {
        console.error('检查失败:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=check-data-consistency.js.map