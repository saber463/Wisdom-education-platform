/**
 * 轻量级MySQL自动安装脚本 - Node.js版本
 * 下载、解压、初始化和启动MySQL 8.0
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

// MySQL配置
const MYSQL_CONFIG = {
  version: '8.0.35',
  installDir: 'C:\\mysql-portable',
  dataDir: 'C:\\mysql-portable\\data',
  port: 3306,
  downloadUrls: [
    'https://cdn.mysql.com/Downloads/MySQL-8.0/mysql-8.0.35-winx64.zip',
    'https://mirrors.tuna.tsinghua.edu.cn/mysql/downloads/MySQL-8.0/mysql-8.0.35-winx64.zip'
  ]
};

/**
 * 检查MySQL是否已安装
 */
function isMySQLInstalled() {
  const mysqldPath = path.join(MYSQL_CONFIG.installDir, 'bin', 'mysqld.exe');
  return fs.existsSync(mysqldPath);
}

/**
 * 创建目录
 */
function createDirectories() {
  console.log('[1/6] 创建MySQL目录...');
  
  if (!fs.existsSync(MYSQL_CONFIG.installDir)) {
    fs.mkdirSync(MYSQL_CONFIG.installDir, { recursive: true });
  }
  
  if (!fs.existsSync(MYSQL_CONFIG.dataDir)) {
    fs.mkdirSync(MYSQL_CONFIG.dataDir, { recursive: true });
  }
  
  console.log('✓ 目录创建完成');
}

/**
 * 下载MySQL
 */
async function downloadMySQL() {
  console.log('[2/6] 下载MySQL 8.0...');
  console.log('文件大小约200MB，请耐心等待...');
  
  const zipPath = path.join(MYSQL_CONFIG.installDir, 'mysql.zip');
  
  // 尝试多个下载源
  for (const url of MYSQL_CONFIG.downloadUrls) {
    try {
      console.log(`正在从 ${url} 下载...`);
      
      // 使用PowerShell下载（更可靠）
      const psCommand = `
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;
        $ProgressPreference = 'SilentlyContinue';
        Invoke-WebRequest -Uri '${url}' -OutFile '${zipPath}' -TimeoutSec 300
      `;
      
      execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
      
      console.log('✓ 下载完成');
      return zipPath;
    } catch (error) {
      console.log(`✗ 从 ${url} 下载失败，尝试下一个源...`);
    }
  }
  
  throw new Error('所有下载源均失败');
}

/**
 * 解压MySQL
 */
function extractMySQL(zipPath) {
  console.log('[3/6] 解压MySQL...');
  
  try {
    // 使用PowerShell解压
    const psCommand = `Expand-Archive -Path '${zipPath}' -DestinationPath '${MYSQL_CONFIG.installDir}' -Force`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
    
    // 移动文件到根目录
    const extractedDirs = fs.readdirSync(MYSQL_CONFIG.installDir)
      .filter(name => name.startsWith('mysql-') && fs.statSync(path.join(MYSQL_CONFIG.installDir, name)).isDirectory());
    
    if (extractedDirs.length > 0) {
      const extractedDir = path.join(MYSQL_CONFIG.installDir, extractedDirs[0]);
      const files = fs.readdirSync(extractedDir);
      
      files.forEach(file => {
        const srcPath = path.join(extractedDir, file);
        const destPath = path.join(MYSQL_CONFIG.installDir, file);
        
        if (fs.existsSync(destPath)) {
          if (fs.statSync(destPath).isDirectory()) {
            fs.rmSync(destPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(destPath);
          }
        }
        
        fs.renameSync(srcPath, destPath);
      });
      
      fs.rmSync(extractedDir, { recursive: true, force: true });
    }
    
    // 删除ZIP文件
    fs.unlinkSync(zipPath);
    
    console.log('✓ 解压完成');
  } catch (error) {
    throw new Error(`解压失败: ${error.message}`);
  }
}

/**
 * 创建MySQL配置文件
 */
function createMySQLConfig() {
  console.log('[4/6] 创建MySQL配置文件...');
  
  const configContent = `[mysqld]
# 基本配置
port=${MYSQL_CONFIG.port}
basedir=${MYSQL_CONFIG.installDir}
datadir=${MYSQL_CONFIG.dataDir}
character-set-server=utf8mb4
collation-server=utf8mb4_general_ci
default-storage-engine=INNODB

# 性能优化（低资源模式）
max_connections=50
innodb_buffer_pool_size=128M
innodb_log_file_size=32M

# 安全配置
skip-name-resolve
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION

[mysql]
default-character-set=utf8mb4

[client]
port=${MYSQL_CONFIG.port}
default-character-set=utf8mb4
`;
  
  const configPath = path.join(MYSQL_CONFIG.installDir, 'my.ini');
  fs.writeFileSync(configPath, configContent);
  
  console.log('✓ 配置文件创建完成');
}

/**
 * 初始化MySQL数据库
 */
function initializeMySQL() {
  console.log('[5/6] 初始化MySQL数据库...');
  
  const mysqldPath = path.join(MYSQL_CONFIG.installDir, 'bin', 'mysqld.exe');
  
  try {
    execSync(`"${mysqldPath}" --initialize-insecure --console`, {
      cwd: path.join(MYSQL_CONFIG.installDir, 'bin'),
      stdio: 'inherit'
    });
    
    console.log('✓ 初始化完成');
  } catch (error) {
    throw new Error(`初始化失败: ${error.message}`);
  }
}

/**
 * 启动MySQL服务
 */
function startMySQL() {
  console.log('[6/6] 启动MySQL服务...');
  
  const mysqldPath = path.join(MYSQL_CONFIG.installDir, 'bin', 'mysqld.exe');
  
  // 检查端口是否被占用
  try {
    const netstatOutput = execSync('netstat -ano', { encoding: 'utf8' });
    if (netstatOutput.includes(`:${MYSQL_CONFIG.port}`)) {
      console.log(`警告: 端口${MYSQL_CONFIG.port}已被占用，尝试使用备用端口3307...`);
      MYSQL_CONFIG.port = 3307;
    }
  } catch (error) {
    // 忽略netstat错误
  }
  
  // 启动MySQL（后台进程）
  const mysqld = spawn(mysqldPath, ['--console', `--port=${MYSQL_CONFIG.port}`], {
    cwd: path.join(MYSQL_CONFIG.installDir, 'bin'),
    detached: true,
    stdio: 'ignore'
  });
  
  mysqld.unref();
  
  console.log('等待MySQL启动...');
  
  // 等待5秒
  return new Promise((resolve) => {
    setTimeout(() => {
      // 测试连接
      const mysqlPath = path.join(MYSQL_CONFIG.installDir, 'bin', 'mysql.exe');
      try {
        execSync(`"${mysqlPath}" -u root -e "SELECT 1;"`, { stdio: 'pipe' });
        console.log('✓ MySQL启动成功');
        resolve(true);
      } catch (error) {
        console.log('✗ MySQL启动失败');
        console.log('请检查日志文件:', path.join(MYSQL_CONFIG.dataDir, '*.err'));
        resolve(false);
      }
    }, 5000);
  });
}

/**
 * 主安装函数
 */
async function installMySQL() {
  console.log('========================================');
  console.log('  轻量级MySQL 8.0自动安装');
  console.log('========================================\n');
  
  try {
    // 检查是否已安装
    if (isMySQLInstalled()) {
      console.log('MySQL已安装在:', MYSQL_CONFIG.installDir);
      console.log('跳过安装步骤\n');
      
      const started = await startMySQL();
      if (!started) {
        throw new Error('MySQL启动失败');
      }
    } else {
      // 执行安装步骤
      createDirectories();
      const zipPath = await downloadMySQL();
      extractMySQL(zipPath);
      createMySQLConfig();
      initializeMySQL();
      
      const started = await startMySQL();
      if (!started) {
        throw new Error('MySQL启动失败');
      }
    }
    
    console.log('\n========================================');
    console.log('  MySQL安装完成！');
    console.log(`  安装路径: ${MYSQL_CONFIG.installDir}`);
    console.log(`  端口: ${MYSQL_CONFIG.port}`);
    console.log('  用户: root');
    console.log('  密码: 无');
    console.log('========================================\n');
    
    return MYSQL_CONFIG;
  } catch (error) {
    console.error('\n✗ 安装失败:', error.message);
    throw error;
  }
}

// 运行主函数
if (require.main === module) {
  installMySQL()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  installMySQL,
  isMySQLInstalled,
  MYSQL_CONFIG
};
