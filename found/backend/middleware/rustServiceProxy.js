/**
 * Rust服务智能代理中间件
 * 自动检测Rust服务健康状态，不可用时无缝切换到Node.js fallback
 */
import axios from 'axios';

const RUST_SERVICE_URL = process.env.RUST_SERVICE_URL || 'http://localhost:8080';
const FALLBACK_SERVICE_URL = process.env.RUST_FALLBACK_URL || 'http://localhost:8081';
const HEALTH_CHECK_INTERVAL = 30000; // 30秒检测一次
const REQUEST_TIMEOUT = 5000; // 5秒超时

// 服务状态
const serviceState = {
  rustAvailable: false,
  lastChecked: 0,
  checking: false,
};

/**
 * 检测Rust服务是否可用
 */
async function checkRustService() {
  if (serviceState.checking) return serviceState.rustAvailable;

  const now = Date.now();
  if (now - serviceState.lastChecked < HEALTH_CHECK_INTERVAL) {
    return serviceState.rustAvailable;
  }

  serviceState.checking = true;
  try {
    await axios.get(`${RUST_SERVICE_URL}/health`, { timeout: 3000 });
    if (!serviceState.rustAvailable) {
      console.log('✅ Rust服务已恢复，切换回Rust服务');
    }
    serviceState.rustAvailable = true;
  } catch {
    if (serviceState.rustAvailable) {
      console.warn('⚠️  Rust服务不可用，自动切换到Node.js fallback服务');
    }
    serviceState.rustAvailable = false;
  } finally {
    serviceState.lastChecked = now;
    serviceState.checking = false;
  }

  return serviceState.rustAvailable;
}

/**
 * 获取当前活跃的服务URL
 */
async function getActiveServiceUrl() {
  const rustOk = await checkRustService();
  return rustOk ? RUST_SERVICE_URL : FALLBACK_SERVICE_URL;
}

/**
 * 转发请求到Rust服务（或fallback）
 * @param {string} path - API路径（如 /api/similarity）
 * @param {string} method - HTTP方法
 * @param {Object} data - 请求体
 */
export async function callRustService(path, method = 'POST', data = {}) {
  const baseUrl = await getActiveServiceUrl();
  const url = `${baseUrl}${path}`;
  const isRust = baseUrl === RUST_SERVICE_URL;

  try {
    const response = await axios({
      method,
      url,
      data,
      timeout: REQUEST_TIMEOUT,
    });
    return { success: true, data: response.data, usedFallback: !isRust };
  } catch (error) {
    // 若Rust服务失败，立即尝试fallback
    if (isRust) {
      console.warn(`Rust服务请求失败(${path})，尝试fallback...`);
      serviceState.rustAvailable = false;
      serviceState.lastChecked = 0;
      try {
        const fallbackResponse = await axios({
          method,
          url: `${FALLBACK_SERVICE_URL}${path}`,
          data,
          timeout: REQUEST_TIMEOUT,
        });
        return { success: true, data: fallbackResponse.data, usedFallback: true };
      } catch (fallbackError) {
        throw new Error(`Rust服务和Fallback均不可用: ${fallbackError.message}`);
      }
    }
    throw error;
  }
}

/**
 * Express中间件：将 /api/rust/* 请求代理到活跃服务
 */
export function rustProxyMiddleware(req, res, next) {
  // 不拦截，仅暴露 callRustService 工具函数
  next();
}

/**
 * 获取Rust服务健康状态（用于监控接口）
 */
export async function getRustServiceStatus() {
  const rustOk = await checkRustService();
  return {
    rustService: {
      url: RUST_SERVICE_URL,
      available: rustOk,
      lastChecked: new Date(serviceState.lastChecked).toISOString(),
    },
    fallbackService: {
      url: FALLBACK_SERVICE_URL,
      active: !rustOk,
    },
    activeService: rustOk ? 'rust' : 'nodejs-fallback',
  };
}

// 启动时立即检测（不阻塞）
checkRustService().then(available => {
  console.log(
    available
      ? '✅ Rust高性能服务已连接'
      : '⚠️  Rust服务未启动，使用Node.js fallback（功能完整）'
  );
});

export default { callRustService, rustProxyMiddleware, getRustServiceStatus };
