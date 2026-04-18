<template>
  <div ref="triggerRef" class="relative inline-block">
    <!-- 触发按钮 -->
    <div @click.stop="toggle" class="cursor-pointer">
      <slot name="trigger" :is-open="isOpen" />
    </div>

    <!-- 下拉内容 - 使用 Teleport 确保不会被父级容器遮挡 -->
    <teleport to="body">
      <transition name="dropdown-fade">
        <div 
          v-if="isOpen" 
          class="dropdown-content fixed z-[99999]"
          :style="dropdownStyle"
          @click.stop
        >
          <div class="relative">
            <slot name="content" :close="close" />
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const isOpen = ref(false);
const triggerRef = ref(null);
const dropdownStyle = ref({});

const toggle = () => {
  if (!isOpen.value) {
    updatePosition();
  }
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

// 动态计算下拉菜单位置
const updatePosition = () => {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  
  // 默认显示在触发器下方右对齐
  dropdownStyle.value = {
    top: `${rect.bottom + window.scrollY + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    position: 'absolute' // 在 teleport 内部使用 absolute 配合 body 的 relative 或直接 fixed
  };
  
  // 改为 fixed 准确定位
  dropdownStyle.value = {
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    position: 'fixed'
  };
};

const handleOutsideClick = (event) => {
  if (isOpen.value && triggerRef.value && !triggerRef.value.contains(event.target)) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});

defineExpose({ close });
</script>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-content {
  transform-origin: top right;
}
</style>