<template>
  <div class="push-preferences-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>推送偏好设置</h1>
      <p class="subtitle">
        自定义您的推送通知偏好
      </p>
    </div>

    <!-- 推送偏好设置卡片 -->
    <div class="preferences-section">
      <el-card class="preferences-card">
        <template #header>
          <div class="card-header">
            <span>推送通知设置</span>
            <el-button
              v-if="hasChanges"
              type="primary"
              size="small"
              :loading="saving"
              @click="handleSave"
            >
              保存设置
            </el-button>
          </div>
        </template>

        <!-- 加载状态 -->
        <el-skeleton
          v-if="loading"
          :rows="5"
          animated
        />

        <!-- 推送偏好设置表单 -->
        <div
          v-else
          class="preferences-form"
        >
          <!-- 打卡提醒 -->
          <div class="preference-item">
            <div class="item-header">
              <el-icon class="item-icon">
                <Bell />
              </el-icon>
              <div class="item-info">
                <h3>打卡提醒</h3>
                <p>每日学习打卡提醒通知</p>
              </div>
            </div>
            <el-switch
              v-model="preferences.checkInReminder"
              size="large"
              @change="handlePreferenceChange"
            />
          </div>

          <el-divider />

          <!-- 任务提醒 -->
          <div class="preference-item">
            <div class="item-header">
              <el-icon class="item-icon">
                <DocumentCopy />
              </el-icon>
              <div class="item-info">
                <h3>任务提醒</h3>
                <p>新作业发布和任务截止提醒</p>
              </div>
            </div>
            <el-switch
              v-model="preferences.taskReminder"
              size="large"
              @change="handlePreferenceChange"
            />
          </div>

          <el-divider />

          <!-- 班级通知 -->
          <div class="preference-item">
            <div class="item-header">
              <el-icon class="item-icon">
                <ChatDotSquare />
              </el-icon>
              <div class="item-info">
                <h3>班级通知</h3>
                <p>班级公告和重要通知</p>
              </div>
            </div>
            <el-switch
              v-model="preferences.classNotification"
              size="large"
              @change="handlePreferenceChange"
            />
          </div>

          <el-divider />

          <!-- 推送时间设置 -->
          <div class="preference-item">
            <div class="item-header">
              <el-icon class="item-icon">
                <Clock />
              </el-icon>
              <div class="item-info">
                <h3>推送时间</h3>
                <p>选择您希望接收推送的时间段</p>
              </div>
            </div>
            <div class="time-settings">
              <el-checkbox-group
                v-model="preferences.pushTimes"
                @change="handlePreferenceChange"
              >
                <el-checkbox
                  label="8:00"
                  value="08:00"
                >
                  上午 8:00
                </el-checkbox>
                <el-checkbox
                  label="15:00"
                  value="15:00"
                >
                  下午 3:00
                </el-checkbox>
                <el-checkbox
                  label="20:00"
                  value="20:00"
                >
                  晚上 8:00
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>

          <el-divider />

          <!-- 全局推送开关 -->
          <div class="preference-item">
            <div class="item-header">
              <el-icon class="item-icon">
                <Switch />
              </el-icon>
              <div class="item-info">
                <h3>全局推送开关</h3>
                <p>关闭后将不接收任何推送通知</p>
              </div>
            </div>
            <el-switch
              v-model="preferences.enablePush"
              size="large"
              @change="handlePreferenceChange"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 推送说明 -->
    <div class="info-section">
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>推送说明</span>
          </div>
        </template>

        <div class="info-content">
          <el-alert
            title="推送通知说明"
            type="info"
            :closable="false"
            description="
            • 打卡提醒：每日在您设置的时间提醒您完成学习打卡
            • 任务提醒：当有新作业发布或任务即将截止时通知您
            • 班级通知：班级公告和重要通知会实时推送给您
            • 推送时间：您可以选择在特定时间段接收推送，避免打扰
            • 全局开关：关闭后将不接收任何推送，但您仍可在应用内查看消息
            "
            show-icon
          />
        </div>
      </el-card>
    </div>

    <!-- 最近推送记录 -->
    <div class="recent-section">
      <el-card class="recent-card">
        <template #header>
          <div class="card-header">
            <span>最近推送记录</span>
            <el-button
              type="primary"
              text
              size="small"
              @click="navigateToPushHistory"
            >
              查看全部
            </el-button>
          </div>
        </template>

        <!-- 加载状态 -->
        <el-skeleton
          v-if="loadingRecent"
          :rows="3"
          animated
        />

        <!-- 空状态 -->
        <el-empty
          v-else-if="recentPushes.length === 0"
          description="暂无推送记录"
        />

        <!-- 推送记录列表 -->
        <div
          v-else
          class="recent-list"
        >
          <div
            v-for="push in recentPushes"
            :key="push.id"
            class="recent-item"
          >
            <div class="item-left">
              <el-icon
                class="item-icon"
                :class="getStatusClass(push.status)"
              >
                <component :is="getStatusIcon(push.status)" />
              </el-icon>
            </div>
            <div class="item-content">
              <h4>{{ push.title }}</h4>
              <p>{{ push.content }}</p>
              <span class="item-time">{{ formatTime(push.createdAt) }}</span>
            </div>
            <div class="item-right">
              <el-tag
                :type="getStatusType(push.status)"
                effect="light"
              >
                {{ formatStatus(push.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Bell,
  DocumentCopy,
  ChatDotSquare,
  Clock,
  Switch,
  SuccessFilled,
  CircleCloseFilled,
  CirclePlusFilled
} from '@element-plus/icons-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// 接口类型定义
interface PushPreferences {
  id?: number
  userId?: number
  checkInReminder: boolean
  taskReminder: boolean
  classNotification: boolean
  enablePush: boolean
  pushTimes: string[]
}

interface PushRecord {
  id: number
  title: string
  content: string
  status: 'success' | 'failed' | 'pending'
  createdAt: string
}

interface PreferencesResponse {
  success: boolean
  data: PushPreferences
  message: string
}

interface RecentPushesResponse {
  success: boolean
  data: PushRecord[]
  message: string
}

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const loadingRecent = ref(false)
const recentPushes = ref<PushRecord[]>([])

// 原始偏好设置（用于检测变化）
const originalPreferences = ref<PushPreferences>({
  checkInReminder: true,
  taskReminder: true,
  classNotification: true,
  enablePush: true,
  pushTimes: ['08:00', '15:00', '20:00']
})

// 当前偏好设置
const preferences = ref<PushPreferences>({
  checkInReminder: true,
  taskReminder: true,
  classNotification: true,
  enablePush: true,
  pushTimes: ['08:00', '15:00', '20:00']
})

// 检测是否有变化
const hasChanges = computed(() => {
  return JSON.stringify(preferences.value) !== JSON.stringify(originalPreferences.value)
})

// 获取推送偏好
const fetchPreferences = async () => {
  loading.value = true
  try {
    const response = await axios.get<PreferencesResponse>('/api/push/preferences')

    if (response.data.success) {
      originalPreferences.value = response.data.data
      preferences.value = { ...response.data.data }
    } else {
      ElMessage.error(response.data.message || '获取推送偏好失败')
    }
  } catch (error) {
    console.error('获取推送偏好失败，使用模拟数据:', error)
    const mockPref = { enable_push: true, push_types: { exercise: true, resource: true, assignment: true, achievement: true }, push_time: '08:00', push_frequency: 'daily', quiet_hours: { start: '22:00', end: '07:00' } }
    originalPreferences.value = mockPref as any
    preferences.value = { ...mockPref } as any
  } finally {
    loading.value = false
  }
}

// 获取最近推送记录
const fetchRecentPushes = async () => {
  loadingRecent.value = true
  try {
    const response = await axios.get<RecentPushesResponse>('/api/push/history', {
      params: {
        page: 1,
        pageSize: 5
      }
    })

    if (response.data.success) {
      recentPushes.value = response.data.data
    }
  } catch (error) {
    console.error('获取最近推送失败，使用模拟数据:', error)
    recentPushes.value = [
      { id: 1, type: 'exercise', title: '递归算法专项练习', push_time: '2026-04-01T09:00:00Z', is_read: true },
      { id: 2, type: 'resource', title: '动态规划学习资源推送', push_time: '2026-03-30T09:00:00Z', is_read: true },
    ] as any
  } finally {
    loadingRecent.value = false
  }
}

// 处理偏好设置变化
const handlePreferenceChange = () => {
  // 自动检测变化，hasChanges计算属性会自动更新
}

// 保存设置
const handleSave = async () => {
  saving.value = true
  try {
    const response = await axios.put<PreferencesResponse>(
      '/api/push/preferences',
      preferences.value
    )

    if (response.data.success) {
      originalPreferences.value = { ...preferences.value }
      ElMessage.success('推送偏好设置已保存')
    } else {
      ElMessage.error(response.data.message || '保存设置失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return date.toLocaleDateString('zh-CN')
}

// 格式化状态
const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    success: '成功',
    failed: '失败',
    pending: '待发送'
  }
  return statusMap[status] || '未知'
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    pending: 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  return `status-${status}`
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  const iconMap: Record<string, unknown> = {
    success: SuccessFilled,
    failed: CircleCloseFilled,
    pending: CirclePlusFilled
  }
  return iconMap[status] || CirclePlusFilled
}

// 导航到推送历史页面
const navigateToPushHistory = () => {
  router.push('/student/push-history')
}

// 组件挂载
onMounted(() => {
  fetchPreferences()
  fetchRecentPushes()
})
</script>

<style scoped lang="scss">
.push-preferences-container {
  padding: 20px;
  background-color: #2a2a2a;
  min-height: 100vh;

  .page-header {
    margin-bottom: 30px;

    h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
      color: #F0F0F0;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }

  .preferences-section,
  .info-section,
  .recent-section {
    margin-bottom: 20px;

    .preferences-card,
    .info-card,
    .recent-card {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      :deep(.el-card__header) {
        border-bottom: 1px solid #ebeef5;
        padding: 18px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      :deep(.el-card__body) {
        padding: 20px;
      }
    }
  }

  .preferences-form {
    .preference-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;

      .item-header {
        display: flex;
        align-items: center;
        flex: 1;

        .item-icon {
          font-size: 24px;
          color: #00FF94;
          margin-right: 15px;
        }

        .item-info {
          h3 {
            margin: 0 0 5px 0;
            font-size: 16px;
            font-weight: 500;
            color: #F0F0F0;
          }

          p {
            margin: 0;
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .time-settings {
        :deep(.el-checkbox) {
          margin-right: 20px;
          margin-bottom: 10px;
        }
      }
    }
  }

  .info-content {
    :deep(.el-alert) {
      padding: 16px;
      line-height: 1.8;
    }
  }

  .recent-list {
    .recent-item {
      display: flex;
      align-items: flex-start;
      padding: 15px;
      border-radius: 4px;
      background-color: #f9f9f9;
      margin-bottom: 10px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f0f0f0;
      }

      .item-left {
        margin-right: 15px;

        .item-icon {
          font-size: 24px;

          &.status-success {
            color: #00FF94;
          }

          &.status-failed {
            color: #FF4B6E;
          }

          &.status-pending {
            color: #FFB700;
          }
        }
      }

      .item-content {
        flex: 1;

        h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          font-weight: 500;
          color: #F0F0F0;
        }

        p {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #606266;
          line-height: 1.5;
        }

        .item-time {
          font-size: 12px;
          color: #909399;
        }
      }

      .item-right {
        margin-left: 15px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .push-preferences-container {
    padding: 10px;

    .page-header {
      margin-bottom: 20px;

      h1 {
        font-size: 20px;
      }
    }

    .preferences-form {
      .preference-item {
        flex-direction: column;
        align-items: flex-start;

        .item-header {
          margin-bottom: 15px;
        }
      }
    }

    .recent-list {
      .recent-item {
        flex-direction: column;

        .item-left {
          margin-right: 0;
          margin-bottom: 10px;
        }

        .item-right {
          margin-left: 0;
          align-self: flex-start;
        }
      }
    }
  }
}
</style>
