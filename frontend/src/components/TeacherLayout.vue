<template>
  <div class="layout-root">
    <!-- 侧边栏 -->
    <aside class="layout-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="layout-logo">
        <div class="logo-icon">🎓</div>
        <div v-if="!sidebarCollapsed" class="logo-text">
          <div class="logo-title">EduAI</div>
          <div class="logo-sub">TEACHER · V2.0</div>
        </div>
      </div>

      <nav class="layout-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <span class="nav-icon-wrap">
            <component :is="item.icon" class="nav-icon" />
          </span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- 主题选择 -->
      <div class="sidebar-theme-wrap">
        <ThemePicker v-if="!sidebarCollapsed" />
        <div v-else class="theme-icon-only" title="切换主题">
          <PaintBrushIcon class="nav-icon" />
        </div>
      </div>

      <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <el-icon>
          <ArrowLeft v-if="!sidebarCollapsed" />
          <ArrowRight v-else />
        </el-icon>
      </button>
    </aside>

    <!-- 主内容区 -->
    <div class="layout-main" :class="{ expanded: sidebarCollapsed }">
      <header class="layout-topbar">
        <div class="topbar-left">
          <el-breadcrumb separator="›">
            <el-breadcrumb-item :to="{ path: '/teacher/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="topbar-right">
          <!-- 消息通知 -->
          <el-popover
            placement="bottom-end"
            :width="340"
            trigger="click"
            popper-class="msg-popover"
          >
            <template #reference>
              <el-badge :value="unreadCount || undefined" :hidden="unreadCount === 0" class="notification-badge">
                <button class="icon-btn" title="消息通知">
                  <el-icon><Bell /></el-icon>
                </button>
              </el-badge>
            </template>
            <!-- 消息面板内容 -->
            <div class="msg-panel">
              <div class="msg-panel-head">
                <span>消息通知</span>
                <el-button link size="small" @click="markAllRead">全部已读</el-button>
              </div>
              <div v-if="notifications.length === 0" class="msg-empty">暂无消息</div>
              <div
                v-for="n in notifications"
                :key="n.id"
                class="msg-item"
                :class="{ unread: !n.read }"
                @click="readNotification(n)"
              >
                <div class="msg-dot" :class="n.type" />
                <div class="msg-body">
                  <div class="msg-title">{{ n.title }}</div>
                  <div class="msg-content">{{ n.content }}</div>
                  <div class="msg-time">{{ n.time }}</div>
                </div>
              </div>
            </div>
          </el-popover>

          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-trigger">
              <el-avatar :size="34" :src="userStore.userInfo?.avatarUrl" class="user-avatar">
                {{ userStore.displayName?.charAt(0) }}
              </el-avatar>
              <div class="user-meta">
                <span class="user-name">{{ userStore.displayName }}</span>
                <span class="user-role">教师</span>
              </div>
              <el-icon class="user-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="dark-dropdown">
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="layout-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import ThemePicker from '@/components/ThemePicker.vue'
import { PaintBrushIcon } from '@heroicons/vue/24/outline'
import {
  HomeFilled, Document, Edit, DataAnalysis, Operation,
  ArrowDown, ArrowLeft, ArrowRight, User, SwitchButton, Bell,
  Management, TrendCharts, VideoCamera, Warning
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const sidebarCollapsed = ref(false)

// ── 消息通知 ──────────────────────────────────
interface Notification {
  id: number
  title: string
  content: string
  time: string
  type: 'assignment' | 'system' | 'student'
  read: boolean
}

const notifications = ref<Notification[]>([
  { id: 1, title: '有新作业待批改', content: '算法1班《递归算法》作业已截止，23人已提交待批改', time: '10分钟前', type: 'assignment', read: false },
  { id: 2, title: '学生求助消息', content: '网络工程2班 张同学 对《动态规划》课节提出问题', time: '32分钟前', type: 'student', read: false },
  { id: 3, title: '防刷课告警', content: '数据结构3班发现2名学生人脸核验异常，请及时处理', time: '1小时前', type: 'system', read: false },
  { id: 4, title: '作业发布成功', content: '《链表与树》作业已成功发布至算法1班', time: '2小时前', type: 'assignment', read: true },
  { id: 5, title: '系统通知', content: '平台将于今晚22:00进行维护，预计30分钟', time: '昨天', type: 'system', read: true },
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function readNotification(n: Notification) {
  n.read = true
}

function markAllRead() {
  notifications.value.forEach(n => { n.read = true })
}

const navItems = [
  { path: '/teacher/dashboard',        label: '工作台',   icon: HomeFilled   },
  { path: '/teacher/courses',          label: '课程管理', icon: Management   },
  { path: '/teacher/assignments',      label: '作业管理', icon: Document     },
  { path: '/teacher/grading',          label: '批改管理', icon: Edit         },
  { path: '/teacher/analytics',        label: '学情分析', icon: DataAnalysis },
  { path: '/teacher/tiered-teaching',  label: '分层教学', icon: Operation    },
  { path: '/teacher/students',         label: '学生列表', icon: TrendCharts  },
  { path: '/teacher/video-publish',    label: '视频上下架', icon: VideoCamera },
  { path: '/teacher/face-audit',       label: '防刷课监控', icon: Warning     },
]

const isActive = (path: string) => {
  if (path === '/teacher/dashboard') return route.path === path
  return route.path.startsWith(path)
}

const currentTitle = computed(() => route.meta.title as string || '')

function handleCommand(command: string) {
  if (command === 'logout') handleLogout()
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    router.push('/login')
  } catch { /* cancel */ }
}
</script>

<style scoped>
.layout-root {
  display: flex;
  min-height: 100vh;
  background: #1E1E1E;
}

.layout-sidebar {
  width: 220px;
  background: #111111;
  border-right: 1px solid rgba(0, 212, 255, 0.08);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.layout-sidebar.collapsed { width: 64px; }

.layout-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  min-height: 68px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #00D4FF, #7C3AED);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 0 16px rgba(0, 212, 255, 0.35);
}

.logo-title {
  font-size: 17px;
  font-weight: 900;
  background: linear-gradient(135deg, #00D4FF, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: Consolas, monospace;
  letter-spacing: 1px;
}

.logo-sub {
  font-size: 10px;
  color: #505050;
  letter-spacing: 2px;
  font-family: Consolas, monospace;
  margin-top: 1px;
}

.layout-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  padding: 12px 8px;
}
.layout-nav::-webkit-scrollbar { display: none; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 9px;
  color: #707070;
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 2px;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(0, 212, 255, 0.07);
  color: #D0D0D0;
}

.nav-item.active {
  background: rgba(0, 212, 255, 0.1);
  color: #00D4FF;
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.nav-icon-wrap {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon { font-size: 16px; }
.nav-label { flex: 1; }

.sidebar-toggle {
  margin: 12px 8px;
  padding: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 9px;
  color: #505050;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle:hover {
  background: rgba(0, 212, 255, 0.07);
  color: #00D4FF;
  border-color: rgba(0, 212, 255, 0.2);
}

.layout-main {
  margin-left: 220px;
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.layout-main.expanded { margin-left: 64px; }

.layout-topbar {
  height: 60px;
  background: rgba(17, 17, 17, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 9px;
  color: #707070;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
}

.icon-btn:hover {
  background: rgba(0,212,255,0.08);
  border-color: rgba(0,212,255,0.25);
  color: #00D4FF;
}

.notification-badge :deep(.el-badge__content) {
  background: #00D4FF;
  color: #000;
  font-size: 10px;
  font-weight: 700;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.user-trigger:hover {
  background: rgba(0,212,255,0.06);
  border-color: rgba(0,212,255,0.15);
}

.user-avatar {
  border: 2px solid rgba(0,212,255,0.3) !important;
  box-shadow: 0 0 10px rgba(0,212,255,0.2) !important;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #D0D0D0;
  line-height: 1.2;
}

.user-role {
  font-size: 10px;
  color: #00D4FF;
  font-family: Consolas, monospace;
  letter-spacing: 1px;
}

.user-arrow {
  color: #505050;
  font-size: 12px;
}

.layout-content {
  flex: 1;
  background: #1E1E1E;
  overflow-x: hidden;
  padding: 24px;
}

@media (max-width: 1024px) {
  .layout-sidebar { width: 64px; }
  .layout-main { margin-left: 64px; }
  .logo-text, .nav-label { display: none; }
  .layout-logo { justify-content: center; }
  .nav-item { justify-content: center; }
}

@media (max-width: 640px) {
  .layout-sidebar { transform: translateX(-100%); }
  .layout-main { margin-left: 0; }
  .layout-content { padding: 12px; }
}

/* ── 主题选择器 ── */
.sidebar-theme-wrap {
  padding: 0 0 8px;
  border-bottom: 1px solid var(--border-color-dim);
  margin-bottom: 4px;
}
.theme-icon-only {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s;
}
.theme-icon-only:hover { color: var(--color-primary); }
.nav-icon { width: 18px; height: 18px; }
</style>

<style>
/* 消息弹窗（非scoped，作用于teleport到body的popover）*/
.msg-popover { padding: 0 !important; background: var(--bg-card, #252525) !important; border: 1px solid var(--border-color, rgba(0,212,255,0.15)) !important; border-radius: 12px !important; }
.msg-panel { min-width: 300px; }
.msg-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; border-bottom: 1px solid var(--border-color-dim, rgba(255,255,255,0.06)); font-size: 14px; font-weight: 700; color: var(--text-primary, #F0F0F0); }
.msg-empty { padding: 32px; text-align: center; color: var(--text-muted, #606060); font-size: 13px; }
.msg-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid var(--border-color-dim, rgba(255,255,255,0.04)); }
.msg-item:last-child { border-bottom: none; }
.msg-item:hover { background: var(--border-color, rgba(0,212,255,0.05)); }
.msg-item.unread { background: rgba(0,212,255,0.04); }
.msg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.msg-dot.assignment { background: #00FF94; }
.msg-dot.student { background: #00D4FF; }
.msg-dot.system { background: #FFB700; }
.msg-item:not(.unread) .msg-dot { background: #404040; }
.msg-body { flex: 1; min-width: 0; }
.msg-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #E0E0E0); margin-bottom: 3px; }
.msg-item:not(.unread) .msg-title { color: var(--text-muted, #707070); font-weight: 400; }
.msg-content { font-size: 12px; color: var(--text-muted, #606060); line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg-time { font-size: 11px; color: var(--text-muted, #505050); margin-top: 4px; }
</style>
