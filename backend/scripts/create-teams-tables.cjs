/**
 * 创建学习小组相关表的脚本
 * 执行new-features-tables.sql中的teams相关表
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createTeamsTables() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'edu_education_platform',
      multipleStatements: true
    });

    console.log('数据库连接成功！');

    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '../../docs/sql/new-features-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('正在执行SQL脚本...');
    
    // 执行SQL
    await connection.query(sqlContent);

    console.log('✓ 学习小组相关表创建成功！');
    console.log('✓ 测试数据插入成功！');
    console.log('\n已创建的表：');
    console.log('  - learning_analytics_reports (学情报告表)');
    console.log('  - offline_cache_records (离线缓存记录表)');
    console.log('  - teams (学习小组表)');
    console.log('  - team_members (小组成员关联表)');
    console.log('  - check_ins (打卡记录表)');
    console.log('  - peer_reviews (互评记录表)');
    console.log('  - resource_recommendations (资源推荐表)');
    console.log('  - speech_assessments (口语评测表)');

  } catch (error) {
    console.error('创建表失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTeamsTables();
