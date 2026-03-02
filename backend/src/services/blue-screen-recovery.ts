/**
 * 蓝屏恢复模块
 * Blue Screen Recovery Module
 * 功能：检测蓝屏痕迹、恢复代码、修复数据库、重启服务
 * 需求：10.9
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 恢复配置
const RECOVERY_CONFIG = {
  LOG_DIR: path.join(__dirname, '../../logs'),
  LOG_FILE: 'blue-screen-recovery.log',
  TEMP_DIR: os.tmpdir(),
  ABNORMAL_SHUTDOWN_FLAG: path.join(os.tmpdir(), 'abnormal_shutdown.flag'),
  RECOVERY_COMPLETED_FLAG: path.join(os.tmpdir(), 'recovery_completed.flag'),
  BACKUP_DIR: path.join(__dirname, '../../../docs/sql/backup'),
  LOW_RESOURCE_MODE: {
    NODE_MAX_MEMORY: 2048, // MB
    CARGO_BUILD_JOBS: 1,
    PROCESS_PRIORITY: 'low'
  }
};

// 蓝屏检测结果
interface BlueScreenDetection {
  detected: boolean;
  traces: string[];
  timestamp: Date;
}

// 恢复状态
interface RecoveryStatus {
  step: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

// 恢复结果
interface RecoveryResult {
  success: boolean;
  steps: RecoveryStatus[];
  startTime: Date;
  endTime: Date;
  duration: number; // 毫秒
}

/**
 * 记录恢复日志
 */
function logRecovery(message: string): void {
  // 确保日志目录存在
  if (!fs.existsSync(RECOVERY_CONFIG.LOG_DIR)) {
    fs.mkdirSync(RECOVERY_CONFIG.LOG_DIR, { recursive: true });
  }

  const logPath = path.join(RECOVERY_CONFIG.LOG_DIR, RECOVERY_CONFIG.LOG_FILE);
  const logEntry = `[${new Date().toISOString()}] ${message}\n`;

  fs.appendFileSync(logPath, logEntry, 'utf8');
  console.log(message);
}

/**
 * 检测蓝屏痕迹
 */
export async function detectBlueScreenTraces(): Promise<BlueScreenDetection> {
  const traces: string[] = [];
  
  logRecovery('开始检测蓝屏痕迹...');

  try {
    // 1. 检查Windows事件日志（系统崩溃事件）
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync(
          'wevtutil qe System /c:1 /rd:true /f:text /q:"*[System[(EventID=1001 or EventID=6008)]]"',
          { timeout: 5000 }
        );
        if (stdout && stdout.trim().length > 0) {
          traces.push('Windows事件日志中发现系统崩溃记录');
          logRecovery('✓ 检测到系统崩溃事件');
        }
      } catch (error) {
        // 事件日志查询失败不影响继续检测
      }

      // 2. 检查内存转储文件
      const dumpFiles = [
        'C:\\Windows\\MEMORY.DMP',
        'C:\\Windows\\Minidump'
      ];

      for (const dumpPath of dumpFiles) {
        if (fs.existsSync(dumpPath)) {
          const stats = fs.statSync(dumpPath);
          // 检查文件是否在最近24小时内创建
          const hoursSinceCreation = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
          if (hoursSinceCreation < 24) {
            traces.push(`发现最近的内存转储文件: ${dumpPath}`);
            logRecovery(`✓ 发现内存转储文件: ${dumpPath}`);
          }
        }
      }
    }

    // 3. 检查异常关机标记
    if (fs.existsSync(RECOVERY_CONFIG.ABNORMAL_SHUTDOWN_FLAG)) {
      traces.push('发现异常关机标记文件');
      logRecovery('✓ 发现异常关机标记');
    }

    // 4. 检查进程异常终止记录
    const crashLogPath = path.join(RECOVERY_CONFIG.LOG_DIR, 'crash.log');
    if (fs.existsSync(crashLogPath)) {
      const stats = fs.statSync(crashLogPath);
      const hoursSinceModification = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      if (hoursSinceModification < 24) {
        traces.push('发现最近的崩溃日志');
        logRecovery('✓ 发现崩溃日志');
      }
    }

    const detected = traces.length > 0;
    
    if (detected) {
      logRecovery(`⚠️ 检测到 ${traces.length} 个蓝屏痕迹`);
    } else {
      logRecovery('ℹ️ 未检测到明确的蓝屏痕迹');
    }

    return {
      detected,
      traces,
      timestamp: new Date()
    };
  } catch (error) {
    logRecovery(`✗ 蓝屏检测过程出错: ${error}`);
    return {
      detected: false,
      traces: [],
      timestamp: new Date()
    };
  }
}

/**
 * 恢复代码到最新状态
 */
async function recoverCodeToLatestState(): Promise<RecoveryStatus> {
  logRecovery('开始恢复代码到最新状态...');

  try {
    // 检查Git是否可用
    try {
      await execAsync('git --version', { timeout: 3000 });
    } catch {
      return {
        step: 'code_recovery',
        success: true,
        message: 'Git未安装，跳过代码恢复',
        timestamp: new Date()
      };
    }

    const projectRoot = path.join(__dirname, '../../..');

    // 检查是否是Git仓库
    const gitDir = path.join(projectRoot, '.git');
    if (!fs.existsSync(gitDir)) {
      return {
        step: 'code_recovery',
        success: true,
        message: '非Git仓库，跳过代码恢复',
        timestamp: new Date()
      };
    }

    // 暂存当前更改
    try {
      await execAsync('git add -A', { cwd: projectRoot, timeout: 10000 });
      await execAsync(
        `git stash save "Auto-stash before recovery - ${new Date().toISOString()}"`,
        { cwd: projectRoot, timeout: 10000 }
      );
      logRecovery('✓ 当前更改已暂存');
    } catch (error) {
      logRecovery('⚠️ 暂存更改失败，继续恢复流程');
    }

    // 拉取最新代码
    try {
      await execAsync('git pull origin main', { cwd: projectRoot, timeout: 30000 });
      logRecovery('✓ 代码已更新到最新版本');
    } catch (error) {
      logRecovery('⚠️ 代码拉取失败，使用本地版本');
    }

    // 恢复暂存的更改
    try {
      await execAsync('git stash pop', { cwd: projectRoot, timeout: 10000 });
      logRecovery('✓ 暂存的更改已恢复');
    } catch {
      // 如果没有暂存内容，忽略错误
    }

    // 清理临时文件和缓存
    const cacheDirs = [
      path.join(projectRoot, 'backend/node_modules/.cache'),
      path.join(projectRoot, 'rust-service/target/debug'),
      path.join(projectRoot, 'python-ai/__pycache__')
    ];

    for (const cacheDir of cacheDirs) {
      if (fs.existsSync(cacheDir)) {
        try {
          fs.rmSync(cacheDir, { recursive: true, force: true });
          logRecovery(`✓ 清理缓存: ${path.basename(cacheDir)}`);
        } catch (error) {
          logRecovery(`⚠️ 清理缓存失败: ${cacheDir}`);
        }
      }
    }

    return {
      step: 'code_recovery',
      success: true,
      message: '代码恢复完成',
      timestamp: new Date()
    };
  } catch (error) {
    logRecovery(`✗ 代码恢复失败: ${error}`);
    return {
      step: 'code_recovery',
      success: false,
      message: `代码恢复失败: ${error}`,
      timestamp: new Date()
    };
  }
}

/**
 * 修复数据库完整性
 */
async function repairDatabaseIntegrity(): Promise<RecoveryStatus> {
  logRecovery('开始修复数据库完整性...');

  try {
    // 检查MySQL是否运行
    let mysqlRunning = false;
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq mysqld.exe"', { timeout: 3000 });
        mysqlRunning = stdout.includes('mysqld.exe');
      } else {
        const { stdout } = await execAsync('pgrep mysqld', { timeout: 3000 });
        mysqlRunning = stdout.trim().length > 0;
      }
    } catch {
      mysqlRunning = false;
    }

    // 如果MySQL未运行，尝试启动
    if (!mysqlRunning) {
      logRecovery('MySQL未运行，尝试启动...');
      try {
        if (process.platform === 'win32') {
          await execAsync('net start MySQL80', { timeout: 10000 });
        } else {
          await execAsync('sudo service mysql start', { timeout: 10000 });
        }
        logRecovery('✓ MySQL服务已启动');
        // 等待MySQL完全启动
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        logRecovery('⚠️ MySQL启动失败，跳过数据库修复');
        return {
          step: 'database_repair',
          success: false,
          message: 'MySQL启动失败',
          timestamp: new Date()
        };
      }
    }

    // 测试数据库连接
    try {
      await execAsync('mysql -u root -e "SELECT 1"', { timeout: 5000 });
      logRecovery('✓ 数据库连接正常');
    } catch (error) {
      logRecovery('✗ 数据库连接失败');
      return {
        step: 'database_repair',
        success: false,
        message: '数据库连接失败',
        timestamp: new Date()
      };
    }

    // 修复所有表
    const tables = [
      'users', 'classes', 'class_students', 'parent_students',
      'assignments', 'questions', 'submissions', 'answers',
      'knowledge_points', 'student_weak_points', 'exercise_bank',
      'qa_records', 'notifications', 'system_logs'
    ];

    const repairSQL = `USE edu_education_platform; REPAIR TABLE ${tables.join(', ')};`;
    try {
      await execAsync(`mysql -u root -e "${repairSQL}"`, { timeout: 30000 });
      logRecovery('✓ 数据库表修复完成');
    } catch (error) {
      logRecovery(`⚠️ 表修复失败: ${error}`);
    }

    // 优化表
    const optimizeSQL = `USE edu_education_platform; OPTIMIZE TABLE ${tables.slice(0, 5).join(', ')};`;
    try {
      await execAsync(`mysql -u root -e "${optimizeSQL}"`, { timeout: 30000 });
      logRecovery('✓ 数据库表优化完成');
    } catch (error) {
      logRecovery(`⚠️ 表优化失败: ${error}`);
    }

    // 刷新权限
    try {
      await execAsync('mysql -u root -e "FLUSH PRIVILEGES;"', { timeout: 5000 });
      logRecovery('✓ 数据库权限已刷新');
    } catch (error) {
      logRecovery(`⚠️ 权限刷新失败: ${error}`);
    }

    // 验证字符集
    try {
      const { stdout } = await execAsync(
        'mysql -u root -e "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=\'edu_education_platform\';"',
        { timeout: 5000 }
      );
      if (stdout.includes('utf8mb4')) {
        logRecovery('✓ 字符集配置正确');
      }
    } catch (error) {
      logRecovery(`⚠️ 字符集验证失败: ${error}`);
    }

    return {
      step: 'database_repair',
      success: true,
      message: '数据库修复完成',
      timestamp: new Date()
    };
  } catch (error) {
    logRecovery(`✗ 数据库修复失败: ${error}`);
    return {
      step: 'database_repair',
      success: false,
      message: `数据库修复失败: ${error}`,
      timestamp: new Date()
    };
  }
}

/**
 * 重启所有服务（低资源模式）
 */
async function restartServicesInLowResourceMode(): Promise<RecoveryStatus> {
  logRecovery('开始重启所有服务（低资源模式）...');

  try {
    // 停止现有服务
    logRecovery('停止现有服务...');
    const ports = [3000, 5000, 8080, 5173];
    
    for (const port of ports) {
      try {
        if (process.platform === 'win32') {
          const { stdout } = await execAsync(
            `netstat -ano | findstr :${port} | findstr LISTENING`,
            { timeout: 3000 }
          );
          const lines = stdout.trim().split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(parseInt(pid))) {
              await execAsync(`taskkill /F /PID ${pid}`, { timeout: 3000 });
              logRecovery(`✓ 停止端口 ${port} 上的进程 (PID: ${pid})`);
            }
          }
        } else {
          await execAsync(`lsof -ti:${port} | xargs kill -9`, { timeout: 3000 });
          logRecovery(`✓ 停止端口 ${port} 上的进程`);
        }
      } catch {
        // 端口未被占用，继续
      }
    }

    // 设置低资源模式环境变量
    process.env.NODE_OPTIONS = `--max-old-space-size=${RECOVERY_CONFIG.LOW_RESOURCE_MODE.NODE_MAX_MEMORY}`;
    process.env.CARGO_BUILD_JOBS = String(RECOVERY_CONFIG.LOW_RESOURCE_MODE.CARGO_BUILD_JOBS);
    process.env.PYTHONOPTIMIZE = '1';
    process.env.RUST_BACKTRACE = '0';

    logRecovery('✓ 低资源模式已配置');
    logRecovery(`  - Node.js内存限制: ${RECOVERY_CONFIG.LOW_RESOURCE_MODE.NODE_MAX_MEMORY}MB`);
    logRecovery(`  - Rust编译单核模式`);
    logRecovery(`  - Python优化模式`);

    // 启动服务（这里只记录，实际启动由外部脚本完成）
    logRecovery('服务将在低资源模式下启动...');
    logRecovery('请使用一键启动脚本或手动启动各服务');

    return {
      step: 'service_restart',
      success: true,
      message: '服务重启配置完成',
      timestamp: new Date()
    };
  } catch (error) {
    logRecovery(`✗ 服务重启失败: ${error}`);
    return {
      step: 'service_restart',
      success: false,
      message: `服务重启失败: ${error}`,
      timestamp: new Date()
    };
  }
}

/**
 * 执行完整的蓝屏恢复流程
 */
export async function performBlueScreenRecovery(): Promise<RecoveryResult> {
  const startTime = new Date();
  const steps: RecoveryStatus[] = [];

  logRecovery('========================================');
  logRecovery('开始蓝屏恢复流程');
  logRecovery('========================================');

  // 步骤1：检测蓝屏痕迹
  const detection = await detectBlueScreenTraces();
  steps.push({
    step: 'detection',
    success: true,
    message: detection.detected 
      ? `检测到 ${detection.traces.length} 个蓝屏痕迹` 
      : '未检测到蓝屏痕迹',
    timestamp: new Date()
  });

  // 步骤2：恢复代码
  const codeRecovery = await recoverCodeToLatestState();
  steps.push(codeRecovery);

  // 步骤3：修复数据库
  const dbRepair = await repairDatabaseIntegrity();
  steps.push(dbRepair);

  // 步骤4：重启服务
  const serviceRestart = await restartServicesInLowResourceMode();
  steps.push(serviceRestart);

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  // 判断整体是否成功
  const success = steps.every(step => step.success);

  // 创建恢复完成标记
  if (success) {
    fs.writeFileSync(
      RECOVERY_CONFIG.RECOVERY_COMPLETED_FLAG,
      `Recovery completed at ${endTime.toISOString()}\n`,
      'utf8'
    );

    // 删除异常关机标记
    if (fs.existsSync(RECOVERY_CONFIG.ABNORMAL_SHUTDOWN_FLAG)) {
      fs.unlinkSync(RECOVERY_CONFIG.ABNORMAL_SHUTDOWN_FLAG);
    }
  }

  logRecovery('========================================');
  logRecovery(success ? '✓ 蓝屏恢复完成' : '✗ 蓝屏恢复部分失败');
  logRecovery(`耗时: ${duration}ms`);
  logRecovery('========================================');

  return {
    success,
    steps,
    startTime,
    endTime,
    duration
  };
}

/**
 * 创建异常关机标记（在系统启动时调用）
 */
export function createAbnormalShutdownFlag(): void {
  fs.writeFileSync(
    RECOVERY_CONFIG.ABNORMAL_SHUTDOWN_FLAG,
    `Created at ${new Date().toISOString()}\n`,
    'utf8'
  );
  logRecovery('✓ 异常关机标记已创建');
}

/**
 * 删除异常关机标记（在正常关机时调用）
 */
export function removeAbnormalShutdownFlag(): void {
  if (fs.existsSync(RECOVERY_CONFIG.ABNORMAL_SHUTDOWN_FLAG)) {
    fs.unlinkSync(RECOVERY_CONFIG.ABNORMAL_SHUTDOWN_FLAG);
    logRecovery('✓ 异常关机标记已删除');
  }
}

/**
 * 检查是否需要执行恢复
 */
export async function shouldPerformRecovery(): Promise<boolean> {
  const detection = await detectBlueScreenTraces();
  return detection.detected;
}
