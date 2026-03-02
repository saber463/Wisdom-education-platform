<template>
  <ParentLayout>
    <div class="parent-dashboard">
      <h2>欢迎回来，{{ userStore.displayName }}</h2>
      
      <!-- 孩子选择器（如果有多个孩子） -->
      <div v-if="children.length > 1" class="child-selector">
        <el-select v-model="selectedChildId" placeholder="选择孩子" @change="handleChildChange">
          <el-option v-for="child in children" :key="child.id" :label="child.name" :value="child.id" />
        </el-select>
      </div>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #409eff;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.latestScore ?? '-' }}</div>
              <div class="stat-label">最新成绩</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #67c23a;">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.classRank ?? '-' }}</div>
              <div class="stat-label">班级排名</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #e6a23c;">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.averageScore?.toFixed(1) ?? '-' }}</div>
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
              <div class="stat-value">{{ stats.weakPointCount ?? 0 }}</div>
              <div class="stat-label">薄弱知识点</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 快捷操作和最近成绩 -->
      <el-row :gutter="20" class="quick-actions">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>快捷操作</span>
            </template>
            <div class="action-buttons">
              <el-button type="primary" @click="$router.push('/parent/monitor')">
                <el-icon><DataAnalysis /></el-icon>学情监控
              </el-button>
              <el-button type="warning" @click="$router.push('/parent/weak-points')">
                <el-icon><Warning /></el-icon>薄弱点详情
              </el-button>
              <el-button type="success" @click="$router.push('/parent/messages')">
                <el-icon><ChatDotRound /></el-icon>家校留言
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>最近作业成绩</span>
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
              <el-table-column prop="gradingTime" label="批改时间" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.gradingTime) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 通知消息 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最新通知</span>
                <el-badge :value="unreadCount" :hidden="unreadCount === 0">
                  <el-button type="primary" link>查看全部</el-button>
                </el-badge>
              </div>
            </template>
            <el-timeline v-if="notifications.length > 0">
              <el-timeline-item
                v-for="notification in notifications"
                :key="notification.id"
                :timestamp="formatDate(notification.createdAt)"
                :type="getNotificationType(notification.type)"
              >
                <div class="notification-content">
                  <strong>{{ notification.title }}</strong>
                  <p>{{ notification.content }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无通知" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </ParentLayout>
</template>

<script setup lang="ts">
/**
 * 家长工作台
 * 
 * 功能：
 * - 显示孩子最新作业成绩和班级排名
 * - 显示薄弱知识点数量
 * - 快捷操作入口
 * - 最新通知
 * 
 * 需求：8.1 - 家长登录系统显示孩子学习情况
 */
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import ParentLayout from '@/components/ParentLayout.vue'
import request from '@/utils/request'
import { Document, Trophy, TrendCharts, Warning, DataAnalysis, ChatDotRound } from '@element-plus/icons-vue'

const userStore = useUserStore()

// 孩子列表
const children = ref<Array<{ id: number; name: string }>>([])
const selectedChildId = ref<number | null>(null)

// 统计数据
const stats = reactive({
  latestScore: null as number | null,
  classRank: null as number | null,
  averageScore: null as number | null,
  weakPointCount: 0
})

// 最近成绩
const recentResults = ref<Array<{
  id: number
  assignmentTitle: string
  score: number
  totalScore: number
  gradingTime: string
}>>([])

// 通知列表
const notifications = ref<Array<{
  id: number
  type: string
  title: string
  content: string
  createdAt: string
  isRead: boolean
}>>([])

const unreadCount = ref(0)

// 获取工作台数据
async function fetchDashboardData() {
  try {
    const params = selectedChildId.value ? { studentId: selectedChildId.value } : {}
    const response = await request.get<{
      children?: unknown[]
      latestScore?: number
      classRank?: number
      averageScore?: number
      weakPointCount?: number
      recentResults?: unknown[]
      notifications?: unknown[]
      unreadCount?: number
    }>('/parent/dashboard', { params })
    
    if (response) {
      children.value = (response.children || []) as typeof children.value
      if (!selectedChildId.value && children.value.length > 0) {
        selectedChildId.value = children.value[0].id
      }
      stats.latestScore = response.latestScore ?? null
      stats.classRank = response.classRank ?? null
      stats.averageScore = response.averageScore ?? null
      stats.weakPointCount = response.weakPointCount || 0
      recentResults.value = (response.recentResults || []) as typeof recentResults.value
      notifications.value = (response.notifications || []) as typeof notifications.value
      unreadCount.value = response.unreadCount ?? 0
    }
  } catch (error) {
    console.error('[家长工作台] 获取数据失败:', error)
  }
}

// 切换孩子
function handleChildChange() {
  fetchDashboardData()
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取分数样式类
function getScoreClass(score: number, totalScore: number): string {
  const percentage = (score / totalScore) * 100
  if (percentage >= 85) return 'score-excellent'
  if (percentage >= 60) return 'score-pass'
  return 'score-fail'
}

// 获取通知类型
function getNotificationType(type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    assignment: 'primary',
    grading: 'success',
    system: 'info',
    message: 'warning'
  }
  return typeMap[type] || 'info'
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.parent-dashboard {
  padding: 10px;
}

.parent-dashboard h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
}

.child-selector {
  margin-bottom: 20px;
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

.notification-content {
  line-height: 1.6;
}

.notification-content strong {
  color: #333;
}

.notification-content p {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 13px;
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
