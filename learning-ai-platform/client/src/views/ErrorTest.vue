<template>
  <div class="error-test-container">
    <h1>错误处理功能测试</h1>
    <div class="test-section">
      <h2>异步异常测试</h2>
      <button class="test-button error" @click="testAsyncError">触发异步异常</button>
      <button class="test-button error" @click="testApiError">触发API错误</button>
      <button class="test-button error" @click="testNetworkError">触发网络错误</button>
    </div>
    <div class="test-section">
      <h2>错误边界测试</h2>
      <button class="test-button error" @click="testComponentError">触发组件错误</button>
      <button class="test-button error" @click="testDynamicImportError">触发动态导入错误</button>
    </div>
    <div class="test-section">
      <h2>日志记录测试</h2>
      <button class="test-button info" @click="testLogger">测试日志记录</button>
    </div>
    <div class="test-section">
      <h2>正常功能</h2>
      <button class="test-button success" @click="clear">清除状态</button>
    </div>

    <div v-if="result" class="test-result">
      <h3>测试结果</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import request from '@/utils/request';
import logger from '@/utils/logger';

const result = ref(null);

// 测试异步异常
const testAsyncError = async () => {
  try {
    result.value = { type: '异步异常测试', status: 'running' };
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('测试异步操作失败'));
      }, 1000);
    });
  } catch (error) {
    logger.error('异步异常测试失败', error);
    result.value = {
      type: '异步异常测试',
      status: 'error',
      message: error.message,
    };
  }
};

// 测试API错误
const testApiError = async () => {
  try {
    result.value = { type: 'API错误测试', status: 'running' };
    // 调用不存在的API
    await request.get('/api/nonexistent-endpoint');
  } catch (error) {
    logger.error('API错误测试失败', error);
    result.value = {
      type: 'API错误测试',
      status: 'error',
      message: error.message,
    };
  }
};

// 测试网络错误
const testNetworkError = async () => {
  try {
    result.value = { type: '网络错误测试', status: 'running' };
    // 调用不存在的域名
    await request.get('http://nonexistent-domain-12345.com/api/test');
  } catch (error) {
    logger.error('网络错误测试失败', error);
    result.value = {
      type: '网络错误测试',
      status: 'error',
      message: error.message,
    };
  }
};

// 测试组件错误
const testComponentError = () => {
  result.value = { type: '组件错误测试', status: 'running' };
  // 触发一个会导致组件错误的操作
  throw new Error('测试组件渲染错误');
};

// 测试动态导入错误
const testDynamicImportError = async () => {
  result.value = { type: '动态导入错误测试', status: 'running' };
  try {
    // 尝试动态导入不存在的组件，使用/* @vite-ignore */避免编译时错误
    const componentPath = '@/components/NonexistentComponent.vue';
    const importedModule = await import(/* @vite-ignore */ componentPath);
    result.value = { type: '动态导入错误测试', status: 'success', data: importedModule };
  } catch (error) {
    logger.error('动态导入错误测试失败', error);
    result.value = { type: '动态导入错误测试', status: 'error', message: error.message };
  }
};

// 测试日志记录
const testLogger = () => {
  logger.debug('调试日志测试');
  logger.info('信息日志测试');
  logger.warn('警告日志测试');
  logger.error('错误日志测试');
  logger.fatal('致命错误日志测试');
  result.value = {
    type: '日志记录测试',
    status: 'success',
    message: '所有级别的日志已记录，请查看控制台',
  };
};

// 清除状态
const clear = () => {
  result.value = null;
};
</script>

<style scoped>
.error-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.test-button {
  margin: 5px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.test-button.error {
  background-color: #ff4d4f;
  color: white;
}

.test-button.error:hover {
  background-color: #ff7875;
}

.test-button.info {
  background-color: #1890ff;
  color: white;
}

.test-button.info:hover {
  background-color: #40a9ff;
}

.test-button.success {
  background-color: #52c41a;
  color: white;
}

.test-button.success:hover {
  background-color: #73d13d;
}

.test-result {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f0f0f0;
}

pre {
  background-color: #282c34;
  color: #abb2bf;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
