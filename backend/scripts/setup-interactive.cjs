/**
 * 交互式数据库设置脚本
 * 会提示输入MySQL密码
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DB_NAME = 'edu_education_platform';

/**
 * 获取用户输入
 */
function getUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * 测试MySQL连接
 */
async function testConnection(config) {
  try {
    const connection = await mysql.createConnection(config);
    await connection.ping();
    await connection.end();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 创建数据库
 */
async function createDatabase(config) {
  console.log('\n[2/4] 创建数据库...');
  
  try {
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
    
    if (rows.length > 0) {
      console.log(`✓ 数据库创建成功: ${DB_NAME}`);
      console.log(`  字符集: ${rows[0].DEFAULT_CHARACTER_SET_NAME}`);
      console.log(`  排序规则: ${rows[0].DEFAULT_COLLATION_NAME}`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('✗ 数据库创建失败:', error.message);
    return false;
  }
}

/**
 * 创建表结构
 */
async function createTables(config) {
  console.log('\n[3/4] 创建表结构...');
  
  try {
    const schemaPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`表结构文件不存在: ${schemaPath}`);
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    const connection = await mysql.createConnection({
      ...config,
      database: DB_NAME
    });
    
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    for (const statement of statements) {
      if (statement.toUpperCase().includes('CREATE TABLE') || 
          statement.toUpperCase().includes('SET ')) {
        try {
          await connection.query(statement);
        } catch (err) {
          // 忽略已存在的表
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }
    }
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✓ 表结构创建成功 (${tables.length}张表)`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('✗ 表结构创建失败:', error.message);
    return false;
  }
}

/**
 * 插入测试数据
 */
async function insertTestData(config) {
  console.log('\n[4/4] 插入测试数据...');
  
  try {
    const testDataPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'test-data.sql');
    
    if (!fs.existsSync(testDataPath)) {
      throw new Error(`测试数据文件不存在: ${testDataPath}`);
    }
    
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
    
    console.log('✓ 测试数据插入成功');
    console.log(`  用户: ${users[0].count}人`);
    console.log(`  班级: ${classes[0].count}个`);
    console.log(`  作业: ${assignments[0].count}份`);
    console.log(`  题目: ${questions[0].count}道`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('✗ 测试数据插入失败:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('  智慧教育学习平台');
  console.log('  数据库设置向导');
  console.log('========================================\n');
  
  try {
    // 获取MySQL配置
    console.log('请输入MySQL连接信息:\n');
    
    const host = await getUserInput('主机地址 (默认: localhost): ') || 'localhost';
    const port = await getUserInput('端口 (默认: 3306): ') || '3306';
    const user = await getUserInput('用户名 (默认: root): ') || 'root';
    const password = await getUserInput('密码 (无密码请直接回车): ') || '';
    
    const config = {
      host,
      port: parseInt(port),
      user,
      password,
      multipleStatements: true
    };
    
    // 测试连接
    console.log('\n[1/4] 测试MySQL连接...');
    const connected = await testConnection(config);
    
    if (!connected) {
      console.error('✗ 无法连接到MySQL');
      console.error('\n请检查:');
      console.error('1. MySQL服务是否在Navicat中启动');
      console.error('2. 主机地址和端口是否正确');
      console.error('3. 用户名和密码是否正确\n');
      process.exit(1);
    }
    
    console.log(`✓ MySQL连接成功 (${host}:${port})`);
    
    // 创建数据库
    const dbCreated = await createDatabase(config);
    if (!dbCreated) {
      process.exit(1);
    }
    
    // 创建表结构
    const tablesCreated = await createTables(config);
    if (!tablesCreated) {
      process.exit(1);
    }
    
    // 插入测试数据
    const dataInserted = await insertTestData(config);
    if (!dataInserted) {
      process.exit(1);
    }
    
    // 完成
    console.log('\n========================================');
    console.log('  数据库设置完成！');
    console.log('========================================\n');
    
    console.log('数据库信息:');
    console.log(`  数据库名: ${DB_NAME}`);
    console.log('  字符集: utf8mb4');
    console.log('  排序规则: utf8mb4_general_ci');
    console.log(`  连接: ${user}@${host}:${port}`);
    console.log('  表数量: 14张\n');
    
    console.log('你现在可以在Navicat中查看数据库！\n');
    
    // 保存配置到.env文件
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `# 数据库配置
DB_HOST=${host}
DB_PORT=${port}
DB_USER=${user}
DB_PASSWORD=${password}
DB_NAME=${DB_NAME}
DB_CHARSET=utf8mb4
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✓ 数据库配置已保存到: ${envPath}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 设置失败:', error.message);
    process.exit(1);
  }
}

// 运行
main();
