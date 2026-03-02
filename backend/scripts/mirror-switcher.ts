/**
 * 依赖下载镜像切换脚本
 * 功能：Python依赖下载失败时切换到清华镜像，Node.js依赖下载失败时切换到淘宝镜像
 * 需求：10.3, 10.4
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 镜像配置
const MIRRORS = {
  python: {
    default: 'https://pypi.org/simple',
    tsinghua: 'https://pypi.tuna.tsinghua.edu.cn/simple',
    aliyun: 'https://mirrors.aliyun.com/pypi/simple/'
  },
  nodejs: {
    default: 'https://registry.npmjs.org/',
    taobao: 'https://registry.npmmirror.com',
    tencent: 'https://mirrors.cloud.tencent.com/npm/'
  }
};

// 日志文件路径
const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'mirror-switcher.log');

/**
 * 记录日志
 */
function log(message: string): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
  console.log(message);
}

/**
 * 执行命令并捕获错误
 */
function executeCommand(command: string, cwd?: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error: any) {
    return { success: false, output: error.message || String(error) };
  }
}

/**
 * 检查Python pip是否可用
 */
function checkPipAvailable(): boolean {
  const result = executeCommand('pip --version');
  return result.success;
}

/**
 * 检查npm是否可用
 */
function checkNpmAvailable(): boolean {
  const result = executeCommand('npm --version');
  return result.success;
}

/**
 * 获取当前Python镜像源
 */
function getCurrentPythonMirror(): string | null {
  const result = executeCommand('pip config get global.index-url');
  if (result.success) {
    return result.output.trim();
  }
  return null;
}

/**
 * 获取当前npm镜像源
 */
function getCurrentNpmMirror(): string | null {
  const result = executeCommand('npm config get registry');
  if (result.success) {
    return result.output.trim();
  }
  return null;
}

/**
 * 设置Python镜像源
 */
function setPythonMirror(mirrorUrl: string): boolean {
  log(`设置Python镜像源: ${mirrorUrl}`);
  const result = executeCommand(`pip config set global.index-url ${mirrorUrl}`);
  
  if (result.success) {
    log('✓ Python镜像源设置成功');
    return true;
  } else {
    log(`✗ Python镜像源设置失败: ${result.output}`);
    return false;
  }
}

/**
 * 设置npm镜像源
 */
function setNpmMirror(mirrorUrl: string): boolean {
  log(`设置npm镜像源: ${mirrorUrl}`);
  const result = executeCommand(`npm config set registry ${mirrorUrl}`);
  
  if (result.success) {
    log('✓ npm镜像源设置成功');
    return true;
  } else {
    log(`✗ npm镜像源设置失败: ${result.output}`);
    return false;
  }
}

/**
 * 测试Python依赖下载
 */
function testPythonDownload(): boolean {
  log('测试Python依赖下载...');
  // 尝试安装一个小的测试包
  const result = executeCommand('pip install --dry-run requests', undefined);
  
  if (result.success) {
    log('✓ Python依赖下载测试成功');
    return true;
  } else {
    log(`✗ Python依赖下载测试失败: ${result.output}`);
    return false;
  }
}

/**
 * 测试npm依赖下载
 */
function testNpmDownload(): boolean {
  log('测试npm依赖下载...');
  // 尝试获取包信息
  const result = executeCommand('npm view express version');
  
  if (result.success) {
    log('✓ npm依赖下载测试成功');
    return true;
  } else {
    log(`✗ npm依赖下载测试失败: ${result.output}`);
    return false;
  }
}

/**
 * 切换Python镜像源
 */
export function switchPythonMirror(): boolean {
  log('=== 开始切换Python镜像源 ===');
  
  if (!checkPipAvailable()) {
    log('✗ pip不可用，跳过Python镜像切换');
    return false;
  }
  
  const currentMirror = getCurrentPythonMirror();
  log(`当前Python镜像源: ${currentMirror || '未设置'}`);
  
  // 测试当前镜像源
  if (testPythonDownload()) {
    log('当前Python镜像源工作正常，无需切换');
    return true;
  }
  
  // 尝试切换到清华镜像
  log('⚠️ 当前镜像源不可用，切换到清华镜像...');
  if (setPythonMirror(MIRRORS.python.tsinghua)) {
    if (testPythonDownload()) {
      log('✓ 清华镜像源工作正常');
      return true;
    }
  }
  
  // 尝试切换到阿里云镜像
  log('⚠️ 清华镜像源不可用，切换到阿里云镜像...');
  if (setPythonMirror(MIRRORS.python.aliyun)) {
    if (testPythonDownload()) {
      log('✓ 阿里云镜像源工作正常');
      return true;
    }
  }
  
  // 恢复默认镜像源
  log('⚠️ 所有镜像源都不可用，恢复默认镜像源');
  setPythonMirror(MIRRORS.python.default);
  
  log('✗ Python镜像切换失败');
  return false;
}

/**
 * 切换npm镜像源
 */
export function switchNpmMirror(): boolean {
  log('=== 开始切换npm镜像源 ===');
  
  if (!checkNpmAvailable()) {
    log('✗ npm不可用，跳过npm镜像切换');
    return false;
  }
  
  const currentMirror = getCurrentNpmMirror();
  log(`当前npm镜像源: ${currentMirror || '未设置'}`);
  
  // 测试当前镜像源
  if (testNpmDownload()) {
    log('当前npm镜像源工作正常，无需切换');
    return true;
  }
  
  // 尝试切换到淘宝镜像
  log('⚠️ 当前镜像源不可用，切换到淘宝镜像...');
  if (setNpmMirror(MIRRORS.nodejs.taobao)) {
    if (testNpmDownload()) {
      log('✓ 淘宝镜像源工作正常');
      return true;
    }
  }
  
  // 尝试切换到腾讯云镜像
  log('⚠️ 淘宝镜像源不可用，切换到腾讯云镜像...');
  if (setNpmMirror(MIRRORS.nodejs.tencent)) {
    if (testNpmDownload()) {
      log('✓ 腾讯云镜像源工作正常');
      return true;
    }
  }
  
  // 恢复默认镜像源
  log('⚠️ 所有镜像源都不可用，恢复默认镜像源');
  setNpmMirror(MIRRORS.nodejs.default);
  
  log('✗ npm镜像切换失败');
  return false;
}

/**
 * 自动切换所有镜像源
 */
export function autoSwitchMirrors(): { python: boolean; npm: boolean } {
  log('=== 开始自动切换镜像源 ===');
  
  const pythonResult = switchPythonMirror();
  const npmResult = switchNpmMirror();
  
  log('=== 镜像源切换完成 ===');
  log(`Python镜像: ${pythonResult ? '成功' : '失败'}`);
  log(`npm镜像: ${npmResult ? '成功' : '失败'}`);
  
  return { python: pythonResult, npm: npmResult };
}

/**
 * 获取镜像配置信息
 */
export function getMirrorInfo(): {
  python: { current: string | null; available: string[] };
  npm: { current: string | null; available: string[] };
} {
  return {
    python: {
      current: getCurrentPythonMirror(),
      available: Object.values(MIRRORS.python)
    },
    npm: {
      current: getCurrentNpmMirror(),
      available: Object.values(MIRRORS.nodejs)
    }
  };
}

// 如果直接运行此脚本，执行自动切换
if (require.main === module) {
  autoSwitchMirrors();
}
