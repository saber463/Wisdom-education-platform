<template>
  <StudentLayout>
    <div class="assignments-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>我的作业</h2>
      </div>

      <!-- 筛选 -->
      <el-card class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
              <el-option label="待完成" value="pending" />
              <el-option label="已提交" value="submitted" />
              <el-option label="已批改" value="graded" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="fetchAssignments">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 作业列表 -->
      <el-card class="list-card">
        <el-table
          v-loading="loading"
          :data="assignmentList"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="title" label="作业名称" min-width="200">
            <template #default="{ row }">
              <el-link type="primary" @click="handleDetail(row.id)">
                {{ row.title }}
              </el-link>
            </template>
          </el-table-column>
          
          <el-table-column prop="className" label="班级" width="120" />
          
          <el-table-column prop="difficulty" label="难度" width="100">
            <template #default="{ row }">
              <el-tag :type="getDifficultyType(row.difficulty)">
                {{ getDifficultyLabel(row.difficulty) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="totalScore" label="总分" width="80" />
          
          <el-table-column prop="deadline" label="截止时间" width="180">
            <template #default="{ row }">
              <div class="deadline-cell">
                <span :class="{ 'text-danger': isExpired(row.deadline) }">
                  {{ formatDate(row.deadline) }}
                </span>
                <el-tag v-if="!isExpired(row.deadline)" type="info" size="small" class="countdown">
                  {{ getCountdown(row.deadline) }}
                </el-tag>
                <el-tag v-else type="danger" size="small">已截止</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="submissionStatus" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.submissionStatus)">
                {{ getStatusLabel(row.submissionStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="score" label="得分" width="100">
            <template #default="{ row }">
              <span v-if="row.submissionStatus === 'graded'" :class="getScoreClass(row.score, row.totalScore)">
                {{ row.score }} / {{ row.totalScore }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.submissionStatus === 'pending' && !isExpired(row.deadline)"
                type="primary"
                size="small"
                @click="handleSubmit(row.id)"
              >
                提交作业
              </el-button>
              <el-button
                v-if="row.submissionStatus === 'graded'"
                type="success"
                size="small"
                @click="handleViewResult(row.submissionId)"
              >
                查看结果
              </el-button>
              <el-button size="small" @click="handleDetail(row.id)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchAssignments"
            @current-change="fetchAssignments"
          />
        </div>
      </el-card>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生作业列表页面
 * 
 * 功能：
 * - 显示待完成作业列表和截止时间倒计时
 * - 显示已提交和已批改作业
 * - 跳转到作业提交页面
 * 
 * 需求：5.1 - 学生登录系统显示待完成作业列表和截止时间倒计时
 */
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 筛选表单
const filterForm = reactive({
  status: '' as string
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 作业列表数据
interface Assignment {
  id: number
  title: string
  description: string
  className: string
  difficulty: 'basic' | 'medium' | 'advanced'
  totalScore: number
  deadline: string
  submissionStatus: 'pending' | 'submitted' | 'graded'
  submissionId?: number
  score?: number
}

const assignmentList = ref<Assignment[]>([])

// 倒计时定时器
let countdownTimer: number | null = null

// 获取作业列表
async function fetchAssignments() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterForm.status) {
      params.status = filterForm.status
    }
    
    const response = await request.get<{ 
      assignments?: Assignment[]
      total?: number 
    }>('/student/assignments', { params })
    
    assignmentList.value = response.assignments || []
    pagination.total = response.total || 0
  } catch (error) {
    console.error('[我的作业] 获取作业列表失败:', error)
    ElMessage.error('获取作业列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选
function resetFilter() {
  filterForm.status = ''
  pagination.page = 1
  fetchAssignments()
}

// 查看详情
function handleDetail(id: number) {
  router.push(`/student/assignments/${id}`)
}

// 提交作业
function handleSubmit(id: number) {
  router.push(`/student/assignments/${id}/submit`)
}

// 查看批改结果
function handleViewResult(submissionId: number) {
  router.push(`/student/results/${submissionId}`)
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

// 判断是否过期
function isExpired(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

// 获取倒计时
function getCountdown(deadline: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  
  if (diff <= 0) return '已截止'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `剩余${days}天${hours}小时`
  if (hours > 0) return `剩余${hours}小时${minutes}分钟`
  return `剩余${minutes}分钟`
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

// 获取分数样式类
function getScoreClass(score: number, totalScore: number): string {
  const percentage = (score / totalScore) * 100
  if (percentage >= 85) return 'score-excellent'
  if (percentage >= 60) return 'score-pass'
  return 'score-fail'
}

// 启动倒计时更新
function startCountdownTimer() {
  countdownTimer = window.setInterval(() => {
    // 触发视图更新
    assignmentList.value = [...assignmentList.value]
  }, 60000) // 每分钟更新一次
}

// 初始化
onMounted(() => {
  fetchAssignments()
  startCountdownTimer()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.assignments-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.list-card {
  min-height: 400px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.deadline-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.countdown {
  font-size: 11px;
}

.text-danger {
  color: #f56c6c;
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
