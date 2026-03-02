<template>
  <StudentLayout>
    <div class="student-dashboard">
      <h2>欢迎回来，{{ userStore.displayName }}</h2>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #409eff;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingAssignments }}</div>
              <div class="stat-label">待完成作业</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #67c23a;">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completedAssignments }}</div>
              <div class="stat-label">已完成作业</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #e6a23c;">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.averageScore }}</div>
              <div class="stat-label">平均分</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #f56c6c;">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.weakPoints }}</div>
              <div class="stat-label">薄弱知识点</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 快捷操作和最近作业 -->
      <el-row :gutter="20" class="quick-actions">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>快捷操作</span>
            </template>
            <div class="action-buttons">
              <el-button type="primary" @click="$router.push('/student/assignments')">
                <el-icon><Document /></el-icon>查看作业
              </el-button>
              <el-button type="success" @click="$router.push('/student/recommendations')">
                <el-icon><Star /></el-icon>练习推荐
              </el-button>
              <el-button type="warning" @click="$router.push('/student/qa')">
                <el-icon><ChatDotRound /></el-icon>AI答疑
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>待完成作业</span>
            </template>
            <el-table :data="pendingAssignments" size="small" style="width: 100%">
              <el-table-column prop="title" label="作业名称" />
              <el-table-column prop="deadline" label="截止时间" width="150">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': isUrgent(row.deadline) }">
                    {{ formatDeadline(row.deadline) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="goToSubmit(row.id)">
                    提交
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近批改结果 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最近批改结果</span>
                <el-button type="primary" link @click="$router.push('/student/results')">
                  查看全部
                </el-button>
              </div>
            </template>
            <el-table :data="recentResults" size="small" style="width: 100%">
              <el-table-column prop="assignmentTitle" label="作业名称" />
              <el-table-column prop="score" label="得分" width="100">
                <template #default="{ row }">
                  <span :class="getScoreClass(row.score, row.totalScore)">
                    {{ row.score }} / {{ row.totalScore }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="gradingTime" label="批改时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.gradingTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="goToResult(row.id)">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生工作台
 * 
 * 功能：
 * - 显示待完成作业数量和截止时间
 * - 显示已完成作业和平均分
 * - 显示薄弱知识点数量
 * - 快捷操作入口
 * 
 * 需求：5.1 - 学生登录系统显示待完成作业列表
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'
import { Document, Check, TrendCharts, Warning, Star, ChatDotRound } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 统计数据
const stats = reactive({
  pendingAssignments: 0,
  completedAssignments: 0,
  averageScore: 0,
  weakPoints: 0
})

// 待完成作业列表
const pendingAssignments = ref<Array<{
  id: number
  title: string
  deadline: string
}>>([])

// 最近批改结果
const recentResults = ref<Array<{
  id: number
  assignmentTitle: string
  score: number
  totalScore: number
  gradingTime: string
}>>([])

// 获取工作台数据
async function fetchDashboardData() {
  try {
    const response = await request.get<Record<string, unknown>>('/student/dashboard')
    if (response) {
      stats.pendingAssignments = Number(response.pendingAssignments) || 0
      stats.completedAssignments = Number(response.completedAssignments) || 0
      stats.averageScore = Number(response.averageScore) || 0
      stats.weakPoints = Number(response.weakPoints) || 0
      pendingAssignments.value = (response.pendingAssignmentList || []) as typeof pendingAssignments.value
      recentResults.value = (response.recentResults || []) as typeof recentResults.value
    }
  } catch (error) {
    console.error('[学生工作台] 获取数据失败:', error)
  }
}

// 格式化截止时间
function formatDeadline(deadline: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (diff < 0) return '已截止'
  if (days > 0) return `${days}天后`
  if (hours > 0) return `${hours}小时后`
  return '即将截止'
}

// 判断是否紧急
function isUrgent(deadline: string): boolean {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const hours = diff / (1000 * 60 * 60)
  return hours < 24
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取分数样式类
function getScoreClass(score: number, totalScore: number): string {
  const percentage = (score / totalScore) * 100
  if (percentage >= 85) return 'score-excellent'
  if (percentage >= 60) return 'score-pass'
  return 'score-fail'
}

// 跳转到提交页面
function goToSubmit(id: number) {
  router.push(`/student/assignments/${id}/submit`)
}

// 跳转到结果详情
function goToResult(id: number) {
  router.push(`/student/results/${id}`)
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.student-dashboard {
  padding: 10px;
}

.student-dashboard h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon .el-icon {
  font-size: 28px;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.score-excellent {
  color: #67c23a;
  font-weight: bold;
}

.score-pass {
  color: #e6a23c;
}

.score-fail {
  color: #f56c6c;
}
</style>
