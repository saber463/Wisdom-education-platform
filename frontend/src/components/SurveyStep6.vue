<template>
  <div class="survey-step">
    <h3 class="step-title">请选择您偏好的学习方式</h3>
    <p class="step-description">可多选，至少选择一项</p>
    
    <div class="options-grid">
      <div
        v-for="style in learningStyles"
        :key="style.value"
        class="option-card"
        :class="{ active: modelValue.includes(style.value) }"
        @click="toggleStyle(style.value)"
      >
        <div class="option-icon">{{ style.icon }}</div>
        <div class="option-label">{{ style.label }}</div>
        <div class="option-description">{{ style.description }}</div>
      </div>
    </div>
    
    <div v-if="modelValue.length === 0" class="error-message">
      请至少选择一种学习方式
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const learningStyles = [
  {
    value: 'video',
    label: '视频教程',
    description: '观看视频学习',
    icon: '📹'
  },
  {
    value: 'document',
    label: '文档阅读',
    description: '阅读技术文档',
    icon: '📚'
  },
  {
    value: 'project',
    label: '实战项目',
    description: '通过项目实践学习',
    icon: '💻'
  },
  {
    value: 'interactive',
    label: '互动练习',
    description: '通过练习和测验学习',
    icon: '🎯'
  }
]

function toggleStyle(style: string) {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(style)
  if (index > -1) {
    newValue.splice(index, 1)
  } else {
    newValue.push(style)
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
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.option-card {
  @apply p-6 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200;
  @apply hover:border-primary-400 hover:shadow-md;
}

.option-card.active {
  @apply border-primary-500 bg-primary-50 shadow-md;
}

.option-icon {
  @apply text-4xl mb-3 text-center;
}

.option-label {
  @apply text-lg font-semibold text-gray-800 mb-2 text-center;
}

.option-description {
  @apply text-sm text-gray-600 text-center;
}

.error-message {
  @apply mt-4 text-sm text-danger-500 text-center;
}
</style>

