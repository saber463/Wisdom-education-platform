<template>
  <div class="flex flex-col items-center justify-center">
    <div class="loader mb-4" />
    <p class="text-gray-600">
      {{ message || '加载中...' }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '加载中...',
  },
});
</script>
