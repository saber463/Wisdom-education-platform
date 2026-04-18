<template>
  <div class="min-h-screen flex items-center justify-center" style="background: var(--bg-base)">
    <div class="text-center max-w-md mx-auto px-6">
      <div class="text-6xl mb-6">📝</div>
      <h1 class="text-2xl font-bold mb-3" style="color: var(--text-primary)">作业中心</h1>
      <p class="text-base mb-8" style="color: var(--text-secondary)">
        作业功能正在开发中，敬请期待！你可以在这里查看和完成老师布置的作业任务。
      </p>
      <div class="flex items-center justify-center gap-3">
        <router-link
          to="/dashboard"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
          style="background: var(--primary); color: white;"
        >
          <i class="fa fa-arrow-left text-xs" />
          返回首页
        </router-link>
        <router-link
          to="/courses"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
          style="background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border-medium);"
        >
          浏览课程
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// 作业中心 - 即将上线
</script>
