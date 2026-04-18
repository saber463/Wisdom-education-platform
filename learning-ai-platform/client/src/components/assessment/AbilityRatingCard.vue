<template>
  <div class="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
    <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
      <i class="fa fa-star text-tech-blue mr-2" />能力评级
    </h2>
    <div class="flex flex-col items-center justify-center h-40">
      <div class="text-4xl font-bold mb-2" :style="{ color: ratingColor }">
        {{ abilityRating }}
      </div>
      <div class="text-sm text-gray-400">
        {{ proficiencyDescription }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  totalScore: {
    type: Number,
    required: true,
  },
});

const abilityRating = computed(() => {
  const score = props.totalScore;
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '中等';
  if (score >= 60) return '及格';
  return '需要提高';
});

const ratingColor = computed(() => {
  const rating = abilityRating.value;
  switch (rating) {
    case '优秀':
      return '#52c41a';
    case '良好':
      return '#1890ff';
    case '中等':
      return '#faad14';
    case '及格':
      return '#fa8c16';
    case '需要提高':
      return '#f5222d';
    default:
      return '#faad14';
  }
});

const proficiencyDescription = computed(() => {
  const rating = abilityRating.value;
  switch (rating) {
    case '优秀':
      return '您已掌握本测试的核心知识点，表现出色！';
    case '良好':
      return '您对知识点有较好的理解，继续保持！';
    case '中等':
      return '您对部分知识点有所掌握，但仍有提升空间。';
    case '及格':
      return '您基本掌握了知识点，建议加强巩固。';
    case '需要提高':
      return '建议系统学习相关知识点，夯实基础。';
    default:
      return '';
  }
});
</script>
