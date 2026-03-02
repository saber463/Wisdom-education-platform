<template>
  <el-tag
    :type="badgeType"
    :size="size"
    :effect="effect"
  >
    {{ badgeText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  priority: 'high' | 'normal' | 'mastered'
  size?: 'large' | 'default' | 'small'
  effect?: 'dark' | 'light' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  effect: 'light'
})

const badgeType = computed(() => {
  switch (props.priority) {
    case 'high':
      return 'danger' // 红色 - 推荐优先学
    case 'normal':
      return 'info' // 黑色 - 正常学
    case 'mastered':
      return 'success' // 灰色 - 已掌握
    default:
      return 'info'
  }
})

const badgeText = computed(() => {
  switch (props.priority) {
    case 'high':
      return '优先学习'
    case 'normal':
      return '正常学习'
    case 'mastered':
      return '已掌握'
    default:
      return '正常学习'
  }
})
</script>

<style scoped>
/* 样式已通过Element Plus的tag组件实现 */
</style>

