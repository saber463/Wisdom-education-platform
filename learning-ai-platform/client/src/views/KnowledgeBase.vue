<template>
  <div class="knowledge-base-page bg-gray-50 min-h-screen">
    <!-- 页面头部 -->
    <div class="page-header relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
      <div class="container mx-auto max-w-6xl relative z-10 py-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">知识库</h1>
        <p class="text-xl text-white/90 max-w-3xl">
          探索丰富的技术知识点，深入了解各种编程语言、框架和技术概念
        </p>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container mx-auto max-w-6xl px-4 py-8">
      <!-- 搜索框 -->
      <div class="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
        <div class="flex flex-col md:flex-row gap-4">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索知识库内容..."
            class="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 text-gray-800"
          />
          <select
            v-model="selectedCategory"
            class="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-300 text-gray-800"
          >
            <option value="all">全部分类</option>
            <option v-for="category in categories" :key="category._id" :value="category._id">
              {{ category.name }}
            </option>
          </select>
          <button
            class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            @click="search()"
          >
            <i class="fa fa-search mr-2" /> 搜索
          </button>
        </div>
      </div>

      <!-- 知识库内容 -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- 左侧：分类列表 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl p-6 sticky top-8 shadow-sm border border-gray-100">
            <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <i class="fa fa-th-large text-blue-600 mr-2" />分类
            </h2>
            <ul class="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              <li
                :class="[
                  'px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-between',
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'hover:bg-blue-50 hover:shadow-sm text-gray-700',
                ]"
                @click="selectCategory('all')"
              >
                <span class="flex items-center">
                  <i class="fa fa-folder-open mr-2 flex-shrink-0" />
                  <span class="truncate">全部分类</span>
                </span>
                <span class="text-xs font-medium opacity-80 ml-2 flex-shrink-0">{{
                  (categories && categories.length)
                    ? categories.reduce((sum, cat) => sum + (cat.knowledgePointCount || 0), 0)
                    : 0
                }}</span>
              </li>
              <li
                v-for="category in categories"
                :key="category._id"
                :class="[
                  'px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-between',
                  selectedCategory === category._id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'hover:bg-blue-50 hover:shadow-sm text-gray-700',
                ]"
                @click="selectCategory(category._id)"
              >
                <span class="flex items-center min-w-0">
                  <i class="fa fa-code mr-2 flex-shrink-0" />
                  <span class="truncate">{{ category.name }}</span>
                </span>
                <span class="text-xs font-medium opacity-80 ml-2 flex-shrink-0">{{
                  category.knowledgePointCount || 0
                }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 中间：文章列表 -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <i class="fa fa-bookmark text-tech-blue mr-2" />
                  {{
                    selectedCategory === 'all'
                      ? '全部知识点'
                      : categories.find(c => c._id === selectedCategory)?.name + ' 知识点'
                  }}
                </h2>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  共 {{ filteredArticles.length }} 个知识点
                </div>
              </div>

              <!-- 加载状态 -->
              <div v-if="loading" class="flex justify-center items-center py-20">
                <div class="relative">
                  <div
                    class="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-4 border-tech-blue rounded-full animate-spin"
                  />
                  <div
                    class="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-4 border-tech-purple rounded-full animate-spin"
                    style="animation-delay: 0.15s"
                  />
                </div>
              </div>

              <!-- 错误状态 -->
              <div v-else-if="error" class="text-center py-20">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <i class="fa fa-exclamation-circle text-4xl text-red-500" />
                </div>
                <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-3">加载失败</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-8">
                  {{ error }}
                </p>
                <button
                  class="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-tech-blue to-tech-purple hover:from-tech-blue/90 hover:to-tech-purple/90 text-white font-medium rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl shadow-tech-blue/25"
                  @click="fetchData"
                >
                  <i class="fa fa-refresh mr-2" /> 重试
                </button>
              </div>

              <!-- 文章列表 -->
              <div v-else-if="filteredArticles.length === 0" class="text-center py-20">
                <div
                  class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <i class="fa fa-book text-4xl text-gray-400 dark:text-gray-500" />
                </div>
                <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-3">暂无知识点</h3>
                <p class="text-gray-500 dark:text-gray-400">
                  当前分类下暂无知识点，请尝试其他分类或调整搜索条件
                </p>
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="article in filteredArticles"
                  :key="article.id"
                  class="group border border-gray-100 dark:border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800/50 hover:shadow-xl hover:shadow-tech-blue/10 hover:-translate-y-1 hover:scale-[1.01] cursor-pointer"
                  @click="viewArticle(article)"
                >
                  <h3
                    class="text-lg font-bold mb-3 text-gray-800 dark:text-white group-hover:text-tech-blue transition-colors flex items-start"
                  >
                    <i
                      class="fa fa-file-text-o text-tech-blue mr-2 mt-1 group-hover:scale-110 transition-transform"
                    />
                    <span>{{ article.title }}</span>
                  </h3>
                  <div
                    class="text-sm text-gray-500 dark:text-gray-400 mb-3 flex flex-wrap items-center gap-2"
                  >
                    <span
                      class="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-tech-blue/10 to-tech-blue/5 text-tech-blue text-xs font-medium border border-tech-blue/20"
                    >
                      <i class="fa fa-folder-o mr-1.5" />{{ article.categoryName }}
                    </span>
                    <span
                      v-if="article.level"
                      class="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-tech-purple/10 to-tech-purple/5 text-tech-purple text-xs font-medium border border-tech-purple/20"
                    >
                      <i class="fa fa-star mr-1.5" />等级 {{ article.level }}
                    </span>
                  </div>
                  <p class="text-gray-600 dark:text-gray-300">
                    {{ article.summary }}
                  </p>
                </div>
              </div>

              <!-- 分页 -->
              <div
                v-if="!loading && !error && filteredArticles.length > 0"
                class="mt-8 flex justify-center"
              >
                <nav class="inline-flex items-center rounded-xl shadow-lg overflow-hidden">
                  <button
                    :disabled="currentPage === 1"
                    class="px-5 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                    @click="prevPage"
                  >
                    <i class="fa fa-chevron-left" />
                  </button>
                  <button
                    class="px-6 py-3 border-t border-b border-gray-200 dark:border-gray-700 text-sm font-bold bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg transition-all duration-300"
                  >
                    {{ currentPage }}
                  </button>
                  <button
                    :disabled="currentPage === totalPages"
                    class="px-5 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                    @click="nextPage"
                  >
                    <i class="fa fa-chevron-right" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <!-- 文章详情弹窗 -->
        <div
          v-if="currentArticle"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300 ease-in-out"
        >
          <div
            class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8 transform transition-all duration-500 ease-out scale-95 hover:scale-100"
          >
            <div
              class="p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink text-white relative overflow-hidden"
            >
              <div
                class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwIDIgMCAyIDJzMCAyIDAgMi0yIDItMiA0LTIgNHpNMCAwaDYwdjYwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"
              />
              <div
                class="absolute -top-16 -right-16 w-40 h-40 bg-white bg-opacity-10 rounded-full blur-2xl"
              />
              <div
                class="absolute bottom-8 left-8 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-xl"
              />

              <div class="flex justify-between items-start relative z-10">
                <h2 class="text-2xl md:text-3xl font-bold">
                  {{ currentArticle.title }}
                </h2>
                <button
                  class="text-white hover:text-white/80 text-xl transition-colors hover:scale-110 p-2 rounded-full hover:bg-white hover:bg-opacity-10 backdrop-blur-sm"
                  @click="closeArticle"
                >
                  <i class="fa fa-times" />
                </button>
              </div>
              <div class="text-sm text-white/90 mt-4 relative z-10 flex flex-wrap gap-2">
                <span
                  class="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                >
                  <i class="fa fa-folder-o mr-1.5" />{{ currentArticle.categoryName }}
                </span>
                <span
                  v-if="currentArticle.level"
                  class="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                >
                  <i class="fa fa-star mr-1.5 text-yellow-200" />等级 {{ currentArticle.level }}
                </span>
              </div>
            </div>
            <div class="p-8">
              <div class="prose max-w-none dark:prose-invert" v-html="currentArticle.content" />
            </div>
            <div
              class="p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center"
            >
              <div class="flex space-x-3">
                <button
                  :class="[
                    'inline-flex items-center justify-center px-5 py-2.5 font-medium rounded-xl transition-all transform hover:scale-105',
                    isFavorited
                      ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  ]"
                  @click="toggleFavorite"
                >
                  <i :class="isFavorited ? 'fa fa-bookmark' : 'fa fa-bookmark-o'" class="mr-2" />
                  {{ isFavorited ? '已收藏' : '收藏' }}
                </button>
                <button
                  class="inline-flex items-center justify-center px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all transform hover:scale-105"
                  @click="shareArticle"
                >
                  <i class="fa fa-share-alt mr-2" /> 分享
                </button>
              </div>
              <button
                class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-tech-blue to-tech-purple hover:from-tech-blue/90 hover:to-tech-purple/90 text-white font-medium rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl shadow-tech-blue/25"
                @click="closeArticle"
              >
                关闭
                <i class="fa fa-times ml-2" />
              </button>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { useUserStore } from '../store/user';
import { knowledgeBaseApi, favoriteApi } from '@/utils/api';
import { ElMessage } from 'element-plus';

// 获取用户store
const userStore = useUserStore();

const route = useRoute();

// 搜索关键词
const searchKeyword = ref('');
// 选中的分类
const selectedCategory = ref('all');
// 分类列表
const categories = ref([
  { _id: 'js', name: 'JavaScript', knowledgePointCount: 3 },
  { _id: 'python', name: 'Python', knowledgePointCount: 2 },
  { _id: 'ai', name: '人工智能', knowledgePointCount: 2 },
  { _id: 'edu', name: '教育规划', knowledgePointCount: 1 },
]);
// 知识点列表
const articles = ref([]);
// 当前页码
const currentPage = ref(1);
// 每页条数
const pageSize = ref(10);
// 当前查看的文章
const currentArticle = ref(null);
// 加载状态
const loading = ref(false);
// 错误信息
const error = ref('');

// 扩充知识库内容 - 添加更详细的文章
const expandedMockArticles = [
  {
    id: 'kb_parent_1', title: '如何通过 AI 监控提升孩子的学习效率？', categoryId: 'edu', categoryName: '教育规划',
    summary: '家长如何利用平台的监控台功能，科学分析孩子的学习路径，及时发现薄弱环节并给予支持。',
    level: 1, keywords: ['家长监控', 'AI教育', '学习效率'], createdAt: new Date().toISOString(),
    content: `<h2>一、家长监控台的核心价值</h2>
<p>在 AI 辅助学习的时代，家长的角色正从“监督者”转变为“引导者”。本平台提供的监控台不仅展示学习时长，更深层地分析知识点掌握情况。</p>
<h3>1.1 实时进度追踪</h3>
<p>家长可以清晰看到孩子正在进行的 AI 学习路径，包括当前处于哪个阶段，哪些任务已完成。</p>
<h3>1.2 弱项智能提醒</h3>
<p>当系统检测到孩子在某个知识点（如：JavaScript 循环）多次评估未通过时，会向家长端发送提醒。</p>
<h2>二、如何给予正确支持</h2>
<ul>
  <li><strong>肯定努力：</strong>关注学习路径的完成度而非仅仅是分数。</li>
  <li><strong>共同规划：</strong>与孩子一起讨论 AI 生成的下一阶段学习计划。</li>
</ul>`
  },
  {
    id: 'kb_ai_1', title: '大语言模型（LLM）在个性化教育中的应用', categoryId: 'ai', categoryName: '人工智能',
    summary: '探讨 AI 如何根据每个学生的兴趣和基础，动态生成差异化的学习路线图。',
    level: 3, keywords: ['LLM', '个性化学习', '自适应教育'], createdAt: new Date().toISOString(),
    content: `<h2>一、从固定课程到动态路径</h2>
<p>传统教育往往采用“一刀切”的教学大纲。而 AI 可以根据用户的目标（如：1个月通过英语四级）实时计算最优路径。</p>
<h2>二、本平台的技术实现</h2>
<p>我们接入了领先的 LLM 接口，结合教育专家的 Prompt 工程，确保生成的每一阶段都具备科学性和可操作性。</p>`
  },
  {
    id: 'kb_tmpl_1', title: '【模板】初学者编程学习周计划', categoryId: 'edu', categoryName: '教育规划',
    summary: '为编程新手设计的第一个月学习节奏建议，平衡理论与实践。',
    level: 1, keywords: ['学习计划', '新手引导', '编程入门'], createdAt: new Date().toISOString(),
    content: `<h2>周计划建议模板</h2>
<table border="1">
  <tr><th>阶段</th><th>核心任务</th><th>建议时长</th></tr>
  <tr><td>第一周</td><td>环境搭建与基础语法</td><td>10-15小时</td></tr>
  <tr><td>第二周</td><td>数据结构初步</td><td>12-18小时</td></tr>
  <tr><td>第三周</td><td>简单算法实践</td><td>15-20小时</td></tr>
  <tr><td>第四周</td><td>综合小项目</td><td>20-25小时</td></tr>
</table>
<p>提示：利用本平台的 AI 学习路径功能，可以自动填充上述表格的具体内容。</p>`
  },
  {
    id: 'kb_tmpl_2', title: '【模板】考前冲刺复习检查清单', categoryId: 'edu', categoryName: '教育规划',
    summary: '通用的考前两周复习计划模板，适用于各类学科考试。',
    level: 2, keywords: ['考试复习', 'Checklist', '备考策略'], createdAt: new Date().toISOString(),
    content: `<h2>考前 14 天冲刺清单</h2>
<ul>
  <li><strong>D-14 to D-10:</strong> 知识点全覆盖扫描，标记薄弱环节。</li>
  <li><strong>D-9 to D-5:</strong> 专项突破，完成本平台对应的“弱项强化”路径。</li>
  <li><strong>D-4 to D-2:</strong> 模拟真题训练，严格计时。</li>
  <li><strong>D-1:</strong> 回顾错题本，保持心态平稳。</li>
</ul>`
  },
  // JavaScript 系列
  {
    id: 'mk1', title: 'JavaScript闭包原理与应用场景', categoryId: 'js', categoryName: 'JavaScript',
    summary: '深入理解闭包的执行上下文、作用域链，以及在模块化、防抖节流中的经典应用',
    level: 2, keywords: ['闭包', '作用域', '执行上下文'], createdAt: new Date().toISOString(),
    cover: 'https://picsum.photos/seed/kb1/80/60',
    content: `<h2>一、闭包基础概念</h2>
<p>闭包是指函数能够访问其词法作用域之外的变量的能力。当一个内部函数引用了外部函数的变量，即使外部函数已经执行完毕，这些变量依然会被保留。</p>

<h3>1.1 什么是词法作用域？</h3>
<p>词法作用域是指函数的作用域在定义时就已经确定，而不是在调用时确定。这意味着内部函数可以访问外部函数中定义的变量。</p>
<pre><code>function outer() {
  const a = 1;
  function inner() {
    console.log(a); // 可以访问外部函数的变量a
  }
  return inner;
}
const fn = outer();
fn(); // 输出: 1</code></pre>

<h3>1.2 闭包的本质</h3>
<p>闭包是由函数以及其相关的引用环境组合而成的。当内部函数引用外部函数的变量时，会创建一个闭包。这些变量会被保存在内存中，不会被垃圾回收机制回收。</p>
<pre><code>function createCounter() {
  let count = 0; // 私有变量
  return {
    increment: function() {
      count++;
      return count;
    },
    decrement: function() {
      count--;
      return count;
    },
    getCount: function() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getCount()); // 2
console.log(counter.decrement()); // 1</code></pre>

<h2>二、闭包的经典应用场景</h2>

<h3>2.1 防抖（Debounce）</h3>
<p>防抖是指在事件被触发n秒后再执行回调，如果在这n秒内事件又被触发，则重新计时。常用于搜索框输入、窗口调整等场景。</p>
<pre><code>function debounce(func, delay) {
  let timeout = null;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 使用示例
const debouncedSearch = debounce((keyword) => {
  console.log('搜索:', keyword);
}, 300);</code></pre>

<h3>2.2 节流（Throttle）</h3>
<p>节流是指规定一个单位时间，在这个单位时间内，只能有一次触发事件的回调执行。用于滚动事件、按钮点击等场景。</p>
<pre><code>function throttle(func, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      func.apply(this, args);
    }
  };
}

// 使用示例
const throttledScroll = throttle(() => {
  console.log('滚动位置:', window.scrollY);
}, 100);</code></pre>

<h3>2.3 模块化私有变量</h3>
<p>在JavaScript没有模块系统之前，闭包常被用来创建私有变量和私有方法。</p>
<pre><code>const Module = (function() {
  // 私有变量
  let _privateData = [];
  
  // 私有方法
  function _validate(item) {
    return item && typeof item === 'string';
  }
  
  // 公有API
  return {
    add: function(item) {
      if (_validate(item)) {
        _privateData.push(item);
        return true;
      }
      return false;
    },
    getAll: function() {
      return [..._privateData];
    },
    getCount: function() {
      return _privateData.length;
    }
  };
})();

Module.add('item1');
console.log(Module.getAll()); // ['item1']
console.log(Module._privateData); // undefined - 无法访问私有变量</code></pre>

<h3>2.4 函数柯里化</h3>
<p>柯里化是将接受多个参数的函数转换为接受单一参数的函数序列。</p>
<pre><code>function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3)); // 6
console.log(curriedSum(1, 2)(3)); // 6
console.log(curriedSum(1, 2, 3)); // 6</code></pre>

<h2>三、闭包的注意事项</h2>

<h3>3.1 内存泄漏</h3>
<p>闭包会阻止垃圾回收，如果使用不当，可能导致内存泄漏。</p>
<pre><code>// 错误示例
function example() {
  const largeData = new Array(1000000);
  const element = document.getElementById('button');
  
  element.onclick = function() {
    console.log(largeData); // largeData永远不会被释放
  };
}

// 正确示例
function example() {
  const largeData = new Array(1000000);
  const element = document.getElementById('button');
  
  element.onclick = function() {
    console.log(largeData); // 只需要在点击时使用
  };
  
  // 如果不需要，清理引用
  element.onclick = null;
}</code></pre>

<h3>3.2 循环闭包问题</h3>
<p>在循环中创建闭包时，需要特别注意变量的引用问题。</p>
<pre><code>// 错误示例
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // 输出: 3, 3, 3
  }, 100);
}

// 解决方案1: 使用let
for (let i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // 输出: 0, 1, 2
  }, 100);
}

// 解决方案2: 使用闭包创建新作用域
for (var i = 0; i < 3; i++) {
  (function(index) {
    setTimeout(function() {
      console.log(index); // 输出: 0, 1, 2
    }, 100);
  })(i);
}</code></pre>

<h2>四、总结</h2>
<p>闭包是JavaScript中一个强大而复杂的特性。理解闭包的工作原理对于：</p>
<ul>
<li>编写模块化代码</li>
<li>理解框架源码（如Vue的响应式原理、React的Hooks实现）</li>
<li>性能优化（防抖、节流）</li>
<li>避免内存泄漏</li>
</ul>
<p>至关重要。建议在实际项目中多加练习，深入理解闭包的各种应用场景。</p>`
  },
  // Vue3 系列
  {
    id: 'mk2', title: 'Vue3响应式系统：Proxy vs Object.defineProperty', categoryId: 'vue', categoryName: 'Vue3',
    summary: 'Vue3使用Proxy替代Object.defineProperty的原因，track/trigger依赖收集机制详解',
    level: 3, keywords: ['Proxy', '响应式', 'Vue3'], createdAt: new Date().toISOString(),
    cover: 'https://picsum.photos/seed/kb2/80/60',
    content: `<h2>一、Vue3响应式系统概述</h2>
<p>Vue3使用Proxy替代了Object.defineProperty来实现响应式系统。Proxy可以监听对象属性的添加、删除，以及数组元素的变化，这是Object.defineProperty无法做到的。</p>

<h2>二、Proxy vs Object.defineProperty</h2>

<h3>2.1 Object.defineProperty的局限性</h3>
<pre><code>// Object.defineProperty只能监听已存在的属性
const obj = {};
Object.defineProperty(obj, 'name', {
  value: '张三',
  writable: true,
  configurable: true,
  enumerable: true
});

// 无法监听新添加的属性
obj.age = 25; // 这是不会被监听的！

// 无法监听数组下标的变化
const arr = [1, 2, 3];
arr[0] = 10; // 直接通过下标修改需要Vue.set才能触发响应式

// 无法监听数组length的变化
arr.length = 1; // 不会触发响应式</code></pre>

<h3>2.2 Proxy的优势</h3>
<pre><code>const proxy = new Proxy(target, handler);

// 基本示例
const target = { name: '张三', age: 25 };
const proxy = new Proxy(target, {
  get(target, property, receiver) {
    console.log(\`读取属性: \${property}\`);
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    console.log(\`设置属性: \${property} = \${value}\`);
    return Reflect.set(target, property, value, receiver);
  },
  deleteProperty(target, property) {
    console.log(\`删除属性: \${property}\`);
    return Reflect.deleteProperty(target, property);
  },
  has(target, property) {
    console.log(\`检查属性是否存在: \${property}\`);
    return Reflect.has(target, property);
  }
});

proxy.name; // 触发get
proxy.age = 30; // 触发set
delete proxy.name; // 触发deleteProperty
'name' in proxy; // 触发has</code></pre>

<h2>三、Vue3响应式原理</h2>

<h3>3.1 核心概念</h3>
<ul>
<li><strong>track:</strong> 收集依赖，建立响应式数据与Watcher之间的关联</li>
<li><strong>trigger:</strong> 当响应式数据变化时，通知所有依赖它的Watcher更新</li>
</ul>

<h3>3.2 简易响应式系统实现</h3>
<pre><code>// 存储当前正在执行的effect
let currentEffect = null;

class ReactiveEffect {
  constructor(effectFn) {
    this.effectFn = effectFn;
  }
  
  run() {
    currentEffect = this;
    this.effectFn();
    currentEffect = null;
  }
}

// 响应式对象
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      // 如果有正在执行的effect，收集依赖
      if (currentEffect) {
        let depsMap = target._depsMap || (target._depsMap = new Map());
        let deps = depsMap.get(key) || (depsMap.set(key, new Set()) && depsMap.get(key));
        deps.add(currentEffect);
      }
      return Reflect.get(target, key, receiver);
    },
    
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      // 触发依赖更新
      const depsMap = target._depsMap;
      if (depsMap) {
        const deps = depsMap.get(key);
        if (deps) {
          deps.forEach(effect => effect.run());
        }
      }
      return result;
    }
  });
}

// 使用示例
const state = reactive({ count: 0 });

effect(() => {
  console.log('count变化了:', state.count);
});

state.count++; // 触发更新，effect重新执行</code></pre>

<h3>3.3 ref和reactive</h3>
<pre><code>// ref: 处理基本类型
function ref(initialValue) {
  return {
    get value() {
      track(this, 'value');
      return initialValue;
    },
    set value(newVal) {
      initialValue = newVal;
      trigger(this, 'value');
    }
  };
}

// reactive: 处理对象
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      track(target, key);
      // 深层响应式
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }
      return result;
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key);
      return result;
    }
  });
}

// computed计算属性
function computed(getter) {
  let value;
  let dirty = true;
  
  const effect = new ReactiveEffect(getter);
  
  return {
    get value() {
      if (dirty) {
        value = effect.run();
        dirty = false;
      }
      return value;
    }
  };
}</code></pre>

<h2>四、Vue3的新特性</h2>

<h3>4.1 toRef和toRefs</h3>
<pre><code>import { reactive, toRef, toRefs } from 'vue';

const state = reactive({
  name: '张三',
  age: 25,
  job: '工程师'
});

// toRef: 将响应式对象的单个属性转为ref
const nameRef = toRef(state, 'name');

// toRefs: 将整个响应式对象转为普通对象，所有属性都是ref
const stateRefs = toRefs(state);

// 使用toRef修改会影响原对象
nameRef.value = '李四';
console.log(state.name); // '李四'

// 使用toRefs
stateRefs.name.value = '王五';
console.log(state.name); // '王五'</code></pre>

<h3>4.2 watch和watchEffect</h3>
<pre><code>import { ref, watch, watchEffect } from 'vue';

const count = ref(0);

// watch: 懒执行，明确指定要监听的数据
watch(count, (newValue, oldValue) => {
  console.log(\`count从\${oldValue}变为\${newValue}\`);
}, { immediate: true });

// watchEffect: 自动收集依赖，立即执行
watchEffect(() => {
  console.log('count的值:', count.value);
  // 这里会自动追踪count.value的变化
});</code></pre>

<h2>五、总结</h2>
<p>Vue3的响应式系统相比Vue2有了质的飞跃：</p>
<ul>
<li>Proxy提供了更强大、更完整的拦截能力</li>
<li>支持数组下标监听</li>
<li>支持Map、Set等数据结构</li>
<li>递归响应式自动处理</li>
<li>性能更好，内存占用更低</li>
</ul>
<p>理解这些原理对于深入掌握Vue3和使用Composition API至关重要。</p>`
  },
  // Python系列
  {
    id: 'mk3', title: 'Python生成器与协程：yield的深度解析', categoryId: 'py', categoryName: 'Python',
    summary: 'generator/yield/send机制，以及async/await的协程模型在异步IO中的应用',
    level: 3, keywords: ['生成器', 'yield', '协程'], createdAt: new Date().toISOString(),
    cover: 'https://picsum.photos/seed/kb3/80/60',
    content: `<h2>一、生成器基础</h2>
<p>生成器是一种特殊的迭代器，使用yield关键字来暂停和恢复执行。它相比普通函数，能够在执行过程中暂停，保存当前状态，并在需要时恢复执行。</p>

<h3>1.1 生成器的创建</h3>
<pre><code># 方法1: 使用yield关键字
def simple_generator():
    yield 1
    yield 2
    yield 3

gen = simple_generator()
print(next(gen))  # 1
print(next(gen))  # 2
print(next(gen))  # 3
# print(next(gen))  # StopIteration

# 方法2: 使用生成器表达式
gen_expr = (x * 2 for x in range(5))
print(list(gen_expr))  # [0, 2, 4, 6, 8]</code></pre>

<h3>1.2 生成器的工作原理</h3>
<pre><code>def countdown(n):
    print(f"开始倒计时，从{n}开始")
    while n > 0:
        yield n
        n -= 1
    print("倒计时结束")

# 创建生成器对象，此时函数体不会执行
gen = countdown(5)

# 第一次next()，执行到第一个yield
print(next(gen))  # 开始倒计时，从5开始 \n 5

# 第二次next()，从上次yield处继续
print(next(gen))  # 4

# 第三次next()
print(next(gen))  # 3</code></pre>

<h2>二、yield的深入理解</h2>

<h3>2.1 yield表达式</h3>
<pre><code>def generator_with_yield():
    result = yield 1
    print(f"收到发送的值: {result}")
    yield 2

gen = generator_with_yield()
print(next(gen))  # 1
print(gen.send(100))  # 收到发送的值: 100 \n 2</code></pre>

<h3>2.2 yield from语法</h3>
<pre><code># yield from 用于委托生成器
def inner():
    yield from [1, 2, 3]

def outer():
    yield from inner()

for x in outer():
    print(x)  # 1, 2, 3

# 更复杂的用法
def chain(*iterables):
    for it in iterables:
        yield from it

print(list(chain([1, 2], [3, 4], [5, 6])))  # [1, 2, 3, 4, 5, 6]</code></pre>

<h2>三、协程与asyncio</h2>

<h3>3.1 协程的概念</h3>
<p>协程是一种比线程更轻量级的执行单元，可以在执行过程中暂停和恢复。与线程不同的是，协程是由程序员控制的，而不是操作系统调度。</p>

<h3>3.2 async/await语法</h3>
<pre><code>import asyncio

async def fetch_data(id):
    print(f"开始获取数据 {id}")
    await asyncio.sleep(1)  # 模拟异步IO
    return {"id": id, "data": f"数据{id}"}

async def main():
    # 创建多个协程任务
    tasks = [fetch_data(i) for i in range(3)]
    
    # 并发执行
    results = await asyncio.gather(*tasks)
    for result in results:
        print(result)

# 运行
asyncio.run(main())</code></pre>

<h3>3.3 协程的底层原理</h3>
<pre><code>import asyncio

# 事件循环示例
async def producer(queue):
    for i in range(5):
        await queue.put(i)
        print(f"生产: {i}")
        await asyncio.sleep(0.5)
    await queue.put(None)  # 结束信号

async def consumer(queue):
    while True:
        item = await queue.get()
        if item is None:
            break
        print(f"消费: {item}")
        await asyncio.sleep(0.3)

async def main():
    queue = asyncio.Queue()
    await asyncio.gather(
        producer(queue),
        consumer(queue)
    )

asyncio.run(main())</code></pre>

<h2>四、生成器与协程的结合</h2>

<h3>4.1 使用生成器实现协程</h3>
<pre><code>def manually_scheduler():
    current = None
    while True:
        task = yield current
        current = task

scheduler = manually_scheduler()
scheduler.send(None)  # 启动

def my_coroutine():
    print("协程1开始")
    yield None
    print("协程1继续")
    yield None
    print("协程1结束")

task1 = my_coroutine()
scheduler.send(task1)
next(task1)  # 协程1开始
next(task1)  # 协程1继续</code></pre>

<h3>4.2 asyncio的协程本质</h3>
<pre><code>import asyncio

# asyncio.Task是Future的子类，Future是对协程状态的包装
async def simple_task():
    return "结果"

# 创建Task
loop = asyncio.new_event_loop()
task = loop.create_task(simple_task())

# 或者使用ensure_future
task2 = asyncio.ensure_future(simple_task())

# 等待结果
results = loop.run_until_complete(asyncio.gather(task, task2))
print(results)  # ['结果', '结果']</code></pre>

<h2>五、实际应用场景</h2>

<h3>5.1 异步文件IO</h3>
<pre><code>import asyncio
import aiofiles

async def read_file_async(filepath):
    async with aiofiles.open(filepath, 'r') as f:
        content = await f.read()
    return content

async def main():
    tasks = [read_file_async(f'file{i}.txt') for i in range(10)]
    contents = await asyncio.gather(*tasks)
    return contents

asyncio.run(main())</code></pre>

<h3>5.2 异步HTTP请求</h3>
<pre><code>import asyncio
import aiohttp

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)

urls = ['http://example.com', 'http://example.org']
asyncio.run(main(urls))</code></pre>

<h2>六、性能与注意事项</h2>

<h3>6.1 生成器的内存优势</h3>
<pre><code># 不用生成器 - 一次性加载到内存
def get_squares_list(n):
    return [x**2 for x in range(n)]

# 使用生成器 - 惰性计算
def get_squares_generator(n):
    for x in range(n):
        yield x**2

# 内存对比
import sys
list_data = get_squares_list(1000000)
gen_data = get_squares_generator(1000000)

print(sys.getsizeof(list_data))  # 约8MB
print(sys.getsizeof(gen_data))    # 约几百字节</code></pre>

<h3>6.2 协程的注意事项</h3>
<ul>
<li>避免在同步代码中调用async函数</li>
<li>正确处理异常和取消</li>
<li>注意事件循环的阻塞操作</li>
<li>合理使用信号量控制并发数</li>
</ul>

<h2>七、总结</h2>
<p>生成器和协程是Python异步编程的两大基石：</p>
<ul>
<li>生成器通过yield实现惰性计算，节省内存</li>
<li>协程通过async/await实现异步IO，提高并发性能</li>
<li>asyncio是Python官方异步编程标准库</li>
<li>理解底层原理有助于编写更高效的异步代码</li>
</ul>`
  },
  // 计算机网络系列
  {
    id: 'mk4', title: 'TCP三次握手与四次挥手全解析', categoryId: 'net', categoryName: '计算机网络',
    summary: '从状态机角度深入理解TCP连接建立与断开过程，TIME_WAIT和CLOSE_WAIT常见问题',
    level: 2, keywords: ['TCP', '三次握手', '网络'], createdAt: new Date().toISOString(),
    cover: 'https://picsum.photos/seed/kb4/80/60',
    content: `<h2>一、TCP协议概述</h2>
<p>TCP（传输控制协议）是面向连接的、可靠的传输层协议。它提供全双工服务，即数据可在两个方向上同时传输。</p>

<h3>1.1 TCP的特点</h3>
<ul>
<li><strong>面向连接：</strong>传输数据前需要建立连接</li>
<li><strong>可靠传输：</strong>通过序号、确认、超时重传机制保证</li>
<li><strong>流量控制：</strong>通过滑动窗口机制控制发送速率</li>
<li><strong>拥塞控制：</strong>避免网络拥塞</li>
</ul>

<h2>二、TCP头部结构</h2>
<pre><code>TCP头部格式（20字节 + 可选选项）:
+-----------------+-----------------+
|  源端口(16bit)  |  目的端口(16bit) |
+-----------------+-----------------+
|           序号(32bit)              |
+-----------------+-----------------+
|           确认号(32bit)            |
+----+-----------+------------------+
|偏移|  控制标志  |     窗口大小      |
+----+-----------+------------------+
|   校验和        |     紧急指针      |
+----+-----------+------------------+
|        选项(可选)                   |
+-----------------+-----------------+</code></pre>

<h3>2.1 控制标志位</h3>
<ul>
<li><strong>SYN：</strong>同步序号，用于建立连接</li>
<li><strong>ACK：</strong>确认标志，确认收到数据</li>
<li><strong>FIN：</strong>结束标志，用于关闭连接</li>
<li><strong>RST：</strong>重置连接</li>
<li><strong>PSH：</strong>推送标志，催促接收方立即交付数据</li>
<li><strong>URG：</strong>紧急指针有效</li>
</ul>

<h2>三、三次握手详解</h2>

<h3>3.1 为什么要三次握手？</h3>
<p>三次握手的目的是同步双方的序列号和确认信息，建立可靠的连接。</p>
<pre><code>客户端                      服务器
   |                          |
   |  1. SYN (seq=x)         |
   |----------------------->
   |                          |
   |  2. SYN+ACK (seq=y, ack=x+1)
   |<-----------------------|
   |                          |
   |  3. ACK (ack=y+1)        |
   |----------------------->
   |                          |
   |    建立连接完成           |
   |                          |</code></pre>

<h3>3.2 三次握手过程详解</h3>
<pre><code>第一次握手：
- 客户端发送SYN包 (seq=x)
- 客户端进入 SYN_SENT 状态
- 服务器确认：客户端的发送能力正常

第二次握手：
- 服务器发送SYN+ACK包 (seq=y, ack=x+1)
- 服务器进入 SYN_RCVD 状态
- 客户端确认：服务器的接收和发送能力正常

第三次握手：
- 客户端发送ACK包 (ack=y+1)
- 客户端进入 ESTABLISHED 状态
- 服务器确认：服务器的接收能力正常，客户端的接收能力正常</code></pre>

<h3>3.3 重要概念</h3>
<ul>
<li><strong>ISN（Initial Sequence Number）：</strong>初始序列号，随机生成</li>
<li><strong>seq：</strong>当前数据包第一个字节的序号</li>
<li><strong>ack：</strong>期望收到对方下一个数据包的第一个字节序号</li>
</ul>

<h2>四、四次挥手详解</h2>

<h3>4.1 为什么要四次挥手？</h3>
<p>由于TCP连接是全双工的，每个方向都需要单独关闭。</p>
<pre><code>客户端                      服务器
   |                          |
   |  1. FIN (seq=u)          |
   |----------------------->
   |                          |
   |  2. ACK (ack=u+1)         |
   |<-----------------------|
   |     客户端 -> 服务器 关闭  |
   |                          |
   |  3. FIN (seq=w)          |
   |<-----------------------|
   |                          |
   |  4. ACK (ack=w+1)         |
   |----------------------->
   |     服务器 -> 客户端 关闭  |
   |                          |</code></pre>

<h3>4.2 四次挥手过程详解</h3>
<pre><code>第一次挥手：
- 主动关闭方发送FIN包，请求关闭本地连接
- 进入 FIN_WAIT_1 状态

第二次挥手：
- 被动关闭方发送ACK确认
- 进入 CLOSE_WAIT 状态
- 主动关闭方收到ACK后进入 FIN_WAIT_2 状态

第三次挥手：
- 被动关闭方完成数据发送后，发送FIN包
- 进入 LAST_ACK 状态

第四次挥手：
- 主动关闭方发送ACK确认
- 进入 TIME_WAIT 状态
- 等待2MSL后进入 CLOSED 状态</code></pre>

<h2>五、TCP状态转换图</h2>

<h3>5.1 客户端状态</h3>
<pre><code>CLOSED -> SYN_SENT -> ESTABLISHED -> FIN_WAIT_1
                              |            |
                              |       FIN_WAIT_2
                              |            |
                              |      TIME_WAIT
                              |            |
                              +----> CLOSED <----+</code></pre>

<h3>5.2 服务器状态</h3>
<pre><code>CLOSED -> LISTEN -> SYN_RCVD -> ESTABLISHED
                              |              |
                              |         CLOSE_WAIT
                              |              |
                              +-----> LAST_ACK -> CLOSED</code></pre>

<h2>六、TIME_WAIT状态详解</h2>

<h3>6.1 为什么要等待2MSL？</h3>
<ul>
<li><strong>确保ACK可靠传输：</strong>如果第四次挥手的ACK丢失，服务器会重发FIN，客户端需要时间接收</li>
<li><strong>让旧连接的报文在网络中消失：</strong>防止新连接收到旧连接的延迟报文</li>
</ul>

<h3>6.2 MSL是什么？</h3>
<p>MSL（Maximum Segment Lifetime）是报文最大生存时间，通常为30秒、1分钟或2分钟。</p>

<h3>6.3 TIME_WAIT问题及解决方案</h3>
<pre><code># 问题：高并发服务器可能产生大量TIME_WAIT状态的连接
# 解决方案1：调整内核参数
echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse
echo 1 > /proc/sys/net/ipv4/tcp_timestamps

# 解决法案2：使用SO_LINGER选项
import socket
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))

# 解决方案3：客户端使用连接池</code></pre>

<h2>七、CLOSE_WAIT问题</h2>

<h3>7.1 什么是CLOSE_WAIT？</h3>
<p>当被动关闭方收到FIN后，进入CLOSE_WAIT状态，等待本地应用调用close()关闭连接。</p>

<h3>7.2 CLOSE_WAIT过多的原因</h3>
<pre><code># 代码问题示例：忘记关闭连接
def handle_request(sock, addr):
    data = sock.recv(1024)
    # 业务处理
    response = process(data)
    sock.sendall(response)
    # 忘记调用 sock.close()
    # 导致连接处于CLOSE_WAIT状态</code></pre>

<h3>7.3 解决CLOSE_WAIT问题</h3>
<pre><code># 正确做法：使用try-finally或with语句
def handle_request(sock, addr):
    try:
        data = sock.recv(1024)
        if not data:
            return
        response = process(data)
        sock.sendall(response)
    finally:
        sock.close()

# 或者使用上下文管理器
def handle_request(sock, addr):
    with sock:
        data = sock.recv(1024)
        response = process(data)
        sock.sendall(response)</code></pre>

<h2>八、常见面试题</h2>

<h3>8.1 为什么是三次握手而不是两次？</h3>
<p>两次握手无法确认双方的接收和发送能力都正常。例如：</p>
<ul>
<li>如果服务器对客户端的SYN作出响应，但这个响应在网络中延迟</li>
<li>客户端超时后重传SYN</li>
<li>旧SYN的响应先到达，错误地建立了连接</li>
<li>两次握手无法识别这种历史连接</li>
</ul>

<h3>8.2 为什么是四次挥手？</h3>
<p>因为TCP是全双工协议，每个方向都需要单独关闭。服务器收到FIN后，可能还有数据要发送，所以先回复ACK，等数据发送完后才发FIN。</p>

<h3>8.3 TCP与UDP的区别？</h3>
<pre><code>| 特性        | TCP           | UDP           |
|-------------|---------------|---------------|
| 连接性      | 面向连接      | 无连接        |
| 可靠性      | 可靠          | 不可靠        |
| 传输方式     | 字节流        | 数据报        |
| 拥塞控制     | 有            | 无            |
| 速度        | 较慢          | 较快          |
| 适用场景     | 文件传输      | 实时通信      |</code></pre>

<h2>九、实际编程中的注意事项</h2>

<h3>9.1 socket编程模板</h3>
<pre><code># TCP服务器
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('0.0.0.0', 8080))
server.listen(128)

while True:
    client_sock, addr = server.accept()
    # 正确处理每个客户端连接
    try:
        while True:
            data = client_sock.recv(1024)
            if not data:
                break
            # 处理数据
            client_sock.sendall(data)
    finally:
        client_sock.close()  # 确保关闭连接

# TCP客户端
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(('127.0.0.1', 8080))
client.sendall(b'Hello')
response = client.recv(1024)
client.close()</code></pre>

<h3>9.2 心跳检测</h3>
<pre><code>import socket
import time

class HeartbeatConnection:
    def __init__(self, sock, interval=30):
        self.sock = sock
        self.interval = interval
        self.last_heartbeat = time.time()
    
    def send_heartbeat(self):
        try:
            self.sock.sendall(b'HEARTBEAT')
            self.last_heartbeat = time.time()
            return True
        except:
            return False
    
    def is_alive(self):
        return time.time() - self.last_heartbeat < self.interval * 3</code></pre>

<h2>十、总结</h2>
<p>TCP协议是网络编程的基础，理解三次握手四次挥手、状态转换、TIME_WAIT和CLOSE_WAIT等问题，对于编写高质量的网络应用至关重要。</p>`
  },
];

// 监听路由变化
watch(
  () => route.query.category,
  newCategory => {
    if (newCategory) {
      selectedCategory.value = newCategory;
      fetchData();
    }
  }
);

// Mock 知识点数据 - 合并基础版+扩展版，一次性定义完整
let _mockArticles = [
  // JavaScript 系列
  { id: 'mk1', title: 'JavaScript闭包原理与应用场景', categoryId: 'js', categoryName: 'JavaScript', summary: '深入理解闭包的执行上下文、作用域链，以及在模块化、防抖节流中的经典应用', level: 2, keywords: ['闭包', '作用域', '执行上下文'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb1/80/60', content: '<h3>闭包基础</h3><p>闭包是指函数能够访问其词法作用域之外的变量的能力。当一个内部函数引用了外部函数的变量，即使外部函数已经执行完毕，这些变量依然会被保留。</p><h3>经典应用</h3><ul><li>防抖（Debounce）与节流（Throttle）</li><li>模块化私有变量</li><li>函数柯里化</li></ul><pre><code>function counter() {\n  let count = 0;\n  return () => ++count;\n}</code></pre>' },
  { id: 'mk2', title: 'Vue3响应式系统：Proxy vs Object.defineProperty', categoryId: 'vue', categoryName: 'Vue3', summary: 'Vue3使用Proxy替代Object.defineProperty的原因，track/trigger依赖收集机制详解', level: 3, keywords: ['Proxy', '响应式', 'Vue3'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb2/80/60', content: '<h3>Vue3响应式原理</h3><p>Vue3使用Proxy替代了Object.defineProperty来实现响应式系统。Proxy可以监听对象属性的添加、删除，以及数组元素的变化。</p><pre><code>const proxy = new Proxy(target, handler)</code></pre>' },
  { id: 'mk3', title: 'Python生成器与协程：yield的深度解析', categoryId: 'py', categoryName: 'Python', summary: 'generator/yield/send机制，以及async/await的协程模型在异步IO中的应用', level: 3, keywords: ['生成器', 'yield', '协程'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb3/80/60', content: '<h3>生成器基础</h3><p>生成器是一种特殊的迭代器，使用yield关键字来暂停和恢复执行。</p><pre><code>def gen():\n    yield 1\n    yield 2\n    yield 3</code></pre>' },
  { id: 'mk4', title: 'TCP三次握手与四次挥手全解析', categoryId: 'net', categoryName: '计算机网络', summary: '从状态机角度深入理解TCP连接建立与断开过程，TIME_WAIT和CLOSE_WAIT常见问题', level: 2, keywords: ['TCP', '三次握手', '网络'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb4/80/60', content: '<h3>三次握手</h3><p>1. 客户端发送SYN</p><p>2. 服务器返回SYN+ACK</p><p>3. 客户端发送ACK</p><h3>四次挥手</h3><p>断开连接需要双方各发送一次FIN并确认。</p>' },
  { id: 'mk5', title: 'MySQL索引优化：B+树与查询计划', categoryId: 'db', categoryName: '数据库', summary: '聚簇索引、覆盖索引、联合索引最左前缀原则，EXPLAIN分析查询性能瓶颈', level: 3, keywords: ['MySQL', '索引', 'B+树'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb5/80/60', content: '<h3>B+树结构</h3><p>InnoDB使用B+树作为索引结构，所有数据都存储在叶子节点，非叶子节点只存储索引键值。</p><pre><code>EXPLAIN SELECT * FROM users WHERE age > 20;</code></pre>' },
  { id: 'mk6', title: 'React Hooks原理：useState与useEffect源码解析', categoryId: 'react', categoryName: 'React', summary: '从Fiber架构理解Hooks链表结构，useState更新队列和useEffect的调度机制', level: 4, keywords: ['React', 'Hooks', 'Fiber'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb6/80/60', content: '<h3>Hooks链表</h3><p>React使用链表来存储Hooks的状态，每个Hook节点包含当前状态和更新队列。</p>' },
  { id: 'mk7', title: 'Docker容器原理：namespace与cgroup', categoryId: 'devops', categoryName: 'DevOps', summary: 'Linux namespace资源隔离，cgroup资源限制，以及容器镜像分层存储机制', level: 3, keywords: ['Docker', 'namespace', 'cgroup'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb7/80/60', content: '<h3>Namespace隔离</h3><p>Linux Namespace提供了进程、网络、文件系统等资源的隔离。</p><h3>cgroup限制</h3><p>cgroup用于限制、隔离和监控进程组的资源使用。</p>' },
  { id: 'mk8', title: '动态规划：从记忆化搜索到状态转移方程', categoryId: 'algo', categoryName: '算法', summary: '背包问题、最长公共子序列、编辑距离等经典DP问题的状态定义与转移分析', level: 3, keywords: ['动态规划', 'DP', '算法'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb8/80/60', content: '<h3>DP三部曲</h3><p>1. 定义状态</p><p>2. 推导转移方程</p><p>3. 确定初始值和边界</p><pre><code>dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + 1</code></pre>' },
  { id: 'mk9', title: 'Java并发编程：volatile与happens-before', categoryId: 'java', categoryName: 'Java', summary: 'JMM内存模型，volatile的内存屏障实现，synchronized锁升级与AQS框架原理', level: 4, keywords: ['Java', 'volatile', 'JMM'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb9/80/60', content: '<h3>JMM内存模型</h3><p>Java内存模型定义了线程与主内存之间的抽象关系。</p><h3>happens-before规则</h3><p>volatile变量的写操作happens-before读操作。</p>' },
  { id: 'mk10', title: 'HTTP/2与HTTP/3核心特性对比', categoryId: 'net', categoryName: '计算机网络', summary: '多路复用、头部压缩、服务端推送，QUIC协议解决HTTP/2队头阻塞问题', level: 2, keywords: ['HTTP/2', 'HTTP/3', 'QUIC'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb10/80/60', content: '<h3>HTTP/2特性</h3><p>多路复用、HPACK头部压缩、Server Push</p><h3>HTTP/3 (QUIC)</h3><p>基于UDP，解决队头阻塞问题，0-RTT连接建立。</p>' },
  // 前端开发系列
  { id: 'mk11', title: 'CSS Flexbox布局全攻略', categoryId: 'css', categoryName: '前端开发', summary: 'flex-direction、justify-content、align-items等核心属性详解，以及常见布局场景', level: 1, keywords: ['Flexbox', 'CSS', '布局'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb11/80/60', content: '<h3>Flex容器属性</h3><ul><li>flex-direction: 主轴方向</li><li>justify-content: 主轴对齐</li><li>align-items: 交叉轴对齐</li></ul>' },
  { id: 'mk12', title: 'CSS Grid布局实战技巧', categoryId: 'css', categoryName: '前端开发', summary: 'grid-template-columns/rows、grid-area、auto-fit/auto-fill等Grid布局核心技巧', level: 2, keywords: ['Grid', 'CSS', '布局'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb12/80/60', content: '<h3>Grid vs Flexbox</h3><p>Grid适合二维布局（行+列），Flexbox适合一维布局（单行或单列）。</p><pre><code>grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))</code></pre>' },
  { id: 'mk13', title: 'TypeScript类型体操入门', categoryId: 'ts', categoryName: '前端开发', summary: '条件类型、映射类型、infer关键词，掌握TypeScript高级类型技巧', level: 4, keywords: ['TypeScript', '类型', '泛型'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb13/80/60', content: '<h3>条件类型</h3><pre><code>type IsString<T> = T extends string ? true : false</code></pre><h3>映射类型</h3><pre><code>type Readonly<T> = { readonly [P in keyof T]: T[P] }</code></pre>' },
  { id: 'mk14', title: '前端性能优化：Core Web Vitals', categoryId: 'perf', categoryName: '前端开发', summary: 'LCP、FID、CLS三大核心指标优化策略，以及Chrome DevTools性能分析', level: 3, keywords: ['性能优化', 'LCP', 'CLS'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb14/80/60', content: '<h3>Core Web Vitals</h3><ul><li>LCP: 最大内容绘制时间 (&lt;2.5s)</li><li>FID: 首次输入延迟 (&lt;100ms)</li><li>CLS: 累积布局偏移 (&lt;0.1)</li></ul>' },
  { id: 'mk15', title: 'Webpack 5模块联邦详解', categoryId: 'build', categoryName: '前端开发', summary: 'Module Federation微前端架构原理，remote和host配置，以及共享依赖策略', level: 4, keywords: ['Webpack', '模块联邦', '微前端'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb15/80/60', content: '<h3>模块联邦核心概念</h3><p>允许一个webpack构建的产物被其他构建产物直接使用，实现真正的微前端。</p><pre><code>new ModuleFederationPlugin({ name: "host", remotes: { app1: "app1@http://localhost:3001/remoteEntry.js" } })</code></pre>' },
  { id: 'mk16', title: 'Vite与现代前端构建工具对比', categoryId: 'build', categoryName: '前端开发', summary: 'Vite vs Webpack vs Rollup，ESM、HMR速度、插件机制全面对比', level: 2, keywords: ['Vite', 'Webpack', '构建工具'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb16/80/60', content: '<h3>Vite核心优势</h3><p>基于ESM的开发服务器，告别bundle，HMR速度快到无感。</p><pre><code>npm create vite@latest my-vue-app</code></pre>' },
  { id: 'mk17', title: 'Tailwind CSS原子化CSS实践', categoryId: 'css', categoryName: '前端开发', summary: 'utility-first设计理念，响应式前缀、暗色模式、JIT编译器使用技巧', level: 2, keywords: ['Tailwind', 'CSS', '原子化'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb17/80/60', content: '<h3>核心概念</h3><p>Tailwind通过组合小粒度工具类来实现样式，避免重复CSS代码。</p><pre><code><div class="flex items-center justify-between p-4 bg-gray-100"></code></pre>' },
  { id: 'mk18', title: '浏览器渲染原理与关键渲染路径', categoryId: 'browser', categoryName: '前端开发', summary: 'DOM树、CSSOM树、RenderObject树构建过程，以及CRP优化策略', level: 3, keywords: ['浏览器', '渲染', 'CRP'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb18/80/60', content: '<h3>关键渲染路径</h3><p>1. 解析HTML构建DOM</p><p>2. 解析CSS构建CSSOM</p><p>3. 合并DOM和CSSOM生成RenderTree</p><p>4. Layout计算布局</p><p>5. Paint绘制</p>' },
  // Python 系列
  { id: 'mk19', title: 'Python异步编程：asyncio实战', categoryId: 'py', categoryName: 'Python', summary: 'async/await语法、事件循环、Task与Future、并发爬虫与API调用实战', level: 3, keywords: ['asyncio', '异步', 'Python'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb19/80/60', content: '<h3>asyncio核心</h3><pre><code>import asyncio\n\nasync def main():\n    await asyncio.gather(task1(), task2())\n\nasyncio.run(main())</code></pre>' },
  { id: 'mk20', title: 'Python装饰器高级用法', categoryId: 'py', categoryName: 'Python', summary: '@wraps保留元数据、带参数装饰器、类装饰器、装饰器栈详解', level: 3, keywords: ['装饰器', 'Python', '高级'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb20/80/60', content: '<h3>带参数装饰器</h3><pre><code>def retry(max_times=3):\n    def decorator(func):\n        @wraps(func)\n        def wrapper(*args, **kwargs):\n            for _ in range(max_times):\n                try: return func(*args, **kwargs)\n                except: pass\n        return wrapper\n    return decorator</code></pre>' },
  { id: 'mk21', title: 'Python数据分析：Pandas进阶技巧', categoryId: 'py', categoryName: 'Python', summary: '向量化操作、分组聚合、多表合并、缺失值处理与性能优化', level: 3, keywords: ['Pandas', '数据分析', 'Python'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb21/80/60', content: '<h3>分组聚合</h3><pre><code>df.groupby("category").agg({"sales": "sum", "profit": "mean"})</code></pre>' },
  { id: 'mk22', title: 'FastAPI高性能Web开发', categoryId: 'py', categoryName: 'Python', summary: '异步路由、Pydantic验证、依赖注入、OAuth2+JWT认证完整教程', level: 3, keywords: ['FastAPI', 'Web', 'Python'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb22/80/60', content: '<h3>FastAPI示例</h3><pre><code>@app.post("/users/{user_id}")\nasync def get_user(user_id: int, q: str = None):\n    return {"user_id": user_id, "query": q}</code></pre>' },
  { id: 'mk23', title: 'Python GIL与多线程/多进程', categoryId: 'py', categoryName: 'Python', summary: '全局解释器锁原理、threading vs multiprocessing、并行vs并发实战选择', level: 3, keywords: ['GIL', '多线程', '多进程'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb23/80/60', content: '<h3>GIL影响</h3><p>GIL导致CPU密集型任务无法通过多线程实现真正并行。I/O密集型任务因GIL释放仍可受益。</p>' },
  { id: 'mk24', title: 'Python类型注解与mypy静态检查', categoryId: 'py', categoryName: 'Python', summary: 'PEP 484类型提示、Protocol结构化类型、泛型容器、mypy配置与CI集成', level: 2, keywords: ['类型注解', 'mypy', '类型提示'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb24/80/60', content: '<h3>类型注解示例</h3><pre><code>def greet(name: str) -> str:\n    return f"Hello, {name}"</code></pre>' },
  // Java 系列
  { id: 'mk25', title: 'Spring Boot 3.x核心注解详解', categoryId: 'java', categoryName: 'Java', summary: '@Bean、@Component、@Configuration、@Import、AOP注解与条件注解全解', level: 3, keywords: ['Spring', '注解', 'Spring Boot'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb25/80/60', content: '<h3>核心注解</h3><ul><li>@SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan</li><li>@Bean用于方法，产生一个由Spring管理的bean</li></ul>' },
  { id: 'mk26', title: 'JVM调优与GC算法选择', categoryId: 'java', categoryName: 'Java', summary: 'G1、ZGC、Shenandoah垃圾收集器对比，JVM参数调优与Arthas诊断', level: 4, keywords: ['JVM', 'GC', '调优'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb26/80/60', content: '<h3>G1收集器</h3><p>G1将堆划分为多个Region，采用标记-整理算法，可预测停顿时间。适合大堆内存应用。</p><pre><code>-XX:+UseG1GC -XX:MaxGCPauseMillis=200</code></pre>' },
  { id: 'mk27', title: 'Java Stream API函数式编程', categoryId: 'java', categoryName: 'Java', summary: 'filter/map/reduce链式调用、并行流ForkJoinPool、Optional优雅处理空值', level: 2, keywords: ['Stream', 'Lambda', '函数式'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb27/80/60', content: '<h3>Stream链式操作</h3><pre><code>list.stream()\n    .filter(x -> x > 0)\n    .map(x -> x * 2)\n    .collect(Collectors.toList());</code></pre>' },
  { id: 'mk28', title: '设计模式Java实现：创建型', categoryId: 'java', categoryName: 'Java', summary: '单例、工厂方法、抽象工厂、建造者、原型模式在Java中的最佳实践', level: 3, keywords: ['设计模式', '单例', '工厂'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb28/80/60', content: '<h3>单例模式（双重检查）</h3><pre><code>public class Singleton {\n    private static volatile Singleton instance;\n    public static Singleton getInstance() {\n        if (instance == null) {\n            synchronized (Singleton.class) {\n                if (instance == null) instance = new Singleton();\n            }\n        }\n        return instance;\n    }\n}</code></pre>' },
  { id: 'mk29', title: 'Spring Cloud微服务架构实战', categoryId: 'java', categoryName: 'Java', summary: '服务注册发现、配置中心、熔断限流、网关路由、分布式事务seata', level: 4, keywords: ['Spring Cloud', '微服务', '分布式'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb29/80/60', content: '<h3>核心组件</h3><ul><li>Nacos: 注册中心+配置中心</li><li>Sentinel: 熔断限流</li><li>Gateway: API网关</li><li>Seata: 分布式事务</li></ul>' },
  { id: 'mk30', title: 'MyBatis-Plus CRUD进阶用法', categoryId: 'java', categoryName: 'Java', summary: 'Wrapper条件构造器、批量操作、分页插件、自定义SQL注解使用', level: 2, keywords: ['MyBatis-Plus', 'ORM', 'CRUD'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb30/80/60', content: '<h3>Wrapper用法</h3><pre><code>queryWrapper.eq("status", 1)\n         .like("name", "test")\n         .orderByDesc("create_time")\n         .last("LIMIT 10");</code></pre>' },
  // 算法系列
  { id: 'mk31', title: '图论算法：Dijkstra与Floyd', categoryId: 'algo', categoryName: '算法', summary: '最短路径算法实现、堆优化、路径还原，以及差分约束系统应用', level: 3, keywords: ['Dijkstra', '图论', '最短路'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb31/80/60', content: '<h3>Dijkstra算法</h3><pre><code>import heapq\ndef dijkstra(graph, start):\n    dist = {v: float(\'inf\') for v in graph}\n    dist[start] = 0\n    pq = [(0, start)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, w in graph[u]:\n            if dist[v] > dist[u] + w:\n                dist[v] = dist[u] + w\n                heapq.heappush(pq, (dist[v], v))\n    return dist</code></pre>' },
  { id: 'mk32', title: '并查集：Union-Find数据结构', categoryId: 'algo', categoryName: '算法', summary: '路径压缩、按秩合并、Kruskal最小生成树、连通分量检测实战', level: 2, keywords: ['并查集', 'Union-Find', '连通性'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb32/80/60', content: '<h3>并查集模板</h3><pre><code>class UnionFind:\n    def __init__(self, n):\n        self.parent = list(range(n))\n        self.rank = [0] * n\n    def find(self, x):\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])\n        return self.parent[x]\n    def union(self, x, y):\n        px, py = self.find(x), self.find(y)\n        if px == py: return False\n        if self.rank[px] < self.rank[py]: px, py = py, px\n        self.parent[py] = px\n        if self.rank[px] == self.rank[py]: self.rank[px] += 1\n        return True</code></pre>' },
  { id: 'mk33', title: '前缀和与差分数组技巧', categoryId: 'algo', categoryName: '算法', summary: 'Range Sum查询、区间增减更新、二维前缀和、LeetCode经典题型', level: 2, keywords: ['前缀和', '差分', '数组'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb33/80/60', content: '<h3>一维前缀和</h3><pre><code>prefix[i+1] = prefix[i] + nums[i]\nrange_sum(l, r) = prefix[r+1] - prefix[l]</code></pre><h3>差分数组</h3><p>用于区间批量增减，O(1)更新，O(n)查询。</p>' },
  { id: 'mk34', title: '回溯算法与子集枚举', categoryId: 'algo', categoryName: '算法', summary: '组合总和、全排列、岛屿数量、N皇后问题剪枝技巧', level: 3, keywords: ['回溯', 'DFS', '子集'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb34/80/60', content: '<h3>回溯模板</h3><pre><code>def backtrack(nums, path, result):\n    if not nums:\n        result.append(path[:])\n        return\n    for i in range(len(nums)):\n        path.append(nums[i])\n        backtrack(nums[:i] + nums[i+1:], path, result)\n        path.pop()</code></pre>' },
  { id: 'mk35', title: '单调栈：Next Greater Element', categoryId: 'algo', categoryName: '算法', summary: '单调递减栈模板、每日温度、柱状图最大矩形、接雨水问题', level: 3, keywords: ['单调栈', 'Next Greater', 'LeetCode'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb35/80/60', content: '<h3>单调栈模板</h3><pre><code>stack = []  # 存索引\nfor i in range(len(nums)):\n    while stack and nums[stack[-1]] < nums[i]:\n        result[stack.pop()] = nums[i]\n    stack.append(i)</code></pre>' },
  // 数据库系列
  { id: 'mk36', title: 'Redis数据类型与应用场景', categoryId: 'redis', categoryName: '数据库', summary: 'String/Hash/List/Set/ZSet，以及Bitmap、HyperLogLog、 GEO地理位置', level: 2, keywords: ['Redis', '缓存', '数据类型'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb36/80/60', content: '<h3>数据类型选择</h3><ul><li>String: 计数器、Session、缓存JSON</li><li>Hash: 对象存储、购物车</li><li>List: 消息队列、排行榜</li><li>Set: 标签系统、去重</li><li>ZSet: 有序排行榜、延迟队列</li></ul>' },
  { id: 'mk37', title: 'Redis持久化：RDB与AOF对比', categoryId: 'redis', categoryName: '数据库', summary: 'RDB快照、AOF日志、混合持久化，以及fork进程与COW机制', level: 3, keywords: ['Redis', '持久化', 'RDB', 'AOF'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb37/80/60', content: '<h3>RDB vs AOF</h3><p>RDB: 定时生成数据快照，适合备份，恢复快但可能丢数据。</p><p>AOF: 记录每个写命令，丢数据少但文件大，可配置fsync策略。</p><h3>推荐配置</h3><pre><code>appendonly yes\nappendfsync everysec</code></pre>' },
  { id: 'mk38', title: 'MySQL事务隔离级别详解', categoryId: 'db', categoryName: '数据库', summary: '脏读、不可重复读、幻读，以及RC/RR/SerIALIZABLE实现原理', level: 3, keywords: ['MySQL', '事务', '隔离级别'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb38/80/60', content: '<h3>隔离级别</h3><ul><li>读未提交 (Read Uncommitted)</li><li>读已提交 (Read Committed)</li><li>可重复读 (Repeatable Read) - MySQL默认</li><li>串行化 (Serializable)</li></ul><p>MVCC多版本并发控制是RC和RR实现的核心。</p>' },
  { id: 'mk39', title: 'MongoDB聚合管道进阶', categoryId: 'db', categoryName: '数据库', summary: '$match/$group/$project/$lookup/$unwind，以及MapReduce复杂统计', level: 3, keywords: ['MongoDB', '聚合', '管道'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb39/80/60', content: '<h3>聚合管道示例</h3><pre><code>db.orders.aggregate([\n  { $match: { status: "completed" } },\n  { $unwind: "$items" },\n  { $group: { _id: "$userId", total: { $sum: "$items.price" } } },\n  { $sort: { total: -1 } },\n  { $limit: 10 }\n])</code></pre>' },
  { id: 'mk40', title: 'SQL优化：EXPLAIN执行计划分析', categoryId: 'db', categoryName: '数据库', summary: 'type/index/ref/rows/Extra字段解读，全表扫描与索引扫描识别', level: 3, keywords: ['SQL优化', 'EXPLAIN', '索引'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb40/80/60', content: '<h3>EXPLAIN关键字段</h3><ul><li>type: const/ref/eq_ref/ref_or_null/range/index/ALL</li><li>key: 实际使用的索引</li><li>rows: 预计扫描行数</li><li>Extra: Using filesort/Using temporary需优化</li></ul>' },
  // DevOps系列
  { id: 'mk41', title: 'Kubernetes核心概念与架构', categoryId: 'k8s', categoryName: 'DevOps', summary: 'Pod/Deployment/Service/ConfigMap/HPA，以及kube-proxy网络原理', level: 3, keywords: ['Kubernetes', 'K8s', '容器编排'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb41/80/60', content: '<h3>K8s核心对象</h3><ul><li>Pod: 最小调度单元</li><li>Deployment: 无状态应用管理</li><li>StatefulSet: 有状态应用</li><li>Service: 服务发现与负载均衡</li><li>ConfigMap/Secret: 配置管理</li></ul>' },
  { id: 'mk42', title: 'Git高级操作与团队协作', categoryId: 'git', categoryName: 'DevOps', summary: 'rebase vs merge、 cherry-pick、submodule、git stash与reflog恢复', level: 2, keywords: ['Git', '版本控制', '团队协作'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb42/80/60', content: '<h3>rebase vs merge</h3><p>merge保留完整历史，rebase创建线性历史。公共分支用merge，功能分支可用rebase。</p><pre><code>git rebase -i HEAD~3  # 交互式变基</code></pre>' },
  { id: 'mk43', title: 'CI/CD流水线设计最佳实践', categoryId: 'cicd', categoryName: 'DevOps', summary: 'GitHub Actions/Jenkins流水线、自动化测试、制品库、蓝绿部署', level: 3, keywords: ['CI/CD', 'DevOps', '自动化'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb43/80/60', content: '<h3>流水线阶段</h3><ul><li>代码检出 → 依赖安装 → 单元测试</li><li>构建 → 静态分析 → 安全扫描</li><li>集成测试 → 性能测试 → 镜像推送</li><li>部署到测试环境 → 审批 → 生产部署</li></ul>' },
  { id: 'mk44', title: 'Nginx反向代理与负载均衡', categoryId: 'nginx', categoryName: 'DevOps', summary: 'upstream配置、ip_hash/least_conn/加权轮询，以及缓存与HTTPS配置', level: 2, keywords: ['Nginx', '负载均衡', '反向代理'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb44/80/60', content: '<h3>负载均衡配置</h3><pre><code>upstream backend {\n    least_conn;  # 最少连接\n    server 127.0.0.1:3000 weight=5;\n    server 127.0.0.1:3001 weight=3;\n    server 127.0.0.1:3002 backup;\n}\nlocation / {\n    proxy_pass http://backend;\n}</code></pre>' },
  { id: 'mk45', title: 'Prometheus+Grafana监控实战', categoryId: 'monitor', categoryName: 'DevOps', summary: '指标采集、PromQL查询、AlertManager告警，以及大盘设计', level: 3, keywords: ['Prometheus', 'Grafana', '监控'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb45/80/60', content: '<h3>PromQL示例</h3><pre><code># CPU使用率\n100 - (avg by (instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)\n# 请求率\nrate(http_requests_total[5m])</code></pre>' },
  // AI/机器学习系列
  { id: 'mk46', title: 'PyTorch张量操作与自动求导', categoryId: 'ml', categoryName: 'AI/机器学习', summary: '张量创建、运算、广播机制，autograd反向传播与梯度计算', level: 2, keywords: ['PyTorch', '张量', '自动求导'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb46/80/60', content: '<h3>自动求导示例</h3><pre><code>x = torch.tensor([1., 2., 3.], requires_grad=True)\ny = x ** 2\nz = y.sum()  # z = 1 + 4 + 9 = 14\nz.backward()  # dz/dx = 2x = [2, 4, 6]\nprint(x.grad)  # tensor([2., 4., 6.])</code></pre>' },
  { id: 'mk47', title: 'Transformer注意力机制详解', categoryId: 'ml', categoryName: 'AI/机器学习', summary: 'Self-Attention、Multi-Head Attention、Positional Encoding与BERT/GPT原理', level: 4, keywords: ['Transformer', '注意力机制', 'NLP'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb47/80/60', content: '<h3>Self-Attention计算</h3><pre><code>Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V</code></pre><p>Multi-Head Attention在多个子空间并行计算注意力，增强模型表达能力。</p>' },
  { id: 'mk48', title: 'CNN卷积神经网络实战', categoryId: 'ml', categoryName: 'AI/机器学习', summary: '卷积/池化层原理、LeNet/AlexNet/VGG/ResNet结构演进，迁移学习', level: 3, keywords: ['CNN', '深度学习', '图像'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb48/80/60', content: '<h3>ResNet残差结构</h3><p>残差连接解决深层网络退化问题：F(x) = H(x) - x</p><pre><code>class ResidualBlock(nn.Module):\n    def __init__(self, in_channels, out_channels):\n        super().__init__()\n        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1)\n        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1)\n        self.shortcut = nn.Identity() if in_channels == out_channels else nn.Conv2d(in_channels, out_channels, 1)\n    def forward(self, x):\n        return nn.ReLU(self.conv2(nn.ReLU(self.conv1(x)))) + self.shortcut(x)</code></pre>' },
  { id: 'mk49', title: 'XGBoost/LightGBM梯度提升实战', categoryId: 'ml', categoryName: 'AI/机器学习', summary: 'GBDT原理、XGBoost正则化与剪枝、LightGBM直方图加速、CatBoost类别特征', level: 3, keywords: ['XGBoost', 'LightGBM', '梯度提升'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb49/80/60', content: '<h3>XGBoost目标函数</h3><pre><code>Obj = L(θ) + Ω(f) = sum(l(y_i, y_pred_i)) + sum(Ω(f_k))</code></pre><p>其中Ω为正则项，控制模型复杂度，防止过拟合。</p>' },
  { id: 'mk50', title: 'RAG检索增强生成技术详解', categoryId: 'llm', categoryName: 'AI/机器学习', summary: '向量数据库、Embedding模型、混合检索、ReRank重排序与RAG优化', level: 4, keywords: ['RAG', '向量数据库', 'LLM'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb50/80/60', content: '<h3>RAG流程</h3><ol><li>文档切分 (Chunking)</li><li>Embedding向量化</li><li>向量存储到数据库 (Milvus/Pinecone)</li><li>Query向量化并检索</li><li>上下文注入LLM生成</li></ol><h3>混合检索</h3><p>结合语义搜索和关键词搜索(BM25)，提高召回率。</p>' },
  { id: 'mk51', title: 'LangChain框架核心组件解析', categoryId: 'llm', categoryName: 'AI/机器学习', summary: 'PromptTemplate、Chain、Agent、Memory与Vector Store集成', level: 3, keywords: ['LangChain', 'Agent', 'LLM应用'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb51/80/60', content: '<h3>LangChain核心概念</h3><ul><li>Model I/O: Prompt管理、模型调用</li><li>Retrieval: 外部数据检索</li><li>Chains: 多步骤任务编排</li><li>Agent: 动态决策执行</li><li>Memory: 对话历史管理</li></ul><pre><code>from langchain_openai import ChatOpenAI\nfrom langchain.chains import RetrievalQA\n\nllm = ChatOpenAI(model="gpt-4")\nqa_chain = RetrievalQA.from_chain_type(llm, retriever=vectorstore.as_retriever())</code></pre>' },
  { id: 'mk52', title: '大模型微调技术：LoRA与RLHF', categoryId: 'llm', categoryName: 'AI/机器学习', summary: 'Fine-tuning vs LoRA、Adapter、RLHF人类反馈强化学习、DPO优化', level: 4, keywords: ['LoRA', 'RLHF', '模型微调'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb52/80/60', content: '<h3>LoRA原理</h3><p>冻结预训练权重，只更新低秩分解后的A、B矩阵，大幅减少训练参数量。</p><pre><code>W_new = W_0 + BA  # W_0冻结，BA可训练\n# 参数量: 2 * r * d (相比 d*d 大幅减少)</code></pre>' },
  { id: 'mk53', title: 'GraphQL vs REST API对比', categoryId: 'api', categoryName: '前端开发', summary: 'GraphQL查询语言、Schema定义、N+1问题与DataLoader解决、Apollo Client', level: 2, keywords: ['GraphQL', 'REST', 'API'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb53/80/60', content: '<h3>GraphQL优势</h3><ul><li>一次请求获取所有需要的数据</li><li>强类型Schema，IDE自动补全</li><li>按需返回字段，避免过度获取</li></ul><pre><code>query {\n  user(id: "1") {\n    name\n    email\n    posts { title }\n  }\n}</code></pre>' },
  { id: 'mk54', title: 'WebSocket实时通信实战', categoryId: 'api', categoryName: '前端开发', summary: 'WebSocket协议、心跳机制、断线重连、Socket.io与MQTT协议对比', level: 2, keywords: ['WebSocket', '实时通信', 'Socket.io'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb54/80/60', content: '<h3>WebSocket心跳</h3><pre><code>// 心跳保活\nsetInterval(() => {\n  if (ws.readyState === WebSocket.OPEN) {\n    ws.send(JSON.stringify({ type: "ping" }));\n  }\n}, 30000);\n\n// 断线重连\nws.onclose = () => {\n  setTimeout(() => connect(), 1000);\n};</code></pre>' },
  { id: 'mk55', title: 'WebRTC点对点通信详解', categoryId: 'webrtc', categoryName: '前端开发', summary: 'ICE/STUN/TURN服务器、SDP协商、MediaStream与RTCPeerConnection', level: 4, keywords: ['WebRTC', '音视频', 'P2P'], createdAt: new Date().toISOString(), cover: 'https://picsum.photos/seed/kb55/80/60', content: '<h3>WebRTC信令流程</h3><ol><li>双方各创建RTCPeerConnection</li><li>各自添加本地媒体流</li><li>创建offer/answer SDP</li><li>交换candidate候选者</li><li>建立P2P连接</li></ol>' },
];

// 合并扩展版详细内容（expandedMockArticles 包含完整 HTML 内容）
_mockArticles.push(...expandedMockArticles);

// 导出为 const（不可变引用）
const mockArticles = _mockArticles;

const fetchData = async () => {
  loading.value = true;
  error.value = '';
  try {
    // 获取分类数据
    const categoriesResponse = await axios.get('/api/categories');
    categories.value = categoriesResponse.data.data;

    // 获取知识点数据 - 使用新的API
    const knowledgePointsResponse = await knowledgeBaseApi.getKnowledgePointTree();

    // 转换知识点数据为文章格式 - 添加空值检查
    if (knowledgePointsResponse.data && Array.isArray(knowledgePointsResponse.data.data) && knowledgePointsResponse.data.data.length > 0) {
      articles.value = knowledgePointsResponse.data.data.map(item => ({
        id: item._id,
        title: item.name,
        categoryId: item.category,
        categoryName:
          categoriesResponse.data.data.find(c => c._id === item.category)?.name || '未分类',
        summary: item.description || '暂无描述',
        content: item.content || '<p>暂无详细内容</p>',
        level: item.level,
        keywords: item.keywords || [],
        createdAt: new Date().toISOString(),
      }));
    } else {
      // 如果没有数据或数据格式不符合预期，使用mock数据
      articles.value = mockArticles;
    }

    currentPage.value = 1;
  } catch (err) {
    console.error('获取数据失败:', err);
    // API失败时使用mock数据
    articles.value = mockArticles;
  } finally {
    loading.value = false;
  }
};

// 过滤后的文章列表
const filteredArticles = computed(() => {
  let filtered = [...articles.value];

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(article => article.categoryId === selectedCategory.value);
  }

  // 按关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(
      article =>
        article.title.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword) ||
        article.content.toLowerCase().includes(keyword)
    );
  }

  // 新增：基于用户兴趣排序（优先展示感兴趣内容）
  if (userStore.isLogin && userStore.userInfo?.learningInterests?.length > 0) {
    const userInterests = userStore.userInfo.learningInterests;

    // 排序：与用户兴趣匹配的文章排在前面
    filtered.sort((a, b) => {
      // 计算文章a与用户兴趣的匹配度
      const aMatchCount = calculateMatchScore(a, userInterests);

      // 计算文章b与用户兴趣的匹配度
      const bMatchCount = calculateMatchScore(b, userInterests);

      // 匹配度高的排在前面
      return bMatchCount - aMatchCount;
    });
  } else {
    // 如果用户未登录或没有兴趣，按热门程度排序
    filtered.sort((a, b) => {
      // 假设我们有一个popularity字段表示热门程度
      const aPopularity = (a.keywords?.length || 0) + (a.description?.length || 0);
      const bPopularity = (b.keywords?.length || 0) + (b.description?.length || 0);
      return bPopularity - aPopularity;
    });
  }

  // 分页
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return filtered.slice(startIndex, startIndex + pageSize.value);
});

// 计算匹配分数的辅助函数
const calculateMatchScore = (article, userInterests) => {
  let score = 0;

  // 权重设置
  const weights = {
    title: 3, // 标题匹配权重最高
    categoryName: 2, // 分类名匹配权重次之
    summary: 1.5, // 摘要匹配权重
    content: 1, // 内容匹配权重
    keywords: 2.5, // 关键词匹配权重
  };

  // 检查标题匹配
  userInterests.forEach(interest => {
    if (article.title && article.title.toLowerCase().includes(interest.toLowerCase())) {
      score += weights.title;
    }
  });

  // 检查分类名匹配
  userInterests.forEach(interest => {
    if (
      article.categoryName &&
      article.categoryName.toLowerCase().includes(interest.toLowerCase())
    ) {
      score += weights.categoryName;
    }
  });

  // 检查摘要匹配
  userInterests.forEach(interest => {
    if (article.summary && article.summary.toLowerCase().includes(interest.toLowerCase())) {
      score += weights.summary;
    }
  });

  // 检查内容匹配
  userInterests.forEach(interest => {
    if (article.content && article.content.toLowerCase().includes(interest.toLowerCase())) {
      score += weights.content;
    }
  });

  // 检查关键词匹配
  userInterests.forEach(interest => {
    if (
      article.keywords &&
      article.keywords.some(keyword => keyword.toLowerCase().includes(interest.toLowerCase()))
    ) {
      score += weights.keywords;
    }
  });

  return score;
};

// 总页数
const totalPages = computed(() => {
  let filtered = [...articles.value];

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(article => article.categoryId === selectedCategory.value);
  }

  // 按关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(
      article =>
        article.title.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword) ||
        article.content.toLowerCase().includes(keyword)
    );
  }

  return Math.ceil(filtered.length / pageSize.value);
});

// 搜索
const search = () => {
  currentPage.value = 1;
};

// 选择分类
const selectCategory = categoryId => {
  selectedCategory.value = categoryId;
  currentPage.value = 1;
};

// 关闭文章
const closeArticle = () => {
  currentArticle.value = null;
};

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// 收藏状态
const isFavorited = ref(false);

// 收藏文章
const toggleFavorite = async () => {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录后再收藏');
    return;
  }

  if (!currentArticle.value) return;

  try {
    if (isFavorited.value) {
      await favoriteApi.remove(currentArticle.value.id, 'KnowledgePoint');
      isFavorited.value = false;
      ElMessage.success('已取消收藏');
    } else {
      await favoriteApi.add(currentArticle.value.id, 'KnowledgePoint', '知识库收藏');
      isFavorited.value = true;
      ElMessage.success('已添加到收藏夹');
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    ElMessage.error('操作失败，请重试');
  }
};

// 分享文章
const shareArticle = async () => {
  if (!currentArticle.value) return;

  const shareUrl = `${window.location.origin}/knowledge-base?article=${currentArticle.value.id}`;
  const shareText = `${currentArticle.value.title} - 来自智能学习平台`;

  try {
    if (navigator.share) {
      // 移动端支持原生分享
      await navigator.share({
        title: currentArticle.value.title,
        text: shareText,
        url: shareUrl,
      });
    } else {
      // 复制到剪贴板
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      ElMessage.success('链接已复制到剪贴板');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('分享失败:', error);
      ElMessage.error('分享失败，请重试');
    }
  }
};

// 查看文章时检查收藏状态
const checkFavoriteStatus = async (articleId) => {
  if (!userStore.isLogin) {
    isFavorited.value = false;
    return;
  }

  try {
    const response = await favoriteApi.check(articleId, 'KnowledgePoint');
    isFavorited.value = response.data?.isFavorite || false;
  } catch (error) {
    isFavorited.value = false;
  }
};

// 查看文章
const viewArticle = async (article) => {
  currentArticle.value = article;
  await checkFavoriteStatus(article.id);
};
</script>

<style scoped>
.knowledge-base-page {
  min-height: calc(100vh - 160px);
  background: #f8fafc;
}

.page-header {
  padding: 2rem 1rem;
}

.prose {
  max-width: 100%;
  color: #374151;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: #1f2937;
  font-weight: 600;
}

.prose a {
  color: #3b82f6;
  text-decoration: none;
}

.prose a:hover {
  color: #2563eb;
  text-decoration: underline;
}

.prose ul,
.prose ol {
  padding-left: 1.5rem;
}

.prose li {
  margin-bottom: 0.5rem;
}

.prose code {
  background-color: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 0.375rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #1e293b;
}

.prose pre {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
}

.prose p {
  line-height: 1.8;
}

.prose img {
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.prose blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  color: #6b7280;
}

.prose table {
  border-collapse: collapse;
  width: 100%;
}

.prose th,
.prose td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
}

.prose th {
  background-color: #f8fafc;
}

.prose tr:nth-child(even) {
  background-color: #f8fafc;
}
</style>
