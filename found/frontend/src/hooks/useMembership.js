import { ref, computed } from 'vue';
import api from '@/utils/api';

export function useMembership() {
  const membershipInfo = ref(null);
  const loadingMembership = ref(false);

  const fetchMembershipInfo = async () => {
    loadingMembership.value = true;
    try {
      const response = await api.get('/membership/info');
      if (response.success) {
        membershipInfo.value = response.data;
      }
    } catch (_error) {
      console.error('获取会员信息失败:', _error);
    } finally {
      loadingMembership.value = false;
    }
  };

  const isNearLimit = computed(() => {
    if (!membershipInfo.value) return false;
    const remaining = membershipInfo.value.remainingGenerations;
    return remaining !== Infinity && remaining <= 2 && remaining > 0;
  });

  const isAtLimit = computed(() => {
    if (!membershipInfo.value) return false;
    const remaining = membershipInfo.value.remainingGenerations;
    return remaining === 0;
  });

  const isExpiringSoon = computed(() => {
    if (
      !membershipInfo.value ||
      membershipInfo.value.level === 'free' ||
      membershipInfo.value.isExpired
    ) {
      return false;
    }
    const expireDate = new Date(membershipInfo.value.expireDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  });

  const daysUntilExpiration = computed(() => {
    if (
      !membershipInfo.value ||
      membershipInfo.value.level === 'free' ||
      membershipInfo.value.isExpired
    ) {
      return null;
    }
    const expireDate = new Date(membershipInfo.value.expireDate);
    const today = new Date();
    return Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
  });

  return {
    membershipInfo,
    loadingMembership,
    fetchMembershipInfo,
    isNearLimit,
    isAtLimit,
    isExpiringSoon,
    daysUntilExpiration,
  };
}
