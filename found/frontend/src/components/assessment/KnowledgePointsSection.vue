<template>
  <div class="bg-white rounded-xl shadow-md p-6 mb-8">
    <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
      <i class="fa fa-bar-chart text-blue-500 mr-2" />知识点掌握情况
    </h2>
    <div v-if="knowledgePoints && knowledgePoints.length > 0" class="space-y-6">
      <div v-for="kp in knowledgePoints" :key="kp.id" class="knowledge-point-item">
        <div class="flex justify-between items-center mb-2">
          <div class="font-medium text-gray-800 truncate">
            {{ kp.name }}
          </div>
          <div class="text-sm font-medium" :style="{ color: getMasteryColor(kp.mastery) }">
            {{ kp.mastery }}%
          </div>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-1500 ease-out"
            :style="{
              width: `${kp.mastery}%`,
              backgroundColor: getMasteryBarColor(kp.mastery),
            }"
          />
        </div>
      </div>
    </div>
    <div v-else class="text-center py-12 bg-gray-50 rounded-lg">
      <i class="fa fa-clipboard text-4xl text-gray-400 mb-4" />
      <p class="text-gray-500">暂无足够数据进行知识点分析</p>
      <p class="text-sm text-gray-400 mt-2">完成更多测试后将生成详细分析</p>
    </div>
  </div>
</template>

<script setup>
const getMasteryColor = mastery => {
  if (mastery >= 90) return '#52c41a';
  if (mastery >= 80) return '#1890ff';
  if (mastery >= 70) return '#faad14';
  if (mastery >= 60) return '#fa8c16';
  return '#f5222d';
};

const getMasteryBarColor = mastery => {
  if (mastery >= 90) return '#52c41a';
  if (mastery >= 80) return '#1890ff';
  if (mastery >= 70) return '#faad14';
  if (mastery >= 60) return '#fa8c16';
  return '#f5222d';
};

defineProps({
  knowledgePoints: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.knowledge-point-item {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
