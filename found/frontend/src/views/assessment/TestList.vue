<template>
  <div class="test-list-container">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8 text-center">
        <div class="inline-block relative mb-4">
          <div
            class="absolute inset-0 bg-gradient-to-r from-tech-blue to-tech-purple rounded-2xl blur-xl opacity-30"
          />
          <h1
            class="relative text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink"
          >
            学习测试
          </h1>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
          通过测试了解您的知识掌握情况，发现薄弱环节，提升学习效率
        </p>
      </div>

      <!-- 测试分类筛选 -->
      <div class="glass-card rounded-2xl p-6 mb-8">
        <div class="flex flex-wrap gap-3 justify-center">
          <button
            v-for="category in categories"
            :key="category"
            :class="[
              'px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105',
              selectedCategory === category
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-neon-blue'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            ]"
            @click="selectedCategory = category"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- 测试列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="test in filteredTests"
          :key="test.id"
          class="glass-card rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-tech-blue/30 group relative overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-tech-blue/5 via-transparent to-tech-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div class="relative">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3
                  class="text-xl font-bold text-gray-800 dark:text-white mb-3 transition-colors duration-300 group-hover:text-tech-blue"
                >
                  {{ test.title }}
                </h3>
                <div
                  class="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  <span
                    class="flex items-center gap-1.5 bg-gradient-to-r from-tech-blue/10 to-tech-blue/5 px-3 py-1.5 rounded-full border border-tech-blue/20"
                  >
                    <i class="fa fa-question-circle text-tech-blue" />{{ test.totalQuestions }}题
                  </span>
                  <span
                    class="flex items-center gap-1.5 bg-gradient-to-r from-tech-purple/10 to-tech-purple/5 px-3 py-1.5 rounded-full border border-tech-purple/20"
                  >
                    <i class="fa fa-clock-o text-tech-purple" />{{ test.duration }}分钟
                  </span>
                  <span
                    class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                    :class="{
                      'bg-green-100 text-green-800 border-green-200': test.difficulty === '简单',
                      'bg-yellow-100 text-yellow-800 border-yellow-200': test.difficulty === '中等',
                      'bg-red-100 text-red-800 border-red-200': test.difficulty === '困难',
                    }"
                    >{{ test.difficulty }}</span
                  >
                </div>
              </div>
            </div>
            <div class="mt-3 text-gray-600 dark:text-gray-300 line-clamp-3 h-20 overflow-hidden">
              {{ test.description }}
            </div>
            <div
              class="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-sm"
            >
              <span class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <i class="fa fa-folder text-tech-pink" /> {{ test.categoryName }}
              </span>
              <div v-if="test.lastScore" class="flex items-center gap-1.5">
                <i class="fa fa-star text-yellow-400" />
                <span class="text-green-600 dark:text-green-400 font-medium">{{
                  test.lastScore
                }}</span>
                <span class="text-gray-400">/100</span>
              </div>
            </div>
            <button
              class="w-full mt-4 btn-primary text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              @click="startTest(test)"
            >
              <i class="fa fa-play mr-1" /> 开始测试
            </button>
          </div>
        </div>
      </div>

      <!-- 没有测试时的提示 -->
      <div v-if="filteredTests.length === 0" class="text-center py-16">
        <div class="relative inline-block mb-6">
          <div
            class="absolute inset-0 bg-gradient-to-r from-tech-blue to-tech-purple rounded-full blur-2xl opacity-20"
          />
          <div
            class="relative w-24 h-24 bg-gradient-to-br from-tech-blue/10 to-tech-purple/10 rounded-full flex items-center justify-center mx-auto border-2 border-tech-blue/20"
          >
            <i class="fa fa-file-text-o text-5xl text-tech-blue" />
          </div>
        </div>
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无可用的测试</h3>
        <p class="text-gray-500 dark:text-gray-400">请稍后再试或选择其他分类</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { testApi } from '@/utils/api';

const router = useRouter();

// 测试数据
const tests = ref([]);
const categories = ref(['全部', '前端开发', '后端开发', '计算机基础', '人工智能']);
const selectedCategory = ref('全部');
const loading = ref(false);

// Mock测试数据
const mockTests = [
  { id: 'mock1', title: 'JavaScript基础知识测评', description: '考察变量、函数、闭包、原型链等JS核心概念', categoryName: '前端开发', difficulty: '简单', duration: 30, totalQuestions: 20, lastScore: 0, cover: 'https://picsum.photos/seed/test1/300/160' },
  { id: 'mock2', title: 'Vue3 Composition API专项测试', description: 'ref/reactive/computed/watch/lifecycle钩子综合考察', categoryName: '前端开发', difficulty: '中等', duration: 45, totalQuestions: 25, lastScore: 0, cover: 'https://picsum.photos/seed/test2/300/160' },
  { id: 'mock3', title: 'Python数据结构与算法', description: '列表、字典、集合、排序算法、递归与动态规划', categoryName: '后端开发', difficulty: '中等', duration: 60, totalQuestions: 30, lastScore: 0, cover: 'https://picsum.photos/seed/test3/300/160' },
  { id: 'mock4', title: 'Java面向对象编程测试', description: '封装、继承、多态、接口、设计模式综合考察', categoryName: '后端开发', difficulty: '困难', duration: 45, totalQuestions: 20, lastScore: 0, cover: 'https://picsum.photos/seed/test4/300/160' },
  { id: 'mock5', title: '数据结构基础：链表与树', description: '单链表、双链表、二叉树、BST、AVL树操作', categoryName: '计算机基础', difficulty: '中等', duration: 50, totalQuestions: 25, lastScore: 0, cover: 'https://picsum.photos/seed/test5/300/160' },
  { id: 'mock6', title: '操作系统核心概念', description: '进程/线程、内存管理、文件系统、死锁、调度算法', categoryName: '计算机基础', difficulty: '困难', duration: 60, totalQuestions: 30, lastScore: 0, cover: 'https://picsum.photos/seed/test6/300/160' },
  { id: 'mock7', title: '机器学习基础知识', description: '监督学习、无监督学习、神经网络、模型评估指标', categoryName: '人工智能', difficulty: '困难', duration: 45, totalQuestions: 20, lastScore: 0, cover: 'https://picsum.photos/seed/test7/300/160' },
  { id: 'mock8', title: 'CSS布局与响应式设计', description: 'Flexbox、Grid、响应式断点、动画、CSS变量', categoryName: '前端开发', difficulty: '简单', duration: 30, totalQuestions: 20, lastScore: 0, cover: 'https://picsum.photos/seed/test8/300/160' },
  { id: 'mock9', title: 'MySQL数据库设计与优化', description: '表设计、索引优化、SQL调优、事务与锁', categoryName: '后端开发', difficulty: '困难', duration: 60, totalQuestions: 25, lastScore: 0, cover: 'https://picsum.photos/seed/test9/300/160' },
  { id: 'mock10', title: '计算机网络基础', description: 'TCP/IP协议、HTTP/HTTPS、DNS、路由、CDN原理', categoryName: '计算机基础', difficulty: '中等', duration: 40, totalQuestions: 20, lastScore: 0, cover: 'https://picsum.photos/seed/test10/300/160' },
];

// 筛选后的测试列表
const filteredTests = computed(() => {
  if (selectedCategory.value === '全部') {
    return tests.value;
  }
  return tests.value.filter(test => test.categoryName === selectedCategory.value);
});

// 获取测试列表
const fetchTests = async () => {
  loading.value = true;
  try {
    const params = { isPublished: true };
    const response = await testApi.getList(params);
    const difficultyMap = { easy: '简单', medium: '中等', hard: '困难' };
    tests.value = response.data.data.map(test => ({
      id: test._id,
      title: test.title,
      description: test.description,
      categoryName: test.category?.name || '未分类',
      difficulty: difficultyMap[test.difficulty] || test.difficulty,
      duration: test.duration,
      totalQuestions: test.totalQuestions || 0,
      lastScore: test.lastScore || 0,
    }));
    if (tests.value.length === 0) tests.value = mockTests;
  } catch (error) {
    console.error('获取测试列表失败:', error);
    tests.value = mockTests;
  } finally {
    loading.value = false;
  }
};

// 开始测试
const startTest = test => {
  router.push({
    name: 'TestDetail',
    params: { id: test.id },
  });
};

// 组件挂载时加载数据
onMounted(() => {
  fetchTests();
});
</script>

<style scoped>
.test-list-container {
  min-height: calc(100vh - 120px);
}
</style>
