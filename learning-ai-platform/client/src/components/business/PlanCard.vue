<template>
  <div class="plan-card" :class="{ selected: isSelected, 'plan-card-gold': planKey === 'gold', 'plan-card-silver': planKey === 'silver' }" @click="$emit('select', planKey)">
    <div v-if="plan.recommended" class="recommended-badge">
      <i class="fa fa-star" />
      推荐
    </div>
    <div class="plan-header">
      <div class="plan-icon">
        <i :class="planKey === 'gold' ? 'fa fa-crown' : 'fa fa-gem'" />
      </div>
      <h3>{{ plan.name }}</h3>
      <p>{{ plan.description }}</p>
    </div>
    <div class="plan-features">
      <div class="feature-item">
        <span class="feature-icon">✓</span>
        <span>每日{{ plan.dailyLimit === Infinity ? '无限' : plan.dailyLimit }}次生成</span>
      </div>
      <div v-for="feature in plan.features" :key="feature" class="feature-item">
        <span class="feature-icon">✓</span>
        <span>{{ feature }}</span>
      </div>
    </div>
    <div class="plan-pricing">
      <div class="duration-options">
        <button
          v-for="option in plan.pricing"
          :key="option.duration"
          class="duration-btn"
          :class="{ active: selectedDuration === option.duration }"
          @click.stop="$emit('select-duration', option.duration)"
        >
          <div class="duration-info">
            <span class="duration-label">{{ option.label }}</span>
            <span v-if="option.discount" class="discount-badge">{{ option.discount }}</span>
          </div>
          <span class="duration-price">¥{{ option.price }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  plan: {
    type: Object,
    required: true,
  },
  planKey: {
    type: String,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  selectedDuration: {
    type: Number,
    default: 1,
  },
});

defineEmits(['select', 'select-duration']);
</script>

<style scoped>
.plan-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.plan-card-silver {
  border-color: rgba(192, 192, 192, 0.3);
}

.plan-card-gold {
  border-color: rgba(255, 215, 0, 0.4);
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 242, 255, 0.2);
  border-color: rgba(0, 242, 255, 0.3);
}

.plan-card-silver:hover {
  box-shadow: 0 8px 24px rgba(192, 192, 192, 0.3);
  border-color: rgba(192, 192, 192, 0.5);
}

.plan-card-gold:hover {
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
  border-color: rgba(255, 215, 0, 0.6);
}

.plan-card.selected {
  border-color: var(--tech-blue);
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(189, 0, 255, 0.1));
  box-shadow: 0 8px 32px rgba(0, 242, 255, 0.3);
}

.plan-card-silver.selected {
  border-color: rgba(192, 192, 192, 0.6);
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(232, 232, 232, 0.1));
  box-shadow: 0 8px 32px rgba(192, 192, 192, 0.4);
}

.plan-card-gold.selected {
  border-color: rgba(255, 215, 0, 0.6);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 236, 139, 0.1));
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.4);
}

.recommended-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, var(--tech-pink), var(--tech-purple));
  color: white;
  padding: 0.5rem 1.25rem;
  border-bottom-left-radius: 16px;
  font-size: 0.85rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(247, 37, 133, 0.3);
}

.recommended-badge i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.plan-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.5rem;
}

.plan-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.plan-card-silver .plan-icon {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(232, 232, 232, 0.1));
  border-color: rgba(192, 192, 192, 0.3);
  color: #c0c0c0;
}

.plan-card-gold .plan-icon {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 236, 139, 0.1));
  border-color: rgba(255, 215, 0, 0.3);
  color: #ffd700;
}

.plan-header h3 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: white;
  font-weight: 700;
}

.plan-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

.plan-features {
  margin: 1.5rem 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}

.feature-icon {
  color: var(--tech-blue);
  font-weight: bold;
  font-size: 1.1rem;
}

.plan-card-silver .feature-icon {
  color: #c0c0c0;
}

.plan-card-gold .feature-icon {
  color: #ffd700;
}

.plan-pricing {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
}

.duration-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.duration-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.2s ease;
}

.duration-btn:hover {
  border-color: rgba(0, 242, 255, 0.3);
  background: rgba(0, 242, 255, 0.05);
}

.plan-card-silver .duration-btn:hover {
  border-color: rgba(192, 192, 192, 0.4);
  background: rgba(192, 192, 192, 0.08);
}

.plan-card-gold .duration-btn:hover {
  border-color: rgba(255, 215, 0, 0.4);
  background: rgba(255, 215, 0, 0.08);
}

.duration-btn.active {
  border-color: var(--tech-blue);
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.15), rgba(189, 0, 255, 0.15));
  color: white;
  box-shadow: 0 4px 12px rgba(0, 242, 255, 0.2);
}

.plan-card-silver .duration-btn.active {
  border-color: rgba(192, 192, 192, 0.6);
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(232, 232, 232, 0.15));
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
}

.plan-card-gold .duration-btn.active {
  border-color: rgba(255, 215, 0, 0.6);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 236, 139, 0.15));
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.duration-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.duration-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.duration-price {
  font-weight: bold;
  font-size: 1.25rem;
  color: white;
}

.plan-card-silver .duration-price {
  color: #e0e0e0;
}

.plan-card-gold .duration-price {
  color: #ffd700;
}

.discount-badge {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, var(--tech-pink), var(--tech-purple));
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
