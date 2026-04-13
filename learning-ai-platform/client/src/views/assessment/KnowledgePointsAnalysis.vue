<template>
  <div class="knowledge-points-analysis-container">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">知识点掌握度分析</h1>
        <p class="text-gray-600 mt-2">了解您对各个知识点的掌握程度，针对性提升学习效果</p>
      </div>

      <!-- 整体掌握情况 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <div class="text-4xl font-bold text-primary mb-2">{{ overallMastery }}%</div>
          <div class="text-gray-600">整体掌握度</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <div class="text-4xl font-bold text-blue-600 mb-2">
            {{ masteredCount }}
          </div>
          <div class="text-gray-600">已掌握知识点</div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <div class="text-4xl font-bold text-orange-600 mb-2">
            {{ totalKnowledgePoints }}
          </div>
          <div class="text-gray-600">总知识点数量</div>
        </div>
      </div>

      <!-- 知识点掌握度图表 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">知识点掌握度分布</h2>
        <div class="space-y-6">
          <!-- 前端开发知识点 -->
          <div v-if="getCategoryKnowledgePoints('前端开发').length > 0">
            <h3 class="text-lg font-medium text-gray-800 mb-4">前端开发</h3>
            <div class="space-y-3">
              <div
                v-for="kp in getCategoryKnowledgePoints('前端开发')"
                :key="kp.id"
                class="flex items-center justify-between"
              >
                <div class="flex-1 pr-4">
                  <div class="font-medium text-gray-800">
                    {{ kp.name }}
                  </div>
                  <div class="text-sm text-gray-500">{{ kp.mastery }}% 掌握度</div>
                </div>
                <div class="w-2/3">
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                      class="h-3 rounded-full transition-all duration-1000"
                      :class="{
                        'bg-green-500': kp.mastery >= 80,
                        'bg-yellow-500': kp.mastery >= 50 && kp.mastery < 80,
                        'bg-red-500': kp.mastery < 50,
                      }"
                      :style="{ width: `${kp.mastery}%` }"
                    />
                  </div>
                </div>
                <div class="ml-4 font-medium text-gray-800 w-12 text-right">{{ kp.mastery }}%</div>
              </div>
            </div>
          </div>

          <!-- 后端开发知识点 -->
          <div v-if="getCategoryKnowledgePoints('后端开发').length > 0">
            <h3 class="text-lg font-medium text-gray-800 mb-4">后端开发</h3>
            <div class="space-y-3">
              <div
                v-for="kp in getCategoryKnowledgePoints('后端开发')"
                :key="kp.id"
                class="flex items-center justify-between"
              >
                <div class="flex-1 pr-4">
                  <div class="font-medium text-gray-800">
                    {{ kp.name }}
                  </div>
                  <div class="text-sm text-gray-500">{{ kp.mastery }}% 掌握度</div>
                </div>
                <div class="w-2/3">
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                      class="h-3 rounded-full transition-all duration-1000"
                      :class="{
                        'bg-green-500': kp.mastery >= 80,
                        'bg-yellow-500': kp.mastery >= 50 && kp.mastery < 80,
                        'bg-red-500': kp.mastery < 50,
                      }"
                      :style="{ width: `${kp.mastery}%` }"
                    />
                  </div>
                </div>
                <div class="ml-4 font-medium text-gray-800 w-12 text-right">{{ kp.mastery }}%</div>
              </div>
            </div>
          </div>

          <!-- 人工智能知识点 -->
          <div v-if="getCategoryKnowledgePoints('人工智能').length > 0">
            <h3 class="text-lg font-medium text-gray-800 mb-4">人工智能</h3>
            <div class="space-y-3">
              <div
                v-for="kp in getCategoryKnowledgePoints('人工智能')"
                :key="kp.id"
                class="flex items-center justify-between"
              >
                <div class="flex-1 pr-4">
                  <div class="font-medium text-gray-800">
                    {{ kp.name }}
                  </div>
                  <div class="text-sm text-gray-500">{{ kp.mastery }}% 掌握度</div>
                </div>
                <div class="w-2/3">
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                      class="h-3 rounded-full transition-all duration-1000"
                      :class="{
                        'bg-green-500': kp.mastery >= 80,
                        'bg-yellow-500': kp.mastery >= 50 && kp.mastery < 80,
                        'bg-red-500': kp.mastery < 50,
                      }"
                      :style="{ width: `${kp.mastery}%` }"
                    />
                  </div>
                </div>
                <div class="ml-4 font-medium text-gray-800 w-12 text-right">{{ kp.mastery }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习建议 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">学习建议</h2>
        <div v-if="learningSuggestions.length > 0" class="space-y-3">
          <div
            v-for="(suggestion, index) in learningSuggestions"
            :key="index"
            class="flex items-start"
          >
            <div
              class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-medium mr-3 mt-1"
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-800">
                {{ suggestion.title }}
              </div>
              <div class="text-gray-600 mt-1">
                {{ suggestion.content }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500 text-center py-4">
          <i class="fa fa-lightbulb-o text-2xl text-yellow-500 mb-2" />
          <p>暂无学习建议</p>
          <p class="mt-2">继续努力学习，获取更多知识点掌握度数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { testApi } from '@/utils/api';

// 知识点数据
const knowledgePoints = ref([]);
const learningSuggestions = ref([]);

// 获取指定分类的知识点
const getCategoryKnowledgePoints = categoryName => {
  return knowledgePoints.value.filter(kp => kp.categoryName === categoryName);
};

// 计算属性
const totalKnowledgePoints = computed(() => knowledgePoints.value.length);
const masteredCount = computed(() => knowledgePoints.value.filter(kp => kp.mastery >= 80).length);
const overallMastery = computed(() => {
  if (totalKnowledgePoints.value === 0) return 0;
  const sum = knowledgePoints.value.reduce((acc, kp) => acc + kp.mastery, 0);
  return Math.round(sum / totalKnowledgePoints.value);
});

// 获取知识点掌握情况
const fetchKnowledgePointsMastery = async () => {
  try {
    const response = await testApi.getKnowledgePointsAnalysis();
    knowledgePoints.value = response.data.data.knowledgePoints;
    // 从分析结果中获取学习建议
    if (response.data.data.analysis && response.data.data.analysis.suggestions) {
      learningSuggestions.value = response.data.data.analysis.suggestions;
    }
  } catch (error) {
    console.error('获取知识点掌握情况失败:', error);
    // 使用 Mock 数据
    knowledgePoints.value = [
      // 前端开发
      { id: 'kp1', name: 'Vue3 Composition API', categoryName: '前端开发', mastery: 85 },
      { id: 'kp2', name: 'React Hooks', categoryName: '前端开发', mastery: 60 },
      { id: 'kp3', name: 'JavaScript 基础', categoryName: '前端开发', mastery: 92 },
      { id: 'kp4', name: 'CSS 布局', categoryName: '前端开发', mastery: 78 },
      { id: 'kp5', name: 'TypeScript', categoryName: '前端开发', mastery: 55 },
      // 后端开发
      { id: 'kp6', name: 'Node.js Express', categoryName: '后端开发', mastery: 88 },
      { id: 'kp7', name: 'Python 编程', categoryName: '后端开发', mastery: 45 },
      { id: 'kp8', name: 'RESTful API 设计', categoryName: '后端开发', mastery: 82 },
      { id: 'kp9', name: '数据库 SQL', categoryName: '后端开发', mastery: 70 },
      // 人工智能
      { id: 'kp10', name: '机器学习基础', categoryName: '人工智能', mastery: 65 },
      { id: 'kp11', name: '深度学习', categoryName: '人工智能', mastery: 40 },
      { id: 'kp12', name: '模型评估', categoryName: '人工智能', mastery: 72 },
    ];
    learningSuggestions.value = [
      { title: '重点突破 Python 编程', content: 'Python 编程掌握度仅 45%，建议系统学习 Python 基础语法、面向对象编程和常用库。' },
      { title: '加强深度学习理解', content: '深度学习掌握度 40%，建议从神经网络基础开始，逐步学习 CNN、RNN 等经典模型。' },
      { title: '巩固 React Hooks', content: 'React Hooks 掌握度 60%，建议重点学习 useEffect 依赖管理和自定义 Hook 的编写。' },
    ];
  }
};

// 组件挂载时加载数据
onMounted(() => {
  fetchKnowledgePointsMastery();
  // 学习建议已经在fetchKnowledgePointsMastery中获取，不需要单独调用
  // fetchLearningSuggestions()
});
</script>

<style scoped>
.knowledge-points-analysis-container {
  min-height: calc(100vh - 120px);
}
</style>
