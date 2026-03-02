<template>
  <el-dialog
    v-model="visible"
    title="欢迎来到智慧教育学习平台"
    width="90%"
    :max-width="800"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    :before-close="handleBeforeClose"
    class="interest-survey-modal"
  >
    <template #header>
      <div class="modal-header">
        <h2 class="modal-title">完善您的学习档案</h2>
        <p class="modal-subtitle">只需几分钟，帮助我们为您推荐最合适的学习内容</p>
      </div>
    </template>

    <div class="survey-content">
      <SurveyProgress :current-step="currentStep" :total-steps="6" />
      
      <div class="step-container">
        <!-- Step 1: 学习目标 -->
        <SurveyStep1
          v-if="currentStep === 1"
          v-model="formData.learning_goal"
        />
        
        <!-- Step 2: 编程语言 -->
        <SurveyStep2
          v-if="currentStep === 2"
          v-model="formData.interested_languages"
        />
        
        <!-- Step 3: 技术方向 -->
        <SurveyStep3
          v-if="currentStep === 3"
          v-model="formData.interested_directions"
        />
        
        <!-- Step 4: 技能水平 -->
        <SurveyStep4
          v-if="currentStep === 4"
          v-model="formData.skill_level"
        />
        
        <!-- Step 5: 每周学习时间 -->
        <SurveyStep5
          v-if="currentStep === 5"
          v-model="formData.weekly_hours"
        />
        
        <!-- Step 6: 学习方式 -->
        <SurveyStep6
          v-if="currentStep === 6"
          v-model="formData.learning_style"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button
          v-if="currentStep > 1"
          @click="prevStep"
          :disabled="isSubmitting"
        >
          上一步
        </el-button>
        <div class="spacer"></div>
        <el-button
          v-if="currentStep < 6"
          type="primary"
          @click="nextStep"
          :disabled="!canProceed || isSubmitting"
        >
          下一步
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="submitSurvey"
          :loading="isSubmitting"
          :disabled="!canProceed"
        >
          完成
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import SurveyProgress from './SurveyProgress.vue'
import SurveyStep1 from './SurveyStep1.vue'
import SurveyStep2 from './SurveyStep2.vue'
import SurveyStep3 from './SurveyStep3.vue'
import SurveyStep4 from './SurveyStep4.vue'
import SurveyStep5 from './SurveyStep5.vue'
import SurveyStep6 from './SurveyStep6.vue'

interface Props {
  modelValue: boolean
}

interface SurveyFormData {
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project' | ''
  interested_languages: string[]
  interested_directions: string[]
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | ''
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20' | ''
  learning_style: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'completed': []
}>()

const router = useRouter()
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentStep = ref(1)
const isSubmitting = ref(false)

const formData = ref<SurveyFormData>({
  learning_goal: '',
  interested_languages: [],
  interested_directions: [],
  skill_level: '',
  weekly_hours: '',
  learning_style: []
})

// 验证当前步骤是否可以继续
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.learning_goal !== ''
    case 2:
      return formData.value.interested_languages.length > 0
    case 3:
      return formData.value.interested_directions.length > 0
    case 4:
      return formData.value.skill_level !== ''
    case 5:
      return formData.value.weekly_hours !== ''
    case 6:
      return formData.value.learning_style.length > 0
    default:
      return false
  }
})

// 阻止关闭弹窗
function handleBeforeClose(done: () => void) {
  ElMessage.warning('请完成问卷后才能继续使用')
  // 不调用done()，阻止关闭
}

function nextStep() {
  if (canProceed.value && currentStep.value < 6) {
    currentStep.value++
  } else {
    ElMessage.warning('请完成当前步骤')
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function submitSurvey() {
  if (!canProceed.value) {
    ElMessage.warning('请完成所有必填项')
    return
  }

  // 验证所有字段
  if (
    !formData.value.learning_goal ||
    formData.value.interested_languages.length === 0 ||
    formData.value.interested_directions.length === 0 ||
    !formData.value.skill_level ||
    !formData.value.weekly_hours ||
    formData.value.learning_style.length === 0
  ) {
    ElMessage.error('请完成所有必填项')
    return
  }

  isSubmitting.value = true
  try {
    const response = await request.post<{ success?: boolean; message?: string }>('/user-interests', {
      learning_goal: formData.value.learning_goal,
      interested_languages: formData.value.interested_languages,
      interested_directions: formData.value.interested_directions,
      skill_level: formData.value.skill_level,
      weekly_hours: formData.value.weekly_hours,
      learning_style: formData.value.learning_style
    })

    if (response.success) {
      ElMessage.success('问卷提交成功！')
      visible.value = false
      emit('completed')
      // 跳转到个性化推荐首页（学生端首页）
      router.push('/student/dashboard')
    } else {
      ElMessage.error(response.message || '提交失败，请重试')
    }
  } catch (error: any) {
    console.error('问卷提交失败:', error)
    ElMessage.error(error.response?.data?.message || '提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 重置表单
function resetForm() {
  currentStep.value = 1
  formData.value = {
    learning_goal: '',
    interested_languages: [],
    interested_directions: [],
    skill_level: '',
    weekly_hours: '',
    learning_style: []
  }
}

// 当弹窗关闭时重置表单
watch(visible, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})
</script>

<style scoped>
.interest-survey-modal :deep(.el-dialog) {
  border-radius: 12px;
}

.interest-survey-modal :deep(.el-dialog__header) {
  padding: 24px 24px 0;
}

.interest-survey-modal :deep(.el-dialog__body) {
  padding: 24px;
}

.interest-survey-modal :deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
}

.modal-header {
  text-align: center;
}

.modal-title {
  @apply text-2xl font-bold text-gray-800 mb-2;
}

.modal-subtitle {
  @apply text-gray-600;
}

.survey-content {
  @apply min-h-[400px];
}

.step-container {
  @apply mt-6;
}

.modal-footer {
  @apply flex items-center;
}

.spacer {
  @apply flex-1;
}
</style>

