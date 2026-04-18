<template>
  <div
    class="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-8 mb-8 border border-white/10"
  >
    <div class="flex flex-col md:flex-row items-center justify-between">
      <div class="text-center md:text-left mb-4 md:mb-0">
        <div class="text-sm font-medium text-gray-400 mb-1">测试结果</div>
        <div class="text-2xl font-bold" :class="totalScore >= 60 ? 'text-green-400' : 'text-red-400'">
          {{ totalScore >= 60 ? '通过' : '未通过' }}
        </div>
      </div>

      <div class="flex flex-col items-center md:mx-8 mb-4 md:mb-0">
        <div class="text-sm font-medium text-gray-400 mb-1">得分</div>
        <div class="text-5xl font-bold" :class="totalScore >= 60 ? 'text-green-400' : 'text-red-400'">
          {{ totalScore }}
        </div>
        <div class="text-sm text-gray-500">{{ totalQuestions }}分制</div>
      </div>

      <div class="text-center">
        <div class="text-sm font-medium text-gray-400 mb-1">正确率</div>
        <div class="text-3xl font-bold text-white">{{ Math.round(correctRate) }}%</div>
        <div class="text-sm text-gray-500">{{ correctCount }}/{{ totalQuestions }}题正确</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalScore: {
    type: Number,
    required: true,
  },
  correctRate: {
    type: Number,
    required: true,
  },
  correctCount: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
});
</script>
