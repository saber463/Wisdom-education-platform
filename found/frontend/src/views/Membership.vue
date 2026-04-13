<template>
  <div class="membership-page">
    <div class="container">
      <div class="page-header">
        <h1>会员中心</h1>
        <p>升级会员，解锁更多学习功能</p>
      </div>

      <div v-if="loading" class="loading-container">
        <Loading />
      </div>

      <div v-else>
        <MembershipInfoCard
          :current-level="currentLevel"
          :level-name="levelName"
          :expire-date="expireDate"
          :is-expired="isExpired"
          :daily-count="dailyCount"
          :daily-limit="dailyLimit"
          :remaining-generations="remainingGenerations"
        />

        <div v-if="currentLevel >= 1" class="member-features">
          <div class="features-tabs">
            <button
              v-for="tab in featureTabs"
              :key="tab.id"
              class="tab-button"
              :class="{ 'tab-button-active': activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <i :class="tab.icon" />
              {{ tab.name }}
            </button>
          </div>

          <div class="tab-content">
            <ThemeSelector v-if="activeTab === 'theme'" />
            <DynamicAvatar v-if="activeTab === 'avatar'" />
            <GoldFeatures v-if="activeTab === 'gold'" />
          </div>
        </div>

        <PlansGrid
          :plans="plans"
          :selected-plan="selectedPlan"
          :selected-duration="selectedDuration"
          @select-plan="selectPlan"
          @select-duration="selectDuration"
        />

        <UpgradeSummary
          :plan-name="selectedPlanName"
          :duration-label="selectedDurationLabel"
          :price="selectedPrice"
          :disabled="upgrading"
          :has-selection="hasSelection"
          :button-text="upgrading ? '处理中...' : '立即升级'"
          @upgrade="handleUpgrade"
        />

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMembershipUpgrade } from '@/hooks/useMembershipUpgrade';
import Loading from '@/components/common/Loading.vue';
import MembershipInfoCard from '@/components/business/MembershipInfoCard.vue';
import PlansGrid from '@/components/business/PlansGrid.vue';
import UpgradeSummary from '@/components/business/UpgradeSummary.vue';
import ThemeSelector from '@/components/business/ThemeSelector.vue';
import DynamicAvatar from '@/components/business/DynamicAvatar.vue';
import GoldFeatures from '@/components/business/GoldFeatures.vue';

const {
  loading,
  upgrading,
  errorMessage,
  plans,
  selectedPlan,
  selectedDuration,
  currentLevel,
  levelName,
  expireDate,
  isExpired,
  dailyCount,
  dailyLimit,
  remainingGenerations,
  selectedPlanName,
  selectedDurationLabel,
  selectedPrice,
  hasSelection,
  selectPlan,
  selectDuration,
  handleUpgrade,
  initialize,
} = useMembershipUpgrade();

const activeTab = ref('theme');

const featureTabs = computed(() => {
  const tabs = [
    { id: 'theme', name: '主题设置', icon: 'fa fa-palette' },
    { id: 'avatar', name: '个性化头像', icon: 'fa fa-user-circle' },
  ];

  if (currentLevel.value >= 2) {
    tabs.push({ id: 'gold', name: '黄金特权', icon: 'fa fa-crown' });
  }

  return tabs;
});

onMounted(() => {
  initialize();
});
</script>

<style scoped>
.membership-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
}

.membership-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 242, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(114, 9, 183, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(247, 37, 133, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header h1 {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple), var(--tech-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(0, 242, 255, 0.3);
  letter-spacing: -0.5px;
}

.page-header p {
  font-size: 1.25rem;
  opacity: 0.85;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-message {
  margin-top: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: rgba(247, 37, 133, 0.1);
  color: var(--tech-pink);
  border: 2px solid rgba(247, 37, 133, 0.3);
  border-radius: 12px;
  text-align: center;
  font-weight: 500;
  backdrop-filter: blur(10px);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@media (max-width: 768px) {
  .membership-page {
    padding: 1.5rem 0;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2.25rem;
  }

  .page-header p {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.75rem;
  }

  .page-header p {
    font-size: 1rem;
  }
}

.member-features {
  margin: 2rem 0;
}

.features-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-button {
  flex: 1;
  min-width: 140px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-button:hover {
  border-color: rgba(0, 242, 255, 0.3);
  background: rgba(0, 242, 255, 0.05);
  color: #ffffff;
  transform: translateY(-2px);
}

.tab-button-active {
  border-color: var(--tech-blue);
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(189, 0, 255, 0.1));
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 242, 255, 0.2);
}

.tab-button i {
  font-size: 16px;
}

.tab-content {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
