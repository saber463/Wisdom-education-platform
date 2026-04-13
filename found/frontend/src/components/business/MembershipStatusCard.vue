<template>
  <div v-if="membershipInfo" class="max-w-2xl mx-auto mb-6">
    <div class="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/10">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <span class="px-4 py-1.5 rounded-full text-sm font-medium" :class="levelBadgeClass">
            {{ levelNames[membershipInfo.level] }}
          </span>
          <span
            v-if="membershipInfo.level !== 'free' && !membershipInfo.isExpired"
            class="text-sm text-gray-400"
          >
            有效期至：{{ new Date(membershipInfo.expireDate).toLocaleDateString('zh-CN') }}
          </span>
          <span v-if="membershipInfo.isExpired" class="text-sm text-red-400 font-medium">
            已过期
          </span>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-xs text-gray-400 mb-1">今日已用</div>
            <div
              class="text-lg font-bold"
              :class="isNearLimit ? 'text-orange-400' : 'text-tech-blue'"
            >
              {{ membershipInfo.dailyGenerationCount }}/{{
                membershipInfo.dailyGenerationLimit === Infinity
                  ? '∞'
                  : membershipInfo.dailyGenerationLimit
              }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-400 mb-1">剩余次数</div>
            <div
              class="text-lg font-bold"
              :class="isNearLimit ? 'text-orange-400' : 'text-tech-blue'"
            >
              {{
                membershipInfo.remainingGenerations === Infinity
                  ? '无限'
                  : membershipInfo.remainingGenerations
              }}
            </div>
          </div>
        </div>
      </div>

      <LimitAlert
        v-if="isNearLimit && !isAtLimit"
        type="warning"
        :message="`今日剩余次数仅剩 ${membershipInfo.remainingGenerations} 次`"
        link-text="升级会员"
      />

      <LimitAlert v-if="isAtLimit" type="error" message="今日生成次数已用完" link-text="立即升级" />

      <LimitAlert
        v-if="isExpiringSoon"
        type="warning"
        :message="`您的会员即将在 ${daysUntilExpiration} 天后过期`"
        link-text="立即续费"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import LimitAlert from './LimitAlert.vue';

const props = defineProps({
  membershipInfo: {
    type: Object,
    default: null,
  },
});

const levelNames = {
  free: '免费用户',
  silver: '白银会员',
  gold: '黄金会员',
};

const levelBadgeClass = computed(() => {
  const level = props.membershipInfo?.level || 'free';
  return {
    free: 'bg-gray-100 text-gray-600',
    silver: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700',
    gold: 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-800',
  }[level];
});

const isNearLimit = computed(() => {
  if (!props.membershipInfo) return false;
  const remaining = props.membershipInfo.remainingGenerations;
  return remaining !== Infinity && remaining <= 2 && remaining > 0;
});

const isAtLimit = computed(() => {
  if (!props.membershipInfo) return false;
  const remaining = props.membershipInfo.remainingGenerations;
  return remaining === 0;
});

const isExpiringSoon = computed(() => {
  if (
    !props.membershipInfo ||
    props.membershipInfo.level === 'free' ||
    props.membershipInfo.isExpired
  ) {
    return false;
  }
  const expireDate = new Date(props.membershipInfo.expireDate);
  const today = new Date();
  const daysUntilExpiration = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
});

const daysUntilExpiration = computed(() => {
  if (
    !props.membershipInfo ||
    props.membershipInfo.level === 'free' ||
    props.membershipInfo.isExpired
  ) {
    return null;
  }
  const expireDate = new Date(props.membershipInfo.expireDate);
  const today = new Date();
  return Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
});
</script>
