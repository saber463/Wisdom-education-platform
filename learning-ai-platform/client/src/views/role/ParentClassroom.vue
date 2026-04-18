<template>
  <div class="parent-classroom-page">
    <div class="container mx-auto px-4 py-8">
      <div class="header mb-10 text-center">
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
          🎓 家长教育课堂
        </h1>
        <p class="text-gray-500 text-lg">汇聚教育智慧，助力孩子全面成长</p>
      </div>

      <!-- 分类筛选 -->
      <div class="flex flex-wrap justify-center gap-3 mb-10">
        <button 
          v-for="cat in categories" 
          :key="cat"
          :class="['px-6 py-2 rounded-full font-medium transition-all', 
                   activeCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300']"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- 课程列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          v-for="course in filteredCourses" 
          :key="course.id"
          class="course-card group cursor-pointer"
          @click="showCourseDetail(course)"
        >
          <div class="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all">
            <img :src="course.cover" :alt="course.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span class="text-white text-sm font-medium">点击进入学习 <i class="fa fa-play-circle ml-1"></i></span>
            </div>
            <div class="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg font-bold">
              {{ course.category }}
            </div>
          </div>
          <h3 class="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{{ course.title }}</h3>
          <p class="text-gray-500 text-sm line-clamp-2 mb-4">{{ course.desc }}</p>
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span class="flex items-center gap-1"><i class="fa fa-user-friends"></i> {{ course.students }} 人在学</span>
            <span class="flex items-center gap-1"><i class="fa fa-clock"></i> {{ course.duration }} 分钟</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const activeCategory = ref('全部');
const categories = ['全部', '心理健康', '学习习惯', '科技素养', '亲子沟通', '升学指导'];

const courses = ref([
  {
    id: 1,
    title: '如何培养孩子的编程兴趣？',
    desc: '从兴趣出发，让孩子爱上逻辑思考，开启数字时代的大门。我们将探讨如何将枯燥的代码转化为有趣的创意项目。',
    category: '科技素养',
    cover: 'https://picsum.photos/seed/edu1/600/400',
    students: 1240,
    duration: 45
  },
  {
    id: 2,
    title: '网络安全教育：引导孩子正确上网',
    desc: '建立健康的上网习惯，识别网络风险，保护孩子在网络世界的安全。重点讲解防范网络诈骗与信息泄露。',
    category: '科技素养',
    cover: 'https://picsum.photos/seed/edu2/600/400',
    students: 856,
    duration: 30
  },
  {
    id: 3,
    title: '缓解孩子考试焦虑的实用技巧',
    desc: '心理专家教你如何科学缓解孩子的学习压力。通过呼吸训练、认知重构等方法，帮助孩子在考试中发挥真实水平。',
    category: '心理健康',
    cover: 'https://picsum.photos/seed/edu3/600/400',
    students: 2100,
    duration: 60
  },
  {
    id: 4,
    title: '高效的时间管理：从整理书包开始',
    desc: '从小培养孩子的自律能力和时间规划意识。通过“番茄时钟”和“任务优先级”教学，让孩子学会自主学习。',
    category: '学习习惯',
    cover: 'https://picsum.photos/seed/edu4/600/400',
    students: 1540,
    duration: 25
  },
  {
    id: 5,
    title: '非暴力沟通：如何与青春期的孩子对话',
    desc: '掌握沟通的艺术，化解家庭矛盾。学习倾听、观察、表达感受和需求，构建亲密的家校桥梁。',
    category: '亲子沟通',
    cover: 'https://picsum.photos/seed/edu5/600/400',
    students: 3200,
    duration: 50
  },
  {
    id: 6,
    title: 'AI 时代的教育：孩子需要什么样的核心竞争力？',
    desc: '人工智能飞速发展，未来的职业需要什么样的能力？专家深度解析创新思维、批判性思考的重要性。',
    category: '科技素养',
    cover: 'https://picsum.photos/seed/edu6/600/400',
    students: 4500,
    duration: 40
  }
]);

const filteredCourses = computed(() => {
  if (activeCategory.value === '全部') return courses.value;
  return courses.value.filter(c => c.category === activeCategory.value);
});

const showCourseDetail = (course) => {
  ElMessage.info(`正在加载课程：${course.title}`);
};
</script>

<style scoped>
.parent-classroom-page {
  min-height: 100vh;
  background-color: #f8fafc;
}

.course-card {
  background: white;
  padding: 16px;
  border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.course-card:hover {
  transform: translateY(-5px);
}
</style>