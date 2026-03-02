<template>
  <div
    class="name-avatar flex items-center justify-center rounded-full"
    :style="{
      backgroundColor: bgColor,
      width: `${props.size}px`,
      height: `${props.size}px`,
      fontSize: `${Math.floor(props.size * 0.4)}px`,
    }"
  >
    <span :class="textSizeClass">{{ displayText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 组件属性
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 40,
  },
});

// 计算显示文本
const displayText = computed(() => {
  if (!props.name) return '?';

  // 移除特殊字符
  const cleanName = props.name.replace(/[\s\-._]/g, '') || '?';

  if (cleanName.length <= 2) {
    return cleanName;
  } else {
    return cleanName.substring(0, 2);
  }
});

// 计算背景颜色
const bgColor = computed(() => {
  // 基于姓名生成固定的背景色
  let hash = 0;
  if (props.name) {
    for (let i = 0; i < props.name.length; i++) {
      hash = props.name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }

  // 生成RGB颜色
  const color =
    ((hash >> 24) & 0xff).toString(16).padStart(2, '0') +
    ((hash >> 16) & 0xff).toString(16).padStart(2, '0') +
    ((hash >> 8) & 0xff).toString(16).padStart(2, '0');

  return `#${color}`;
});

// 计算文本大小类
const textSizeClass = computed(() => {
  // 直接使用内联样式控制文本大小
  return 'font-medium text-white';
});
</script>

<style scoped>
.name-avatar {
  overflow: hidden;
}
</style>
