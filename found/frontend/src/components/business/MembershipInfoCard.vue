<template>
  <div class="membership-info-card">
    <div class="info-header">
      <div class="current-level">
        <span class="level-badge" :class="currentLevel">{{ levelName }}</span>
        <span v-if="currentLevel !== 'free' && !isExpired" class="expire-date">
          有效期至：{{ formatDate(expireDate) }}
        </span>
        <span v-if="isExpired" class="expired-badge">已过期</span>
      </div>
      <div class="usage-stats">
        <div class="stat-item">
          <span class="stat-label">今日已用</span>
          <span class="stat-value"
            >{{ dailyCount }}/{{ dailyLimit === Infinity ? '∞' : dailyLimit }}</span
          >
        </div>
        <div class="stat-item">
          <span class="stat-label">剩余次数</span>
          <span class="stat-value">{{
            remainingGenerations === Infinity ? '无限' : remainingGenerations
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentLevel: {
    type: String,
    default: 'free',
  },
  levelName: {
    type: String,
    default: '免费用户',
  },
  expireDate: {
    type: String,
    default: '',
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
  dailyCount: {
    type: Number,
    default: 0,
  },
  dailyLimit: {
    type: Number,
    default: 3,
  },
  remainingGenerations: {
    type: Number,
    default: 0,
  },
});

const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
</script>

<style scoped>
.membership-info-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.current-level {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.level-badge {
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.1rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.level-badge.free {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
}

.level-badge.silver {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(232, 232, 232, 0.15));
  color: #e0e0e0;
  border-color: rgba(192, 192, 192, 0.4);
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.2);
}

.level-badge.gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 236, 139, 0.15));
  color: #ffd700;
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

.expire-date {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.expired-badge {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, var(--tech-pink), var(--tech-purple));
  color: white;
  border-radius: 6px;
  font-size: 0.85rem;
  box-shadow: 0 2px 8px rgba(247, 37, 133, 0.3);
}

.usage-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--tech-blue);
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
}

@media (max-width: 768px) {
  .info-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .usage-stats {
    width: 100%;
    justify-content: space-around;
  }
}
</style>
