<template>
  <div class="tweet-content">
    <!-- 主文本内容 - 支持换行和标签高亮 -->
    <p class="mb-3 text-white/90 leading-relaxed whitespace-pre-line">
      {{ tweet.content }}
    </p>

    <!-- 标签列表 -->
    <div v-if="tags.length" class="flex flex-wrap gap-2 mb-3">
      <span
        v-for="tag in tags"
        :key="tag"
        class="tag-pill"
      >
        # {{ tag }}
      </span>
    </div>

    <!-- 图片展示 -->
    <div v-if="tweet.images && tweet.images.length" :class="imageGridClass">
      <div
        v-for="(img, idx) in tweet.images"
        :key="idx"
        class="image-item group relative overflow-hidden rounded-xl border border-white/10 cursor-pointer hover:border-tech-blue/40 transition-all duration-300"
        @click="openImage(img)"
      >
        <img
          :src="img"
          :alt="`图片${idx + 1}`"
          loading="lazy"
          class="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          :class="imageHeightClass"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <i class="fa fa-search-plus text-white text-xl drop-shadow" />
        </div>
      </div>
    </div>

    <!-- 知识要点卡片（从内容自动提取或手动添加） -->
    <div v-if="knowledgePoints.length || tweet.knowledgePoints" class="knowledge-card mt-3">
      <div class="flex items-center gap-2 mb-2">
        <i class="fa fa-lightbulb text-yellow-400 text-sm" />
        <span class="text-xs font-semibold text-yellow-400/90 uppercase tracking-wider">知识要点</span>
      </div>
      <ul class="space-y-1.5">
        <li v-for="(point, i) in (tweet.knowledgePoints || knowledgePoints)" :key="i" class="flex items-start gap-2 text-sm text-gray-300/80">
          <i class="fa fa-check-circle text-green-400/70 mt-0.5 text-xs flex-shrink-0" />
          <span>{{ point }}</span>
        </li>
      </ul>
    </div>

    <!-- 展开/收起按钮（长文本） -->
    <button
      v-if="isLongContent && !showFullContent"
      class="expand-btn mt-2"
      @click="$emit('toggle-detail')"
    >
      展开详情 <i class="fa fa-angle-down ml-1" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tweet: { type: Object, required: true },
  showFullContent: { type: Boolean, default: false },
});

defineEmits(['toggle-detail']);

// 从内容中提取 #标签
const tags = computed(() => {
  const content = props.tweet.content || '';
  // 匹配 #xxx 格式的标签
  const matches = content.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g) || [];
  return [...new Set(matches.map(t => t.replace('#', '')))];
});

// 判断是否为长文本（超过200字符）
const isLongContent = computed(() => (props.tweet.content?.length || 0) > 200);

// 图片网格布局类
const imageGridClass = computed(() => {
  const len = props.tweet.images?.length || 0;
  if (len === 1) return 'grid grid-cols-1 mb-3';
  if (len === 2) return 'grid grid-cols-2 gap-2 mb-3';
  return 'grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3';
});

// 单张图片高度
const imageHeightClass = computed(() => {
  const len = props.tweet.images?.length || 0;
  if (len === 1) return 'h-64';
  if (len === 2) return 'h-44';
  return 'h-36';
});

// 从内容中提取知识要点关键词（示例逻辑）
const knowledgePoints = computed(() => {
  const content = props.tweet.content || '';
  const points = [];

  // 检测常见学习关键词并生成要点
  const keywords = [
    { pattern: /Vue|React|Angular|Svelte/i, label: '前端框架' },
    { pattern: /JavaScript|TypeScript|ES6+/i, label: 'JavaScript' },
    { pattern: /Node\.js|Express|Koa|Nest/i, label: '后端技术' },
    { pattern: /Python|Java|Go|Rust/i, label: '编程语言' },
    { pattern: /算法|数据结构|LeetCode|排序|二叉树/i, label: '算法与数据结构' },
    { pattern: /CSS|Tailwind|SCSS|响应式/i, label: '样式与布局' },
    { pattern: /数据库|MySQL|MongoDB|Redis/i, label: '数据库技术' },
    { pattern: /AI|机器学习|深度学习|PyTorch/i, label: '人工智能' },
    { pattern: /设计模式|架构|微服务/i, label: '软件工程' },
    { pattern: /Git|Linux|Docker|CI\/CD/i, label: '开发工具' },
    { pattern: /英语|四级|六级|托福|雅思/i, label: '语言学习' },
  ];

  keywords.forEach(kw => {
    if (kw.pattern.test(content)) {
      points.push(kw.label);
    }
  });

  return points.slice(0, 5);
});

// 打开图片预览
const openImage = src => {
  window.open(src, '_blank');
};
</script>

<style scoped>
.tweet-content {
  padding: 8px 0;
}

/* 标签 */
.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
  font-size: 13px;
  font-weight: 500;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tag-pill:hover {
  background: rgba(99, 102, 241, 0.22);
}

/* 知识要点卡片 */
.knowledge-card {
  padding: 14px 16px;
  background: rgba(250, 204, 21, 0.05);
  border: 1px solid rgba(250, 204, 21, 0.15);
  border-radius: 12px;
}
.knowledge-card li {
  line-height: 1.7;
}

/* 展开按钮 */
.expand-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  color: #818cf8;
  font-size: 13px;
  font-weight: 600;
  background: transparent;
  border: 1px dashed rgba(129, 140, 248, 0.35);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.expand-btn:hover {
  background: rgba(129, 140, 248, 0.08);
  border-style: solid;
}
</style>
