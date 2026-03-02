/**
 * 智慧教育学习平台 - 离线模式Composable
 * 
 * 功能：
 * - 在Vue组件中使用离线模式
 * - 简化离线功能的集成
 * 
 * 需求：17.1-17.8 - 离线模式与本地缓存
 */

import { onMounted, onUnmounted } from 'vue'
import { useOfflineStore } from '@/stores/offline'
import { ElMessage } from 'element-plus'

/**
 * 使用离线模式
 */
export function useOffline() {
  const offlineStore = useOfflineStore()

  /**
   * 初始化离线模式
   */
  async function initOffline(): Promise<void> {
    try {
      if (!offlineStore.isInitialized) {
        await offlineStore.initialize()
      }
    } catch (error) {
      console.error('[离线模式] 初始化失败:', error)
      ElMessage.error('离线模式初始化失败')
    }
  }

  /**
   * 缓存数据
   */
  async function cacheData(
    studentId: number,
    dataType: 'learning_path' | 'error_book' | 'assignments',
    data: unknown
  ): Promise<void> {
    try {
      await offlineStore.cacheData(studentId, dataType, data)
    } catch (error) {
      console.error('[离线模式] 缓存数据失败:', error)
      ElMessage.error('缓存数据失败')
    }
  }

  /**
   * 获取缓存数据
   */
  async function getCachedData(
    studentId: number,
    dataType: 'learning_path' | 'error_book' | 'assignments'
  ): Promise<unknown | null> {
    try {
      return await offlineStore.getCachedData(studentId, dataType)
    } catch (error) {
      console.error('[离线模式] 获取缓存数据失败:', error)
      return null
    }
  }

  /**
   * 添加离线编辑
   */
  async function addOfflineEdit(
    type: 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    data: unknown
  ): Promise<string> {
    try {
      return await offlineStore.addEdit(type, resource, resourceId, data)
    } catch (error) {
      console.error('[离线模式] 添加编辑失败:', error)
      ElMessage.error('添加编辑失败')
      throw error
    }
  }

  /**
   * 同步队列
   */
  async function syncOfflineQueue(): Promise<void> {
    try {
      await offlineStore.syncQueue()
    } catch (error) {
      console.error('[离线模式] 同步失败:', error)
      ElMessage.error('同步失败')
    }
  }

  /**
   * 清理缓存
   */
  async function cleanupOfflineCache(): Promise<void> {
    try {
      const deletedCount = await offlineStore.cleanupCache()
      ElMessage.success(`已清理${deletedCount}条过期缓存`)
    } catch (error) {
      console.error('[离线模式] 清理缓存失败:', error)
      ElMessage.error('清理缓存失败')
    }
  }

  /**
   * 清空所有缓存
   */
  async function clearOfflineCache(): Promise<void> {
    try {
      await offlineStore.clearCache()
      ElMessage.success('已清空所有缓存')
    } catch (error) {
      console.error('[离线模式] 清空缓存失败:', error)
      ElMessage.error('清空缓存失败')
    }
  }

  /**
   * 在组件挂载时初始化
   */
  function useOfflineOnMount(): void {
    onMounted(() => {
      initOffline().catch(console.error)
    })

    onUnmounted(() => {
      // 可选：在组件卸载时清理
      // offlineStore.cleanup()
    })
  }

  return {
    // 状态
    isOfflineMode: offlineStore.isOfflineMode,
    isSlowNetwork: offlineStore.isSlowNetwork,
    networkStatus: offlineStore.networkStatus,
    cacheStats: offlineStore.cacheStats,
    syncStatus: offlineStore.syncStatus,

    // 方法
    initOffline,
    cacheData,
    getCachedData,
    addOfflineEdit,
    syncOfflineQueue,
    cleanupOfflineCache,
    clearOfflineCache,
    useOfflineOnMount,

    // 直接访问store
    store: offlineStore
  }
}

/**
 * 在模板中使用离线模式状态
 */
export function useOfflineStatus() {
  const offlineStore = useOfflineStore()

  return {
    isOfflineMode: offlineStore.isOfflineMode,
    isSlowNetwork: offlineStore.isSlowNetwork,
    networkStatus: offlineStore.networkStatus,
    isOnline: !offlineStore.isOfflineMode,
    cacheStats: offlineStore.cacheStats,
    syncStatus: offlineStore.syncStatus
  }
}
