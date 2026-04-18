<template>
  <div class="mb-3">
    <div class="p-3 bg-white/5 rounded-lg mb-2 border border-white/10">
      <div class="text-xs font-medium text-gray-400 mb-1">您的答案：</div>
      <div class="text-sm text-gray-300">
        {{ selected || '未作答' }}
      </div>
    </div>
    <div v-if="correct" class="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
      <div class="text-xs font-medium text-green-400 mb-1">正确答案：</div>
      <div class="text-sm text-green-400">
        {{ correct }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selected: String,
  correct: String,
});
</script>
