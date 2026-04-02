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
import request from '@/utils/request'
import InterestSurveyModal from '@/components/InterestSurveyModal.vue'

const route = useRoute()
const userStore = useUserStore()

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
  background: #1E1E1E;
  min-height: 100vh;
  color: #F0F0F0;
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

/* ===== 全局深色主题强制覆写 ===== */
/* 所有使用旧布局类名的页面（有自带sidebar的自包含页面） */
.el-container,
.teacher-layout,
.student-layout,
.parent-layout {
  background: #1E1E1E !important;
}

/* 旧白色header */
.el-header.header,
.header {
  background: rgba(17,17,17,0.9) !important;
  backdrop-filter: blur(20px) !important;
  border-bottom: 1px solid rgba(255,255,255,0.05) !important;
  box-shadow: none !important;
}

/* 旧 el-aside sidebar */
.el-aside.sidebar,
.sidebar {
  background: #111111 !important;
  border-right: 1px solid rgba(0,255,148,0.08) !important;
}

/* 旧el-main main-content */
.el-main.main-content,
.main-content {
  background: #1E1E1E !important;
}

/* 旧 el-menu */
.el-menu {
  background: transparent !important;
  border: none !important;
}

/* 所有普通白色背景 */
.el-card,
.el-card__body {
  background: #252525 !important;
  color: #F0F0F0 !important;
  border-color: rgba(255,255,255,0.06) !important;
}

/* 浅灰页面背景 */
.grading-page,
.analytics-page,
.teacher-dashboard,
.assignments-page {
  background: transparent !important;
  color: #F0F0F0 !important;
}

/* h2/h3 标题颜色 */
h1, h2, h3, h4 {
  color: #F0F0F0 !important;
}

/* 旧版本使用 color: #333 的地方 */
.username,
.stat-value,
.stat-label,
.el-form-item__label,
.el-table__cell,
.el-descriptions__label,
.el-descriptions__content {
  color: #D0D0D0 !important;
}

/* el-table 深色 */
.el-table {
  background: #252525 !important;
  --el-table-bg-color: #252525 !important;
  --el-table-tr-bg-color: #252525 !important;
  --el-table-row-hover-bg-color: rgba(0,255,148,0.05) !important;
  --el-table-header-bg-color: #1a1a1a !important;
  --el-table-border-color: rgba(255,255,255,0.06) !important;
  --el-table-text-color: #D0D0D0 !important;
  --el-table-header-text-color: #808080 !important;
  color: #D0D0D0 !important;
}

.el-table tr { background: #252525 !important; }
.el-table th.el-table__cell { background: #1a1a1a !important; color: #606060 !important; }
.el-table--striped .el-table__body tr.el-table__row--striped td { background: #202020 !important; }

/* el-form */
.el-form-item__label { color: #909090 !important; }
.el-input__wrapper {
  background: #1a1a1a !important;
  border-color: rgba(255,255,255,0.08) !important;
  box-shadow: none !important;
}
.el-input__wrapper:hover { border-color: rgba(0,255,148,0.3) !important; }
.el-input__wrapper.is-focus { border-color: #00FF94 !important; box-shadow: 0 0 0 2px rgba(0,255,148,0.12) !important; }
.el-input__inner { color: #E0E0E0 !important; background: transparent !important; }

/* el-select 深色 */
.el-select .el-select__wrapper {
  background: #1a1a1a !important;
  border-color: rgba(255,255,255,0.08) !important;
  box-shadow: none !important;
  color: #D0D0D0 !important;
}
.el-select-dropdown { background: #1a1a1a !important; border-color: rgba(255,255,255,0.08) !important; }
.el-select-dropdown__item { color: #909090 !important; }
.el-select-dropdown__item:hover { background: rgba(0,255,148,0.08) !important; color: #00FF94 !important; }
.el-select-dropdown__item.is-selected { color: #00FF94 !important; }

/* el-button */
.el-button { transition: all 0.2s ease !important; }
.el-button--primary {
  background: linear-gradient(135deg, #00FF94, #00D4FF) !important;
  border: none !important;
  color: #000 !important;
  font-weight: 700 !important;
}
.el-button--primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,255,148,0.35) !important; }
.el-button--default {
  background: transparent !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: #909090 !important;
}
.el-button--default:hover { border-color: rgba(0,255,148,0.4) !important; color: #00FF94 !important; background: rgba(0,255,148,0.06) !important; }
.el-button--small.el-button--primary { padding: 5px 14px !important; }

/* el-dialog 深色 */
.el-dialog {
  background: #1a1a1a !important;
  border: 1px solid rgba(0,255,148,0.15) !important;
  border-radius: 16px !important;
  --el-dialog-bg-color: #1a1a1a !important;
}
.el-dialog__header { border-bottom: 1px solid rgba(255,255,255,0.06) !important; }
.el-dialog__title { color: #F0F0F0 !important; font-weight: 700 !important; }
.el-dialog__body { color: #D0D0D0 !important; }
.el-overlay { background: rgba(0,0,0,0.75) !important; backdrop-filter: blur(8px) !important; }

/* el-descriptions 深色 */
.el-descriptions { --el-descriptions-item-bordered-label-background: #1a1a1a; }
.el-descriptions__label { background: #1a1a1a !important; color: #707070 !important; border-color: rgba(255,255,255,0.06) !important; }
.el-descriptions__content { background: #252525 !important; color: #D0D0D0 !important; border-color: rgba(255,255,255,0.06) !important; }

/* el-steps 深色 */
.el-step__title { color: #909090 !important; }
.el-step__title.is-process { color: #00FF94 !important; }
.el-step__icon { border-color: rgba(255,255,255,0.15) !important; background: #252525 !important; color: #909090 !important; }
.el-step.is-process .el-step__icon { border-color: #00FF94 !important; color: #00FF94 !important; }
.el-step.is-finish .el-step__icon { border-color: #00FF94 !important; background: rgba(0,255,148,0.15) !important; color: #00FF94 !important; }
.el-step__line { background: rgba(255,255,255,0.1) !important; }

/* el-radio/checkbox 深色 */
.el-radio__label,
.el-checkbox__label { color: #D0D0D0 !important; }
.el-radio__inner,
.el-checkbox__inner { background: #1a1a1a !important; border-color: rgba(255,255,255,0.2) !important; }
.el-radio.is-checked .el-radio__inner,
.el-checkbox.is-checked .el-checkbox__inner { background: #00FF94 !important; border-color: #00FF94 !important; }

/* el-tabs 深色 */
.el-tabs__header { border-bottom-color: rgba(255,255,255,0.08) !important; }
.el-tabs__nav-wrap::after { background: rgba(255,255,255,0.08) !important; }
.el-tabs__item { color: #606060 !important; }
.el-tabs__item.is-active { color: #00FF94 !important; }
.el-tabs__active-bar { background: linear-gradient(135deg, #00FF94, #00D4FF) !important; }

/* el-statistic */
.el-statistic__content { color: #00FF94 !important; font-family: Consolas, monospace !important; }
.el-statistic__head { color: #606060 !important; }

/* el-progress */
.el-progress-bar__outer { background: rgba(255,255,255,0.08) !important; }
.el-progress-bar__inner { background: linear-gradient(135deg, #00FF94, #00D4FF) !important; }

/* el-alert */
.el-alert { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.08) !important; }
.el-alert--info { background: rgba(0,212,255,0.08) !important; border-color: rgba(0,212,255,0.2) !important; }
.el-alert--success { background: rgba(0,255,148,0.08) !important; border-color: rgba(0,255,148,0.2) !important; }
.el-alert--warning { background: rgba(255,183,0,0.08) !important; border-color: rgba(255,183,0,0.2) !important; }
.el-alert--error { background: rgba(255,75,110,0.08) !important; border-color: rgba(255,75,110,0.2) !important; }
.el-alert__title { color: #D0D0D0 !important; }
.el-alert__description { color: #909090 !important; }

/* el-empty 深色 */
.el-empty__description p { color: #606060 !important; }

/* textarea 深色 */
textarea {
  background: #1a1a1a !important;
  color: #E0E0E0 !important;
  border-color: rgba(255,255,255,0.1) !important;
}
textarea::placeholder { color: #404040 !important; }

/* breadcrumb */
.el-breadcrumb__inner,
.el-breadcrumb__separator { color: #505050 !important; }
.el-breadcrumb__inner.is-link:hover { color: #00FF94 !important; }

/* el-pagination 深色 */
.el-pagination { --el-pagination-text-color: #606060; --el-pagination-button-bg-color: #252525; --el-pagination-button-color: #606060; --el-pagination-hover-color: #00FF94; }
.el-pager li { background: #252525 !important; color: #606060 !important; border: 1px solid rgba(255,255,255,0.06) !important; }
.el-pager li.is-active { background: rgba(0,255,148,0.12) !important; color: #00FF94 !important; border-color: rgba(0,255,148,0.3) !important; }
.el-pagination button { background: #252525 !important; color: #606060 !important; border: 1px solid rgba(255,255,255,0.06) !important; }

/* el-message 深色 */
.el-message { background: #252525 !important; border-color: rgba(0,255,148,0.2) !important; }
.el-message--success { border-color: rgba(0,255,148,0.3) !important; }
.el-message--warning { border-color: rgba(255,183,0,0.3) !important; }
.el-message--error { border-color: rgba(255,75,110,0.3) !important; }
.el-message__content { color: #E0E0E0 !important; }

/* el-message-box */
.el-message-box {
  background: #1a1a1a !important;
  border: 1px solid rgba(0,255,148,0.15) !important;
  border-radius: 16px !important;
}
.el-message-box__title { color: #F0F0F0 !important; }
.el-message-box__content { color: #D0D0D0 !important; }
.el-message-box__header { border-bottom: 1px solid rgba(255,255,255,0.06) !important; }

/* el-dropdown */
.el-dropdown-menu { background: #1a1a1a !important; border: 1px solid rgba(255,255,255,0.08) !important; }
.el-dropdown-menu__item { color: #909090 !important; }
.el-dropdown-menu__item:hover { background: rgba(0,255,148,0.08) !important; color: #00FF94 !important; }
.el-dropdown-menu__item.is-divided { border-top-color: rgba(255,255,255,0.06) !important; }

/* el-badge */
.el-badge__content.is-fixed { top: 4px; }

/* el-loading */
.el-loading-mask { background: rgba(17,17,17,0.85) !important; backdrop-filter: blur(4px) !important; }
.el-loading-spinner .circular .path { stroke: #00FF94 !important; }
.el-loading-text { color: #00FF94 !important; }

/* 通用 p/span 暗色修复 */
p { color: #D0D0D0; }
span { color: inherit; }

/* 旧版 scoped 里的 .logo h2 */
.logo h2 { color: #00FF94 !important; }
.logo span { color: #00D4FF !important; font-family: Consolas, monospace !important; }
</style>
