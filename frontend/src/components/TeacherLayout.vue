<template>
  <el-container class="teacher-layout">
    <!-- 侧边栏 -->
    <el-aside
      width="220px"
      class="sidebar"
    >
      <div class="logo">
        <h2>智慧教育</h2>
        <span>教师端</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/teacher/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <el-menu-item index="/teacher/assignments">
          <el-icon><Document /></el-icon>
          <span>作业管理</span>
        </el-menu-item>
        
        <el-menu-item index="/teacher/grading">
          <el-icon><Edit /></el-icon>
          <span>批改管理</span>
        </el-menu-item>
        
        <el-menu-item index="/teacher/analytics">
          <el-icon><DataAnalysis /></el-icon>
          <span>学情分析</span>
        </el-menu-item>
        
        <el-menu-item index="/teacher/tiered-teaching">
          <el-icon><Operation /></el-icon>
          <span>分层教学</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/teacher/dashboard' }">
              首页
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">
              {{ currentTitle }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar
                :size="32"
                :src="userStore.userInfo?.avatarUrl"
              >
                {{ userStore.displayName?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userStore.displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item
                  command="logout"
                  divided
                >
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 内容区 -->
      <el-main class="main-content">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
/**
 * 教师端布局组件
 * 
 * 提供统一的侧边栏导航和顶部栏
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import {
  HomeFilled,
  Document,
  Edit,
  DataAnalysis,
  Operation,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 当前激活的菜单
const activeMenu = computed(() => {
  const path = route.path
  // 处理子路由，返回父路由路径
  if (path.startsWith('/teacher/assignments/')) {
    return '/teacher/assignments'
  }
  if (path.startsWith('/teacher/grading/')) {
    return '/teacher/grading'
  }
  return path
})

// 当前页面标题
const currentTitle = computed(() => {
  return route.meta.title as string || ''
})

// 处理下拉菜单命令
function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      // TODO: 跳转到个人信息页面
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 处理登出
async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.teacher-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  border-bottom: 1px solid #3d4a5a;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
}

.logo span {
  font-size: 12px;
  color: #bfcbd9;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.username {
  margin-left: 8px;
  color: #333;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
