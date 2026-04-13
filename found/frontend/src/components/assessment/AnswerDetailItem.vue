<template>
  <div
    class="border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
    :class="{
      'border-green-200': isCorrect,
      'border-red-200': !isCorrect,
    }"
  >
    <div
      class="p-4"
      :class="{
        'bg-green-50': isCorrect,
        'bg-red-50': !isCorrect,
      }"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium mr-3"
            :class="{
              'bg-green-500 text-white': isCorrect,
              'bg-red-500 text-white': !isCorrect,
            }"
          >
            {{ questionNumber }}
          </div>
          <span
            class="text-sm font-medium"
            :class="{
              'text-green-700': isCorrect,
              'text-red-700': !isCorrect,
            }"
          >
            {{ isCorrect ? '回答正确' : '回答错误' }}
          </span>
        </div>
        <div class="text-sm font-medium text-gray-600">分值: {{ score }}/{{ totalPoints }}</div>
      </div>

      <div class="font-medium text-gray-800 mb-3 truncate">
        {{ question }}
      </div>

      <AnswerOptions
        v-if="options && options.length > 0"
        :options="options"
        :selected="selected"
        :is-correct="isCorrect"
      />

      <NonQuestionAnswer v-else :selected="selected" :correct="correct" />

      <div class="bg-white border border-gray-200 rounded-lg p-4 mt-4">
        <div class="text-xs font-medium text-gray-700 mb-2">解析：</div>
        <div class="text-sm text-gray-600 whitespace-pre-line">
          {{ explanation || '暂无解析' }}
        </div>
      </div>

      <div v-if="knowledgePoints && knowledgePoints.length > 0" class="mt-4">
        <div class="text-xs font-medium text-gray-700 mb-2">涉及知识点：</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(kp, idx) in knowledgePoints"
            :key="idx"
            class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
          >
            {{ kp }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AnswerOptions from './AnswerOptions.vue';
import NonQuestionAnswer from './NonQuestionAnswer.vue';

defineProps({
  questionNumber: {
    type: Number,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  score: {
    type: Number,
    default: 1,
  },
  totalPoints: {
    type: Number,
    default: 1,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    default: () => [],
  },
  selected: String,
  correct: String,
  explanation: String,
  knowledgePoints: {
    type: Array,
    default: () => [],
  },
});
</script>
