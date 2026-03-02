<template>
  <div class="recommendation-section">
    <div class="section-title">
      <h3>🚀 学习路径</h3>
    </div>
    <div class="learning-path">
      <div v-for="(stage, index) in learningPath" :key="index" class="path-stage">
        <div class="stage-number">
          {{ index + 1 }}
        </div>
        <div class="stage-content">
          <h4>{{ stage.stage }}</h4>
          <div class="stage-topics">
            <span v-for="(topic, topicIndex) in stage.topics" :key="topicIndex" class="topic-tag">
              {{ topic }}
            </span>
          </div>
          <p class="stage-duration">⏱️ 预计耗时: {{ stage.duration }}</p>
          <div v-if="stage.focusPoints" class="stage-focus">
            <strong>重点关注:</strong> {{ stage.focusPoints.join('、') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  learningPath: {
    type: Array,
    default: () => [],
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

.learning-path {
  position: relative;
  padding-left: 30px;
}

.learning-path::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #1890ff, #52c41a);
}

.path-stage {
  position: relative;
  margin-bottom: 30px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stage-number {
  position: absolute;
  left: -38px;
  top: 20px;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #1890ff, #52c41a);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  z-index: 1;
}

.stage-content h4 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #1a1a1a;
}

.stage-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.topic-tag {
  background: #f0f5ff;
  color: #1890ff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.stage-duration {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.stage-focus {
  background: #fff2e8;
  color: #fa8c16;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
}
</style>
