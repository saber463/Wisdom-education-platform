<template>
  <StudentLayout>
    <div class="recommendations-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>练习推荐</h2>
        <p class="page-desc">
          根据您的薄弱知识点，为您推荐针对性练习题
        </p>
      </div>

      <!-- 加载状态 -->
      <el-skeleton
        v-if="loading"
        :rows="10"
        animated
      />

      <el-row
        v-else
        :gutter="20"
      >
        <!-- 左侧：薄弱知识点 -->
        <el-col :span="8">
          <el-card class="weak-points-card">
            <template #header>
              <div class="card-header">
                <span>薄弱知识点</span>
                <el-button
                  type="primary"
                  link
                  :loading="analyzing"
                  @click="refreshAnalysis"
                >
                  <el-icon><Refresh /></el-icon> 重新分析
                </el-button>
              </div>
            </template>

            <div v-if="weakPoints.length > 0">
              <div class="weak-point-summary">
                <el-tag type="danger">
                  薄弱 {{ summary.weak }}
                </el-tag>
                <el-tag type="warning">
                  进步中 {{ summary.improving }}
                </el-tag>
                <el-tag type="success">
                  已掌握 {{ summary.mastered }}
                </el-tag>
              </div>

              <div
                v-for="wp in weakPoints"
                :key="wp.knowledge_point_id"
                class="weak-point-item"
                :class="getWeakPointClass(wp.status)"
              >
                <div class="wp-header">
                  <span class="wp-name">{{ wp.knowledge_point_name }}</span>
                  <el-tag
                    :type="getStatusType(wp.status)"
                    size="small"
                  >
                    {{ getStatusLabel(wp.status) }}
                  </el-tag>
                </div>
                <div class="wp-info">
                  <span class="wp-subject">{{ wp.subject }}</span>
                  <span
                    class="wp-rate"
                    :class="{ 'high-rate': wp.error_rate >= 50 }"
                  >
                    错误率: {{ wp.error_rate }}%
                  </span>
                </div>
                <el-progress
                  :percentage="100 - wp.error_rate"
                  :status="getProgressStatus(wp.error_rate)"
                  :stroke-width="6"
                />
              </div>
            </div>
            <el-empty
              v-else
              description="暂无薄弱知识点，继续保持！"
              :image-size="80"
            />
          </el-card>
        </el-col>

        <!-- 右侧：推荐练习 -->
        <el-col :span="16">
          <el-card class="exercises-card">
            <template #header>
              <div class="card-header">
                <span>推荐练习题 ({{ exercises.length }})</span>
                <el-button
                  type="primary"
                  :loading="loadingExercises"
                  @click="fetchRecommendations"
                >
                  <el-icon><Refresh /></el-icon> 刷新推荐
                </el-button>
              </div>
            </template>

            <div v-if="exercises.length > 0">
              <!-- 练习模式切换 -->
              <div class="practice-mode">
                <el-radio-group
                  v-model="practiceMode"
                  size="small"
                >
                  <el-radio-button label="view">
                    查看模式
                  </el-radio-button>
                  <el-radio-button label="practice">
                    练习模式
                  </el-radio-button>
                </el-radio-group>
              </div>

              <!-- 练习题列表 -->
              <div
                v-for="(exercise, index) in exercises"
                :key="exercise.id"
                class="exercise-item"
              >
                <div class="exercise-header">
                  <span class="exercise-number">第 {{ index + 1 }} 题</span>
                  <el-tag
                    :type="getDifficultyType(exercise.difficulty)"
                    size="small"
                  >
                    {{ getDifficultyLabel(exercise.difficulty) }}
                  </el-tag>
                  <el-tag
                    type="info"
                    size="small"
                  >
                    {{ exercise.knowledge_point_name }}
                  </el-tag>
                </div>

                <div class="exercise-title">
                  {{ exercise.title }}
                </div>
                <div class="exercise-content">
                  {{ exercise.content }}
                </div>

                <!-- 练习模式：显示答题输入框 -->
                <div
                  v-if="practiceMode === 'practice'"
                  class="answer-input"
                >
                  <el-input
                    v-model="userAnswers[exercise.id]"
                    placeholder="请输入您的答案"
                    :disabled="submitted"
                  />
                </div>

                <!-- 提交后显示结果 -->
                <div
                  v-if="submitted && gradingResults[exercise.id]"
                  class="grading-result"
                  :class="gradingResults[exercise.id].is_correct ? 'correct' : 'wrong'"
                >
                  <div class="result-header">
                    <el-icon v-if="gradingResults[exercise.id].is_correct">
                      <CircleCheck />
                    </el-icon>
                    <el-icon v-else>
                      <CircleClose />
                    </el-icon>
                    <span>{{ gradingResults[exercise.id].is_correct ? '回答正确' : '回答错误' }}</span>
                  </div>
                  <div class="result-detail">
                    <p><strong>您的答案：</strong>{{ gradingResults[exercise.id].student_answer || '未作答' }}</p>
                    <p><strong>标准答案：</strong>{{ gradingResults[exercise.id].standard_answer }}</p>
                    <p v-if="gradingResults[exercise.id].explanation">
                      <strong>解析：</strong>{{ gradingResults[exercise.id].explanation }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 提交按钮 -->
              <div
                v-if="practiceMode === 'practice'"
                class="submit-section"
              >
                <el-button
                  v-if="!submitted"
                  type="primary"
                  size="large"
                  :loading="submitting"
                  :disabled="!hasAnswers"
                  @click="submitPractice"
                >
                  提交练习
                </el-button>
                <div
                  v-else
                  class="practice-summary"
                >
                  <el-result
                    :icon="practiceSummary.accuracy >= 60 ? 'success' : 'warning'"
                    :title="`正确率: ${practiceSummary.accuracy}%`"
                    :sub-title="`共${practiceSummary.total_questions}题，正确${practiceSummary.correct_count}题`"
                  >
                    <template #extra>
                      <el-button
                        type="primary"
                        @click="resetPractice"
                      >
                        继续练习
                      </el-button>
                    </template>
                  </el-result>
                </div>
              </div>
            </div>
            <el-empty
              v-else
              description="暂无推荐练习题"
              :image-size="100"
            >
              <el-button
                type="primary"
                @click="refreshAnalysis"
              >
                分析薄弱点
              </el-button>
            </el-empty>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生练习推荐页面
 * 显示薄弱知识点列表、推荐练习题、实现练习提交和批改
 * 需求：6.3
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const studentId = computed(() => userStore.userInfo?.id)

const loading = ref(true)
const analyzing = ref(false)
const loadingExercises = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const practiceMode = ref<'view' | 'practice'>('view')

interface WeakPoint {
  knowledge_point_id: number
  knowledge_point_name: string
  subject: string
  error_rate: number
  status: 'weak' | 'improving' | 'mastered'
}

interface Exercise {
  id: number
  title: string
  content: string
  difficulty: 'basic' | 'medium' | 'advanced'
  knowledge_point_id: number
  knowledge_point_name: string
}

interface GradingResult {
  exercise_id: number
  student_answer: string
  standard_answer: string
  is_correct: boolean
  explanation: string
}

interface PracticeSummary {
  total_questions: number
  correct_count: number
  incorrect_count: number
  accuracy: number
}

const weakPoints = ref<WeakPoint[]>([])
const exercises = ref<Exercise[]>([])
const summary = ref({ total: 0, weak: 0, improving: 0, mastered: 0 })
const userAnswers = ref<Record<number, string>>({})
const gradingResults = ref<Record<number, GradingResult>>({})
const practiceSummary = ref<PracticeSummary>({ total_questions: 0, correct_count: 0, incorrect_count: 0, accuracy: 0 })

const hasAnswers = computed(() => Object.values(userAnswers.value).some(a => a && a.trim()))

async function fetchWeakPoints() {
  if (!studentId.value) return
  try {
    const response = await request.get<{
      success?: boolean
      data?: { weak_points: WeakPoint[]; summary: typeof summary.value }
    }>(`/recommendations/${studentId.value}/weak-points`)
    if (response.success && response.data) {
      weakPoints.value = response.data.weak_points.filter((wp: WeakPoint) => wp.status === 'weak' || wp.status === 'improving')
      summary.value = response.data.summary
    }
  } catch (error: unknown) {
    console.error('[练习推荐] 获取薄弱点失败:', error)
  }
}

async function fetchRecommendations() {
  if (!studentId.value) return
  loadingExercises.value = true
  try {
    const response = await request.get<{
      success?: boolean
      data?: { weak_points: WeakPoint[]; recommended_exercises: Exercise[] }
    }>(`/recommendations/${studentId.value}`)
    if (response.success && response.data) {
      weakPoints.value = response.data.weak_points
      exercises.value = response.data.recommended_exercises
    }
  } catch (error: unknown) {
    console.error('[练习推荐] 获取推荐失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '获取推荐失败')
  } finally {
    loadingExercises.value = false
  }
}

async function refreshAnalysis() {
  if (!studentId.value) return
  analyzing.value = true
  try {
    await request.post(`/recommendations/analyze/${studentId.value}`)
    ElMessage.success('薄弱点分析完成')
    await fetchRecommendations()
  } catch (error: unknown) {
    console.error('[练习推荐] 分析失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '分析失败')
  } finally {
    analyzing.value = false
  }
}

async function submitPractice() {
  if (!studentId.value || !hasAnswers.value) return
  submitting.value = true
  try {
    const answers = exercises.value.map(ex => ({
      exercise_id: ex.id,
      answer: userAnswers.value[ex.id] || ''
    }))
    const response = await request.post<{
      success?: boolean
      data?: { grading_results: GradingResult[]; summary: PracticeSummary }
    }>(`/recommendations/${studentId.value}/practice`, { answers })
    if (response.success && response.data) {
      response.data.grading_results.forEach(r => {
        gradingResults.value[r.exercise_id] = r
      })
      practiceSummary.value = response.data.summary
      submitted.value = true
      ElMessage.success('练习提交成功')
      await fetchWeakPoints()
    }
  } catch (error: unknown) {
    console.error('[练习推荐] 提交失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '提交失败')
  } finally {
    submitting.value = false
  }
}

function resetPractice() {
  userAnswers.value = {}
  gradingResults.value = {}
  submitted.value = false
  practiceSummary.value = { total_questions: 0, correct_count: 0, incorrect_count: 0, accuracy: 0 }
  fetchRecommendations()
}

function getWeakPointClass(status: string): string {
  return status === 'weak' ? 'weak' : status === 'improving' ? 'improving' : 'mastered'
}

function getStatusType(status: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    weak: 'danger', improving: 'warning', mastered: 'success'
  }
  return types[status] || ''
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = { weak: '薄弱', improving: '进步中', mastered: '已掌握' }
  return labels[status] || status
}

function getProgressStatus(errorRate: number): '' | 'success' | 'warning' | 'exception' {
  if (errorRate < 30) return 'success'
  if (errorRate < 50) return 'warning'
  return 'exception'
}

function getDifficultyType(difficulty: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    basic: 'success', medium: 'warning', advanced: 'danger'
  }
  return types[difficulty] || ''
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = { basic: '基础', medium: '中等', advanced: '提高' }
  return labels[difficulty] || difficulty
}

onMounted(async () => {
  loading.value = true
  await fetchWeakPoints()
  await fetchRecommendations()
  loading.value = false
})
</script>

<style scoped>
.recommendations-page { min-height: 100%; }
.page-header { margin-bottom: 20px; }
.page-header h2 { margin: 0 0 8px 0; font-size: 20px; color: #F0F0F0; }
.page-desc { margin: 0; color: #909399; font-size: 14px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.weak-points-card, .exercises-card { margin-bottom: 20px; }
.weak-point-summary { display: flex; gap: 8px; margin-bottom: 16px; }
.weak-point-item { padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #2a2a2a; }
.weak-point-item.weak { border-left: 4px solid #FF4B6E; }
.weak-point-item.improving { border-left: 4px solid #e6a23c; }
.weak-point-item.mastered { border-left: 4px solid #00FF94; }
.wp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.wp-name { font-weight: 500; color: #F0F0F0; }
.wp-info { display: flex; justify-content: space-between; font-size: 13px; color: #909399; margin-bottom: 8px; }
.wp-rate.high-rate { color: #FF4B6E; font-weight: 500; }
.practice-mode { margin-bottom: 16px; }
.exercise-item { padding: 16px; border: 1px solid #ebeef5; border-radius: 8px; margin-bottom: 16px; }
.exercise-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.exercise-number { font-weight: bold; color: #00FF94; }
.exercise-title { font-weight: 500; margin-bottom: 8px; }
.exercise-content { color: #666; line-height: 1.6; margin-bottom: 12px; }
.answer-input { margin-top: 12px; }
.grading-result { margin-top: 12px; padding: 12px; border-radius: 8px; }
.grading-result.correct { background: rgba(0,255,148,0.05); border: 1px solid rgba(0,255,148,0.3); }
.grading-result.wrong { background: rgba(255,75,110,0.05); border: 1px solid rgba(255,75,110,0.3); }
.result-header { display: flex; align-items: center; gap: 8px; font-weight: 500; margin-bottom: 8px; }
.grading-result.correct .result-header { color: #00FF94; }
.grading-result.wrong .result-header { color: #FF4B6E; }
.result-detail p { margin: 4px 0; font-size: 14px; }
.submit-section { text-align: center; padding: 20px; }
.practice-summary { padding: 20px; }
</style>
