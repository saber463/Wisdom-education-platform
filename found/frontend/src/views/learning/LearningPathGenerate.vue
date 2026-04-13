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
      <!-- 热门路径模板 -->
      <div class="mt-12 mb-4">
        <h3 class="text-xl font-bold text-white mb-6 text-center">🔥 热门学习路径模板</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="tmpl in pathTemplates"
            :key="tmpl.id"
            class="rounded-xl overflow-hidden border border-white/10 hover:border-tech-blue/50 transition-all hover:scale-105 cursor-pointer bg-white/5 backdrop-blur-sm"
          >
            <img :src="tmpl.cover" :alt="tmpl.title" class="w-full h-28 object-cover" />
            <div class="p-3">
              <div class="text-sm font-semibold text-white mb-1 line-clamp-2">{{ tmpl.title }}</div>
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span>📅 {{ tmpl.days }}天</span>
                <span class="ml-auto" :class="tmpl.difficulty === '困难' ? 'text-red-400' : tmpl.difficulty === '中等' ? 'text-yellow-400' : 'text-green-400'">{{ tmpl.difficulty }}</span>
              </div>
              <div class="flex flex-wrap gap-1 mt-2">
                <span v-for="tag in tmpl.tags" :key="tag" class="text-xs bg-tech-blue/10 text-tech-blue px-1.5 py-0.5 rounded">{{ tag }}</span>
              </div>
            </div>
          </div>
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

// 热门路径模板 mock数据
const pathTemplates = ref([
  { id: 1, title: '30天JavaScript零基础入门', days: 30, difficulty: '简单', tags: ['JS', '前端'], cover: 'https://picsum.photos/seed/pt1/280/160' },
  { id: 2, title: '45天Python数据分析实战', days: 45, difficulty: '中等', tags: ['Python', 'Pandas'], cover: 'https://picsum.photos/seed/pt2/280/160' },
  { id: 3, title: '60天Vue3全栈开发', days: 60, difficulty: '中等', tags: ['Vue3', 'Node.js'], cover: 'https://picsum.photos/seed/pt3/280/160' },
  { id: 4, title: '90天Java后端架构师', days: 90, difficulty: '困难', tags: ['Java', 'Spring'], cover: 'https://picsum.photos/seed/pt4/280/160' },
  { id: 5, title: '21天英语四级速通', days: 21, difficulty: '简单', tags: ['英语', '四级'], cover: 'https://picsum.photos/seed/pt5/280/160' },
  { id: 6, title: '60天算法与数据结构', days: 60, difficulty: '困难', tags: ['算法', 'LeetCode'], cover: 'https://picsum.photos/seed/pt6/280/160' },
  { id: 7, title: '30天React从入门到项目', days: 30, difficulty: '中等', tags: ['React', 'TypeScript'], cover: 'https://picsum.photos/seed/pt7/280/160' },
  { id: 8, title: '45天机器学习入门', days: 45, difficulty: '困难', tags: ['ML', 'Python'], cover: 'https://picsum.photos/seed/pt8/280/160' },
  { id: 9, title: '14天Docker/K8s容器化', days: 14, difficulty: '中等', tags: ['Docker', 'DevOps'], cover: 'https://picsum.photos/seed/pt9/280/160' },
  { id: 10, title: '30天Go语言并发编程', days: 30, difficulty: '中等', tags: ['Go', '并发'], cover: 'https://picsum.photos/seed/pt10/280/160' },
]);

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
