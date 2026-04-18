<template>
  <div v-if="showPopup" class="interest-popup-overlay" @click="handleSkip">
    <div class="interest-popup" @click.stop>
      <div class="interest-popup-header">
        <div class="interest-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <h3 class="interest-title">选择您感兴趣的领域</h3>
      </div>

      <div class="interest-content">
        <p class="interest-message">为您提供个性化的内容推荐，选择3-5个您感兴趣的领域</p>

        <div class="interest-tags">
          <button
            v-for="tag in interestTags"
            :key="tag"
            :class="['interest-tag', selectedTags.includes(tag) ? 'selected' : '']"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="interest-footer">
        <button class="btn-secondary" @click="handleSkip">
          <span>跳过</span>
        </button>
        <button class="btn-primary" @click="handleConfirm" :disabled="selectedTags.length < 3">
          <span>确认</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { useRoute } from 'vue-router';
import config from '@/config';
import { safeLocalStorage } from '@/store/user';

// 弹窗显示状态
const showPopup = ref(false);

// 路由
const route = useRoute();

// 兴趣标签列表
const interestTags = [
  '前端开发',
  '后端开发',
  '移动开发',
  '人工智能',
  '机器学习',
  '深度学习',
  '自然语言处理',
  '计算机视觉',
  '大语言模型',
  '数据分析',
  '云计算',
  '大数据',
  '网络安全',
  '区块链',
  '算法',
  '设计模式',
  '前端框架',
  '后端框架',
  '数据库',
  'DevOps',
  '测试',
  '产品设计',
  'UI设计',
  'UX设计',
];

// 已选择的标签
const selectedTags = ref([]);

// 定义事件
const emit = defineEmits(['interestSelected', 'skipped']);

// 获取用户store
const userStore = useUserStore();

// 检查是否需要显示兴趣选择弹窗
const shouldShowPopup = computed(() => {
  if (!userStore.isLogin) return false;

  // 如果在登录或注册页面，不显示
  if (['/login', '/register', '/auth/login', '/auth/register'].includes(route.path)) {
    return false;
  }

  // 检查用户是否已经选择了兴趣
  const hasSelectedInterests = userStore.userInfo?.learningInterests?.length > 0;
  if (hasSelectedInterests) return false;

  // 检查用户是否跳过了兴趣选择
  const hasSkipped = safeLocalStorage.get(`${config.storagePrefix}interestSkipped`);
  if (hasSkipped) return false;

  // 检查是否已经显示过（本次会话或持久化）
  const hasShown = safeLocalStorage.get(`${config.storagePrefix}interestModalShown`);
  if (hasShown) return false;

  return true;
});

// 切换标签选择状态
const toggleTag = tag => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else if (selectedTags.value.length < 5) {
    selectedTags.value.push(tag);
  }
};

// 确认选择
const handleConfirm = () => {
  if (selectedTags.value.length >= 3) {
    emit('interestSelected', selectedTags.value);
    closePopup();
  }
};

// 跳过选择
const handleSkip = () => {
  emit('skipped');
  closePopup();
};

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false;
};

// 组件挂载时检查是否需要显示弹窗
onMounted(() => {
  if (shouldShowPopup.value) {
    showPopup.value = true;
    // 一旦显示，就标记为已显示，避免多次弹出
    safeLocalStorage.set(`${config.storagePrefix}interestModalShown`, true);
  }
});

// 监听用户登录状态变化
watch(
  () => userStore.isLogin,
  newVal => {
    if (newVal && shouldShowPopup.value) {
      showPopup.value = true;
      safeLocalStorage.set(`${config.storagePrefix}interestModalShown`, true);
    }
  }
);

// 监听路由变化，如果在登录页显示了，则关闭它
watch(
  () => route.path,
  newPath => {
    if (['/login', '/register', '/auth/login', '/auth/register'].includes(newPath)) {
      showPopup.value = false;
    } else if (userStore.isLogin && !showPopup.value && shouldShowPopup.value) {
      // 如果从登录页跳出到其他页，且还没显示过，则显示
      showPopup.value = true;
      safeLocalStorage.set(`${config.storagePrefix}interestModalShown`, true);
    }
  }
);

// 导出方法，允许父组件控制弹窗
const togglePopup = value => {
  showPopup.value = value !== undefined ? value : !showPopup.value;
};

defineExpose({
  togglePopup,
});
</script>

<style scoped>
.interest-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.interest-popup {
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  padding: 24px;
  text-align: center;
  position: relative;
  animation: slideUp 0.3s ease;
}

.interest-popup-header {
  margin-bottom: 20px;
}

.interest-icon {
  margin-bottom: 12px;
  animation: pulse 2s infinite;
}

.interest-title {
  font-size: 24px;
  font-weight: bold;
  color: #2d3748;
  margin: 0;
}

.interest-content {
  margin-bottom: 24px;
}

.interest-message {
  font-size: 16px;
  color: #4a5568;
  margin-bottom: 20px;
}

.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.interest-tag {
  background-color: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
  border-radius: 25px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.interest-tag:hover {
  background-color: #ebf8ff;
  border-color: #bee3f8;
  color: #2b6cb0;
}

.interest-tag.selected {
  background-color: #4299e1;
  color: white;
  border-color: #4299e1;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.interest-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
}

.btn-primary {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3182ce;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 153, 225, 0.4);
}

.btn-primary:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  background-color: #ffffff;
  color: #4a5568;
  border: 2px solid #e2e8f0;
  border-radius: 25px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex: 1;
}

.btn-secondary:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
  transform: translateY(-2px);
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
