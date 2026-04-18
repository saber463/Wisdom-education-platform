<template>
  <div
    class="border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
    :class="{
      'border-green-500/30': isCorrect,
      'border-red-500/30': !isCorrect,
    }"
  >
    <div
      class="p-4"
      :class="{
        'bg-green-500/5': isCorrect,
        'bg-red-500/5': !isCorrect,
      }"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium mr-3"
            :class="{
              'bg-green-500/20 text-green-400': isCorrect,
              'bg-red-500/20 text-red-400': !isCorrect,
            }"
          >
            {{ questionNumber }}
          </div>
          <span
            class="text-sm font-medium"
            :class="{
              'text-green-400': isCorrect,
              'text-red-400': !isCorrect,
            }"
          >
            {{ isCorrect ? '回答正确' : '回答错误' }}
          </span>
        </div>
        <div class="text-sm font-medium text-gray-400">分值: {{ score }}/{{ totalPoints }}</div>
      </div>

      <div class="font-medium text-gray-200 mb-3 truncate">
        {{ question }}
      </div>

      <AnswerOptions
        v-if="options && options.length > 0"
        :options="options"
        :selected="selected"
        :is-correct="isCorrect"
      />

      <NonQuestionAnswer v-else :selected="selected" :correct="correct" />

      <div class="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
        <div class="text-xs font-medium text-gray-400 mb-2">解析：</div>
        <div class="text-sm text-gray-300 whitespace-pre-line">
          {{ explanation || '暂无解析' }}
        </div>
      </div>

      <div v-if="knowledgePoints && knowledgePoints.length > 0" class="mt-4">
        <div class="text-xs font-medium text-gray-400 mb-2">涉及知识点：</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(kp, idx) in knowledgePoints"
            :key="idx"
            class="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full"
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
