/**
 * 智慧教育学习平台 - HTTP请求工具
 * 
 * 功能：
 * - 统一的API请求封装
 * - JWT令牌自动携带
 * - 错误统一处理
 * 
 * 需求：9.1 - JWT认证有效性
 */

import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// Token存储键名（与user store保持一致）
const TOKEN_KEY = 'edu_token'

// API响应接口 - 统一后端响应格式
export interface ApiResponse<T = any> {
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

// 请求拦截器 - 自动携带JWT令牌
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('[请求] 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一错误处理（返回 body，类型由 RequestInstance 声明）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
request.interceptors.response.use((response: AxiosResponse<any>) => response.data as any,
  (error: AxiosError<ApiResponse>) => {
    // 处理HTTP错误
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '请求失败'
    
    switch (status) {
      case 401:
        // 未授权，清除token并跳转登录
        localStorage.removeItem(TOKEN_KEY)
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
