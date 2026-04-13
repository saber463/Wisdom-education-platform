<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10">
    <div class="test-container glass-card rounded-2xl p-8 shadow-xl">
      <div class="test-header text-center mb-8">
        <div class="inline-block mb-4">
          <div
            class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto"
          >
            <i class="fa fa-code text-white text-3xl" />
          </div>
        </div>
        <h1 class="test-title text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          前端开发能力测试
        </h1>
        <div
          class="test-info flex flex-wrap justify-center gap-4 text-sm md:text-base text-gray-500"
        >
          <div class="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full shadow-sm">
            <i class="fa fa-clock-o text-blue-500" />
            <span class="test-time font-medium">限时：60分钟</span>
          </div>
          <div class="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full shadow-sm">
            <i class="fa fa-question-circle text-blue-500" />
            <span class="test-questions font-medium">共30题</span>
          </div>
        </div>
      </div>

      <div class="test-content">
        <div class="test-intro mb-10">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <i class="fa fa-info-circle text-blue-500" />
            测试说明
          </h2>
          <ul class="space-y-4">
            <li
              class="flex items-start gap-3 p-3 bg-white/70 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <i class="fa fa-check text-xs" />
              </div>
              <span class="text-gray-700">本测试包含30道前端开发相关题目</span>
            </li>
            <li
              class="flex items-start gap-3 p-3 bg-white/70 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <i class="fa fa-check text-xs" />
              </div>
              <span class="text-gray-700">测试涵盖HTML、CSS、JavaScript、Vue.js等知识点</span>
            </li>
            <li
              class="flex items-start gap-3 p-3 bg-white/70 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <i class="fa fa-check text-xs" />
              </div>
              <span class="text-gray-700">每道题限时2分钟，超时自动提交</span>
            </li>
            <li
              class="flex items-start gap-3 p-3 bg-white/70 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <i class="fa fa-check text-xs" />
              </div>
              <span class="text-gray-700">测试结束后将生成详细的能力评估报告</span>
            </li>
          </ul>
        </div>

        <div class="test-start-section text-center pt-6 border-t border-gray-100">
          <button
            class="btn-primary test-start-btn relative overflow-hidden group"
            @click="startTest"
          >
            <span class="relative z-10 flex items-center gap-2">
              <i class="fa fa-play" />
              开始测试
            </span>
            <span
              class="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
            />
          </button>
          <div
            class="test-warning mt-4 text-sm text-yellow-600 bg-yellow-50/70 px-4 py-3 rounded-lg inline-block"
          >
            <i class="fa fa-exclamation-triangle mr-2" />
            <span>测试开始后将无法暂停，请确保有足够时间完成</span>
          </div>
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
    // 获取测试列表，找到前端开发测试
    const response = await testApi.getList();
    const tests = response.data.data;

    // 找到分类为前端开发的测试
    const frontendTest = tests.find(test => {
      // 如果test.category是对象，使用test.category.name；否则使用test.category
      const categoryName = typeof test.category === 'object' ? test.category.name : test.category;
      return categoryName.includes('前端') || categoryName.includes('frontend');
    });

    if (frontendTest) {
      // 跳转到测试详情页
      router.push({ name: 'TestDetail', params: { id: frontendTest._id } });
    } else {
      notificationStore.error('未找到前端开发测试');
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
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.test-header {
  text-align: center;
  margin-bottom: 2rem;
}

.test-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary-color);
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.test-info {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  font-size: 1rem;
  color: var(--text-color-secondary);
  flex-wrap: wrap;
}

.test-content {
  padding: 2rem;
}

.test-intro {
  margin-bottom: 2.5rem;
}

.test-intro h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-color-primary);
  font-weight: 700;
}

.test-intro ul {
  list-style-type: none;
  padding-left: 0;
  line-height: 1.6;
}

.test-intro li {
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.test-start-section {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.test-start-btn {
  font-size: 1.3rem;
  padding: 1.2rem 4rem;
  border-radius: 50px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.test-start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
}

.test-start-btn:active {
  transform: translateY(-1px);
}

.test-warning {
  margin-top: 1.5rem;
  color: var(--warning-color);
  font-size: 0.95rem;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-title {
    font-size: 2rem;
  }

  .test-start-btn {
    font-size: 1.1rem;
    padding: 1rem 3rem;
  }

  .test-intro h2 {
    font-size: 1.5rem;
  }
}
</style>
