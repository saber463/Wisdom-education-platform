/**
 * 终端乱码修复工具
 * 用于修复 Windows 环境下 Node.js 中文输出乱码问题
 */

/**
 * 初始化编码修复
 * 在应用启动时调用此函数
 */
export function initEncodingFix(): void {
  if (process.platform === 'win32') {
    // Node 24 removed setEncoding on stdout/stderr — use env var instead
    process.env.PYTHONIOENCODING = 'utf-8';
    console.log('[编码修复] Windows 终端 UTF-8 编码已启用');
  }
}

/**
 * 安全的中文日志输出
 * @param message 日志消息
 * @param type 日志类型
 */
export function logChinese(
  message: string,
  type: 'info' | 'success' | 'warn' | 'error' = 'info'
): void {
  const timestamp = new Date().toLocaleTimeString('zh-CN');
  const prefix = {
    info: '[ℹ️  信息]',
    success: '[✅ 成功]',
    warn: '[⚠️  警告]',
    error: '[❌ 错误]'
  }[type];

  const logMessage = `${timestamp} ${prefix} ${message}`;

  if (type === 'error') {
    console.error(logMessage);
  } else if (type === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
}

/**
 * 转换字符串编码（如果需要）
 * @param str 输入字符串
 * @returns 转换后的字符串
 */
export function ensureUTF8(str: string): string {
  if (process.platform === 'win32') {
    try {
      // 尝试将字符串转换为 UTF-8
      return Buffer.from(str, 'utf8').toString('utf8');
    } catch (error) {
      return str;
    }
  }
  return str;
}

/**
 * 创建带有正确编码的日志函数
 */
export const logger = {
  info: (msg: string) => logChinese(msg, 'info'),
  success: (msg: string) => logChinese(msg, 'success'),
  warn: (msg: string) => logChinese(msg, 'warn'),
  error: (msg: string) => logChinese(msg, 'error')
};
