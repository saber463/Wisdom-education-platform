<template>
  <div class="knowledge-base-dropdown mb-4">
    <div
      class="dropdown-header bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg cursor-pointer flex justify-between items-center"
      @click="toggleExpand"
    >
      <div class="flex items-center">
        <i class="fa fa-book mr-2" />
        <h3 class="text-lg font-semibold">
          {{ title }}
        </h3>
      </div>
      <i :class="['fa', expanded ? 'fa-chevron-up' : 'fa-chevron-down']" />
    </div>

    <div
      v-if="expanded"
      class="dropdown-body bg-white rounded-b-lg shadow-md p-6"
      transition="fade"
    >
      <div v-if="loading" class="text-center py-4">
        <div class="loading-spinner" />
      </div>

      <div v-else-if="error" class="text-red-500 text-center py-4">
        <p>{{ error }}</p>
        <button
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
          @click="loadKnowledgePoints"
        >
          重试
        </button>
      </div>

      <div v-else-if="knowledgePoints.length === 0" class="text-gray-500 text-center py-4">
        <p>暂无知识点数据</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="point in knowledgePoints"
          :key="point._id"
          class="knowledge-point-item border-l-4 border-blue-500 pl-4"
        >
          <h4 class="text-md font-medium text-blue-600">
            {{ point.name }}
          </h4>
          <p class="text-gray-700 mt-1">
            {{ point.description }}
          </p>

          <div v-if="point.content" class="mt-2 text-gray-600 text-sm">
            <div v-html="point.content" />
          </div>

          <div
            v-if="point.children && point.children.length > 0"
            class="mt-3 pl-4 border-l border-gray-200"
          >
            <div
              v-for="child in point.children"
              :key="child._id"
              class="knowledge-point-child mb-2"
            >
              <h5 class="text-sm font-medium text-blue-500">
                {{ child.name }}
              </h5>
              <p class="text-gray-700 text-xs mt-1">
                {{ child.description }}
              </p>

              <div v-if="child.content" class="mt-1 text-gray-600 text-xs">
                <div v-html="child.content" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

// Props
const props = defineProps({
  title: {
    type: String,
    default: '知识点知识库',
  },
  categoryId: {
    type: String,
    default: null,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['update:expanded']);

// 状态
const knowledgePoints = ref([]);
const loading = ref(false);
const error = ref('');
const localExpanded = ref(props.expanded);

// 切换展开/折叠状态
const toggleExpand = () => {
  localExpanded.value = !localExpanded.value;
  emit('update:expanded', localExpanded.value);

  // 如果展开且还没有加载数据，则加载数据
  if (localExpanded.value && knowledgePoints.value.length === 0) {
    loadKnowledgePoints();
  }
};

// 加载知识点数据
const loadKnowledgePoints = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params = {};
    if (props.categoryId) {
      params.category = props.categoryId;
      params.level = 0; // 只加载顶级知识点
    }

    const response = await axios.get('/api/knowledge-points/tree', { params });
    knowledgePoints.value = response.data.data;
  } catch (err) {
    console.error('加载知识点失败:', err);
    error.value = '加载知识点失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

// 监听外部expanded变化
watch(
  () => props.expanded,
  newVal => {
    localExpanded.value = newVal;
  }
);

// 页面挂载时，如果已经展开则加载数据
onMounted(() => {
  if (localExpanded.value) {
    loadKnowledgePoints();
  }
});
</script>

<style scoped>
.knowledge-base-dropdown {
  margin-bottom: 1rem;
}

.dropdown-header {
  transition: background-color 0.3s;
}

.dropdown-header:hover {
  background-color: #2563eb;
}

.dropdown-body {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.knowledge-point-item {
  margin-bottom: 1rem;
}

.knowledge-point-child {
  margin-bottom: 0.5rem;
}
</style>
