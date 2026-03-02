<template>
  <div
    v-if="showIndicator"
    class="offline-indicator"
    :class="indicatorClass"
  >
    <el-icon class="indicator-icon">
      <component :is="statusIcon" />
    </el-icon>
    <span class="indicator-text">{{ statusText }}</span>
    <el-tooltip
      v-if="isOfflineMode"
      content="点击查看缓存统计"
      placement="bottom"
    >
      <el-button
        link
        type="primary"
        size="small"
        @click="showCacheStats"
      >
        详情
      </el-button>
    </el-tooltip>
  </div>

  <!-- 缓存统计对话框 -->
  <el-dialog
    v-model="cacheStatsVisible"
    title="缓存统计信息"
    width="400px"
    @close="cacheStatsVisible = false"
  >
    <div class="cache-stats-content">
      <el-descriptions
        :column="1"
        border
      >
        <el-descriptions-item label="缓存项数">
          {{ cacheStats.itemCount }}
        </el-descriptions-item>
        <el-descriptions-item label="缓存大小">
          {{ formatBytes(cacheStats.totalSize) }}
        </el-descriptions-item>
        <el-descriptions-item label="最旧项">
          {{ cacheStats.oldestItem ? formatDate(cacheStats.oldestItem.timestamp) : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="最新项">
          {{ cacheStats.newestItem ? formatDate(cacheStats.newestItem.timestamp) : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="待同步操作">
          {{ syncStatus.unsyncedCount }}
        </el-descriptions-item>
        <el-descriptions-item label="同步错误">
          {{ syncStatus.errorCount }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="cache-actions">
        <el-button
          type="warning"
          size="small"
          @click="cleanupCache"
        >
          清理过期缓存
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="clearAllCache"
        >
          清空所有缓存
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOfflineStore } from '@/stores/offline'
import { Connection, TurnOff, Cloudy } from '@element-plus/icons-vue'

// 离线模式store
const offlineStore = useOfflineStore()

// 状态（暴露给模板）
const cacheStatsVisible = ref(false)
const isOfflineMode = computed(() => offlineStore.isOfflineMode)
const showIndicator = computed(() => {
  return offlineStore.isOfflineMode || offlineStore.isSlowNetwork
})

// 指示器样式
const indicatorClass = computed(() => {
  if (offlineStore.isOfflineMode) return 'offline'
  if (offlineStore.isSlowNetwork) return 'slow'
  return 'online'
})

// 状态文本
const statusText = computed(() => {
  if (offlineStore.isOfflineMode) return '离线模式'
  if (offlineStore.isSlowNetwork) return '慢速网络'
  return '在线'
})

// 状态图标
const statusIcon = computed(() => {
  if (offlineStore.isOfflineMode) return TurnOff
  if (offlineStore.isSlowNetwork) return Cloudy
  return Connection
})

// 缓存统计
const cacheStats = computed(() => offlineStore.cacheStats)
const syncStatus = computed(() => offlineStore.syncStatus)

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
 * 显示缓存统计
 */
function showCacheStats(): void {
  cacheStatsVisible.value = true
}

/**
 * 清理过期缓存
 */
async function cleanupCache(): Promise<void> {
  try {
    const deletedCount = await offlineStore.cleanupCache()
    ElMessage.success(`已清理${deletedCount}条过期缓存`)
  } catch (error) {
    ElMessage.error('清理缓存失败')
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

    await offlineStore.clearCache()
    ElMessage.success('已清空所有缓存')
    cacheStatsVisible.value = false
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空缓存失败')
    }
  }
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
})

onUnmounted(() => {
  // 可选：清理资源
})
</script>

<style scoped lang="scss">
.offline-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;

  &.offline {
    background-color: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fde2e2;

    .indicator-icon {
      animation: pulse 2s infinite;
    }
  }

  &.slow {
    background-color: #fdf6ec;
    color: #e6a23c;
    border: 1px solid #f5dab1;
  }

  &.online {
    background-color: #f0f9ff;
    color: #409eff;
    border: 1px solid #c6e2ff;
  }

  .indicator-icon {
    font-size: 14px;
  }

  .indicator-text {
    flex: 1;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.cache-stats-content {
  padding: 16px 0;

  .cache-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
