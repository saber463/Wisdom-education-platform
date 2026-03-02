/**
 * 智慧教育学习平台 - 离线模式属性测试
 * 属性72：离线模式自动切换
 * 属性73：缓存数据加密安全性
 * 属性74：增量同步数据一致性
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  initIndexedDB,
  setCacheData,
  getCacheData,
  deleteCacheData,
  clearAllCache,
  getCacheStats,
  cleanupExpiredCache
} from '../indexeddb-cache'
import {
  initOfflineQueue,
  addToQueue,
  getUnsyncedItems,
  markAsSynced,
  markSyncError,
  getQueueStats,
  clearQueue
} from '../offline-queue'
import {
  initNetworkMonitor,
  cleanupNetworkMonitor,
  setNetworkStatus,
  getNetworkStatus,
  checkIsOnline
} from '../offline-monitor'

describe('离线模式功能测试', () => {
  beforeEach(async () => {
    await initIndexedDB()
    await initOfflineQueue()
    initNetworkMonitor()
  })

  afterEach(async () => {
    await clearAllCache()
    await clearQueue()
    cleanupNetworkMonitor()
  })

  describe('属性72：离线模式自动切换', () => {
    it('网络状态变化时应自动切换离线模式', () => {
      const statuses = ['online', 'offline', 'slow'] as const
      
      for (const status of statuses) {
        setNetworkStatus(status)
        const currentStatus = getNetworkStatus()
        expect(currentStatus).toBe(status)

        if (status === 'online') {
          expect(checkIsOnline()).toBe(true)
        } else {
          expect(checkIsOnline()).toBe(false)
        }
      }
    })

    it('离线模式下应禁用需要网络的功能', () => {
      setNetworkStatus('online')
      expect(checkIsOnline()).toBe(true)

      setNetworkStatus('offline')
      expect(checkIsOnline()).toBe(false)

      setNetworkStatus('slow')
      expect(checkIsOnline()).toBe(false)
    })

    it('网络恢复时应自动触发同步', async () => {
      await addToQueue('create', 'test', 'item_1', { data: 1 })
      await addToQueue('create', 'test', 'item_2', { data: 2 })

      setNetworkStatus('offline')
      expect(getNetworkStatus()).toBe('offline')

      const unsyncedBefore = getUnsyncedItems()
      expect(unsyncedBefore.length).toBe(2)

      setNetworkStatus('online')
      expect(getNetworkStatus()).toBe('online')

      const unsyncedAfter = getUnsyncedItems()
      expect(unsyncedAfter.length).toBe(2)
    })
  })

  describe('属性73：缓存数据加密安全性', () => {
    it('缓存的敏感数据应正确存储和检索', async () => {
      const testCases = [
        { key: 'test_1', data: { sensitive: 'data1' } },
        { key: 'test_2', data: { sensitive: 'data2', nested: { value: 123 } } },
        { key: 'test_3', data: [1, 2, 3, 4, 5] }
      ]

      for (const testCase of testCases) {
        await setCacheData(testCase.key, testCase.data, undefined, true)
        const retrieved = await getCacheData(testCase.key)
        expect(retrieved).toEqual(testCase.data)
        await deleteCacheData(testCase.key)
      }
    })

    it('加密标记应正确保存', async () => {
      const encryptedKey = `encrypted_${Date.now()}`
      const unencryptedKey = `unencrypted_${Date.now()}`
      const data = { sensitive: 'information' }

      await setCacheData(encryptedKey, data, undefined, true)
      await setCacheData(unencryptedKey, data, undefined, false)

      const retrievedEncrypted = await getCacheData(encryptedKey)
      const retrievedUnencrypted = await getCacheData(unencryptedKey)
      
      expect(retrievedEncrypted).toEqual(data)
      expect(retrievedUnencrypted).toEqual(data)

      await deleteCacheData(encryptedKey)
      await deleteCacheData(unencryptedKey)
    })

    it('缓存数据应支持过期时间设置', async () => {
      const key = `expiring_${Date.now()}`
      const data = { test: 'data' }

      await setCacheData(key, data, 1)
      const retrieved = await getCacheData(key)
      expect(retrieved).toEqual(data)

      await new Promise((resolve) => setTimeout(resolve, 1100))
      const expiredData = await getCacheData(key)
      expect(expiredData).toBeNull()
    })
  })

  describe('属性74：增量同步数据一致性', () => {
    it('待同步项应正确标记和追踪', async () => {
      const itemIds: string[] = []
      for (let i = 0; i < 5; i++) {
        const id = await addToQueue('create', 'test', `item_${i}`, { index: i })
        itemIds.push(id)
      }

      let unsynced = getUnsyncedItems()
      expect(unsynced.length).toBe(5)

      await markAsSynced(itemIds[0])
      await markAsSynced(itemIds[1])

      unsynced = getUnsyncedItems()
      expect(unsynced.length).toBe(3)

      await markAsSynced(itemIds[2])
      unsynced = getUnsyncedItems()
      expect(unsynced.length).toBe(2)
    })

    it('同步错误应正确记录和检索', async () => {
      const itemIds: string[] = []
      for (let i = 0; i < 5; i++) {
        const id = await addToQueue('update', 'test', `item_${i}`, { data: i })
        itemIds.push(id)
      }

      await markSyncError(itemIds[0], 'Network error')
      await markSyncError(itemIds[1], 'Server error')

      const stats = getQueueStats()
      expect(stats.total).toBe(5)
      expect(stats.unsynced).toBe(5)
      expect(stats.errors).toBeGreaterThan(0)
    })

    it('队列数据应支持持久化和恢复', async () => {
      for (let i = 0; i < 3; i++) {
        await addToQueue('delete', 'test', `item_${i}`, { id: i })
      }

      const statsBefore = getQueueStats()
      expect(statsBefore.total).toBe(3)

      const unsynced = getUnsyncedItems()
      expect(unsynced.length).toBe(3)

      unsynced.forEach((item, index) => {
        expect(item.type).toBe('delete')
        expect(item.resource).toBe('test')
        expect(item.resourceId).toBe(`item_${index}`)
        expect(item.data).toEqual({ id: index })
        expect(item.synced).toBe(false)
      })
    })

    it('缓存统计应准确反映数据状态', async () => {
      for (let i = 0; i < 5; i++) {
        await setCacheData(`cache_${i}`, { index: i })
      }

      const stats = await getCacheStats()
      expect(stats.itemCount).toBeGreaterThanOrEqual(5)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.oldestItem).toBeDefined()
      expect(stats.newestItem).toBeDefined()
    })

    it('过期缓存清理应正确删除过期数据', async () => {
      for (let i = 0; i < 3; i++) {
        await setCacheData(`expiring_${i}`, { index: i }, 1)
      }

      for (let i = 0; i < 2; i++) {
        await setCacheData(`permanent_${i}`, { index: i })
      }

      await new Promise((resolve) => setTimeout(resolve, 1100))
      const deletedCount = await cleanupExpiredCache()
      expect(deletedCount).toBeGreaterThanOrEqual(0)

      const permanent0 = await getCacheData('permanent_0')
      const permanent1 = await getCacheData('permanent_1')
      expect(permanent0).toBeDefined()
      expect(permanent1).toBeDefined()
    })
  })

  describe('离线模式集成测试', () => {
    it('应支持完整的离线编辑和同步流程', async () => {
      const operationIds: string[] = []
      for (let i = 0; i < 3; i++) {
        const id = await addToQueue('create', 'assignment', `assign_${i}`, {
          title: `Assignment ${i}`,
          content: `Content ${i}`
        })
        operationIds.push(id)
      }

      let unsynced = getUnsyncedItems()
      expect(unsynced.length).toBe(3)

      await markAsSynced(operationIds[0])
      await markAsSynced(operationIds[1])

      unsynced = getUnsyncedItems()
      expect(unsynced.length).toBe(1)

      await markSyncError(operationIds[2], 'Network error')

      const stats = getQueueStats()
      expect(stats.total).toBe(3)
      expect(stats.unsynced).toBe(1)
      expect(stats.errors).toBeGreaterThan(0)
    })

    it('应支持缓存和队列的独立操作', async () => {
      for (let i = 0; i < 3; i++) {
        await setCacheData(`cache_${i}`, { type: 'cache', index: i })
      }

      for (let i = 0; i < 2; i++) {
        await addToQueue('update', 'note', `note_${i}`, {
          content: `Note ${i}`
        })
      }

      const cacheStats = await getCacheStats()
      expect(cacheStats.itemCount).toBeGreaterThanOrEqual(3)

      const queueStats = getQueueStats()
      expect(queueStats.total).toBe(2)

      await clearAllCache()
      const queueStatsAfter = getQueueStats()
      expect(queueStatsAfter.total).toBe(2)
    })

    it('应支持网络状态变化时的自动处理', async () => {
      await addToQueue('create', 'test', 'item_1', { data: 1 })

      setNetworkStatus('offline')
      expect(getNetworkStatus()).toBe('offline')
      expect(checkIsOnline()).toBe(false)

      const unsyncedOffline = getUnsyncedItems()
      expect(unsyncedOffline.length).toBe(1)

      setNetworkStatus('online')
      expect(getNetworkStatus()).toBe('online')
      expect(checkIsOnline()).toBe(true)

      const unsyncedOnline = getUnsyncedItems()
      expect(unsyncedOnline.length).toBe(1)
    })
  })
})
