<template>
  <div class="upgrade-section">
    <div class="upgrade-summary">
      <h3>升级摘要</h3>
      <div class="summary-item">
        <span>套餐：</span>
        <span>{{ planName }}</span>
      </div>
      <div class="summary-item">
        <span>时长：</span>
        <span>{{ durationLabel }}</span>
      </div>
      <div class="summary-item total">
        <span>总计：</span>
        <span class="total-price">¥{{ price }}</span>
      </div>
    </div>
    <button class="upgrade-btn" :disabled="disabled || !hasSelection" @click="$emit('upgrade')">
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  planName: {
    type: String,
    default: '',
  },
  durationLabel: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    default: 0,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  hasSelection: {
    type: Boolean,
    default: false,
  },
  buttonText: {
    type: String,
    default: '立即升级',
  },
});

defineEmits(['upgrade']);
</script>

<style scoped>
.upgrade-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.upgrade-summary h3 {
  margin-bottom: 1rem;
  color: white;
  font-weight: 700;
  font-size: 1.3rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item.total {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid var(--tech-blue);
  color: white;
}

.total-price {
  color: var(--tech-blue);
  font-size: 1.5rem;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
}

.upgrade-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 242, 255, 0.3);
}

.upgrade-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 242, 255, 0.5);
}

.upgrade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
