<template>
  <div class="browse-history-page">
    <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-dark">浏览历史</h2>
        <button class="text-red-500 hover:underline text-sm" @click="clearHistory">
          <i class="fa fa-trash-o mr-1" /> 清空历史
        </button>
      </div>

      <div class="card">
        <div class="p-6">
          <div v-if="!historyList.length" class="text-center py-10">
            <i class="fa fa-history text-gray-300 text-4xl mb-3" />
            <p class="text-gray-500">暂无浏览历史</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(item, idx) in historyList"
              :key="idx"
              class="flex items-center p-3 border-b border-gray-100 last:border-0"
            >
              <div
                class="w-16 h-16 bg-neutral rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
              >
                <i class="fa fa-file-text-o text-gray-400 text-xl" />
              </div>
              <div class="flex-grow">
                <router-link
                  :to="item.path"
                  class="font-medium hover:text-primary transition-colors"
                >
                  {{ item.title }}
                </router-link>
                <p class="text-gray-500 text-sm mt-1">
                  {{ item.timeStr }}
                </p>
              </div>
              <button class="text-gray-400 hover:text-red-500" @click="removeItem(item.id)">
                <i class="fa fa-times" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

// 浏览历史列表
const historyList = computed(() => userStore.formattedHistory);

// 清空历史
const clearHistory = () => {
  if (confirm('确定要清空所有浏览历史吗？')) {
    userStore.clearHistory();
  }
};

// 移除单个历史项
const removeItem = id => {
  userStore.removeBrowseHistory(id);
};
</script>

<style scoped>
.browse-history-page {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.text-dark {
  color: #e5e7eb;
}
</style>
