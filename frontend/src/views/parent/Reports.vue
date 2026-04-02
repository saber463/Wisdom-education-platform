<template>
  <ParentLayout>
    <div class="reports-page">
      <div class="page-header">
        <h2>成绩报告</h2>
        <div class="header-actions">
          <el-select v-model="selectedPeriod" style="width:140px" @change="fetchReport">
            <el-option label="本学期" value="current" />
            <el-option label="上学期" value="last" />
            <el-option label="近30天" value="month" />
          </el-select>
          <el-button type="primary" @click="printReport">
            <el-icon><Download /></el-icon> 导出报告
          </el-button>
        </div>
      </div>

      <div v-loading="loading">
        <!-- 总体成绩概览 -->
        <el-row :gutter="20" class="overview-cards">
          <el-col :xs="12" :sm="6" v-for="s in summaryStats" :key="s.label">
            <el-card class="stat-card">
              <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
              <div class="stat-trend" :class="s.trend > 0 ? 'up' : s.trend < 0 ? 'down' : ''">
                {{ s.trend > 0 ? '▲' : s.trend < 0 ? '▼' : '—' }} {{ Math.abs(s.trend) }}{{ s.unit }}
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 科目成绩 -->
          <el-col :xs="24" :lg="12">
            <el-card class="chart-card">
              <template #header><span class="card-title">各科成绩</span></template>
              <div ref="subjectChartEl" class="chart-container" />
            </el-card>
          </el-col>

          <!-- 成绩趋势 -->
          <el-col :xs="24" :lg="12">
            <el-card class="chart-card">
              <template #header><span class="card-title">成绩趋势</span></template>
              <div ref="trendChartEl" class="chart-container" />
            </el-card>
          </el-col>
        </el-row>

        <!-- 作业完成情况 -->
        <el-card style="margin-top: 20px;">
          <template #header><span class="card-title">最近作业成绩</span></template>
          <el-table :data="assignments" stripe style="width:100%">
            <el-table-column prop="title" label="作业名称" min-width="200" />
            <el-table-column prop="subject" label="科目" width="100" />
            <el-table-column label="得分" width="120">
              <template #default="{ row }">
                <span :class="getScoreClass(row.score, row.maxScore)">
                  {{ row.score != null ? `${row.score}/${row.maxScore}` : '未提交' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="班级排名" width="100">
              <template #default="{ row }">
                <span class="mono">{{ row.rank != null ? `#${row.rank}` : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="提交时间" width="140">
              <template #default="{ row }">
                <span class="mono text-muted">{{ formatDate(row.submitTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="AI评语" min-width="200">
              <template #default="{ row }">
                <span class="comment-text">{{ row.comment || '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
  </ParentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import ParentLayout from '@/components/ParentLayout.vue'
import request from '@/utils/request'

const loading = ref(false)
const selectedPeriod = ref('current')
const subjectChartEl = ref<HTMLElement>()
const trendChartEl = ref<HTMLElement>()
let subjectChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

const summaryStats = ref([
  { label: '综合平均分', value: '82.5', color: '#00FF94', trend: 3.2, unit: '分' },
  { label: '班级排名', value: '#8', color: '#00D4FF', trend: 2, unit: '名↑' },
  { label: '作业完成率', value: '94%', color: '#FFB700', trend: 5, unit: '%' },
  { label: '学习时长', value: '48h', color: '#FF4B6E', trend: -2, unit: 'h' },
])

interface Assignment {
  id: number; title: string; subject: string; score: number | null; maxScore: number
  rank: number | null; submitTime: string; comment: string
}

const assignments = ref<Assignment[]>([])

async function fetchReport() {
  loading.value = true
  try {
    const res = await request.get<{
      summary?: typeof summaryStats.value;
      assignments?: Assignment[];
      subjectScores?: { subject: string; score: number }[];
      trend?: { date: string; score: number }[]
    }>('/parent/report', { params: { period: selectedPeriod.value } })
    if (res.summary) summaryStats.value = res.summary
    assignments.value = res.assignments || []
    await nextTick()
    renderCharts(
      res.subjectScores || defaultSubjectScores,
      res.trend || defaultTrend
    )
  } catch {
    assignments.value = defaultAssignments
    await nextTick()
    renderCharts(defaultSubjectScores, defaultTrend)
  } finally { loading.value = false }
}

const defaultSubjectScores = [
  { subject: '数学', score: 88 }, { subject: 'Python', score: 92 },
  { subject: '英语', score: 75 }, { subject: '物理', score: 80 }, { subject: '化学', score: 70 }
]
const defaultTrend = [
  { date: '1月', score: 74 }, { date: '2月', score: 78 }, { date: '3月', score: 82 }, { date: '4月', score: 80 }, { date: '5月', score: 85 }
]
const defaultAssignments: Assignment[] = [
  { id: 1, title: 'Python基础练习', subject: 'Python', score: 92, maxScore: 100, rank: 3, submitTime: new Date().toISOString(), comment: '解题思路清晰，代码规范' },
  { id: 2, title: '函数与模块作业', subject: 'Python', score: 85, maxScore: 100, rank: 8, submitTime: new Date(Date.now() - 86400000 * 3).toISOString(), comment: '基本掌握，注意边界条件处理' },
  { id: 3, title: '数学综合练习', subject: '数学', score: 88, maxScore: 100, rank: 5, submitTime: new Date(Date.now() - 86400000 * 5).toISOString(), comment: '计算准确，解题步骤完整' },
]

function renderCharts(
  subjectScores: { subject: string; score: number }[],
  trend: { date: string; score: number }[]
) {
  if (subjectChartEl.value) {
    subjectChart = subjectChart || echarts.init(subjectChartEl.value)
    subjectChart.setOption({
      backgroundColor: 'transparent',
      radar: {
        indicator: subjectScores.map(s => ({ name: s.subject, max: 100 })),
        axisName: { color: '#707070', fontSize: 12 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      },
      series: [{ type: 'radar', data: [{ value: subjectScores.map(s => s.score), name: '成绩', areaStyle: { color: 'rgba(0,255,148,0.1)' }, lineStyle: { color: '#00FF94' }, itemStyle: { color: '#00FF94' } }] }]
    })
  }
  if (trendChartEl.value) {
    trendChart = trendChart || echarts.init(trendChartEl.value)
    trendChart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: trend.map(t => t.date), axisLabel: { color: '#606060' }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
      yAxis: { type: 'value', min: 40, max: 100, axisLabel: { color: '#606060' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
      series: [{ type: 'line', data: trend.map(t => t.score), smooth: true, itemStyle: { color: '#00D4FF' }, lineStyle: { color: '#00D4FF', width: 2 }, areaStyle: { color: 'rgba(0,212,255,0.08)' } }]
    })
  }
}

function printReport() { ElMessage.info('报告导出功能开发中，敬请期待') }
function formatDate(s: string) { return s ? new Date(s).toLocaleDateString('zh-CN') : '-' }
function getScoreClass(score: number | null, max: number) {
  if (score == null) return 'mono text-muted'
  const r = score / max
  return r >= 0.85 ? 'mono text-success' : r >= 0.6 ? 'mono text-warning' : 'mono text-danger'
}

onMounted(fetchReport)
</script>

<style scoped>
.reports-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 900; color: #F0F0F0; font-family: 'Source Han Sans CN', sans-serif; }
.header-actions { display: flex; gap: 10px; }
.overview-cards { margin-bottom: 20px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-value { font-size: 28px; font-weight: 700; font-family: Consolas, monospace; margin-bottom: 4px; }
.stat-label { font-size: 13px; color: #707070; margin-bottom: 4px; }
.stat-trend { font-size: 12px; color: #606060; font-family: Consolas, monospace; }
.stat-trend.up { color: #00FF94; }
.stat-trend.down { color: #FF4B6E; }
.chart-card { margin-bottom: 20px; }
.chart-container { height: 280px; }
.card-title { font-size: 15px; font-weight: 700; color: #E0E0E0; }
.mono { font-family: Consolas, monospace; }
.text-success { color: #00FF94; font-weight: 700; }
.text-warning { color: #FFB700; font-weight: 700; }
.text-danger { color: #FF4B6E; font-weight: 700; }
.text-muted { color: #606060; }
.comment-text { font-size: 12px; color: #909090; }
</style>
