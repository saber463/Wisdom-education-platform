<template>
  <div class="star-teachers-section py-16">
    <div class="container mx-auto max-w-6xl px-4">
      <!-- 标题区域 -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30 mb-4">
          <i class="fa fa-star text-amber-400"></i>
          <span class="text-amber-400 text-sm font-medium">明星师资</span>
        </div>
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">行业顶尖导师阵容</h2>
        <p class="text-gray-400 max-w-2xl mx-auto">
          汇聚前端、后端、AI等领域的资深专家，为您提供最专业的技术指导和实战经验分享
        </p>
      </div>

      <!-- 老师列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div
          v-for="teacher in teachers"
          :key="teacher.id"
          class="teacher-card group relative bg-gradient-to-br from-white/[0.07] to-white/[0.03] backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer"
          @click="goToProfile(teacher)"
        >
          <!-- 头像区域 -->
          <div class="relative p-6 pb-4">
            <!-- VIP徽章 -->
            <div v-if="teacher.isVIP" class="absolute top-3 right-3 z-10">
              <span class="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-amber-500/30">
                <i class="fa fa-crown text-[8px]"></i> VIP
              </span>
            </div>

            <!-- 头像 - 可点击跳转 -->
            <div class="relative mx-auto w-24 h-24 mb-4">
              <!-- 光环效果 -->
              <div
                class="absolute inset-0 rounded-full blur-lg opacity-60 group-hover:blur-xl group-hover:opacity-80 transition-all duration-500"
                :style="{ background: teacher.avatarGlow }"
              />
              <!-- 头像边框 + 渐变环 -->
              <div
                class="absolute inset-0 rounded-full p-[2px]"
                :style="{ background: teacher.avatarRing }"
              >
                <div class="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                  <img
                    :src="teacher.avatar"
                    :alt="teacher.name"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
              <!-- 在线状态 -->
              <div class="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-gray-900" />
            </div>

            <!-- 老师信息 -->
            <div class="text-center">
              <h3 class="text-base font-bold text-white mb-0.5 group-hover:text-amber-400 transition-colors">
                {{ teacher.name }}
              </h3>
              <p class="text-xs text-gray-400 mb-2.5 leading-relaxed">{{ teacher.title }}</p>

              <!-- 评分 -->
              <div class="flex items-center justify-center gap-1 mb-2.5">
                <div class="flex text-amber-400">
                  <template v-for="i in 5" :key="i">
                    <i :class="i <= Math.floor(teacher.rating) ? 'fa-solid fa-star' : (i === Math.ceil(teacher.rating) && teacher.rating % 1 >= 0.5 ? 'fa-solid fa-star-half-stroke' : 'fa-regular fa-star')" class="text-[10px]" />
                  </template>
                </div>
                <span class="text-[10px] text-gray-500 ml-0.5">{{ teacher.rating }}</span>
              </div>

              <!-- 技能标签 -->
              <div class="flex flex-wrap justify-center gap-1 mb-3">
                <span
                  v-for="(skill, idx) in teacher.skills.slice(0, 3)"
                  :key="skill"
                  class="px-1.5 py-0.5 text-[10px] rounded-full border"
                  :class="idx === 0 ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' : idx === 1 ? 'bg-purple-500/15 text-purple-300 border-purple-500/25' : 'bg-teal-500/15 text-teal-300 border-teal-500/25'"
                >
                  {{ skill }}
                </span>
              </div>
            </div>
          </div>

          <!-- 底部统计 -->
          <div class="border-t border-white/[0.06] px-4 py-2.5 bg-black/20">
            <div class="flex justify-between text-center">
              <div>
                <div class="text-sm font-bold text-white">{{ teacher.courses }}</div>
                <div class="text-[10px] text-gray-500">课程</div>
              </div>
              <div>
                <div class="text-sm font-bold text-white">{{ formatNumber(teacher.students) }}</div>
                <div class="text-[10px] text-gray-500">学员</div>
              </div>
              <div>
                <div class="text-sm font-bold text-white">{{ teacher.experience }}年</div>
                <div class="text-[10px] text-gray-500">经验</div>
              </div>
            </div>
          </div>

          <!-- 悬停时的操作区 -->
          <div class="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
            <div class="p-3 pt-0 space-y-1.5">
              <!-- 主讲课程 -->
              <div class="p-2.5 rounded-xl" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(12px);">
                <h4 class="text-[11px] font-semibold mb-1.5 flex items-center gap-1" :style="{ color: teacher.accentColor }">
                  <i class="fa fa-book-open text-[10px]" /> 主讲课程
                </h4>
                <ul class="space-y-1">
                  <li v-for="course in teacher.coursesList.slice(0, 3)" :key="course" class="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <i class="fa fa-play-circle text-[9px] opacity-50" :style="{ color: teacher.accentColor }" />
                    {{ course }}
                  </li>
                </ul>
              </div>
              <!-- 关于导师 按钮 -->
              <button
                @click.stop="goToProfile(teacher)"
                class="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95"
                :style="{
                  background: `linear-gradient(135deg, ${teacher.accentColor}22, ${teacher.accentColor}08)`,
                  color: teacher.accentColor,
                  border: `1px solid ${teacher.accentColor}33`
                }"
              >
                <i class="fa fa-user-circle" /> 访问导师主页
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 查看全部按钮 -->
      <div class="text-center mt-10">
        <router-link
          to="/star-teachers"
          class="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30"
        >
          <i class="fa fa-users"></i>
          探索全部导师
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 导师ID到用户名映射（用于 ProfilePage 路由）
const TEACHER_USER_MAP = {
  1: 'limingzhe',
  2: 'wangxuefeng', 
  3: 'zhangzhineng',
  4: 'chenshuju',
  5: 'liuyuansheng'
};

const goToProfile = (teacher) => {
  const username = TEACHER_USER_MAP[teacher.id] || `teacher${teacher.id}`;
  // 存储导师信息供 ProfilePage 使用
  localStorage.setItem('viewing_teacher', JSON.stringify({
    id: teacher.id,
    name: teacher.name,
    title: teacher.title,
    avatar: teacher.avatar,
    skills: teacher.skills,
    rating: teacher.rating,
    coursesList: teacher.coursesList,
    isVIP: teacher.isVIP,
    students: teacher.students,
    experience: teacher.experience,
    accentColor: teacher.accentColor,
    bio: teacher.bio,
  }));
  router.push(`/profile/${username}`);
};

const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
};

// 明星老师数据 — 使用可靠的 UI Avatars 服务生成头像
const teachers = ref([
  {
    id: 1,
    name: '李明哲',
    title: '前端架构师 · 前阿里P8',
    // 使用 ui-avatars 生成带名字首字母的头像，稳定可靠
    avatar: 'https://ui-avatars.com/api/?name=李明哲&background=6366f1&color=fff&size=200&font-size=0.35&bold=true',
    avatarGlow: 'linear-gradient(135deg, #6366f180, #8b5cf680)',
    avatarRing: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    accentColor: '#6366f1',
    rating: 4.9,
    skills: ['Vue3', 'React', 'TypeScript', 'Webpack'],
    courses: 28,
    students: 12500,
    experience: 12,
    isVIP: true,
    coursesList: ['Vue3 企业级实战', 'TypeScript 进阶指南', '前端性能优化实战', '微前端架构设计'],
    bio: '12年前端开发经验，曾主导多个千万级用户的前端架构设计。专注于 Vue3 生态、性能优化和工程化建设。'
  },
  {
    id: 2,
    name: '王雪峰',
    title: '后端技术专家 · 前字节架构师',
    avatar: 'https://ui-avatars.com/api/?name=王雪峰&background=059669&color=fff&size=200&font-size=0.35&bold=true',
    avatarGlow: 'linear-gradient(135deg, #05966980, #10b98180)',
    avatarRing: 'linear-gradient(135deg, #059669, #10b981)',
    accentColor: '#059669',
    rating: 4.8,
    skills: ['Java', 'Go', 'Kubernetes', '微服务'],
    courses: 35,
    students: 15800,
    experience: 15,
    isVIP: true,
    coursesList: ['Go 微服务架构', 'Kubernetes 实战', '高并发系统设计', '分布式事务原理'],
    bio: '15年后端架构经验，在字节跳动负责核心交易系统的架构设计。擅长高并发、分布式系统。'
  },
  {
    id: 3,
    name: '张智能',
    title: 'AI 算法工程师 · 前腾讯AI Lab',
    avatar: 'https://ui-avatars.com/api/?name=张智能&background=dc2626&color=fff&size=200&font-size=0.35&bold=true',
    avatarGlow: 'linear-gradient(135deg, #dc262680, #ef444480)',
    avatarRing: 'linear-gradient(135deg, #dc2626, #ef4444)',
    accentColor: '#dc2626',
    rating: 4.9,
    skills: ['Python', 'TensorFlow', 'PyTorch', 'LLM'],
    courses: 22,
    students: 9800,
    experience: 10,
    isVIP: true,
    coursesList: ['机器学习实战', '深度学习入门', '大模型应用开发', 'Prompt Engineering'],
    bio: '腾讯AI Lab前研究员，专注深度学习和大规模语言模型应用落地。多篇顶会论文作者。'
  },
  {
    id: 4,
    name: '陈树举',
    title: '数据库专家 · 前美团DBA负责人',
    avatar: 'https://ui-avatars.com/api/?name=陈树举&background=d97706&color=fff&size=200&font-size=0.35&bold=true',
    avatarGlow: 'linear-gradient(135deg, #d9770680, #f59e0b80)',
    avatarRing: 'linear-gradient(135deg, #d97706, #f59e0b)',
    accentColor: '#d97706',
    rating: 4.7,
    skills: ['MySQL', 'Redis', 'MongoDB', '数据库优化'],
    courses: 18,
    students: 7200,
    experience: 11,
    isVIP: false,
    coursesList: ['Redis 缓存设计', 'MySQL 性能优化', '数据库集群实战', '分库分表最佳实践'],
    bio: '11年数据库领域深耕，曾负责美团核心交易链路的数据库架构优化。精通 MySQL 内核调优。'
  },
  {
    id: 5,
    name: '刘云原生',
    title: 'DevOps 专家 · 前华为云架构师',
    avatar: 'https://ui-avatars.com/api/?name=刘云原&background=7c3aed&color=fff&size=200&font-size=0.35&bold=true',
    avatarGlow: 'linear-gradient(135deg, #7c3aed80, #a78bfa80)',
    avatarRing: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    accentColor: '#7c3aed',
    rating: 4.8,
    skills: ['Docker', 'K8s', 'CI/CD', 'AWS/GCP'],
    courses: 24,
    students: 8900,
    experience: 13,
    isVIP: false,
    coursesList: ['Docker 容器化实战', 'K8s 集群管理', '云原生架构设计', 'GitOps 工作流'],
    bio: '13年DevOps与云原生经验，华为云核心架构团队成员。主导过多个超大规模容器集群的建设。'
  }
]);
</script>

<style scoped>
.star-teachers-section {
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 27, 75, 0.4) 50%, rgba(15, 23, 42, 0.6) 100%);
}

.teacher-card:hover .translate-y-full {
  transform: translateY(0);
}
</style>
