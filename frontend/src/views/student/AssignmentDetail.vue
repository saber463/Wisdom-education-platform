<template>
  <StudentLayout>
    <div class="assignment-detail-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <el-button
          :icon="ArrowLeft"
          @click="goBack"
        >
          返回
        </el-button>
        <h2>作业详情</h2>
      </div>

      <!-- 加载状态 -->
      <el-skeleton
        v-if="loading"
        :rows="10"
        animated
      />

      <!-- 作业信息 -->
      <template v-else-if="assignment">
        <el-card class="assignment-info-card">
          <template #header>
            <div class="card-header">
              <span>{{ assignment.title }}</span>
              <div class="header-tags">
                <el-tag :type="getDifficultyType(assignment.difficulty)">
                  {{ getDifficultyLabel(assignment.difficulty) }}
                </el-tag>
                <el-tag :type="getStatusType(submissionStatus)">
                  {{ getStatusLabel(submissionStatus) }}
                </el-tag>
              </div>
            </div>
          </template>
          
          <el-descriptions
            :column="2"
            border
          >
            <el-descriptions-item label="班级">
              {{ assignment.class_name }}
            </el-descriptions-item>
            <el-descriptions-item label="教师">
              {{ assignment.teacher_name }}
            </el-descriptions-item>
            <el-descriptions-item label="总分">
              {{ assignment.total_score }}分
            </el-descriptions-item>
            <el-descriptions-item label="题目数量">
              {{ questions.length }}题
            </el-descriptions-item>
            <el-descriptions-item
              label="截止时间"
              :span="2"
            >
              <span :class="{ 'text-danger': isExpired }">
                {{ formatDate(assignment.deadline) }}
              </span>
              <el-tag
                v-if="!isExpired"
                type="info"
                size="small"
                class="countdown-tag"
              >
                {{ countdown }}
              </el-tag>
              <el-tag
                v-else
                type="danger"
                size="small"
              >
                已截止
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <div
            v-if="assignment.description"
            class="description"
          >
            <strong>作业说明：</strong>{{ assignment.description }}
          </div>
        </el-card>

        <!-- 题目预览 -->
        <el-card class="questions-card">
          <template #header>
            <div class="card-header">
              <span>题目预览</span>
              <div class="question-stats">
                <el-tag
                  type="info"
                  size="small"
                >
                  选择题 {{ choiceCount }}
                </el-tag>
                <el-tag
                  type="success"
                  size="small"
                >
                  判断题 {{ judgeCount }}
                </el-tag>
                <el-tag
                  type="warning"
                  size="small"
                >
                  填空题 {{ fillCount }}
                </el-tag>
                <el-tag
                  type="danger"
                  size="small"
                >
                  主观题 {{ subjectiveCount }}
                </el-tag>
              </div>
            </div>
          </template>

          <div
            v-for="question in questions"
            :key="question.id"
            class="question-item"
          >
            <div class="question-header">
              <span class="question-number">第{{ question.question_number }}题</span>
              <el-tag
                :type="getQuestionTypeTag(question.question_type)"
                size="small"
              >
                {{ getQuestionTypeLabel(question.question_type) }}
              </el-tag>
              <span class="question-score">（{{ question.score }}分）</span>
              <el-tag
                v-if="question.knowledge_point_name"
                type="info"
                size="small"
                class="knowledge-tag"
              >
                {{ question.knowledge_point_name }}
              </el-tag>
            </div>
            
            <div class="question-content">
              {{ question.question_content }}
            </div>
          </div>
        </el-card>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button @click="goBack">
            返回列表
          </el-button>
          <el-button
            v-if="submissionStatus === 'pending' && !isExpired"
            type="primary"
            size="large"
            @click="goToSubmit"
          >
            <el-icon><Edit /></el-icon>
            开始答题
          </el-button>
          <el-button
            v-if="submissionStatus === 'graded' && submissionId"
            type="success"
            size="large"
            @click="viewResult"
          >
            <el-icon><View /></el-icon>
            查看批改结果
          </el-button>
          <el-tag
            v-if="submissionStatus === 'submitted'"
            type="info"
            size="large"
          >
            作业已提交，等待批改中...
          </el-tag>
        </div>
      </template>

      <!-- 作业不存在 -->
      <el-empty
        v-else
        description="作业不存在或已关闭"
      />
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生作业详情页面
 * 
 * 功能：
 * - 显示作业详细信息
 * - 显示题目预览
 * - 提供答题入口
 * 
 * 需求：5.1
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, View } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

// 作业ID
const assignmentId = computed(() => parseInt(route.params.id as string))

// 加载状态
const loading = ref(true)

// 作业信息
interface Assignment {
  id: number
  title: string
  description: string | null
  class_id: number
  class_name: string
  teacher_name: string
  difficulty: 'basic' | 'medium' | 'advanced'
  total_score: number
  deadline: string
  status: string
}

interface Question {
  id: number
  question_number: number
  question_type: 'choice' | 'fill' | 'judge' | 'subjective'
  question_content: string
  score: number
  knowledge_point_id: number | null
  knowledge_point_name: string | null
}

const assignment = ref<Assignment | null>(null)
const questions = ref<Question[]>([])
const submissionStatus = ref<'pending' | 'submitted' | 'graded'>('pending')
const submissionId = ref<number | null>(null)

// 倒计时
const countdown = ref('')
let countdownTimer: number | null = null

// 计算属性
const isExpired = computed(() => {
  if (!assignment.value) return true
  return new Date(assignment.value.deadline) < new Date()
})

const choiceCount = computed(() => questions.value.filter(q => q.question_type === 'choice').length)
const judgeCount = computed(() => questions.value.filter(q => q.question_type === 'judge').length)
const fillCount = computed(() => questions.value.filter(q => q.question_type === 'fill').length)
const subjectiveCount = computed(() => questions.value.filter(q => q.question_type === 'subjective').length)

// 获取作业详情
async function fetchAssignment() {
  loading.value = true
  try {
    const response = await request.get<{
      success?: boolean
      data?: Assignment & { questions: Question[] }
    }>(`/assignments/${assignmentId.value}`)
    
    if (response.success && response.data) {
      assignment.value = response.data
      questions.value = response.data.questions || []
      
      // 启动倒计时
      updateCountdown()
      startCountdownTimer()
    }
    
    // 检查提交状态
    await checkSubmissionStatus()
  } catch (error) {
    console.error('[作业详情] 获取作业详情失败:', error)
    ElMessage.error('获取作业详情失败')
  } finally {
    loading.value = false
  }
}

// 检查提交状态
async function checkSubmissionStatus() {
  try {
    const response = await request.get<{
      assignments?: Array<{
        id: number
        submissionStatus: 'pending' | 'submitted' | 'graded'
        submissionId?: number
      }>
    }>('/student/assignments', {
      params: { page: 1, pageSize: 100 }
    })
    
    if (response.assignments) {
      const currentAssignment = response.assignments.find((a: { id: number }) => a.id === assignmentId.value)
      if (currentAssignment) {
        submissionStatus.value = currentAssignment.submissionStatus
        submissionId.value = currentAssignment.submissionId || null
      }
    }
  } catch (error) {
    console.error('[作业详情] 检查提交状态失败:', error)
  }
}

// 更新倒计时
function updateCountdown() {
  if (!assignment.value) return
  
  const deadline = new Date(assignment.value.deadline)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  
  if (diff <= 0) {
    countdown.value = '已截止'
    return
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    countdown.value = `剩余 ${days}天${hours}小时${minutes}分钟`
  } else if (hours > 0) {
    countdown.value = `剩余 ${hours}小时${minutes}分钟`
  } else {
    countdown.value = `剩余 ${minutes}分钟`
  }
}

// 启动倒计时定时器
function startCountdownTimer() {
  countdownTimer = window.setInterval(updateCountdown, 60000)
}

// 返回上一页
function goBack() {
  router.push('/student/assignments')
}

// 跳转到答题页面
function goToSubmit() {
  router.push(`/student/assignments/${assignmentId.value}/submit`)
}

// 查看批改结果
function viewResult() {
  if (submissionId.value) {
    router.push(`/student/results/${submissionId.value}`)
  }
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

// 获取难度标签
function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    basic: '基础',
    medium: '中等',
    advanced: '提高'
  }
  return labels[difficulty] || difficulty
}

// 获取难度类型
function getDifficultyType(difficulty: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    basic: 'success',
    medium: 'warning',
    advanced: 'danger'
  }
  return types[difficulty] || ''
}

// 获取状态标签
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待完成',
    submitted: '已提交',
    graded: '已批改'
  }
  return labels[status] || status
}

// 获取状态类型
function getStatusType(status: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    pending: 'warning',
    submitted: 'info',
    graded: 'success'
  }
  return types[status] || ''
}

// 获取题型标签
function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    choice: '选择题',
    fill: '填空题',
    judge: '判断题',
    subjective: '主观题'
  }
  return labels[type] || type
}

// 获取题型标签类型
function getQuestionTypeTag(type: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    choice: '',
    fill: 'info',
    judge: 'success',
    subjective: 'warning'
  }
  return types[type] || ''
}

// 初始化
onMounted(() => {
  fetchAssignment()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.assignment-detail-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #F0F0F0;
}

.assignment-info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tags {
  display: flex;
  gap: 8px;
}

.countdown-tag {
  margin-left: 8px;
}

.description {
  margin-top: 16px;
  padding: 12px;
  background: #2a2a2a;
  border-radius: 4px;
  color: #666;
}

.questions-card {
  margin-bottom: 20px;
}

.question-stats {
  display: flex;
  gap: 8px;
}

.question-item {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.question-item:last-child {
  margin-bottom: 0;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.question-number {
  font-weight: bold;
  color: #00FF94;
}

.question-score {
  color: #909399;
  font-size: 14px;
}

.knowledge-tag {
  margin-left: auto;
}

.question-content {
  line-height: 1.6;
  color: #F0F0F0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: #252525;
  border-radius: 8px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);
}

.text-danger {
  color: #FF4B6E;
}
</style>
