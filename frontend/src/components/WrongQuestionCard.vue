<template>
  <el-card class="wrong-question-card" shadow="hover">
    <div class="question-header">
      <h4>{{ question.question_content }}</h4>
      <el-tag :type="question.mastered ? 'success' : 'warning'" size="small">
        {{ question.mastered ? '已掌握' : '待巩固' }}
      </el-tag>
    </div>
    <div class="question-info">
      <div class="answer-section">
        <div class="answer-item">
          <span class="label">我的答案：</span>
          <span class="value wrong">{{ question.user_answer }}</span>
        </div>
        <div class="answer-item">
          <span class="label">正确答案：</span>
          <span class="value correct">{{ question.correct_answer }}</span>
        </div>
      </div>
      <div class="meta-info">
        <span>来自：{{ question.lesson_title }}</span>
        <span>时间：{{ formatTime(question.created_at) }}</span>
      </div>
    </div>
    <div class="question-actions">
      <el-button type="primary" size="small" @click="$emit('view-detail')">查看详情</el-button>
      <el-button type="success" size="small" @click="$emit('retry')">重做</el-button>
      <el-button
        v-if="!question.mastered"
        type="warning"
        size="small"
        @click="$emit('mark-mastered')"
      >
        标记已掌握
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
interface WrongQuestion {
  id: number
  question_content: string
  user_answer: string
  correct_answer: string
  lesson_title: string
  created_at: string
  mastered: boolean
}

interface Props {
  question: WrongQuestion
}

defineProps<Props>()
defineEmits<{
  'view-detail': []
  'retry': []
  'mark-mastered': []
}>()

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.wrong-question-card {
  @apply mb-4;
}

.question-header {
  @apply flex items-center justify-between mb-3;
}

.question-header h4 {
  @apply text-lg font-semibold text-gray-800 flex-1;
}

.question-info {
  @apply space-y-3 mb-3;
}

.answer-section {
  @apply space-y-2;
}

.answer-item {
  @apply flex items-center;
}

.label {
  @apply text-gray-600 mr-2;
}

.value {
  @apply font-semibold;
}

.value.wrong {
  @apply text-danger-500;
}

.value.correct {
  @apply text-success-500;
}

.meta-info {
  @apply flex gap-4 text-sm text-gray-500;
}

.question-actions {
  @apply flex gap-2;
}
</style>

