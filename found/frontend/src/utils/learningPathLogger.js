// 学习路径生成日志管理模块
// 记录学习路径生成过程中的关键事件

/**
 * 日志级别枚举
 */
export const LOG_LEVELS = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG',
};

/**
 * 学习路径生成日志记录器
 */
export class LearningPathLogger {
  /**
   * 记录学习路径生成开始
   * @param {Object} data - 生成参数
   * @param {string} data.goal - 学习目标
   * @param {number} data.days - 学习天数
   * @param {string} data.intensity - 学习强度
   */
  static logGenerateStart({ goal, days, intensity }) {
    this._log(LOG_LEVELS.INFO, '学习路径生成开始', {
      goal,
      days,
      intensity,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 记录学习路径生成成功
   * @param {Object} data - 生成结果信息
   * @param {string} data.goal - 学习目标
   * @param {number} data.days - 学习天数
   * @param {number} data.stageCount - 生成的阶段数量
   * @param {number} data.elapsedTime - 耗时(毫秒)
   */
  static logGenerateSuccess({ goal, days, stageCount, elapsedTime }) {
    this._log(LOG_LEVELS.INFO, '学习路径生成成功', {
      goal,
      days,
      stageCount,
      elapsedTime: `${elapsedTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 记录学习路径生成失败
   * @param {Object} data - 失败信息
   * @param {string} data.goal - 学习目标
   * @param {number} data.days - 学习天数
   * @param {string} data.error - 错误信息
   */
  static logGenerateError({ goal, days, error }) {
    this._log(LOG_LEVELS.ERROR, '学习路径生成失败', {
      goal,
      days,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 记录表单验证失败
   * @param {Object} data - 验证信息
   * @param {string} data.goal - 学习目标
   * @param {number} data.days - 学习天数
   * @param {string} data.validationError - 验证错误信息
   */
  static logValidationFailed({ goal, days, validationError }) {
    this._log(LOG_LEVELS.WARN, '学习路径生成表单验证失败', {
      goal,
      days,
      validationError,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 通用日志记录方法
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} data - 日志数据
   */
  static _log(level, message, data = {}) {
    // 控制台输出日志
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // 根据级别使用不同的控制台方法
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error('📝 [LearningPath]', logEntry);
        break;
      case LOG_LEVELS.WARN:
        console.warn('📝 [LearningPath]', logEntry);
        break;
      case LOG_LEVELS.INFO:
        console.info('📝 [LearningPath]', logEntry);
        break;
      case LOG_LEVELS.DEBUG:
        console.debug('📝 [LearningPath]', logEntry);
        break;
      default:
        console.log('📝 [LearningPath]', logEntry);
    }

    // 也可以选择将日志保存到本地存储或发送到服务器
    // 这里简化处理，只输出到控制台
  }
}
