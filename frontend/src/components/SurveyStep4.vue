<template>
  <div class="survey-step">
    <h3 class="step-title">请选择您当前的技能水平</h3>
    <p class="step-description">这将帮助我们为您推荐合适难度的内容</p>
    
    <div class="options-list">
      <div
        v-for="level in levels"
        :key="level.value"
        class="option-item"
        :class="{ active: modelValue === level.value }"
        @click="$emit('update:modelValue', level.value)"
      >
        <div class="option-content">
          <div class="option-label">{{ level.label }}</div>
          <div class="option-description">{{ level.description }}</div>
        </div>
        <div class="option-check" v-if="modelValue === level.value">✓</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: 'beginner' | 'intermediate' | 'advanced' | 'expert' | ''
}

interface Level {
  value: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  label: string
  description: string
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: 'beginner' | 'intermediate' | 'advanced' | 'expert']
}>()

const levels: Level[] = [
  {
    value: 'beginner',
    label: '初学者',
    description: '刚开始学习编程，对基础概念还不熟悉'
  },
  {
    value: 'intermediate',
    label: '有基础',
    description: '掌握基础语法，能完成简单的编程任务'
  },
  {
    value: 'advanced',
    label: '熟练',
    description: '能独立完成项目，熟悉常用框架和工具'
  },
  {
    value: 'expert',
    label: '专家',
    description: '有丰富的项目经验，能解决复杂问题'
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

.options-list {
  @apply space-y-4 max-w-2xl mx-auto;
}

.option-item {
  @apply p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200;
  @apply hover:border-primary-400 hover:shadow-md flex items-center justify-between;
}

.option-item.active {
  @apply border-primary-500 bg-primary-50 shadow-md;
}

.option-content {
  @apply flex-1;
}

.option-label {
  @apply text-lg font-semibold text-gray-800 mb-1;
}

.option-description {
  @apply text-sm text-gray-600;
}

.option-check {
  @apply text-2xl text-primary-500 font-bold ml-4;
}
</style>

