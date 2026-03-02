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
const categories = ref(['全部', '前端开发', '后端开发', '计算机基础', '人工智能']); // 添加"计算机基础"分类
const selectedCategory = ref('全部');
const loading = ref(false);

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
    const params = {
      isPublished: true,
    };

    // 转换分类筛选条件
    if (selectedCategory.value !== '全部') {
      // 这里需要根据后端API的实际参数进行调整
      // params.category = selectedCategory.value
    }

    const response = await testApi.getList(params);

    // 难度级别映射
    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };

    // 修复错误：直接使用response.data.data而不是response.data.data.tests
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
  } catch (error) {
    console.error('获取测试列表失败:', error);
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
