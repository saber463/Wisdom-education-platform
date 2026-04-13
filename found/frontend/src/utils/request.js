import axios from 'axios';
import { ElMessage } from 'element-plus';
import config from '@/config';
import { safeLocalStorage } from '../store/user';

const service = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 10000,
});

const getCsrfTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return value;
    }
  }
  return null;
};

service.interceptors.request.use(
  config => {
    const token = safeLocalStorage.get(`${config.storagePrefix}token`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  response => {
    const res = response.data;

    if (!res.success) {
      let errorMessage = res.message || '请求失败';

      switch (res.errorCode) {
        case 'AUTH_TOKEN_MISSING':
        case 'AUTH_TOKEN_INVALID':
        case 'AUTH_TOKEN_EXPIRED':
          errorMessage = '登录已过期，请重新登录';
          window.location.href = '/login';
          break;
        case 'PERMISSION_DENIED':
          errorMessage = '您没有权限执行此操作';
          break;
        case 'RESOURCE_NOT_FOUND':
          errorMessage = '请求的资源不存在';
          break;
        case 'RESOURCE_CONFLICT':
          errorMessage = '资源冲突，请检查后重新提交';
          break;
        case 'VALIDATION_ERROR':
          errorMessage = '请求参数验证失败';
          break;
        case 'INTERNAL_SERVER_ERROR':
          errorMessage = '服务器内部错误，请稍后重试';
          break;
        case 'DATABASE_ERROR':
          errorMessage = '数据库操作错误，请稍后重试';
          break;
        case 'FILE_UPLOAD_ERROR':
          errorMessage = '文件上传失败，请检查文件后重试';
          break;
        case 'API_RATE_LIMIT_EXCEEDED':
          errorMessage = '请求过于频繁，请稍后重试';
          break;
      }

      ElMessage({
        message: errorMessage,
        type: 'error',
        duration: 5 * 1000,
      });

      return Promise.reject(new Error(errorMessage));
    } else {
      return res;
    }
  },
  error => {
    console.error('响应错误:', error);

    let errorMessage = '网络错误';

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = '请求超时，请稍后重试';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = '网络连接错误，请检查网络设置';
      } else if (error.code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = '服务器连接被拒绝，请检查后端服务是否正常运行';
      } else {
        errorMessage = '网络请求失败，请稍后重试';
      }
    } else {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          errorMessage = data.message || '请求参数错误';
          break;
        case 401:
          errorMessage = '登录已过期，请重新登录';
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = data.message || '您没有权限执行此操作';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 405:
          errorMessage = '不允许的请求方法';
          break;
        case 408:
          errorMessage = '请求超时，请稍后重试';
          break;
        case 409:
          errorMessage = '资源冲突，请检查后重新提交';
          break;
        case 429:
          errorMessage = '请求过于频繁，请稍后重试';
          break;
        case 500:
          errorMessage = '服务器内部错误，请稍后重试';
          break;
        case 501:
          errorMessage = '服务器未实现此功能';
          break;
        case 502:
          errorMessage = '网关错误，请稍后重试';
          break;
        case 503:
          errorMessage = '服务器暂时不可用，请稍后重试';
          break;
        case 504:
          errorMessage = '网关超时，请稍后重试';
          break;
        default:
          errorMessage = data.message || `请求失败 (${status})`;
      }
    }

    ElMessage({
      message: errorMessage,
      type: 'error',
      duration: 5 * 1000,
    });

    return Promise.reject(error);
  }
);

export default service;
