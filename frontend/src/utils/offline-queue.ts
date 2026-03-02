/**
 * 智慧教育学习平台 - 离线编辑队列
 * 
 * 功能：
 * - 离线编辑操作暂存到本地队列
 * - 联网后自动同步到服务器
 * - 支持冲突解决策略
 * 
 * 需求：17.4 - 离线编辑队列
 */

import { ref, computed } from 'vue'
import { setCacheData, getCacheData, deleteCacheData } from './indexeddb-cache'
import { ElMessage } from 'element-plus'

// 编辑操作类型
export type OperationType = 'create' | 'update' | 'delete'

// 冲突解决策略
export type ConflictStrategy = 'server' | 'client' | 'merge'

// 编辑队列项
export interface QueueItem {
  id: string
  type: OperationType
  resource: string // 资源类型（如'assignment', 'note'）
  resourceId: string
  data: unknown
  timestamp: number
  synced: boolean
  syncError?: string
}

// 同步结果
export interface SyncResult {
  success: boolean
  itemId: string
  error?: string
  serverData?: unknown
}

// 队列状态
const queue = ref<QueueItem[]>([])
const isSyncing = ref<boolean>(false)
const lastSyncTime = ref<number>(0)
const syncErrors = ref<Map<string, string>>(new Map())

// 计算属性
export const queueLength = computed(() => queue.value.length)
export const unsyncedCount = computed(() => queue.value.filter((item) => !item.synced).length)
export const hasErrors = computed(() => syncErrors.value.size > 0)

// 队列存储键
const QUEUE_STORAGE_KEY = 'offline_edit_queue'

/**
 * 初始化离线队列
 */
export async function initOfflineQueue(): Promise<void> {
  try {
    const storedQueue = await getCacheData(QUEUE_STORAGE_KEY)
    if (storedQueue && Array.isArray(storedQueue)) {
      queue.value = storedQueue
      console.log(`[离线队列] 已加载${queue.value.length}条待同步操作`)
    }
  } catch (error) {
    console.error('[离线队列] 初始化失败:', error)
  }
}

/**
 * 添加编辑操作到队列
 */
export async function addToQueue(
  type: OperationType,
  resource: string,
  resourceId: string,
  data: unknown
): Promise<string> {
  const id = `${resource}_${resourceId}_${Date.now()}_${Math.random()}`
  
  const item: QueueItem = {
    id,
    type,
    resource,
    resourceId,
    data,
    timestamp: Date.now(),
    synced: false
  }

  queue.value.push(item)
  
  // 持久化到IndexedDB
  await setCacheData(QUEUE_STORAGE_KEY, queue.value)
  
  console.log(`[离线队列] 已添加操作: ${type} ${resource}/${resourceId}`)
  ElMessage.info('操作已保存，将在网络恢复时同步')
  
  return id
}

/**
 * 从队列移除项
 */
export async function removeFromQueue(itemId: string): Promise<void> {
  const index = queue.value.findIndex((item) => item.id === itemId)
  if (index !== -1) {
    queue.value.splice(index, 1)
    await setCacheData(QUEUE_STORAGE_KEY, queue.value)
    console.log(`[离线队列] 已移除操作: ${itemId}`)
  }
}

/**
 * 标记项为已同步
 */
export async function markAsSynced(itemId: string): Promise<void> {
  const item = queue.value.find((i) => i.id === itemId)
  if (item) {
    item.synced = true
    await setCacheData(QUEUE_STORAGE_KEY, queue.value)
    syncErrors.value.delete(itemId)
    console.log(`[离线队列] 已标记为同步: ${itemId}`)
  }
}

/**
 * 标记项同步失败
 */
export async function markSyncError(itemId: string, error: string): Promise<void> {
  const item = queue.value.find((i) => i.id === itemId)
  if (item) {
    item.syncError = error
    syncErrors.value.set(itemId, error)
    await setCacheData(QUEUE_STORAGE_KEY, queue.value)
    console.log(`[离线队列] 同步失败: ${itemId} - ${error}`)
  }
}

/**
 * 获取待同步的操作
 */
export function getUnsyncedItems(): QueueItem[] {
  return queue.value.filter((item) => !item.synced)
}

/**
 * 获取特定资源的操作
 */
export function getItemsByResource(resource: string, resourceId?: string): QueueItem[] {
  return queue.value.filter((item) => {
    if (item.resource !== resource) return false
    if (resourceId && item.resourceId !== resourceId) return false
    return true
  })
}

/**
 * 清空队列
 */
export async function clearQueue(): Promise<void> {
  queue.value = []
  syncErrors.value.clear()
  await deleteCacheData(QUEUE_STORAGE_KEY)
  console.log('[离线队列] 已清空')
}

/**
 * 获取队列统计信息
 */
export function getQueueStats() {
  return {
    total: queue.value.length,
    unsynced: unsyncedCount.value,
    errors: syncErrors.value.size,
    lastSyncTime: lastSyncTime.value,
    isSyncing: isSyncing.value
  }
}

/**
 * 同步队列到服务器
 */
export async function syncQueueToServer(
  syncHandler: (item: QueueItem) => Promise<SyncResult>,
  _conflictStrategy: ConflictStrategy = 'server'
): Promise<SyncResult[]> {
  if (isSyncing.value) {
    console.warn('[离线队列] 正在同步中，请勿重复操作')
    return []
  }

  isSyncing.value = true
  const results: SyncResult[] = []
  const unsyncedItems = getUnsyncedItems()

  console.log(`[离线队列] 开始同步${unsyncedItems.length}条操作`)

  for (const item of unsyncedItems) {
    try {
      const result = await syncHandler(item)
      results.push(result)

      if (result.success) {
        await markAsSynced(item.id)
        console.log(`[离线队列] 同步成功: ${item.id}`)
      } else {
        await markSyncError(item.id, result.error || '未知错误')
        console.error(`[离线队列] 同步失败: ${item.id} - ${result.error}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      await markSyncError(item.id, errorMsg)
      results.push({
        success: false,
        itemId: item.id,
        error: errorMsg
      })
    }
  }

  isSyncing.value = false
  lastSyncTime.value = Date.now()

  // 移除已同步的项
  queue.value = queue.value.filter((item) => !item.synced)
  await setCacheData(QUEUE_STORAGE_KEY, queue.value)

  const successCount = results.filter((r) => r.success).length
  console.log(`[离线队列] 同步完成: ${successCount}/${unsyncedItems.length}成功`)

  if (successCount === unsyncedItems.length) {
    ElMessage.success('所有操作已同步')
  } else if (successCount > 0) {
    ElMessage.warning(`部分操作同步失败，${unsyncedItems.length - successCount}条待重试`)
  } else {
    ElMessage.error('操作同步失败，请检查网络连接')
  }

  return results
}

/**
 * 重试失败的同步
 */
export async function retrySyncErrors(
  syncHandler: (item: QueueItem) => Promise<SyncResult>
): Promise<SyncResult[]> {
  const errorItems = queue.value.filter((item) => item.syncError)
  
  if (errorItems.length === 0) {
    console.log('[离线队列] 没有失败的操作需要重试')
    return []
  }

  console.log(`[离线队列] 重试${errorItems.length}条失败的操作`)
  
  const results: SyncResult[] = []
  
  for (const item of errorItems) {
    try {
      const result = await syncHandler(item)
      results.push(result)

      if (result.success) {
        await markAsSynced(item.id)
      } else {
        await markSyncError(item.id, result.error || '未知错误')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      await markSyncError(item.id, errorMsg)
      results.push({
        success: false,
        itemId: item.id,
        error: errorMsg
      })
    }
  }

  return results
}

/**
 * 获取同步错误
 */
export function getSyncErrors(): Map<string, string> {
  return new Map(syncErrors.value)
}

/**
 * 清除特定项的同步错误
 */
export async function clearSyncError(itemId: string): Promise<void> {
  const item = queue.value.find((i) => i.id === itemId)
  if (item) {
    item.syncError = undefined
    syncErrors.value.delete(itemId)
    await setCacheData(QUEUE_STORAGE_KEY, queue.value)
  }
}

/**
 * 合并冲突的操作
 */
export function mergeConflictingOperations(
  localItem: QueueItem,
  serverData: unknown,
  strategy: ConflictStrategy
): unknown {
  switch (strategy) {
    case 'server':
      // 服务器优先
      return serverData
    
    case 'client':
      // 客户端优先
      return localItem.data
    
    case 'merge':
      // 合并策略：保留服务器的基础数据，覆盖客户端的修改
      return {
        ...(typeof serverData === 'object' && serverData !== null ? serverData : {}),
        ...(typeof localItem.data === 'object' && localItem.data !== null ? localItem.data : {}),
        _mergedAt: Date.now()
      }
    
    default:
      return serverData
  }
}

/**
 * 导出队列数据（用于调试）
 */
export function exportQueueData(): string {
  return JSON.stringify(queue.value, null, 2)
}

/**
 * 导入队列数据（用于恢复）
 */
export async function importQueueData(data: string): Promise<void> {
  try {
    const imported = JSON.parse(data)
    if (Array.isArray(imported)) {
      queue.value = imported
      await setCacheData(QUEUE_STORAGE_KEY, queue.value)
      console.log(`[离线队列] 已导入${imported.length}条操作`)
    }
  } catch (error) {
    console.error('[离线队列] 导入失败:', error)
    throw error
  }
}
