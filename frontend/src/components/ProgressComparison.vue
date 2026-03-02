<template>
  <el-card class="progress-comparison">
    <template #header>
      <h3>进度比拼</h3>
    </template>
    <div class="comparison-content">
      <div class="progress-bars">
        <div class="progress-item">
          <span class="label">我的进度</span>
          <el-progress :percentage="userProgress" />
        </div>
        <div class="progress-item">
          <span class="label">伙伴进度</span>
          <el-progress :percentage="partnerProgress" />
        </div>
      </div>
      <div class="progress-diff">
        <span>进度差：{{ Math.abs(progressDiff).toFixed(1) }}%</span>
        <el-tag
          :type="progressDiff >= 0 ? 'success' : 'warning'"
          size="small"
        >
          {{ progressDiff >= 0 ? '领先' : '落后' }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
interface Props {
  userProgress: number
  partnerProgress: number
  progressDiff: number
}

defineProps<Props>()
</script>

<style scoped>
.progress-comparison {
  @apply mb-4;
}

.comparison-content {
  @apply space-y-4;
}

.progress-bars {
  @apply space-y-3;
}

.progress-item {
  @apply space-y-2;
}

.label {
  @apply text-sm text-gray-600;
}

.progress-diff {
  @apply flex items-center justify-between pt-3 border-t border-gray-200;
}
</style>

