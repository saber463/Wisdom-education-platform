<template>
  <TeacherLayout>
    <div class="assignment-detail-page">
      <div class="page-header">
        <el-button
          :icon="ArrowLeft"
          @click="goBack"
        >
          返回
        </el-button>
        <h2>{{ assignment?.title || '作业详情' }}</h2>
        <div
          v-if="assignment"
          class="header-actions"
        >
          <el-button
            v-if="assignment.status === 'draft'"
            type="primary"
            @click="handlePublish"
          >
            发布作业
          </el-button>
          <el-tag :type="getStatusType(assignment.status)">
            {{ getStatusLabel(assignment.status) }}
          </el-tag>
        </div>
      </div>

      <el-row
        v-loading="loading"
        :gutter="20"
      >
        <el-col :span="16">
          <el-card class="info-card">
            <template #header>
              <span>基本信息</span>
            </template>
            <el-descriptions
              :column="2"
              border
            >
              <el-descriptions-item label="作业标题">
                {{ assignment?.title }}
              </el-descriptions-item>
              <el-descriptions-item label="所属班级">
                {{ assignment?.className }}
              </el-descriptions-item>
              <el-descriptions-item label="难度等级">
                <el-tag :type="getDifficultyType(assignment?.difficulty)">
                  {{ getDifficultyLabel(assignment?.difficulty) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="总分">
                {{ assignment?.totalScore }} 分
              </el-descriptions-item>
              <el-descriptions-item label="截止时间">
                {{ formatDate(assignment?.deadline) }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(assignment?.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item
                label="作业描述"
                :span="2"
              >
                {{ assignment?.description || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="questions-card">
            <template #header>
              <span>题目列表 ({{ questions.length }} 题)</span>
            </template>
            <div
              v-for="(q, index) in questions"
              :key="q.id"
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">第 {{ index + 1 }} 题</span>
                <el-tag size="small">
                  {{ getQuestionTypeLabel(q.questionType) }}
                </el-tag>
                <span class="question-score">{{ q.score }} 分</span>
              </div>
              <div class="question-content">
                {{ q.questionContent }}
              </div>
              <div
                v-if="q.standardAnswer"
                class="question-answer"
              >
                <strong>标准答案：</strong>{{ q.standardAnswer }}
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="stats-card">
            <template #header>
              <span>提交统计</span>
            </template>
            <div class="stats-item">
              <span class="stats-label">提交人数</span>
              <span class="stats-value">{{ assignment?.submittedCount || 0 }} / {{ assignment?.totalStudents || 0 }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">批改进度</span>
              <el-progress
                :percentage="getGradingProgress()"
                :stroke-width="10"
              />
            </div>
            <div class="stats-item">
              <span class="stats-label">平均分</span>
              <span class="stats-value">{{ assignment?.averageScore?.toFixed(1) || '-' }}</span>
            </div>
          </el-card>

          <el-card class="submissions-card">
            <template #header>
              <span>最近提交</span>
            </template>
            <el-table
              :data="recentSubmissions"
              size="small"
            >
              <el-table-column
                prop="studentName"
                label="学生"
              />
              <el-table-column
                prop="totalScore"
                label="得分"
                width="80"
              />
              <el-table-column
                prop="status"
                label="状态"
                width="80"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="row.status === 'graded' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ row.status === 'graded' ? '已批改' : '待批改' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const loading = ref(false)

interface Assignment {
  id: number; title: string; description: string; classId: number; className: string
  difficulty: string; totalScore: number; deadline: string; status: string
  createdAt: string; submittedCount: number; gradedCount: number; totalStudents: number; averageScore: number
}

interface Question {
  id: number; questionNumber: number; questionType: string; questionContent: string; standardAnswer: string; score: number
}

const assignment = ref<Assignment | null>(null)
const questions = ref<Question[]>([])
const recentSubmissions = ref<Array<{ studentName: string; totalScore: number; status: string }>>([])

async function fetchAssignment() {
  loading.value = true
  try {
    const id = route.params.id
    const response = await request.get<{ assignment?: Assignment; questions?: Question[]; submissions?: unknown[] }>(`/assignments/${id}`)
    assignment.value = response.assignment ?? null
    questions.value = (response.questions || []) as typeof questions.value
    recentSubmissions.value = (response.submissions?.slice(0, 5) || []) as typeof recentSubmissions.value
  } catch (error) {
    console.error('[作业详情] 获取失败:', error)
    ElMessage.error('获取作业详情失败')
  } finally { loading.value = false }
}

async function handlePublish() {
  try {
    await ElMessageBox.confirm('确定要发布作业吗？发布后将通知班级所有学生。', '发布确认', { type: 'warning' })
    await request.post(`/assignments/${assignment.value?.id}/publish`)
    ElMessage.success('作业发布成功')
    fetchAssignment()
  } catch (error: unknown) {
    if (error !== 'cancel') { const m = (error as { response?: { data?: { message?: string } } })?.response?.data?.message; ElMessage.error(m || '发布失败') }
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getGradingProgress(): number {
  if (!assignment.value?.submittedCount) return 0
  return Math.round((assignment.value.gradedCount / assignment.value.submittedCount) * 100)
}

function getStatusLabel(status?: string): string {
  const labels: Record<string, string> = { draft: '草稿', published: '已发布', closed: '已关闭' }
  return labels[status || ''] || status || ''
}

function getStatusType(status?: string): '' | 'success' | 'info' | 'warning' {
  const types: Record<string, '' | 'success' | 'info' | 'warning'> = { draft: 'info', published: 'success', closed: 'warning' }
  return types[status || ''] || ''
}

function getDifficultyLabel(difficulty?: string): string {
  const labels: Record<string, string> = { basic: '基础', medium: '中等', advanced: '提高' }
  return labels[difficulty || ''] || difficulty || ''
}

function getDifficultyType(difficulty?: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = { basic: 'success', medium: 'warning', advanced: 'danger' }
  return types[difficulty || ''] || ''
}

function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = { choice: '选择题', fill: '填空题', judge: '判断题', subjective: '主观题' }
  return labels[type] || type
}

function goBack() { router.back() }
onMounted(() => { fetchAssignment() })
</script>

<style scoped>
.assignment-detail-page { min-height: 100%; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; flex: 1; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.info-card, .questions-card, .stats-card, .submissions-card { margin-bottom: 20px; }
.question-item { background: #f5f7fa; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.question-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.question-number { font-weight: bold; color: #409eff; }
.question-score { margin-left: auto; color: #e6a23c; font-weight: bold; }
.question-content { color: #333; margin-bottom: 8px; }
.question-answer { color: #67c23a; font-size: 14px; }
.stats-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; }
.stats-item:last-child { border-bottom: none; }
.stats-label { color: #666; }
.stats-value { font-size: 18px; font-weight: bold; color: #333; }
</style>
