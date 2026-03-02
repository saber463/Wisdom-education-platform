/**
 * 独立运行的数据库字符集测试脚本
 * 不依赖Jest，可直接运行
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const DB_NAME = 'edu_education_platform';
const EXPECTED_CHARSET = 'utf8mb4';
const EXPECTED_COLLATE = 'utf8mb4_general_ci';

// 从.env文件读取配置
function loadEnvConfig() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    };
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^DB_(\w+)=(.*)$/);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      config[key] = value;
    }
  });
  
  return {
    host: config.host || 'localhost',
    port: parseInt(config.port) || 3306,
    user: config.user || 'root',
    password: config.password || ''
  };
}

/**
 * 创建数据库连接
 */
async function createConnection(database = null) {
  const config = loadEnvConfig();
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: database,
    charset: 'utf8mb4'
  });
}

/**
 * 查询数据库字符集配置
 */
async function getDatabaseCharset(dbName) {
  let connection;
  try {
    connection = await createConnection();
    const [rows] = await connection.execute(
      'SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return {
      charset: rows[0].DEFAULT_CHARACTER_SET_NAME,
      collate: rows[0].DEFAULT_COLLATION_NAME
    };
  } catch (error) {
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * 创建测试数据库
 */
async function createTestDatabase(dbName, charset, collate) {
  let connection;
  try {
    connection = await createConnection();
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET ${charset} COLLATE ${collate}`
    );
    return true;
  } catch (error) {
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * 删除测试数据库
 */
async function dropTestDatabase(dbName) {
  let connection;
  try {
    connection = await createConnection();
    await connection.execute(`DROP DATABASE IF EXISTS ${dbName}`);
    return true;
  } catch (error) {
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * 运行测试
 */
async function runTests() {
  console.log('========================================');
  console.log('  数据库字符集配置属性测试');
  console.log('  Property 47: 数据库字符集配置正确性');
  console.log('  Validates: Requirements 11.4');
  console.log('========================================\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // 测试1: 检查MySQL连接
  console.log('[测试1] 检查MySQL连接...');
  try {
    const connection = await createConnection();
    await connection.ping();
    await connection.end();
    console.log('✓ MySQL连接成功\n');
    passedTests++;
  } catch (error) {
    console.log('✗ MySQL连接失败:', error.message, '\n');
    failedTests++;
    return { passed: passedTests, failed: failedTests };
  }
  
  // 测试2: 验证主数据库字符集
  console.log('[测试2] 验证主数据库字符集...');
  const config = await getDatabaseCharset(DB_NAME);
  if (config) {
    console.log(`  数据库: ${DB_NAME}`);
    console.log(`  字符集: ${config.charset} (期望: ${EXPECTED_CHARSET})`);
    console.log(`  排序规则: ${config.collate} (期望: ${EXPECTED_COLLATE})`);
    
    if (config.charset === EXPECTED_CHARSET && config.collate === EXPECTED_COLLATE) {
      console.log('✓ 主数据库字符集配置正确\n');
      passedTests++;
    } else {
      console.log('✗ 主数据库字符集配置不正确\n');
      failedTests++;
    }
  } else {
    console.log('✗ 无法查询数据库配置（数据库可能不存在）\n');
    failedTests++;
  }
  
  // 测试3: 属性测试 - 创建多个测试数据库验证字符集
  console.log('[测试3] 属性测试 - 验证字符集配置（10次迭代）...');
  let propertyTestPassed = 0;
  let propertyTestFailed = 0;
  
  for (let i = 1; i <= 10; i++) {
    const testDbName = `test_db_charset_${Date.now()}_${i}`;
    
    try {
      // 创建测试数据库
      const created = await createTestDatabase(testDbName, EXPECTED_CHARSET, EXPECTED_COLLATE);
      if (!created) {
        propertyTestFailed++;
        continue;
      }
      
      // 验证字符集配置
      const testConfig = await getDatabaseCharset(testDbName);
      
      // 清理测试数据库
      await dropTestDatabase(testDbName);
      
      // 验证结果
      if (testConfig && 
          testConfig.charset === EXPECTED_CHARSET && 
          testConfig.collate === EXPECTED_COLLATE) {
        propertyTestPassed++;
      } else {
        propertyTestFailed++;
      }
    } catch (error) {
      await dropTestDatabase(testDbName);
      propertyTestFailed++;
    }
  }
  
  console.log(`  通过: ${propertyTestPassed}/10`);
  console.log(`  失败: ${propertyTestFailed}/10`);
  
  if (propertyTestFailed === 0) {
    console.log('✓ 属性测试通过\n');
    passedTests++;
  } else {
    console.log('✗ 属性测试失败\n');
    failedTests++;
  }
  
  // 测试4: 验证UTF8MB4支持中文
  console.log('[测试4] 验证UTF8MB4支持中文字符...');
  const testDbName = `test_db_chinese_${Date.now()}`;
  
  try {
    // 创建数据库
    await createTestDatabase(testDbName, EXPECTED_CHARSET, EXPECTED_COLLATE);
    
    // 创建连接到测试数据库
    const connection = await createConnection(testDbName);
    
    // 创建测试表
    await connection.execute(`
      CREATE TABLE test_table (
        id INT PRIMARY KEY AUTO_INCREMENT,
        content VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // 插入中文测试数据
    const chineseText = '测试中文字符：智慧教育学习平台';
    await connection.execute(
      'INSERT INTO test_table (content) VALUES (?)',
      [chineseText]
    );
    
    // 查询数据
    const [rows] = await connection.execute('SELECT content FROM test_table LIMIT 1');
    
    await connection.end();
    
    // 清理
    await dropTestDatabase(testDbName);
    
    // 验证
    if (rows.length > 0 && rows[0].content === chineseText) {
      console.log('✓ UTF8MB4正确支持中文字符\n');
      passedTests++;
    } else {
      console.log('✗ UTF8MB4不支持中文字符\n');
      failedTests++;
    }
  } catch (error) {
    await dropTestDatabase(testDbName);
    console.log('✗ 中文字符测试失败:', error.message, '\n');
    failedTests++;
  }
  
  return { passed: passedTests, failed: failedTests };
}

// 运行测试
runTests().then(results => {
  console.log('========================================');
  console.log('  测试结果');
  console.log('========================================');
  console.log(`通过: ${results.passed}`);
  console.log(`失败: ${results.failed}`);
  console.log(`总计: ${results.passed + results.failed}`);
  console.log('========================================\n');
  
  // 退出码
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
