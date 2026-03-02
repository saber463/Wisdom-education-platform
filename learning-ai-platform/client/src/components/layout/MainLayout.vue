<template>
  <div class="flex flex-col min-h-screen bg-neutral dark:bg-tech-bg transition-colors duration-300">
    <!-- 头部导航 -->
    <header
      class="sticky top-0 z-50 glass shadow-lg transition-all duration-300 border-b border-white/10"
    >
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-20">
          <!-- Logo -->
          <router-link to="/" class="flex items-center space-x-3 group">
            <div class="relative">
              <div
                class="absolute inset-0 bg-gradient-to-br from-tech-blue to-tech-purple rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"
              />
              <div
                class="relative w-12 h-12 bg-gradient-to-br from-tech-blue to-tech-purple rounded-xl flex items-center justify-center shadow-neon-blue group-hover:scale-110 transition-transform duration-300"
              >
                <i class="fa fa-graduation-cap text-white text-2xl" />
              </div>
            </div>
            <div class="flex flex-col">
              <span
                class="font-bold text-xl text-dark dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-tech-blue group-hover:to-tech-purple transition-all duration-300"
                >AI 学习助手</span
              >
              <span class="text-xs text-gray-500 dark:text-gray-400">智能学习平台</span>
            </div>
          </router-link>

          <!-- 导航菜单（桌面端） -->
          <nav class="hidden md:flex items-center space-x-1">
            <router-link
              v-for="(item, index) in navItems"
              :key="index"
              :to="item.path"
              class="relative px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-300 group"
              :class="{
                'text-white font-medium bg-gradient-to-r from-tech-blue to-tech-purple shadow-neon-blue':
                  isActive(item.path),
              }"
            >
              {{ item.name }}
              <span
                class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-tech-blue to-tech-purple group-hover:w-3/4 transition-all duration-300"
                :class="{ 'w-3/4': isActive(item.path) }"
              />
              <div
                class="absolute inset-0 bg-gradient-to-r from-tech-blue to-tech-purple rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                :class="{ 'opacity-20': isActive(item.path) }"
              />
            </router-link>
          </nav>

          <!-- 用户菜单 -->
          <div class="flex items-center space-x-4">
            <div v-if="userStore.isLogin" class="flex items-center space-x-3">
              <!-- 消息通知图标 -->
              <DropdownMenu>
                <template #trigger>
                  <button
                    class="relative p-2.5 text-gray-700 dark:text-gray-300 hover:text-tech-blue transition-colors group"
                  >
                    <i
                      class="fa fa-bell text-xl group-hover:scale-110 transition-transform duration-300"
                    />
                    <span
                      v-if="notificationStore.unreadNotificationsCount > 0"
                      class="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-tech-pink to-tech-purple text-white text-xs rounded-full flex items-center justify-center shadow-neon-pink animate-pulse"
                    >
                      {{
                        notificationStore.unreadNotificationsCount > 99
                          ? '99+'
                          : notificationStore.unreadNotificationsCount
                      }}
                    </span>
                  </button>
                </template>
                <template #content>
                  <div
                    class="w-80 glass-card bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10"
                  >
                    <div
                      class="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gradient-to-r from-tech-blue/10 to-tech-purple/10"
                    >
                      <h3 class="font-bold text-dark dark:text-white flex items-center">
                        <i class="fa fa-bell mr-2 text-tech-blue" />消息通知
                      </h3>
                      <button
                        class="text-sm text-tech-blue hover:text-tech-purple transition-colors font-medium"
                        @click="notificationStore.markAllAsRead()"
                      >
                        全部已读
                      </button>
                    </div>
                    <div class="max-h-96 overflow-y-auto custom-scrollbar">
                      <div
                        v-if="
                          notificationStore.unreadNotifications.length === 0 &&
                          notificationStore.readNotifications.length === 0
                        "
                        class="p-8 text-center text-gray-500"
                      >
                        <div
                          class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-tech-blue/20 to-tech-purple/20 rounded-full flex items-center justify-center"
                        >
                          <i class="fa fa-inbox text-3xl text-tech-blue" />
                        </div>
                        <p class="text-sm">暂无消息通知</p>
                      </div>
                      <div v-else>
                        <div
                          v-if="notificationStore.unreadNotifications.length > 0"
                          class="border-b border-gray-200 dark:border-white/10"
                        >
                          <h4 class="p-3 text-xs font-bold text-tech-blue uppercase tracking-wider">
                            未读消息
                          </h4>
                          <div
                            v-for="notification in notificationStore.unreadNotifications"
                            :key="notification._id || notification.id"
                            class="p-4 hover:bg-gradient-to-r hover:from-tech-blue/5 hover:to-tech-purple/5 cursor-pointer border-t border-gray-100 dark:border-white/5 transition-all duration-300"
                            @click="handleNotificationClick(notification)"
                          >
                            <div class="flex items-start">
                              <div
                                class="w-2.5 h-2.5 bg-gradient-to-br from-tech-pink to-tech-purple rounded-full mt-2 mr-3 shadow-neon-pink"
                              />
                              <div class="flex-1">
                                <h5 class="font-semibold text-gray-900 dark:text-white">
                                  {{ notification.title }}
                                </h5>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {{ notification.content }}
                                </p>
                                <p class="text-xs text-gray-400 mt-2 flex items-center">
                                  <i class="fa fa-clock mr-1" />
                                  {{ new Date(notification.time).toLocaleString() }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-if="notificationStore.readNotifications.length > 0">
                          <h4 class="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            已读消息
                          </h4>
                          <div
                            v-for="notification in notificationStore.readNotifications"
                            :key="notification._id || notification.id"
                            class="p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-t border-gray-100 dark:border-white/5 transition-all duration-300"
                            @click="handleNotificationClick(notification)"
                          >
                            <div class="flex items-start">
                              <div class="w-2.5 h-2.5 bg-gray-300 rounded-full mt-2 mr-3" />
                              <div class="flex-1">
                                <h5 class="font-medium text-gray-900 dark:text-white">
                                  {{ notification.title }}
                                </h5>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {{ notification.content }}
                                </p>
                                <p class="text-xs text-gray-400 mt-2 flex items-center">
                                  <i class="fa fa-clock mr-1" />
                                  {{ new Date(notification.time).toLocaleString() }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="p-3 border-t border-gray-200 dark:border-white/10 text-center bg-gradient-to-r from-tech-blue/5 to-tech-purple/5"
                    >
                      <button
                        class="text-sm text-red-500 hover:text-red-600 transition-colors font-medium"
                        @click="notificationStore.clearAllNotifications()"
                      >
                        清空所有通知
                      </button>
                    </div>
                  </div>
                </template>
              </DropdownMenu>
              <router-link to="/user/profile" class="hidden md:block relative group">
                <div
                  class="absolute inset-0 bg-gradient-to-br from-tech-blue to-tech-purple rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                />
                <img
                  :src="userStore.userInfo.avatar"
                  alt="用户头像"
                  class="relative w-10 h-10 rounded-full object-cover border-2 border-white dark:border-white/20 group-hover:scale-110 transition-transform duration-300"
                />
              </router-link>
              <DropdownMenu>
                <template #trigger>
                  <button
                    class="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-tech-blue/10 hover:to-tech-purple/10 transition-all duration-300 group"
                  >
                    <span
                      class="hidden md:block font-medium text-gray-700 dark:text-gray-300 group-hover:text-tech-blue transition-colors"
                      >{{ userStore.userInfo.username }}</span
                    >
                    <i
                      class="fa fa-angle-down text-gray-500 group-hover:rotate-180 transition-transform duration-300"
                    />
                  </button>
                </template>
                <template #content>
                  <div
                    class="w-52 glass-card bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-2 border border-gray-100 dark:border-white/10"
                  >
                    <div class="px-3 py-2 mb-1 border-b border-gray-100 dark:border-white/5">
                      <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        用户菜单
                      </p>
                    </div>
                    <router-link
                      to="/user/center"
                      class="flex items-center px-4 py-2.5 hover:bg-gradient-to-r hover:from-tech-blue/10 hover:to-tech-purple/10 rounded-lg text-gray-700 dark:text-gray-200 transition-all duration-300 group"
                    >
                      <i
                        class="fa fa-user mr-3 text-tech-blue group-hover:scale-110 transition-transform"
                      />
                      <span>个人中心</span>
                    </router-link>
                    <router-link
                      to="/membership"
                      class="flex items-center px-4 py-2.5 hover:bg-gradient-to-r hover:from-tech-blue/10 hover:to-tech-purple/10 rounded-lg text-gray-700 dark:text-gray-200 transition-all duration-300 group"
                    >
                      <i
                        class="fa fa-crown mr-3 text-tech-purple group-hover:scale-110 transition-transform"
                      />
                      <span>会员中心</span>
                    </router-link>
                    <router-link
                      to="/user/browse-history"
                      class="flex items-center px-4 py-2.5 hover:bg-gradient-to-r hover:from-tech-blue/10 hover:to-tech-purple/10 rounded-lg text-gray-700 dark:text-gray-200 transition-all duration-300 group"
                    >
                      <i
                        class="fa fa-history mr-3 text-tech-green group-hover:scale-110 transition-transform"
                      />
                      <span>浏览历史</span>
                    </router-link>
                    <router-link
                      to="/learning-path/generate"
                      class="flex items-center px-4 py-2.5 hover:bg-gradient-to-r hover:from-tech-blue/10 hover:to-tech-purple/10 rounded-lg text-gray-700 dark:text-gray-200 transition-all duration-300 group"
                    >
                      <i
                        class="fa fa-road mr-3 text-tech-pink group-hover:scale-110 transition-transform"
                      />
                      <span>我的学习路径</span>
                    </router-link>
                    <div class="border-t border-gray-100 dark:border-white/5 my-1" />
                    <button
                      class="flex items-center w-full px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-all duration-300 group"
                      @click="userStore.logout()"
                    >
                      <i
                        class="fa fa-sign-out-alt mr-3 group-hover:scale-110 transition-transform"
                      />
                      <span>退出登录</span>
                    </button>
                  </div>
                </template>
              </DropdownMenu>
            </div>
            <div v-else class="flex space-x-3">
              <router-link to="/login" class="btn-secondary text-sm px-5 py-2.5 rounded-xl">
                登录
              </router-link>
              <router-link to="/register" class="btn-primary text-sm px-5 py-2.5 rounded-xl">
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
    <footer
      class="py-12 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden"
    >
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"
      />
      <div
        class="absolute top-0 left-1/4 w-96 h-96 bg-tech-blue rounded-full blur-[150px] opacity-10"
      />
      <div
        class="absolute bottom-0 right-1/4 w-80 h-80 bg-tech-purple rounded-full blur-[120px] opacity-10"
      />

      <div class="container mx-auto px-4 relative z-10">
        <div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-4">
              <div class="relative">
                <div
                  class="absolute inset-0 bg-gradient-to-br from-tech-blue to-tech-purple rounded-xl blur-lg opacity-30"
                />
                <div
                  class="relative w-12 h-12 bg-gradient-to-br from-tech-blue to-tech-purple rounded-xl flex items-center justify-center"
                >
                  <i class="fa fa-graduation-cap text-white text-2xl" />
                </div>
              </div>
              <div>
                <span class="font-bold text-xl">AI 学习助手</span>
                <p class="text-sm text-gray-400">智能学习平台</p>
              </div>
            </div>
            <p class="text-gray-400 text-sm leading-relaxed mb-4 max-w-md">
              基于先进 AI 算法，为你量身定制学习路径。整合全网优质资源，让每一次学习都事半功倍。
            </p>
            <div class="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 bg-white/10 hover:bg-gradient-to-r hover:from-tech-blue hover:to-tech-purple rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-neon-blue group"
              >
                <i class="fab fa-github text-lg group-hover:text-white" />
              </a>
              <a
                href="https://weixin.qq.com"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 bg-white/10 hover:bg-gradient-to-r hover:from-tech-blue hover:to-tech-purple rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-neon-blue group"
              >
                <i class="fab fa-weixin text-lg group-hover:text-white" />
              </a>
              <a
                href="https://weibo.com"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 bg-white/10 hover:bg-gradient-to-r hover:from-tech-blue hover:to-tech-purple rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-neon-blue group"
              >
                <i class="fab fa-weibo text-lg group-hover:text-white" />
              </a>
            </div>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-lg mb-4 flex items-center">
              <i class="fa fa-link mr-2 text-tech-blue" />快速链接
            </h4>
            <ul class="space-y-2">
              <li>
                <router-link
                  to="/"
                  class="text-gray-400 hover:text-tech-blue transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />首页
                </router-link>
              </li>
              <li>
                <router-link
                  to="/learning-path/generate"
                  class="text-gray-400 hover:text-tech-blue transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />AI 学习路径
                </router-link>
              </li>
              <li>
                <router-link
                  to="/assessment/tests"
                  class="text-gray-400 hover:text-tech-blue transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />学习评估
                </router-link>
              </li>
              <li>
                <router-link
                  to="/knowledge-base"
                  class="text-gray-400 hover:text-tech-blue transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />知识库
                </router-link>
              </li>
            </ul>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-lg mb-4 flex items-center">
              <i class="fa fa-info-circle mr-2 text-tech-purple" />关于我们
            </h4>
            <ul class="space-y-2">
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-tech-purple transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />关于平台
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-tech-purple transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />使用条款
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-tech-purple transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />隐私政策
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-tech-purple transition-colors flex items-center group"
                >
                  <i
                    class="fa fa-angle-right mr-2 text-xs group-hover:translate-x-1 transition-transform"
                  />联系我们
                </a>
              </li>
            </ul>
          </div>

          <div class="flex-1">
            <h4 class="font-bold text-lg mb-4 flex items-center">
              <i class="fa fa-envelope mr-2 text-tech-pink" />订阅更新
            </h4>
            <p class="text-gray-400 text-sm mb-4">
              订阅我们的新闻通讯，获取最新学习资源和平台更新。
            </p>
            <div class="flex gap-2">
              <input
                type="email"
                placeholder="输入您的邮箱"
                class="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 transition-all duration-300"
              />
              <button
                class="px-5 py-2.5 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-medium rounded-xl hover:shadow-neon-blue transition-all duration-300 hover:scale-105 active:scale-95"
              >
                订阅
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-white/10 pt-8">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-400 text-sm text-center md:text-left">
              © 2025 AI 学习助手 - AI Web 比赛项目 | 保留所有权利
            </p>
            <div class="flex items-center space-x-6 text-sm text-gray-400">
              <span class="flex items-center">
                <i class="fa fa-users mr-2 text-tech-blue" />
                10K+ 活跃用户
              </span>
              <span class="flex items-center">
                <i class="fa fa-graduation-cap mr-2 text-tech-purple" />
                500+ 学习路径
              </span>
              <span class="flex items-center">
                <i class="fa fa-star mr-2 text-tech-pink" />
                98% 满意度
              </span>
            </div>
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

// 导航菜单配置
const navItems = [
  { name: '首页', path: '/' },
  { name: '学习社区', path: '/tweets' },
  { name: 'AI 学习路径', path: '/learning-path/generate' },
  // 移除在线代码生成器功能
  // { name: '在线代码生成器', path: '/learning/code-generator' },
  // { name: '题库系统', path: '/question-bank' },
  { name: '学习评估', path: '/assessment/tests' },
  // { name: '错题本', path: '/wrong-questions' },
  { name: '知识库', path: '/knowledge-base' },
  { name: '个人中心', path: '/user/center' },
];

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
