<template>
  <div class="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-6 mb-8 border border-white/10">
    <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
      <i class="fa fa-question-circle text-blue-400 mr-2" />答题详情
    </h2>

    <div v-if="loading" class="text-center py-12">
      <i class="fa fa-spinner fa-spin text-4xl text-gray-500 mb-4" />
      <p class="text-gray-400">加载答题详情中...</p>
    </div>

    <div v-else-if="answerDetails && answerDetails.length > 0">
      <div class="space-y-6">
        <AnswerDetailItem
          v-for="(answer, index) in answerDetails"
          :key="answer.questionId || index"
          :question-number="index + 1"
          :is-correct="answer.isCorrect"
          :score="answer.score || 1"
          :total-points="answer.totalPoints || 1"
          :question="answer.question"
          :options="answer.options"
          :selected="answer.selected"
          :correct="answer.correct"
          :explanation="answer.explanation"
          :knowledge-points="answer.knowledgePoints"
        />
      </div>
    </div>

    <div v-else class="text-center py-12 bg-white/5 rounded-lg">
      <i class="fa fa-exclamation-circle text-4xl text-gray-500 mb-4" />
      <p class="text-gray-400">无法获取答题详情</p>
    </div>
  </div>
</template>

<script setup>
import AnswerDetailItem from './AnswerDetailItem.vue';

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  answerDetails: {
    type: Array,
    default: () => [],
  },
});
</script>
