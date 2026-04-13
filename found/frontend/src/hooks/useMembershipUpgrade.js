import { ref, computed } from 'vue';
import api from '../utils/api';

export function useMembershipUpgrade() {
  const loading = ref(true);
  const upgrading = ref(false);
  const errorMessage = ref('');
  const membershipInfo = ref(null);
  const plans = ref(null);
  const selectedPlan = ref('silver');
  const selectedDuration = ref(1);

  const currentLevel = computed(() => membershipInfo.value?.level || 'free');

  const levelName = computed(() => {
    const names = {
      free: '免费用户',
      silver: '白银会员',
      gold: '黄金会员',
    };
    return names[currentLevel.value] || '免费用户';
  });

  const expireDate = computed(() => membershipInfo.value?.expireDate);

  const isExpired = computed(() => membershipInfo.value?.isExpired || false);

  const dailyCount = computed(() => membershipInfo.value?.dailyGenerationCount || 0);

  const dailyLimit = computed(() => membershipInfo.value?.dailyGenerationLimit || 3);

  const remainingGenerations = computed(() => membershipInfo.value?.remainingGenerations || 0);

  const selectedPlanName = computed(() => {
    if (!plans.value || !selectedPlan.value) return '';
    return plans.value[selectedPlan.value].name;
  });

  const selectedDurationLabel = computed(() => {
    if (!plans.value || !selectedPlan.value || !selectedDuration.value) return '';
    const option = plans.value[selectedPlan.value].pricing.find(
      p => p.duration === selectedDuration.value
    );
    return option ? option.label : '';
  });

  const selectedPrice = computed(() => {
    if (!plans.value || !selectedPlan.value || !selectedDuration.value) return 0;
    const option = plans.value[selectedPlan.value].pricing.find(
      p => p.duration === selectedDuration.value
    );
    return option ? option.price : 0;
  });

  const hasSelection = computed(() => selectedPlan.value && selectedDuration.value);

  const selectPlan = planKey => {
    selectedPlan.value = planKey;
    selectedDuration.value = 1;
  };

  const selectDuration = duration => {
    selectedDuration.value = duration;
  };

  const fetchMembershipInfo = async () => {
    try {
      const response = await api.get('/membership/info');
      if (response.success) {
        membershipInfo.value = response.data;
      }
    } catch (_error) {
      console.error('获取会员信息失败:', _error);
      errorMessage.value = '获取会员信息失败，请稍后重试';
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/membership/plans');
      if (response.success) {
        plans.value = response.data;
      }
    } catch (_error) {
      console.error('获取会员套餐失败:', _error);
      errorMessage.value = '获取会员套餐失败，请稍后重试';
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan.value || !selectedDuration.value) {
      errorMessage.value = '请选择套餐和时长';
      return;
    }

    upgrading.value = true;
    errorMessage.value = '';

    try {
      const response = await api.post('/membership/upgrade', {
        level: selectedPlan.value,
        duration: selectedDuration.value,
      });

      if (response.success) {
        alert('会员升级成功！');
        await fetchMembershipInfo();
      } else {
        errorMessage.value = response.message || '升级失败，请稍后重试';
      }
    } catch (_error) {
      console.error('升级会员失败:', _error);
      errorMessage.value = _error.response?.data?.message || '升级失败，请稍后重试';
    } finally {
      upgrading.value = false;
    }
  };

  const initialize = async () => {
    await Promise.all([fetchMembershipInfo(), fetchPlans()]);
    loading.value = false;
  };

  return {
    loading,
    upgrading,
    errorMessage,
    membershipInfo,
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
  };
}
