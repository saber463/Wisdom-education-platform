<template>
  <div class="survey-step">
    <h3 class="step-title">
      您每周可以投入多少时间学习？
    </h3>
    <p class="step-description">
      这将帮助我们为您制定合理的学习计划
    </p>
    
    <div class="options-list">
      <div
        v-for="hours in hoursOptions"
        :key="hours.value"
        class="option-item"
        :class="{ active: modelValue === hours.value }"
        @click="$emit('update:modelValue', hours.value)"
      >
        <div class="option-content">
          <div class="option-label">
            {{ hours.label }}
          </div>
          <div class="option-description">
            {{ hours.description }}
          </div>
        </div>
        <div
          v-if="modelValue === hours.value"
          class="option-check"
        >
          ✓
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20' | ''
}

interface HoursOption {
  value: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20'
  label: string
  description: string
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: 'less_5' | 'hours_5_10' | 'hours_10_20' | 'more_20']
}>()

const hoursOptions: HoursOption[] = [
  {
    value: 'less_5',
    label: '少于5小时',
    description: '利用碎片时间学习'
  },
  {
    value: 'hours_5_10',
    label: '5-10小时',
    description: '每周有固定的学习时间'
  },
  {
    value: 'hours_10_20',
    label: '10-20小时',
    description: '有充足的学习时间'
  },
  {
    value: 'more_20',
    label: '20小时以上',
    description: '可以投入大量时间学习'
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

