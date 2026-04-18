<template>
  <div class="flex flex-col min-h-screen" style="background:var(--bg-base);color:var(--text-primary)">
    <!-- 头部导航 -->
    <header
      class="sticky top-0 z-[100] glass border-b"
      :class="{ 'header-scrolled': isScrolled }"
      style="border-color:var(--border); transition: box-shadow 0.2s ease;"
    >
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link :to="homePath" class="flex items-center space-x-3 group">
            <div class="relative">
              <div
                class="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl blur-lg opacity-20 group-hover:opacity-35 transition-opacity duration-300"
              />
              <div
                class="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300"
              >
                <i class="fa fa-graduation-cap text-white text-lg" />
              </div>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-base text-gray-900 leading-tight">智学AI</span>
              <span class="text-xs text-gray-400">智慧学习平台</span>
            </div>
          </router-link>

          <!-- 导航菜单（桌面端）- 根据角色动态显示 -->
          <nav class="hidden md:flex items-center gap-0.5">
            <template v-for="(item, index) in mainNavItems" :key="index">
              <!-- 普通链接 -->
              <router-link
                v-if="!item.isDropdown"
                :to="item.path"
                class="nav-magnetic relative px-3 py-1.5 rounded-lg text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1.5"
                :class="isActive(item.path)
                  ? 'text-blue-600 font-semibold bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'"
              >
                <i v-if="item.icon" :class="`fa ${item.icon}`" class="text-xs opacity-70" />
                {{ item.name }}
                <span
                  v-if="isActive(item.path)"
                  class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full bg-primary-light"
                />
              </router-link>

              <!-- 下拉菜单项 -->
              <div
                v-else
                class="relative group/nav-item"
              >
                <router-link
                  :to="item.path"
                  class="nav-magnetic relative px-3 py-1.5 rounded-lg text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1"
                  :class="(isActive(item.path) || item.subItems?.some(s => isActive(s.path)))
                    ? 'text-blue-600 font-semibold bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'"
                >
                  <i v-if="item.icon" :class="`fa ${item.icon}`" class="text-xs opacity-70" />
                  {{ item.name }}
                  <span
                    v-if="isActive(item.path)"
                    class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full bg-primary-light"
                  />
                  <span class="text-[10px] opacity-50 ml-0.5">▾</span>
                </router-link>
                <!-- 下拉内容 -->
                <div
                  class="absolute top-full left-0 mt-1.5 min-w-48 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/nav-item:opacity-100 group-hover/nav-item:visible transition-all duration-200 z-50"
                  style="background:white;border:1px solid rgba(0,0,0,0.08);box-shadow:0 10px 40px rgba(0,0,0,0.12)"
                >
                  <router-link
                    v-for="sub in item.subItems"
                    :key="sub.path"
                    :to="sub.path"
                    class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                    :class="isActive(sub.path)
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'"
                  >
                    {{ sub.name }}
                  </router-link>
                </div>
              </div>
            </template>
          </nav>

          <!-- 用户菜单 -->
          <div class="flex items-center space-x-3">
            <div v-if="userStore.isLogin" class="flex items-center space-x-2">
              <!-- 消息通知图标 -->
              <DropdownMenu>
                <template #trigger="{ isOpen }">
                  <div
                    class="relative p-2 rounded-lg transition-all group"
                    :class="isOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'"
                  >
                    <i class="fa fa-bell text-lg group-hover:scale-110 transition-transform duration-200" />
                    <span
                      v-if="notificationStore.unreadNotificationsCount > 0"
                      class="noti-bounce absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    >
                      {{ notificationStore.unreadNotificationsCount > 99 ? '99+' : notificationStore.unreadNotificationsCount }}
                    </span>
                  </div>
                </template>
                <template #content="{ close }">
                  <div
                    class="w-80 rounded-xl shadow-2xl overflow-hidden"
                    style="background:white;border:1px solid rgba(0,0,0,0.08);box-shadow:0 10px 40px rgba(0,0,0,0.12)"
                  >
                    <div
                      class="p-4 border-b flex justify-between items-center bg-blue-50 border-gray-100"
                    >
                      <h3 class="font-bold text-gray-900 flex items-center text-sm">
                        <i class="fa fa-bell mr-2 text-blue-500" />消息通知
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
                        class="p-8 text-center text-gray-400"
                      >
                        <div class="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center bg-blue-50">
                          <i class="fa fa-inbox text-2xl text-blue-400" />
                        </div>
                        <p class="text-sm">暂无消息通知</p>
                      </div>
                      <div v-else>
                        <div
                          v-if="notificationStore.unreadNotifications.length > 0"
                          class="border-b border-gray-100"
                        >
                          <h4 class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                            未读消息
                          </h4>
                          <div
                            v-for="notification in notificationStore.unreadNotifications"
                            :key="notification._id || notification.id"
                            class="p-4 cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50"
                            @click="handleNotificationClick(notification); close()"
                          >
                            <div class="flex items-start gap-3">
                              <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-500" />
                              <div class="flex-1 min-w-0">
                                <h5 class="font-semibold text-gray-900 text-sm truncate">
                                  {{ notification.title }}
                                </h5>
                                <p class="text-xs mt-0.5 leading-relaxed line-clamp-2 text-gray-500">
                                  {{ notification.content }}
                                </p>
                                <p class="text-xs mt-1.5 flex items-center gap-1 text-gray-400">
                                  <i class="fa fa-clock" />
                                  {{ new Date(notification.time).toLocaleString() }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-if="notificationStore.readNotifications.length > 0">
                          <h4 class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                            已读消息
                          </h4>
                          <div
                            v-for="notification in notificationStore.readNotifications"
                            :key="notification._id || notification.id"
                            class="p-4 cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50"
                            @click="handleNotificationClick(notification); close()"
                          >
                            <div class="flex items-start gap-3">
                              <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-gray-300" />
                              <div class="flex-1 min-w-0">
                                <h5 class="font-medium text-sm truncate text-gray-600">
                                  {{ notification.title }}
                                </h5>
                                <p class="text-xs mt-0.5 line-clamp-2 text-gray-400">
                                  {{ notification.content }}
                                </p>
                                <p class="text-xs mt-1.5 flex items-center gap-1 text-gray-400">
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
              <DropdownMenu>
                <template #trigger="{ isOpen }">
                  <div
                    class="flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-all duration-200 group"
                    :class="isOpen ? 'bg-gray-100' : 'hover:bg-gray-50'"
                  >
                    <!-- 用户头像 -->
                    <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-400 group-hover:border-blue-500 transition-colors shrink-0">
                      <NameAvatar
                        :name="userStore.userInfo?.username || '用户'"
                        :size="32"
                        :src="userStore.userInfo?.avatar"
                      />
                    </div>
                    <!-- 用户信息 -->
                    <div class="flex flex-col items-start hidden md:flex">
                      <div class="flex items-center space-x-1">
                        <span class="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                          {{ userStore.userInfo?.username || '用户' }}
                        </span>
                        <i class="fa fa-angle-down text-xs text-gray-400 transition-transform duration-300" :class="{ 'rotate-180': isOpen }" />
                      </div>
                      <span :class="roleBadge.class" class="px-1.5 py-0 rounded-[4px] text-[9px] font-bold uppercase tracking-wider">
                        {{ roleBadge.label }}
                      </span>
                    </div>
                  </div>
                </template>
                <template #content="{ close }">
                  <div
                    class="w-52 rounded-xl shadow-2xl p-1.5"
                    style="background:white;border:1px solid rgba(0,0,0,0.08);box-shadow:0 10px 40px rgba(0,0,0,0.12)"
                  >
                    <div class="px-3 py-2 mb-1 border-b border-gray-100">
                      <p class="text-sm font-semibold text-gray-900">{{ userStore.userInfo?.username || '用户' }}</p>
                      <p class="text-xs text-gray-400">{{ userStore.userInfo?.email || '' }}</p>
                    </div>
                    <div class="py-1.5">
                      <!-- 动态角色菜单 -->
                      <div
                        v-for="item in roleNavItems"
                        :key="item.path"
                        class="flex items-center px-3 py-2 rounded-lg text-sm font-bold text-blue-600 bg-blue-50/50 mb-1 mx-1 transition-colors hover:bg-blue-100 cursor-pointer"
                        @click="router.push(item.path); close()"
                      >
                        <span>{{ item.name }}</span>
                        <i class="fa fa-chevron-right ml-auto text-[10px] opacity-40" />
                      </div>

                      <div class="h-px bg-gray-100 my-1.5" />

                      <router-link
                        to="/user/center"
                        class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors group text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      >
                        <i class="fa fa-user mr-2.5 text-blue-500 text-xs group-hover:scale-110 transition-transform" />
                        <span>个人中心</span>
                      </router-link>
                      <router-link
                        to="/membership"
                        class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors group text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      >
                        <i class="fa fa-crown mr-2.5 text-amber-500 text-xs group-hover:scale-110 transition-transform" />
                        <span>会员中心</span>
                      </router-link>
                      <router-link
                        to="/user/browse-history"
                        class="flex items-center px-3 py-2 rounded-lg text-sm transition-colors group text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                      >
                        <i class="fa fa-history mr-2.5 text-green-500 text-xs group-hover:scale-110 transition-transform" />
                        <span>浏览历史</span>
                      </router-link>
                    </div>
                    <div class="border-t my-1" style="border-color:var(--border)" />
                    <button
                      class="flex items-center w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-all group"
                      @click="handleLogout"
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

    <!-- 测试快捷栏 -->
    <QuickTestBar />

    <!-- 底部 -->
    <footer class="py-10 relative overflow-hidden bg-gray-50 border-t border-gray-100">
      <div class="absolute top-0 left-1/4 w-80 h-80 bg-blue-500 rounded-full blur-[140px] opacity-5" />
      <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[110px] opacity-5" />

      <div class="container mx-auto px-4 relative z-10">
        <div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <i class="fa fa-graduation-cap text-white text-lg" />
              </div>
              <div>
                <span class="font-bold text-gray-900">智学AI</span>
                <p class="text-xs text-gray-400">智慧学习平台</p>
              </div>
            </div>
            <p class="text-sm leading-relaxed mb-4 max-w-xs text-gray-500">
              基于先进 AI 算法，为你量身定制学习路径。整合全网优质资源，让每一次学习都事半功倍。
            </p>
            <div class="flex space-x-3">
              <a
                v-for="(s, i) in [['github','fab fa-github'],['weixin.qq.com','fab fa-weixin'],['weibo.com','fab fa-weibo']]"
                :key="i"
                :href="`https://${s[0]}`"
                target="_blank" rel="noopener noreferrer"
                class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg text-gray-400 hover:text-blue-500"
                style="background:white;border:1px solid rgba(0,0,0,0.08)"
              >
                <i :class="s[1]" />
              </a>
            </div>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-gray-900 mb-4 flex items-center text-sm">
              <i class="fa fa-link mr-2 text-blue-500" />快速链接
            </h4>
            <ul class="space-y-2">
              <li v-for="(l, i) in [['/', '首页'], ['/learning-path/generate', 'AI 学习路径'], ['/assessment/tests', '学习评估'], ['/knowledge-base', '知识库'], ['/vip-courses', '👑 VIP课程']]" :key="i">
                <router-link :to="l[0]" class="text-sm flex items-center group transition-colors hover:text-blue-500 text-gray-500">
                  <i class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform" />{{ l[1] }}
                </router-link>
              </li>
            </ul>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-gray-900 mb-4 flex items-center text-sm">
              <i class="fa fa-info-circle mr-2 text-blue-400" />关于我们
            </h4>
            <ul class="space-y-2">
              <li><router-link to="/about" class="text-sm flex items-center group transition-colors hover:text-blue-500 text-gray-500"><i class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform" />关于平台</router-link></li>
              <li><router-link to="/terms" class="text-sm flex items-center group transition-colors hover:text-blue-500 text-gray-500"><i class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform" />使用条款</router-link></li>
              <li><router-link to="/privacy" class="text-sm flex items-center group transition-colors hover:text-blue-500 text-gray-500"><i class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform" />隐私政策</router-link></li>
              <li><router-link to="/contact" class="text-sm flex items-center group transition-colors hover:text-blue-500 text-gray-500"><i class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform" />联系我们</router-link></li>
            </ul>
          </div>

          <div v-if="userRole !== 'parent'" class="flex-1">
            <h4 class="font-bold text-gray-900 mb-4 flex items-center text-sm">
              <i class="fa fa-envelope mr-2 text-green-500" />订阅更新
            </h4>
            <p class="text-sm mb-3 text-gray-500">订阅我们的新闻通讯，获取最新学习资源和平台更新。</p>
            <div class="flex gap-2">
              <input
                type="email"
                placeholder="输入您的邮箱"
                class="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all bg-white border border-gray-200 text-gray-900 focus:border-blue-400"
              />
              <button class="btn-primary text-sm px-4 py-2 rounded-xl">订阅</button>
            </div>
          </div>
          <div v-else class="flex-1">
            <h4 class="font-bold text-gray-900 mb-4 flex items-center text-sm">
              <i class="fa fa-heart mr-2 text-red-400" />教育寄语
            </h4>
            <p class="text-sm italic leading-relaxed text-gray-500">
              “教育不是灌满一桶水，而是点燃一团火。” —— 我们致力于辅助每一位家长，共同点亮孩子的智慧之光。
            </p>
          </div>
        </div>

        <div class="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4 border-gray-200">
          <div class="flex flex-col md:flex-row items-center gap-3">
            <p class="text-sm text-gray-400">
              © 2025 智学AI · AI Web 比赛项目 · 保留所有权利
            </p>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-gray-400 hover:text-gray-500 transition-colors"
            >
              蜀ICP备2026010173号-1
            </a>
          </div>
          <div class="flex items-center space-x-5 text-sm text-gray-400">
            <span class="flex items-center gap-1.5"><i class="fa fa-users text-blue-400" />10K+ 活跃用户</span>
            <span class="flex items-center gap-1.5"><i class="fa fa-graduation-cap text-blue-400" />500+ 学习路径</span>
            <span class="flex items-center gap-1.5"><i class="fa fa-star text-amber-400" />98% 满意度</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useNotificationStore } from '@/store/notification';
import DropdownMenu from '@/components/common/DropdownMenu.vue';
import QuickTestBar from '@/components/common/QuickTestBar.vue';
import NameAvatar from '@/components/common/NameAvatar.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const notificationStore = useNotificationStore();

// 获取用户角色
const userRole = computed(() => userStore.userRole);

// 计算用户显示名称
const userName = computed(() => userStore.userInfo?.username || '未登录用户');

// 计算首页路径
const homePath = computed(() => {
  if (!userStore.isLogin) return '/';
  const role = userRole.value;
  if (role === 'teacher') return '/teacher';
  if (role === 'parent') return '/parent';
  if (role === 'admin') return '/teacher'; // 管理员默认进入教师工作台
  return '/student';
});

// 基础导航菜单（根据角色动态调整）
const baseNavItems = computed(() => {
  if (userRole.value === 'parent') {
    return [
      { name: '家长首页', path: '/parent', icon: 'fa-home' },
      { name: '家校社区', path: '/tweets', icon: 'fa-comments' },
    ];
  }
  return [
    { name: '首页', path: '/', icon: 'fa-home' },
    { name: '知识库', path: '/knowledge-base', icon: 'fa-book' },
    { name: '学习社区', path: '/tweets', icon: 'fa-comments' },
  ];
});

// 学生导航菜单
const studentNavItems = [
  { name: '🎒 学习台', path: '/student', icon: 'fa-graduation-cap' },
  { name: '学习路径', path: '/learning-path/generate', icon: 'fa-route' },
  { name: '学习评估', path: '/assessment/tests', icon: 'fa-clipboard-check' },
  { name: '✨ 算法可视化', path: '/student/algo-viz', icon: 'fa-magic' },
];

// 老师导航菜单
const teacherNavItems = [
  { name: '🧑‍🏫 教学台', path: '/teacher', icon: 'fa-chalkboard-teacher' },
  { name: '学习路径', path: '/learning-path/generate', icon: 'fa-route' },
  { name: '代码生成', path: '/learning/code-generator', icon: 'fa-code' },
];

// 家长导航菜单 - 专为家长设计
const parentNavItems = [
  { name: '👪 监控中心', path: '/parent', icon: 'fa-eye' },
  { name: '💬 联系老师', path: '/contact-teachers', icon: 'fa-comments' },
  { name: '🎓 家长课堂', path: '/parent-classroom', icon: 'fa-university' },
];

// 根据角色计算导航菜单
const mainNavItems = computed(() => {
  const role = userRole.value;
  const roleMenus = {
    teacher: teacherNavItems,
    parent: parentNavItems,
    student: studentNavItems,
    admin: [...teacherNavItems, ...studentNavItems],
  };
  return [...baseNavItems.value, ...(roleMenus[role] || studentNavItems)];
});

// 角色中心下拉菜单
const roleNavItems = computed(() => {
  const role = userRole.value;
  if (role === 'teacher') {
    return [
      { name: '🧑‍🏫 教师工作台', path: '/teacher' },
      { name: '🎒 智慧学习台', path: '/student' },
      { name: '创建课程', path: '/course/create' },
    ];
  } else if (role === 'parent') {
    return [
      { name: '👪 家长监控台', path: '/parent' },
      { name: '💬 家校互动', path: '/tweets' },
    ];
  } else if (role === 'admin') {
    return [
      { name: '🧑‍🏫 教师工作台', path: '/teacher' },
      { name: '👪 家长监控台', path: '/parent' },
      { name: '🎒 学生学习台', path: '/student' },
    ];
  }
  // 如果是学生角色，不显示其他角色的工作台，避免混淆
  return [
    { name: '🎒 学生学习台', path: '/student' },
  ];
});

// 获取角色标签
const roleBadge = computed(() => {
  const badges = {
    teacher: { label: '老师', class: 'bg-purple-500/20 text-purple-300' },
    parent: { label: '家长', class: 'bg-green-500/20 text-green-300' },
    student: { label: '学生', class: 'bg-blue-500/20 text-blue-300' },
    admin: { label: '管理员', class: 'bg-red-500/20 text-red-300' },
  };
  return badges[userRole.value] || badges.student;
});

// 兼容移动端菜单
const navItems = computed(() => [...mainNavItems.value, ...roleNavItems.value]);

// 判断路由是否激活
const isActive = path => {
  if (path === '/') return route.path === '/' || route.path === '/home';
  return route.path.startsWith(path);
};

// 组件挂载时加载通知数据
const isScrolled = ref(false);
let rafId = null;
let lastScrollY = 0;
const handleScroll = () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    // 阈值10px，避免临界值附近频繁切换
    const newY = window.scrollY;
    if (Math.abs(newY - lastScrollY) > 2) {
      isScrolled.value = newY > 10;
      lastScrollY = newY;
    }
    rafId = null;
  });
};

onMounted(async () => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  // 从后端获取最新通知数据
  if (userStore.isLogin) {
    await notificationStore.fetchNotifications();
    console.log('通知数据加载成功，当前未读通知数量:', notificationStore.unreadNotificationsCount);
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
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

// 处理退出登录
const handleLogout = async () => {
  try {
    await userStore.logout();
    // 清除所有缓存并强制回到首页，彻底重置应用状态
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  } catch (error) {
    console.error('退出登录失败:', error);
    // 降级处理
    window.location.href = '/';
  }
};
</script>
