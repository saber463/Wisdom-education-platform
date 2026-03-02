/**
 * 数据库设置脚本 - Node.js版本
 * 检测Navicat并创建数据库
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 数据库配置
const DB_CONFIG = {
  name: 'edu_education_platform',
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: ''
};

/**
 * 检测Navicat是否安装
 */
function detectNavicat() {
  console.log('正在检测Navicat安装...');
  
  try {
    const scriptPath = path.join(__dirname, 'detect-navicat.bat');
    execSync(`"${scriptPath}"`, { stdio: 'inherit' });
    console.log('✓ Navicat已安装');
    return true;
  } catch (error) {
    console.log('✗ Navicat未安装');
    return false;
  }
}

/**
 * 检测MySQL是否可用
 */
function detectMySQL() {
  console.log('正在检测MySQL...');
  
  try {
    execSync('mysql --version', { stdio: 'pipe' });
    console.log('✓ MySQL已安装');
    return true;
  } catch (error) {
    console.log('✗ MySQL未安装');
    return false;
  }
}

/**
 * 测试MySQL连接
 */
function testMySQLConnection(user, password) {
  try {
    const passArg = password ? `-p${password}` : '';
    execSync(`mysql -u ${user} ${passArg} -e "SELECT 1;"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 创建数据库
 */
function createDatabase() {
  console.log('\n========================================');
  console.log('  数据库自动创建');
  console.log('========================================\n');
  
  // 检测MySQL
  if (!detectMySQL()) {
    console.error('错误: MySQL未安装');
    console.log('请运行轻量级MySQL安装脚本或手动安装MySQL');
    process.exit(1);
  }
  
  // 测试连接
  console.log('[1/3] 测试MySQL连接...');
  let mysqlUser = 'root';
  let mysqlPass = '';
  
  if (testMySQLConnection('root', '')) {
    console.log('✓ MySQL连接成功 (用户: root, 无密码)');
  } else if (testMySQLConnection('root', 'root')) {
    mysqlPass = 'root';
    console.log('✓ MySQL连接成功 (用户: root, 密码: root)');
  } else {
    console.error('✗ 无法连接到MySQL');
    console.log('请检查MySQL服务是否启动');
    process.exit(1);
  }
  
  // 创建数据库
  console.log('[2/3] 创建数据库...');
  try {
    const passArg = mysqlPass ? `-p${mysqlPass}` : '';
    const createSQL = `CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.name} CHARACTER SET ${DB_CONFIG.charset} COLLATE ${DB_CONFIG.collate};`;
    execSync(`mysql -u ${mysqlUser} ${passArg} -e "${createSQL}"`, { stdio: 'pipe' });
    console.log(`✓ 数据库创建成功: ${DB_CONFIG.name}`);
  } catch (error) {
    console.error('✗ 数据库创建失败:', error.message);
    process.exit(1);
  }
  
  // 验证字符集
  console.log('[3/3] 验证数据库字符集...');
  try {
    const passArg = mysqlPass ? `-p${mysqlPass}` : '';
    const verifySQL = `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='${DB_CONFIG.name}';`;
    const result = execSync(`mysql -u ${mysqlUser} ${passArg} -e "${verifySQL}"`, { encoding: 'utf8' });
    console.log(result);
    
    if (result.includes(DB_CONFIG.charset) && result.includes(DB_CONFIG.collate)) {
      console.log('✓ 字符集配置正确');
    } else {
      console.warn('⚠ 字符集配置可能不正确');
    }
  } catch (error) {
    console.error('✗ 字符集验证失败:', error.message);
  }
  
  console.log('\n========================================');
  console.log('  数据库创建完成！');
  console.log(`  数据库名: ${DB_CONFIG.name}`);
  console.log(`  字符集: ${DB_CONFIG.charset}`);
  console.log(`  排序规则: ${DB_CONFIG.collate}`);
  console.log('========================================\n');
  
  // 保存数据库配置
  const configPath = path.join(__dirname, '..', '.env');
  const envContent = `
# 数据库配置
DB_HOST=${DB_CONFIG.host}
DB_PORT=${DB_CONFIG.port}
DB_USER=${mysqlUser}
DB_PASSWORD=${mysqlPass}
DB_NAME=${DB_CONFIG.name}
DB_CHARSET=${DB_CONFIG.charset}
`;
  
  fs.writeFileSync(configPath, envContent.trim());
  console.log(`✓ 数据库配置已保存到: ${configPath}`);
}

/**
 * 主函数
 */
function main() {
  console.log('智慧教育平台 - 数据库设置\n');
  
  // 检测Navicat
  const hasNavicat = detectNavicat();
  
  if (hasNavicat) {
    console.log('检测到Navicat，将使用Navicat连接创建数据库\n');
  } else {
    console.log('未检测到Navicat，将使用MySQL命令行创建数据库\n');
  }
  
  // 创建数据库
  createDatabase();
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  detectNavicat,
  detectMySQL,
  createDatabase,
  DB_CONFIG
};
