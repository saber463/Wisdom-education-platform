<template>
  <div class="max-w-2xl mx-auto bg-gray-800/80 rounded-xl shadow-lg p-6 mb-8 border border-gray-700">
    <div class="space-y-4">
      <GoalInput v-model="goal" :quick-targets="quickTargets" @input="handleGoalInput" />

      <DaysInput v-model="days" :has-error="hasDaysError" />

      <IntensityInput v-model="intensity" />

      <button
        :disabled="isLoading || !localIsFormValid || isAtLimit"
        class="w-full bg-gradient-to-r from-tech-blue to-tech-purple text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        @click="handleSubmit"
      >
        <i v-if="isLoading" class="fa fa-spinner fa-spin mr-2" />
        {{ isLoading ? '生成中...' : '生成学习路径' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import GoalInput from './GoalInput.vue';
import DaysInput from './DaysInput.vue';
import IntensityInput from './IntensityInput.vue';

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  isFormValid: {
    type: Boolean,
    default: false,
  },
  isAtLimit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'update:formState']);

const goal = ref('');
const days = ref(30);
const intensity = ref('medium');

const quickTargets = ref([
  '30天通过计算机一级考试',
  '1个月通过英语四级',
  '2个月通过英语六级',
  '3个月拿下教师资格证',
  '2个月通过初级会计',
  '3个月学习Python编程',
  '1个月学习前端开发',
  '2个月学习UI设计',
  '1个月通过普通话二甲',
]);

const hasDaysError = computed(() => {
  return (
    !goal.value.includes('30天') &&
    !goal.value.includes('20天通过计算机一级') &&
    (days.value < 1 || days.value > 180 || isNaN(days.value))
  );
});

// 本地计算表单验证状态
const localIsFormValid = computed(() => {
  const g = goal.value;
  const d = days.value;

  const basicValid =
    g.trim() !== '' &&
    Number.isInteger(d) &&
    d >= 1 &&
    d <= 180;
  const thirtyDaysValid = !g.includes('30天') || d >= 30;
  const computerLevelOneValid = !g.includes('20天通过计算机一级');

  return basicValid && thirtyDaysValid && computerLevelOneValid;
});

// 监听表单变化，同步到父组件
watch([goal, days, intensity], () => {
  emit('update:formState', {
    goal: goal.value,
    days: days.value,
    intensity: intensity.value,
  });
}, { immediate: true });

const handleGoalInput = () => {
  if (goal.value) {
    emit('goal-change', goal.value);
  }
};

const handleSubmit = () => {
  emit('submit', {
    goal: goal.value.trim(),
    days: days.value,
    intensity: intensity.value,
  });
};

defineExpose({
  goal,
  days,
  intensity,
});
</script>
