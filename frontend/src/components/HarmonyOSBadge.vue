<template>
  <div v-if="isHarmonyOS" class="harmonyos-badge">
    <div class="badge-icon">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
    <span class="badge-text">鸿蒙适配</span>
    <span v-if="version" class="badge-version">{{ version }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getHarmonyOSInfo } from '@/utils/harmonyos-detector';

const isHarmonyOS = ref(false);
const version = ref<string>();

onMounted(() => {
  const info = getHarmonyOSInfo();
  isHarmonyOS.value = info.isHarmonyOS;
  version.value = info.version;
  
  if (info.isHarmonyOS) {
    console.log('检测到鸿蒙设备:', info);
  }
});
</script>

<style scoped>
.harmonyos-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  animation: fadeIn 0.5s ease-in-out;
}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-text {
  letter-spacing: 0.5px;
}

.badge-version {
  opacity: 0.9;
  font-size: 11px;
  padding-left: 4px;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .harmonyos-badge {
    font-size: 11px;
    padding: 3px 10px;
  }
  
  .badge-version {
    font-size: 10px;
  }
}
</style>
