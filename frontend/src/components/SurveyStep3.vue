<template>
  <div class="survey-step">
    <h3 class="step-title">请选择您感兴趣的技术方向</h3>
    <p class="step-description">可多选，至少选择一项</p>
    
    <div class="options-grid">
      <div
        v-for="direction in directions"
        :key="direction.value"
        class="option-chip"
        :class="{ active: modelValue.includes(direction.value) }"
        @click="toggleDirection(direction.value)"
      >
        {{ direction.label }}
      </div>
    </div>
    
    <div v-if="modelValue.length === 0" class="error-message">
      请至少选择一个技术方向
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const directions = [
  { value: 'frontend', label: '前端开发' },
  { value: 'backend', label: '后端开发' },
  { value: 'mobile', label: '移动端开发' },
  { value: 'data-analysis', label: '数据分析' },
  { value: 'ai', label: '人工智能' },
  { value: 'game', label: '游戏开发' },
  { value: 'devops', label: 'DevOps' },
  { value: 'blockchain', label: '区块链' },
  { value: 'security', label: '网络安全' },
  { value: 'embedded', label: '嵌入式开发' }
]

function toggleDirection(direction: string) {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(direction)
  if (index > -1) {
    newValue.splice(index, 1)
  } else {
    newValue.push(direction)
  }
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.survey-step {
  @apply p-6;
}

.step-title {
  @apply text-2xl font-bold text-gray-800 mb-2 text-center;
}

.step-description {
  @apply text-gray-600 mb-6 text-center;
}

.options-grid {
  @apply flex flex-wrap gap-3 justify-center;
}

.option-chip {
  @apply px-6 py-3 border-2 border-gray-200 rounded-full cursor-pointer transition-all duration-200;
  @apply hover:border-primary-400 hover:bg-primary-50;
}

.option-chip.active {
  @apply border-primary-500 bg-primary-500 text-white;
}

.error-message {
  @apply mt-4 text-sm text-danger-500 text-center;
}
</style>

