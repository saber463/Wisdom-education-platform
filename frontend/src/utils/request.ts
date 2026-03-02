/**
 * 智慧教育学习平台 - HTTP请求工具
 * 
 * 功能：
 * - 统一的API请求封装
 * - JWT令牌自动携带
 * - 错误统一处理
 * - GET 请求短时缓存（30s），减少重复请求
 * 
 * 需求：9.1 - JWT认证有效性
 */

import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// Token存储键名（与user store保持一致）
const TOKEN_KEY = 'edu_token'

/** GET 缓存 TTL（毫秒），30 秒 */
const GET_CACHE_TTL_MS = 30 * 1000
const getCacheStore = (): Map<string, { data: unknown; expireAt: number }> => {
  const key = '__get_cache__'
  if (!(window as unknown as Record<string, unknown>)[key]) {
    (window as unknown as Record<string, unknown>)[key] = new Map()
  }
  return (window as unknown as Record<string, Map<string, { data: unknown; expireAt: number }>>)[key]
}
function buildGetCacheKey(config: AxiosRequestConfig): string {
  const url = config.url ?? ''
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${config.method ?? 'get'}:${url}:${params}`
}

// API响应接口 - 统一后端响应格式
export interface ApiResponse<T = unknown> {
  code?: number
  success?: boolean
  msg?: string
  message?: string
  data?: T
  completed?: boolean
}

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动携带JWT令牌；GET 短时缓存
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // GET 请求：命中缓存则直接返回，不发请求
    if ((config.method ?? 'get').toLowerCase() === 'get') {
      const key = buildGetCacheKey(config)
      const store = getCacheStore()
      const hit = store.get(key)
      if (hit && hit.expireAt > Date.now()) {
        config.adapter = () =>
          Promise.resolve({
            data: hit.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          } as AxiosResponse)
      } else {
        (config as AxiosRequestConfig & { _getCacheKey?: string })._getCacheKey = key
      }
    }
    return config
  },
  error => {
    console.error('[请求] 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一错误处理；GET 成功响应写入短时缓存
request.interceptors.response.use(
  (response: AxiosResponse<unknown>) => {
    const cfg = response.config as AxiosRequestConfig & { _getCacheKey?: string }
    if ((cfg.method ?? 'get').toLowerCase() === 'get' && cfg._getCacheKey && response.status === 200) {
      const store = getCacheStore()
      store.set(cfg._getCacheKey, {
        data: response.data,
        expireAt: Date.now() + GET_CACHE_TTL_MS
      })
    }
    return response.data
  },
  (error: AxiosError<ApiResponse>) => {
    // 处理HTTP错误
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '请求失败'
    
    switch (status) {
      case 401:
        // 未授权，清除 token 与 GET 缓存并跳转登录
        localStorage.removeItem(TOKEN_KEY)
        getCacheStore().clear()
        ElMessage.error('登录已过期，请重新登录')
        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
        break
      case 403:
        ElMessage.error('没有权限访问该资源')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误')
        break
      default:
        ElMessage.error(message)
    }
    
    return Promise.reject(error)
  }
)

/** 请求实例类型：拦截器返回 response.data，故 Promise 解析为 body 类型 T */
export interface RequestInstance {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
}

export default request as unknown as RequestInstance
