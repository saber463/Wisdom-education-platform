<template>
  <div class="team-report-container">
    <el-loading
      :active="loading"
      fullscreen
    />

    <!-- 小组基本信息 -->
    <div class="report-section">
      <h3>小组信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">小组名称</span>
          <span class="value">{{ report?.team_info?.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">成员数量</span>
          <span class="value">{{ report?.team_info?.current_members }}/{{ report?.team_info?.max_members }}</span>
        </div>
        <div class="info-item">
          <span class="label">小组活跃度</span>
          <el-progress :percentage="report?.activity_score || 0" />
        </div>
      </div>
    </div>

    <!-- 小组进度排名 -->
    <div class="report-section">
      <h3>小组进度排名</h3>
      <div class="ranking-card">
        <div class="ranking-item">
          <span class="label">当前排名</span>
          <span class="value">第 {{ report?.progress_ranking?.current_rank }} / {{ report?.progress_ranking?.total_teams }} 名</span>
        </div>
        <div class="ranking-item">
          <span class="label">排名百分位</span>
          <span class="value">{{ report?.progress_ranking?.percentile }}%</span>
        </div>
        <div class="ranking-item">
          <span class="label">总学习时长</span>
          <span class="value">{{ report?.progress_ranking?.total_study_duration }} 分钟</span>
        </div>
        <div class="ranking-item">
          <span class="label">总打卡次数</span>
          <span class="value">{{ report?.progress_ranking?.total_check_ins }} 次</span>
        </div>
      </div>
    </div>

    <!-- 成员贡献度排名 -->
    <div class="report-section">
      <h3>成员贡献度排名</h3>
      <div class="contribution-table">
        <div class="table-header">
          <div class="col rank">
            排名
          </div>
          <div class="col name">
            成员
          </div>
          <div class="col score">
            贡献度评分
          </div>
          <div class="col stats">
            打卡/互评
          </div>
        </div>
        <div
          v-for="member in report?.member_contributions"
          :key="member.student_id"
          class="table-row"
        >
          <div class="col rank">
            <el-tag
              v-if="member.rank === 1"
              type="danger"
            >
              {{ member.rank }}
            </el-tag>
            <el-tag
              v-else-if="member.rank === 2"
              type="warning"
            >
              {{ member.rank }}
            </el-tag>
            <el-tag
              v-else-if="member.rank === 3"
              type="info"
            >
              {{ member.rank }}
            </el-tag>
            <span v-else>{{ member.rank }}</span>
          </div>
          <div class="col name">
            <el-avatar
              :src="member.avatar_url"
              :alt="member.real_name"
              size="small"
            />
            <span>{{ member.real_name }}</span>
            <el-tag
              v-if="member.is_creator"
              type="success"
              size="small"
            >
              创建者
            </el-tag>
          </div>
          <div class="col score">
            <el-progress
              :percentage="member.contribution_score ?? 0"
              :color="getScoreColor(member.contribution_score ?? 0)"
            />
          </div>
          <div class="col stats">
            {{ member.check_in_count }}/{{ member.peer_review_count }}
          </div>
        </div>
      </div>
    </div>

    <!-- 打卡率统计 -->
    <div class="report-section">
      <h3>打卡率统计</h3>
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.check_in_statistics?.avg_check_in_rate }}%
          </div>
          <div class="stat-label">
            平均打卡率
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.check_in_statistics?.total_check_ins }}
          </div>
          <div class="stat-label">
            总打卡次数
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.check_in_statistics?.total_study_duration }}
          </div>
          <div class="stat-label">
            总学习时长(分)
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.check_in_statistics?.total_completed_tasks }}
          </div>
          <div class="stat-label">
            完成任务数
          </div>
        </div>
      </div>

      <!-- 打卡率趋势图 -->
      <div class="chart-container">
        <div
          id="checkInChart"
          style="width: 100%; height: 300px"
        />
      </div>
    </div>

    <!-- 学习趋势 -->
    <div class="report-section">
      <h3>学习趋势（最近7天）</h3>
      <div class="chart-container">
        <div
          id="trendChart"
          style="width: 100%; height: 300px"
        />
      </div>

      <!-- 趋势数据表 -->
      <div class="trend-table">
        <div class="table-header">
          <div class="col date">
            日期
          </div>
          <div class="col active">
            活跃成员
          </div>
          <div class="col duration">
            学习时长(分)
          </div>
          <div class="col tasks">
            完成任务数
          </div>
        </div>
        <div
          v-for="trend in report?.learning_trend"
          :key="trend.date"
          class="table-row"
        >
          <div class="col date">
            {{ formatDate(trend.date ?? '') }}
          </div>
          <div class="col active">
            {{ trend.active_members }}
          </div>
          <div class="col duration">
            {{ trend.total_study_duration }}
          </div>
          <div class="col tasks">
            {{ trend.total_completed_tasks }}
          </div>
        </div>
      </div>
    </div>

    <!-- 互评统计 -->
    <div class="report-section">
      <h3>互评统计</h3>
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.peer_review_statistics?.total_reviews ?? report?.review_statistics?.total_reviews }}
          </div>
          <div class="stat-label">
            总互评数
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.peer_review_statistics?.active_reviewers ?? report?.review_statistics?.active_reviewers }}
          </div>
          <div class="stat-label">
            参与互评人数
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.peer_review_statistics?.avg_score ?? report?.review_statistics?.avg_score }}
          </div>
          <div class="stat-label">
            平均评分
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ report?.peer_review_statistics?.participation_rate ?? report?.review_statistics?.participation_rate }}%
          </div>
          <div class="stat-label">
            参与率
          </div>
        </div>
      </div>
    </div>

    <!-- 报告生成时间 -->
    <div class="report-footer">
      <p>报告生成时间：{{ formatDateTime(report?.generated_at ?? '') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import * as echarts from 'echarts'

interface Props {
  teamId: number
}

interface TeamReportMember {
  student_id: number | string
  rank?: number
  avatar_url?: string
  real_name?: string
  is_creator?: boolean
  contribution_score?: number
  check_in_count?: number
  peer_review_count?: number
  [key: string]: unknown
}

interface TeamReportData {
  team_info?: { name?: string; current_members?: number; max_members?: number; [key: string]: unknown }
  progress_ranking?: { current_rank?: number; total_teams?: number; percentile?: number; total_study_duration?: number; total_check_ins?: number; total_completed_tasks?: number; [key: string]: unknown }
  member_contributions?: TeamReportMember[]
  check_in_statistics?: { last_7_days?: Array<{ date?: string; check_in_rate?: number }>; avg_check_in_rate?: number; total_check_ins?: number; [key: string]: unknown }
  learning_trend?: Array<{ date?: string; active_members?: number; total_study_duration?: number; total_completed_tasks?: number; [key: string]: unknown }>
  review_statistics?: { total_reviews?: number; active_reviewers?: number; avg_score?: number; participation_rate?: number; [key: string]: unknown }
  peer_review_statistics?: { total_reviews?: number; active_reviewers?: number; avg_score?: number; participation_rate?: number; [key: string]: unknown }
  activity_score?: number
  generated_at?: string
  [key: string]: unknown
}

const props = defineProps<Props>()

const loading = ref(false)
const report = ref<TeamReportData | null>(null)
let checkInChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// 获取小组学情报告
const fetchReport = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/api/teams/${props.teamId}/report`)
    if (response.data.success) {
      report.value = (response.data.data ?? null) as TeamReportData | null
      // 延迟绘制图表，确保DOM已准备好
      setTimeout(() => {
        drawCharts()
      }, 100)
    }
  } catch (error) {
    console.error('获取小组学情报告失败:', error)
    ElMessage.error('获取小组学情报告失败')
  } finally {
    loading.value = false
  }
}

// 绘制图表
const drawCharts = () => {
  drawCheckInChart()
  drawTrendChart()
}

// 绘制打卡率趋势图
const drawCheckInChart = () => {
  const chartDom = document.getElementById('checkInChart')
  if (!chartDom) return

  checkInChart = echarts.init(chartDom)

  const last7 = report.value?.check_in_statistics?.last_7_days ?? []
  const dates = last7.map((d: { date?: string }) => {
    const date = new Date(d.date ?? '')
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const rates = last7.map((d: { check_in_rate?: number }) => d.check_in_rate ?? 0)

  const option = {
    title: {
      text: '打卡率趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      max: 100
    },
    series: [
      {
        data: rates,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#00D4FF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0)' }
          ])
        }
      }
    ]
  }

  checkInChart.setOption(option)
}

// 绘制学习趋势图
const drawTrendChart = () => {
  const chartDom = document.getElementById('trendChart')
  if (!chartDom) return

  trendChart = echarts.init(chartDom)

  const trend = report.value?.learning_trend ?? []
  const dates = trend.map((t: { date?: string }) => {
    const date = new Date(t.date ?? '')
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const durations = trend.map((t: { total_study_duration?: number }) => t.total_study_duration ?? 0)
  const tasks = trend.map((t: { total_completed_tasks?: number }) => t.total_completed_tasks ?? 0)

  const option = {
    title: {
      text: '学习趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['学习时长(分)', '完成任务数']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '学习时长(分)'
      },
      {
        type: 'value',
        name: '完成任务数'
      }
    ],
    series: [
      {
        name: '学习时长(分)',
        data: durations,
        type: 'bar',
        itemStyle: {
          color: '#667eea'
        }
      },
      {
        name: '完成任务数',
        data: tasks,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        itemStyle: {
          color: '#f5576c'
        }
      }
    ]
  }

  trendChart.setOption(option)
}

// 获取评分颜色
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#00FF94'
  if (score >= 60) return '#e6a23c'
  return '#FF4B6E'
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 监听teamId变化
watch(() => props.teamId, () => {
  fetchReport()
}, { immediate: true })

// 页面卸载时清理图表
onMounted(() => {
  window.addEventListener('resize', () => {
    checkInChart?.resize()
    trendChart?.resize()
  })
})
</script>

<style scoped lang="scss">
.team-report-container {
  padding: 20px;
}

.report-section {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;

  h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #F0F0F0;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;

  .info-item {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }

    .value {
      font-size: 16px;
      color: #F0F0F0;
      font-weight: 500;
    }
  }
}

.ranking-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;

  .ranking-item {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }

    .value {
      font-size: 18px;
      color: #00FF94;
      font-weight: bold;
    }
  }
}

.contribution-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;

  .table-header {
    display: grid;
    grid-template-columns: 60px 1fr 150px 150px;
    gap: 0;
    background: #2a2a2a;
    padding: 12px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid #e0e0e0;

    .col {
      padding: 8px;
    }
  }

  .table-row {
    display: grid;
    grid-template-columns: 60px 1fr 150px 150px;
    gap: 0;
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    align-items: center;

    &:last-child {
      border-bottom: none;
    }

    .col {
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;

      &.rank {
        justify-content: center;
      }

      &.name {
        gap: 8px;
      }
    }
  }
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;

  .stat-card {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
    text-align: center;

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }

    &:nth-child(2) {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &:nth-child(3) {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    &:nth-child(4) {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
  }
}

.chart-container {
  margin: 20px 0;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;
}

.trend-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 20px;

  .table-header {
    display: grid;
    grid-template-columns: 100px 100px 150px 150px;
    gap: 0;
    background: #2a2a2a;
    padding: 12px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid #e0e0e0;

    .col {
      padding: 8px;
    }
  }

  .table-row {
    display: grid;
    grid-template-columns: 100px 100px 150px 150px;
    gap: 0;
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .col {
      padding: 8px;
    }
  }
}

.report-footer {
  text-align: center;
  color: #909399;
  font-size: 12px;
  padding: 20px;
}
</style>
