<template>
  <div class="survey-step">
    <h3 class="step-title">
      请选择您感兴趣的编程语言
    </h3>
    <p class="step-description">
      可多选，至少选择一项
    </p>
    
    <div class="options-grid">
      <div
        v-for="lang in languages"
        :key="lang.value"
        class="option-chip"
        :class="{ active: modelValue.includes(lang.value) }"
        @click="toggleLanguage(lang.value)"
      >
        {{ lang.label }}
      </div>
    </div>
    
    <div
      v-if="modelValue.length === 0"
      class="error-message"
    >
      请至少选择一种编程语言
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

const languages = [
  { value: 'Python', label: 'Python' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Java', label: 'Java' },
  { value: 'C++', label: 'C++' },
  { value: 'Go', label: 'Go' },
  { value: 'Rust', label: 'Rust' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'C#', label: 'C#' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'Swift', label: 'Swift' },
  { value: 'Kotlin', label: 'Kotlin' }
]

function toggleLanguage(lang: string) {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(lang)
  if (index > -1) {
    newValue.splice(index, 1)
  } else {
    newValue.push(lang)
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

