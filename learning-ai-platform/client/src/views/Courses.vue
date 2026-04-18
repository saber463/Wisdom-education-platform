<template>
  <div class="courses-page">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-tech-blue to-tech-purple text-white py-16 px-4 relative overflow-hidden">
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwIDIgMCAyIDJzMCAyIDAgMi0yIDItMiA0LTIgNHpNMCAwaDYwdjYwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"
      />
      <div class="container mx-auto max-w-6xl relative z-10">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">探索学习课程</h1>
        <p class="text-xl opacity-90 max-w-3xl">
          发现丰富的编程知识，从基础到高级，为您的技术成长保驾护航
        </p>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container mx-auto max-w-6xl px-4 py-12">
      <!-- 知识库下拉组件 -->
      <KnowledgeBaseDropdown
        v-model:expanded="kbExpanded"
        title="编程语言知识库"
        :category-id="selectedCategory || ''"
      />

      <!-- 分类筛选 -->
      <div class="categories-filter mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold text-white">课程分类</h2>
          <span class="text-sm text-gray-400">{{ categories.length }}个分类</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            :class="[
              'px-5 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105',
              selectedCategory === ''
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
            ]"
            @click="selectCategory('')"
          >
            全部
          </button>
          <button
            v-for="category in categories"
            :key="category._id"
            :class="[
              'px-5 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105',
              selectedCategory === category._id
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10',
            ]"
            @click="selectCategory(category._id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- 课程列表 -->
      <div class="courses-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="category in filteredCategories"
          :key="category._id"
          class="course-card bg-white/5 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] border border-white/10"
        >
          <!-- 分类卡片头部 -->
          <div
            class="course-card-header bg-gradient-to-r from-tech-blue to-tech-purple text-white p-6 relative overflow-hidden"
          >
            <!-- VIP标识 -->
            <div v-if="category.isVIP" class="absolute top-3 right-3 z-10">
              <span class="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                <i class="fa fa-crown"></i> VIP
              </span>
            </div>

            <!-- 装饰元素 -->
            <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div class="absolute bottom-6 right-6 w-12 h-12 bg-white/10 rounded-full" />

            <div class="flex items-center justify-between relative z-10">
              <h3 class="text-xl font-bold">
                {{ category.name }}
              </h3>
              <div
                class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              >
                <i class="fa fa-code text-lg" />
              </div>
            </div>
            <p class="text-white/80 text-sm mt-3 relative z-10">
              {{ category.description }}
            </p>
            <!-- 价格信息 -->
            <div class="mt-3 flex items-center gap-2 relative z-10">
              <span v-if="category.isVIP" class="text-amber-300 font-bold">
                <i class="fa fa-crown mr-1"></i>会员免费
              </span>
              <span v-else class="text-white/90">
                ¥{{ category.price || 0 }}
              </span>
              <span v-if="!category.isVIP && category.originalPrice" class="text-white/50 line-through text-sm">
                ¥{{ category.originalPrice }}
              </span>
            </div>
          </div>

          <!-- 分类卡片内容 -->
          <div class="course-card-body p-6">
            <!-- 统计信息 -->
            <div class="space-y-4 mb-6">
              <div class="flex items-center text-sm text-gray-300">
                <div
                  class="w-8 h-8 bg-tech-blue/20 rounded-full flex items-center justify-center mr-3 text-tech-blue"
                >
                  <i class="fa fa-book" />
                </div>
                <span>知识点数量：{{ category.knowledgePointCount || 0 }}</span>
              </div>

              <!-- 进度指示器 -->
              <div class="pt-2">
                <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>学习难度</span>
                  <span>{{ ['入门', '初级', '中级', '高级'][category.level || 0] || '入门' }}</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2">
                  <div
                    class="bg-gradient-to-r from-tech-blue to-tech-purple h-2 rounded-full transition-all duration-500 ease-out"
                    :style="{ width: `${(category.level || 0) * 25}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <!-- 收藏按钮 -->
                <button
                  class="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all transform hover:scale-110 border border-white/10"
                  aria-label="收藏"
                >
                  <i class="fa fa-heart-o" />
                </button>

                <!-- 分享按钮 -->
                <button
                  class="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-tech-blue transition-all transform hover:scale-110 border border-white/10"
                  aria-label="分享"
                >
                  <i class="fa fa-share-alt" />
                </button>
              </div>

              <!-- 开始学习按钮 -->
              <router-link
                :to="`/knowledge-base?category=${category._id}`"
                class="inline-flex items-center px-5 py-3 bg-gradient-to-r from-tech-blue to-tech-purple hover:from-tech-blue/90 hover:to-tech-purple/90 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-tech-blue/25"
              >
                开始学习
                <i class="fa fa-arrow-right ml-2" />
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredCategories.length === 0" class="text-center py-20">
        <div
          class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10"
        >
          <i class="fa fa-search text-3xl text-gray-400" />
        </div>
        <h3 class="text-2xl font-semibold text-white mb-2">暂无课程</h3>
        <p class="text-gray-400 mb-8">当前分类下暂无课程，请尝试其他分类</p>
        <button
          class="px-6 py-3 bg-gradient-to-r from-tech-blue to-tech-purple hover:from-tech-blue/90 hover:to-tech-purple/90 text-white font-medium rounded-lg transition-colors shadow-lg shadow-tech-blue/25"
          @click="selectCategory('')"
        >
          查看全部分类
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="loading-spinner" />
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="text-center py-20">
        <div
          class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"
        >
          <i class="fa fa-exclamation-circle text-3xl text-red-400" />
        </div>
        <h3 class="text-2xl font-semibold text-white mb-2">加载失败</h3>
        <p class="text-gray-400 mb-8">
          {{ error }}
        </p>
        <button
          class="px-6 py-3 bg-gradient-to-r from-tech-blue to-tech-purple hover:from-tech-blue/90 hover:to-tech-purple/90 text-white font-medium rounded-lg transition-colors shadow-lg shadow-tech-blue/25"
          @click="fetchCategories"
        >
          重试
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import KnowledgeBaseDropdown from '@/components/business/KnowledgeBaseDropdown.vue';

// 状态管理
const loading = ref(false);
const error = ref('');
const categories = ref([]);
const selectedCategory = ref('');
const kbExpanded = ref(false);

// Mock数据：API失败时的fallback
const mockCategories = [
  { _id: 'mock1', name: 'JavaScript', description: '从ES6到现代JS，掌握前端核心语言', knowledgePointCount: 128, level: 2, cover: 'https://ui-avatars.com/api/?name=JS&background=random', isVIP: false, price: 299, originalPrice: 499 },
  { _id: 'mock2', name: 'Python', description: '数据分析、机器学习、爬虫全覆盖', knowledgePointCount: 156, level: 2, cover: 'https://ui-avatars.com/api/?name=Py&background=random', isVIP: true, price: 0, originalPrice: 599 },
  { _id: 'mock3', name: 'Java', description: '面向对象编程到SpringBoot企业开发', knowledgePointCount: 204, level: 3, cover: 'https://ui-avatars.com/api/?name=Java&background=random', isVIP: false, price: 399, originalPrice: 699 },
  { _id: 'mock4', name: 'Vue3', description: 'Composition API + Pinia + Vite全栈实战', knowledgePointCount: 98, level: 2, cover: 'https://ui-avatars.com/api/?name=Vue&background=random', isVIP: true, price: 0, originalPrice: 499 },
  { _id: 'mock5', name: 'React', description: 'Hooks+Redux+Next.js现代React开发', knowledgePointCount: 112, level: 2, cover: 'https://ui-avatars.com/api/?name=React&background=random', isVIP: false, price: 349, originalPrice: 549 },
  { _id: 'mock6', name: '数据结构与算法', description: '从基础到LeetCode高频题，面试必备', knowledgePointCount: 180, level: 3, cover: 'https://ui-avatars.com/api/?name=Algo&background=random', isVIP: true, price: 0, originalPrice: 699 },
  { _id: 'mock7', name: '数据库', description: 'MySQL/PostgreSQL/Redis从入门到优化', knowledgePointCount: 89, level: 2, cover: 'https://ui-avatars.com/api/?name=DB&background=random', isVIP: false, price: 279, originalPrice: 449 },
  { _id: 'mock8', name: 'Go语言', description: '并发编程、微服务、云原生开发', knowledgePointCount: 76, level: 2, cover: 'https://ui-avatars.com/api/?name=Go&background=random', isVIP: true, price: 0, originalPrice: 599 },
  { _id: 'mock9', name: 'DevOps', description: 'Docker/K8s/CI-CD流水线实战', knowledgePointCount: 64, level: 3, cover: 'https://ui-avatars.com/api/?name=Ops&background=random', isVIP: false, price: 459, originalPrice: 799 },
  { _id: 'mock10', name: '英语学习', description: '四六级、雅思、托福、商务英语', knowledgePointCount: 220, level: 1, cover: 'https://ui-avatars.com/api/?name=Eng&background=random', isVIP: false, price: 199, originalPrice: 399 },
];

// 计算属性：过滤后的分类
const filteredCategories = computed(() => {
  if (!selectedCategory.value) {
    return categories.value;
  }
  return categories.value.filter(category => category._id === selectedCategory.value);
});

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await axios.get('/api/categories');
    categories.value = response.data.data;
    // 若API返回空数据，使用mock
    if (!categories.value || categories.value.length === 0) {
      categories.value = mockCategories;
    }
  } catch (err) {
    console.error('获取分类失败:', err);
    // API失败使用mock数据，不显示错误
    categories.value = mockCategories;
  } finally {
    loading.value = false;
  }
};

// 选择分类
const selectCategory = categoryId => {
  selectedCategory.value = categoryId;
};

// 页面挂载时获取数据
onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.courses-page {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.1);
  border-top: 5px solid var(--tech-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.course-card:hover .course-card-header {
  background: linear-gradient(135deg, var(--tech-blue) 0%, var(--tech-purple) 100%);
}
</style>
