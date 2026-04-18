<template>
  <div
    class="name-avatar flex items-center justify-center rounded-full overflow-hidden"
    :style="{
      backgroundColor: showImage ? 'transparent' : bgColor,
      width: `${props.size}px`,
      height: `${props.size}px`,
      fontSize: `${Math.floor(props.size * 0.4)}px`,
    }"
  >
    <!-- 固定头像类型 -->
    <img
      v-if="fixedAvatarSrc"
      :src="fixedAvatarSrc"
      :alt="props.name"
      class="w-full h-full object-cover"
    />
    <!-- 有图片且未加载失败时显示图片 -->
    <img
      v-else-if="showImage"
      :src="props.src"
      :alt="props.name"
      class="w-full h-full object-cover"
      @error="onImageError"
    />
    <!-- 无图片或加载失败时显示名字首字母 -->
    <span v-else :class="textSizeClass">{{ displayText }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 固定头像映射
const FIXED_AVATARS = {
  ai: '/avatar-ai.svg',
  system: '/avatar-system.svg',
  male: '/avatar-male.svg',
  female: '/avatar-female.svg',
  vip: '/avatar-vip.svg',
  default: '/avatar-default.svg',
};

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
  src: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: '', // 可选: ai, system, male, female, vip, default
  },
});

// 图片加载失败标记
const imageError = ref(false);

// 是否显示图片
const showImage = computed(() => props.src && !imageError.value);

// 固定头像路径
const fixedAvatarSrc = computed(() => {
  if (props.type && FIXED_AVATARS[props.type]) {
    return FIXED_AVATARS[props.type];
  }
  return null;
});

// 图片加载失败时回退到名字首字母
const onImageError = () => {
  imageError.value = true;
};

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
