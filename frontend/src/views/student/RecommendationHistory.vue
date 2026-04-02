<template>
  <StudentLayout>
    <div class="recommendation-history-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>推荐历史</h2>
        <p class="page-desc">
          查看最近30天的推荐记录和点击率统计
        </p>
      </div>

      <!-- 加载状态 -->
      <el-skeleton
        v-if="loading"
        :rows="10"
        animated
      />

      <div v-else>
        <!-- 统计卡片 -->
        <el-row
          :gutter="20"
          class="stats-row"
        >
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <div class="stat-card">
              <div
                class="stat-icon"
                style="background: #e6f7ff;"
              >
                <el-icon style="color: #1890ff;">
                  <DataAnalysis />
                </el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">
                  总推荐数
                </div>
                <div class="stat-value">
                  {{ statistics.total_recommendations }}
                </div>
              </div>
            </div>
          </el-col>
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <div class="stat-card">
              <div
                class="stat-icon"
                style="background: #f6ffed;"
              >
                <el-icon style="color: #52c41a;">
                  <SuccessFilled />
                </el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">
                  点击数
                </div>
                <div class="stat-value">
                  {{ statistics.total_clicks }}
                </div>
              </div>
            </div>
          </el-col>
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <div class="stat-card">
              <div
                class="stat-icon"
                style="background: #fff7e6;"
              >
                <el-icon style="color: #faad14;">
                  <Discount />
                </el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">
                  点击率
                </div>
                <div class="stat-value">
                  {{ statistics.click_rate }}%
                </div>
              </div>
            </div>
          </el-col>
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <div class="stat-card">
              <div
                class="stat-icon"
                style="background: #f9f0ff;"
              >
                <el-icon style="color: #722ed1;">
                  <TrendCharts />
                </el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">
                  平均评分
                </div>
                <div class="stat-value">
                  {{ statistics.average_rating.toFixed(1) }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 点击率趋势图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>点击率趋势（最近30天）</span>
            </div>
          </template>
          <div
            ref="chartContainer"
            style="height: 300px;"
          />
        </el-card>

        <!-- 推荐记录表格 -->
        <el-card class="history-card">
          <template #header>
            <div class="card-header">
              <span>推荐记录</span>
              <el-button
                type="primary"
                :loading="exporting"
                size="small"
                @click="exportHistory"
              >
                <el-icon><Download /></el-icon> 导出
              </el-button>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-bar">
            <el-select
              v-model="filterType"
              placeholder="资源类型"
              clearable
              style="width: 150px;"
            >
              <el-option
                label="全部"
                value=""
              />
              <el-option
                label="文章"
                value="article"
              />
              <el-option
                label="视频"
                value="video"
              />
              <el-option
                label="练习"
                value="exercise"
              />
              <el-option
                label="教程"
                value="tutorial"
              />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 250px;"
              @change="fetchHistory"
            />
            <el-button
              type="primary"
              :loading="loading"
              @click="fetchHistory"
            >
              <el-icon><Search /></el-icon> 查询
            </el-button>
          </div>

          <!-- 历史记录表格 -->
          <el-table
            :data="historyRecords"
            stripe
            style="width: 100%; margin-top: 16px;"
          >
            <el-table-column
              prop="resource_title"
              label="资源标题"
              min-width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="resource_type"
              label="类型"
              width="100"
            >
              <template #default="{ row }">
                <el-tag :type="getResourceTypeColor(row.resource_type)">
                  {{ getResourceTypeLabel(row.resource_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="knowledge_points"
              label="知识点"
              min-width="150"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <div class="knowledge-points-cell">
                  <el-tag
                    v-for="kp in row.knowledge_points.slice(0, 2)"
                    :key="kp"
                    type="info"
                    size="small"
                  >
                    {{ kp }}
                  </el-tag>
                  <el-tag
                    v-if="row.knowledge_points.length > 2"
                    type="info"
                    size="small"
                  >
                    +{{ row.knowledge_points.length - 2 }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="recommended_at"
              label="推荐时间"
              width="180"
              :formatter="formatDate"
            />
            <el-table-column
              prop="click_count"
              label="点击次数"
              width="100"
              align="center"
            />
            <el-table-column
              prop="is_clicked"
              label="是否点击"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <el-tag
                  v-if="row.is_clicked"
                  type="success"
                >
                  已点击
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                >
                  未点击
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="rating"
              label="评分"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <el-rate
                  v-model="row.rating"
                  disabled
                  allow-half
                />
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="150"
              align="center"
            >
              <template #default="{ row }">
                <el-button
                  type="primary"
                  text
                  size="small"
                  @click="viewResource(row)"
                >
                  查看
                </el-button>
                <el-button
                  type="danger"
                  text
                  size="small"
                  @click="removeRecord(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-section">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @change="fetchHistory"
            />
          </div>
        </el-card>
      </div>

      <!-- 资源详情对话框 -->
      <el-dialog
        v-model="showResourceDialog"
        title="资源详情"
        width="50%"
      >
        <div
          v-if="selectedRecord"
          class="resource-dialog-content"
        >
          <div class="dialog-section">
            <label>资源标题</label>
            <p>{{ selectedRecord.resource_title }}</p>
          </div>
          <div class="dialog-section">
            <label>资源类型</label>
            <el-tag :type="getResourceTypeColor(selectedRecord.resource_type)">
              {{ getResourceTypeLabel(selectedRecord.resource_type) }}
            </el-tag>
          </div>
          <div class="dialog-section">
            <label>推荐时间</label>
            <p>{{ formatDate(selectedRecord.recommended_at) }}</p>
          </div>
          <div class="dialog-section">
            <label>点击次数</label>
            <p>{{ selectedRecord.click_count }}</p>
          </div>
          <div class="dialog-section">
            <label>评分</label>
            <el-rate
              v-model="selectedRecord.rating"
              disabled
              allow-half
            />
          </div>
          <div class="dialog-section">
            <label>知识点</label>
            <div class="knowledge-points-full">
              <el-tag
                v-for="kp in selectedRecord.knowledge_points"
                :key="kp"
                type="info"
              >
                {{ kp }}
              </el-tag>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="showResourceDialog = false">
            关闭
          </el-button>
        </template>
      </el-dialog>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 推荐历史页面
 * 显示最近30天的推荐记录和点击率统计
 * 需求：19.8
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  SuccessFilled,
  Discount,
  TrendCharts,
  Download,
  Search
} from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'

const userStore = useUserStore()
const studentId = computed(() => userStore.userInfo?.id)

const loading = ref(true)
const exporting = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterType = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const showResourceDialog = ref(false)
const chartContainer = ref<HTMLElement | null>(null)

interface HistoryRecord {
  id: number
  resource_id: number
  resource_title: string
  resource_type: 'article' | 'video' | 'exercise' | 'tutorial'
  knowledge_points: string[]
  recommended_at: string
  click_count: number
  is_clicked: boolean
  rating: number
}

interface Statistics {
  total_recommendations: number
  total_clicks: number
  click_rate: number
  average_rating: number
}

interface TrendData {
  date: string
  click_rate: number
}

const historyRecords = ref<HistoryRecord[]>([])
const selectedRecord = ref<HistoryRecord | null>(null)
const statistics = ref<Statistics>({
  total_recommendations: 0,
  total_clicks: 0,
  click_rate: 0,
  average_rating: 0
})
const trendData = ref<TrendData[]>([])

async function fetchHistory() {
  if (!studentId.value) return
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    if (filterType.value) {
      params.type = filterType.value
    }
    if (dateRange.value) {
      params.start_date = dateRange.value[0].toISOString().split('T')[0]
      params.end_date = dateRange.value[1].toISOString().split('T')[0]
    }

    const response = await request.get<{
      success?: boolean
      data?: {
        records: HistoryRecord[]
        total: number
        statistics: Statistics
        trend_data: TrendData[]
      }
    }>(`/recommendations/history/${studentId.value}`, { params })

    if (response.success && response.data) {
      historyRecords.value = response.data.records
      total.value = response.data.total
      statistics.value = response.data.statistics
      trendData.value = response.data.trend_data
      renderChart()
    }
  } catch (error: unknown) {
    console.error('[推荐历史] 获取历史失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '获取历史失败')
  } finally {
    loading.value = false
  }
}

function renderChart() {
  if (!chartContainer.value || trendData.value.length === 0) return

  const chart = echarts.init(chartContainer.value)
  const dates = trendData.value.map(d => d.date)
  const rates = trendData.value.map(d => d.click_rate)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        data: rates,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0)' }
          ])
        },
        itemStyle: {
          color: '#1890ff'
        },
        lineStyle: {
          color: '#1890ff',
          width: 2
        }
      }
    ],
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    }
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

async function exportHistory() {
  if (!studentId.value) return
  exporting.value = true
  try {
    const response = await request.get(`/recommendations/history/export/${studentId.value}`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(response as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `推荐历史_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error: unknown) {
    console.error('[推荐历史] 导出失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '导出失败')
  } finally {
    exporting.value = false
  }
}

function viewResource(record: HistoryRecord) {
  selectedRecord.value = record
  showResourceDialog.value = true
}

async function removeRecord(record: HistoryRecord) {
  if (!studentId.value) return
  try {
    await request.delete(`/recommendations/history/${studentId.value}/${record.id}`)
    ElMessage.success('已删除')
    await fetchHistory()
  } catch (error: unknown) {
    console.error('[推荐历史] 删除失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '删除失败')
  }
}

function getResourceTypeColor(type: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const colors: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    article: 'info',
    video: 'warning',
    exercise: 'danger',
    tutorial: 'success'
  }
  return colors[type] || ''
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    article: '文章',
    video: '视频',
    exercise: '练习',
    tutorial: '教程'
  }
  return labels[type] || type
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  loading.value = true
  await fetchHistory()
  loading.value = false
})
</script>

<style scoped>
.recommendation-history-page {
  min-height: 100%;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #F0F0F0;
}

.page-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 30px;
}

.stat-card {
  background: #252525;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #F0F0F0;
}

.chart-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-card {
  margin-bottom: 30px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.knowledge-points-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.knowledge-points-full {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.resource-dialog-content {
  padding: 20px;
}

.dialog-section {
  margin-bottom: 16px;
}

.dialog-section label {
  display: block;
  font-weight: 600;
  color: #F0F0F0;
  margin-bottom: 8px;
  font-size: 14px;
}

.dialog-section p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>
