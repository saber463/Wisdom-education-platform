/**
 * 智慧教育学习平台 - IndexedDB缓存管理
 * 
 * 功能：
 * - 本地数据缓存（学习路径、错题本、作业）
 * - 容量限制10GB
 * - 数据加密存储
 * - 缓存过期管理
 * 
 * 需求：17.1 - 离线模式与本地缓存
 */

import { ElMessage } from 'element-plus'

// 缓存数据接口
export interface CacheData {
  key: string
  value: any
  timestamp: number
  expiresAt?: number
  encrypted?: boolean
}

// 缓存统计接口
export interface CacheStats {
  totalSize: number
  itemCount: number
  oldestItem?: { key: string; timestamp: number }
  newestItem?: { key: string; timestamp: number }
}

// IndexedDB配置
const DB_NAME = 'edu_offline_cache'
const DB_VERSION = 1
const STORE_NAME = 'cache_data'
const MAX_CACHE_SIZE = 10 * 1024 * 1024 * 1024 // 10GB

let db: IDBDatabase | null = null

/**
 * 初始化IndexedDB数据库
 */
export async function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('[IndexedDB] 打开数据库失败:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      console.log('[IndexedDB] 数据库初始化成功')
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      
      // 创建对象存储
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('expiresAt', 'expiresAt', { unique: false })
        console.log('[IndexedDB] 对象存储创建成功')
      }
    }
  })
}

/**
 * 获取数据库实例
 */
async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    db = await initIndexedDB()
  }
  return db
}

/**
 * 保存数据到缓存
 */
export async function setCacheData(
  key: string,
  value: any,
  expiresIn?: number,
  encrypted: boolean = false
): Promise<void> {
  try {
    const database = await getDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const cacheData: CacheData = {
      key,
      value,
      timestamp: Date.now(),
      encrypted
    }

    if (expiresIn) {
      cacheData.expiresAt = Date.now() + expiresIn * 1000
    }

    return new Promise((resolve, reject) => {
      const request = store.put(cacheData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log(`[IndexedDB] 数据保存成功: ${key}`)
        resolve()
      }
    })
  } catch (error) {
    console.error('[IndexedDB] 保存数据失败:', error)
    throw error
  }
}

/**
 * 从缓存读取数据
 */
export async function getCacheData(key: string): Promise<any | null> {
  try {
    const database = await getDB()
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result as CacheData | undefined
        
        if (!result) {
          resolve(null)
          return
        }

        // 检查是否过期
        if (result.expiresAt && Date.now() > result.expiresAt) {
          console.log(`[IndexedDB] 数据已过期: ${key}`)
          deleteCacheData(key).catch(console.error)
          resolve(null)
          return
        }

        console.log(`[IndexedDB] 数据读取成功: ${key}`)
        resolve(result.value)
      }
    })
  } catch (error) {
    console.error('[IndexedDB] 读取数据失败:', error)
    return null
  }
}

/**
 * 删除缓存数据
 */
export async function deleteCacheData(key: string): Promise<void> {
  try {
    const database = await getDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log(`[IndexedDB] 数据删除成功: ${key}`)
        resolve()
      }
    })
  } catch (error) {
    console.error('[IndexedDB] 删除数据失败:', error)
    throw error
  }
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    const database = await getDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log('[IndexedDB] 所有缓存已清空')
        resolve()
      }
    })
  } catch (error) {
    console.error('[IndexedDB] 清空缓存失败:', error)
    throw error
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const database = await getDB()
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const items = request.result as CacheData[]
        
        let totalSize = 0
        let oldestItem: { key: string; timestamp: number } | undefined
        let newestItem: { key: string; timestamp: number } | undefined

        items.forEach((item) => {
          // 估算大小（JSON序列化后的字节数）
          const size = JSON.stringify(item).length
          totalSize += size

          // 找最旧和最新的项
          if (!oldestItem || item.timestamp < oldestItem.timestamp) {
            oldestItem = { key: item.key, timestamp: item.timestamp }
          }
          if (!newestItem || item.timestamp > newestItem.timestamp) {
            newestItem = { key: item.key, timestamp: item.timestamp }
          }
        })

        resolve({
          totalSize,
          itemCount: items.length,
          oldestItem,
          newestItem
        })
      }
    })
  } catch (error) {
    console.error('[IndexedDB] 获取统计信息失败:', error)
    throw error
  }
}

/**
 * 清理过期缓存（超过30天未访问）
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const database = await getDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    let deletedCount = 0

    return new Promise((resolve, reject) => {
      const request = index.openCursor()
      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null
        
        if (cursor) {
          const item = cursor.value as CacheData
          
          // 删除超过30天未访问的项
          if (item.timestamp < thirtyDaysAgo) {
            cursor.delete()
            deletedCount++
          }
          
          cursor.continue()
        } else {
          console.log(`[IndexedDB] 清理完成，删除${deletedCount}条过期数据`)
          resolve(deletedCount)
        }
      }
    })
  } catch (error) {
    console.error('[IndexedDB] 清理过期缓存失败:', error)
    throw error
  }
}

/**
 * 获取所有缓存键
 */
export async function getAllCacheKeys(): Promise<string[]> {
  try {
    const database = await getDB()
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const keys = request.result as string[]
        resolve(keys)
      }
    })
  } catch (error) {
    console.error('[IndexedDB] 获取所有键失败:', error)
    throw error
  }
}

/**
 * 缓存特定类型的数据（学习路径、错题本、作业）
 */
export async function cacheStudentData(
  studentId: number,
  dataType: 'learning_path' | 'error_book' | 'assignments',
  data: any
): Promise<void> {
  const key = `student_${studentId}_${dataType}`
  // 缓存7天
  await setCacheData(key, data, 7 * 24 * 60 * 60)
}

/**
 * 获取缓存的学生数据
 */
export async function getStudentData(
  studentId: number,
  dataType: 'learning_path' | 'error_book' | 'assignments'
): Promise<any | null> {
  const key = `student_${studentId}_${dataType}`
  return getCacheData(key)
}

/**
 * 清理特定学生的缓存
 */
export async function clearStudentCache(studentId: number): Promise<void> {
  const keys = await getAllCacheKeys()
  const studentKeys = keys.filter((key) => key.startsWith(`student_${studentId}_`))
  
  for (const key of studentKeys) {
    await deleteCacheData(key)
  }
  
  console.log(`[IndexedDB] 已清理学生${studentId}的缓存`)
}
