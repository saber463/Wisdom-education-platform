<template>
  <ErrorPage
    :error-code="404"
    :error-title="'页面不存在'"
    :error-description="'你访问的页面可能已被删除、地址错误，或暂时不可用'"
    :suggestions="['检查URL是否正确输入', '返回首页重新导航', '使用搜索功能查找您需要的内容']"
    :show-back="false"
  />
</template>

<script setup>
import ErrorPage from '../components/common/ErrorPage.vue';
</script>

<style scoped>
/* 保留原有的动画效果 */
.error-page {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
