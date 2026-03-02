<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">
        <span>{{ errorCode }}</span>
      </div>
      <div class="error-icon">
        <svg
          v-if="errorCode === 404"
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
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
        <svg
          v-else-if="errorCode === 500"
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <div class="error-message">
        <h1>{{ errorTitle }}</h1>
        <p>{{ errorDescription }}</p>
        <div v-if="suggestions.length > 0" class="error-suggestion">
          <h3>建议操作：</h3>
          <ul>
            <li v-for="(suggestion, index) in suggestions" :key="index">
              <span class="suggestion-icon">•</span>
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
      <div class="error-actions">
        <button v-if="showBack" class="back-button" @click="handleBack">
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
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          返回上一页
        </button>
        <button v-if="showHome" class="home-button" @click="handleHome">
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
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          返回首页
        </button>
        <button v-if="showRetry" class="retry-button" @click="handleRetry">
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
      <div v-if="footerText" class="error-footer">
        {{ footerText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  errorCode: {
    type: Number,
    default: 500,
  },
  errorTitle: {
    type: String,
    default: '',
  },
  errorDescription: {
    type: String,
    default: '',
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  showHome: {
    type: Boolean,
    default: true,
  },
  showRetry: {
    type: Boolean,
    default: false,
  },
  footerText: {
    type: String,
    default: '如有持续问题，请联系技术支持',
  },
});

const emit = defineEmits(['back', 'home', 'retry']);

// 根据错误码自动生成中文错误信息
const autoTitle = computed(() => {
  switch (props.errorCode) {
    case 400:
      return '请求参数错误';
    case 401:
      return '未授权访问';
    case 403:
      return '禁止访问';
    case 404:
      return '页面不存在';
    case 405:
      return '不允许的请求方法';
    case 408:
      return '请求超时';
    case 419:
      return '页面已过期';
    case 429:
      return '请求过于频繁';
    case 500:
      return '服务器内部错误';
    case 501:
      return '未实现的功能';
    case 502:
      return '网关错误';
    case 503:
      return '服务不可用';
    case 504:
      return '网关超时';
    case 505:
      return 'HTTP版本不支持';
    default:
      return '发生错误';
  }
});

// 根据错误码自动生成中文错误描述
const autoDescription = computed(() => {
  switch (props.errorCode) {
    case 400:
      return '您的请求参数不符合要求，请检查后重新提交。';
    case 401:
      return '您需要登录后才能访问此页面。';
    case 403:
      return '您没有权限访问此资源。';
    case 404:
      return '您访问的页面或资源不存在，可能已被删除或路径错误。';
    case 405:
      return '此请求方法不被允许，请检查请求方式。';
    case 408:
      return '请求处理超时，请稍后重试。';
    case 419:
      return '页面已过期，请刷新后重试。';
    case 429:
      return '您的请求过于频繁，请稍后再试。';
    case 500:
      return '服务器内部发生错误，我们的技术团队正在处理。';
    case 501:
      return '您请求的功能尚未实现。';
    case 502:
      return '网关服务器错误，请稍后重试。';
    case 503:
      return '服务器暂时不可用，请稍后再试。';
    case 504:
      return '网关超时，请稍后重试。';
    case 505:
      return '不支持的HTTP版本。';
    default:
      return '未知错误，请稍后重试。';
  }
});

// 根据错误码自动生成建议操作
const autoSuggestions = computed(() => {
  switch (props.errorCode) {
    case 404:
      return ['检查URL是否正确输入', '返回首页重新导航', '使用搜索功能查找您需要的内容'];
    case 500:
    case 502:
    case 503:
    case 504:
      return ['稍后刷新页面重试', '检查网络连接是否正常', '联系管理员报告问题'];
    case 401:
      return ['登录后再次尝试访问', '检查您的登录状态', '如果忘记密码，请使用找回密码功能'];
    case 429:
      return ['稍后再试', '减少请求频率', '检查是否有自动化脚本在运行'];
    default:
      return ['刷新页面重试', '检查网络连接', '联系技术支持'];
  }
});

// 最终使用的标题
const errorTitle = computed(() => {
  return props.errorTitle || autoTitle.value;
});

// 最终使用的描述
const errorDescription = computed(() => {
  return props.errorDescription || autoDescription.value;
});

// 最终使用的建议
const suggestions = computed(() => {
  return props.suggestions.length > 0 ? props.suggestions : autoSuggestions.value;
});

// 返回上一页
const handleBack = () => {
  emit('back');
  if (window.history.length > 1) {
    window.history.back();
  } else {
    router.push('/');
  }
};

// 返回首页
const handleHome = () => {
  emit('home');
  router.push('/');
};

// 重试
const handleRetry = () => {
  emit('retry');
  location.reload();
};
</script>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 20px;
  text-align: center;
  background-color: #fafafa;
}

.error-content {
  max-width: 600px;
  width: 100%;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-icon {
  color: #f87171;
  margin-bottom: 24px;
}

.error-message h1 {
  font-size: 28px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 12px;
}

.error-message p {
  font-size: 16px;
  color: #b91c1c;
  margin-bottom: 24px;
  line-height: 1.6;
}

.error-suggestion {
  text-align: left;
  background: #fee2e2;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.error-suggestion h3 {
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 12px;
}

.error-suggestion ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-suggestion li {
  font-size: 14px;
  color: #7f1d1d;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  line-height: 1.5;
}

.suggestion-icon {
  margin-right: 8px;
  font-size: 16px;
  color: #ef4444;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.back-button,
.home-button,
.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.back-button {
  background: #fecaca;
  color: #991b1b;
}

.back-button:hover {
  background: #fca5a5;
}

.home-button {
  background: #ef4444;
  color: white;
}

.home-button:hover {
  background: #dc2626;
}

.retry-button {
  background: #10b981;
  color: white;
}

.retry-button:hover {
  background: #059669;
}

.error-footer {
  font-size: 12px;
  color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .error-code {
    font-size: 80px;
  }

  .error-message h1 {
    font-size: 24px;
  }

  .error-message p {
    font-size: 14px;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .back-button,
  .home-button,
  .retry-button {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
}
</style>
