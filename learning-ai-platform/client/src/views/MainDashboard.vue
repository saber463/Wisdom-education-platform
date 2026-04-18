<template>
  <div class="main-dashboard min-h-screen pb-12" style="background: #f9fafb;">
    <!-- 背景装饰 -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-100/30 blur-3xl" />
      <div class="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-indigo-100/30 blur-3xl" />
    </div>

    <div class="relative z-10 pt-4">
      <!-- 主内容区 -->
      <div class="container mx-auto px-4 sm:px-6">

        <!-- 欢迎横幅 -->
            <section class="relative rounded-2xl md:rounded-3xl overflow-hidden mb-8 p-6 md:p-10 lg:p-12"
                     :style="{ background: isParent ? 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 50%, #fffbeb 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f5f3ff 100%)', border: isParent ? '1px solid rgba(245,158,11,0.1)' : '1px solid rgba(59,130,246,0.1)' }">
          <div class="relative z-10 max-w-2xl">
            <div class="flex items-center gap-2 mb-3">
              <span class="inline-block w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></span>
              <span class="text-xs font-medium tracking-wide uppercase text-blue-600">Dashboard</span>
            </div>
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              👋 欢迎回来，<span class="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">{{ userName }}</span><span class="animate-wave inline-block origin-bottom-right ml-0.5">👋</span>
            </h1>
            <p class="text-base md:text-lg mb-7 leading-relaxed text-gray-500">
              {{ welcomeMessage }}
            </p>

            <!-- 快捷操作按钮组 -->
            <div class="flex flex-wrap gap-3">
              <router-link
                :to="primaryAction.path"
                class="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                :style="{ background: isParent ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: isParent ? '0 4px 16px rgba(245,158,11,0.3)' : '0 4px 16px rgba(59,130,246,0.3)' }"
              >
                <i :class="'fa ' + primaryAction.icon + ' text-sm'"></i>
                {{ primaryAction.label }}
              </router-link>
              <router-link
                v-for="(action, idx) in quickActions"
                :key="action.path"
                :to="action.path"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-gray-600 font-medium rounded-xl border transition-all duration-200 hover:bg-white hover:border-blue-200 hover:text-blue-600 active:scale-[0.98]"
                style="border-color: rgba(0,0,0,0.08); background: white;"
              >
                <i :class="'fa ' + action.icon + ' text-sm text-gray-400'"></i>
                <span class="hidden sm:inline">{{ action.label }}</span>
              </router-link>
            </div>
          </div>

          <!-- 右侧装饰图（桌面端） -->
          <div class="hidden lg:block absolute right-8 bottom-4 w-48 h-36 rounded-2xl opacity-80"
               style="background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05)); border: 1px solid rgba(99,102,241,0.08);">
            <div class="w-full h-full flex items-center justify-center">
              <i class="fa fa-lightbulb-o text-5xl text-indigo-200"></i>
            </div>
          </div>
        </section>

        <!-- 主内容网格 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          <!-- ====== 左侧主内容区 ====== -->
          <div class="lg:col-span-2 space-y-6">

            <!-- 功能卡片网格 -->
            <section>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <router-link
                  v-for="(card, idx) in roleCards"
                  :key="card.path"
                  :to="card.path"
                  class="group relative p-5 md:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                  :style="{ background: card.bgGradient, borderColor: card.borderColor }"
                >
                  <!-- 悬停光效 -->
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div class="flex items-start gap-4 relative z-10">
                    <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                         :style="{ background: card.iconBg, boxShadow: `0 8px 24px ${card.shadowColor}40` }">
                      <i :class="'fa ' + (card.icon.startsWith('fa-') ? card.icon : 'fa-' + card.icon) + ' text-white'" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2))"></i>
                    </div>
                    <div class="flex-1 min-w-0 pt-0.5">
                      <h3 class="text-base md:text-lg font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-all duration-300">
                        {{ card.title }}
                      </h3>
                      <p class="text-xs md:text-sm leading-relaxed line-clamp-2 text-gray-500">
                        {{ card.description }}
                      </p>
                    </div>
                    <i class="fa fa-chevron-right text-sm mt-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style="color: var(--accent)"></i>
                  </div>
                </router-link>
              </div>
            </section>

            <!-- 最近学习路径 -->
            <section v-if="recentPaths.length > 0 && !isParent"
                     class="rounded-2xl p-5 md:p-6 border bg-white"
                     style="border-color: rgba(0,0,0,0.06);">
              <div class="flex justify-between items-center mb-5">
                <h2 class="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50">
                    <i class="fa fa-road text-sm text-indigo-500"></i>
                  </div>
                  最近学习路径
                </h2>
                <router-link to="/learning-path/generate"
                             class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100">
                  生成新路径 →
                </router-link>
              </div>

              <div class="space-y-3">
                <div v-for="path in recentPaths" :key="path.id"
                     @click="router.push(`/learning-path/${path.id}`)"
                     class="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:bg-gray-50 hover:shadow-md cursor-pointer"
                     style="border-color: rgba(0,0,0,0.04);">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                       style="background: linear-gradient(135deg, #3b82f6, #6366f1);">
                    {{ path.subject }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">{{ path.title }}</h4>
                    <div class="flex items-center gap-3 mt-1.5">
                      <span class="text-[11px] flex items-center gap-1 text-gray-400">
                        <i class="fa fa-clock-o text-[10px]"></i>{{ path.duration }}
                      </span>
                      <span class="text-[11px] flex items-center gap-1 text-gray-400">
                        <i class="fa fa-book text-[10px]"></i>{{ path.courses }} 课程
                      </span>
                      <span class="text-[11px] flex items-center gap-1 text-gray-400">
                        <i class="fa fa-road text-[10px]"></i>{{ path.progress }}%
                      </span>
                    </div>
                  </div>
                  <router-link :to="'/learning-path/' + path.id" class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-md shrink-0 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100">
                    继续
                  </router-link>
                </div>
              </div>
            </section>
          </div>

          <!-- ====== 右侧信息面板 ====== -->
          <div class="space-y-5">

            <!-- 今日任务 -->
            <section v-if="!isParent"
                     class="rounded-2xl p-5 md:p-6 border bg-white"
                     style="border-color: rgba(0,0,0,0.06);">
              <h2 class="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                  <i class="fa fa-tasks text-sm text-blue-500"></i>
                </div>
                今日任务
              </h2>
              <ul class="space-y-3">
                <li v-for="task in todayTasks" :key="task.id" class="flex items-start gap-3 group/task">
                  <button @click="task.completed = !task.completed"
                          class="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                          :class="task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-400'"
                          :aria-label="task.completed ? '标记为未完成' : '标记为已完成'">
                    <svg v-if="task.completed" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </button>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm leading-relaxed transition-all duration-200" :class="task.completed ? 'line-through text-gray-400' : 'text-gray-700'">{{ task.title }}</p>
                    <p class="text-[11px] mt-0.5 text-gray-400">{{ task.time }}</p>
                  </div>
                </li>
              </ul>
            </section>

            <!-- 学习统计 -->
            <article v-if="!isParent" class="rounded-2xl p-5 border bg-white"
                     style="border-color: rgba(0,0,0,0.06);">
              <h2 class="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50">
                  <i class="fa fa-bar-chart text-sm text-indigo-500"></i>
                </div>
                学习统计
              </h2>
              <div class="grid grid-cols-1 gap-3">
                <div v-for="stat in learningStats" :key="stat.label"
                     class="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-gray-50">
                  <span class="text-xs font-medium text-gray-400">{{ stat.label }}</span>
                  <span class="text-base font-bold tabular-nums" :style="{ color: stat.color || '#111827' }">{{ stat.value }}</span>
                </div>
              </div>
              <div class="mt-5 pt-4 border-t border-gray-100">
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="text-gray-400">本周目标完成度</span>
                  <span class="font-semibold text-green-500">72%</span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden bg-gray-100">
                  <div class="h-full rounded-full transition-all duration-700" style="width: 72%; background: linear-gradient(90deg, #22c55e, #4ade80);"></div>
                </div>
              </div>
            </article>

            <!-- 推荐课程 -->
            <article class="rounded-2xl p-5 border bg-white"
                     style="border-color: rgba(0,0,0,0.06);">
              <h2 class="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50">
                  <i class="fa fa-star text-sm text-amber-500"></i>
                </div>
                推荐课程
              </h2>
              <div class="space-y-2.5">
                <router-link
                  v-for="course in recommendedCourses"
                  :key="course.id"
                  :to="course.isVIP ? '/vip-courses' : '/courses'"
                  class="flex items-center gap-3 p-2.5 -mx-1 rounded-xl transition-all duration-200 group/course hover:bg-gray-50"
                >
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover/course:from-tech-blue/50 group-hover/course:to-tech-purple/50"
                       :style="{ background: course.isVIP ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))' : 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))', border: `1px solid ${course.isVIP ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.1)'}` }">
                    <i :class="'fa ' + (course.icon.startsWith('fa-') ? course.icon : 'fa-' + course.icon) + ' text-sm'" :style="{ color: course.isVIP ? '#fbbf24' : '#818cf8' }"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-700 truncate group-hover/course:text-blue-600 transition-colors">{{ course.title }}</p>
                    <p class="text-[11px] mt-0.5 text-gray-400">{{ course.students }} 学员</p>
                  </div>
                  <span v-if="course.isVIP"
                        class="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
                        style="background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2);">
                    VIP
                  </span>
                  <i class="fa fa-chevron-right text-[10px] opacity-0 group-hover/course:opacity-50 transition-opacity shrink-0" style="color: var(--accent)"></i>
                </router-link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

// ─── 挂载时重定向 ───────────────────
onMounted(() => {
  const role = userRole.value;
  console.log('MainDashboard 已挂载，当前角色:', role);
  
  if (role === 'parent') {
    window.location.href = '/parent';
  } else if (role === 'teacher') {
    window.location.href = '/teacher';
  } else {
    // 学生角色或默认，保留在此页面
  }
});

// ─── 用户数据 ────────────────────────
const userName = computed(() => userStore.userInfo?.username || '用户');
const userEmail = computed(() => userStore.userInfo?.email || '');

// 获取用户角色
const userRole = computed(() => userStore.userRole);

const isParent = computed(() => userRole.value === 'parent');

const homePath = computed(() => {
  const role = userRole.value;
  if (role === 'teacher') return '/teacher';
  if (role === 'parent') return '/parent';
  return '/student';
});

const roleLabel = computed(() => ({
  student: '🎓 学生',
  teacher: '👨‍🏫 教师',
  parent: '👨‍👩‍👧 家长',
})[userRole.value]);

// 欢迎文案
const welcomeMessage = computed(() => {
  const messages = {
    student: '准备好开始今天的学习了吗？让我们一起探索知识的海洋！',
    teacher: '欢迎回到教师工作台，您可以在此管理学生和课程。',
    parent: '您可以在此查看孩子的学习进度和表现。',
  };
  return messages[userRole.value] || '欢迎来到智学AI，开启您的智慧学习之旅！';
});

// 主要行动按钮
const primaryAction = computed(() => {
  const actions = {
    student: { path: '/learning-path/generate', label: '生成学习路径', icon: 'fa-magic' },
    teacher: { path: '/teacher', label: '管理工作台', icon: 'fa-chalkboard-teacher' },
    parent:  { path: '/parent', label: '查看监控台', icon: 'fa-eye' },
  };
  return actions[userRole.value] || { path: '/home', label: '进入首页', icon: 'fa-home' };
});

// 快捷操作
const quickActions = computed(() => {
  const actions = {
    student: [
      { path: '/assessment/tests',   label: '学习评估', icon: 'fa-clipboard-check' },
      { path: '/knowledge-base',     label: '知识库',   icon: 'fa-book-open' },
      { path: '/courses',           label: '全部课程', icon: 'fa-play-circle' },
    ],
    teacher: [
      { path: '/groups',            label: '我的班级', icon: 'fa-users' },
      { path: '/course/create',     label: '创建课程', icon: 'fa-plus-square' },
      { path: '/assessment/tests',  label: '查看评估', icon: 'fa-clipboard-check' },
    ],
    parent: [
      { path: '/parent',             label: '孩子监控', icon: 'fa-child' },
      { path: '/tweets',             label: '家校互动', icon: 'fa-comments' },
      { path: '/assessment/analysis', label: '学习报告', icon: 'fa-chart-bar' },
      { path: '/star-teachers',      label: '寻找导师', icon: 'fa-star' },
    ],
  };
  return actions[userRole.value] || [];
});

// ─── 功能卡片（带增强样式） ───────────
const roleCards = computed(() => {
  const cardStyle = {
    student: [
      { title: '我的课程', description: '查看和管理已购买的课程，跟踪学习进度',     path: '/courses',               icon: 'fa-video-camera',
        bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(37,99,235,0.06) 100%)',
        borderColor: 'rgba(59,130,246,0.12)',
        iconBg: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadowColor: '#3b82f6' },
      { title: '学习路径', description: 'AI 生成的个性化学习路线，科学规划每一步',       path: '/learning-path/generate', icon: 'fa-road',
        bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(124,58,237,0.06) 100%)',
        borderColor: 'rgba(139,92,246,0.12)',
        iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadowColor: '#8b5cf6' },
      { title: '作业中心', description: '查看和完成作业任务，按时提交不遗漏',           path: '/homework',              icon: 'fa-file-lines',
        bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(219,39,119,0.06) 100%)',
        borderColor: 'rgba(236,72,153,0.12)',
        iconBg: 'linear-gradient(135deg, #ec4899, #db2777)', shadowColor: '#ec4899' },
      { title: '学习报告', description: '查看学习进度、成绩分析与能力雷达图',           path: '/assessment/analysis',   icon: 'fa-chart-pie',
        bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
        borderColor: 'rgba(16,185,129,0.12)',
        iconBg: 'linear-gradient(135deg, #10b981, #059669)', shadowColor: '#10b981' },
    ],
    teacher: [
      { title: '班级管理', description: '管理学生和查看班级信息与出勤情况',           path: '/groups',                icon: 'fa-users',
        bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(37,99,235,0.06) 100%)',
        borderColor: 'rgba(59,130,246,0.12)',
        iconBg: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadowColor: '#3b82f6' },
      { title: '作业布置', description: '创建和布置作业任务并自动批改',                path: '/homework/create',        icon: 'fa-pen-to-square',
        bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(124,58,237,0.06) 100%)',
        borderColor: 'rgba(139,92,246,0.12)',
        iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadowColor: '#8b5cf6' },
      { title: '学生评估', description: '查看和评估学生学习情况与成长轨迹',           path: '/assessment/tests',       icon: 'fa-clipboard-check',
        bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(219,39,119,0.06) 100%)',
        borderColor: 'rgba(236,72,153,0.12)',
        iconBg: 'linear-gradient(135deg, #ec4899, #db2777)', shadowColor: '#ec4899' },
      { title: '明星师资', description: '查看平台明星老师介绍与教学成果',              path: '/star-teachers',          icon: 'fa-star',
        bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 100%)',
        borderColor: 'rgba(245,158,11,0.12)',
        iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadowColor: '#f59e0b' },
    ],
    parent: [
      { title: '孩子监控台', description: '全方位了解孩子的学习动态、出勤情况和表现评价',      path: '/parent',                icon: 'fa-eye',
        bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(37,99,235,0.06) 100%)',
        borderColor: 'rgba(59,130,246,0.12)',
        iconBg: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadowColor: '#3b82f6' },
      { title: '成长分析', description: '深度解析孩子的学习报告，发现潜能与薄弱环节',           path: '/assessment/analysis',   icon: 'fa-chart-line',
        bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
        borderColor: 'rgba(16,185,129,0.12)',
        iconBg: 'linear-gradient(135deg, #10b981, #059669)', shadowColor: '#10b981' },
      { title: '家校互通', description: '直接与老师沟通，获取第一手教学反馈和建议',             path: '/tweets',                icon: 'fa-comments',
        bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(124,58,237,0.06) 100%)',
        borderColor: 'rgba(139,92,246,0.12)',
        iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadowColor: '#8b5cf6' },
      { title: '明星导师', description: '为孩子挑选最合适的资深导师进行 1 对 1 指导',         path: '/star-teachers',          icon: 'fa-star',
        bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 100%)',
        borderColor: 'rgba(245,158,11,0.12)',
        iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadowColor: '#f59e0b' },
    ],
  };
  return cardStyle[userRole.value];
});

// ─── 模拟数据 ────────────────────────
const recentPaths = ref([
  { id: 1, title: 'Python 全栈开发学习路径', subject: 'Py', duration: '8 周', courses: 24, progress: 35 },
  { id: 2, title: '前端工程师成长路径',       subject: 'FE', duration: '12 周', courses: 36, progress: 12 },
]);

const todayTasks = ref([
  { id: 1, title: '完成 Python 基础第一章练习', time: '今天 14:00', completed: false },
  { id: 2, title: '复习 React Hooks 相关知识点', time: '今天 16:00', completed: true },
  { id: 3, title: '完成算法作业第三题',         time: '今天 20:00', completed: false },
]);

const learningStats = ref([
  { label: '累计学习', value: '126 小时', color: '#60a5fa' },
  { label: '完成课程', value: '8 个',     color: '#a78bfa' },
  { label: '获得证书', value: '3 张',     color: '#34d399' },
  { label: '连续打卡', value: '12 天',    color: '#fbbf24' },
]);

const recommendedCourses = ref([
  { id: 1, title: 'Vue3 企业级实战',   icon: 'fa-vuejs',     students: 3200, isVIP: true },
  { id: 2, title: 'TypeScript 进阶指南',icon: 'fa-code',      students: 2800, isVIP: false },
  { id: 3, title: '微服务架构设计',     icon: 'fa-server',    students: 1500, isVIP: true },
]);

// ─── 方法 ────────────────────────────
const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.main-dashboard {
  min-height: 100vh;
}

/* 手势动画 */
@keyframes wave {
  0%   { transform: rotate(0deg); }
  10%  { transform: rotate(14deg); }
  20%  { transform: rotate(-8deg); }
  30%  { transform: rotate(14deg); }
  40%  { transform: rotate(-4deg); }
  50%  { transform: rotate(10deg); }
  60%  { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
.animate-wave {
  animation: wave 2.5s ease-in-out infinite;
  animation-delay: 0.5s;
  transform-origin: 70% 70%;
}

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 任务复选框交互 */
.group\/task:hover button {
  border-color: #3b82f6 !important;
}
</style>
