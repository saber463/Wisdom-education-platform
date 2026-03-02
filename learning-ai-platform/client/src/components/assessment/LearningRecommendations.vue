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
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin-bottom: 20px;
}

.section-title h3 {
  margin: 0;
  font-size: 20px;
  color: #1a1a1a;
}

.recommendation-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #1890ff;
}

.recommendation-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}
</style>
