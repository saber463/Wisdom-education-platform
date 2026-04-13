<template>
  <div class="flex flex-col min-h-screen" style="background:var(--bg-base);color:var(--text-primary)">
    <!-- 头部导航 -->
    <header
      class="sticky top-0 z-50 glass shadow-lg transition-all duration-300 border-b"
      style="border-color:var(--border)"
    >
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link to="/" class="flex items-center space-x-3 group">
            <div class="relative">
              <div
                class="absolute inset-0 bg-gradient-to-br from-accent to-primary rounded-xl blur-lg opacity-25 group-hover:opacity-45 transition-opacity duration-300"
              />
              <div
                class="relative w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-neon-blue group-hover:scale-110 transition-transform duration-300"
              >
                <i class="fa fa-graduation-cap text-white text-lg" />
              </div>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-base text-white leading-tight">AI 学习助手</span>
              <span class="text-xs" style="color:var(--text-muted)">智能学习平台</span>
            </div>
          </router-link>

          <!-- 导航菜单（桌面端）- 分两组：主导航 + 角色导航下拉 -->
          <nav class="hidden md:flex items-center gap-0.5">
            <router-link
              v-for="(item, index) in mainNavItems"
              :key="index"
              :to="item.path"
              class="relative px-3 py-1.5 rounded-lg text-sm transition-all duration-200 whitespace-nowrap"
              :class="isActive(item.path)
                ? 'text-white font-semibold bg-primary/20 shadow-neon-purple'
                : 'text-gray-400 hover:text-white hover:bg-white/8'"
            >
              {{ item.name }}
              <span
                v-if="isActive(item.path)"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full bg-primary-light"
              />
            </router-link>

            <!-- 角色中心下拉菜单 -->
            <div class="relative group/role">
              <button
                class="relative px-3 py-1.5 rounded-lg text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1"
                :class="roleNavItems.some(r => isActive(r.path))
                  ? 'text-white font-semibold bg-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'"
              >
                🎭 角色中心 <span class="text-xs opacity-50">▾</span>
              </button>
              <div
                class="absolute top-full left-0 mt-1.5 w-44 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/role:opacity-100 group-hover/role:visible transition-all duration-200 z-50"
                style="background:var(--bg-overlay);border:1px solid var(--border-strong)"
              >
                <router-link
                  v-for="r in roleNavItems"
                  :key="r.path"
                  :to="r.path"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                  :class="isActive(r.path)
                    ? 'text-white bg-primary/25 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/8'"
                >
                  {{ r.name }}
                </router-link>
              </div>
            </div>
          </nav>

          <!-- 用户菜单 -->
          <div class="flex items-center space-x-3">
            <div v-if="userStore.isLogin" class="flex items-center space-x-2">
              <!-- 消息通知图标 -->
              <DropdownMenu>
                <template #trigger>
                  <button
                    class="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all group"
                  >
                    <i class="fa fa-bell text-lg group-hover:scale-110 transition-transform duration-200" />
                    <span
                      v-if="notificationStore.unreadNotificationsCount > 0"
                      class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    >
                      {{ notificationStore.unreadNotificationsCount > 99 ? '99+' : notificationStore.unreadNotificationsCount }}
                    </span>
                  </button>
                </template>
                <template #content>
                  <div
                    class="w-80 rounded-xl shadow-2xl overflow-hidden"
                    style="background:var(--bg-overlay);border:1px solid var(--border-strong)"
                  >
                    <div
                      class="p-4 border-b flex justify-between items-center"
                      style="border-color:var(--border);background:var(--primary-soft)"
                    >
                      <h3 class="font-bold text-white flex items-center text-sm">
                        <i class="fa fa-bell mr-2 text-accent" />消息通知
                      </h3>
                      <button
                        class="text-xs text-accent hover:text-accent-light transition-colors font-medium"
                        @click="notificationStore.markAllAsRead()"
                      >
                        全部已读
                      </button>
                    </div>
                    <div class="max-h-80 overflow-y-auto">
                      <div
                        v-if="notificationStore.unreadNotifications.length === 0 && notificationStore.readNotifications.length === 0"
                        class="p-8 text-center"
                        style="color:var(--text-muted)"
                      >
                        <div class="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style="background:var(--primary-soft)">
                          <i class="fa fa-inbox text-2xl text-accent" />
                        </div>
                        <p class="text-sm">暂无消息通知</p>
                      </div>
                      <div v-else>
                        <div
                          v-if="notificationStore.unreadNotifications.length > 0"
                          class="border-b"
                          style="border-color:var(--border)"
                        >
                          <h4 class="px-4 py-2 text-xs font-bold uppercase tracking-wider" style="color:var(--accent)">
                            未读消息
                          </h4>
                          <div
                            v-for="notification in notificationStore.unreadNotifications"
                            :key="notification._id || notification.id"
                            class="p-4 cursor-pointer border-t transition-colors hover:bg-white/4"
                            style="border-color:var(--border)"
                            @click="handleNotificationClick(notification)"
                          >
                            <div class="flex items-start gap-3">
                              <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-danger" />
                              <div class="flex-1 min-w-0">
                                <h5 class="font-semibold text-white text-sm truncate">
                                  {{ notification.title }}
                                </h5>
                                <p class="text-xs mt-0.5 leading-relaxed line-clamp-2" style="color:var(--text-secondary)">
                                  {{ notification.content }}
                                </p>
                                <p class="text-xs mt-1.5 flex items-center gap-1" style="color:var(--text-muted)">
                                  <i class="fa fa-clock" />
                                  {{ new Date(notification.time).toLocaleString() }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-if="notificationStore.readNotifications.length > 0">
                          <h4 class="px-4 py-2 text-xs font-bold uppercase tracking-wider" style="color:var(--text-muted)">
                            已读消息
                          </h4>
                          <div
                            v-for="notification in notificationStore.readNotifications"
                            :key="notification._id || notification.id"
                            class="p-4 cursor-pointer border-t transition-colors hover:bg-white/4"
                            style="border-color:var(--border)"
                            @click="handleNotificationClick(notification)"
                          >
                            <div class="flex items-start gap-3">
                              <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style="background:var(--border-strong)" />
                              <div class="flex-1 min-w-0">
                                <h5 class="font-medium text-sm truncate" style="color:var(--text-secondary)">
                                  {{ notification.title }}
                                </h5>
                                <p class="text-xs mt-0.5 line-clamp-2" style="color:var(--text-muted)">
                                  {{ notification.content }}
                                </p>
                                <p class="text-xs mt-1.5 flex items-center gap-1" style="color:var(--text-muted)">
                                  <i class="fa fa-clock" />
                                  {{ new Date(notification.time).toLocaleString() }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="p-3 border-t text-center" style="border-color:var(--border);background:var(--bg-surface)">
                      <button
                        class="text-xs text-danger hover:text-red-400 transition-colors font-medium"
                        @click="notificationStore.clearAllNotifications()"
                      >
                        清空所有通知
                      </button>
                    </div>
                  </div>
                </template>
              </DropdownMenu>
              <router-link to="/user/profile" class="hidden md:block relative group">
                <div class="absolute inset-0 bg-primary rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                <img
                  :src="userStore.userInfo.avatar"
                  alt="用户头像"
                  class="relative w-9 h-9 rounded-full object-cover border-2 border-white/20 group-hover:scale-110 transition-transform duration-200"
                />
              </router-link>
              <DropdownMenu>
                <template #trigger>
                  <button
                    class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 group hover:bg-white/8"
                  >
                    <span class="hidden md:block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {{ userStore.userInfo.username }}
                    </span>
                    <i class="fa fa-angle-down text-xs text-gray-500 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </template>
                <template #content>
                  <div
                    class="w-48 rounded-xl shadow-2xl p-1.5"
                    style="background:var(--bg-overlay);border:1px solid var(--border-strong)"
                  >
                    <div class="px-3 py-2 mb-1 border-b" style="border-color:var(--border)">
                      <p class="text-xs uppercase tracking-wider font-semibold" style="color:var(--text-muted)">用户菜单</p>
                    </div>
                    <router-link
                      to="/user/center"
                      class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors group text-gray-300 hover:text-white hover:bg-white/8"
                    >
                      <i class="fa fa-user mr-2.5 text-accent text-xs group-hover:scale-110 transition-transform" />
                      <span>个人中心</span>
                    </router-link>
                    <router-link
                      to="/membership"
                      class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors group text-gray-300 hover:text-white hover:bg-white/8"
                    >
                      <i class="fa fa-crown mr-2.5 text-warning text-xs group-hover:scale-110 transition-transform" />
                      <span>会员中心</span>
                    </router-link>
                    <router-link
                      to="/user/browse-history"
                      class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors group text-gray-300 hover:text-white hover:bg-white/8"
                    >
                      <i class="fa fa-history mr-2.5 text-success text-xs group-hover:scale-110 transition-transform" />
                      <span>浏览历史</span>
                    </router-link>
                    <router-link
                      to="/learning-path/generate"
                      class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors group text-gray-300 hover:text-white hover:bg-white/8"
                    >
                      <i class="fa fa-road mr-2.5 text-info text-xs group-hover:scale-110 transition-transform" />
                      <span>我的学习路径</span>
                    </router-link>
                    <div class="border-t my-1" style="border-color:var(--border)" />
                    <button
                      class="flex items-center w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-all group"
                      @click="userStore.logout()"
                    >
                      <i class="fa fa-sign-out-alt mr-2.5 text-xs group-hover:scale-110 transition-transform" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </template>
              </DropdownMenu>
            </div>
            <div v-else class="flex space-x-2">
              <router-link to="/login" class="btn-secondary text-sm px-4 py-2 rounded-xl">
                登录
              </router-link>
              <router-link to="/register" class="btn-primary text-sm px-4 py-2 rounded-xl">
                注册
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-grow container mx-auto px-4 py-6">
      <router-view />
    </main>

    <!-- 兴趣选择弹窗 -->
    <InterestModal v-if="showInterestModal" />

    <!-- 底部 -->
    <footer class="py-10 relative overflow-hidden" style="background:var(--bg-surface);border-top:1px solid var(--border)">
      <div class="absolute top-0 left-1/4 w-80 h-80 bg-primary rounded-full blur-[140px] opacity-5" />
      <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-accent rounded-full blur-[110px] opacity-5" />

      <div class="container mx-auto px-4 relative z-10">
        <div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center">
                <i class="fa fa-graduation-cap text-white text-lg" />
              </div>
              <div>
                <span class="font-bold text-white">AI 学习助手</span>
                <p class="text-xs" style="color:var(--text-muted)">智能学习平台</p>
              </div>
            </div>
            <p class="text-sm leading-relaxed mb-4 max-w-xs" style="color:var(--text-secondary)">
              基于先进 AI 算法，为你量身定制学习路径。整合全网优质资源，让每一次学习都事半功倍。
            </p>
            <div class="flex space-x-3">
              <a
                v-for="(s, i) in [['github','fab fa-github'],['weixin.qq.com','fab fa-weixin'],['weibo.com','fab fa-weibo']]"
                :key="i"
                :href="`https://${s[0]}`"
                target="_blank" rel="noopener noreferrer"
                class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-neon-blue text-gray-400 hover:text-white"
                style="background:rgba(255,255,255,0.06);border:1px solid var(--border)"
              >
                <i :class="s[1]" />
              </a>
            </div>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-white mb-4 flex items-center text-sm">
              <i class="fa fa-link mr-2 text-accent" />快速链接
            </h4>
            <ul class="space-y-2">
              <li v-for="(l, i) in [['/', '首页'], ['/learning-path/generate', 'AI 学习路径'], ['/assessment/tests', '学习评估'], ['/knowledge-base', '知识库']]" :key="i">
                <router-link :to="l[0]" class="text-sm flex items-center group transition-colors hover:text-accent" style="color:var(--text-secondary)">
                  <i class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform" />{{ l[1] }}
                </router-link>
              </li>
            </ul>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-white mb-4 flex items-center text-sm">
              <i class="fa fa-info-circle mr-2 text-primary-light" />关于我们
            </h4>
            <ul class="space-y-2">
              <li v-for="t in ['关于平台', '使用条款', '隐私政策', '联系我们']" :key="t">
                <a href="#" class="text-sm flex items-center group transition-colors hover:text-primary-light" style="color:var(--text-secondary)">
                  <i class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform" />{{ t }}
                </a>
              </li>
            </ul>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-white mb-4 flex items-center text-sm">
              <i class="fa fa-envelope mr-2 text-success" />订阅更新
            </h4>
            <p class="text-sm mb-3" style="color:var(--text-secondary)">订阅我们的新闻通讯，获取最新学习资源和平台更新。</p>
            <div class="flex gap-2">
              <input
                type="email"
                placeholder="输入您的邮箱"
                class="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style="background:var(--bg-elevated);border:1px solid var(--border-strong);color:var(--text-primary)"
              />
              <button class="btn-primary text-sm px-4 py-2 rounded-xl">订阅</button>
            </div>
          </div>
        </div>

        <div class="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4" style="border-color:var(--border)">
          <p class="text-sm" style="color:var(--text-muted)">
            © 2025 AI 学习助手 · AI Web 比赛项目 · 保留所有权利
          </p>
          <div class="flex items-center space-x-5 text-sm" style="color:var(--text-muted)">
            <span class="flex items-center gap-1.5"><i class="fa fa-users text-accent" />10K+ 活跃用户</span>
            <span class="flex items-center gap-1.5"><i class="fa fa-graduation-cap text-primary-light" />500+ 学习路径</span>
            <span class="flex items-center gap-1.5"><i class="fa fa-star text-warning" />98% 满意度</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useNotificationStore } from '@/store/notification';
import DropdownMenu from '@/components/common/DropdownMenu.vue';
import InterestModal from '@/components/common/InterestModal.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const notificationStore = useNotificationStore();

// 兴趣选择弹窗控制
const showInterestModal = computed(() => {
  return (
    userStore.isLogin &&
    !userStore.userInfo?.learningInterests?.length &&
    !localStorage.getItem('interest_modal_dismissed')
  );
});

// 导航菜单配置 - 拆分为主导航 + 角色导航下拉
const mainNavItems = [
  { name: '首页', path: '/' },
  { name: '学习社区', path: '/tweets' },
  { name: 'AI 学习路径', path: '/learning-path/generate' },
  { name: '代码生成器', path: '/learning/code-generator' },
  { name: '学习评估', path: '/assessment/tests' },
  { name: '知识库', path: '/knowledge-base' },
  { name: '个人中心', path: '/user/center' },
];

const roleNavItems = [
  { name: '🧑‍🏫 教师工作台', path: '/teacher' },
  { name: '👪 家长监控台', path: '/parent' },
  { name: '🎒 学生学习台', path: '/student' },
];

// 兼容移动端菜单
const navItems = [...mainNavItems, ...roleNavItems];

// 判断路由是否激活
const isActive = path => {
  if (path === '/') return route.path === '/' || route.path === '/home';
  return route.path.startsWith(path);
};

// 组件挂载时加载通知数据
onMounted(async () => {
  // 从后端获取最新通知数据
  if (userStore.isLogin) {
    await notificationStore.fetchNotifications();
    console.log('通知数据加载成功，当前未读通知数量:', notificationStore.unreadNotificationsCount);
  }
});

// 处理通知点击
const handleNotificationClick = notification => {
  // 标记为已读（使用_id或id）
  const notificationId = notification._id || notification.id;
  notificationStore.markAsRead(notificationId);
  // 如果有链接，跳转到对应的页面
  if (notification.link) {
    router.push(notification.link);
  }
};
</script>
