<template>
  <div class="vip-courses-page min-h-screen">
    <!-- 页面头部 -->
    <div class="page-header relative overflow-hidden rounded-b-3xl mb-10">
      <div class="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
      <div class="absolute inset-0 opacity-30" style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwIDIgMCAyIDJzMCAyIDAgMi0yIDItMiA0LTIgNHpNMCAwaDYwdjYwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')" />
      
      <!-- 装饰性元素 -->
      <div class="absolute top-10 right-10 text-white/10 text-[120px] font-bold leading-none pointer-events-none select-none">VIP</div>
      <div class="absolute bottom-5 right-20 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />
      <div class="absolute top-16 left-1/4 w-24 h-24 bg-orange-400/20 rounded-full blur-xl pointer-events-none" />

      <div class="container mx-auto max-w-6xl relative z-10 py-14 px-4">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-4xl">👑</span>
          <h1 class="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">VIP 专属课程</h1>
        </div>
        <p class="text-xl text-white/90 max-w-2xl mb-6">
          解锁全部高级课程内容，由行业顶尖导师精心打造，助你快速进阶
        </p>
        <div class="flex flex-wrap items-center gap-6 text-sm text-white/80">
          <div class="flex items-center gap-2">
            <i class="fa fa-crown text-yellow-300"></i>
            <span><strong>{{ vipCourses.length }}</strong> 门精品课程</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fa fa-play-circle text-green-300"></i>
            <span>总计 <strong>{{ totalHours }}</strong> 课时</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fa fa-users text-blue-300"></i>
            <span><strong>{{ totalStudents.toLocaleString() }}</strong>+ 人学习</span>
          </div>
        </div>

        <!-- 升级会员按钮 -->
        <router-link
          to="/membership"
          class="inline-flex items-center gap-2 mt-6 px-7 py-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold rounded-xl shadow-lg shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105 group"
        >
          <i class="fa fa-gem group-hover:rotate-12 transition-transform"></i>
          立即开通 VIP
          <i class="fa fa-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
        </router-link>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="container mx-auto max-w-6xl px-4 pb-16">

      <!-- 筛选栏 -->
      <div class="glass-card rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-white/10 bg-white/5">
        <div class="flex items-center gap-3 flex-wrap justify-center md:justify-start">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            @click="activeFilter = tab.value"
            class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            :class="activeFilter === tab.value
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'"
          >
            <i v-if="tab.icon" :class="'fa ' + tab.icon + ' mr-1.5'"></i>
            {{ tab.label }}
          </button>
        </div>
        <div class="relative w-full md:w-64">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索VIP课程..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
          <i class="fa fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"></i>
        </div>
      </div>

      <!-- 课程列表 -->
      <div v-if="filteredCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="course in filteredCourses"
          :key="course.id"
          class="group relative glass-card rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 border border-white/5"
          @click="viewCourse(course)"
        >
          <!-- VIP 标识 -->
          <div class="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg">
            <i class="fa fa-crown"></i>
            VIP 专属
          </div>

          <!-- 封面图 -->
          <div class="relative h-44 overflow-hidden">
            <img
              :src="course.cover"
              :alt="course.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <!-- 播放按钮 -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <i class="fa fa-play text-white text-lg ml-1"></i>
              </div>
            </div>

            <!-- 底部信息 -->
            <div class="absolute bottom-3 left-3 right-3 flex justify-between items-center">
              <span class="px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs text-white/90">
                <i class="fa fa-clock mr-1"></i>{{ course.hours }}小时
              </span>
              <span class="px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs text-white/90">
                <i class="fa fa-user mr-1"></i>{{ course.students }}
              </span>
            </div>
          </div>

          <!-- 课程信息 -->
          <div class="p-5">
            <h3 class="font-bold text-base text-white mb-2 line-clamp-1 group-hover:text-amber-400 transition-colors">
              {{ course.title }}
            </h3>
            <p class="text-sm text-gray-400 mb-4 line-clamp-2">{{ course.description }}</p>

            <!-- 讲师信息 -->
            <div class="flex items-center gap-2 mb-4">
              <img
                :src="course.instructorAvatar"
                alt=""
                class="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500/30"
              />
              <div>
                <p class="text-xs font-medium text-white">{{ course.instructor }}</p>
                <p class="text-[11px] text-gray-500">{{ course.instructorTitle }}</p>
              </div>
            </div>

            <!-- 底部标签和价格 -->
            <div class="flex items-center justify-between pt-3 border-t border-white/5">
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in course.tags.slice(0, 2)"
                  :key="tag"
                  class="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[11px] rounded-md"
                >
                  {{ tag }}
                </span>
              </div>
              <div v-if="userStore.isLogin && userStore.userInfo?.isVip" class="text-green-400 text-sm font-bold flex items-center gap-1">
                <i class="fa fa-check-circle text-xs"></i>
                已解锁
              </div>
              <div v-else class="flex items-center gap-1.5">
                <span class="text-gray-500 text-sm line-through">{{ course.originalPrice }}</span>
                <span class="text-amber-400 text-sm font-bold">免费</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无结果提示 -->
      <div v-else class="text-center py-20">
        <div class="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="fa fa-crown text-4xl text-amber-500"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-3">暂无匹配的VIP课程</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">试试调整筛选条件或关键词</p>
        <button
          class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          @click="activeFilter = 'all'; searchKeyword = ''"
        >
          重置筛选
        </button>
      </div>

      <!-- VIP特权说明 -->
      <div class="mt-16 glass-card rounded-2xl p-8 relative overflow-hidden border border-white/5 bg-white/5">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div class="relative z-10">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <i class="fa fa-gem text-amber-400"></i>
            VIP 会员专属权益
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="(benefit, idx) in benefits" :key="idx" class="group p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <i :class="'fa ' + benefit.icon + ' text-amber-400'"></i>
              </div>
              <h3 class="font-semibold text-white text-sm mb-1">{{ benefit.title }}</h3>
              <p class="text-xs text-gray-400 leading-relaxed">{{ benefit.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程详情弹窗 -->
    <div
      v-if="selectedCourse"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      @click.self="selectedCourse = null"
    >
      <div class="bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8 border border-white/10">
        <!-- 封面 -->
        <div class="relative h-52 md:h-64">
          <img :src="selectedCourse.cover" alt="" class="w-full h-full object-cover rounded-t-3xl" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          
          <button
            class="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            @click="selectedCourse = null"
          >
            <i class="fa fa-times"></i>
          </button>

          <div class="absolute bottom-4 left-6 right-6">
            <span class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white mb-2">
              <i class="fa fa-crown mr-1"></i> VIP 专属课程
            </span>
            <h2 class="text-2xl md:text-3xl font-bold text-white">{{ selectedCourse.title }}</h2>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="p-6 md:p-8">
          <div class="flex items-center gap-3 mb-4">
            <img :src="selectedCourse.instructorAvatar" alt="" class="w-10 h-10 rounded-full" />
            <div>
              <p class="text-sm font-medium text-white">{{ selectedCourse.instructor }}</p>
              <p class="text-xs text-gray-400">{{ selectedCourse.instructorTitle }}</p>
            </div>
          </div>

          <p class="text-gray-300 mb-6 leading-relaxed">{{ selectedCourse.description }}</p>

          <!-- 课程亮点 -->
          <div v-if="selectedCourse.highlights && selectedCourse.highlights.length" class="mb-6">
            <h3 class="text-lg font-bold text-white mb-3">📚 课程亮点</h3>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="(highlight, i) in selectedCourse.highlights" :key="i" class="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                <i class="fa fa-check-circle text-green-400 mt-0.5 text-sm"></i>
                <span class="text-sm text-gray-300">{{ highlight }}</span>
              </div>
            </div>
          </div>

          <!-- 课程大纲预览 -->
          <div v-if="selectedCourse.chapters && selectedCourse.chapters.length" class="mb-6">
            <h3 class="text-lg font-bold text-white mb-3">📋 课程大纲</h3>
            <div class="space-y-2">
              <div
                v-for="(chapter, i) in selectedCourse.chapters"
                :key="i"
                @click="toggleChapter(i)"
                class="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
              >
                <span class="w-7 h-7 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">{{ i + 1 }}</span>
                <span class="text-sm text-gray-300 flex-1">{{ chapter.name }}</span>
                <span class="text-xs text-gray-500 shrink-0">{{ chapter.duration }}</span>
                <i :class="'fa ' + (expandedChapters.includes(i) ? 'fa-chevron-up' : 'fa-chevron-down') + ' text-gray-500 text-xs transition-transform group-hover:text-amber-400'"></i>
              </div>
              <!-- 章节展开详情 -->
              <div
                v-if="expandedChapters.includes(i) && selectedCourse.chapterDetails && selectedCourse.chapterDetails[i]"
                class="ml-10 mr-2 mb-2 p-4 bg-white/[0.03] rounded-xl border border-white/5"
              >
                <p class="text-sm text-gray-400 leading-relaxed mb-3">{{ selectedCourse.chapterDetails[i].description }}</p>
                <div v-if="selectedCourse.chapterDetails[i].topics" class="flex flex-wrap gap-2">
                  <span
                    v-for="(topic, tIdx) in selectedCourse.chapterDetails[i].topics"
                    :key="tIdx"
                    class="px-2.5 py-1 bg-tech-blue/10 text-tech-blue text-xs rounded-lg"
                  >
                    {{ topic }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-4 pt-4 border-t border-white/10">
            <button
              v-if="!userStore.isLogin"
              class="flex-1 py-3 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-bold rounded-xl hover:shadow-lg transition-all"
              @click="$router.push('/login')"
            >
              登录后解锁
            </button>
            <button
              v-else-if="userStore.userInfo?.isVip"
              class="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              <i class="fa fa-play-circle mr-2"></i> 开始学习
            </button>
            <button
              v-else
              class="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              @click="$router.push('/membership')"
            >
              <i class="fa fa-crown mr-2"></i> 开通 VIP 学习
            </button>
            <button class="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <i class="fa fa-bookmark-o"></i> 收藏
            </button>
            <button class="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
              <i class="fa fa-share-alt"></i> 分享
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

// 状态
const activeFilter = ref('all');
const searchKeyword = ref('');
const selectedCourse = ref(null);
const expandedChapters = ref([]);

// 章节展开/收起
const toggleChapter = (index) => {
  const idx = expandedChapters.value.indexOf(index);
  if (idx > -1) {
    expandedChapters.value.splice(idx, 1);
  } else {
    expandedChapters.value.push(index);
  }
};

// 筛选标签
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '前端开发', value: 'frontend', icon: 'fa-code' },
  { label: '后端开发', value: 'backend', icon: 'fa-server' },
  { label: 'AI/数据科学', value: 'ai', icon: 'fa-brain' },
  { label: 'DevOps/架构', value: 'devops', icon: 'fa-cloud' },
];

// VIP权益列表
const benefits = [
  { icon: 'fa-video', title: '全部课程解锁', desc: '无限制学习所有VIP课程内容' },
  { icon: 'fa-download', title: '离线下载', desc: '支持视频课件离线缓存' },
  { icon: 'fa-comments', title: '导师答疑', desc: '专享导师1对1答疑服务' },
  { icon: 'fa-certificate', title: '认证证书', desc: '完成课程获取官方认证证书' },
];

// VIP课程数据
const vipCourses = ref([
  {
    id: 'vip-1',
    title: 'Vue3 企业级实战：从零构建大型项目',
    description: '深入 Vue3 Composition API、Pinia、TypeScript 全栈开发，包含企业级项目架构设计、性能优化与部署方案',
    cover: 'https://picsum.photos/seed/vip-vue3/400/240',
    instructor: '张明远',
    instructorTitle: '前阿里前端架构师',
    instructorAvatar: 'https://picsum.photos/seed/t1/80/80',
    hours: 42,
    students: '3.2k',
    category: 'frontend',
    originalPrice: '¥599',
    tags: ['Vue3', 'TypeScript', '企业级'],
    highlights: [
      '完整的企业级项目实战案例',
      '从零搭建 CI/CD 流水线',
      '性能优化最佳实践',
      '单元测试 + E2E 测试全覆盖'
    ],
    chapters: [
      { name: 'Vue3 核心原理深度解析', duration: '6h' },
      { name: 'Pinia 状态管理实战', duration: '4h' },
      { name: 'TypeScript 高级类型编程', duration: '5h' },
      { name: '组件库设计与实现', duration: '6h' },
      { name: 'SSR 与 SSG 部署策略', duration: '4h' },
      { name: '性能优化与监控体系', duration: '5h' }
    ],
    chapterDetails: [
      { description: '深入Vue3响应式原理、虚拟DOM diff算法、编译优化策略，掌握底层核心机制。', topics: ['响应式系统', 'Virtual DOM', '编译器优化', '渲染机制'] },
      { description: 'Pinia store设计、模块化、插件开发、与DevTools集成，构建企业级状态管理方案。', topics: ['Store设计', 'Actions/Getters', '模块化', 'DevTools'] },
      { description: '泛型约束、条件类型、模板字面量类型、工具类型进阶，写出类型安全的代码。', topics: ['泛型编程', '条件类型', '映射类型', '类型体操'] },
      { description: '组件通信模式、插槽高级用法、异步组件、Tree-shaking最佳实践。', topics: ['组件API', '插槽模式', '异步加载', '性能优化'] },
      { description: 'Nuxt3/Vite SSR配置、SSG静态生成、ISR增量再生、部署到CDN。', topics: ['SSR原理', 'Nuxt3', 'Vite SSR', '部署策略'] },
      { description: '性能指标Core Web Vitals、Bundle分析、懒加载策略、生产环境监控告警。', topics: ['性能指标', 'Bundle优化', '懒加载', '监控系统'] }
    ]
  },
  {
    id: 'vip-2',
    title: 'Python 数据科学与机器学习全栈',
    description: 'NumPy/Pandas/Scikit-learn 深度实践，涵盖数据清洗、特征工程、模型训练到部署上线的完整流程',
    cover: 'https://picsum.photos/seed/vip-python-ml/400/240',
    instructor: '李思涵',
    instructorTitle: 'AI 算法研究员 · 前 字节跳动',
    instructorAvatar: 'https://picsum.photos/seed/t2/80/80',
    hours: 56,
    students: '4.1k',
    category: 'ai',
    originalPrice: '¥799',
    tags: ['Python', 'ML', '数据分析'],
    highlights: [
      '真实业务数据集实操',
      '10+ 经典算法手写实现',
      'AutoML 自动化建模',
      '模型服务化部署方案'
    ],
    chapters: [
      { name: 'Python 数据处理三剑客', duration: '8h' },
      { name: '特征工程技术大全', duration: '6h' },
      { name: '经典 ML 算法深度剖析', duration: '10h' },
      { name: '深度学习入门与实践', duration: '8h' },
      { name: 'NLP 自然语言处理', duration: '8h' },
      { name: 'ML 工程化与部署', duration: '8h' }
    ]
  },
  {
    id: 'vip-3',
    title: '微服务架构设计与云原生实践',
    description: 'SpringCloud/Kubernetes/Docker 完整微服务体系，从单体拆分到容器编排的全链路实战指南',
    cover: 'https://picsum.photos/seed/vip-microservice/400/240',
    instructor: '王建华',
    instructorTitle: '首席架构师 · 前 腾讯 T4',
    instructorAvatar: 'https://picsum.photos/seed/t3/80/80',
    hours: 48,
    students: '2.8k',
    category: 'backend',
    originalPrice: '¥699',
    tags: ['SpringCloud', 'K8s', '架构'],
    highlights: [
      '百万级并发架构设计方案',
      'Service Mesh 服务网格落地',
      '可观测性体系搭建',
      '混沌工程与容灾演练'
    ],
    chapters: [
      { name: '微服务架构设计模式', duration: '6h' },
      { name: 'Spring Cloud Alibaba 实战', duration: '8h' },
      { name: 'Kubernetes 生产级运维', duration: '8h' },
      { name: '服务网格 Istio 实践', duration: '6h' },
      { name: '分布式事务解决方案', duration: '6h' },
      { name: '高可用架构设计', duration: '7h' },
      { name: '性能压测与调优', duration: '7h' }
    ]
  },
  {
    id: 'vip-4',
    title: 'Go 语言高性能后端开发',
    description: 'Gin/Etcd/gRPC 分布式系统开发，深入 Go 并发模型、内存管理与性能调优技巧',
    cover: 'https://picsum.photos/seed/vip-golang/400/240',
    instructor: '陈志强',
    instructorTitle: 'Go 语言专家 · 前 百度 L7',
    instructorAvatar: 'https://picsum.photos/seed/t4/80/80',
    hours: 38,
    students: '1.9k',
    category: 'backend',
    originalPrice: '¥549',
    tags: ['Go', 'gRPC', '高性能'],
    highlights: [
      'Goroutine 调度器源码分析',
      '高吞吐量 RPC 框架设计',
      '内存泄漏排查与优化',
      '生产级中间件开发'
    ],
    chapters: [
      { name: 'Go 并发编程核心', duration: '6h' },
      { name: 'Gin Web 框架深度定制', duration: '5h' },
      { name: 'gRPC 微服务通信', duration: '6h' },
      { name: 'Etcd 分布式协调', duration: '4h' },
      { name: '性能分析与调优工具链', duration: '6h' },
      { name: '生产环境排障实战', duration: '6h' }
    ]
  },
  {
    id: 'vip-5',
    title: 'LLM 大模型应用开发实战',
    description: 'RAG检索增强生成、LangChain框架、Agent智能体、Prompt Engineering与大模型微调全栈技术',
    cover: 'https://picsum.photos/seed/vip-llm/400/240',
    instructor: '林晓峰',
    instructorTitle: 'LLM 应用架构师 · AI 创业者',
    instructorAvatar: 'https://picsum.photos/seed/t5/80/80',
    hours: 45,
    students: '5.6k',
    category: 'ai',
    originalPrice: '¥899',
    tags: ['LLM', 'LangChain', 'RAG'],
    highlights: [
      '企业级 RAG 系统搭建',
      'Multi-Agent 协作框架',
      'LoRA/Q-LoRA 高效微调',
      '大模型应用安全防护'
    ],
    chapters: [
      { name: '大模型基础与 Prompt 工程', duration: '6h' },
      { name: 'LangChain 框架深度实战', duration: '8h' },
      { name: '向量数据库选型与应用', duration: '5h' },
      { name: 'RAG 检索增强生成系统', duration: '8h' },
      { name: 'Agent 智能体开发', duration: '7h' },
      { name: '模型微调与部署', duration: '6h' },
      { name: 'LLM App 安全与评估', duration: '5h' }
    ]
  },
  {
    id: 'vip-6',
    title: 'DevOps 工程师成长之路',
    description: 'CI/CD流水线、GitOps、基础设施即代码、可观测性与SRE运维实践的全面技能提升',
    cover: 'https://picsum.photos/seed/vip-devops/400/240',
    instructor: '赵鹏飞',
    instructorTitle: 'SRE 专家 · 前 华为云',
    instructorAvatar: 'https://picsum.photos/seed/t6/80/80',
    hours: 35,
    students: '1.5k',
    category: 'devops',
    originalPrice: '¥499',
    tags: ['CI/CD', 'SRE', 'K8s'],
    highlights: [
      '多环境 GitOps 流水线搭建',
      'Prometheus+Grafana 监控大盘',
      'SLO/SLI 可靠性体系建设',
      '故障演练与根因分析方法论'
    ],
    chapters: [
      { name: '现代 CI/CD 最佳实践', duration: '5h' },
      { name: 'Docker & Kubernetes 进阶', duration: '6h' },
      { name: 'GitOps 工作流实施', duration: '5h' },
      { name: '可观测性三大支柱', duration: '6h' },
      { name: 'SRE 可靠性工程', duration: '6h' },
      { name: '安全合规与审计', duration: '4h' }
    ]
  }
]);

// 计算属性：过滤后的课程
const filteredCourses = computed(() => {
  let result = vipCourses.value;
  
  // 分类过滤
  if (activeFilter.value !== 'all') {
    result = result.filter(c => c.category === activeFilter.value);
  }

  // 关键词搜索
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase();
    result = result.filter(c =>
      c.title.toLowerCase().includes(kw) ||
      c.description.toLowerCase().includes(kw) ||
      c.tags.some(t => t.toLowerCase().includes(kw))
    );
  }

  return result;
});

// 计算属性：总课时
const totalHours = computed(() =>
  vipCourses.value.reduce((sum, c) => sum + (c.hours || 0), 0)
);

// 计算属性：总学生数
const totalStudents = computed(() =>
  vipCourses.value.reduce((sum, c) => {
    const num = parseInt(c.students?.replace(/[kK]/g, '000') || '0');
    return sum + num;
  }, 0)
);

// 查看课程详情
const viewCourse = (course) => {
  selectedCourse.value = course;
  expandedChapters.value = []; // 重置展开状态
};
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
