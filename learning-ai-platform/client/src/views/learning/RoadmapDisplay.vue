<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <!-- 背景装饰 -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- 主内容 -->
    <div class="relative z-10">
      <RoadmapDisplay />
    </div>
  </div>
</template>

<script>
import RoadmapDisplay from '@/components/business/RoadmapDisplay.vue';

export default {
  name: 'RoadmapPage',
  components: {
    RoadmapDisplay
  }
};
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>
