<template>
  <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
    <i class="fa fa-exclamation-circle text-red-500 mr-2" />
    <p class="text-red-600">
      {{ message }}
    </p>
    <button v-if="showRetry" @click="onRetry" class="ml-4 text-primary hover:underline text-sm">
      重试
    </button>
  </div>
</template>

<script setup>
const _props = defineProps({
  message: {
    type: String,
    required: true,
  },
  showRetry: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['retry']);

const onRetry = () => {
  emit('retry');
};
</script>
