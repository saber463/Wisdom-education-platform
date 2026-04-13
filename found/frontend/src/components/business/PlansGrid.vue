<template>
  <div class="plans-section">
    <h2>选择会员套餐</h2>
    <div class="plans-grid">
      <PlanCard
        v-for="(plan, planKey) in plans"
        :key="planKey"
        :plan="plan"
        :plan-key="planKey"
        :is-selected="selectedPlan === planKey"
        :selected-duration="selectedDuration"
        @select="selectPlan"
        @select-duration="selectDuration"
      />
    </div>
  </div>
</template>

<script setup>
import PlanCard from './PlanCard.vue';

defineProps({
  plans: {
    type: Object,
    required: true,
  },
  selectedPlan: {
    type: String,
    default: 'silver',
  },
  selectedDuration: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(['select-plan', 'select-duration']);

const selectPlan = planKey => {
  emit('select-plan', planKey);
};

const selectDuration = duration => {
  emit('select-duration', duration);
};
</script>

<style scoped>
.plans-section {
  margin-bottom: 2rem;
}

.plans-section h2 {
  color: white;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
