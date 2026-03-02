<template>
  <el-dialog
    v-model="visible"
    title="视频答题"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="video-quiz-modal"
  >
    <div class="quiz-content">
      <!-- 倒计时 -->
      <div class="countdown" v-if="countdown > 0">
        <div class="countdown-text">剩余时间：{{ countdown }}秒</div>
        <el-progress
          :percentage="(countdown / 60) * 100"
          :status="countdown <= 10 ? 'exception' : ''"
          :stroke-width="8"
        />
      </div>

      <!-- 题目内容 -->
      <div v-if="question" class="question-section">
        <h3 class="question-title">{{ question.question_content }}</h3>

        <!-- 单选题 -->
        <div v-if="question.question_type === 'single_choice'" class="options-list">
          <el-radio-group v-model="userAnswer">
            <el-radio
              v-for="(option, index) in question.options"
              :key="index"
              :label="option.value"
              class="option-item"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 多选题 -->
        <div v-if="question.question_type === 'multiple_choice'" class="options-list">
          <el-checkbox-group v-model="userAnswer">
            <el-checkbox
              v-for="(option, index) in question.options"
              :key="index"
              :label="option.value"
              class="option-item"
            >
              {{ option.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 填空题 -->
        <div v-if="question.question_type === 'fill_blank'" class="fill-blank">
          <el-input
            v-model="userAnswer"
            type="textarea"
            :rows="3"
            placeholder="请输入答案"
          />
        </div>
      </div>

      <!-- 答题结果显示 -->
      <div v-if="showResult" class="result-section">
        <div v-if="result" :class="['result-icon', result.is_correct ? 'correct' : 'wrong']">
          <el-icon v-if="result.is_correct" :size="64" color="#67c23a">
            <CircleCheckFilled />
          </el-icon>
          <el-icon v-else :size="64" color="#f56c6c">
            <CircleCloseFilled />
          </el-icon>
        </div>
        <h3 v-if="result" :class="['result-title', result.is_correct ? 'correct' : 'wrong']">
          {{ result.is_correct ? '回答正确！' : '回答错误' }}
        </h3>
        <p v-if="result && result.reward > 0" class="reward-text">
          获得 {{ result.reward }} 积分奖励
        </p>
        <div v-if="question.explanation" class="explanation">
          <h4>解析：</h4>
          <p>{{ question.explanation }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button
          v-if="!showResult"
          type="primary"
          @click="submitAnswer"
          :disabled="!canSubmit || isSubmitting"
          :loading="isSubmitting"
        >
          提交答案
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="closeModal"
        >
          继续学习
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import request, { type ApiResponse } from '@/utils/request'

interface Props {
  modelValue: boolean
  lessonId: number
  triggerTime: number
  question: any
}

interface Result {
  is_correct: boolean
  reward: number
  added_to_wrong_book: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': [result: Result]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const userAnswer = ref<string | string[]>(props.question?.question_type === 'multiple_choice' ? [] : '')
const countdown = ref(60)
const showResult = ref(false)
const isSubmitting = ref(false)
const result = ref<Result | null>(null)

let countdownTimer: number | null = null
const startTime = ref(Date.now())

const canSubmit = computed(() => {
  if (props.question?.question_type === 'multiple_choice') {
    return Array.isArray(userAnswer.value) && userAnswer.value.length > 0
  }
  return userAnswer.value !== '' && userAnswer.value !== null
})

function startCountdown() {
  countdown.value = 60
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      // 超时自动提交
      submitAnswer(true)
    }
  }, 1000)
}

async function submitAnswer(isTimeout = false) {
  if (!canSubmit.value && !isTimeout) {
    ElMessage.warning('请选择答案')
    return
  }

  isSubmitting.value = true

  try {
    const timeSpent = Math.floor((Date.now() - startTime.value) / 1000)
    
    // 如果是超时，提交空答案
    const answer = isTimeout ? '' : (
      Array.isArray(userAnswer.value) 
        ? userAnswer.value.join(',') 
        : userAnswer.value
    )

    const response = await request.post<ApiResponse<Result>>('/video-quiz/submit', {
      question_id: props.question.id,
      lesson_id: props.lessonId,
      user_answer: answer,
      trigger_time: props.triggerTime,
      time_spent: isTimeout ? 60 : timeSpent
    })

    if (response.code === 200 && response.data != null) {
      const data = response.data as Result
      result.value = data
      showResult.value = true
      
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }

      emit('submitted', data)
    } else {
      ElMessage.error(response.msg || '提交失败')
    }
  } catch (error: any) {
    console.error('提交答案失败:', error)
    ElMessage.error(error.response?.data?.msg || '提交失败')
  } finally {
    isSubmitting.value = false
  }
}

function closeModal() {
  visible.value = false
  showResult.value = false
  userAnswer.value = props.question?.question_type === 'multiple_choice' ? [] : ''
  result.value = null
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    startTime.value = Date.now()
    startCountdown()
  } else {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.video-quiz-modal :deep(.el-dialog__body) {
  padding: 24px;
}

.quiz-content {
  @apply min-h-[300px];
}

.countdown {
  @apply mb-6;
}

.countdown-text {
  @apply text-lg font-semibold text-gray-800 mb-2 text-center;
}

.question-section {
  @apply mb-6;
}

.question-title {
  @apply text-xl font-bold text-gray-800 mb-4;
}

.options-list {
  @apply space-y-3;
}

.option-item {
  @apply block p-3 border border-gray-200 rounded-lg hover:border-primary-400 cursor-pointer;
}

.fill-blank {
  @apply mt-4;
}

.result-section {
  @apply text-center py-8;
}

.result-icon {
  @apply mb-4;
}

.result-title {
  @apply text-2xl font-bold mb-4;
}

.result-title.correct {
  @apply text-success-500;
}

.result-title.wrong {
  @apply text-danger-500;
}

.reward-text {
  @apply text-lg text-primary-500 mb-4;
}

.explanation {
  @apply mt-6 text-left bg-gray-50 p-4 rounded-lg;
}

.explanation h4 {
  @apply font-semibold mb-2;
}

.modal-footer {
  @apply flex justify-end;
}
</style>

