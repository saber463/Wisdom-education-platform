<template>
  <StudentLayout>
    <div class="assignment-submit-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <el-button
          :icon="ArrowLeft"
          @click="goBack"
        >
          返回
        </el-button>
        <h2>提交作业</h2>
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
              <el-tag :type="getDifficultyType(assignment.difficulty)">
                {{ getDifficultyLabel(assignment.difficulty) }}
              </el-tag>
            </div>
          </template>
          
          <el-descriptions
            :column="2"
            border
          >
            <el-descriptions-item label="班级">
              {{ assignment.class_name }}
            </el-descriptions-item>
            <el-descriptions-item label="总分">
              {{ assignment.total_score }}分
            </el-descriptions-item>
            <el-descriptions-item label="截止时间">
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
            <el-descriptions-item label="题目数量">
              {{ questions.length }}题
            </el-descriptions-item>
          </el-descriptions>
          
          <div
            v-if="assignment.description"
            class="description"
          >
            <strong>作业说明：</strong>{{ assignment.description }}
          </div>
        </el-card>

        <!-- 文件上传区域 -->
        <el-card class="upload-card">
          <template #header>
            <div class="card-header">
              <span>上传作业文件（可选）</span>
            </div>
          </template>
          
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :action="uploadUrl"
            :headers="uploadHeaders"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :limit="1"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          >
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 JPG/PNG/PDF/Word 格式，文件大小不超过 20MB
              </div>
            </template>
          </el-upload>
          
          <div
            v-if="uploadedFileUrl"
            class="uploaded-file"
          >
            <el-tag
              type="success"
              closable
              @close="removeUploadedFile"
            >
              <el-icon><Document /></el-icon>
              已上传文件
            </el-tag>
          </div>
        </el-card>

        <!-- 答题区域 -->
        <el-card class="questions-card">
          <template #header>
            <div class="card-header">
              <span>答题区域</span>
              <div class="progress-info">
                已完成：{{ answeredCount }} / {{ questions.length }}
              </div>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="answerForm"
            label-position="top"
          >
            <div
              v-for="question in questions"
              :key="question.id"
              class="question-item"
              :class="{ 'answered': isQuestionAnswered(question.id) }"
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
              </div>
              
              <div class="question-content">
                {{ question.question_content }}
              </div>

              <!-- 选择题 -->
              <template v-if="question.question_type === 'choice'">
                <el-radio-group
                  v-model="answerForm.answers[question.id]"
                  class="choice-options"
                >
                  <el-radio label="A">
                    A
                  </el-radio>
                  <el-radio label="B">
                    B
                  </el-radio>
                  <el-radio label="C">
                    C
                  </el-radio>
                  <el-radio label="D">
                    D
                  </el-radio>
                </el-radio-group>
              </template>

              <!-- 判断题 -->
              <template v-else-if="question.question_type === 'judge'">
                <el-radio-group
                  v-model="answerForm.answers[question.id]"
                  class="judge-options"
                >
                  <el-radio label="对">
                    对
                  </el-radio>
                  <el-radio label="错">
                    错
                  </el-radio>
                </el-radio-group>
              </template>

              <!-- 填空题/主观题 -->
              <template v-else>
                <el-input
                  v-model="answerForm.answers[question.id]"
                  :type="question.question_type === 'subjective' ? 'textarea' : 'text'"
                  :rows="question.question_type === 'subjective' ? 4 : 1"
                  :placeholder="question.question_type === 'subjective' ? '请输入您的答案...' : '请输入答案'"
                  :maxlength="question.question_type === 'subjective' ? 2000 : 200"
                  show-word-limit
                />
              </template>

              <!-- WASM实时批改提示（仅客观题） -->
              <div
                v-if="isObjectiveType(question.question_type) && isQuestionAnswered(question.id)"
                class="wasm-hint"
              >
                <el-icon><Lightning /></el-icon>
                <span>客观题将使用WASM模块进行高速批改</span>
              </div>
            </div>
          </el-form>
        </el-card>

        <!-- 提交按钮 -->
        <div class="submit-actions">
          <el-button @click="goBack">
            取消
          </el-button>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            :disabled="isExpired || answeredCount === 0"
            @click="handleSubmit"
          >
            <el-icon v-if="!submitting">
              <Upload />
            </el-icon>
            {{ submitting ? '提交中...' : '提交作业' }}
          </el-button>
        </div>
      </template>

      <!-- 作业不存在 -->
      <el-empty
        v-else
        description="作业不存在或已关闭"
      />

      <!-- 批改结果弹窗 -->
      <el-dialog
        v-model="showResultDialog"
        title="批改结果"
        width="600px"
        :close-on-click-modal="false"
      >
        <div
          v-if="gradingResult"
          class="grading-result"
        >
          <div class="result-score">
            <div
              class="score-circle"
              :class="getScoreClass(gradingResult.total_score, gradingResult.max_score)"
            >
              <span class="score-value">{{ gradingResult.total_score }}</span>
              <span class="score-max">/ {{ gradingResult.max_score }}</span>
            </div>
          </div>

          <el-divider />

          <div class="result-summary">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic
                  title="正确题数"
                  :value="correctCount"
                />
              </el-col>
              <el-col :span="8">
                <el-statistic
                  title="错误题数"
                  :value="wrongCount"
                />
              </el-col>
              <el-col :span="8">
                <el-statistic
                  title="正确率"
                  :value="accuracyRate"
                  suffix="%"
                />
              </el-col>
            </el-row>
          </div>

          <el-divider />

          <div
            v-if="gradingResult.needs_review"
            class="review-notice"
          >
            <el-alert
              title="部分题目待人工复核"
              type="warning"
              description="您的作业中有部分主观题需要教师人工复核，最终成绩可能会有调整。"
              show-icon
              :closable="false"
            />
          </div>
        </div>

        <template #footer>
          <el-button @click="showResultDialog = false">
            关闭
          </el-button>
          <el-button
            type="primary"
            @click="viewDetailResult"
          >
            查看详细结果
          </el-button>
        </template>
      </el-dialog>
    </div>
  </StudentLayout>
</template>


<script setup lang="ts">
/**
 * 学生作业提交页面
 * 
 * 功能：
 * - 显示待完成作业列表和截止时间倒计时
 * - 实现文件上传（拍照/扫描）
 * - 调用WASM模块进行客观题批改
 * - 提交作业到后端
 * 
 * 需求：5.1, 5.2, 5.3
 */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, UploadFilled, Document, Lightning, Upload } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'
import { initWasm, compareAnswers, getWasmStatus, WasmStatus } from '@/utils/wasm-loader'

const route = useRoute()
const router = useRouter()

// 作业ID
const assignmentId = computed(() => parseInt(route.params.id as string))

// 加载状态
const loading = ref(true)
const submitting = ref(false)

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
  standard_answer: string | null
  score: number
  knowledge_point_id: number | null
  knowledge_point_name: string | null
}

const assignment = ref<Assignment | null>(null)
const questions = ref<Question[]>([])

// 答题表单
const answerForm = reactive<{
  answers: Record<number, string>
}>({
  answers: {}
})

// 文件上传
const uploadRef = ref()
const uploadedFileUrl = ref<string | null>(null)
const uploadUrl = '/api/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('edu_token')}`
}))

// 倒计时
const countdown = ref('')
let countdownTimer: number | null = null

// 批改结果
const showResultDialog = ref(false)
interface GradingResult {
  submission_id: number
  total_score: number
  max_score: number
  grading_results: Array<{
    question_id: number
    question_number: number
    question_type: string
    score: number
    max_score: number
    is_correct: boolean
    ai_feedback: string
    needs_review: boolean
  }>
  needs_review: boolean
}
const gradingResult = ref<GradingResult | null>(null)

// 计算属性
const isExpired = computed(() => {
  if (!assignment.value) return true
  return new Date(assignment.value.deadline) < new Date()
})

const answeredCount = computed(() => {
  return Object.values(answerForm.answers).filter(a => a && a.trim() !== '').length
})

const correctCount = computed(() => {
  if (!gradingResult.value) return 0
  return gradingResult.value.grading_results.filter(r => r.is_correct).length
})

const wrongCount = computed(() => {
  if (!gradingResult.value) return 0
  return gradingResult.value.grading_results.filter(r => !r.is_correct).length
})

const accuracyRate = computed(() => {
  if (!gradingResult.value || gradingResult.value.grading_results.length === 0) return 0
  return Math.round((correctCount.value / gradingResult.value.grading_results.length) * 100)
})

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
      
      // 初始化答题表单
      questions.value.forEach(q => {
        answerForm.answers[q.id] = ''
      })
      
      // 启动倒计时
      updateCountdown()
      startCountdownTimer()
    }
  } catch (error) {
    console.error('[作业提交] 获取作业详情失败:', error)
    ElMessage.error('获取作业详情失败')
  } finally {
    loading.value = false
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
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  if (days > 0) {
    countdown.value = `剩余 ${days}天${hours}小时${minutes}分钟`
  } else if (hours > 0) {
    countdown.value = `剩余 ${hours}小时${minutes}分钟${seconds}秒`
  } else {
    countdown.value = `剩余 ${minutes}分钟${seconds}秒`
  }
}

// 启动倒计时定时器
function startCountdownTimer() {
  countdownTimer = window.setInterval(updateCountdown, 1000)
}

// 返回上一页
function goBack() {
  router.back()
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

// 判断是否为客观题
function isObjectiveType(type: string): boolean {
  return ['choice', 'fill', 'judge'].includes(type)
}

// 判断题目是否已作答
function isQuestionAnswered(questionId: number): boolean {
  const answer = answerForm.answers[questionId]
  return answer !== undefined && answer !== null && answer.trim() !== ''
}

// 获取分数样式类
function getScoreClass(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 85) return 'score-excellent'
  if (percentage >= 60) return 'score-pass'
  return 'score-fail'
}

// 文件上传前验证
function beforeUpload(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG/PNG/PDF/Word 格式的文件')
    return false
  }
  
  const maxSize = 20 * 1024 * 1024 // 20MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 20MB')
    return false
  }
  
  return true
}

// 文件上传成功
function handleUploadSuccess(response: { success?: boolean; data?: { url?: string }; message?: string }) {
  if (response.success && response.data?.url) {
    uploadedFileUrl.value = response.data.url
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(response.message || '文件上传失败')
  }
}

// 文件上传失败
function handleUploadError(error: unknown) {
  console.error('[作业提交] 文件上传失败:', error)
  ElMessage.error('文件上传失败，请重试')
}

// 移除已上传文件
function removeUploadedFile() {
  uploadedFileUrl.value = null
  uploadRef.value?.clearFiles()
}

// 提交作业
async function handleSubmit() {
  // 验证是否已截止
  if (isExpired.value) {
    ElMessage.error('作业已截止，无法提交')
    return
  }
  
  // 验证是否有答案
  if (answeredCount.value === 0) {
    ElMessage.warning('请至少回答一道题目')
    return
  }
  
  // 确认提交
  try {
    await ElMessageBox.confirm(
      `您已完成 ${answeredCount.value}/${questions.value.length} 道题目，确定要提交吗？`,
      '确认提交',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '继续答题',
        type: 'warning'
      }
    )
  } catch {
    return // 用户取消
  }
  
  submitting.value = true
  
  try {
    // 初始化WASM模块（用于客观题批改）
    console.log('[作业提交] 初始化WASM模块...')
    await initWasm()
    const wasmStatus = getWasmStatus()
    console.log(`[作业提交] WASM状态: ${wasmStatus}`)
    
    // 构建答案数组
    const answersArray = Object.entries(answerForm.answers)
      .filter(([_, answer]) => answer && answer.trim() !== '')
      .map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        student_answer: answer.trim()
      }))
    
    // 客观题前端预批改（使用WASM）
    if (wasmStatus === WasmStatus.LOADED) {
      console.log('[作业提交] 使用WASM进行客观题预批改...')
      const startTime = performance.now()
      
      for (const answer of answersArray) {
        const question = questions.value.find(q => q.id === answer.question_id)
        if (question && isObjectiveType(question.question_type) && question.standard_answer) {
          const isCorrect = compareAnswers(answer.student_answer, question.standard_answer)
          console.log(`[WASM批改] 题目${question.question_number}: ${isCorrect ? '正确' : '错误'}`)
        }
      }
      
      const endTime = performance.now()
      console.log(`[作业提交] WASM预批改完成，耗时: ${(endTime - startTime).toFixed(2)}ms`)
    }
    
    // 提交到后端
    const response = await request.post<{
      success?: boolean
      message?: string
      data?: GradingResult
    }>('/grading/submit', {
      assignment_id: assignmentId.value,
      answers: answersArray,
      file_url: uploadedFileUrl.value
    })
    
    if (response.success && response.data) {
      gradingResult.value = response.data
      showResultDialog.value = true
      ElMessage.success('作业提交成功！')
    } else {
      ElMessage.error(response.message || '提交失败')
    }
  } catch (error: unknown) {
    console.error('[作业提交] 提交失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 查看详细结果
function viewDetailResult() {
  if (gradingResult.value) {
    router.push(`/student/results/${gradingResult.value.submission_id}`)
  }
}

// 初始化
onMounted(async () => {
  await fetchAssignment()
  
  // 预加载WASM模块
  try {
    await initWasm()
    console.log('[作业提交] WASM模块预加载完成')
  } catch (error) {
    console.warn('[作业提交] WASM模块预加载失败，将使用JavaScript回退')
  }
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>


<style scoped>
.assignment-submit-page {
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

.upload-card {
  margin-bottom: 20px;
}

.upload-area {
  width: 100%;
}

.uploaded-file {
  margin-top: 12px;
}

.questions-card {
  margin-bottom: 20px;
}

.progress-info {
  font-size: 14px;
  color: #909399;
}

.question-item {
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
}

.question-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.question-item.answered {
  border-color: #00FF94;
  background: #f0f9eb;
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

.question-content {
  margin-bottom: 16px;
  line-height: 1.6;
  color: #F0F0F0;
}

.choice-options,
.judge-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.wasm-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: #FFB700;
}

.submit-actions {
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

/* 批改结果弹窗样式 */
.grading-result {
  text-align: center;
}

.result-score {
  padding: 20px 0;
}

.score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.score-circle.score-excellent {
  background: linear-gradient(135deg, #00FF94 0%, #00BB66 100%);
}

.score-circle.score-pass {
  background: linear-gradient(135deg, #e6a23c 0%, #f5c942 100%);
}

.score-circle.score-fail {
  background: linear-gradient(135deg, #FF4B6E 0%, #CC2244 100%);
}

.score-value {
  font-size: 36px;
  font-weight: bold;
}

.score-max {
  font-size: 14px;
  opacity: 0.8;
}

.result-summary {
  padding: 20px 0;
}

.review-notice {
  margin-top: 16px;
}
</style>
