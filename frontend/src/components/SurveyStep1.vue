<template>
  <div class="survey-step">
    <h3 class="step-title">请选择您的学习目标</h3>
    <p class="step-description">这将帮助我们为您推荐最合适的学习内容</p>
    
    <div class="options-grid">
      <div
        v-for="option in options"
        :key="option.value"
        class="option-card"
        :class="{ active: modelValue === option.value }"
        @click="$emit('update:modelValue', option.value)"
      >
        <div class="option-icon">{{ option.icon }}</div>
        <div class="option-label">{{ option.label }}</div>
        <div class="option-description">{{ option.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: 'employment' | 'hobby' | 'exam' | 'project' | ''
}

interface Option {
  value: 'employment' | 'hobby' | 'exam' | 'project'
  label: string
  description: string
  icon: string
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: 'employment' | 'hobby' | 'exam' | 'project']
}>()

const options: Option[] = [
  {
    value: 'employment',
    label: '就业求职',
    description: '为了找到理想的工作',
    icon: '💼'
  },
  {
    value: 'hobby',
    label: '兴趣爱好',
    description: '纯粹的兴趣学习',
    icon: '🎨'
  },
  {
    value: 'exam',
    label: '考试认证',
    description: '准备各类考试和认证',
    icon: '📝'
  },
  {
    value: 'project',
    label: '项目实战',
    description: '完成实际项目需求',
    icon: '🚀'
  }
]
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
</style>

