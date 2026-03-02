<template>
  <div class="test-container">
    <div class="test-header">
      <h1 class="test-title">后端开发能力测试</h1>
      <div class="test-info">
        <span class="test-time">限时：90分钟</span>
        <span class="test-questions">共40题</span>
      </div>
    </div>

    <div class="test-content">
      <div class="test-intro">
        <h2>测试说明</h2>
        <ul>
          <li>本测试包含40道后端开发相关题目</li>
          <li>测试涵盖Node.js、Express、数据库设计、API开发等知识点</li>
          <li>每道题限时2.5分钟，超时自动提交</li>
          <li>测试结束后将生成详细的能力评估报告</li>
        </ul>
      </div>

      <div class="test-start-section">
        <button class="btn-primary test-start-btn" @click="startTest">开始测试</button>
        <div class="test-warning">
          <p>⚠️ 测试开始后将无法暂停，请确保有足够时间完成</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { testApi } from '@/utils/api';
import { useNotificationStore } from '@/store/notification';

const router = useRouter();
const notificationStore = useNotificationStore();
const loading = ref(false);

// 开始测试
const startTest = async () => {
  try {
    loading.value = true;
    // 获取测试列表，找到后端开发测试
    const response = await testApi.getList();
    const tests = response.data.data;

    // 找到分类为后端开发的测试
    const backendTest = tests.find(test => {
      // 如果test.category是对象，使用test.category.name；否则使用test.category
      const categoryName = typeof test.category === 'object' ? test.category.name : test.category;
      return categoryName.includes('后端') || categoryName.includes('backend');
    });

    if (backendTest) {
      // 跳转到测试详情页
      router.push({ name: 'TestDetail', params: { id: backendTest._id } });
    } else {
      notificationStore.error('未找到后端开发测试');
    }
  } catch (error) {
    console.error('开始测试失败:', error);
    notificationStore.error('开始测试失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.test-header {
  text-align: center;
  margin-bottom: 3rem;
}

.test-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.test-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 1.1rem;
  color: var(--text-color-secondary);
}

.test-content {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
}

.test-intro {
  margin-bottom: 3rem;
}

.test-intro h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-color-primary);
}

.test-intro ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  line-height: 2;
}

.test-intro li {
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.test-start-section {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.test-start-btn {
  font-size: 1.3rem;
  padding: 1rem 3rem;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.test-start-btn:hover {
  background-color: var(--primary-color-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
}

.test-warning {
  margin-top: 1.5rem;
  color: var(--warning-color);
  font-size: 0.9rem;
}
</style>
