<template>
  <TeacherLayout>
    <div class="grading-detail-page">
      <div class="page-header">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h2>批改详情</h2>
        <el-tag v-if="submission" :type="getStatusType(submission.status)">{{ getStatusLabel(submission.status) }}</el-tag>
      </div>

      <el-row :gutter="20" v-loading="loading">
        <el-col :span="16">
          <!-- 学生信息 -->
          <el-card class="info-card">
            <template #header><span>提交信息</span></template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="学生姓名">{{ submission?.studentName }}</el-descriptions-item>
              <el-descriptions-item label="作业名称">{{ submission?.assignmentTitle }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatDate(submission?.submitTime) }}</el-descriptions-item>
              <el-descriptions-item label="批改时间">{{ formatDate(submission?.gradingTime) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 答题详情 -->
          <el-card class="answers-card">
            <template #header><span>答题详情</span></template>
            <div v-for="(answer, index) in answers" :key="answer.id" class="answer-item">
              <div class="answer-header">
                <span class="question-number">第 {{ index + 1 }} 题</span>
                <el-tag size="small">{{ getQuestionTypeLabel(answer.questionType) }}</el-tag>
                <span class="answer-score" :class="answer.isCorrect ? 'correct' : 'wrong'">
                  {{ answer.score }} / {{ answer.maxScore }} 分
                </span>
              </div>
              
              <div class="question-content">
                <strong>题目：</strong>{{ answer.questionContent }}
              </div>
              
              <div class="student-answer">
                <strong>学生答案：</strong>
                <span :class="answer.isCorrect ? 'correct' : 'wrong'">{{ answer.studentAnswer || '未作答' }}</span>
              </div>
              
              <div class="standard-answer" v-if="answer.standardAnswer">
                <strong>标准答案：</strong>{{ answer.standardAnswer }}
              </div>
              
              <div class="ai-feedback" v-if="answer.aiFeedback">
                <strong>AI反馈：</strong>{{ answer.aiFeedback }}
              </div>

              <!-- 人工复核区域 -->
              <div class="review-section" v-if="submission?.status === 'graded' || submission?.status === 'reviewed'">
                <el-divider content-position="left">人工复核</el-divider>
                <el-form :inline="true">
                  <el-form-item label="调整分数">
                    <el-input-number v-model="answer.adjustedScore" :min="0" :max="answer.maxScore" size="small" />
                  </el-form-item>
                  <el-form-item label="复核意见">
                    <el-input v-model="answer.reviewComment" placeholder="输入复核意见" size="small" style="width: 300px" />
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <!-- 得分统计 -->
          <el-card class="score-card">
            <template #header><span>得分统计</span></template>
            <div class="total-score">
              <span class="score-value" :class="getScoreClass(totalScore, maxScore)">{{ totalScore }}</span>
              <span class="score-max">/ {{ maxScore }} 分</span>
            </div>
            <el-progress :percentage="Math.round((totalScore / maxScore) * 100)" :stroke-width="20" :status="getProgressStatus()" />
            
            <div class="score-breakdown">
              <div class="breakdown-item">
                <span>正确题数</span>
                <span class="correct">{{ correctCount }} 题</span>
              </div>
              <div class="breakdown-item">
                <span>错误题数</span>
                <span class="wrong">{{ wrongCount }} 题</span>
              </div>
            </div>
          </el-card>

          <!-- 改进建议 -->
          <el-card class="suggestions-card">
            <template #header><span>改进建议</span></template>
            <div v-if="suggestions.length > 0">
              <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
                <el-icon><Warning /></el-icon>
                <span>{{ suggestion }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无改进建议" :image-size="60" />
          </el-card>

          <!-- 操作按钮 -->
          <el-card class="actions-card" v-if="submission?.status === 'graded' || submission?.status === 'reviewed'">
            <template #header><span>复核操作</span></template>
            <el-button type="primary" @click="handleSaveReview" :loading="saving" style="width: 100%">
              保存复核结果
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Warning } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)

interface Submission {
  id: number; studentId: number; studentName: string; assignmentId: number; assignmentTitle: string
  submitTime: string; gradingTime: string; totalScore: number; status: string
}

interface Answer {
  id: number; questionId: number; questionNumber: number; questionType: string; questionContent: string
  studentAnswer: string; standardAnswer: string; score: number; maxScore: number; isCorrect: boolean
  aiFeedback: string; needsReview: boolean; adjustedScore: number; reviewComment: string
}

const submission = ref<Submission | null>(null)
const answers = ref<Answer[]>([])
const suggestions = ref<string[]>([])

const totalScore = computed(() => answers.value.reduce((sum, a) => sum + (a.adjustedScore ?? a.score), 0))
const maxScore = computed(() => answers.value.reduce((sum, a) => sum + a.maxScore, 0))
const correctCount = computed(() => answers.value.filter(a => a.isCorrect).length)
const wrongCount = computed(() => answers.value.filter(a => !a.isCorrect).length)

async function fetchGradingDetail() {
  loading.value = true
  try {
    const id = route.params.id
    const response = await request.get<{ submission?: Submission; answers?: Answer[]; suggestions?: string[] }>(`/grading/${id}`)
    submission.value = response.submission ?? null
    answers.value = (response.answers || []).map(a => ({ ...a, adjustedScore: a.score, reviewComment: '' }))
    suggestions.value = response.suggestions || []
  } catch (error) {
    console.error('[批改详情] 获取失败:', error)
    ElMessage.error('获取批改详情失败')
  } finally { loading.value = false }
}

async function handleSaveReview() {
  saving.value = true
  try {
    const reviewData = {
      submissionId: submission.value?.id,
      answers: answers.value.map(a => ({
        answerId: a.id,
        adjustedScore: a.adjustedScore,
        reviewComment: a.reviewComment
      }))
    }
    await request.put(`/grading/${submission.value?.id}/review`, reviewData)
    ElMessage.success('复核结果保存成功')
    fetchGradingDetail()
  } catch (error: any) {
    console.error('[批改详情] 保存复核失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally { saving.value = false }
}

function formatDate(dateStr?: string): string { return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-' }

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = { submitted: '待批改', grading: '批改中', graded: '已批改', reviewed: '已复核' }
  return labels[status] || status
}

function getStatusType(status: string): '' | 'success' | 'info' | 'warning' {
  const types: Record<string, '' | 'success' | 'info' | 'warning'> = { submitted: 'warning', grading: 'info', graded: 'success', reviewed: '' }
  return types[status] || ''
}

function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = { choice: '选择题', fill: '填空题', judge: '判断题', subjective: '主观题' }
  return labels[type] || type
}

function getScoreClass(score: number, max: number): string {
  const ratio = score / max
  if (ratio >= 0.9) return 'excellent'
  if (ratio >= 0.6) return 'pass'
  return 'fail'
}

function getProgressStatus(): '' | 'success' | 'warning' | 'exception' {
  const ratio = totalScore.value / maxScore.value
  if (ratio >= 0.9) return 'success'
  if (ratio >= 0.6) return ''
  return 'exception'
}

function goBack() { router.back() }
onMounted(() => { fetchGradingDetail() })
</script>

<style scoped>
.grading-detail-page { min-height: 100%; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; flex: 1; }
.info-card, .answers-card, .score-card, .suggestions-card, .actions-card { margin-bottom: 20px; }
.answer-item { background: #f5f7fa; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.answer-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.question-number { font-weight: bold; color: #409eff; }
.answer-score { margin-left: auto; font-weight: bold; }
.answer-score.correct { color: #67c23a; }
.answer-score.wrong { color: #f56c6c; }
.question-content, .student-answer, .standard-answer, .ai-feedback { margin-bottom: 8px; line-height: 1.6; }
.student-answer .correct { color: #67c23a; }
.student-answer .wrong { color: #f56c6c; }
.review-section { margin-top: 12px; }
.total-score { text-align: center; margin-bottom: 20px; }
.score-value { font-size: 48px; font-weight: bold; }
.score-value.excellent { color: #67c23a; }
.score-value.pass { color: #e6a23c; }
.score-value.fail { color: #f56c6c; }
.score-max { font-size: 24px; color: #999; }
.score-breakdown { margin-top: 20px; }
.breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
.breakdown-item:last-child { border-bottom: none; }
.breakdown-item .correct { color: #67c23a; font-weight: bold; }
.breakdown-item .wrong { color: #f56c6c; font-weight: bold; }
.suggestion-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; color: #e6a23c; }
</style>
