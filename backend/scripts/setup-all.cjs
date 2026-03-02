/**
 * 智慧教育平台 - 完整数据库设置脚本
 * 自动检测、安装、创建数据库和初始化数据
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 导入其他脚本
const { detectNavicat, detectMySQL, createDatabase } = require('./setup-database.cjs');
const { installMySQL, isMySQLInstalled } = require('./install-mysql.cjs');

/**
 * 执行SQL文件
 */
function executeSQLFile(sqlFilePath, dbName = null) {
  try {
    const useDb = dbName ? `USE ${dbName};` : '';
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const fullSQL = useDb + sqlContent;
    
    // 将SQL写入临时文件
    const tempFile = path.join(__dirname, 'temp.sql');
    fs.writeFileSync(tempFile, fullSQL);
    
    // 执行SQL文件
    execSync(`mysql -u root < "${tempFile}"`, { stdio: 'inherit' });
    
    // 删除临时文件
    fs.unlinkSync(tempFile);
    
    return true;
  } catch (error) {
    console.error('执行SQL文件失败:', error.message);
    return false;
  }
}

/**
 * 主设置函数
 */
async function setupAll() {
  console.log('========================================');
  console.log('  智慧教育学习平台');
  console.log('  数据库完整设置');
  console.log('========================================\n');
  
  try {
    // 步骤1: 检测Navicat
    console.log('[步骤1/5] 检测Navicat...');
    const hasNavicat = detectNavicat();
    console.log(hasNavicat ? '✓ Navicat已安装\n' : '✗ Navicat未安装\n');
    
    // 步骤2: 检测或安装MySQL
    console.log('[步骤2/5] 检测MySQL...');
    if (!detectMySQL()) {
      console.log('✗ MySQL未安装');
      console.log('正在安装轻量级MySQL...\n');
      
      await installMySQL();
      
      // 等待MySQL启动
      console.log('等待MySQL启动...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('✓ MySQL已安装\n');
    }
    
    // 步骤3: 创建数据库
    console.log('[步骤3/5] 创建数据库...');
    createDatabase();
    
    // 步骤4: 创建表结构
    console.log('[步骤4/5] 创建表结构...');
    const schemaPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`表结构文件不存在: ${schemaPath}`);
    }
    
    if (executeSQLFile(schemaPath)) {
      console.log('✓ 表结构创建成功\n');
    } else {
      throw new Error('表结构创建失败');
    }
    
    // 步骤5: 插入测试数据
    console.log('[步骤5/5] 插入测试数据...');
    const testDataPath = path.join(__dirname, '..', '..', 'docs', 'sql', 'test-data.sql');
    
    if (!fs.existsSync(testDataPath)) {
      throw new Error(`测试数据文件不存在: ${testDataPath}`);
    }
    
    if (executeSQLFile(testDataPath)) {
      console.log('✓ 测试数据插入成功\n');
    } else {
      throw new Error('测试数据插入失败');
    }
    
    // 完成
    console.log('========================================');
    console.log('  数据库设置完成！');
    console.log('========================================\n');
    
    console.log('数据库信息:');
    console.log('  数据库名: edu_education_platform');
    console.log('  字符集: utf8mb4');
    console.log('  排序规则: utf8mb4_general_ci');
    console.log('  表数量: 14');
    console.log('  测试用户: 3个教师 + 30个学生 + 10个家长');
    console.log('  测试数据: 5个班级 + 20份作业 + 100道题目\n');
    
    // 运行字符集测试
    console.log('运行数据库字符集测试...');
    try {
      execSync('node backend/tests/run-charset-test.cjs', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠ 字符集测试失败，但数据库已创建');
    }
    
  } catch (error) {
    console.error('\n✗ 设置失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  setupAll()
    .then(() => {
      console.log('设置完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('设置失败:', error);
      process.exit(1);
    });
}

module.exports = {
  setupAll,
  executeSQLFile
};
