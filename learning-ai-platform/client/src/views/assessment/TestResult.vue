<template>
  <div class="test-result-container">
    <div class="container mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">学习评估报告</h1>
        <p class="text-gray-600 mt-2">全面分析您的知识掌握情况</p>
      </div>

      <TestResultSummary
        :total-score="assessmentResult.totalScore"
        :correct-rate="assessmentResult.correctRate"
        :correct-count="correctCount"
        :total-questions="totalQuestions"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TestInfoCard
          :test-title="assessmentResult.testTitle"
          :test-time="assessmentResult.testTime"
          :start-time="assessmentResult.startTime"
          :end-time="assessmentResult.endTime"
          :test-difficulty="assessmentResult.testDifficulty"
        />

        <AbilityRatingCard :total-score="assessmentResult.totalScore" />
      </div>

      <KnowledgePointsSection :knowledge-points="assessmentResult.knowledgePoints" />

      <AnswerDetailsSection :loading="loading" :answer-details="assessmentResult.answerDetails" />

      <LearningRecommendations
        v-if="assessmentResult.recommendations.suggestions.length > 0"
        :suggestion-text="assessmentResult.recommendations.suggestions[0].content"
      />

      <RecommendedResources
        v-if="assessmentResult.recommendations.resources.length > 0"
        :resources="assessmentResult.recommendations.resources"
      />

      <LearningPathSection
        v-if="assessmentResult.recommendations.learningPath.length > 0"
        :learning-path="assessmentResult.recommendations.learningPath"
      />

      <TestResultActions />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTestResult } from '@/hooks/useTestResult';
import TestResultSummary from '@/components/assessment/TestResultSummary.vue';
import TestInfoCard from '@/components/assessment/TestInfoCard.vue';
import AbilityRatingCard from '@/components/assessment/AbilityRatingCard.vue';
import KnowledgePointsSection from '@/components/assessment/KnowledgePointsSection.vue';
import AnswerDetailsSection from '@/components/assessment/AnswerDetailsSection.vue';
import LearningRecommendations from '@/components/assessment/LearningRecommendations.vue';
import RecommendedResources from '@/components/assessment/RecommendedResources.vue';
import LearningPathSection from '@/components/assessment/LearningPathSection.vue';
import TestResultActions from '@/components/assessment/TestResultActions.vue';

const route = useRoute();
const { assessmentResult, loading, fetchTestResult } = useTestResult();

const correctCount = computed(() => {
  return assessmentResult.value.answerDetails.filter(a => a.isCorrect).length;
});

const totalQuestions = computed(() => {
  return assessmentResult.value.answerDetails.length;
});

onMounted(() => {
  const resultId = route.params.id;
  fetchTestResult(resultId);
});
</script>

<style scoped>
.test-result-container {
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  padding: 20px 0;
}
</style>
