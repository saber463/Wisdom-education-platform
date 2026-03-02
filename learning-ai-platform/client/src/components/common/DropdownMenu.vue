<template>
  <div ref="dropdownRef" class="relative inline-block">
    <!-- 触发按钮 -->
    <div class="cursor-pointer" @click="isOpen = !isOpen">
      <slot name="trigger" />
    </div>

    <!-- 下拉内容 -->
    <div v-if="isOpen" class="absolute right-0 mt-2 z-50">
      <slot name="content" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isOpen = ref(false);
const dropdownRef = ref(null);

const handleClickOutside = event => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
