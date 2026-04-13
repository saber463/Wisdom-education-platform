<template>
  <div class="coupons-page">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- 页面标题 -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold mb-2 text-white">我的优惠券</h1>
          <p class="text-gray-400">查看和管理您的所有优惠券</p>
        </div>

        <!-- 优惠券筛选标签 -->
        <div class="flex flex-wrap space-x-2 mb-6">
          <button
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              activeTab === 'all'
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
            ]"
            @click="activeTab = 'all'"
          >
            全部
          </button>
          <button
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              activeTab === 'valid'
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
            ]"
            @click="activeTab = 'valid'"
          >
            可用 ({{ walletStore.validCouponsCount }})
          </button>
          <button
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              activeTab === 'expired'
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
            ]"
            @click="activeTab = 'expired'"
          >
            已过期
          </button>
          <button
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              activeTab === 'expiring'
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
            ]"
            @click="activeTab = 'expiring'"
          >
            即将到期 ({{ walletStore.expiringCouponsCount }})
          </button>
          <button
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              activeTab === 'used'
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
            ]"
            @click="activeTab = 'used'"
          >
            已使用
          </button>
        </div>

        <!-- 优惠券卡片列表 -->
        <div v-if="filteredCoupons.length === 0" class="text-center py-16 text-gray-400">
          <i class="fa fa-ticket text-5xl mb-4" />
          <h3 class="text-lg font-medium mb-1 text-white">暂无优惠券</h3>
          <p class="text-sm">快去参与活动领取更多优惠券吧！</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="coupon in filteredCoupons"
            :key="coupon.id"
            :class="[
              'glass-card p-5 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1',
              coupon.isUsed ? 'opacity-60' : '',
            ]"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-medium text-lg text-white">
                  {{ coupon.name || '无门槛优惠券' }}
                </h3>
                <div class="flex items-baseline mt-2">
                  <span class="text-4xl font-bold text-tech-blue">{{ coupon.discount * 10 }}折</span>
                  <span class="text-sm text-gray-400 ml-2">无门槛</span>
                </div>
              </div>
              <div class="text-right">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium',
                    coupon.isUsed
                      ? 'bg-gray-600/50 text-gray-300'
                      : activeTab === 'expired'
                        ? 'bg-red-600/30 text-red-300'
                        : activeTab === 'expiring'
                          ? 'bg-yellow-600/30 text-yellow-300'
                          : 'bg-green-600/30 text-green-300',
                  ]"
                >
                  {{
                    coupon.isUsed
                      ? '已使用'
                      : activeTab === 'expired'
                        ? '已过期'
                        : activeTab === 'expiring'
                          ? '即将到期'
                          : '可用'
                  }}
                </span>
              </div>
            </div>

            <div class="border-t border-white/10 pt-4">
              <div class="flex justify-between items-center text-sm mb-3">
                <span class="text-gray-400">有效期至</span>
                <span class="text-white font-medium">{{
                  new Date(coupon.expiryDate).toLocaleString()
                }}</span>
              </div>
              <div v-if="coupon.description" class="text-sm text-gray-400 mb-4">
                {{ coupon.description }}
              </div>
              <div v-if="!coupon.isUsed && activeTab !== 'expired'" class="mt-4">
                <button class="w-full btn-primary" @click="useCoupon(coupon)">
                  <i class="fa fa-check-circle mr-2" /> 立即使用
                </button>
              </div>
              <div v-else-if="coupon.isUsed" class="text-sm text-gray-400 mt-4">
                <i class="fa fa-clock-o mr-1" /> 使用时间:
                {{ new Date(coupon.usedAt).toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWalletStore } from '@/store/wallet';
import { useNotificationStore } from '@/store/notification';

const walletStore = useWalletStore();
const notificationStore = useNotificationStore();

// 优惠券标签
const activeTab = ref('all');

// 过滤优惠券
const filteredCoupons = computed(() => {
  if (activeTab.value === 'all') {
    return walletStore.coupons;
  } else if (activeTab.value === 'valid') {
    return walletStore.validCoupons;
  } else if (activeTab.value === 'expired') {
    return walletStore.expiredCoupons;
  } else if (activeTab.value === 'expiring') {
    return walletStore.expiringCoupons;
  } else if (activeTab.value === 'used') {
    return walletStore.coupons.filter(coupon => coupon.isUsed);
  }
  return [];
});

// 使用优惠券
const useCoupon = coupon => {
  const success = walletStore.useCoupon(coupon.id);
  if (success) {
    notificationStore.addNotification({
      title: '使用成功',
      content: `您已成功使用 ${coupon.discount * 10} 折优惠券`,
      type: 'success',
    });
  } else {
    notificationStore.addNotification({
      title: '使用失败',
      content: '优惠券已过期或已使用',
      type: 'error',
    });
  }
};
</script>

<style scoped>
.coupons-page {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 242, 255, 0.3);
  padding: 0.75rem 1.5rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 242, 255, 0.4);
}
</style>
