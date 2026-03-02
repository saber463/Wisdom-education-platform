<template>
  <div v-if="showQueueManager" class="offline-queue-manager">
    <!-- 队列状态指示器 -->
    <div class="queue-status">
      <el-badge :value="unsyncedCount" class="queue-badge">
        <el-button
          circle
          :type="hasErrors ? 'danger' : 'warning'"
          @click="showQueueDialog = true"
        >
          <el-icon>
            <Upload />
          </el-icon>
        </el-button>
      </el-badge>
    </div>

    <!-- 队列管理对话框 -->
    <el-dialog
      v-model="showQueueDialog"
      title="离线编辑队列"
      width="600px"
      @close="showQueueDialog = false"
    >
      <div class="queue-content">
        <!-- 队列统计 -->
        <el-alert
          v-if="unsyncedCount > 0"
          :title="`有${unsyncedCount}条操作待同步`"
          type="warning"
          :closable="false"
          class="queue-alert"
        />

        <!-- 队列列表 -->
        <el-table
          :data="unsyncedItems"
          stripe
          style="width: 100%; margin-top: 16px"
          max-height="400"
        >
          <el-table-column prop="type" label="操作类型" width="80">
            <template #default="{ row }">
              <el-tag :type="getOperationTypeColor(row.type)">
                {{ getOperationTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="resource" label="资源类型" width="100" />
          <el-table-column prop="resourceId" label="资源ID" width="100" />
          <el-table-column prop="timestamp" label="时间" width="150">
            <template #default="{ row }">
              {{ formatDate(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button
                link
                type="danger"
                size="small"
                @click="removeItem(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 同步错误 -->
        <div v-if="syncErrors.size > 0" class="sync-errors">
          <el-alert
            title="同步错误"
            type="error"
            :closable="false"
            class="error-alert"
          />
          <el-collapse>
            <el-collapse-item
              v-for="[itemId, error] of syncErrors"
              :key="itemId"
              :title="`${itemId}: ${error}`"
              :name="itemId"
            >
              <el-button
                link
                type="primary"
                size="small"
                @click="retrySync(itemId)"
              >
                重试
              </el-button>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showQueueDialog = false">关闭</el-button>
          <el-button
            v-if="unsyncedCount > 0"
            type="primary"
            :loading="isSyncing"
            @click="syncNow"
          >
            立即同步
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useOfflineStore } from '@/stores/offline'
import { Upload } from '@element-plus/icons-vue'
import type { QueueItem } from '@/utils/offline-queue'
import { removeFromQueue, getSyncErrors } from '@/utils/offline-queue'

// 离线模式store
const offlineStore = useOfflineStore()

// 状态
const showQueueDialog = ref(false)

// 计算属性
const showQueueManager = computed(() => {
  return offlineStore.isOfflineMode || offlineStore.syncStatus.unsyncedCount > 0
})

const unsyncedCount = computed(() => offlineStore.syncStatus.unsyncedCount)
const unsyncedItems = computed(() => offlineStore.getUnsyncedOperations())
const isSyncing = computed(() => offlineStore.syncStatus.isSyncing)
const hasErrors = computed(() => offlineStore.syncStatus.errorCount > 0)
const syncErrors = computed(() => offlineStore.getSyncErrorsMap())

/**
 * 获取操作类型标签
 */
function getOperationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除'
  }
  return labels[type] || type
}

/**
 * 获取操作类型颜色
 */
function getOperationTypeColor(type: string): string {
  const colors: Record<string, string> = {
    create: 'success',
    update: 'info',
    delete: 'danger'
  }
  return colors[type] || 'info'
}

/**
 * 格式化日期
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

/**
 * 删除队列项
 */
async function removeItem(itemId: string): Promise<void> {
  try {
    await removeFromQueue(itemId)
    ElMessage.success('已删除')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

/**
 * 立即同步
 */
async function syncNow(): Promise<void> {
  try {
    await offlineStore.syncQueue()
    ElMessage.success('同步完成')
  } catch (error) {
    ElMessage.error('同步失败')
  }
}

/**
 * 重试同步
 */
async function retrySync(itemId: string): Promise<void> {
  try {
    await offlineStore.retrySync()
    ElMessage.success('重试完成')
  } catch (error) {
    ElMessage.error('重试失败')
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
</script>

<style scoped lang="scss">
.offline-queue-manager {
  .queue-status {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9997;

    .queue-badge {
      :deep(.el-badge__content) {
        background-color: #f56c6c;
      }
    }
  }

  .queue-content {
    padding: 16px 0;

    .queue-alert {
      margin-bottom: 16px;
    }

    .sync-errors {
      margin-top: 16px;

      .error-alert {
        margin-bottom: 12px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
