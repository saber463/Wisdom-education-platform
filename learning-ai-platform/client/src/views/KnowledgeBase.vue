<template>
  <div class="knowledge-base-page">
    <!-- 页面头部 -->
    <div class="page-header relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink opacity-90"
      />
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwIDIgMCAyIDJzMCAyIDAgMi0yIDItMiA0LTIgNHpNMCAwaDYwdjYwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"
      />
      <div class="container mx-auto max-w-6xl relative z-10">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">知识库</h1>
        <p class="text-xl text-white/90 max-w-3xl">
          探索丰富的技术知识点，深入了解各种编程语言、框架和技术概念
        </p>
      </div>
      <div
        class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="container mx-auto max-w-6xl px-4 py-12">
      <!-- 搜索框 -->
      <div class="glass-card rounded-2xl p-6 mb-10 relative overflow-hidden">
        <div
          class="absolute inset-0 bg-gradient-to-r from-tech-blue/5 via-transparent to-tech-purple/5"
        />
        <div class="relative">
          <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索知识库内容..."
              class="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/50 focus:border-tech-blue transition-all duration-300 hover:border-tech-blue/50 dark:text-white dark:placeholder-gray-400"
            />
            <select
              v-model="selectedCategory"
              class="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-tech-blue/50 focus:border-tech-blue transition-all duration-300 hover:border-tech-blue/50 dark:text-white"
            >
              <option value="all">全部分类</option>
              <option v-for="category in categories" :key="category._id" :value="category._id">
                {{ category.name }}
              </option>
            </select>
            <button
              class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-tech-blue to-tech-purple hover:from-tech-blue/90 hover:to-tech-purple/90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl shadow-tech-blue/25"
              @click="search()"
            >
              <i class="fa fa-search mr-2" /> 搜索
            </button>
          </div>
        </div>
      </div>

      <!-- 知识库内容 -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- 左侧：分类列表 -->
        <div class="lg:col-span-1">
          <div class="glass-card rounded-2xl p-6 sticky top-8 relative overflow-hidden">
            <div
              class="absolute inset-0 bg-gradient-to-br from-tech-blue/5 via-transparent to-tech-purple/5"
            />
            <div class="relative">
              <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                <i class="fa fa-th-large text-tech-blue mr-2" />分类
              </h2>
              <ul class="space-y-2">
                <li
                  :class="[
                    'px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-102',
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm text-gray-700 dark:text-gray-300',
                  ]"
                  @click="selectCategory('all')"
                >
                  <i class="fa fa-folder-open mr-2" /> 全部分类
                  <span class="float-right text-xs font-medium opacity-80">{{
                    categories.reduce((sum, cat) => sum + (cat.knowledgePointCount || 0), 0)
                  }}</span>
                </li>
                <li
                  v-for="category in categories"
                  :key="category._id"
                  :class="[
                    'px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-102',
                    selectedCategory === category._id
                      ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm text-gray-700 dark:text-gray-300',
                  ]"
                  @click="selectCategory(category._id)"
                >
                  <i class="fa fa-code mr-2" /> {{ category.name }}
                  <span class="float-right text-xs font-medium opacity-80">{{
                    category.knowledgePointCount || 0
                  }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 中间：文章列表 -->
        <div class="lg:col-span-3">
          <div class="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div
              class="absolute inset-0 bg-gradient-to-br from-tech-blue/5 via-transparent to-tech-purple/5"
            />
            <div class="relative">
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
                  <p class="text-gray-600 dark:text-gray-300 line-clamp-2">
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
                  class="inline-flex items-center justify-center px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all transform hover:scale-105"
                >
                  <i class="fa fa-bookmark-o mr-2" /> 收藏
                </button>
                <button
                  class="inline-flex items-center justify-center px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all transform hover:scale-105"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { useUserStore } from '../store/user';
import { knowledgeBaseApi } from '@/utils/api';

// 获取用户store
const userStore = useUserStore();

const route = useRoute();

// 搜索关键词
const searchKeyword = ref('');
// 选中的分类
const selectedCategory = ref('all');
// 分类列表
const categories = ref([]);
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

// 从URL参数获取分类ID
onMounted(() => {
  if (route.query.category) {
    selectedCategory.value = route.query.category;
  }
  fetchData();
});

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

// 获取分类和知识点数据
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
    if (knowledgePointsResponse.data && Array.isArray(knowledgePointsResponse.data.data)) {
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
      // 如果没有数据或数据格式不符合预期，设置为空数组
      articles.value = [];
    }

    currentPage.value = 1;
  } catch (err) {
    console.error('获取数据失败:', err);
    error.value = '获取知识库数据失败，请稍后重试';
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

// 查看文章
const viewArticle = article => {
  currentArticle.value = article;
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
</script>

<style scoped>
.knowledge-base-page {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.page-header {
  padding: 5rem 1rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.prose {
  max-width: 100%;
  color: #e5e7eb;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: #f3f4f6;
  font-weight: 600;
}

.prose a {
  color: var(--tech-blue);
  text-decoration: none;
}

.prose a:hover {
  color: var(--tech-purple);
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
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 0.375rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #e5e7eb;
}

.prose pre {
  background-color: rgba(0, 0, 0, 0.3);
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.prose blockquote {
  border-left: 4px solid var(--tech-blue);
  padding-left: 1rem;
  color: #9ca3af;
}

.prose table {
  border-collapse: collapse;
  width: 100%;
}

.prose th,
.prose td {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
}

.prose th {
  background-color: rgba(255, 255, 255, 0.05);
}

.prose tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
