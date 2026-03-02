<template>
  <div class="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/10">
    <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
      <i class="fa fa-file-text-o text-tech-blue mr-2" />测试信息
    </h2>
    <div class="space-y-3">
      <div class="flex justify-between">
        <span class="text-gray-400">测试名称</span>
        <span class="font-medium text-white truncate max-w-[150px]">{{
          testTitle || 'N/A'
        }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">测试时长</span>
        <span class="font-medium text-white">{{ testTime || 'N/A' }} 分钟</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">开始时间</span>
        <span class="font-medium text-white">{{ startTime || 'N/A' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">完成时间</span>
        <span class="font-medium text-white">{{ endTime || 'N/A' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">测试难度</span>
        <span class="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          {{ testDifficulty || '中等' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  testTitle: String,
  testTime: String,
  startTime: String,
  endTime: String,
  testDifficulty: String,
});
</script>
