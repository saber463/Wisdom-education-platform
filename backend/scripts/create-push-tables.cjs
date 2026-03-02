/**
 * 创建推送相关表的脚本
 * 执行push-tables.sql中的推送任务表、推送日志表、推送配置表、用户推送偏好表
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createPushTables() {
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
    const sqlFilePath = path.join(__dirname, '../sql/push-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('正在执行SQL脚本...');
    
    // 执行SQL
    await connection.query(sqlContent);

    console.log('✓ 推送相关表创建成功！');
    console.log('✓ 推送配置初始化成功！');
    console.log('\n已创建的表：');
    console.log('  - push_tasks (推送任务表)');
    console.log('  - push_logs (推送日志表)');
    console.log('  - push_config (推送配置表)');
    console.log('  - user_push_preferences (用户推送偏好表)');
    console.log('\n推送配置信息：');
    console.log('  - SendKey: SCT309765TcNT6iaZFzS9hjkzRvmo5jmpj');
    console.log('  - 推送时间: 08:00, 15:00, 20:00');
    console.log('  - 最大并发任务数: 100');
    console.log('  - 重试次数: 3');

  } catch (error) {
    console.error('创建表失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createPushTables();
