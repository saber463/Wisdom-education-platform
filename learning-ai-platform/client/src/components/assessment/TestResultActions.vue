<template>
  <div class="flex justify-center gap-4 mt-8">
    <button
      class="px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
      @click="backToTestList"
    >
      <i class="fa fa-arrow-left mr-2" /> 返回测试列表
    </button>
    <button
      class="px-6 py-3 rounded-lg font-medium text-blue-400 bg-white/5 border border-blue-500/30 hover:bg-white/10 transition-colors shadow-md hover:shadow-lg"
      @click="viewKnowledgePointsAnalysis"
    >
      <i class="fa fa-bar-chart mr-2" /> 查看完整分析
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const backToTestList = () => {
  router.push('/assessment/tests');
};

const viewKnowledgePointsAnalysis = () => {
  router.push('/assessment/analysis');
};
</script>
