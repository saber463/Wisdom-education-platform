/**
 * 智慧教育学习平台 - 离线状态监听
 * 
 * 功能：
 * - 监听网络状态变化
 * - 自动切换离线模式UI
 * - 显示"离线模式"标识
 * 
 * 需求：17.2 - 离线模式自动切换
 */

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 网络状态类型
export type NetworkStatus = 'online' | 'offline' | 'slow'

// 网络状态监听器回调
export type NetworkStatusCallback = (status: NetworkStatus) => void

// 网络状态
const isOnline = ref<boolean>(navigator.onLine)
const networkStatus = ref<NetworkStatus>(navigator.onLine ? 'online' : 'offline')
const lastStatusChange = ref<number>(Date.now())

// 监听器列表
const listeners: Set<NetworkStatusCallback> = new Set()

// 计算属性
export const isOfflineMode = computed(() => networkStatus.value === 'offline')
export const isSlowNetwork = computed(() => networkStatus.value === 'slow')

/**
 * 初始化网络状态监听
 */
export function initNetworkMonitor(): void {
  // Reset to current navigator state
  isOnline.value = navigator.onLine
  networkStatus.value = navigator.onLine ? 'online' : 'offline'
  lastStatusChange.value = Date.now()
  
  // 监听online事件
  window.addEventListener('online', handleOnline)
  
  // 监听offline事件
  window.addEventListener('offline', handleOffline)

  // 监听连接变化（如果支持）
  if ('connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: { addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void; effectiveType?: string } }).connection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }
  }

  console.log('[网络监听] 已初始化，当前状态:', networkStatus.value)
}

/**
 * 清理网络状态监听
 */
export function cleanupNetworkMonitor(): void {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)

  if ('connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: { addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void; effectiveType?: string } }).connection
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange)
    }
  }

  listeners.clear()
  console.log('[网络监听] 已清理')
}

/**
 * 处理online事件
 */
function handleOnline(): void {
  isOnline.value = true
  networkStatus.value = 'online'
  lastStatusChange.value = Date.now()
  
  console.log('[网络监听] 网络已连接')
  ElMessage.success('网络已连接，恢复在线模式')
  
  notifyListeners('online')
}

/**
 * 处理offline事件
 */
function handleOffline(): void {
  isOnline.value = false
  networkStatus.value = 'offline'
  lastStatusChange.value = Date.now()
  
  console.log('[网络监听] 网络已断开')
  ElMessage.warning('网络已断开，切换到离线模式')
  
  notifyListeners('offline')
}

/**
 * 处理连接变化
 */
function handleConnectionChange(): void {
  if ('connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: { addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void; effectiveType?: string } }).connection
    const effectiveType = connection?.effectiveType

    // 判断网络速度
    if (effectiveType === '4g') {
      if (networkStatus.value !== 'online') {
        networkStatus.value = 'online'
        notifyListeners('online')
      }
    } else if (effectiveType === '3g' || effectiveType === '2g') {
      if (networkStatus.value !== 'slow') {
        networkStatus.value = 'slow'
        console.log('[网络监听] 检测到慢速网络:', effectiveType)
        ElMessage.warning('网络速度较慢，部分功能可能受影响')
        notifyListeners('slow')
      }
    }
  }
}

/**
 * 订阅网络状态变化
 */
export function onNetworkStatusChange(callback: NetworkStatusCallback): () => void {
  listeners.add(callback)
  
  // 返回取消订阅函数
  return () => {
    listeners.delete(callback)
  }
}

/**
 * 通知所有监听器
 */
function notifyListeners(status: NetworkStatus): void {
  listeners.forEach((callback) => {
    try {
      callback(status)
    } catch (error) {
      console.error('[网络监听] 回调执行失败:', error)
    }
  })
}

/**
 * 获取当前网络状态
 */
export function getNetworkStatus(): NetworkStatus {
  return networkStatus.value
}

/**
 * 检查是否在线
 */
export function checkIsOnline(): boolean {
  return isOnline.value
}

/**
 * 获取最后一次状态变化的时间
 */
export function getLastStatusChangeTime(): number {
  return lastStatusChange.value
}

/**
 * 手动设置网络状态（用于测试）
 */
export function setNetworkStatus(status: NetworkStatus): void {
  if (networkStatus.value !== status) {
    networkStatus.value = status
    isOnline.value = status === 'online'
    lastStatusChange.value = Date.now()
    notifyListeners(status)
    console.log('[网络监听] 网络状态已手动设置:', status)
  }
}

/**
 * 测试网络连接
 */
export async function testNetworkConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache'
    })
    return response.ok
  } catch (error) {
    console.error('[网络监听] 网络连接测试失败:', error)
    return false
  }
}

/**
 * 等待网络恢复
 */
export async function waitForNetworkRecovery(timeout: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOnline.value) {
      resolve(true)
      return
    }

    const unsubscribe = onNetworkStatusChange((status) => {
      if (status === 'online') {
        unsubscribe()
        resolve(true)
      }
    })

    // 超时处理
    setTimeout(() => {
      unsubscribe()
      resolve(false)
    }, timeout)
  })
}
