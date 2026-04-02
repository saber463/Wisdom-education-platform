<template>
  <div class="push-history-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>推送历史</h1>
      <p class="subtitle">
        查看最近30天的推送记录
      </p>
    </div>

    <!-- 时间范围筛选 -->
    <div class="filter-section">
      <el-card class="filter-card">
        <template #header>
          <div class="card-header">
            <span>筛选条件</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col
            :xs="24"
            :sm="12"
            :md="8"
          >
            <el-form-item label="开始日期">
              <el-date-picker
                v-model="filterForm.startDate"
                type="date"
                placeholder="选择开始日期"
                :disabled-date="disabledStartDate"
                @change="handleFilterChange"
              />
            </el-form-item>
          </el-col>

          <el-col
            :xs="24"
            :sm="12"
            :md="8"
          >
            <el-form-item label="结束日期">
              <el-date-picker
                v-model="filterForm.endDate"
                type="date"
                placeholder="选择结束日期"
                :disabled-date="disabledEndDate"
                @change="handleFilterChange"
              />
            </el-form-item>
          </el-col>

          <el-col
            :xs="24"
            :sm="12"
            :md="8"
          >
            <el-form-item label="推送状态">
              <el-select
                v-model="filterForm.status"
                placeholder="选择推送状态"
                @change="handleFilterChange"
              >
                <el-option
                  label="全部"
                  value=""
                />
                <el-option
                  label="成功"
                  value="success"
                />
                <el-option
                  label="失败"
                  value="failed"
                />
                <el-option
                  label="待发送"
                  value="pending"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24">
            <el-button
              type="primary"
              @click="handleFilterChange"
            >
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">
              <el-icon><RefreshRight /></el-icon>
              重置
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 推送历史列表 -->
    <div class="history-section">
      <el-card class="history-card">
        <template #header>
          <div class="card-header">
            <span>推送记录（共 {{ totalCount }} 条）</span>
            <el-button
              type="primary"
              text
              @click="handleRefresh"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <!-- 加载状态 -->
        <el-skeleton
          v-if="loading"
          :rows="5"
          animated
        />

        <!-- 空状态 -->
        <el-empty
          v-else-if="pushHistoryList.length === 0"
          description="暂无推送记录"
        />

        <!-- 推送历史表格 -->
        <el-table
          v-else
          :data="pushHistoryList"
          stripe
          style="width: 100%"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
        >
          <!-- 推送时间 -->
          <el-table-column
            prop="createdAt"
            label="推送时间"
            width="180"
            sortable
            :formatter="formatDateTime"
          />

          <!-- 推送标题 -->
          <el-table-column
            prop="title"
            label="推送标题"
            min-width="200"
            show-overflow-tooltip
          />

          <!-- 推送内容 -->
          <el-table-column
            prop="content"
            label="推送内容"
            min-width="250"
            show-overflow-tooltip
          />

          <!-- 推送状态 -->
          <el-table-column
            prop="status"
            label="发送状态"
            width="120"
            :formatter="formatStatus"
          >
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                effect="light"
              >
                {{ formatStatus(row) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 操作 -->
          <el-table-column
            label="操作"
            width="150"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                type="primary"
                text
                size="small"
                @click="handleViewDetail(row)"
              >
                查看详情
              </el-button>
              <el-button
                v-if="row.actionUrl"
                type="success"
                text
                size="small"
                @click="handleNavigate(row)"
              >
                跳转
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-if="pushHistoryList.length > 0"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 20px; text-align: right"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </el-card>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="推送详情"
      width="600px"
      @close="handleCloseDetail"
    >
      <div
        v-if="selectedPush"
        class="detail-content"
      >
        <el-descriptions
          :column="1"
          border
        >
          <el-descriptions-item label="推送时间">
            {{ formatDateTime(selectedPush) }}
          </el-descriptions-item>

          <el-descriptions-item label="推送标题">
            {{ selectedPush.title }}
          </el-descriptions-item>

          <el-descriptions-item label="推送内容">
            <div class="content-text">
              {{ selectedPush.content }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="发送状态">
            <el-tag
              :type="getStatusType(selectedPush.status)"
              effect="light"
            >
              {{ formatStatus(selectedPush) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item
            v-if="selectedPush.errorMessage"
            label="错误信息"
          >
            <div class="error-text">
              {{ selectedPush.errorMessage }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="推送类型">
            {{ selectedPush.type || '系统推送' }}
          </el-descriptions-item>

          <el-descriptions-item
            v-if="selectedPush.actionUrl"
            label="跳转链接"
          >
            <div class="action-url-text">
              {{ selectedPush.actionUrl }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDetail">
            关闭
          </el-button>
          <el-button
            v-if="selectedPush?.actionUrl"
            type="primary"
            @click="handleNavigate(selectedPush!)"
          >
            跳转到相关页面
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// 接口类型定义
interface PushRecord {
  id: number
  userId: number
  title: string
  content: string
  type: string
  status: 'success' | 'failed' | 'pending'
  createdAt: string
  actionUrl?: string
  errorMessage?: string
}

interface PushHistoryResponse {
  success: boolean
  data: {
    records: PushRecord[]
    total: number
  }
  message: string
}

// 响应式数据
const loading = ref(false)
const pushHistoryList = ref<PushRecord[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const selectedPush = ref<PushRecord | null>(null)

// 路由
const router = useRouter()

// 筛选表单
const filterForm = ref({
  startDate: null as Date | null,
  endDate: null as Date | null,
  status: ''
})

// 初始化日期范围（最近30天）
const initializeDateRange = () => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  filterForm.value.endDate = endDate
  filterForm.value.startDate = startDate
}

// 禁用开始日期（不能晚于结束日期）
const disabledStartDate = (time: Date) => {
  if (!filterForm.value.endDate) return false
  return time.getTime() > filterForm.value.endDate!.getTime()
}

// 禁用结束日期（不能早于开始日期，不能晚于今天）
const disabledEndDate = (time: Date) => {
  if (!filterForm.value.startDate) return time.getTime() > new Date().getTime()
  return (
    time.getTime() < filterForm.value.startDate!.getTime() ||
    time.getTime() > new Date().getTime()
  )
}

// 格式化日期时间
const formatDateTime = (row: PushRecord) => {
  const date = new Date(row.createdAt)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化状态
const formatStatus = (row: PushRecord) => {
  const statusMap: Record<string, string> = {
    success: '成功',
    failed: '失败',
    pending: '待发送'
  }
  return statusMap[row.status] || '未知'
}

// 获取状态标签类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    pending: 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取推送历史
const fetchPushHistory = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      startDate: filterForm.value.startDate
        ? filterForm.value.startDate.toISOString().split('T')[0]
        : undefined,
      endDate: filterForm.value.endDate
        ? filterForm.value.endDate.toISOString().split('T')[0]
        : undefined,
      status: filterForm.value.status || undefined
    }

    const response = await axios.get<PushHistoryResponse>(
      '/api/push/history',
      { params }
    )

    if (response.data.success) {
      pushHistoryList.value = response.data.data.records
      totalCount.value = response.data.data.total
    } else {
      ElMessage.error(response.data.message || '获取推送历史失败')
    }
  } catch (error) {
    console.error('获取推送历史失败:', error)
    ElMessage.error('获取推送历史失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchPushHistory()
}

// 重置筛选条件
const handleReset = () => {
  initializeDateRange()
  filterForm.value.status = ''
  currentPage.value = 1
  fetchPushHistory()
}

// 刷新数据
const handleRefresh = () => {
  fetchPushHistory()
}

// 分页大小变化
const handlePageSizeChange = () => {
  currentPage.value = 1
  fetchPushHistory()
}

// 页码变化
const handlePageChange = () => {
  fetchPushHistory()
}

// 查看详情
const handleViewDetail = (row: PushRecord) => {
  selectedPush.value = row
  detailDialogVisible.value = true
}

// 关闭详情对话框
const handleCloseDetail = () => {
  selectedPush.value = null
  detailDialogVisible.value = false
}

// 处理推送消息点击跳转
const handleNavigate = (row: PushRecord) => {
  if (!row.actionUrl) {
    ElMessage.warning('该推送消息没有关联的跳转链接')
    return
  }

  // 验证链接格式
  if (!isValidActionUrl(row.actionUrl)) {
    ElMessage.error('推送消息链接格式无效')
    return
  }

  try {
    // 使用路由导航
    router.push(row.actionUrl)
    ElMessage.success('正在跳转...')
  } catch (error) {
    console.error('导航失败:', error)
    ElMessage.error('导航失败，请稍后重试')
  }
}

// 验证action URL格式
const isValidActionUrl = (url: string): boolean => {
  // 检查URL是否以 / 开头（相对路径）或 http/https 开头（绝对路径）
  if (!url) return false
  if (url.startsWith('/')) return true
  if (url.startsWith('http://') || url.startsWith('https://')) return true
  return false
}

// 组件挂载
onMounted(() => {
  initializeDateRange()
  fetchPushHistory()
})
</script>

<style scoped lang="scss">
.push-history-container {
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

  .filter-section {
    margin-bottom: 20px;

    .filter-card {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      :deep(.el-card__header) {
        border-bottom: 1px solid #ebeef5;
        padding: 18px 20px;
      }

      :deep(.el-card__body) {
        padding: 20px;
      }
    }
  }

  .history-section {
    .history-card {
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

  .detail-content {
    padding: 20px 0;

    .content-text {
      word-break: break-word;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .error-text {
      color: #FF4B6E;
      word-break: break-word;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .action-url-text {
      color: #00FF94;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .push-history-container {
    padding: 10px;

    .page-header {
      margin-bottom: 20px;

      h1 {
        font-size: 20px;
      }
    }
  }
}
</style>
