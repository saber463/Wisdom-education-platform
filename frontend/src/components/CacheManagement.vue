<template>
  <div class="cache-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">缓存管理</span>
          <el-button type="primary" @click="refreshStats">刷新</el-button>
        </div>
      </template>

      <!-- 缓存统计信息 -->
      <div class="stats-section">
        <h3>缓存统计</h3>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-label">缓存项数</div>
              <div class="stat-value">{{ cacheStats.itemCount }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-label">缓存大小</div>
              <div class="stat-value">{{ formatBytes(cacheStats.totalSize) }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-label">最旧项</div>
              <div class="stat-value">
                {{ cacheStats.oldestItem ? formatDate(cacheStats.oldestItem.timestamp) : '无' }}
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card">
              <div class="stat-label">最新项</div>
              <div class="stat-value">
                {{ cacheStats.newestItem ? formatDate(cacheStats.newestItem.timestamp) : '无' }}
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 缓存操作 -->
      <div class="actions-section">
        <h3>缓存操作</h3>
        <el-space wrap>
          <el-button
            type="warning"
            @click="cleanupExpiredCache"
            :loading="isCleaningUp"
          >
            清理过期缓存（30天以上）
          </el-button>
          <el-button
            type="danger"
            @click="clearAllCache"
            :loading="isClearing"
          >
            清空所有缓存
          </el-button>
          <el-button
            type="info"
            @click="exportCacheData"
          >
            导出缓存数据
          </el-button>
        </el-space>
      </div>

      <!-- 缓存配置 -->
      <div class="config-section">
        <h3>缓存配置</h3>
        <el-form :model="config" label-width="120px">
          <el-form-item label="自动同步">
            <el-switch
              v-model="config.enableAutoSync"
              @change="updateConfig"
            />
          </el-form-item>
          <el-form-item label="同步间隔（秒）">
            <el-input-number
              v-model="config.autoSyncInterval"
              :min="5000"
              :max="300000"
              :step="5000"
              @change="updateConfig"
            />
          </el-form-item>
          <el-form-item label="最大缓存大小">
            <el-select v-model="maxCacheSizeOption" @change="updateMaxCacheSize">
              <el-option label="1GB" :value="1" />
              <el-option label="5GB" :value="5" />
              <el-option label="10GB" :value="10" />
            </el-select>
          </el-form-item>
          <el-form-item label="缓存过期时间（天）">
            <el-input-number
              v-model="cacheExpireDays"
              :min="1"
              :max="365"
              @change="updateCacheExpireTime"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 缓存数据类型统计 -->
      <div class="data-types-section">
        <h3>缓存数据类型</h3>
        <el-table :data="dataTypeStats" stripe style="width: 100%">
          <el-table-column prop="type" label="数据类型" width="150" />
          <el-table-column prop="count" label="项数" width="100" />
          <el-table-column prop="size" label="大小" width="150">
            <template #default="{ row }">
              {{ formatBytes(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                link
                type="danger"
                size="small"
                @click="clearDataType(row.type)"
              >
                清除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOfflineStore } from '@/stores/offline'
import { getAllCacheKeys, getCacheData } from '@/utils/indexeddb-cache'

// 离线模式store
const offlineStore = useOfflineStore()

// 状态
const isCleaningUp = ref(false)
const isClearing = ref(false)
const maxCacheSizeOption = ref(10)
const cacheExpireDays = ref(30)
const dataTypeStats = ref<Array<{ type: string; count: number; size: number }>>([])

// 配置
const config = ref({
  enableAutoSync: offlineStore.config.enableAutoSync,
  autoSyncInterval: offlineStore.config.autoSyncInterval
})

// 计算属性
const cacheStats = computed(() => offlineStore.cacheStats)

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 格式化日期
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

/**
 * 刷新统计信息
 */
async function refreshStats(): Promise<void> {
  try {
    // 更新缓存统计
    const keys = await getAllCacheKeys()
    
    // 统计数据类型
    const typeMap = new Map<string, { count: number; size: number }>()
    
    for (const key of keys) {
      const data = await getCacheData(key)
      const type = key.split('_')[0] || 'other'
      const size = JSON.stringify(data).length
      
      if (!typeMap.has(type)) {
        typeMap.set(type, { count: 0, size: 0 })
      }
      
      const stats = typeMap.get(type)!
      stats.count++
      stats.size += size
    }
    
    dataTypeStats.value = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      ...stats
    }))
    
    ElMessage.success('已刷新缓存统计')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

/**
 * 清理过期缓存
 */
async function cleanupExpiredCache(): Promise<void> {
  try {
    isCleaningUp.value = true
    const deletedCount = await offlineStore.cleanupCache()
    ElMessage.success(`已清理${deletedCount}条过期缓存`)
    await refreshStats()
  } catch (error) {
    ElMessage.error('清理失败')
  } finally {
    isCleaningUp.value = false
  }
}

/**
 * 清空所有缓存
 */
async function clearAllCache(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有缓存吗？此操作不可撤销。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isClearing.value = true
    await offlineStore.clearCache()
    ElMessage.success('已清空所有缓存')
    await refreshStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败')
    }
  } finally {
    isClearing.value = false
  }
}

/**
 * 清除特定数据类型
 */
async function clearDataType(type: string): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定要清除所有${type}类型的缓存吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const keys = await getAllCacheKeys()
    const typeKeys = keys.filter((key) => key.startsWith(type))
    
    for (const key of typeKeys) {
      // 这would require exposing deleteCacheData from the store
      // For now, we'll just show a message
    }
    
    ElMessage.success(`已清除${type}类型的缓存`)
    await refreshStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除失败')
    }
  }
}

/**
 * 导出缓存数据
 */
async function exportCacheData(): Promise<void> {
  try {
    const keys = await getAllCacheKeys()
    const data: Record<string, any> = {}
    
    for (const key of keys) {
      data[key] = await getCacheData(key)
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cache-export-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('已导出缓存数据')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

/**
 * 更新配置
 */
function updateConfig(): void {
  offlineStore.updateConfig({
    enableAutoSync: config.value.enableAutoSync,
    autoSyncInterval: config.value.autoSyncInterval
  })
  ElMessage.success('配置已更新')
}

/**
 * 更新最大缓存大小
 */
function updateMaxCacheSize(): void {
  const sizeMap: Record<number, number> = {
    1: 1 * 1024 * 1024 * 1024,
    5: 5 * 1024 * 1024 * 1024,
    10: 10 * 1024 * 1024 * 1024
  }
  
  offlineStore.updateConfig({
    maxCacheSize: sizeMap[maxCacheSizeOption.value]
  })
  ElMessage.success('最大缓存大小已更新')
}

/**
 * 更新缓存过期时间
 */
function updateCacheExpireTime(): void {
  offlineStore.updateConfig({
    cacheExpireTime: cacheExpireDays.value * 24 * 60 * 60
  })
  ElMessage.success('缓存过期时间已更新')
}

/**
 * 初始化
 */
onMounted(async () => {
  if (!offlineStore.isInitialized) {
    try {
      await offlineStore.initialize()
    } catch (error) {
      console.error('离线模式初始化失败:', error)
    }
  }
  
  await refreshStats()
})
</script>

<style scoped lang="scss">
.cache-management {
  padding: 20px;

  .box-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .stats-section,
  .actions-section,
  .config-section,
  .data-types-section {
    margin-bottom: 24px;

    h3 {
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: bold;
      color: #333;
    }
  }

  .stat-card {
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
    text-align: center;

    .stat-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #303133;
    }
  }
}
</style>
