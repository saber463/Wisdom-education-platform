// 日志记录工具

// 日志级别
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

// 日志配置
const LOG_CONFIG = {
  level: LogLevel.INFO, // 默认日志级别
  maxLogs: 100, // 最大日志数量
  showTimestamp: true, // 是否显示时间戳
  showLevel: true, // 是否显示日志级别
  showSource: true, // 是否显示来源
  colorize: true, // 是否彩色显示
};

// 日志存储
const logs = [];

// 日志监听器
const listeners = [];

// 颜色映射
const COLOR_MAP = {
  [LogLevel.DEBUG]: 'color: #6b7280;',
  [LogLevel.INFO]: 'color: #2563eb;',
  [LogLevel.WARN]: 'color: #f59e0b;',
  [LogLevel.ERROR]: 'color: #dc2626;',
  [LogLevel.FATAL]: 'color: #991b1b; font-weight: bold;',
};

// 级别名称映射
const LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

/**
 * 记录日志
 * @param {number} level - 日志级别
 * @param {string} message - 日志消息
 * @param {object} data - 附加数据
 * @param {string} source - 日志来源
 */
const log = (level, message, data = null, source = '') => {
  // 检查日志级别是否启用
  if (level < LOG_CONFIG.level) {
    return;
  }

  // 创建日志对象
  const logEntry = {
    timestamp: new Date(),
    level,
    message,
    data,
    source,
    id: Date.now() + Math.random().toString(36).substring(2, 9),
  };

  // 添加到日志存储
  logs.push(logEntry);

  // 限制日志数量
  if (logs.length > LOG_CONFIG.maxLogs) {
    logs.shift();
  }

  // 触发日志监听器
  listeners.forEach(listener => {
    try {
      listener(logEntry);
    } catch (_error) {
      console.error('日志监听器执行失败:', _error);
    }
  });

  // 输出到控制台
  outputToConsole(logEntry);
};

/**
 * 输出日志到控制台
 * @param {object} logEntry - 日志条目
 */
const outputToConsole = logEntry => {
  const { timestamp, level, message, data, source } = logEntry;

  // 构建控制台输出
  let output = '';

  // 添加时间戳
  if (LOG_CONFIG.showTimestamp) {
    const timeStr = timestamp.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    output += `[${timeStr}] `;
  }

  // 添加日志级别
  if (LOG_CONFIG.showLevel) {
    output += `[${LEVEL_NAMES[level]}] `;
  }

  // 添加来源
  if (LOG_CONFIG.showSource && source) {
    output += `[${source}] `;
  }

  // 添加消息
  output += message;

  // 添加附加数据
  if (data) {
    output += ' ';
  }

  // 控制台输出
  if (LOG_CONFIG.colorize) {
    const style = COLOR_MAP[level] || '';
    if (data) {
      console.log(`%c${output}`, style, data);
    } else {
      console.log(`%c${output}`, style);
    }
  } else {
    if (data) {
      console.log(output, data);
    } else {
      console.log(output);
    }
  }
};

/**
 * 获取日志列表
 * @param {number} limit - 限制数量
 * @returns {array} - 日志列表
 */
const getLogs = (limit = null) => {
  if (limit) {
    return logs.slice(-limit);
  }
  return logs;
};

/**
 * 清除日志
 */
const clearLogs = () => {
  logs.length = 0;
};

/**
 * 添加日志监听器
 * @param {function} listener - 监听器函数
 */
const addListener = listener => {
  if (typeof listener === 'function') {
    listeners.push(listener);
  }
};

/**
 * 移除日志监听器
 * @param {function} listener - 监听器函数
 */
const removeListener = listener => {
  const index = listeners.indexOf(listener);
  if (index > -1) {
    listeners.splice(index, 1);
  }
};

/**
 * 设置日志级别
 * @param {number} level - 日志级别
 */
const setLogLevel = level => {
  if (typeof level === 'number' && level >= LogLevel.DEBUG && level <= LogLevel.FATAL) {
    LOG_CONFIG.level = level;
  }
};

/**
 * 获取日志级别
 * @returns {number} - 日志级别
 */
const getLogLevel = () => {
  return LOG_CONFIG.level;
};

/**
 * 导出的日志工具
 */
const logger = {
  // 日志级别常量
  Level: LogLevel,

  // 日志方法
  debug: (message, data, source) => log(LogLevel.DEBUG, message, data, source),
  info: (message, data, source) => log(LogLevel.INFO, message, data, source),
  warn: (message, data, source) => log(LogLevel.WARN, message, data, source),
  error: (message, data, source) => log(LogLevel.ERROR, message, data, source),
  fatal: (message, data, source) => log(LogLevel.FATAL, message, data, source),

  // 工具方法
  getLogs,
  clearLogs,
  addListener,
  removeListener,
  setLogLevel,
  getLogLevel,

  // 日志配置
  config: LOG_CONFIG,
};

// 导出默认日志工具
export default logger;

// 导出日志级别常量
export { LogLevel };
