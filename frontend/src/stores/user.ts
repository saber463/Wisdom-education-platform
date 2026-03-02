/**
 * 智慧教育学习平台 - 用户状态管理
 * 
 * 功能：
 * - 用户登录状态管理
 * - JWT令牌存储和刷新
 * - 用户信息缓存
 * 
 * 需求：9.1 - JWT认证有效性
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

// 用户角色类型
export type UserRole = 'teacher' | 'student' | 'parent'

// 用户信息接口
export interface UserInfo {
  id: number
  username: string
  realName: string
  role: UserRole
  email?: string
  phone?: string
  avatarUrl?: string
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  updatedAt: string
}

// 登录请求参数
export interface LoginParams {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: UserInfo
  expiresIn: number
}

// Token存储键名
const TOKEN_KEY = 'edu_token'
const USER_INFO_KEY = 'edu_user_info'
const TOKEN_EXPIRES_KEY = 'edu_token_expires'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<UserInfo | null>(null)
  const tokenExpires = ref<number>(0)
  const isLoading = ref<boolean>(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const isTeacher = computed(() => userInfo.value?.role === 'teacher')
  const isStudent = computed(() => userInfo.value?.role === 'student')
  const isParent = computed(() => userInfo.value?.role === 'parent')
  const displayName = computed(() => userInfo.value?.realName || userInfo.value?.username || '')

  // 初始化 - 从localStorage恢复用户信息
  function initFromStorage() {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUserInfo = localStorage.getItem(USER_INFO_KEY)
    const storedExpires = localStorage.getItem(TOKEN_EXPIRES_KEY)

    if (storedToken) {
      token.value = storedToken
    }

    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch (e) {
        console.error('[用户状态] 解析用户信息失败:', e)
        userInfo.value = null
      }
    }

    if (storedExpires) {
      tokenExpires.value = parseInt(storedExpires, 10)
    }

    // 检查token是否过期
    if (tokenExpires.value && Date.now() > tokenExpires.value) {
      console.warn('[用户状态] Token已过期，清除登录状态')
      logout()
    }
  }

  // 设置Token
  function setToken(newToken: string, expiresIn: number = 86400) {
    token.value = newToken
    tokenExpires.value = Date.now() + expiresIn * 1000
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(TOKEN_EXPIRES_KEY, tokenExpires.value.toString())
  }

  // 设置用户信息
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  // 登录
  async function login(params: LoginParams): Promise<LoginResponse> {
    isLoading.value = true
    try {
      const response = await request.post<LoginResponse>('/auth/login', params)
      
      // 保存token和用户信息
      setToken(response.token, response.expiresIn)
      setUserInfo(response.user)
      
      console.log('[用户状态] 登录成功:', response.user.username)
      return response
    } catch (error) {
      console.error('[用户状态] 登录失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取用户信息
  async function fetchUserInfo(): Promise<UserInfo> {
    if (!token.value) {
      throw new Error('未登录')
    }

    isLoading.value = true
    try {
      const response = await request.get<UserInfo>('/auth/me')
      setUserInfo(response)
      return response
    } catch (error) {
      console.error('[用户状态] 获取用户信息失败:', error)
      // 如果获取失败，可能是token无效，清除登录状态
      logout()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 刷新Token
  async function refreshToken(): Promise<string> {
    if (!token.value) {
      throw new Error('未登录')
    }

    try {
      const response = await request.post<{ token: string; expiresIn: number }>('/auth/refresh')
      setToken(response.token, response.expiresIn)
      console.log('[用户状态] Token刷新成功')
      return response.token
    } catch (error) {
      console.error('[用户状态] Token刷新失败:', error)
      logout()
      throw error
    }
  }

  // 检查Token是否即将过期（提前5分钟刷新）
  function isTokenExpiringSoon(): boolean {
    if (!tokenExpires.value) return false
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() > tokenExpires.value - fiveMinutes
  }

  // 自动刷新Token
  async function autoRefreshToken(): Promise<void> {
    if (isTokenExpiringSoon() && token.value) {
      try {
        await refreshToken()
      } catch (error) {
        console.error('[用户状态] 自动刷新Token失败:', error)
      }
    }
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null
    tokenExpires.value = 0
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_KEY)
    console.log('[用户状态] 已登出')
  }

  // 检查是否有指定权限
  function hasRole(role: UserRole): boolean {
    return userInfo.value?.role === role
  }

  // 获取用户首页路径
  function getHomePath(): string {
    const roleHomePaths: Record<UserRole, string> = {
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard'
    }
    return userInfo.value?.role ? roleHomePaths[userInfo.value.role] : '/login'
  }

  // 初始化
  initFromStorage()

  return {
    // 状态
    token,
    userInfo,
    tokenExpires,
    isLoading,
    
    // 计算属性
    isLoggedIn,
    isTeacher,
    isStudent,
    isParent,
    displayName,
    
    // 方法
    setToken,
    setUserInfo,
    login,
    fetchUserInfo,
    refreshToken,
    isTokenExpiringSoon,
    autoRefreshToken,
    logout,
    hasRole,
    getHomePath
  }
})
