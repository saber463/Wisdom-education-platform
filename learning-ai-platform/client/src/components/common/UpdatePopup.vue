<template>
  <div v-if="showPopup" class="update-popup-overlay" @click="closePopup">
    <div class="update-popup" @click.stop>
      <div class="update-popup-header">
        <div class="update-icon">
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <h3 class="update-title">发现新版本！</h3>
      </div>

      <div class="update-content">
        <p class="update-message">🎉 学习AI平台已更新至最新版本</p>
        <ul class="update-features">
          <li class="feature-item">
            <span class="feature-icon">🔍</span>
            <span class="feature-text"
              >新增敏感词检测功能，应用于用户资料和学习社区，维护健康环境</span
            >
          </li>
          <li class="feature-item">
            <span class="feature-icon">👤</span>
            <span class="feature-text">优化用户资料更新功能，支持修改用户名、邮箱和个人简介</span>
          </li>
          <li class="feature-item">
            <span class="feature-icon">📝</span>
            <span class="feature-text">实现错题本页面组件，帮助用户针对性复习</span>
          </li>
          <li class="feature-item">
            <span class="feature-icon">📍</span>
            <span class="feature-text">在导航栏添加下划线指示当前页面，提升用户体验</span>
          </li>
          <li class="feature-item">
            <span class="feature-icon">📚</span>
            <span class="feature-text">更新项目介绍文档，完善技术栈和功能说明</span>
          </li>
          <li class="feature-item">
            <span class="feature-icon">🔒</span>
            <span class="feature-text">增强数据验证和错误处理，提升系统稳定性</span>
          </li>
        </ul>
      </div>

      <div class="update-footer">
        <button class="btn-primary" @click="closePopup">
          <span>立即体验</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 ml-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 弹窗显示状态
const showPopup = ref(false);

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false;
};

// 组件挂载时显示弹窗
onMounted(() => {
  showPopup.value = true;
});

// 导出方法，允许父组件控制弹窗
const togglePopup = value => {
  showPopup.value = value !== undefined ? value : !showPopup.value;
};

defineExpose({
  togglePopup,
});
</script>

<style scoped>
.update-popup-overlay {
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

.update-popup {
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
  padding: 24px;
  text-align: center;
  position: relative;
  animation: slideUp 0.3s ease;
}

.update-popup-header {
  margin-bottom: 20px;
}

.update-icon {
  margin-bottom: 12px;
  animation: pulse 2s infinite;
}

.update-title {
  font-size: 24px;
  font-weight: bold;
  color: #2d3748;
  margin: 0;
}

.update-content {
  margin-bottom: 24px;
}

.update-message {
  font-size: 16px;
  color: #4a5568;
  margin-bottom: 16px;
}

.update-features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #718096;
}

.feature-icon {
  margin-right: 10px;
  font-size: 16px;
}

.update-footer {
  display: flex;
  justify-content: center;
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
}

.btn-primary:hover {
  background-color: #3182ce;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 153, 225, 0.4);
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
