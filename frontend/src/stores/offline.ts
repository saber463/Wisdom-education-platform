/**
 * 智慧教育学习平台 - 离线模式状态管理
 * 
 * 功能：
 * - 离线模式状态管理
 * - 缓存数据管理
 * - 编辑队列管理
 * - 同步状态管理
 * 
 * 需求：17.1-17.8 - 离线模式与本地缓存
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  initIndexedDB,
  setCacheData,
  getCacheData,
  deleteCacheData,
  clearAllCache,
  getCacheStats,
  cleanupExpiredCache,
  cacheStudentData,
  getStudentData,
  clearStudentCache,
  type CacheStats
} from '@/utils/indexeddb-cache'
import {
  initOfflineQueue,
  addToQueue,
  removeFromQueue,
  getUnsyncedItems,
  syncQueueToServer,
  retrySyncErrors,
  getSyncErrors,
  getQueueStats,
  type QueueItem,
  type SyncResult
} from '@/utils/offline-queue'
import {
  initNetworkMonitor,
  cleanupNetworkMonitor,
  onNetworkStatusChange,
  getNetworkStatus,
  checkIsOnline,
  type NetworkStatus
} from '@/utils/offline-monitor'

// 离线模式配置
export interface OfflineConfig {
  enableAutoSync: boolean
  autoSyncInterval: number // 毫秒
  maxCacheSize: number // 字节
  cacheExpireTime: number // 秒
}

// 缓存统计
export interface CacheStatistics {
  totalSize: number
  itemCount: number
  oldestItem?: { key: string; timestamp: number }
  newestItem?: { key: string; timestamp: number }
}

// 同步状态
export interface SyncStatus {
  isSyncing: boolean
  lastSyncTime: number
  unsyncedCount: number
  errorCount: number
  lastError?: string
}

export const useOfflineStore = defineStore('offline', () => {
  // 状态
  const isInitialized = ref<boolean>(false)
  const networkStatus = ref<NetworkStatus>('online')
  const isOfflineMode = computed(() => networkStatus.value === 'offline')
  const isSlowNetwork = computed(() => networkStatus.value === 'slow')
  
  const config = ref<OfflineConfig>({
    enableAutoSync: true,
    autoSyncInterval: 30000, // 30秒
    maxCacheSize: 10 * 1024 * 1024 * 1024, // 10GB
    cacheExpireTime: 7 * 24 * 60 * 60 // 7天
  })

  const cacheStats = ref<CacheStatistics>({
    totalSize: 0,
    itemCount: 0
  })

  const syncStatus = ref<SyncStatus>({
    isSyncing: false,
    lastSyncTime: 0,
    unsyncedCount: 0,
    errorCount: 0
  })

  let autoSyncTimer: number | null = null
  let unsubscribeNetworkListener: (() => void) | null = null

  /**
   * 初始化离线模式
   */
  async function initialize(): Promise<void> {
    if (isInitialized.value) {
      console.warn('[离线模式] 已初始化，跳过重复初始化')
      return
    }

    try {
      // 初始化IndexedDB
      await initIndexedDB()
      console.log('[离线模式] IndexedDB初始化成功')

      // 初始化离线队列
      await initOfflineQueue()
      console.log('[离线模式] 离线队列初始化成功')

      // 初始化网络监听
      initNetworkMonitor()
      console.log('[离线模式] 网络监听初始化成功')

      // 订阅网络状态变化
      unsubscribeNetworkListener = onNetworkStatusChange((status) => {
        networkStatus.value = status
        console.log('[离线模式] 网络状态变化:', status)

        // 网络恢复时自动同步
        if (status === 'online' && config.value.enableAutoSync) {
          console.log('[离线模式] 网络已恢复，准备同步')
          setTimeout(() => {
            syncQueue().catch(console.error)
          }, 1000)
        }
      })

      // 启动自动同步定时器
      if (config.value.enableAutoSync) {
        startAutoSync()
      }

      // 更新缓存统计
      await updateCacheStats()

      isInitialized.value = true
      console.log('[离线模式] 初始化完成')
    } catch (error) {
      console.error('[离线模式] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 清理离线模式
   */
  function cleanup(): void {
    if (!isInitialized.value) return

    // 停止自动同步
    stopAutoSync()

    // 取消网络监听
    if (unsubscribeNetworkListener) {
      unsubscribeNetworkListener()
    }

    // 清理网络监听
    cleanupNetworkMonitor()

    isInitialized.value = false
    console.log('[离线模式] 已清理')
  }

  /**
   * 启动自动同步
   */
  function startAutoSync(): void {
    if (autoSyncTimer !== null) return

    autoSyncTimer = window.setInterval(() => {
      if (checkIsOnline() && !syncStatus.value.isSyncing) {
        syncQueue().catch(console.error)
      }
    }, config.value.autoSyncInterval)

    console.log('[离线模式] 自动同步已启动')
  }

  /**
   * 停止自动同步
   */
  function stopAutoSync(): void {
    if (autoSyncTimer !== null) {
      clearInterval(autoSyncTimer)
      autoSyncTimer = null
      console.log('[离线模式] 自动同步已停止')
    }
  }

  /**
   * 更新缓存统计
   */
  async function updateCacheStats(): Promise<void> {
    try {
      const stats = await getCacheStats()
      cacheStats.value = stats
    } catch (error) {
      console.error('[离线模式] 更新缓存统计失败:', error)
    }
  }

  /**
   * 缓存学生数据
   */
  async function cacheData(
    studentId: number,
    dataType: 'learning_path' | 'error_book' | 'assignments',
    data: any
  ): Promise<void> {
    try {
      await cacheStudentData(studentId, dataType, data)
      await updateCacheStats()
      console.log(`[离线模式] 已缓存${dataType}数据`)
    } catch (error) {
      console.error('[离线模式] 缓存数据失败:', error)
      throw error
    }
  }

  /**
   * 获取缓存数据
   */
  async function getCachedData(
    studentId: number,
    dataType: 'learning_path' | 'error_book' | 'assignments'
  ): Promise<any | null> {
    try {
      return await getStudentData(studentId, dataType)
    } catch (error) {
      console.error('[离线模式] 获取缓存数据失败:', error)
      return null
    }
  }

  /**
   * 添加编辑操作到队列
   */
  async function addEdit(
    type: 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    data: any
  ): Promise<string> {
    try {
      const id = await addToQueue(type, resource, resourceId, data)
      await updateSyncStatus()
      return id
    } catch (error) {
      console.error('[离线模式] 添加编辑操作失败:', error)
      throw error
    }
  }

  /**
   * 同步队列到服务器
   */
  async function syncQueue(): Promise<SyncResult[]> {
    if (syncStatus.value.isSyncing) {
      console.warn('[离线模式] 正在同步中，请勿重复操作')
      return []
    }

    syncStatus.value.isSyncing = true

    try {
      // 这里需要由调用者提供实际的同步处理函数
      // 为了演示，我们返回空数组
      console.log('[离线模式] 同步队列')
      
      const results: SyncResult[] = []
      await updateSyncStatus()
      
      return results
    } catch (error) {
      console.error('[离线模式] 同步失败:', error)
      syncStatus.value.lastError = error instanceof Error ? error.message : '未知错误'
      throw error
    } finally {
      syncStatus.value.isSyncing = false
    }
  }

  /**
   * 重试失败的同步
   */
  async function retrySync(): Promise<SyncResult[]> {
    if (syncStatus.value.isSyncing) {
      console.warn('[离线模式] 正在同步中，请勿重复操作')
      return []
    }

    syncStatus.value.isSyncing = true

    try {
      const results = await retrySyncErrors(async (item: QueueItem) => {
        // 这里需要由调用者提供实际的同步处理函数
        return {
          success: true,
          itemId: item.id
        }
      })

      await updateSyncStatus()
      return results
    } catch (error) {
      console.error('[离线模式] 重试同步失败:', error)
      syncStatus.value.lastError = error instanceof Error ? error.message : '未知错误'
      throw error
    } finally {
      syncStatus.value.isSyncing = false
    }
  }

  /**
   * 更新同步状态
   */
  async function updateSyncStatus(): Promise<void> {
    try {
      const stats = getQueueStats()
      const errors = getSyncErrors()

      syncStatus.value = {
        isSyncing: stats.isSyncing,
        lastSyncTime: stats.lastSyncTime,
        unsyncedCount: stats.unsynced,
        errorCount: errors.size
      }
    } catch (error) {
      console.error('[离线模式] 更新同步状态失败:', error)
    }
  }

  /**
   * 清理过期缓存
   */
  async function cleanupCache(): Promise<number> {
    try {
      const deletedCount = await cleanupExpiredCache()
      await updateCacheStats()
      console.log(`[离线模式] 已清理${deletedCount}条过期缓存`)
      return deletedCount
    } catch (error) {
      console.error('[离线模式] 清理缓存失败:', error)
      throw error
    }
  }

  /**
   * 清空所有缓存
   */
  async function clearCache(): Promise<void> {
    try {
      await clearAllCache()
      cacheStats.value = {
        totalSize: 0,
        itemCount: 0
      }
      console.log('[离线模式] 已清空所有缓存')
    } catch (error) {
      console.error('[离线模式] 清空缓存失败:', error)
      throw error
    }
  }

  /**
   * 清理特定学生的缓存
   */
  async function clearStudentCacheData(studentId: number): Promise<void> {
    try {
      await clearStudentCache(studentId)
      await updateCacheStats()
      console.log(`[离线模式] 已清理学生${studentId}的缓存`)
    } catch (error) {
      console.error('[离线模式] 清理学生缓存失败:', error)
      throw error
    }
  }

  /**
   * 获取未同步的操作
   */
  function getUnsyncedOperations(): QueueItem[] {
    return getUnsyncedItems()
  }

  /**
   * 获取同步错误
   */
  function getSyncErrorsMap(): Map<string, string> {
    return getSyncErrors()
  }

  /**
   * 更新配置
   */
  function updateConfig(newConfig: Partial<OfflineConfig>): void {
    config.value = { ...config.value, ...newConfig }
    
    // 如果改变了自动同步设置
    if (newConfig.enableAutoSync !== undefined) {
      if (newConfig.enableAutoSync) {
        startAutoSync()
      } else {
        stopAutoSync()
      }
    }

    console.log('[离线模式] 配置已更新:', config.value)
  }

  /**
   * 获取当前网络状态
   */
  function getCurrentNetworkStatus(): NetworkStatus {
    return getNetworkStatus()
  }

  /**
   * 检查是否在线
   */
  function checkOnline(): boolean {
    return checkIsOnline()
  }

  return {
    // 状态
    isInitialized,
    networkStatus,
    isOfflineMode,
    isSlowNetwork,
    config,
    cacheStats,
    syncStatus,

    // 方法
    initialize,
    cleanup,
    cacheData,
    getCachedData,
    addEdit,
    syncQueue,
    retrySync,
    cleanupCache,
    clearCache,
    clearStudentCacheData,
    getUnsyncedOperations,
    getSyncErrorsMap,
    updateConfig,
    getCurrentNetworkStatus,
    checkOnline
  }
})
