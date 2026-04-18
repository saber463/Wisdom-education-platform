<template>
  <div class="recommendation-section">
    <div class="section-title">
      <h3>🎯 推荐学习资源</h3>
    </div>
    <div class="resource-list">
      <div v-for="(resource, index) in resources" :key="index" class="resource-item">
        <div class="resource-icon">
          <span v-if="resource.type === 'video'">🎥</span>
          <span v-else-if="resource.type === 'article'">📄</span>
          <span v-else-if="resource.type === 'exercise'">✍️</span>
        </div>
        <div class="resource-info">
          <h4>{{ resource.name }}</h4>
          <p class="resource-type">
            {{ resource.type }}
          </p>
        </div>
        <a :href="resource.url" target="_blank" rel="noopener noreferrer" class="resource-link">
          查看
          <i class="fas fa-arrow-right" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  resources: {
    type: Array,
    default: () => [],
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

.resource-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.resource-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: flex-start;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.resource-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}

.resource-icon {
  font-size: 24px;
  margin-right: 15px;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
}

.resource-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #e5e7eb;
}

.resource-type {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.resource-link {
  color: #60a5fa;
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  margin-top: auto;
}

.resource-link:hover {
  text-decoration: underline;
}

.resource-link i {
  margin-left: 5px;
  font-size: 12px;
}
</style>
