<template>
  <div class="space-y-2 mb-3">
    <div
      v-for="(option, optionIndex) in options"
      :key="optionIndex"
      class="flex items-center p-3 rounded-lg border text-sm transition-all"
      :class="{
        'border-green-500/50 bg-green-500/10 text-green-400 font-medium': option.isCorrect,
        'border-red-500/50 bg-red-500/10 text-red-400 font-medium': selected === option.text && !isCorrect,
        'border-white/10 text-gray-300 hover:bg-white/5':
          !option.isCorrect && selected !== option.text,
      }"
    >
      <div
        class="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center text-xs flex-shrink-0"
        :class="{
          'border-green-500 text-green-400': option.isCorrect,
          'border-red-500 text-red-400': selected === option.text && !isCorrect,
          'border-gray-500 text-gray-400': !option.isCorrect && selected !== option.text,
        }"
      >
        {{ String.fromCharCode(65 + optionIndex) }}
      </div>
      <span class="flex-grow">{{ option.text }}</span>
      <span
        v-if="option.isCorrect"
        class="ml-3 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded"
        >正确答案</span
      >
      <span
        v-if="selected === option.text && !isCorrect"
        class="ml-3 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded"
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
