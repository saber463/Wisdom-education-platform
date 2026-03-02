<template>
  <TeacherLayout>
    <div class="analytics-page">
      <div class="page-header">
        <h2>学情分析</h2>
        <div class="header-actions">
          <el-select v-model="selectedClassId" placeholder="选择班级" @change="handleClassChange" style="width: 200px">
            <el-option v-for="cls in classList" :key="cls.id" :label="cls.name" :value="cls.id" />
          </el-select>
          <div class="date-filter">
            <el-button-group>
              <el-button @click="setDateRange(7)" :type="dateRangeType === 7 ? 'primary' : 'default'">最近7天</el-button>
              <el-button @click="setDateRange(30)" :type="dateRangeType === 30 ? 'primary' : 'default'">最近30天</el-button>
              <el-button @click="setDateRange(90)" :type="dateRangeType === 90 ? 'primary' : 'default'">最近90天</el-button>
            </el-button-group>
          </div>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期" @change="handleDateChange" style="width: 260px" />
          <el-button type="primary" @click="exportReport" :loading="exporting">
            <el-icon><Download /></el-icon>导出报告
          </el-button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stats.averageScore?.toFixed(1) || '-' }}</div>
            <div class="stat-label">班级平均分</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stats.passRate?.toFixed(1) || '-' }}%</div>
            <div class="stat-label">及格率</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stats.excellentRate?.toFixed(1) || '-' }}%</div>
            <div class="stat-label">优秀率</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stats.totalStudents || 0 }}</div>
            <div class="stat-label">学生总数</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 趋势图 -->
        <el-col :span="16">
          <el-card class="chart-card">
            <template #header><span>成绩趋势（最近30天）</span></template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 知识点热力图 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header><span>薄弱知识点</span></template>
            <div class="weak-points-list">
              <div v-for="(point, index) in weakPoints" :key="point.id" class="weak-point-item">
                <span class="point-rank">{{ index + 1 }}</span>
                <span class="point-name">{{ point.name }}</span>
                <el-progress :percentage="point.errorRate" :stroke-width="8" :status="getErrorRateStatus(point.errorRate)" style="width: 100px" />
                <span class="point-rate">{{ point.errorRate }}%</span>
              </div>
              <el-empty v-if="weakPoints.length === 0" description="暂无薄弱知识点" :image-size="60" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 知识点掌握热力图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header><span>知识点掌握热力图</span></template>
            <div ref="heatmapChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 学生排名 -->
        <el-col :span="12">
          <el-card class="ranking-card">
            <template #header><span>学生排名</span></template>
            <el-table :data="studentRanking" size="small" style="width: 100%" max-height="350">
              <el-table-column prop="rank" label="排名" width="60" />
              <el-table-column prop="studentName" label="姓名" />
              <el-table-column prop="averageScore" label="平均分" width="80">
                <template #default="{ row }">{{ row.averageScore?.toFixed(1) }}</template>
              </el-table-column>
              <el-table-column prop="progress" label="进步幅度" width="100">
                <template #default="{ row }">
                  <span :class="row.progress >= 0 ? 'text-success' : 'text-danger'">
                    {{ row.progress >= 0 ? '+' : '' }}{{ row.progress?.toFixed(1) }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- AI提升建议 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="suggestions-card">
            <template #header><span>AI提升建议</span></template>
            <div class="suggestions-content">
              <div v-if="aiSuggestions.length > 0" class="suggestions-list">
                <div v-for="(suggestion, index) in aiSuggestions" :key="index" class="suggestion-item">
                  <el-icon class="suggestion-icon"><SuccessFilled /></el-icon>
                  <span>{{ suggestion }}</span>
                </div>
              </div>
              <el-empty v-else description="暂无提升建议" :image-size="60" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, SuccessFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const selectedClassId = ref<number | null>(null)
const dateRange = ref<[Date, Date] | null>(null)
const dateRangeType = ref<number | null>(null)
const exporting = ref(false)

const classList = ref<Array<{ id: number; name: string }>>([])
const stats = reactive({ averageScore: 0, passRate: 0, excellentRate: 0, totalStudents: 0 })
const weakPoints = ref<Array<{ id: number; name: string; errorRate: number }>>([])
const studentRanking = ref<Array<{ rank: number; studentName: string; averageScore: number; progress: number }>>([])
const trendData = ref<{ dates: string[]; averageScores: number[]; passRates: number[]; excellentRates: number[] }>({ dates: [], averageScores: [], passRates: [], excellentRates: [] })
const heatmapData = ref<Array<[number, number, number]>>([])
const knowledgePointNames = ref<string[]>([])
const aiSuggestions = ref<string[]>([])

const trendChartRef = ref<HTMLElement | null>(null)
const heatmapChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null

async function fetchClasses() {
  try {
    const response = await request.get<{ classes?: Array<{ id: number; name: string }> }>('/classes')
    classList.value = response.classes || []
    if (classList.value.length > 0) {
      selectedClassId.value = classList.value[0].id
      fetchAnalyticsData()
    }
  } catch (error) { console.error('[学情分析] 获取班级列表失败:', error) }
}

async function fetchAnalyticsData() {
  if (!selectedClassId.value) return
  try {
    const params: Record<string, any> = { classId: selectedClassId.value }
    if (dateRange.value) {
      params.startDate = dateRange.value[0].toISOString()
      params.endDate = dateRange.value[1].toISOString()
    }
    
    const response = await request.get<Record<string, unknown>>(`/analytics/class/${selectedClassId.value}`, { params })
    
    stats.averageScore = Number(response.averageScore) || 0
    stats.passRate = Number(response.passRate) || 0
    stats.excellentRate = Number(response.excellentRate) || 0
    stats.totalStudents = Number(response.totalStudents) || 0
    trendData.value = (response.trendData || { dates: [], averageScores: [], passRates: [], excellentRates: [] }) as typeof trendData.value
    weakPoints.value = (response.weakPoints || []) as typeof weakPoints.value
    studentRanking.value = (response.ranking || []) as typeof studentRanking.value
    heatmapData.value = (response.heatmapData || []) as typeof heatmapData.value
    knowledgePointNames.value = (response.knowledgePointNames || []) as typeof knowledgePointNames.value
    aiSuggestions.value = (response.aiSuggestions || []) as typeof aiSuggestions.value
    
    updateCharts()
  } catch (error) {
    console.error('[学情分析] 获取数据失败:', error)
    ElMessage.error('获取学情数据失败')
  }
}

function handleClassChange() { fetchAnalyticsData() }
function handleDateChange() { fetchAnalyticsData() }

function setDateRange(days: number) {
  dateRangeType.value = days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)
  dateRange.value = [startDate, endDate]
  fetchAnalyticsData()
}

async function exportReport() {
  if (!selectedClassId.value) {
    ElMessage.warning('请先选择班级')
    return
  }
  exporting.value = true
  try {
    const params: Record<string, any> = { classId: selectedClassId.value, format: 'pdf' }
    if (dateRange.value) {
      params.startDate = dateRange.value[0].toISOString()
      params.endDate = dateRange.value[1].toISOString()
    }
    
    const response = await request.post('/analytics/export', params, { responseType: 'blob' })
    
    // 创建blob URL并下载
    const url = window.URL.createObjectURL(response as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `学情报告_${selectedClassId.value}_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('报告导出成功')
  } catch (error) {
    console.error('[学情分析] 导出报告失败:', error)
    ElMessage.error('导出报告失败')
  } finally { exporting.value = false }
}

function initCharts() {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
  }
}

function updateCharts() {
  // 趋势图
  if (trendChart) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均分', '及格率', '优秀率'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: trendData.value.dates },
      yAxis: [
        { type: 'value', name: '分数', min: 0, max: 100 },
        { type: 'value', name: '百分比', min: 0, max: 100, axisLabel: { formatter: '{value}%' } }
      ],
      series: [
        { name: '平均分', type: 'line', data: trendData.value.averageScores, smooth: true, itemStyle: { color: '#409eff' } },
        { name: '及格率', type: 'line', yAxisIndex: 1, data: trendData.value.passRates, smooth: true, itemStyle: { color: '#67c23a' } },
        { name: '优秀率', type: 'line', yAxisIndex: 1, data: trendData.value.excellentRates, smooth: true, itemStyle: { color: '#e6a23c' } }
      ]
    })
  }

  // 热力图
  if (heatmapChart && heatmapData.value.length > 0) {
    const students = [...new Set(heatmapData.value.map(d => d[1]))].map(i => `学生${i + 1}`)
    heatmapChart.setOption({
      tooltip: { position: 'top', formatter: (params: any) => `${knowledgePointNames.value[params.data[0]] || '知识点'}: ${params.data[2]}%` },
      grid: { height: '60%', top: '10%' },
      xAxis: { type: 'category', data: knowledgePointNames.value.slice(0, 10), splitArea: { show: true } },
      yAxis: { type: 'category', data: students.slice(0, 10), splitArea: { show: true } },
      visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '5%', inRange: { color: ['#f56c6c', '#e6a23c', '#67c23a'] } },
      series: [{ name: '掌握度', type: 'heatmap', data: heatmapData.value, label: { show: false } }]
    })
  }
}

function getErrorRateStatus(rate: number): '' | 'success' | 'warning' | 'exception' {
  if (rate >= 60) return 'exception'
  if (rate >= 40) return 'warning'
  return 'success'
}

function handleResize() {
  trendChart?.resize()
  heatmapChart?.resize()
}

onMounted(() => {
  fetchClasses()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  heatmapChart?.dispose()
})

watch([selectedClassId, dateRange], () => { fetchAnalyticsData() })
</script>

<style scoped>
.analytics-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; }
.header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.date-filter { display: flex; gap: 8px; }
.stat-cards { margin-bottom: 20px; }
.stat-card { text-align: center; padding: 20px; }
.stat-value { font-size: 32px; font-weight: bold; color: #409eff; }
.stat-label { font-size: 14px; color: #999; margin-top: 8px; }
.chart-card, .ranking-card, .suggestions-card { margin-bottom: 20px; }
.chart-container { height: 350px; }
.weak-points-list { max-height: 350px; overflow-y: auto; }
.weak-point-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #eee; }
.weak-point-item:last-child { border-bottom: none; }
.point-rank { width: 24px; height: 24px; background: #f56c6c; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.point-name { flex: 1; }
.point-rate { width: 50px; text-align: right; color: #f56c6c; font-weight: bold; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
.suggestions-content { padding: 12px 0; }
.suggestions-list { display: flex; flex-direction: column; gap: 12px; }
.suggestion-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #f0f9ff; border-left: 3px solid #67c23a; border-radius: 4px; }
.suggestion-icon { color: #67c23a; font-size: 18px; flex-shrink: 0; margin-top: 2px; }

</style>
