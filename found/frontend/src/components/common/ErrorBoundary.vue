<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-container">
      <div class="error-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 class="error-title">组件加载失败</h2>
      <div class="error-info">
        <p class="error-message">
          {{ errorMessage }}
        </p>
        <div v-if="errorDetails" class="error-details">
          <h3>详细信息：</h3>
          <pre>{{ errorDetails }}</pre>
        </div>
      </div>
      <button class="retry-button" @click="resetError">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        重试
      </button>
    </div>
    <slot v-else />
  </div>
</template>

<script setup>
import { ref, onErrorCaptured, defineExpose } from 'vue';

const props = defineProps({
  defaultErrorMessage: {
    type: String,
    default: '组件发生未知错误',
  },
});

const emit = defineEmits(['error', 'retry']);

const hasError = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');
const error = ref(null);

// 捕获子组件错误
const handleError = (err, instance, info) => {
  hasError.value = true;

  // 解析错误信息，添加中文标注
  if (err.message) {
    if (err.message.includes('Failed to fetch dynamically imported module')) {
      errorMessage.value = '动态导入模块失败，请检查文件路径是否正确';
    } else if (err.message.includes('net::ERR_ABORTED')) {
      errorMessage.value = '网络请求被中止，请检查网络连接';
    } else if (err.message.includes('ERR_CONNECTION_REFUSED')) {
      errorMessage.value = '服务器连接被拒绝，请检查后端服务是否正常运行';
    } else {
      errorMessage.value = err.message;
    }
  } else {
    errorMessage.value = props.defaultErrorMessage;
  }

  // 保存详细错误信息
  errorDetails.value = info;
  error.value = err;

  // 触发错误事件
  emit('error', { error: err, instance, info, message: errorMessage.value });

  // 阻止错误继续向上传播
  return false;
};

// 重置错误状态
const resetError = () => {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  error.value = null;
  emit('retry');
  // 重新加载组件
  location.reload();
};

// 暴露方法
onErrorCaptured(handleError);

defineExpose({
  resetError,
  hasError,
  errorMessage,
});
</script>

<style scoped>
.error-boundary {
  width: 100%;
  min-height: 200px;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin: 20px;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 12px;
}

.error-info {
  max-width: 600px;
  margin-bottom: 24px;
}

.error-message {
  font-size: 16px;
  color: #b91c1c;
  margin-bottom: 16px;
}

.error-details {
  text-align: left;
  background: #fee2e2;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.error-details h3 {
  font-size: 14px;
  color: #991b1b;
  margin-bottom: 8px;
}

.error-details pre {
  font-size: 12px;
  color: #7f1d1d;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background: #b91c1c;
}
</style>
