<template>
  <div class="recommendation-section">
    <div class="section-title">
      <h3>📚 学习建议</h3>
    </div>
    <div class="recommendation-card">
      <p class="recommendation-text">
        {{ suggestionText }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  suggestionText: {
    type: String,
    default: '正在生成学习建议...',
  },
});
</script>

<style scoped>
.recommendation-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  margin-bottom: 20px;
}

.section-title h3 {
  margin: 0;
  font-size: 20px;
  color: #ffffff;
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #3b82f6;
}

.recommendation-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #e5e7eb;
}
</style>
