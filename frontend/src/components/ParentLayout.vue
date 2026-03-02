<template>
  <el-container class="parent-layout">
    <!-- 侧边栏 -->
    <el-aside
      width="220px"
      class="sidebar"
    >
      <div class="logo">
        <h2>智慧教育</h2>
        <span>家长端</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        background-color="#2d3a4b"
        text-color="#bfcbd9"
        active-text-color="#e6a23c"
      >
        <el-menu-item index="/parent/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <el-menu-item index="/parent/monitor">
          <el-icon><DataAnalysis /></el-icon>
          <span>学情监控</span>
        </el-menu-item>
        
        <el-menu-item index="/parent/weak-points">
          <el-icon><Warning /></el-icon>
          <span>薄弱点详情</span>
        </el-menu-item>
        
        <el-menu-item index="/parent/messages">
          <el-icon><ChatDotRound /></el-icon>
          <span>家校留言</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/parent/dashboard' }">
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
 * 家长端布局组件
 * 
 * 提供统一的侧边栏导航和顶部栏
 * 需求：8.1 - 家长登录系统
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import {
  HomeFilled,
  DataAnalysis,
  Warning,
  ChatDotRound,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
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
.parent-layout {
  height: 100vh;
}

.sidebar {
  background-color: #2d3a4b;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  border-bottom: 1px solid #3d4a5b;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
}

.logo span {
  font-size: 12px;
  color: #e6a23c;
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
