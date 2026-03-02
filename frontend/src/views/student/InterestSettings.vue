<template>
  <StudentLayout>
    <template #content>
      <div class="interest-settings">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <h2>学习兴趣设置</h2>
              <p class="subtitle">修改您的学习兴趣，系统将重新为您推荐内容</p>
            </div>
          </template>

          <div class="settings-content">
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

            <div class="actions">
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
                @click="updateInterests"
                :loading="isSubmitting"
                :disabled="!canProceed"
              >
                保存设置
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'
import SurveyProgress from '@/components/SurveyProgress.vue'
import SurveyStep1 from '@/components/SurveyStep1.vue'
import SurveyStep2 from '@/components/SurveyStep2.vue'
import SurveyStep3 from '@/components/SurveyStep3.vue'
import SurveyStep4 from '@/components/SurveyStep4.vue'
import SurveyStep5 from '@/components/SurveyStep5.vue'
import SurveyStep6 from '@/components/SurveyStep6.vue'

interface SurveyFormData {
  learning_goal: 'employment' | 'hobby' | 'exam' | 'project' | ''
  interested_languages: string[]
  interested_directions: string[]
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | ''
  weekly_hours: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20' | ''
  learning_style: string[]
}

const router = useRouter()
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

// 加载现有兴趣数据
async function loadInterests() {
  try {
    const response = await request.get<{ success?: boolean; data?: { learning_goal?: string; interested_languages?: string[]; interested_directions?: string[]; skill_level?: string; weekly_hours?: string; learning_style?: string[] } }>('/user-interests/status')
    if (response.success && response.data) {
      formData.value = {
        learning_goal: (response.data.learning_goal || '') as "" | "employment" | "hobby" | "exam" | "project",
        interested_languages: response.data.interested_languages || [],
        interested_directions: response.data.interested_directions || [],
        skill_level: (response.data.skill_level || '') as "" | "beginner" | "intermediate" | "advanced" | "expert",
        weekly_hours: (response.data.weekly_hours || '') as "" | "less_5" | "hours_5_10" | "hours_10_20" | "more_20",
        learning_style: response.data.learning_style || []
      }
    }
  } catch (error) {
    console.error('加载兴趣数据失败:', error)
  }
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

async function updateInterests() {
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
    const response = await request.put<{ success?: boolean; message?: string }>('/user-interests', {
      learning_goal: formData.value.learning_goal,
      interested_languages: formData.value.interested_languages,
      interested_directions: formData.value.interested_directions,
      skill_level: formData.value.skill_level,
      weekly_hours: formData.value.weekly_hours,
      learning_style: formData.value.learning_style
    })

    if (response.success) {
      ElMessage.success('兴趣设置已更新！')
      router.push('/student/dashboard')
    } else {
      ElMessage.error(response.message || '更新失败，请重试')
    }
  } catch (error: any) {
    console.error('更新兴趣设置失败:', error)
    ElMessage.error(error.response?.data?.message || '更新失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadInterests()
})
</script>

<style scoped>
.interest-settings {
  @apply p-6;
}

.settings-card {
  @apply max-w-4xl mx-auto;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  @apply text-2xl font-bold text-gray-800 mb-2;
}

.subtitle {
  @apply text-gray-600;
}

.settings-content {
  @apply mt-6;
}

.step-container {
  @apply mt-6 min-h-[400px];
}

.actions {
  @apply flex items-center mt-8 pt-6 border-t border-gray-200;
}

.spacer {
  @apply flex-1;
}
</style>

