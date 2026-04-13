<template>
  <div class="mb-3">
    <div class="p-3 bg-gray-50 rounded-lg mb-2">
      <div class="text-xs font-medium text-gray-600 mb-1">您的答案：</div>
      <div class="text-sm text-gray-800">
        {{ selected || '未作答' }}
      </div>
    </div>
    <div v-if="correct" class="p-3 bg-green-50 rounded-lg">
      <div class="text-xs font-medium text-green-600 mb-1">正确答案：</div>
      <div class="text-sm text-green-800">
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
