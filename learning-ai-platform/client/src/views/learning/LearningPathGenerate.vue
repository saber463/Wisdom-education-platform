<template>
  <div class="learning-path-generate min-h-screen">
    <div class="container mx-auto px-4 py-8 relative">
      <h2
        class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-center mb-6 bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink bg-clip-text text-transparent"
      >
        AI智能学习路径生成
      </h2>

      <MembershipStatusCard :membership-info="membershipInfo" />

      <LearningPathForm
        ref="formRef"
        :is-loading="isLoading"
        :is-form-valid="isFormValid"
        :is-at-limit="isAtLimit"
        @submit="handleGenerate"
      />

      <LearningPathDisplay
        v-if="learningPath"
        :learning-path="learningPath"
        :intensity="intensity"
      />

      <div
        v-if="errorMsg"
        class="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 text-red-600 dark:text-red-400 mb-8 animate-fadeIn backdrop-blur-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa fa-exclamation-circle" />
            <span>{{ errorMsg }}</span>
          </div>
          <router-link
            v-if="isAtLimit"
            to="/membership"
            class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            立即升级 <i class="fa fa-arrow-right ml-1" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { generateLearningPathByAi } from '@/hooks/useAiApi';
import { LearningPathLogger } from '@/utils/learningPathLogger';
import { useMembership } from '@/hooks/useMembership';
import { useLearningPathForm } from '@/hooks/useLearningPathForm';
import MembershipStatusCard from '@/components/business/MembershipStatusCard.vue';
import LearningPathForm from '@/components/business/LearningPathForm.vue';
import LearningPathDisplay from '@/components/business/LearningPathDisplay.vue';

const route = useRoute();
const formRef = ref(null);

const { membershipInfo, fetchMembershipInfo, isAtLimit } = useMembership();
const { isFormValid, isFormTouched } = useLearningPathForm();

const isLoading = ref(false);
const errorMsg = ref('');
const learningPath = ref(null);

const handleGenerate = async formData => {
  isFormTouched.value = true;
  if (!isFormValid.value) return;

  if (isAtLimit.value) {
    errorMsg.value = `您已达到今日生成次数上限（${membershipInfo.value.dailyGenerationLimit}次），升级会员可解锁更多次数`;
    return;
  }

  LearningPathLogger.logGenerateStart({
    goal: formData.goal,
    days: formData.days,
    intensity: formData.intensity,
  });

  isLoading.value = true;
  errorMsg.value = '';

  learningPath.value = {
    goal: formData.goal,
    totalDays: formData.days,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(formData.days, 'day').format('YYYY-MM-DD'),
    intensity: formData.intensity,
    stages: [],
    summary: '正在发起AI请求...',
    isStreaming: true,
    isCached: false,
  };

  try {
    const startTime = Date.now();

    const finalResult = await generateLearningPathByAi(
      formData.goal,
      formData.days,
      formData.intensity,
      progress => {
        learningPath.value = {
          ...learningPath.value,
          ...progress,
          intensity: formData.intensity,
          startDate: progress.startDate || dayjs().format('YYYY-MM-DD'),
          endDate: progress.endDate || dayjs().add(formData.days, 'day').format('YYYY-MM-DD'),
        };
      }
    );

    const endTime = Date.now();
    LearningPathLogger.logGenerateSuccess({
      goal: formData.goal,
      days: formData.days,
      stageCount: finalResult.stages?.length || 0,
      elapsedTime: endTime - startTime,
    });

    learningPath.value = {
      ...learningPath.value,
      ...finalResult,
      isStreaming: false,
      intensity: formData.intensity,
    };

    await fetchMembershipInfo();
  } catch (error) {
    LearningPathLogger.logGenerateError({
      goal: formData.goal,
      days: formData.days,
      error: error.message,
    });

    errorMsg.value = error.message;
    learningPath.value = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchMembershipInfo();

  const queryGoal = route.query.goal;
  const queryDays = route.query.days;

  if (queryGoal && formRef.value) {
    formRef.value.goal = queryGoal;
  }

  if (queryDays && formRef.value) {
    formRef.value.days = parseInt(queryDays);
  }
});
</script>

<style scoped>
.learning-path-generate {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

.learning-path-generate::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 242, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(114, 9, 183, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(247, 37, 133, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.v-enter-active,
.v-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-primary {
  background-color: #42b983;
  color: white;
}
</style>
