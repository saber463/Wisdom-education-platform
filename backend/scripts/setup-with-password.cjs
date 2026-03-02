/**
 * 使用指定密码设置数据库
 * MySQL密码: 123456
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  multipleStatements: true
};

const DB_NAME = 'edu_education_platform';

/**
 * 测试MySQL连接
 */
async function testConnection() {
  console.log('[1/4] 测试MySQL连接...');
  
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    await connection.ping();
    console.log('✓ MySQL连接成功 (localhost:3306, 用户: root)\n');
    await connection.end();
    return true;
  } catch (error) {
    console.error('✗ 无法连接到MySQL');
    console.error('错误:', error.message);
    console.error('\n请检查:');
    console.error('1. MySQL服务是否在Navicat中启动');
    console.error('2. 端口是否为3306');
    console.error('3. root用户密码是否为123456\n');
    return false;
  }
}

/**
 * 创建数据库
 */
async function createDatabase() {
  console.log('[2/4] 创建数据库...');
  
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    
    // 创建数据库
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${DB_NAME} 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_general_ci`
    );
    
    // 验证字符集
    const [rows] = await connection.query(
      `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
       FROM information_schema.SCHEMATA 
       WHERE SCHEMA_NAME = ?`,
      [DB_NAME]
    );
    
    if (rows.length > 0) {
      console.log(`✓ 数据库创建成功: ${DB_NAME}`);
      console.log(`  字符集: ${rows[0].DEFAULT_CHARACTER_SET_NAME}`);
      console.log(`  排序规则: ${rows[0].DEFAULT_COLLATION_NAME}\n`);
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
async function createTables() {
  console.log('[3/4] 创建表结构...');
  
  try {
    const schemaPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`表结构文件不存在: ${schemaPath}`);
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    const connection = await mysql.createConnection({
      ...DB_CONFIG,
      database: DB_NAME
    });
    
    // 执行SQL（分割成多个语句）
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    let tableCount = 0;
    for (const statement of statements) {
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        try {
          await connection.query(statement);
          tableCount++;
        } catch (err) {
          // 忽略已存在的表
          if (!err.message.includes('already exists')) {
            console.error('执行SQL出错:', statement.substring(0, 100));
            throw err;
          }
        }
      } else if (statement.toUpperCase().includes('SET ')) {
        await connection.query(statement);
      }
    }
    
    // 验证表数量
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✓ 表结构创建成功 (${tables.length}张表)\n`);
    
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
async function insertTestData() {
  console.log('[4/4] 插入测试数据...');
  
  try {
    const testDataPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'test-data.sql');
    
    if (!fs.existsSync(testDataPath)) {
      throw new Error(`测试数据文件不存在: ${testDataPath}`);
    }
    
    const testDataSql = fs.readFileSync(testDataPath, 'utf8');
    
    const connection = await mysql.createConnection({
      ...DB_CONFIG,
      database: DB_NAME,
      multipleStatements: true
    });
    
    // 执行SQL
    await connection.query(testDataSql);
    
    // 统计数据
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [classes] = await connection.query('SELECT COUNT(*) as count FROM classes');
    const [assignments] = await connection.query('SELECT COUNT(*) as count FROM assignments');
    const [questions] = await connection.query('SELECT COUNT(*) as count FROM questions');
    const [knowledgePoints] = await connection.query('SELECT COUNT(*) as count FROM knowledge_points');
    const [exerciseBank] = await connection.query('SELECT COUNT(*) as count FROM exercise_bank');
    
    console.log('✓ 测试数据插入成功');
    console.log(`  用户: ${users[0].count}人 (3教师 + 30学生 + 10家长)`);
    console.log(`  班级: ${classes[0].count}个`);
    console.log(`  作业: ${assignments[0].count}份`);
    console.log(`  题目: ${questions[0].count}道`);
    console.log(`  知识点: ${knowledgePoints[0].count}个`);
    console.log(`  题库: ${exerciseBank[0].count}道\n`);
    
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
  console.log('  数据库自动设置');
  console.log('========================================\n');
  
  try {
    // 测试连接
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
    
    // 创建数据库
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      process.exit(1);
    }
    
    // 创建表结构
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      process.exit(1);
    }
    
    // 插入测试数据
    const dataInserted = await insertTestData();
    if (!dataInserted) {
      process.exit(1);
    }
    
    // 完成
    console.log('========================================');
    console.log('  数据库设置完成！');
    console.log('========================================\n');
    
    console.log('数据库信息:');
    console.log(`  数据库名: ${DB_NAME}`);
    console.log('  字符集: utf8mb4');
    console.log('  排序规则: utf8mb4_general_ci');
    console.log('  连接: root@localhost:3306');
    console.log('  表数量: 14张\n');
    
    console.log('你现在可以在Navicat中查看数据库！');
    console.log('数据库名: edu_education_platform\n');
    
    // 保存配置到.env文件
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=${DB_NAME}
DB_CHARSET=utf8mb4
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✓ 数据库配置已保存到: backend/.env\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 设置失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行
main();
