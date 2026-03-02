<template>
  <StudentLayout>
    <div class="assessment-history-page">
      <!-- 筛选和统计 -->
      <el-card class="filter-card">
        <template #header>
          <div class="card-header">
            <span><el-icon><Filter /></el-icon> 筛选和统计</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">总评测次数</div>
              <div class="stat-value">{{ statistics.totalCount }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">平均发音准确率</div>
              <div class="stat-value">{{ statistics.avgAccuracy }}%</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">平均语调评分</div>
              <div class="stat-value">{{ statistics.avgTone }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">平均流畅度评分</div>
              <div class="stat-value">{{ statistics.avgFluency }}</div>
            </div>
          </el-col>
        </el-row>

        <!-- 时间范围筛选 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="onDateRangeChange"
              style="width: 100%"
            />
          </el-col>
          <el-col :span="12">
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon> 刷新数据
            </el-button>
            <el-button @click="exportData">
              <el-icon><Download /></el-icon> 导出数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 进度曲线图 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><DataLine /></el-icon> 评测进度曲线</span>
              </div>
            </template>

            <div ref="progressChartContainer" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 评分分布图 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><PieChart /></el-icon> 发音准确率分布</span>
              </div>
            </template>

            <div ref="accuracyChartContainer" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><Histogram /></el-icon> 各项评分对比</span>
              </div>
            </template>

            <div ref="scoresChartContainer" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 历史记录表格 -->
      <el-card class="table-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span><el-icon><List /></el-icon> 评测历史记录</span>
            <span class="record-count">共{{ assessments.length }}条记录</span>
          </div>
        </template>

        <el-table :data="assessments" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="created_at" label="评测时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="accuracy_score" label="发音准确率" width="120">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.accuracy_score" 
                :color="getScoreColor(row.accuracy_score)"
                :show-text="false"
              />
              <span style="margin-left: 8px;">{{ row.accuracy_score }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="tone_score" label="语调评分" width="100">
            <template #default="{ row }">
              <el-tag :type="getScoreType(row.tone_score)">{{ row.tone_score }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fluency_score" label="流畅度评分" width="100">
            <template #default="{ row }">
              <el-tag :type="getScoreType(row.fluency_score)">{{ row.fluency_score }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="overall_score" label="总体评分" width="100">
            <template #default="{ row }">
              <el-tag :type="getScoreType(row.overall_score)" effect="dark">
                {{ row.overall_score }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row)">查看详情</el-button>
              <el-button type="danger" link @click="deleteRecord(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div style="margin-top: 20px; text-align: right;">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="fetchAssessments"
            @size-change="fetchAssessments"
          />
        </div>
      </el-card>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生口语评测历史页面
 * 使用ECharts展示进步曲线图、历史评测记录
 * 需求：20.8
 */
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  Filter, Refresh, Download, DataLine, PieChart, Histogram, List
} from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

interface Assessment {
  id: number
  accuracy_score: number
  tone_score: number
  fluency_score: number
  overall_score: number
  created_at: string
  duration?: number
}

interface Statistics {
  totalCount: number
  avgAccuracy: number
  avgTone: number
  avgFluency: number
}

const router = useRouter()
const assessments = ref<Assessment[]>([])
const dateRange = ref<[Date, Date] | null>(null)
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const statistics = ref<Statistics>({
  totalCount: 0,
  avgAccuracy: 0,
  avgTone: 0,
  avgFluency: 0
})

// Chart容器
const progressChartContainer = ref<HTMLElement | null>(null)
const accuracyChartContainer = ref<HTMLElement | null>(null)
const scoresChartContainer = ref<HTMLElement | null>(null)

// Chart实例
let progressChart: echarts.ECharts | null = null
let accuracyChart: echarts.ECharts | null = null
let scoresChart: echarts.ECharts | null = null

async function fetchAssessments() {
  try {
    const params: any = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].toISOString().split('T')[0]
      params.endDate = dateRange.value[1].toISOString().split('T')[0]
    }

    const response = await request.get<{
      success?: boolean
      data?: {
        assessments: Assessment[]
        pagination: { total: number }
        statistics: Statistics
      }
    }>('/speech/assess/history', { params })

    if (response.success && response.data) {
      assessments.value = response.data.assessments
      pagination.value.total = response.data.pagination.total
      statistics.value = response.data.statistics

      // 更新图表
      await nextTick()
      updateCharts()
    }
  } catch (error: any) {
    console.error('[口语评测] 获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  }
}

function updateCharts() {
  updateProgressChart()
  updateAccuracyChart()
  updateScoresChart()
}

function updateProgressChart() {
  if (!progressChartContainer.value) return

  if (!progressChart) {
    progressChart = echarts.init(progressChartContainer.value)
  }

  const dates = assessments.value.map(a => {
    const date = new Date(a.created_at)
    return `${date.getMonth() + 1}-${date.getDate()}`
  })

  const accuracyData = assessments.value.map(a => a.accuracy_score)
  const toneData = assessments.value.map(a => a.tone_score)
  const fluencyData = assessments.value.map(a => a.fluency_score)

  const option: echarts.EChartsOption = {
    title: {
      text: '评测进度曲线',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['发音准确率', '语调评分', '流畅度评分'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '发音准确率',
        data: accuracyData,
        type: 'line',
        smooth: true,
        itemStyle: { color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.2)' }
      },
      {
        name: '语调评分',
        data: toneData,
        type: 'line',
        smooth: true,
        itemStyle: { color: '#67c23a' },
        areaStyle: { color: 'rgba(103, 194, 58, 0.2)' }
      },
      {
        name: '流畅度评分',
        data: fluencyData,
        type: 'line',
        smooth: true,
        itemStyle: { color: '#e6a23c' },
        areaStyle: { color: 'rgba(230, 162, 60, 0.2)' }
      }
    ]
  }

  progressChart.setOption(option)
}

function updateAccuracyChart() {
  if (!accuracyChartContainer.value) return

  if (!accuracyChart) {
    accuracyChart = echarts.init(accuracyChartContainer.value)
  }

  // 统计发音准确率分布
  const ranges = [
    { name: '90-100', min: 90, max: 100, count: 0 },
    { name: '80-89', min: 80, max: 89, count: 0 },
    { name: '70-79', min: 70, max: 79, count: 0 },
    { name: '60-69', min: 60, max: 69, count: 0 },
    { name: '<60', min: 0, max: 59, count: 0 }
  ]

  assessments.value.forEach(a => {
    ranges.forEach(r => {
      if (a.accuracy_score >= r.min && a.accuracy_score <= r.max) {
        r.count++
      }
    })
  })

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '发音准确率分布',
        type: 'pie',
        radius: '50%',
        data: ranges.map(r => ({
          value: r.count,
          name: r.name
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  accuracyChart.setOption(option)
}

function updateScoresChart() {
  if (!scoresChartContainer.value) return

  if (!scoresChart) {
    scoresChart = echarts.init(scoresChartContainer.value)
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['发音准确率', '语调评分', '流畅度评分']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['最新', '平均', '最高']
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '发音准确率',
        data: [
          assessments.value[0]?.accuracy_score || 0,
          statistics.value.avgAccuracy,
          Math.max(...assessments.value.map(a => a.accuracy_score), 0)
        ],
        type: 'bar',
        itemStyle: { color: '#409eff' }
      },
      {
        name: '语调评分',
        data: [
          assessments.value[0]?.tone_score || 0,
          statistics.value.avgTone,
          Math.max(...assessments.value.map(a => a.tone_score), 0)
        ],
        type: 'bar',
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '流畅度评分',
        data: [
          assessments.value[0]?.fluency_score || 0,
          statistics.value.avgFluency,
          Math.max(...assessments.value.map(a => a.fluency_score), 0)
        ],
        type: 'bar',
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  scoresChart.setOption(option)
}

function onDateRangeChange() {
  pagination.value.page = 1
  fetchAssessments()
}

function refreshData() {
  fetchAssessments()
  ElMessage.success('数据已刷新')
}

function exportData() {
  ElMessage.info('功能开发中...')
  // TODO: 实现数据导出功能
}

function viewDetail(assessment: Assessment) {
  router.push(`/student/speech/${assessment.id}`)
}

function deleteRecord(assessment: Assessment) {
  ElMessageBox.confirm('确定要删除这条评测记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/speech/assess/${assessment.id}`)
      ElMessage.success('删除成功')
      fetchAssessments()
    } catch (error: any) {
      console.error('[口语评测] 删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  if (score >= 60) return '#f56c6c'
  return '#909399'
}

function getScoreType(score: number): '' | 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

onMounted(() => {
  fetchAssessments()

  // 监听窗口大小变化，自动调整图表
  window.addEventListener('resize', () => {
    progressChart?.resize()
    accuracyChart?.resize()
    scoresChart?.resize()
  })
})
</script>

<style scoped>
.assessment-history-page { min-height: 100%; }

.filter-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.stat-item { }
.stat-label { font-size: 12px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: bold; color: #409eff; }

.chart-card { margin-bottom: 20px; }
.chart-container { width: 100%; height: 400px; }

.table-card { }
.record-count { font-size: 13px; color: #909399; }
</style>
