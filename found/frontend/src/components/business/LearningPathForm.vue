<template>
  <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 mb-8">
    <div class="space-y-4">
      <GoalInput v-model="goal" :quick-targets="quickTargets" @input="handleGoalInput" />

      <DaysInput v-model="days" :has-error="hasDaysError" />

      <IntensityInput v-model="intensity" />

      <button
        :disabled="isLoading || !isFormValid || isAtLimit"
        class="w-full btn-primary mt-4 py-2"
        @click="handleSubmit"
      >
        <i v-if="isLoading" class="fa fa-spinner fa-spin mr-2" />
        {{ isLoading ? '生成中...' : '生成学习路径' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import GoalInput from './GoalInput.vue';
import DaysInput from './DaysInput.vue';
import IntensityInput from './IntensityInput.vue';

defineProps({
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

const emit = defineEmits(['submit']);

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
