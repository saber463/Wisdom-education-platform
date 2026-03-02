import xss from 'xss';
// 导入敏感词库
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sensitiveWords = require('../config/sensitiveWords.json').words;
// 导入自定义的DFA敏感词过滤器
import DFASensitiveFilter from '../utils/dfaFilter.js';
import axios from 'axios';

// 初始化DFA过滤器
const dfaFilter = new DFASensitiveFilter(sensitiveWords);

/**
 * 过滤文本中的敏感词（基于DFA算法）
 */
export const filterSensitiveWords = content => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  // 使用DFA过滤器替换敏感词
  return dfaFilter.filter(content);
};

/**
 * 清理内容，处理各种可能的绕过方式
 */
const cleanContent = content => {
  let cleaned = content.toLowerCase();

  // 移除所有HTML标签
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 移除所有空白字符（包括空格、制表符、换行符、回车符等）
  cleaned = cleaned.replace(/[\s\t\n\r\v\f]+/g, '');

  // 处理常见的Unicode编码
  cleaned = cleaned.replace(/\\u([0-9a-f]{4})/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // 处理HTML实体
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`')
    .replace(/&#([0-9]+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

  // 处理常见的特殊字符替换和分隔符
  cleaned = cleaned.replace(
    /[.*\-_+/\\()[\]{}|?!@#$%^&*=+\-_`~'";:,<>?/|\u200B-\u200D\uFEFF]/g,
    ''
  );

  // 处理同音字、形近字替换（简单示例，可扩展）
  const homophoneMap = {
    法轮功: '法轮功',
    法论功: '法轮功',
    轮子功: '法轮功',
  };

  // 替换常见同音字、形近字
  for (const [variant, original] of Object.entries(homophoneMap)) {
    cleaned = cleaned.replace(new RegExp(variant, 'g'), original);
  }

  return cleaned;
};

/**
 * 本地敏感词检测（基于DFA算法）
 */
const localSensitiveCheck = content => {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // 1. 使用DFA直接检测原始内容
  if (dfaFilter.containsSensitiveWord(content)) {
    return true;
  }

  // 2. 检测清理后的内容（处理各种绕过方式）
  const cleaned = cleanContent(content);
  if (dfaFilter.containsSensitiveWord(cleaned)) {
    return true;
  }

  // 3. 检测移除空白字符的版本
  const contentWithoutWhitespace = content.replace(/\s+/g, '');
  if (dfaFilter.containsSensitiveWord(contentWithoutWhitespace)) {
    return true;
  }

  // 4. 检测移除特殊字符和空白字符的版本
  const contentWithoutSpecialChars = content.replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
  if (dfaFilter.containsSensitiveWord(contentWithoutSpecialChars)) {
    return true;
  }

  return false;
};

/**
 * 第三方API敏感词检测（免费API）
 */
const apiSensitiveCheck = async content => {
  try {
    // 使用免费的敏感词检测API
    const response = await axios.post('https://v2.xxapi.cn/api/detect', {
      text: content,
      // 注意：这个API可能需要申请API密钥，这里使用示例参数
      // 如果API调用失败，会自动回退到本地检测
    });

    // 根据API返回格式判断是否包含敏感词
    // 不同API的返回格式可能不同，需要根据实际情况调整
    return response.data.has_sensitive || response.data.status === 'error';
  } catch {
    return localSensitiveCheck(content);
  }
};

/**
 * 递归检查对象中的所有字段，进行XSS过滤和敏感词检测
 */
const recursivelyCheckAndSanitize = async (obj, detectMode) => {
  if (!obj || typeof obj !== 'object') {
    return { hasSensitive: false, sanitized: obj };
  }

  let hasSensitive = false;
  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        // 1. XSS过滤
        const sanitizedValue = xss(value);
        sanitized[key] = sanitizedValue;

        // 2. 敏感词检查
        if (detectMode === 'local' || detectMode === 'both') {
          if (localSensitiveCheck(sanitizedValue)) {
            hasSensitive = true;
          }
        }

        if (detectMode === 'api' || detectMode === 'both') {
          if (await apiSensitiveCheck(sanitizedValue)) {
            hasSensitive = true;
          }
        }
      } else if (typeof value === 'object') {
        // 递归检查嵌套对象或数组
        const { hasSensitive: nestedHasSensitive, sanitized: nestedSanitized } =
          await recursivelyCheckAndSanitize(value, detectMode);
        if (nestedHasSensitive) {
          hasSensitive = true;
        }
        sanitized[key] = nestedSanitized;
      } else {
        // 非字符串、非对象类型直接保留
        sanitized[key] = value;
      }
    }
  }

  return { hasSensitive, sanitized };
};

/**
 * 检查内容是否包含敏感词 + XSS过滤
 * 支持本地检测和API检测双重保障
 * 支持递归检查嵌套对象和数组
 */
export const checkSensitive = async (req, res, next) => {
  let hasSensitive = false;

  // 配置检测模式：local（仅本地）、api（仅API）、both（两者结合）
  // 暂时使用本地检测，避免API调用失败
  const detectMode = process.env.SENSITIVE_DETECT_MODE || 'local';

  // 检查并清理请求体中的所有字段
  if (req.body) {
    const result = await recursivelyCheckAndSanitize(req.body, detectMode);
    hasSensitive = result.hasSensitive;
    req.body = result.sanitized;
  }

  // 挂载检查结果到req对象
  req.hasSensitive = hasSensitive;
  next();
};

/**
 * 单独的敏感词检测函数（供其他地方调用）
 */
export const detectSensitive = async content => {
  if (!content) return false;

  const detectMode = process.env.SENSITIVE_DETECT_MODE || 'both';

  if (detectMode === 'local' || detectMode === 'both') {
    if (localSensitiveCheck(content)) {
      return true;
    }
  }

  if (detectMode === 'api' || detectMode === 'both') {
    if (await apiSensitiveCheck(content)) {
      return true;
    }
  }

  return false;
};
