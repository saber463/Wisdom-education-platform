<template>
  <div
    class="course-card"
    @click="$emit('click')"
  >
    <div class="course-image">
      <img 
        v-if="course.icon_url" 
        :src="course.icon_url" 
        :alt="course.display_name"
        loading="lazy"
        decoding="async"
        @error="handleImageError"
      >
      <div
        v-else
        class="course-icon-placeholder"
      >
        {{ course.language_name.charAt(0) }}
      </div>
      <div
        v-if="course.is_hot"
        class="hot-badge"
      >
        🔥 热门
      </div>
    </div>
    <div class="course-content">
      <h3 class="course-title">
        {{ course.display_name }}
      </h3>
      <p class="course-description">
        {{ course.description || '暂无描述' }}
      </p>
      <div class="course-meta">
        <span
          class="difficulty-badge"
          :class="`difficulty-${course.difficulty}`"
        >
          {{ difficultyText[course.difficulty] }}
        </span>
        <span class="students-count">👥 {{ course.total_students || 0 }}</span>
        <span class="lessons-count">📚 {{ course.total_lessons || 0 }} 课节</span>
      </div>
      <div class="course-footer">
        <div
          v-if="course.rating_count > 0"
          class="course-rating"
        >
          <el-rate
            :model-value="course.avg_rating"
            disabled
            show-score
            :max="5"
          />
          <span class="rating-text">({{ course.rating_count }})</span>
        </div>
        <div class="course-price">
          <span
            v-if="course.price === 0"
            class="price-free"
          >免费</span>
          <span
            v-else
            class="price-paid"
          >¥{{ course.price }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Course {
  id: number
  language_name: string
  display_name: string
  description: string | null
  icon_url: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  price: number
  is_hot: boolean
  total_students: number
  total_lessons: number
  avg_rating: number
  rating_count: number
}

defineProps<{
  course: Course
}>()

defineEmits<{
  click: []
}>()

const difficultyText = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级'
}

// 图片加载错误处理
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}
</script>

<style scoped>
.course-card {
  @apply bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-200;
  @apply hover:shadow-lg hover:-translate-y-1;
}

.course-image {
  @apply relative h-40 bg-gray-100 overflow-hidden;
}

.course-image img {
  @apply w-full h-full object-cover;
}

.course-icon-placeholder {
  @apply w-full h-full flex items-center justify-center text-6xl font-bold text-gray-400;
}

.hot-badge {
  @apply absolute top-2 right-2 bg-danger-500 text-white px-2 py-1 rounded text-xs font-semibold;
}

.course-content {
  @apply p-4;
}

.course-title {
  @apply text-lg font-bold text-gray-800 mb-2 line-clamp-1;
}

.course-description {
  @apply text-sm text-gray-600 mb-3 line-clamp-2;
}

.course-meta {
  @apply flex items-center gap-2 mb-3 flex-wrap;
}

.difficulty-badge {
  @apply px-2 py-1 rounded text-xs font-semibold;
}

.difficulty-beginner {
  @apply bg-success-100 text-success-700;
}

.difficulty-intermediate {
  @apply bg-warning-100 text-warning-700;
}

.difficulty-advanced {
  @apply bg-danger-100 text-danger-700;
}

.students-count,
.lessons-count {
  @apply text-xs text-gray-500;
}

.course-footer {
  @apply flex items-center justify-between pt-3 border-t border-gray-200;
}

.course-rating {
  @apply flex items-center gap-1;
}

.rating-text {
  @apply text-xs text-gray-500;
}

.course-price {
  @apply font-bold;
}

.price-free {
  @apply text-success-500;
}

.price-paid {
  @apply text-primary-500;
}
</style>

