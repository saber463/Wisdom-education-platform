<template>
  <div v-if="learningPath" class="max-w-4xl mx-auto bg-gray-800/80 rounded-xl shadow-lg p-6 border border-gray-700">
    <div class="mb-6 flex items-center justify-between">
      <h3 class="text-xl font-bold text-white mb-2">学习目标：{{ learningPath.goal }}</h3>
      <span
        v-if="learningPath.isCached"
        class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium"
      >
        缓存加载（30分钟内有效）
      </span>
    </div>

    <p class="text-gray-400">
      总时长：{{ learningPath.totalDays }}天 | 时间范围：{{ learningPath.startDate }} -
      {{ learningPath.endDate }} | 强度：{{ intensityMap[learningPath.intensity || intensity] }}
    </p>

    <div class="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
      <h4 class="font-medium text-white mb-2">路径总结</h4>
      <p class="text-gray-300">
        {{ learningPath.summary || '生成中...' }}
      </p>
    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold text-white mb-4">每日学习计划</h3>

      <div v-if="learningPath.isStreaming" class="text-center py-8 text-gray-400">
        <i class="fa fa-spinner fa-spin text-2xl mb-2" />
        <p>AI正在全力生成学习计划，请稍候...</p>
      </div>

      <div v-else-if="learningPath.stages && learningPath.stages.length" class="space-y-6">
        <LearningStage
          v-for="(stage, index) in learningPath.stages"
          :key="index"
          :stage="stage"
          :index="index"
          :intensity="intensity"
        />
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <i class="fa fa-file-text-o text-2xl mb-2" />
        <p>暂无学习计划数据，请重试</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import LearningStage from './LearningStage.vue';

defineProps({
  learningPath: {
    type: Object,
    default: null,
  },
  intensity: {
    type: String,
    default: 'medium',
  },
});

const intensityMap = {
  low: '轻松（30-60分钟/天）',
  medium: '适中（60-90分钟/天）',
  high: '高强度（90-120分钟/天）',
};
</script>
