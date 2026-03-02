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
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import InterestSurveyModal from '@/components/InterestSurveyModal.vue'

const router = useRouter()
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
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
</style>
