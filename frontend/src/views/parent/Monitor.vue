<template>
  <ParentLayout>
    <div class="monitor-page">
      <div class="page-header">
        <h2>学情监控</h2>
        <div class="header-actions">
          <el-select v-model="selectedChildId" placeholder="选择孩子" @change="handleChildChange" style="width: 150px">
            <el-option v-for="child in children" :key="child.id" :label="child.name" :value="child.id" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
            style="width: 260px"
          />
        </div>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stats.latestScore ?? '-' }}</div>
            <div class="stat-label">最新成绩</div>
            <div class="stat-trend" :class="stats.scoreTrend >= 0 ? 'trend-up' : 'trend-down'">
              <el-icon v-if="stats.scoreTrend >= 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              {{ Math.abs(stats.scoreTrend || 0).toFixed(1) }}
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stats.classRank ?? '-' }} / {{ stats.totalStudents ?? '-' }}</div>
            <div class="stat-label">班级排名</div>
            <div class="stat-trend" :class="stats.rankTrend <= 0 ? 'trend-up' : 'trend-down'">
              <el-icon v-if="stats.rankTrend <= 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              {{ Math.abs(stats.rankTrend || 0) }}名
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ stats.averageScore?.toFixed(1) ?? '-' }}</div>
            <div class="stat-label">平均分</div>
            <div class="stat-sub">班级平均: {{ stats.classAverage?.toFixed(1) ?? '-' }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ formatStudyTime(stats.studyTime) }}</div>
            <div class="stat-label">学习时长</div>
            <div class="stat-sub">本周累计</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 成绩趋势图 -->
        <el-col :span="16">
          <el-card class="chart-card">
            <template #header><span>成绩趋势（最近30天）</span></template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 薄弱知识点 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>薄弱知识点</span>
                <el-button type="primary" link @click="$router.push('/parent/weak-points')">查看详情</el-button>
              </div>
            </template>
            <div class="weak-points-list">
              <div v-for="(point, index) in weakPoints" :key="point.id" class="weak-point-item">
                <span class="point-rank">{{ index + 1 }}</span>
                <span class="point-name">{{ point.name }}</span>
                <el-progress :percentage="100 - point.masteryRate" :stroke-width="8" :status="getMasteryStatus(point.masteryRate)" style="width: 80px" />
                <span class="point-rate">{{ point.masteryRate }}%</span>
              </div>
              <el-empty v-if="weakPoints.length === 0" description="暂无薄弱知识点" :image-size="60" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 作业完成情况 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header><span>作业完成情况</span></template>
            <div ref="completionChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 学习时长统计 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header><span>学习时长统计（本周）</span></template>
            <div ref="studyTimeChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近作业成绩 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header><span>最近作业成绩</span></template>
            <el-table :data="recentResults" style="width: 100%">
              <el-table-column prop="assignmentTitle" label="作业名称" />
              <el-table-column prop="subject" label="学科" width="100" />
              <el-table-column prop="score" label="得分" width="120">
                <template #default="{ row }">
                  <span :class="getScoreClass(row.score, row.totalScore)">{{ row.score }} / {{ row.totalScore }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="classAverage" label="班级平均" width="100">
                <template #default="{ row }">{{ row.classAverage?.toFixed(1) ?? '-' }}</template>
              </el-table-column>
              <el-table-column prop="rank" label="排名" width="80" />
              <el-table-column prop="gradingTime" label="批改时间" width="180">
                <template #default="{ row }">{{ formatDateTime(row.gradingTime) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </ParentLayout>
</template>

<script setup lang="ts">
/**
 * 家长学情监控页面
 * 需求：8.1, 8.3 - 家长查看学情报告
 */
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import ParentLayout from '@/components/ParentLayout.vue'
import request from '@/utils/request'

const children = ref<Array<{ id: number; name: string }>>([])
const selectedChildId = ref<number | null>(null)
const dateRange = ref<[Date, Date] | null>(null)

const stats = reactive({
  latestScore: null as number | null, scoreTrend: 0, classRank: null as number | null,
  totalStudents: null as number | null, rankTrend: 0, averageScore: null as number | null,
  classAverage: null as number | null, studyTime: 0
})

const weakPoints = ref<Array<{ id: number; name: string; masteryRate: number; errorCount: number }>>([])
const recentResults = ref<Array<{ id: number; assignmentTitle: string; subject: string; score: number; totalScore: number; classAverage: number; rank: number; gradingTime: string }>>([])
const trendData = ref<{ dates: string[]; scores: number[]; classAverages: number[] }>({ dates: [], scores: [], classAverages: [] })
const completionData = ref<{ completed: number; pending: number; overdue: number }>({ completed: 0, pending: 0, overdue: 0 })
const studyTimeData = ref<{ days: string[]; times: number[] }>({ days: [], times: [] })

const trendChartRef = ref<HTMLElement | null>(null)
const completionChartRef = ref<HTMLElement | null>(null)
const studyTimeChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let completionChart: echarts.ECharts | null = null
let studyTimeChart: echarts.ECharts | null = null

async function fetchChildren() {
  try {
    const response = await request.get<{ children?: Array<{ id: number; name: string }> }>('/parent/children')
    children.value = response.children || []
    if (children.value.length > 0) { selectedChildId.value = children.value[0].id; fetchMonitorData() }
  } catch (error) { console.error('[学情监控] 获取孩子列表失败:', error) }
}

async function fetchMonitorData() {
  if (!selectedChildId.value) return
  try {
    const params: Record<string, any> = { studentId: selectedChildId.value }
    if (dateRange.value) { params.startDate = dateRange.value[0].toISOString(); params.endDate = dateRange.value[1].toISOString() }
    const response = await request.get<Record<string, unknown>>('/parent/monitor', { params })
    if (response) {
      stats.latestScore = (response.latestScore as number) ?? null
      stats.scoreTrend = (response.scoreTrend as number) || 0
      stats.classRank = (response.classRank as number) ?? null
      stats.totalStudents = response.totalStudents as number
      stats.rankTrend = (response.rankTrend as number) || 0
      stats.averageScore = (response.averageScore as number) ?? null
      stats.classAverage = response.classAverage as number
      stats.studyTime = (response.studyTime as number) || 0
      weakPoints.value = (response.weakPoints || []) as typeof weakPoints.value
      recentResults.value = (response.recentResults || []) as typeof recentResults.value
      trendData.value = (response.trendData || { dates: [], scores: [], classAverages: [] }) as typeof trendData.value
      completionData.value = (response.completionData || { completed: 0, pending: 0, overdue: 0 }) as typeof completionData.value
      studyTimeData.value = (response.studyTimeData || { days: [], times: [] }) as typeof studyTimeData.value
      updateCharts()
    }
  } catch (error) { console.error('[学情监控] 获取数据失败:', error); ElMessage.error('获取学情数据失败') }
}

function handleChildChange() { fetchMonitorData() }
function handleDateChange() { fetchMonitorData() }

function initCharts() {
  if (trendChartRef.value) trendChart = echarts.init(trendChartRef.value)
  if (completionChartRef.value) completionChart = echarts.init(completionChartRef.value)
  if (studyTimeChartRef.value) studyTimeChart = echarts.init(studyTimeChartRef.value)
}

function updateCharts() {
  if (trendChart) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' }, legend: { data: ['孩子成绩', '班级平均'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: trendData.value.dates },
      yAxis: { type: 'value', name: '分数', min: 0, max: 100 },
      series: [
        { name: '孩子成绩', type: 'line', data: trendData.value.scores, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
        { name: '班级平均', type: 'line', data: trendData.value.classAverages, smooth: true, itemStyle: { color: '#e6a23c' }, lineStyle: { type: 'dashed' } }
      ]
    })
  }
  if (completionChart) {
    completionChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' }, legend: { orient: 'vertical', left: 'left' },
      series: [{ name: '作业完成情况', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' }, emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } }, labelLine: { show: false },
        data: [
          { value: completionData.value.completed, name: '已完成', itemStyle: { color: '#67c23a' } },
          { value: completionData.value.pending, name: '待完成', itemStyle: { color: '#e6a23c' } },
          { value: completionData.value.overdue, name: '已逾期', itemStyle: { color: '#f56c6c' } }
        ]
      }]
    })
  }
  if (studyTimeChart) {
    studyTimeChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c}分钟' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: studyTimeData.value.days },
      yAxis: { type: 'value', name: '分钟' },
      series: [{ name: '学习时长', type: 'bar', data: studyTimeData.value.times,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#409eff' }, { offset: 1, color: '#67c23a' }]) }
      }]
    })
  }
}

function formatStudyTime(minutes: number): string {
  if (!minutes) return '0分钟'
  const hours = Math.floor(minutes / 60); const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins > 0 ? mins + '分钟' : ''}` : `${mins}分钟`
}

function getMasteryStatus(rate: number): '' | 'success' | 'warning' | 'exception' {
  if (rate >= 80) return 'success'; if (rate >= 60) return 'warning'; return 'exception'
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getScoreClass(score: number, totalScore: number): string {
  const pct = (score / totalScore) * 100
  if (pct >= 85) return 'score-excellent'; if (pct >= 60) return 'score-pass'; return 'score-fail'
}

function handleResize() { trendChart?.resize(); completionChart?.resize(); studyTimeChart?.resize() }

onMounted(() => { fetchChildren(); initCharts(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); completionChart?.dispose(); studyTimeChart?.dispose() })
watch([selectedChildId, dateRange], () => { fetchMonitorData() })
</script>

<style scoped>
.monitor-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; }
.header-actions { display: flex; gap: 12px; align-items: center; }
.stat-cards { margin-bottom: 20px; }
.stat-card { text-align: center; padding: 20px; position: relative; }
.stat-value { font-size: 28px; font-weight: bold; color: #409eff; }
.stat-label { font-size: 14px; color: #999; margin-top: 8px; }
.stat-trend { font-size: 12px; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 4px; }
.trend-up { color: #67c23a; }
.trend-down { color: #f56c6c; }
.stat-sub { font-size: 12px; color: #999; margin-top: 8px; }
.chart-card { margin-bottom: 20px; }
.chart-container { height: 300px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.weak-points-list { max-height: 300px; overflow-y: auto; }
.weak-point-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #eee; }
.weak-point-item:last-child { border-bottom: none; }
.point-rank { width: 24px; height: 24px; background: #f56c6c; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.point-name { flex: 1; }
.point-rate { width: 40px; text-align: right; font-weight: bold; }
.score-excellent { color: #67c23a; font-weight: bold; }
.score-pass { color: #e6a23c; }
.score-fail { color: #f56c6c; }
</style>
