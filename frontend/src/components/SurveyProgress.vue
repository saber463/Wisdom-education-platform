<template>
  <div class="survey-progress">
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
      />
    </div>
    <div class="progress-text">
      步骤 {{ currentStep }} / {{ totalSteps }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentStep: number
  totalSteps: number
}

defineProps<Props>()
</script>

<style scoped>
.survey-progress {
  @apply mb-6;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-primary-500 transition-all duration-300 ease-out;
}

.progress-text {
  @apply mt-2 text-sm text-gray-600 text-center;
}
</style>

