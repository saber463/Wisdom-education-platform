<template>
  <div id="app">
    <router-view />
    <!-- 用户兴趣调查问卷弹窗 -->
    <InterestSurveyModal
      v-model="showSurveyModal"
      @completed="handleSurveyCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import request from '@/utils/request'
import InterestSurveyModal from '@/components/InterestSurveyModal.vue'

const route = useRoute()
const userStore = useUserStore()

// 初始化主题（store 构造时已自动 applyTheme，这里确保 pinia 激活）
useThemeStore()

const showSurveyModal = ref(false)

// 检查用户是否完成问卷
async function checkSurveyStatus() {
  // 只在学生端且已登录时检查
  if (!userStore.isLoggedIn || !userStore.isStudent) {
    return
  }

  // 如果当前在登录页，不显示问卷
  if (route.name === 'login') {
    return
  }

  try {
    const response = await request.get<{ success?: boolean; completed?: boolean }>('/user-interests/status')
    if (response.success) {
      if (!response.completed) {
        showSurveyModal.value = true
      }
    }
  } catch (error) {
    console.error('检查问卷状态失败:', error)
  }
}

function handleSurveyCompleted() {
  showSurveyModal.value = false
}

// 监听登录状态变化
watch(
  () => userStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn && userStore.isStudent) {
      checkSurveyStatus()
    }
  }
)

// 监听路由变化
watch(
  () => route.name,
  (routeName) => {
    // 如果从登录页跳转到学生端，检查问卷状态
    if (routeName && routeName.toString().startsWith('student-')) {
      checkSurveyStatus()
    }
  }
)

onMounted(() => {
  // 初始化时检查问卷状态
  if (userStore.isLoggedIn && userStore.isStudent) {
    checkSurveyStatus()
  }
})
</script>

<style>
#app {
  font-family: 'Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', Consolas, monospace, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-page);
  min-height: 100vh;
  color: var(--text-primary);
  transition: background 0.3s ease, color 0.3s ease;
}

.offline-indicator-container {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 9998;
}

.harmonyos-badge-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
}

/* ===== 全局主题强制覆写（响应主题切换）===== */
.el-container,
.teacher-layout,
.student-layout,
.parent-layout {
  background: var(--bg-page) !important;
}

.el-header.header,
.header {
  background: var(--bg-topbar) !important;
  backdrop-filter: blur(20px) !important;
  border-bottom: 1px solid var(--border-color-dim) !important;
  box-shadow: none !important;
}

.el-aside.sidebar,
.sidebar {
  background: var(--bg-sidebar) !important;
  border-right: 1px solid var(--border-color) !important;
}

.el-main.main-content,
.main-content {
  background: var(--bg-page) !important;
}

.el-menu {
  background: transparent !important;
  border: none !important;
}

.el-card,
.el-card__body {
  background: var(--bg-card) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color-dim) !important;
}

.grading-page,
.analytics-page,
.teacher-dashboard,
.assignments-page {
  background: transparent !important;
  color: var(--text-primary) !important;
}

h1, h2, h3, h4 {
  color: var(--text-primary) !important;
}

.username,
.stat-value,
.stat-label,
.el-form-item__label,
.el-table__cell,
.el-descriptions__label,
.el-descriptions__content {
  color: var(--text-secondary) !important;
}

/* el-table */
.el-table {
  background: var(--bg-card) !important;
  --el-table-bg-color: var(--bg-card) !important;
  --el-table-tr-bg-color: var(--bg-card) !important;
  --el-table-row-hover-bg-color: var(--border-color) !important;
  --el-table-header-bg-color: var(--bg-card-2) !important;
  --el-table-border-color: var(--border-color-dim) !important;
  --el-table-text-color: var(--text-secondary) !important;
  --el-table-header-text-color: var(--text-muted) !important;
  color: var(--text-secondary) !important;
}
.el-table tr { background: var(--bg-card) !important; }
.el-table th.el-table__cell { background: var(--bg-card-2) !important; color: var(--text-muted) !important; }
.el-table--striped .el-table__body tr.el-table__row--striped td { background: var(--bg-card-2) !important; }

/* el-form */
.el-form-item__label { color: var(--text-secondary) !important; }
.el-input__wrapper {
  background: var(--bg-card-2) !important;
  border-color: var(--border-color-dim) !important;
  box-shadow: none !important;
}
.el-input__wrapper:hover { border-color: var(--border-color-hover) !important; }
.el-input__wrapper.is-focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 2px var(--color-neon-glow) !important; }
.el-input__inner { color: var(--text-primary) !important; background: transparent !important; }

/* el-select */
.el-select .el-select__wrapper {
  background: var(--bg-card-2) !important;
  border-color: var(--border-color-dim) !important;
  box-shadow: none !important;
  color: var(--text-secondary) !important;
}
.el-select-dropdown { background: var(--bg-card-2) !important; border-color: var(--border-color-dim) !important; }
.el-select-dropdown__item { color: var(--text-secondary) !important; }
.el-select-dropdown__item:hover { background: var(--border-color) !important; color: var(--color-primary) !important; }
.el-select-dropdown__item.is-selected { color: var(--color-primary) !important; }

/* el-button */
.el-button { transition: all 0.2s ease !important; }
.el-button--primary {
  background: var(--gradient-primary) !important;
  border: none !important;
  color: #000 !important;
  font-weight: 700 !important;
}
.el-button--primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: var(--shadow-btn) !important; }
.el-button--default {
  background: transparent !important;
  border-color: var(--border-color-dim) !important;
  color: var(--text-secondary) !important;
}
.el-button--default:hover { border-color: var(--border-color-hover) !important; color: var(--color-primary) !important; background: var(--border-color) !important; }

/* el-dialog */
.el-dialog {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 16px !important;
  --el-dialog-bg-color: var(--bg-card) !important;
}
.el-dialog__header { border-bottom: 1px solid var(--border-color-dim) !important; }
.el-dialog__title { color: var(--text-primary) !important; font-weight: 700 !important; }
.el-dialog__body { color: var(--text-secondary) !important; }
.el-overlay { background: rgba(0,0,0,0.75) !important; backdrop-filter: blur(8px) !important; }

/* el-descriptions */
.el-descriptions__label { background: var(--bg-card-2) !important; color: var(--text-muted) !important; border-color: var(--border-color-dim) !important; }
.el-descriptions__content { background: var(--bg-card) !important; color: var(--text-secondary) !important; border-color: var(--border-color-dim) !important; }

/* el-steps */
.el-step__title { color: var(--text-secondary) !important; }
.el-step__title.is-process { color: var(--color-primary) !important; }
.el-step__icon { border-color: var(--border-color-dim) !important; background: var(--bg-card) !important; color: var(--text-secondary) !important; }
.el-step.is-process .el-step__icon { border-color: var(--color-primary) !important; color: var(--color-primary) !important; }
.el-step.is-finish .el-step__icon { border-color: var(--color-primary) !important; background: var(--border-color) !important; color: var(--color-primary) !important; }

/* el-radio/checkbox */
.el-radio__label,.el-checkbox__label { color: var(--text-secondary) !important; }
.el-radio__inner,.el-checkbox__inner { background: var(--bg-card-2) !important; border-color: var(--border-color-dim) !important; }
.el-radio.is-checked .el-radio__inner,
.el-checkbox.is-checked .el-checkbox__inner { background: var(--color-primary) !important; border-color: var(--color-primary) !important; }

/* el-tabs */
.el-tabs__header { border-bottom-color: var(--border-color-dim) !important; }
.el-tabs__nav-wrap::after { background: var(--border-color-dim) !important; }
.el-tabs__item { color: var(--text-muted) !important; }
.el-tabs__item.is-active { color: var(--color-primary) !important; }
.el-tabs__active-bar { background: var(--gradient-primary) !important; }

/* el-statistic */
.el-statistic__content { color: var(--color-primary) !important; font-family: Consolas, monospace !important; }
.el-statistic__head { color: var(--text-muted) !important; }

/* el-progress */
.el-progress-bar__outer { background: var(--border-color-dim) !important; }
.el-progress-bar__inner { background: var(--gradient-primary) !important; }

/* el-alert */
.el-alert { background: var(--border-color-dim) !important; border-color: var(--border-color) !important; }
.el-alert--info { background: rgba(0,212,255,0.08) !important; border-color: rgba(0,212,255,0.2) !important; }
.el-alert--success { background: var(--color-neon-glow) !important; border-color: var(--border-color-hover) !important; }
.el-alert__title { color: var(--text-secondary) !important; }
.el-alert__description { color: var(--text-muted) !important; }

/* el-empty */
.el-empty__description p { color: var(--text-muted) !important; }

/* textarea */
textarea { background: var(--bg-card-2) !important; color: var(--text-primary) !important; border-color: var(--border-color-dim) !important; }
textarea::placeholder { color: var(--text-muted) !important; }

/* breadcrumb */
.el-breadcrumb__inner,.el-breadcrumb__separator { color: var(--text-muted) !important; }
.el-breadcrumb__inner.is-link:hover { color: var(--color-primary) !important; }

/* el-pagination */
.el-pagination { --el-pagination-text-color: var(--text-muted); --el-pagination-button-bg-color: var(--bg-card); --el-pagination-hover-color: var(--color-primary); }
.el-pager li { background: var(--bg-card) !important; color: var(--text-muted) !important; border: 1px solid var(--border-color-dim) !important; }
.el-pager li.is-active { background: var(--border-color) !important; color: var(--color-primary) !important; border-color: var(--border-color-hover) !important; }
.el-pagination button { background: var(--bg-card) !important; color: var(--text-muted) !important; }

/* el-message */
.el-message { background: var(--bg-card) !important; border-color: var(--border-color) !important; }
.el-message__content { color: var(--text-primary) !important; }

/* el-message-box */
.el-message-box { background: var(--bg-card) !important; border: 1px solid var(--border-color) !important; border-radius: 16px !important; }
.el-message-box__title { color: var(--text-primary) !important; }
.el-message-box__content { color: var(--text-secondary) !important; }
.el-message-box__header { border-bottom: 1px solid var(--border-color-dim) !important; }

/* el-dropdown */
.el-dropdown-menu { background: var(--bg-card) !important; border: 1px solid var(--border-color-dim) !important; }
.el-dropdown-menu__item { color: var(--text-secondary) !important; }
.el-dropdown-menu__item:hover { background: var(--border-color) !important; color: var(--color-primary) !important; }

/* el-loading */
.el-loading-spinner .circular .path { stroke: var(--color-primary) !important; }
.el-loading-text { color: var(--color-primary) !important; }

/* 通用 */
p { color: var(--text-secondary); }
span { color: inherit; }
.logo h2 { color: var(--color-primary) !important; }
.logo span { color: var(--color-secondary) !important; font-family: Consolas, monospace !important; }
</style>
