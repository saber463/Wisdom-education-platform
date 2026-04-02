<template>
  <div class="page-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-text">
          EduAI
        </div>
        <div class="sidebar-logo-sub">
          智慧教育平台 V2.0
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-title">
          学习中心
        </div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="sidebar-item"
          :class="{ active: $route.path === item.path }"
        >
          <component
            :is="item.icon"
            class="nav-icon"
          />
          <span>{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto badge badge-cyan text-xs"
          >{{ item.badge }}</span>
        </router-link>

        <div class="sidebar-section-title">
          工具
        </div>
        <router-link
          to="/student/code-editor"
          class="sidebar-item"
          :class="{ active: $route.path === '/student/code-editor' }"
        >
          <CodeBracketIcon class="nav-icon" />
          <span>代码编辑器</span>
          <span class="ml-auto badge badge-violet text-xs">AI</span>
        </router-link>
        <router-link
          to="/student/community"
          class="sidebar-item"
          :class="{ active: $route.path === '/student/community' }"
        >
          <FireIcon class="nav-icon" />
          <span>热点社区</span>
        </router-link>

        <div class="sidebar-section-title">
          账户
        </div>
        <div
          class="sidebar-item"
          style="cursor:pointer"
          @click="handleLogout"
        >
          <ArrowLeftOnRectangleIcon class="nav-icon" />
          <span>退出登录</span>
        </div>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-title">
          学习工作台
        </div>
        <div class="topbar-right">
          <div
            class="relative"
            style="cursor:pointer"
          >
            <BellIcon style="width:20px;height:20px;color:#64748b" />
            <span
              v-if="notifications > 0"
              style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:#ef4444;color:white;font-size:10px;border-radius:50%;display:flex;align-items:center;justify-content:center"
            >{{ notifications }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;background:var(--gradient-primary)">
              {{ userInitial }}
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#0f172a">
                {{ userName }}
              </div>
              <div style="font-size:12px;color:#94a3b8">
                学生
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="page-container">
        <!-- Hero 欢迎区 -->
        <div
          class="hero-gradient"
          style="position:relative"
        >
          <div style="position:relative;z-index:1">
            <div class="hero-greeting">
              {{ greeting }}，{{ userName }} 👋
            </div>
            <div class="hero-subtitle">
              {{ todaySummary }}
            </div>
            <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
              <button
                class="btn-primary"
                @click="$router.push('/student/code-editor')"
              >
                <CodeBracketIcon style="width:16px;height:16px" />
                开始编程练习
              </button>
              <button
                style="background:transparent;border:1.5px solid rgba(255,255,255,0.3);color:white;border-radius:10px;padding:8px 18px;font-size:13px;cursor:pointer"
                @click="$router.push('/student/courses')"
              >
                继续上次学习
              </button>
            </div>
          </div>
          <div style="position:absolute;top:16px;right:32px;width:140px;height:140px;border-radius:50%;background:var(--gradient-primary);opacity:0.15;pointer-events:none" />
        </div>

        <!-- 统计数据面板 -->
        <div class="stat-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-card"
          >
            <div
              class="stat-icon-bg"
              :style="{ background: stat.bgColor }"
            >
              <component
                :is="stat.icon"
                style="width:20px;height:20px"
                :style="{ color: stat.color }"
              />
            </div>
            <div class="stat-card-label">
              {{ stat.label }}
            </div>
            <div class="stat-card-value">
              {{ stat.value }}
            </div>
            <div class="stat-card-trend">
              <component
                :is="stat.trend > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon"
                style="width:12px;height:12px"
                :class="stat.trend > 0 ? 'trend-up' : 'trend-down'"
              />
              <span :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">{{ Math.abs(stat.trend) }}% 较上周</span>
            </div>
          </div>
        </div>

        <!-- 主网格 -->
        <div style="display:grid;grid-template-columns:1fr 380px;gap:20px">
          <!-- 左列 -->
          <div style="display:flex;flex-direction:column;gap:20px">
            <!-- 学习趋势图 -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  学习专注度趋势
                </div>
                <div style="display:flex;gap:8px">
                  <button
                    v-for="p in ['7天', '30天']"
                    :key="p"
                    style="font-size:12px;padding:4px 12px;border-radius:20px;border:none;cursor:pointer;transition:all 0.2s"
                    :style="trendPeriod === p ? 'background:rgba(6,182,212,0.12);color:#0891b2;font-weight:600' : 'background:transparent;color:#94a3b8'"
                    @click="trendPeriod = p"
                  >
                    {{ p }}
                  </button>
                </div>
              </div>
              <div
                class="card-body"
                style="padding-top:8px"
              >
                <div
                  ref="trendChart"
                  style="height:220px"
                />
              </div>
            </div>

            <!-- AI推荐课程 -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  <span
                    class="badge badge-violet"
                    style="margin-right:8px"
                  >AI推荐</span>
                  为你精选的课程
                </div>
                <button
                  class="btn-ghost"
                  style="font-size:13px;padding:6px 14px"
                  @click="$router.push('/student/courses')"
                >
                  查看全部
                </button>
              </div>
              <div class="card-body">
                <div
                  v-if="loadingCourses"
                  style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"
                >
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="skeleton"
                    style="height:176px;border-radius:12px"
                  />
                </div>
                <div
                  v-else
                  style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"
                >
                  <div
                    v-for="course in recommendedCourses"
                    :key="course.id"
                    class="course-card"
                    @click="$router.push(`/student/courses/${course.id}`)"
                  >
                    <div
                      class="course-card-cover"
                      :style="{ background: course.gradient }"
                    >
                      <span style="font-size:44px">{{ course.emoji }}</span>
                      <span
                        class="badge"
                        style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.2);color:white;font-size:10px"
                      >{{ course.difficulty }}</span>
                    </div>
                    <div class="course-card-body">
                      <div class="course-card-title">
                        {{ course.title }}
                      </div>
                      <div class="course-card-meta">
                        <span>{{ course.lessonCount }}课时</span>
                        <span>·</span>
                        <span>{{ course.studentCount }}人</span>
                      </div>
                      <div class="course-progress-bar">
                        <div
                          class="course-progress-fill"
                          :style="{ width: `${course.progress}%` }"
                        />
                      </div>
                      <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-top:4px">
                        <span>{{ course.progress }}%</span>
                        <span style="color:#0891b2;font-weight:500">继续 →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 代码编辑器快捷入口 -->
            <div
              class="content-card"
              style="background:linear-gradient(145deg,#0f172a 0%,#1e1b4b 100%);border-color:rgba(139,92,246,0.2);cursor:pointer"
              @click="$router.push('/student/code-editor')"
            >
              <div class="card-body">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <div>
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                      <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center">
                        <CodeBracketIcon style="width:22px;height:22px;color:#a78bfa" />
                      </div>
                      <div>
                        <div style="color:white;font-weight:600;font-size:15px">
                          AI代码分析 + 流程图生成
                        </div>
                        <div style="color:#94a3b8;font-size:12px;margin-top:2px">
                          粘贴代码 → 一键生成程序执行流程图
                        </div>
                      </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                      <span
                        v-for="lang in ['Python', 'Java', 'C/C++', 'JavaScript']"
                        :key="lang"
                        class="badge"
                        style="background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);font-size:11px"
                      >{{ lang }}</span>
                    </div>
                  </div>
                  <div style="width:56px;height:56px;border-radius:16px;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;opacity:0.8">
                    <ArrowRightIcon style="width:24px;height:24px;color:white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右列 -->
          <div style="display:flex;flex-direction:column;gap:20px">
            <!-- 知识掌握度 -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  知识掌握度
                </div>
              </div>
              <div class="card-body">
                <div
                  ref="radarChart"
                  style="height:190px"
                />
                <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
                  <div
                    v-for="kp in knowledgePoints"
                    :key="kp.name"
                    style="display:flex;align-items:center;gap:10px"
                  >
                    <div style="font-size:12px;color:#64748b;width:72px;flex-shrink:0">
                      {{ kp.name }}
                    </div>
                    <div style="flex:1;height:5px;background:#f1f5f9;border-radius:3px;overflow:hidden">
                      <div
                        style="height:100%;border-radius:3px;transition:width 0.7s ease"
                        :style="{ width: `${kp.value}%`, background: kp.color }"
                      />
                    </div>
                    <div
                      style="font-size:12px;font-weight:700;width:32px;text-align:right"
                      :style="{ color: kp.color }"
                    >
                      {{ kp.value }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI教育热点 -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  <FireIcon style="width:16px;height:16px;color:#f97316;display:inline;margin-right:4px" />
                  教育热点
                </div>
                <button
                  class="btn-ghost"
                  style="font-size:13px;padding:5px 12px"
                  @click="$router.push('/student/community')"
                >
                  更多
                </button>
              </div>
              <div
                class="card-body"
                style="padding-top:8px;display:flex;flex-direction:column;gap:8px"
              >
                <div
                  v-for="(hot, idx) in hotTopics"
                  :key="hot.id"
                  class="hot-card"
                  @click="$router.push(`/student/community`)"
                >
                  <div
                    class="hot-rank"
                    :class="idx === 0 ? 'hot-rank-1' : idx === 1 ? 'hot-rank-2' : idx === 2 ? 'hot-rank-3' : 'hot-rank-n'"
                  >
                    {{ idx + 1 }}
                  </div>
                  <div>
                    <div class="hot-title">
                      {{ hot.title }}
                    </div>
                    <div class="hot-meta">
                      <span
                        class="badge badge-cyan"
                        style="font-size:10px"
                      >{{ hot.category }}</span>
                      <span>{{ hot.heat }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI错题推送 -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  <SparklesIcon style="width:16px;height:16px;color:#8b5cf6;display:inline;margin-right:4px" />
                  AI推送待复习
                </div>
              </div>
              <div
                class="card-body"
                style="padding-top:8px;display:flex;flex-direction:column;gap:10px"
              >
                <div
                  v-for="wq in wrongQuestions"
                  :key="wq.id"
                  style="display:flex;gap:10px;padding:12px;border-radius:12px;background:#f8fafc;cursor:pointer;transition:background 0.2s"
                  @click="$router.push('/student/wrong-book')"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background='rgba(0,212,255,0.08)'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='#f8fafc'"
                >
                  <div
                    style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px"
                    :style="wq.type === 'predicted' ? 'background:#ede9fe;color:#7c3aed' : 'background:#fee2e2;color:#dc2626'"
                  >
                    {{ wq.type === 'predicted' ? '🔮' : '✗' }}
                  </div>
                  <div>
                    <div style="font-size:13px;font-weight:500;color:#1e293b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5">
                      {{ wq.title }}
                    </div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px">
                      错误率 {{ wq.errorRate }}% · {{ wq.tag }}
                    </div>
                  </div>
                </div>
                <button
                  style="width:100%;text-align:center;font-size:13px;color:#0891b2;font-weight:500;padding:8px;background:none;border:none;cursor:pointer"
                  @click="$router.push('/student/wrong-book')"
                >
                  查看全部错题本 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'
import {
  HomeIcon, BookOpenIcon, AcademicCapIcon, ChartBarIcon, SparklesIcon,
  BellIcon, FireIcon, CodeBracketIcon, ArrowLeftOnRectangleIcon, ArrowRightIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, DocumentTextIcon, ClipboardDocumentCheckIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const userName = computed(() => (userStore.userInfo as any)?.name || '同学')
const userInitial = computed(() => userName.value.charAt(0))
const notifications = ref(3)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，注意休息'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const todaySummary = ref('今天已学习 45 分钟，继续加油完成今日目标！')

const navItems = [
  { path: '/student/dashboard', label: '学习概览', icon: HomeIcon, badge: null },
  { path: '/student/courses', label: '课程中心', icon: BookOpenIcon, badge: null },
  { path: '/student/assignments', label: '我的作业', icon: DocumentTextIcon, badge: '3' },
  { path: '/student/wrong-book', label: '错题本', icon: SparklesIcon, badge: null },
  { path: '/student/knowledge-portrait', label: '知识图谱', icon: ChartBarIcon, badge: null },
]

const stats = ref([
  { label: '今日学习时长(分)', value: '45', icon: BookOpenIcon, color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)', trend: 12 },
  { label: '本周完成作业', value: '8', icon: ClipboardDocumentCheckIcon, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', trend: 5 },
  { label: '平均正确率', value: '86%', icon: ChartBarIcon, color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', trend: 3 },
  { label: '待复习错题', value: '12', icon: SparklesIcon, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', trend: -8 },
])

const trendChart = ref<HTMLDivElement>()
const trendPeriod = ref('7天')
let trendEchart: echarts.ECharts | null = null

function initTrendChart() {
  if (!trendChart.value) return
  trendEchart?.dispose()
  trendEchart = echarts.init(trendChart.value)
  const days = trendPeriod.value === '7天'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  const focusData = days.map(() => Math.floor(Math.random() * 60 + 40))
  const scoreData = days.map(() => Math.floor(Math.random() * 30 + 60))
  trendEchart.setOption({
    grid: { top: 20, right: 10, bottom: 20, left: 40 },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0, data: ['专注度', '正确率'], textStyle: { fontSize: 11, color: '#606060' } },
    xAxis: { type: 'category', data: days, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#606060', fontSize: 10 } },
    yAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: '#606060', fontSize: 10 } },
    series: [
      { name: '专注度', type: 'line', smooth: true, data: focusData, lineStyle: { color: '#06b6d4', width: 2.5 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.25)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } }, symbol: 'none' },
      { name: '正确率', type: 'line', smooth: true, data: scoreData, lineStyle: { color: '#8b5cf6', width: 2.5 }, itemStyle: { color: '#8b5cf6' }, symbol: 'none' },
    ],
  })
}

watch(trendPeriod, () => nextTick(initTrendChart))

const radarChart = ref<HTMLDivElement>()
let radarEchart: echarts.ECharts | null = null

const knowledgePoints = ref([
  { name: '数据结构', value: 82, color: '#06b6d4' },
  { name: '算法设计', value: 65, color: '#8b5cf6' },
  { name: '面向对象', value: 91, color: '#10b981' },
  { name: '数据库', value: 74, color: '#f59e0b' },
  { name: '网络基础', value: 58, color: '#f43f5e' },
])

function initRadarChart() {
  if (!radarChart.value) return
  radarEchart?.dispose()
  radarEchart = echarts.init(radarChart.value)
  radarEchart.setOption({
    radar: {
      indicator: knowledgePoints.value.map(k => ({ name: k.name, max: 100 })),
      splitArea: { areaStyle: { color: ['rgba(6,182,212,0.02)', 'rgba(6,182,212,0.05)'] } },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#606060', fontSize: 10 },
    },
    series: [{ type: 'radar', data: [{ value: knowledgePoints.value.map(k => k.value), name: '掌握度' }], lineStyle: { color: '#06b6d4', width: 2 }, areaStyle: { color: 'rgba(6,182,212,0.15)' }, itemStyle: { color: '#06b6d4' }, symbol: 'circle', symbolSize: 4 }],
  })
}

const loadingCourses = ref(true)
const recommendedCourses = ref([
  { id: 1, title: 'Python数据结构精讲', emoji: '🐍', difficulty: '进阶', gradient: 'linear-gradient(135deg,#06b6d4,#8b5cf6)', lessonCount: 24, studentCount: 1283, progress: 45 },
  { id: 2, title: 'Java核心编程', emoji: '☕', difficulty: '基础', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', lessonCount: 36, studentCount: 2156, progress: 0 },
  { id: 3, title: '算法与设计模式', emoji: '🧠', difficulty: '拔高', gradient: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', lessonCount: 18, studentCount: 876, progress: 12 },
])

const hotTopics = ref([
  { id: 1, title: 'DeepSeek-R2发布：推理能力超越主流闭源模型', category: 'AI前沿', heat: '128.3万' },
  { id: 2, title: 'Python 4.0规划：GIL彻底移除，多线程性能大幅提升', category: '编程语言', heat: '89.2万' },
  { id: 3, title: '全国大学生计算机设计大赛2026报名开启', category: '竞赛资讯', heat: '67.4万' },
  { id: 4, title: '图神经网络在教育推荐系统中的最新应用', category: '学术研究', heat: '45.1万' },
  { id: 5, title: 'Rust连续9年荣获最受喜爱编程语言', category: '编程语言', heat: '41.8万' },
])

const wrongQuestions = ref([
  { id: 1, title: '二叉树的中序遍历，给定根节点root，返回中序遍历结果', type: 'wrong', errorRate: 72, tag: '数据结构' },
  { id: 2, title: '以下哪种排序算法在平均情况下时间复杂度为O(nlogn)？', type: 'predicted', errorRate: 63, tag: '算法设计' },
  { id: 3, title: 'Java中volatile关键字的作用是什么？', type: 'wrong', errorRate: 58, tag: '并发编程' },
])

onMounted(async () => {
  await nextTick()
  initTrendChart()
  initRadarChart()
  setTimeout(() => { loadingCourses.value = false }, 600)
  window.addEventListener('resize', () => { trendEchart?.resize(); radarEchart?.resize() })
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* Dark theme overrides for inline-styled elements */
:deep([style*="background:#f8fafc"]),
:deep([style*="background: #f8fafc"]) {
  background: #252525 !important;
}

:deep([style*="color: #E0E0E0"]),
:deep([style*="color: #E0E0E0"]) {
  color: #E0E0E0 !important;
}

:deep([style*="color: #707070"]),
:deep([style*="color: #707070"]) {
  color: #606060 !important;
}

:deep([style*="color: #00D4FF"]),
:deep([style*="color: #00D4FF"]) {
  color: #00D4FF !important;
}

:deep([style*="color: #909090"]),
:deep([style*="color: #909090"]) {
  color: #606060 !important;
}

:deep([style*="color:#0f172a"]),
:deep([style*="color: #0f172a"]) {
  color: #E0E0E0 !important;
}

:deep([style*="background: #252525"]) {
  background: rgba(255,255,255,0.08) !important;
}

/* Knowledge points progress bars */
:deep([style*="background: #252525;border-radius:3px"]) {
  background: rgba(255,255,255,0.06) !important;
}

/* Wrong question hover states */
:deep([style*="background: rgba(0,212,255,0.06)"]) {
  background: rgba(0, 212, 255, 0.06) !important;
}

/* User display */
:deep([style*="color: #F0F0F0"]) {
  color: #D0D0D0 !important;
}
</style>

