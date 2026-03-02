<template>
  <div class="space-y-2 mb-3">
    <div
      v-for="(option, optionIndex) in options"
      :key="optionIndex"
      class="flex items-center p-3 rounded-lg border text-sm transition-all"
      :class="{
        'border-green-300 bg-green-50 text-green-800 font-medium': option.isCorrect,
        'border-red-300 bg-red-50 text-red-800 font-medium': selected === option.text && !isCorrect,
        'border-gray-200 text-gray-600 hover:bg-gray-50':
          !option.isCorrect && selected !== option.text,
      }"
    >
      <div
        class="w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center text-xs flex-shrink-0"
      >
        {{ String.fromCharCode(65 + optionIndex) }}
      </div>
      <span class="flex-grow">{{ option.text }}</span>
      <span
        v-if="option.isCorrect"
        class="ml-3 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded"
        >正确答案</span
      >
      <span
        v-if="selected === option.text && !isCorrect"
        class="ml-3 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded"
        >您的答案</span
      >
    </div>
  </div>
</template>

<script setup>
defineProps({
  options: {
    type: Array,
    required: true,
  },
  selected: String,
  isCorrect: {
    type: Boolean,
    required: true,
  },
});
</script>
