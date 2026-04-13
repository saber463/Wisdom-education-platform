<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>

    <div v-else-if="template" class="max-w-4xl mx-auto">
      <button
        class="mb-6 flex items-center text-gray-600 hover:text-primary transition-colors"
        @click="goBack"
      >
        <i class="fa fa-arrow-left mr-2" />
        返回首页
      </button>

      <div class="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div class="relative h-80 overflow-hidden">
          <img :src="template.cover" :alt="template.title" class="w-full h-full object-cover" />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
          />
          <div class="absolute bottom-0 left-0 right-0 p-8">
            <div class="flex items-center gap-3 mb-3">
              <span
                class="inline-block px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-md"
                :class="{
                  'bg-green-500/80 text-white': template.difficulty === 'easy',
                  'bg-yellow-500/80 text-white': template.difficulty === 'medium',
                  'bg-red-500/80 text-white': template.difficulty === 'hard',
                }"
              >
                {{ getDifficultyText(template.difficulty) }}
              </span>
              <span
                class="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-primary/80 text-white backdrop-blur-md"
              >
                {{ template.totalDays }}天学习计划
              </span>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
              {{ template.title }}
            </h1>
            <p class="text-gray-200 text-lg">
              {{ template.description }}
            </p>
          </div>
        </div>

        <div class="p-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="glass-card p-4 rounded-xl text-center">
              <div class="text-3xl font-bold text-primary mb-1">
                {{ formatStudentCount(template.students) }}
              </div>
              <div class="text-gray-500 text-sm">学习人数</div>
            </div>
            <div class="glass-card p-4 rounded-xl text-center">
              <div class="text-3xl font-bold text-tech-purple mb-1">
                {{ template.totalDays }}
              </div>
              <div class="text-gray-500 text-sm">学习天数</div>
            </div>
            <div class="glass-card p-4 rounded-xl text-center">
              <div class="text-3xl font-bold text-tech-blue mb-1">
                {{ getDifficultyText(template.difficulty) }}
              </div>
              <div class="text-gray-500 text-sm">难度等级</div>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-dark dark:text-white mb-4 flex items-center">
              <i class="fa fa-list-ul mr-3 text-primary" />
              学习内容概览
            </h2>
            <div class="glass-card p-6 rounded-xl">
              <ul class="space-y-3">
                <li
                  v-for="(item, index) in template.overview"
                  :key="index"
                  class="flex items-start"
                >
                  <span
                    class="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 mt-0.5 flex-shrink-0"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="text-gray-700 dark:text-gray-300">{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-dark dark:text-white mb-4 flex items-center">
              <i class="fa fa-users mr-3 text-primary" />
              适合人群
            </h2>
            <div class="glass-card p-6 rounded-xl">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(audience, index) in template.audience"
                  :key="index"
                  class="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm"
                >
                  {{ audience }}
                </span>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-dark dark:text-white mb-4 flex items-center">
              <i class="fa fa-graduation-cap mr-3 text-primary" />
              学习收获
            </h2>
            <div class="glass-card p-6 rounded-xl">
              <ul class="space-y-2">
                <li
                  v-for="(benefit, index) in template.benefits"
                  :key="index"
                  class="flex items-center text-gray-700 dark:text-gray-300"
                >
                  <i class="fa fa-check-circle text-primary mr-3" />
                  {{ benefit }}
                </li>
              </ul>
            </div>
          </div>

          <div class="flex gap-4">
            <button
              class="flex-1 px-8 py-4 bg-gradient-to-r from-primary to-accent hover:from-tech-blue hover:to-tech-purple text-white font-bold rounded-xl shadow-neon-blue transition-all duration-300 hover:scale-105 flex items-center justify-center"
              @click="startLearning"
            >
              <i class="fa fa-play mr-2" />
              开始学习
            </button>
            <button
              class="px-8 py-4 bg-white/10 hover:bg-primary/20 text-gray-700 dark:text-gray-300 font-bold rounded-xl border border-gray-200 dark:border-white/20 hover:border-primary/50 transition-all duration-300 flex items-center justify-center"
              @click="shareTemplate"
            >
              <i class="fa fa-share-alt mr-2" />
              分享
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <i class="fa fa-exclamation-triangle text-6xl text-gray-300 mb-4" />
      <h3 class="text-xl font-bold text-gray-600 mb-2">模板未找到</h3>
      <p class="text-gray-500 mb-6">抱歉，您访问的学习路径模板不存在</p>
      <router-link
        to="/"
        class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const template = ref(null);

const templates = {
  1: {
    id: 1,
    title: '30天计算机一级考试通关',
    description:
      '针对计算机一级考试（MS Office）的专项训练，涵盖Windows操作、Office办公软件、网络基础等核心考点',
    totalDays: 30,
    difficulty: 'easy',
    students: 5820,
    cover: 'https://picsum.photos/600/338?random=20',
    overview: [
      'Windows操作系统基础操作与文件管理',
      'Word文档编辑、排版与高级功能',
      'Excel电子表格制作、公式与数据处理',
      'PowerPoint演示文稿设计与动画效果',
      '计算机网络基础与信息安全知识',
      '历年真题模拟与考前冲刺训练',
    ],
    audience: [
      '计算机一级考试备考学生',
      'Office办公软件初学者',
      '需要提升办公技能的职场新人',
      '想系统学习计算机基础的用户',
    ],
    benefits: [
      '掌握计算机一级考试全部考点',
      '熟练使用Office办公套件',
      '提升计算机基础操作能力',
      '通过计算机一级考试',
      '获得实用的办公技能',
    ],
  },
  2: {
    id: 2,
    title: '45天英语四级高效备考',
    description:
      '从词汇、听力、阅读、写作四个维度系统提升，配套真题训练和作文模板，适合基础薄弱的同学',
    totalDays: 45,
    difficulty: 'medium',
    students: 9340,
    cover: 'https://picsum.photos/600/338?random=21',
    overview: [
      '四级核心词汇记忆与扩展',
      '听力技巧训练与真题练习',
      '阅读理解方法与快速阅读',
      '写作模板积累与范文分析',
      '翻译技巧与语法强化',
      '历年真题模拟与错题分析',
    ],
    audience: [
      '英语四级考试备考学生',
      '英语基础薄弱的学习者',
      '想系统提升英语能力的用户',
      '需要四级证书的求职者',
    ],
    benefits: [
      '掌握四级考试全部题型',
      '提升英语听说读写能力',
      '积累丰富的词汇和语法',
      '通过英语四级考试',
      '获得实用的英语学习技能',
    ],
  },
  3: {
    id: 3,
    title: '60天Vue3+Vite实战开发',
    description:
      '从Vue3基础语法到企业级项目开发，掌握Composition API、Pinia、路由守卫等核心技能，打造个人作品集',
    totalDays: 60,
    difficulty: 'hard',
    students: 3760,
    cover: 'https://picsum.photos/600/338?random=22',
    overview: [
      'Vue3基础语法与响应式原理',
      'Composition API深入理解',
      'Pinia状态管理实战',
      'Vue Router路由与导航守卫',
      '组件化开发与设计模式',
      '性能优化与项目部署',
      '企业级项目实战开发',
    ],
    audience: [
      '前端开发初学者',
      '想学习Vue3的开发者',
      '需要提升前端技能的程序员',
      '准备转行前端开发的用户',
    ],
    benefits: [
      '掌握Vue3核心开发技能',
      '能够独立开发前端项目',
      '理解现代前端开发流程',
      '打造个人作品集',
      '获得前端开发就业能力',
    ],
  },
  4: {
    id: 4,
    title: 'Web全栈开发工程师路径',
    description: '从HTML/CSS/JavaScript基础到React+Node.js全栈开发，构建完整的Web应用开发能力',
    totalDays: 90,
    difficulty: 'hard',
    students: 7450,
    cover: 'https://picsum.photos/600/338?random=23',
    overview: [
      'HTML5与CSS3基础与进阶',
      'JavaScript核心语法与ES6+',
      '前端框架React/Vue开发',
      'Node.js后端开发基础',
      '数据库设计与操作',
      'RESTful API设计与实现',
      '全栈项目实战与部署',
    ],
    audience: [
      '零基础想转行IT的用户',
      '前端开发想拓展后端技能',
      '后端开发想学习前端技术',
      '想成为全栈开发工程师的用户',
    ],
    benefits: [
      '掌握前后端全栈开发技能',
      '能够独立开发完整的Web应用',
      '理解全栈开发流程和架构',
      '具备全栈开发就业能力',
      '获得丰富的项目实战经验',
    ],
  },
};

const getDifficultyText = difficulty => {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '较难',
  };
  return difficultyMap[difficulty] || difficulty;
};

const formatStudentCount = count => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count;
};

const goBack = () => {
  router.push('/');
};

const startLearning = () => {
  router.push({
    path: '/learning-path/generate',
    query: {
      goal: template.value.title,
      days: template.value.totalDays,
      template: template.value.id,
    },
  });
};

const shareTemplate = () => {
  if (navigator.share) {
    navigator.share({
      title: template.value.title,
      text: template.value.description,
      url: window.location.href,
    });
  } else {
    alert('分享功能暂不支持，请手动复制链接分享');
  }
};

onMounted(() => {
  const templateId = route.params.id;
  setTimeout(() => {
    template.value = templates[templateId] || null;
    loading.value = false;
  }, 300);
});
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
