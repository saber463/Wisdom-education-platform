<template>
  <StudentLayout>
    <div class="result-detail-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h2>批改结果详情</h2>
        <el-tag v-if="submission" :type="getStatusType(submission.status)">
          {{ getStatusLabel(submission.status) }}
        </el-tag>
      </div>

      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="10" animated />

      <!-- 主要内容 -->
      <el-row v-else-if="submission" :gutter="20">
        <!-- 左侧：答题详情 -->
        <el-col :span="16">
          <!-- 作业信息卡片 -->
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>作业信息</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="作业名称">
                {{ submission.assignment_title }}
              </el-descriptions-item>
              <el-descriptions-item label="提交时间">
                {{ formatDate(submission.submit_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="批改时间">
                {{ formatDate(submission.grading_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="批改状态">
                <el-tag :type="getStatusType(submission.status)" size="small">
                  {{ getStatusLabel(submission.status) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 答题详情卡片 -->
          <el-card class="answers-card">
            <template #header>
              <div class="card-header">
                <span>答题详情</span>
                <div class="header-stats">
                  <el-tag type="success" size="small">正确 {{ statistics.correct_count }}</el-tag>
                  <el-tag type="danger" size="small">错误 {{ statistics.wrong_count }}</el-tag>
                </div>
              </div>
            </template>

            <div v-for="answer in answers" :key="answer.id" class="answer-item" 
                 :class="{ 'wrong': !answer.is_correct }">
              <div class="answer-header">
                <span class="question-number">第 {{ answer.question_number }} 题</span>
                <el-tag :type="getQuestionTypeTag(answer.question_type)" size="small">
                  {{ getQuestionTypeLabel(answer.question_type) }}
                </el-tag>
                <el-tag v-if="answer.knowledge_point" type="info" size="small">
                  {{ answer.knowledge_point }}
                </el-tag>
                <span class="answer-score" :class="answer.is_correct ? 'correct' : 'wrong'">
                  {{ answer.score ?? 0 }} / {{ answer.max_score }} 分
                </span>
              </div>

              <div class="question-content">
                <strong>题目：</strong>{{ answer.question_content }}
              </div>

              <div class="student-answer">
                <strong>我的答案：</strong>
                <span :class="answer.is_correct ? 'correct' : 'wrong'">
                  {{ answer.student_answer || '未作答' }}
                </span>
                <el-icon v-if="answer.is_correct" class="correct-icon"><CircleCheck /></el-icon>
                <el-icon v-else class="wrong-icon"><CircleClose /></el-icon>
              </div>

              <div v-if="answer.standard_answer" class="standard-answer">
                <strong>标准答案：</strong>{{ answer.standard_answer }}
              </div>

              <div v-if="answer.ai_feedback" class="ai-feedback">
                <el-icon><InfoFilled /></el-icon>
                <span>{{ answer.ai_feedback }}</span>
              </div>

              <div v-if="answer.review_comment" class="review-comment">
                <el-icon><Comment /></el-icon>
                <span><strong>教师复核：</strong>{{ answer.review_comment }}</span>
              </div>

              <div v-if="answer.needs_review" class="needs-review-tag">
                <el-tag type="warning" size="small">
                  <el-icon><Warning /></el-icon> 待人工复核
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：统计和建议 -->
        <el-col :span="8">
          <!-- 得分统计卡片 -->
          <el-card class="score-card">
            <template #header><span>得分统计</span></template>
            <div class="total-score">
              <span class="score-value" :class="getScoreClass()">
                {{ submission.total_score ?? 0 }}
              </span>
              <span class="score-max">/ {{ submission.max_score }} 分</span>
            </div>
            <el-progress :percentage="getScorePercentage()" :stroke-width="20" 
                         :status="getProgressStatus()" />
            <div class="score-breakdown">
              <div class="breakdown-item">
                <span>总题数</span><span>{{ statistics.total_questions }} 题</span>
              </div>
              <div class="breakdown-item">
                <span>正确题数</span><span class="correct">{{ statistics.correct_count }} 题</span>
              </div>
              <div class="breakdown-item">
                <span>错误题数</span><span class="wrong">{{ statistics.wrong_count }} 题</span>
              </div>
              <div class="breakdown-item">
                <span>正确率</span>
                <span :class="statistics.accuracy_rate >= 60 ? 'correct' : 'wrong'">
                  {{ statistics.accuracy_rate }}%
                </span>
              </div>
            </div>
          </el-card>

          <!-- 错题汇总 -->
          <el-card v-if="wrongQuestions.length > 0" class="wrong-questions-card">
            <template #header><span>错题汇总</span></template>
            <div v-for="(wq, index) in wrongQuestions" :key="index" class="wrong-question-item">
              <div class="wq-header">
                <span class="wq-number">第 {{ wq.question_number }} 题</span>
                <el-tag v-if="wq.knowledge_point" type="danger" size="small">
                  {{ wq.knowledge_point }}
                </el-tag>
              </div>
              <div class="wq-content">{{ truncateText(wq.question_content, 50) }}</div>
            </div>
          </el-card>

          <!-- 改进建议 -->
          <el-card class="suggestions-card">
            <template #header><span>改进建议</span></template>
            <div v-if="improvementSuggestions.length > 0">
              <div v-for="(suggestion, index) in improvementSuggestions" :key="index" 
                   class="suggestion-item">
                <el-icon><Promotion /></el-icon>
                <span>{{ suggestion }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无改进建议" :image-size="60" />
          </el-card>

          <!-- 申请复核 -->
          <el-card v-if="canRequestReview" class="review-request-card">
            <template #header><span>申请人工复核</span></template>
            <p class="review-hint">如果您对批改结果有疑问，可以申请人工复核。</p>
            <el-form :model="reviewForm" label-position="top">
              <el-form-item label="复核原因">
                <el-input v-model="reviewForm.reason" type="textarea" :rows="3"
                          placeholder="请说明申请复核的原因..." maxlength="500" show-word-limit />
              </el-form-item>
              <el-form-item label="选择需要复核的题目">
                <el-checkbox-group v-model="reviewForm.questionIds">
                  <el-checkbox v-for="answer in answers" :key="answer.question_id"
                               :label="answer.question_id" :disabled="answer.needs_review">
                    第 {{ answer.question_number }} 题
                    <span v-if="answer.needs_review" class="already-review">(已申请)</span>
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
            <el-button type="primary" @click="handleRequestReview" :loading="submittingReview"
                       :disabled="reviewForm.questionIds.length === 0" style="width: 100%">
              提交复核申请
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-else description="批改结果不存在" />
    </div>
  </StudentLayout>
</template>


<script setup lang="ts">
/**
 * 学生批改结果详情页面
 * 显示总分、各题得分、错题解析、知识点关联
 * 实现申请人工复核功能
 * 需求：5.4, 5.5
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, CircleCheck, CircleClose, InfoFilled, Warning, Comment, Promotion } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const submissionId = computed(() => parseInt(route.params.id as string))
const loading = ref(true)
const submittingReview = ref(false)

interface Submission {
  id: number
  assignment_id: number
  assignment_title: string
  student_id: number
  student_name: string
  file_url: string | null
  submit_time: string
  status: 'submitted' | 'grading' | 'graded' | 'reviewed'
  total_score: number | null
  max_score: number
  grading_time: string | null
}

interface Answer {
  id: number
  question_id: number
  question_number: number
  question_type: 'choice' | 'fill' | 'judge' | 'subjective'
  question_content: string
  standard_answer: string | null
  student_answer: string
  score: number | null
  max_score: number
  is_correct: boolean | null
  ai_feedback: string | null
  needs_review: boolean
  review_comment: string | null
  knowledge_point: string | null
}

interface Statistics {
  total_questions: number
  correct_count: number
  wrong_count: number
  needs_review_count: number
  accuracy_rate: number
}

interface WrongQuestion {
  question_number: number
  question_type: string
  question_content: string
  student_answer: string
  ai_feedback: string | null
  knowledge_point: string | null
}

const submission = ref<Submission | null>(null)
const answers = ref<Answer[]>([])
const statistics = ref<Statistics>({
  total_questions: 0, correct_count: 0, wrong_count: 0, needs_review_count: 0, accuracy_rate: 0
})
const wrongQuestions = ref<WrongQuestion[]>([])
const improvementSuggestions = ref<string[]>([])

const reviewForm = ref({ reason: '', questionIds: [] as number[] })

const canRequestReview = computed(() => {
  return submission.value?.status === 'graded' || submission.value?.status === 'reviewed'
})

async function fetchGradingResult() {
  loading.value = true
  try {
    const response = await request.get<{
      success?: boolean
      data?: {
        submission: Submission
        answers: Answer[]
        statistics: Statistics
        wrong_questions: WrongQuestion[]
        improvement_suggestions: string[]
      }
    }>(`/grading/${submissionId.value}`)

    if (response.success && response.data) {
      submission.value = response.data.submission
      answers.value = response.data.answers || []
      statistics.value = response.data.statistics || {
        total_questions: 0, correct_count: 0, wrong_count: 0, needs_review_count: 0, accuracy_rate: 0
      }
      wrongQuestions.value = response.data.wrong_questions || []
      improvementSuggestions.value = response.data.improvement_suggestions || []
    }
  } catch (error: any) {
    console.error('[批改结果] 获取失败:', error)
    ElMessage.error(error.response?.data?.message || '获取批改结果失败')
  } finally {
    loading.value = false
  }
}

async function handleRequestReview() {
  if (reviewForm.value.questionIds.length === 0) {
    ElMessage.warning('请选择需要复核的题目')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要申请复核选中的 ${reviewForm.value.questionIds.length} 道题目吗？`,
      '确认申请', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    submittingReview.value = true
    await request.post(`/grading/${submissionId.value}/request-review`, {
      question_ids: reviewForm.value.questionIds,
      reason: reviewForm.value.reason
    })
    ElMessage.success('复核申请已提交，请等待教师处理')
    reviewForm.value = { reason: '', questionIds: [] }
    await fetchGradingResult()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('[批改结果] 申请复核失败:', error)
      ElMessage.error(error.response?.data?.message || '申请复核失败')
    }
  } finally {
    submittingReview.value = false
  }
}

function goBack() { router.push('/student/results') }

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: '待批改', grading: '批改中', graded: '已批改', reviewed: '已复核'
  }
  return labels[status] || status
}

function getStatusType(status: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    submitted: 'warning', grading: 'info', graded: 'success', reviewed: ''
  }
  return types[status] || ''
}

function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    choice: '选择题', fill: '填空题', judge: '判断题', subjective: '主观题'
  }
  return labels[type] || type
}

function getQuestionTypeTag(type: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    choice: '', fill: 'info', judge: 'success', subjective: 'warning'
  }
  return types[type] || ''
}

function getScoreClass(): string {
  if (!submission.value) return ''
  const ratio = (submission.value.total_score ?? 0) / submission.value.max_score
  if (ratio >= 0.9) return 'excellent'
  if (ratio >= 0.6) return 'pass'
  return 'fail'
}

function getScorePercentage(): number {
  if (!submission.value || submission.value.max_score === 0) return 0
  return Math.round(((submission.value.total_score ?? 0) / submission.value.max_score) * 100)
}

function getProgressStatus(): '' | 'success' | 'warning' | 'exception' {
  const percentage = getScorePercentage()
  if (percentage >= 90) return 'success'
  if (percentage >= 60) return ''
  return 'exception'
}

onMounted(() => { fetchGradingResult() })
</script>


<style scoped>
.result-detail-page { min-height: 100%; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #333; flex: 1; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-stats { display: flex; gap: 8px; }
.info-card, .answers-card, .score-card, .wrong-questions-card, .suggestions-card, .review-request-card {
  margin-bottom: 20px;
}
.answer-item {
  background: #f5f7fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;
  border-left: 4px solid #67c23a;
}
.answer-item.wrong { border-left-color: #f56c6c; }
.answer-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.question-number { font-weight: bold; color: #409eff; }
.answer-score { margin-left: auto; font-weight: bold; }
.answer-score.correct { color: #67c23a; }
.answer-score.wrong { color: #f56c6c; }
.question-content, .student-answer, .standard-answer { margin-bottom: 8px; line-height: 1.6; }
.student-answer { display: flex; align-items: center; gap: 8px; }
.student-answer .correct { color: #67c23a; font-weight: 500; }
.student-answer .wrong { color: #f56c6c; font-weight: 500; }
.correct-icon { color: #67c23a; font-size: 18px; }
.wrong-icon { color: #f56c6c; font-size: 18px; }
.ai-feedback {
  display: flex; align-items: flex-start; gap: 8px; padding: 12px;
  background: #fdf6ec; border-radius: 4px; color: #e6a23c; margin-top: 8px;
}
.review-comment {
  display: flex; align-items: flex-start; gap: 8px; padding: 12px;
  background: #ecf5ff; border-radius: 4px; color: #409eff; margin-top: 8px;
}
.needs-review-tag { margin-top: 8px; }
.total-score { text-align: center; margin-bottom: 20px; }
.score-value { font-size: 48px; font-weight: bold; }
.score-value.excellent { color: #67c23a; }
.score-value.pass { color: #e6a23c; }
.score-value.fail { color: #f56c6c; }
.score-max { font-size: 24px; color: #999; }
.score-breakdown { margin-top: 20px; }
.breakdown-item {
  display: flex; justify-content: space-between; padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.breakdown-item:last-child { border-bottom: none; }
.breakdown-item .correct { color: #67c23a; font-weight: bold; }
.breakdown-item .wrong { color: #f56c6c; font-weight: bold; }
.wrong-question-item { padding: 12px; background: #fef0f0; border-radius: 4px; margin-bottom: 8px; }
.wq-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.wq-number { font-weight: bold; color: #f56c6c; }
.wq-content { color: #666; font-size: 13px; }
.suggestion-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; color: #409eff; }
.review-hint { color: #909399; font-size: 13px; margin-bottom: 16px; }
.already-review { color: #909399; font-size: 12px; }
</style>
