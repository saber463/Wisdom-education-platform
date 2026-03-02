<template>
  <div class="home-page">
    <div class="container mx-auto px-4 py-8">
    <!-- Hero Section -->
    <div
      class="relative h-[600px] rounded-3xl overflow-hidden mb-16 shadow-2xl group border border-white/10"
    >
      <!-- Background with Tech Grid -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div
          class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"
        />
        <div
          class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-tech-blue/20 via-transparent to-tech-purple/20"
        />

        <!-- Animated Gradient Orbs -->
        <div
          class="absolute top-20 right-20 w-96 h-96 bg-tech-blue rounded-full blur-[120px] opacity-30 animate-pulse-slow"
        />
        <div
          class="absolute bottom-20 left-20 w-80 h-80 bg-tech-purple rounded-full blur-[100px] opacity-30 animate-float"
        />
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tech-pink rounded-full blur-[80px] opacity-20 animate-pulse"
        />
      </div>

      <!-- Content -->
      <div class="absolute inset-0 z-10 flex flex-col justify-center px-8 md:px-16">
        <div class="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
          <!-- Text Content -->
          <div class="w-full lg:w-1/2 text-center lg:text-left">
            <div
              class="inline-block px-4 py-2 mb-6 text-sm font-bold tracking-widest text-white uppercase bg-gradient-to-r from-tech-blue to-tech-purple rounded-full shadow-neon-blue"
            >
              AI-Powered Learning Platform
            </div>
            <h1 class="text-[clamp(2.5rem,6vw,4rem)] font-bold text-white mb-6 leading-tight">
              探索
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink"
                >智能学习</span
              >
              的无限可能
            </h1>
            <p class="text-gray-300 text-xl mb-8 leading-relaxed">
              基于先进 AI 算法，为你量身定制学习路径。整合全网优质资源，让每一次学习都事半功倍。
            </p>
            <div class="flex flex-wrap gap-4 justify-center lg:justify-start">
              <router-link
                to="/learning-path/generate"
                class="group relative px-8 py-4 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-bold rounded-xl shadow-neon-blue transition-all duration-300 hover:scale-105 hover:shadow-neon-purple overflow-hidden"
              >
                <span class="relative z-10 flex items-center">
                  <i class="fa fa-magic mr-2" /> 生成学习路径
                </span>
                <div
                  class="absolute inset-0 bg-gradient-to-r from-tech-purple to-tech-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </router-link>
              <router-link
                to="/assessment/tests"
                class="group px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border-2 border-white/20 hover:border-tech-blue/50 transition-all duration-300 flex items-center"
              >
                <i class="fa fa-clipboard-check mr-2" /> 开始评估
              </router-link>
            </div>

            <!-- Stats -->
            <div class="flex gap-8 mt-12 justify-center lg:justify-start">
              <div class="text-center">
                <div class="text-3xl font-bold text-tech-blue">10K+</div>
                <div class="text-sm text-gray-400">活跃用户</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-tech-purple">500+</div>
                <div class="text-sm text-gray-400">学习路径</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-tech-pink">98%</div>
                <div class="text-sm text-gray-400">满意度</div>
              </div>
            </div>
          </div>

          <!-- AI Image Section -->
          <div class="w-full lg:w-1/2 flex justify-center">
            <div class="relative">
              <div
                class="absolute inset-0 bg-gradient-to-r from-tech-blue to-tech-purple rounded-3xl blur-2xl opacity-30"
              />
              <img
                src="https://picsum.photos/600/400?random=ai"
                alt="人工智能学习"
                class="relative w-full max-w-[500px] h-auto rounded-3xl shadow-2xl border-2 border-white/20 hover:scale-105 transition-transform duration-500"
              />
              <div
                class="absolute -bottom-4 -right-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 bg-gradient-to-br from-tech-blue to-tech-purple rounded-xl flex items-center justify-center"
                  >
                    <i class="fa fa-robot text-white text-xl" />
                  </div>
                  <div>
                    <div class="text-white font-bold">AI 助手</div>
                    <div class="text-gray-300 text-sm">24/7 在线</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured Tweets -->
    <section class="mb-16">
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center space-x-3">
          <div class="w-1 h-8 bg-gradient-to-b from-primary to-tech-purple rounded-full" />
          <h2 class="text-2xl font-bold text-dark dark:text-white">精选学习推文</h2>
        </div>
        <div class="flex gap-3">
          <router-link
            to="/tweets/publish"
            class="px-4 py-2 bg-primary/10 text-primary hover:bg-gradient-to-r from-primary to-tech-blue hover:text-white rounded-lg shadow-neon-blue transition-all duration-300 hover:scale-105 flex items-center"
          >
            <i class="fa fa-pencil mr-2" /> 发布
          </router-link>
          <router-link
            to="/tweets"
            class="px-4 py-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300 flex items-center"
          >
            查看全部 <i class="fa fa-angle-right ml-1" />
          </router-link>
        </div>
      </div>
      <div class="glass-card p-6">
        <TweetCard v-for="tweet in featuredTweets" :key="tweet.id" :tweet="tweet" />
      </div>
    </section>

    <!-- Membership Promotion -->
    <section class="mb-16">
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center space-x-3">
          <div class="w-1 h-8 bg-gradient-to-b from-tech-purple to-pink-500 rounded-full" />
          <h2 class="text-2xl font-bold text-dark dark:text-white">会员特权</h2>
        </div>
        <router-link
          to="/membership"
          class="text-primary hover:text-tech-purple transition-colors flex items-center group"
        >
          查看详情
          <i class="fa fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform" />
        </router-link>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="glass-card p-6 rounded-xl border border-white/10 hover:border-tech-purple/50 transition-all duration-300 hover:scale-105"
        >
          <div class="flex items-center mb-4">
            <div
              class="w-12 h-12 bg-gradient-to-br from-tech-purple to-pink-500 rounded-lg flex items-center justify-center"
            >
              <i class="fa fa-star text-white text-xl" />
            </div>
            <div class="ml-4">
              <h3 class="font-bold text-lg text-dark dark:text-white">白银会员</h3>
              <p class="text-sm text-gray-500">¥29/月起</p>
            </div>
          </div>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />每日20次生成
            </li>
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />优先技术支持
            </li>
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />学习数据分析
            </li>
          </ul>
        </div>
        <div
          class="glass-card p-6 rounded-xl border-2 border-tech-purple/50 relative overflow-hidden hover:scale-105 transition-all duration-300"
        >
          <div
            class="absolute top-0 right-0 bg-gradient-to-r from-tech-purple to-pink-500 text-white text-xs px-3 py-1 rounded-bl-lg"
          >
            推荐
          </div>
          <div class="flex items-center mb-4">
            <div
              class="w-12 h-12 bg-gradient-to-br from-tech-purple to-pink-500 rounded-lg flex items-center justify-center"
            >
              <i class="fa fa-crown text-white text-xl" />
            </div>
            <div class="ml-4">
              <h3 class="font-bold text-lg text-dark dark:text-white">黄金会员</h3>
              <p class="text-sm text-gray-500">¥99/月起</p>
            </div>
          </div>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />无限次生成
            </li>
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />专属客服支持
            </li>
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />高级AI模型
            </li>
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />优先功能体验
            </li>
          </ul>
        </div>
        <div
          class="glass-card p-6 rounded-xl border border-white/10 hover:border-tech-purple/50 transition-all duration-300 hover:scale-105"
        >
          <div class="flex items-center mb-4">
            <div
              class="w-12 h-12 bg-gradient-to-br from-tech-purple to-pink-500 rounded-lg flex items-center justify-center"
            >
              <i class="fa fa-gift text-white text-xl" />
            </div>
            <div class="ml-4">
              <h3 class="font-bold text-lg text-dark dark:text-white">限时优惠</h3>
              <p class="text-sm text-gray-500">最高8折</p>
            </div>
          </div>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />年度套餐8折
            </li>
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />半年套餐8.5折
            </li>
            <li class="flex items-center">
              <i class="fa fa-check text-tech-purple mr-2" />季度套餐9折
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Popular Paths -->
    <section class="mb-12">
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center space-x-3">
          <div class="w-1 h-8 bg-gradient-to-b from-tech-blue to-primary rounded-full" />
          <h2 class="text-2xl font-bold text-dark dark:text-white">热门学习路径</h2>
        </div>
        <router-link
          to="/learning/generate"
          class="text-primary hover:text-tech-blue transition-colors flex items-center group"
        >
          自定义路径
          <i class="fa fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform" />
        </router-link>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <LearningPathCard
          v-for="path in popularPaths"
          :key="path.id"
          :path="path"
          @click="handlePathClick(path.id)"
        />
      </div>
    </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import TweetCard from '@/components/business/TweetCard.vue';
import LearningPathCard from '@/components/business/LearningPathCard.vue';

const router = useRouter();

const featuredTweets = ref([
  {
    id: 1,
    author: {
      name: '前端开发工程师',
      avatar: 'https://picsum.photos/100/100?random=10',
      username: 'frontend_dev',
    },
    content:
      '分享一个Vue 3性能优化的小技巧：使用defineProps和defineEmits替代setup函数中的props和emits，配合Teleport和Suspense可以大幅提升大型项目的渲染性能～ #Vue3 #前端开发',
    images: ['https://picsum.photos/600/400?random=11'],
    likes: 238,
    comments: 45,
    shares: 32,
    createTime: '2小时前',
  },
  {
    id: 2,
    author: {
      name: '英语学习达人',
      avatar: 'https://picsum.photos/100/100?random=12',
      username: 'english_master',
    },
    content:
      '四级备考30天计划分享：前10天主攻词汇和语法，中间10天强化听力和阅读，最后10天集中刷真题和作文模板。推荐使用扇贝单词和每日英语听力APP，亲测有效！#英语四级 #学习方法',
    likes: 562,
    comments: 89,
    shares: 125,
    createTime: '昨天',
  },
]);

const popularPaths = ref([
  {
    id: 1,
    title: '30天计算机一级考试通关',
    description:
      '针对计算机一级考试（MS Office）的专项训练，涵盖Windows操作、Office办公软件、网络基础等核心考点',
    totalDays: 30,
    difficulty: 'easy',
    students: 5820,
    cover: 'https://picsum.photos/600/338?random=20',
  },
  {
    id: 2,
    title: '45天英语四级高效备考',
    description:
      '从词汇、听力、阅读、写作四个维度系统提升，配套真题训练和作文模板，适合基础薄弱的同学',
    totalDays: 45,
    difficulty: 'medium',
    students: 9340,
    cover: 'https://picsum.photos/600/338?random=21',
  },
  {
    id: 3,
    title: '60天Vue3+Vite实战开发',
    description:
      '从Vue3基础语法到企业级项目开发，掌握Composition API、Pinia、路由守卫等核心技能，打造个人作品集',
    totalDays: 60,
    difficulty: 'hard',
    students: 3760,
    cover: 'https://picsum.photos/600/338?random=22',
  },
  {
    id: 4,
    title: 'Web全栈开发工程师路径',
    description: '从HTML/CSS/JavaScript基础到React+Node.js全栈开发，构建完整的Web应用开发能力',
    totalDays: 90,
    difficulty: 'hard',
    students: 7450,
    cover: 'https://picsum.photos/600/338?random=23',
  },
]);

const handlePathClick = pathId => {
  router.push(`/learning-path/template/${pathId}`);
};
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.text-dark {
  color: #e5e7eb;
}

.bg-white {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
