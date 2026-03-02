/**
 * 快速数据库设置脚本
 * 尝试常见的MySQL配置
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'edu_education_platform';

// 常见的MySQL配置组合
const COMMON_CONFIGS = [
  { host: 'localhost', port: 3306, user: 'root', password: '' },
  { host: 'localhost', port: 3306, user: 'root', password: 'root' },
  { host: 'localhost', port: 3306, user: 'root', password: '123456' },
  { host: '127.0.0.1', port: 3306, user: 'root', password: '' },
  { host: '127.0.0.1', port: 3306, user: 'root', password: 'root' },
  { host: '127.0.0.1', port: 3306, user: 'root', password: '123456' },
];

/**
 * 测试MySQL连接
 */
async function findWorkingConfig() {
  console.log('正在尝试连接MySQL...\n');
  
  for (const config of COMMON_CONFIGS) {
    try {
      const connection = await mysql.createConnection(config);
      await connection.ping();
      await connection.end();
      
      const passwordDisplay = config.password ? '***' : '(无密码)';
      console.log(`✓ 连接成功: ${config.user}@${config.host}:${config.port} ${passwordDisplay}\n`);
      return config;
    } catch (error) {
      // 继续尝试下一个配置
    }
  }
  
  return null;
}

/**
 * 创建数据库
 */
async function createDatabase(config) {
  console.log('[2/4] 创建数据库...');
  
  const connection = await mysql.createConnection(config);
  
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS ${DB_NAME} 
     CHARACTER SET utf8mb4 
     COLLATE utf8mb4_general_ci`
  );
  
  const [rows] = await connection.query(
    `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
     FROM information_schema.SCHEMATA 
     WHERE SCHEMA_NAME = ?`,
    [DB_NAME]
  );
  
  console.log(`✓ 数据库: ${DB_NAME}`);
  console.log(`  字符集: ${rows[0].DEFAULT_CHARACTER_SET_NAME}`);
  console.log(`  排序规则: ${rows[0].DEFAULT_COLLATION_NAME}\n`);
  
  await connection.end();
}

/**
 * 创建表结构
 */
async function createTables(config) {
  console.log('[3/4] 创建表结构...');
  
  const schemaPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  const connection = await mysql.createConnection({
    ...config,
    database: DB_NAME,
    multipleStatements: true
  });
  
  // 直接执行整个SQL文件（使用multipleStatements）
  await connection.query(schemaSql);
  
  const [tables] = await connection.query('SHOW TABLES');
  console.log(`✓ 创建了 ${tables.length} 张表\n`);
  
  await connection.end();
}

/**
 * 插入测试数据
 */
async function insertTestData(config) {
  console.log('[4/4] 插入测试数据...');
  
  const testDataPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'test-data.sql');
  const testDataSql = fs.readFileSync(testDataPath, 'utf8');
  
  const connection = await mysql.createConnection({
    ...config,
    database: DB_NAME,
    multipleStatements: true
  });
  
  await connection.query(testDataSql);
  
  const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
  const [classes] = await connection.query('SELECT COUNT(*) as count FROM classes');
  const [assignments] = await connection.query('SELECT COUNT(*) as count FROM assignments');
  const [questions] = await connection.query('SELECT COUNT(*) as count FROM questions');
  const [knowledgePoints] = await connection.query('SELECT COUNT(*) as count FROM knowledge_points');
  const [exerciseBank] = await connection.query('SELECT COUNT(*) as count FROM exercise_bank');
  
  console.log('✓ 测试数据统计:');
  console.log(`  用户: ${users[0].count} 人 (3教师 + 30学生 + 10家长)`);
  console.log(`  班级: ${classes[0].count} 个`);
  console.log(`  作业: ${assignments[0].count} 份`);
  console.log(`  题目: ${questions[0].count} 道`);
  console.log(`  知识点: ${knowledgePoints[0].count} 个`);
  console.log(`  题库: ${exerciseBank[0].count} 道\n`);
  
  await connection.end();
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('  智慧教育学习平台');
  console.log('  数据库快速设置');
  console.log('========================================\n');
  
  try {
    // [1/4] 查找可用的MySQL配置
    console.log('[1/4] 测试MySQL连接...');
    const config = await findWorkingConfig();
    
    if (!config) {
      console.error('✗ 无法连接到MySQL\n');
      console.error('请确保:');
      console.error('1. MySQL服务已在Navicat中启动');
      console.error('2. 使用以下任一配置:');
      console.error('   - root用户无密码');
      console.error('   - root用户密码为 root');
      console.error('   - root用户密码为 123456\n');
      console.error('如果使用其他密码，请运行: node backend/scripts/setup-interactive.cjs\n');
      process.exit(1);
    }
    
    // [2/4] 创建数据库
    await createDatabase(config);
    
    // [3/4] 创建表结构
    await createTables(config);
    
    // [4/4] 插入测试数据
    await insertTestData(config);
    
    // 完成
    console.log('========================================');
    console.log('  数据库设置完成！');
    console.log('========================================\n');
    
    console.log('现在可以在Navicat中查看数据库:');
    console.log(`  数据库名: ${DB_NAME}`);
    console.log('  字符集: utf8mb4');
    console.log('  表数量: 14张\n');
    
    // 保存配置
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `# 数据库配置
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_NAME=${DB_NAME}
DB_CHARSET=utf8mb4
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✓ 配置已保存到: backend/.env\n`);
    
    console.log('下一步: 运行字符集测试');
    console.log('  node backend/tests/run-charset-test.cjs\n');
    
  } catch (error) {
    console.error('\n✗ 设置失败:', error.message);
    console.error('\n详细错误:', error);
    process.exit(1);
  }
}

// 运行
main();
