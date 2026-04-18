<template>
  <div class="home-page">
    <div class="home-container">

    <!-- Hero Banner -->
    <section class="hero-section">
      <div class="hero-inner">
        <div class="hero-main">
          <div class="hero-slide hero-slide-1 active">
            <div class="hero-content">
              <div class="hero-tag">🚀 AI 智能推荐</div>
              <h1 class="hero-title">
                <span class="hero-title-highlight">AI 为你定制</span>专属学习路径
              </h1>
              <p class="hero-desc">基于先进 AI 算法，分析你的知识图谱、学习风格和目标，生成最适合你的个性化学习方案</p>
              <div class="hero-actions">
                <router-link to="/learning-path/generate" class="hero-btn-primary">
                  <i class="fa fa-magic mr-2" /> 开始智能学习
                </router-link>
                <router-link to="/assessment/tests" class="hero-btn-secondary">
                  <i class="fa fa-clipboard-check mr-2" /> 能力评估
                </router-link>
              </div>
              <div class="hero-stats">
                <div class="hero-stat"><div class="hero-stat-num">10K+</div><div class="hero-stat-label">活跃用户</div></div>
                <div class="hero-stat"><div class="hero-stat-num">500+</div><div class="hero-stat-label">学习路径</div></div>
                <div class="hero-stat"><div class="hero-stat-num">98%</div><div class="hero-stat-label">满意度</div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧面板 -->
        <div class="hero-side">
          <div class="side-card user-card">
            <NameAvatar name="智学AI" :size="48" type="ai" />
            <div class="side-user-info">
              <div class="side-user-name">智学AI</div>
              <div class="side-user-level">AI 驱动 · 个性化学习</div>
            </div>
          </div>
          <div class="side-card stat-card">
            <div class="stat-row"><span class="stat-label">精品课程</span><span class="stat-value blue">5,000+</span></div>
            <div class="stat-row"><span class="stat-label">名师入驻</span><span class="stat-value green">200+</span></div>
            <div class="stat-row"><span class="stat-label">学习资源</span><span class="stat-value orange">50,000+</span></div>
          </div>
          <div class="side-card notice-card">
            <div class="notice-title">📢 最新动态</div>
            <div class="notice-item"><span class="notice-dot"></span><span>AI 学习路径 2.0 版本正式上线</span></div>
            <div class="notice-item"><span class="notice-dot"></span><span>春日学习季活动开始报名</span></div>
            <div class="notice-item"><span class="notice-dot"></span><span>新增 50+ 精品微课资源</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 课程分类 -->
    <section class="category-section">
      <div class="section-header">
        <h2><span class="accent-bar"></span>课程分类</h2>
        <router-link to="/courses" class="more-link">全部分类 →</router-link>
      </div>
      <div class="category-grid">
        <router-link to="/courses" class="category-item" v-for="cat in categories" :key="cat.name">
          <div class="category-icon" :style="{ background: cat.gradient }">{{ cat.icon }}</div>
          <div class="category-name">{{ cat.name }}</div>
          <div class="category-count">{{ cat.count }} 课程</div>
        </router-link>
      </div>
    </section>

    <!-- 精品推荐课程 -->
    <section class="courses-section">
      <div class="section-header">
        <h2><span class="accent-bar"></span>🔥 精品推荐课程</h2>
        <router-link to="/courses" class="more-link">查看全部 →</router-link>
      </div>
      <div class="course-grid">
        <router-link to="/courses" class="course-card" v-for="course in recommendedCourses" :key="course.id">
          <div class="course-cover" :style="{ background: course.gradient }">
            <div class="course-cover-inner">
              <div class="course-cover-icon">{{ course.icon }}</div>
              <div class="course-cover-label">{{ course.category }}</div>
            </div>
            <span class="course-tag" :class="course.tagType">{{ course.tag }}</span>
          </div>
          <div class="course-info">
            <div class="course-title">{{ course.title }}</div>
            <div class="course-meta">
              <span>{{ course.instructor }}</span>
              <span>⭐ {{ course.rating }}</span>
            </div>
            <div class="course-bottom">
              <div class="course-price" :class="{ free: course.price === '免费' }">{{ course.price }}</div>
              <div class="course-students">👥 {{ course.students }}</div>
            </div>
          </div>
        </router-link>
      </div>
    </section>

    <!-- AI 学习路径 -->
    <section class="ai-section">
      <div class="ai-inner">
        <div class="ai-text">
          <h2>🧠 AI 智能学习路径</h2>
          <p>基于先进的 AI 算法，分析你的知识图谱、学习偏好和职业目标，自动生成最适合你的学习路径。智能推荐课程、调整节奏、追踪进度，让学习更高效。</p>
          <router-link to="/learning-path/generate" class="ai-btn">🚀 免费生成我的学习路径</router-link>
        </div>
        <div class="ai-features">
          <div class="ai-feature-card">
            <div class="ai-feature-icon">🎯</div>
            <h4>精准评估</h4>
            <p>AI 多维度能力测评，定位知识盲区</p>
          </div>
          <div class="ai-feature-card">
            <div class="ai-feature-icon">🗺️</div>
            <h4>智能规划</h4>
            <p>个性化学习路径，科学安排学习节奏</p>
          </div>
          <div class="ai-feature-card">
            <div class="ai-feature-icon">📊</div>
            <h4>实时追踪</h4>
            <p>全程数据监控，动态调整学习计划</p>
          </div>
          <div class="ai-feature-card">
            <div class="ai-feature-icon">💡</div>
            <h4>AI 助教</h4>
            <p>7×24 小时智能答疑，随时解决困惑</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门学习路径 -->
    <section class="paths-section">
      <div class="section-header">
        <h2><span class="accent-bar"></span>热门学习路径</h2>
        <router-link to="/learning-path/generate" class="more-link">自定义路径 →</router-link>
      </div>
      <div class="paths-grid">
        <LearningPathCard v-for="path in popularPaths" :key="path.id" :path="path" @click="handlePathClick(path.id)" />
      </div>
    </section>

    <!-- 明星老师 -->
    <section class="teachers-section">
      <div class="section-header">
        <h2><span class="accent-bar amber-bar"></span>🌟 明星师资</h2>
        <router-link to="/star-teachers" class="more-link">查看全部 →</router-link>
      </div>
      <StarTeachers />
    </section>

    <!-- 学习社区 -->
    <section class="community-section">
      <div class="section-header">
        <h2><span class="accent-bar"></span>精选学习推文</h2>
        <div class="section-actions">
          <router-link to="/tweets/publish" class="btn-primary btn-sm">📝 发布</router-link>
          <router-link to="/tweets" class="more-link">查看全部 →</router-link>
        </div>
      </div>
      <div class="community-card">
        <TweetCard v-for="tweet in featuredTweets" :key="tweet.id" :tweet="tweet" />
      </div>
    </section>

    <!-- 会员特权 -->
    <section class="membership-section">
      <div class="section-header">
        <h2><span class="accent-bar purple-bar"></span>会员特权</h2>
        <router-link to="/membership" class="more-link">查看详情 →</router-link>
      </div>
      <div class="membership-grid">
        <router-link to="/membership" class="member-card">
          <div class="member-header">
            <div class="member-icon" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">⭐</div>
            <div>
              <h3>白银会员</h3>
              <p>¥29/月起</p>
            </div>
          </div>
          <ul class="member-features">
            <li><i class="fa fa-check text-blue-500 mr-2" />每日20次生成</li>
            <li><i class="fa fa-check text-blue-500 mr-2" />优先技术支持</li>
            <li><i class="fa fa-check text-blue-500 mr-2" />学习数据分析</li>
          </ul>
        </router-link>
        <router-link to="/membership" class="member-card featured">
          <div class="member-badge">推荐</div>
          <div class="member-header">
            <div class="member-icon" style="background:linear-gradient(135deg,#6366f1,#a855f7)">👑</div>
            <div>
              <h3>黄金会员</h3>
              <p>¥99/月起</p>
            </div>
          </div>
          <ul class="member-features">
            <li><i class="fa fa-check text-indigo-500 mr-2" />无限次生成</li>
            <li><i class="fa fa-check text-indigo-500 mr-2" />专属客服支持</li>
            <li><i class="fa fa-check text-indigo-500 mr-2" />高级AI模型</li>
            <li><i class="fa fa-check text-indigo-500 mr-2" />优先功能体验</li>
          </ul>
        </router-link>
        <router-link to="/membership" class="member-card">
          <div class="member-header">
            <div class="member-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">🎁</div>
            <div>
              <h3>限时优惠</h3>
              <p>最高8折</p>
            </div>
          </div>
          <ul class="member-features">
            <li><i class="fa fa-check text-amber-500 mr-2" />年度套餐8折</li>
            <li><i class="fa fa-check text-amber-500 mr-2" />半年套餐8.5折</li>
            <li><i class="fa fa-check text-amber-500 mr-2" />季度套餐9折</li>
          </ul>
        </router-link>
      </div>
    </section>

    <!-- 角色入口 -->
    <section class="roles-section">
      <div class="section-header">
        <h2><span class="accent-bar"></span>🎭 角色专属工作台</h2>
      </div>
      <div class="roles-grid">
        <router-link to="/teacher" class="role-card">
          <div class="role-icon">🧑‍🏫</div>
          <h3>教师工作台</h3>
          <p>管理班级、课程、学生，查看教学数据报表</p>
          <span class="role-btn">进入 →</span>
        </router-link>
        <router-link to="/parent" class="role-card">
          <div class="role-icon">👪</div>
          <h3>家长监控台</h3>
          <p>实时查看孩子学习进度、成绩和老师消息</p>
          <span class="role-btn">进入 →</span>
        </router-link>
        <router-link to="/student" class="role-card">
          <div class="role-icon">🎒</div>
          <h3>学生学习台</h3>
          <p>查看任务、排行榜、成就徽章和错题复习</p>
          <span class="role-btn">进入 →</span>
        </router-link>
      </div>
    </section>

    <!-- 底部 -->
    <footer class="home-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="footer-logo-icon">智</div>
            <span>智学AI</span>
          </div>
          <p>智学AI是国内领先的 AI 驱动智慧学习平台，致力于为每一位学习者提供个性化的学习体验，让学习更高效、更有趣。</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>课程中心</h4>
            <a href="#">编程开发</a><a href="#">人工智能</a><a href="#">考证应试</a>
          </div>
          <div class="footer-col">
            <h4>学习工具</h4>
            <a href="#">AI 学习路径</a><a href="#">智能题库</a><a href="#">学习社区</a>
          </div>
          <div class="footer-col">
            <h4>关于我们</h4>
            <a href="#">公司介绍</a><a href="#">讲师入驻</a><a href="#">常见问题</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">© 2026 智学AI · AI 驱动的个性化智慧学习平台</div>
    </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TweetCard from '@/components/business/TweetCard.vue';
import LearningPathCard from '@/components/business/LearningPathCard.vue';
import StarTeachers from '@/views/StarTeachers.vue';
import NameAvatar from '@/components/common/NameAvatar.vue';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

// 登录后自动重定向到对应角色工作台
onMounted(() => {
  if (userStore.isLogin) {
    const role = userStore.userRole;
    console.log('Home已挂载，当前推断角色:', role);
    if (role === 'parent') {
      window.location.href = '/parent';
    } else if (role === 'teacher') {
      window.location.href = '/teacher';
    } else {
      window.location.href = '/student';
    }
  }
});

const categories = ref([
  { name: '编程开发', icon: '💻', count: '1,280+', gradient: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  { name: '考证应试', icon: '📝', count: '960+', gradient: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
  { name: '考研考博', icon: '🎓', count: '750+', gradient: 'linear-gradient(135deg,#fce7f3,#fbcfe8)' },
  { name: '职业技能', icon: '💼', count: '620+', gradient: 'linear-gradient(135deg,#ecfdf5,#a7f3d0)' },
  { name: '语言学习', icon: '🌍', count: '540+', gradient: 'linear-gradient(135deg,#f3e8ff,#ddd6fe)' },
  { name: '设计创意', icon: '🎨', count: '380+', gradient: 'linear-gradient(135deg,#cffafe,#a5f3fc)' },
  { name: '数据科学', icon: '📊', count: '420+', gradient: 'linear-gradient(135deg,#fff1f2,#fecdd3)' },
  { name: '人工智能', icon: '🤖', count: '310+', gradient: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
  { name: '产品运营', icon: '📱', count: '280+', gradient: 'linear-gradient(135deg,#fef9c3,#fef08a)' },
  { name: '更多分类', icon: '📖', count: '查看全部', gradient: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)' },
]);

const recommendedCourses = ref([
  { id: 1, title: 'Python 全栈开发实战：从入门到企业级项目', instructor: '张教授', rating: 4.9, students: '12,680', price: '¥199', icon: '🐍', category: 'Python', gradient: 'linear-gradient(135deg,#1e40af,#7c3aed)', tag: '🔥 热门', tagType: 'hot' },
  { id: 2, title: 'ChatGPT 大模型实战：Prompt 工程 & Agent 开发', instructor: '李博士', rating: 4.8, students: '8,520', price: '¥299', icon: '🤖', category: 'AI', gradient: 'linear-gradient(135deg,#059669,#06b6d4)', tag: '✨ 新课', tagType: 'new' },
  { id: 3, title: 'Java 高级工程师面试通关指南（大厂真题）', instructor: '王老师', rating: 4.9, students: '15,320', price: '¥168', icon: '☕', category: 'Java', gradient: 'linear-gradient(135deg,#dc2626,#f97316)', tag: '🔥 热门', tagType: 'hot' },
  { id: 4, title: 'Figma + AI 设计工作流：零基础到高级 UI 设计师', instructor: '陈设计师', rating: 4.7, students: '6,800', price: '免费', icon: '🎨', category: '设计', gradient: 'linear-gradient(135deg,#7c3aed,#ec4899)', tag: '👑 VIP', tagType: 'vip' },
  { id: 5, title: 'Vue3 + TypeScript 企业级实战（含组件库开发）', instructor: '刘工', rating: 4.8, students: '9,460', price: '¥258', icon: '⚛️', category: '前端', gradient: 'linear-gradient(135deg,#2563eb,#0ea5e9)', tag: '✨ 新课', tagType: 'new' },
  { id: 6, title: '数据分析入门：Excel + SQL + Python 三合一', instructor: '赵老师', rating: 4.9, students: '22,100', price: '免费', icon: '📈', category: '数据', gradient: 'linear-gradient(135deg,#16a34a,#65a30d)', tag: '🆓 免费', tagType: 'free' },
  { id: 7, title: '2027 考研数学精讲：高数+线代+概率统计', instructor: '孙教授', rating: 4.9, students: '31,500', price: '¥388', icon: '🧮', category: '考研', gradient: 'linear-gradient(135deg,#be123c,#f59e0b)', tag: '🔥 热门', tagType: 'hot' },
  { id: 8, title: '云原生架构师：K8s + Docker + 微服务实战', instructor: '周工', rating: 4.8, students: '5,230', price: '¥458', icon: '☁️', category: '运维', gradient: 'linear-gradient(135deg,#0891b2,#8b5cf6)', tag: '👑 VIP', tagType: 'vip' },
]);

const featuredTweets = ref([
  {
    id: 1,
    author: { name: '前端开发工程师', avatar: 'https://picsum.photos/seed/t1/100/100', username: 'frontend_dev' },
    content: '分享一个Vue 3性能优化的小技巧：使用defineProps和defineEmits替代setup函数中的props和emits，配合Teleport和Suspense可以大幅提升大型项目的渲染性能～ #Vue3 #前端开发',
    images: ['https://picsum.photos/seed/t1img/600/400'], likes: 238, comments: 45, shares: 32, createTime: '2小时前',
  },
  {
    id: 2,
    author: { name: '英语学习达人', avatar: 'https://picsum.photos/seed/t2/100/100', username: 'english_master' },
    content: '四级备考30天计划分享：前10天主攻词汇和语法，中间10天强化听力和阅读，最后10天集中刷真题和作文模板。推荐使用扇贝单词和每日英语听力APP，亲测有效！#英语四级',
    likes: 562, comments: 89, shares: 125, createTime: '昨天',
  },
  {
    id: 3,
    author: { name: 'Python工程师', avatar: 'https://picsum.photos/seed/t3/100/100', username: 'py_dev' },
    content: '用Python写了个自动化脚本，批量处理Excel数据，从每天2小时变成10秒！附上核心代码片段👇 #Python #自动化 #效率',
    images: ['https://picsum.photos/seed/t3img/600/400'], likes: 1024, comments: 156, shares: 280, createTime: '3小时前',
  },
]);

const popularPaths = ref([
  { id: 1, title: '30天计算机一级考试通关', description: '针对计算机一级考试的专项训练，涵盖Windows操作、Office办公软件、网络基础等核心考点', totalDays: 30, difficulty: 'easy', students: 5820, cover: 'https://picsum.photos/600/338?random=20' },
  { id: 2, title: '45天英语四级高效备考', description: '从词汇、听力、阅读、写作四个维度系统提升，配套真题训练和作文模板', totalDays: 45, difficulty: 'medium', students: 9340, cover: 'https://picsum.photos/600/338?random=21' },
  { id: 3, title: '60天Vue3+Vite实战开发', description: '从Vue3基础语法到企业级项目开发，掌握Composition API、Pinia、路由守卫等核心技能', totalDays: 60, difficulty: 'hard', students: 3760, cover: 'https://picsum.photos/600/338?random=22' },
  { id: 4, title: 'Web全栈开发工程师路径', description: '从HTML/CSS/JavaScript基础到React+Node.js全栈开发，构建完整的Web应用开发能力', totalDays: 90, difficulty: 'hard', students: 7450, cover: 'https://picsum.photos/600/338?random=23' },
]);

const handlePathClick = pathId => {
  router.push(`/learning-path/template/${pathId}`);
};
</script>

<style scoped>
/* ── 页面容器 ── */
.home-page {
  min-height: calc(100vh - 160px);
  background: var(--bg-base);
}
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ── Hero Banner ── */
.hero-section {
  padding: 24px 0 40px;
}
.hero-inner {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}
.hero-main {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 360px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
}
.hero-slide {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  display: flex;
  align-items: center;
}
.hero-content {
  padding: 48px;
  color: white;
  max-width: 600px;
}
.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
  border: 1px solid rgba(255,255,255,0.2);
}
.hero-title {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 12px;
}
.hero-title-highlight {
  background: linear-gradient(90deg, #93c5fd, #c4b5fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-desc {
  font-size: 15px;
  opacity: 0.9;
  margin-bottom: 24px;
  line-height: 1.8;
}
.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}
.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  background: white;
  color: #2563eb;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transition: all 0.2s;
  text-decoration: none;
}
.hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.2); }
.hero-btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  background: rgba(255,255,255,0.15);
  color: white;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(4px);
  transition: all 0.2s;
  text-decoration: none;
}
.hero-btn-secondary:hover { background: rgba(255,255,255,0.25); }
.hero-stats {
  display: flex;
  gap: 32px;
}
.hero-stat { text-align: center; }
.hero-stat-num { font-size: 24px; font-weight: 800; }
.hero-stat-label { font-size: 12px; opacity: 0.75; }

/* ── 右侧面板 ── */
.hero-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.side-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.05);
}
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
}
.side-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.side-user-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.side-user-level { font-size: 12px; color: var(--text-muted); }
.stat-card { flex: 1; }
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
.stat-row + .stat-row { border-top: 1px solid #f3f4f6; }
.stat-label { font-size: 13px; color: var(--text-secondary); }
.stat-value { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.stat-value.blue { color: #3b82f6; }
.stat-value.green { color: #22c55e; }
.stat-value.orange { color: #f97316; }
.notice-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.notice-item {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.notice-item:hover { color: #3b82f6; }
.notice-dot { width: 4px; height: 4px; background: #93c5fd; border-radius: 50%; flex-shrink: 0; }

/* ── Section 公共 ── */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.accent-bar {
  display: block;
  width: 4px;
  height: 22px;
  background: #3b82f6;
  border-radius: 2px;
}
.amber-bar { background: #f59e0b; }
.purple-bar { background: #6366f1; }
.more-link {
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}
.more-link:hover { color: #3b82f6; }
.section-actions { display: flex; align-items: center; gap: 12px; }

/* ── 课程分类 ── */
.category-section { padding: 40px 0; }
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.25s;
  text-decoration: none;
  background: white;
}
.category-item:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: #93c5fd; }
.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.3s;
}
.category-item:hover .category-icon { transform: scale(1.1); }
.category-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.category-count { font-size: 11px; color: var(--text-muted); }

/* ── 精品课程 ── */
.courses-section { padding: 40px 0; background: white; border-radius: 16px; margin-bottom: 24px; }
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s;
  cursor: pointer;
  text-decoration: none;
  display: block;
}
.course-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: #93c5fd; }
.course-cover { position: relative; height: 140px; overflow: hidden; }
.course-cover-inner { padding: 28px; color: white; }
.course-cover-icon { font-size: 40px; margin-bottom: 8px; }
.course-cover-label { font-size: 12px; opacity: 0.85; }
.course-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}
.course-tag.hot { background: rgba(239,68,68,0.85); }
.course-tag.new { background: rgba(99,102,241,0.85); }
.course-tag.free { background: rgba(34,197,94,0.85); }
.course-tag.vip { background: linear-gradient(135deg, #f97316, #eab308); }
.course-info { padding: 14px; }
.course-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.course-card:hover .course-title { color: #3b82f6; }
.course-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.course-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #f3f4f6; }
.course-price { font-size: 18px; font-weight: 700; color: #ef4444; }
.course-price.free { color: #22c55e; font-size: 14px; }
.course-students { font-size: 12px; color: var(--text-muted); }

/* ── AI Section ── */
.ai-section {
  padding: 48px 0;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  border-radius: 16px;
  color: white;
  position: relative;
  overflow: hidden;
  margin: 40px 0;
}
.ai-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.ai-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  position: relative;
  z-index: 2;
  padding: 0 40px;
}
.ai-text h2 { font-size: 26px; font-weight: 800; margin-bottom: 14px; }
.ai-text p { font-size: 14px; opacity: 0.85; margin-bottom: 24px; line-height: 1.8; }
.ai-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: #2563eb;
  padding: 12px 28px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transition: all 0.2s;
  text-decoration: none;
}
.ai-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.ai-features { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ai-feature-card {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 18px;
  transition: all 0.3s;
}
.ai-feature-card:hover { background: rgba(255,255,255,0.18); transform: translateY(-2px); }
.ai-feature-icon { font-size: 26px; margin-bottom: 8px; }
.ai-feature-card h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.ai-feature-card p { font-size: 12px; opacity: 0.7; margin-bottom: 0; line-height: 1.5; }

/* ── 学习路径 ── */
.paths-section { padding: 40px 0; }
.paths-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

/* ── 老师板块 ── */
.teachers-section { padding: 40px 0; }

/* ── 社区 ── */
.community-section { padding: 40px 0; }
.community-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.05);
}

/* ── 会员 ── */
.membership-section { padding: 40px 0; }
.membership-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.member-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}
.member-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.member-card.featured { border: 2px solid #6366f1; }
.member-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  font-size: 11px;
  padding: 2px 12px;
  border-radius: 0 0 0 8px;
  font-weight: 600;
}
.member-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.member-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}
.member-header h3 { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.member-header p { font-size: 13px; color: var(--text-muted); }
.member-features { list-style: none; }
.member-features li { font-size: 13px; color: var(--text-secondary); padding: 4px 0; display: flex; align-items: center; }

/* ── 角色入口 ── */
.roles-section { padding: 40px 0; }
.roles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.role-card {
  background: white;
  border-radius: 12px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s;
  text-decoration: none;
}
.role-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.role-icon { font-size: 42px; margin-bottom: 12px; }
.role-card h3 { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.role-card p { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6; }
.role-btn {
  display: inline-block;
  padding: 8px 24px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}
.role-card:hover .role-btn { box-shadow: 0 4px 16px rgba(59,130,246,0.3); }

/* ── Footer ── */
.home-footer {
  margin-top: 48px;
  padding: 40px 0 0;
  background: #111827;
  color: #9ca3af;
  border-radius: 16px 16px 0 0;
}
.footer-inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.footer-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 14px;
}
.footer-logo span { color: white; font-weight: 700; font-size: 16px; }
.footer-brand p { font-size: 13px; line-height: 1.8; }
.footer-col h4 { color: white; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.footer-col a { display: block; font-size: 13px; color: #9ca3af; text-decoration: none; padding: 3px 0; transition: color 0.2s; }
.footer-col a:hover { color: #60a5fa; }
.footer-bottom { padding: 16px 0; text-align: center; font-size: 12px; color: #6b7280; }

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .hero-inner { grid-template-columns: 1fr; }
  .hero-side { display: none; }
  .course-grid { grid-template-columns: repeat(2, 1fr); }
  .category-grid { grid-template-columns: repeat(5, 1fr); }
  .ai-inner { grid-template-columns: 1fr; gap: 24px; }
  .paths-grid { grid-template-columns: repeat(2, 1fr); }
  .membership-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-inner { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .course-grid { grid-template-columns: 1fr; }
  .ai-features { grid-template-columns: 1fr; }
  .roles-grid { grid-template-columns: 1fr; }
  .membership-grid { grid-template-columns: 1fr; }
}
</style>
