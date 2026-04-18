<template>
  <div class="parent-dashboard">
    <!-- 顶部孩子信息卡 -->
    <div class="child-hero">
      <img :src="child.avatar" class="child-avatar" />
      <div class="child-info">
        <div class="child-name">{{ child.name }} <span class="child-grade">{{ child.grade }}</span></div>
        <div class="child-school">{{ child.school }}</div>
        <div class="child-tags">
          <span v-for="tag in child.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
      <div class="checkin-status">
        <div class="checkin-icon">{{ child.checkedIn ? '✅' : '⏳' }}</div>
        <div class="checkin-label">{{ child.checkedIn ? '今日已打卡' : '今日未打卡' }}</div>
        <div class="checkin-time">{{ child.checkinTime }}</div>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stats-row">
      <div class="stat-item" v-for="s in stats" :key="s.label">
        <div class="stat-v">{{ s.value }}</div>
        <div class="stat-l">{{ s.label }}</div>
      </div>
    </div>

    <div class="main-grid">
      <!-- 左：学习记录 + 成绩报告 -->
      <div class="col-left">
        <!-- 学习记录 -->
        <section class="panel">
          <div class="panel-header">
            <h3>📖 近期学习记录</h3>
          </div>
          <div class="learning-records">
            <div class="record-item" v-for="rec in learningRecords" :key="rec.id">
              <img :src="rec.image" class="rec-img" />
              <div class="rec-info">
                <div class="rec-subject">{{ rec.subject }}</div>
                <div class="rec-title">{{ rec.title }}</div>
                <div class="rec-meta">
                  <span>⏱ {{ rec.duration }}分钟</span>
                  <span>📅 {{ rec.date }}</span>
                </div>
              </div>
              <div class="rec-score" :class="rec.score >= 90 ? 'high' : rec.score >= 70 ? 'mid' : 'low'">
                {{ rec.score }}分
              </div>
            </div>
          </div>
        </section>

        <!-- 成绩报告 -->
        <section class="panel">
          <div class="panel-header">
            <h3>📊 成绩报告</h3>
          </div>
          <div class="grade-cards">
            <div class="grade-card" v-for="gr in gradeReports" :key="gr.subject">
              <div class="grade-subject">{{ gr.icon }} {{ gr.subject }}</div>
              <div class="grade-score">{{ gr.score }}</div>
              <div class="grade-rank">班级第 {{ gr.rank }} 名</div>
              <div class="grade-bar">
                <div class="grade-fill" :style="{ width: gr.score + '%', background: gr.color }" />
              </div>
              <div class="grade-trend">{{ gr.trend }}</div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右：老师消息 + 学习进度 -->
      <div class="col-right">
        <!-- 今日学习计划 -->
        <section class="panel">
          <div class="panel-header">
            <h3>📅 今日学习计划</h3>
            <span class="plan-date">{{ todayStr }}</span>
          </div>
          <div class="plan-list">
            <div class="plan-item" v-for="plan in todayPlan" :key="plan.id" :class="{ done: plan.done }">
              <div class="plan-time">{{ plan.time }}</div>
              <div class="plan-body">
                <div class="plan-name">{{ plan.name }}</div>
                <div class="plan-sub">{{ plan.teacher }} · {{ plan.duration }}</div>
              </div>
              <div class="plan-status">{{ plan.done ? '✅' : '📝' }}</div>
            </div>
          </div>
        </section>

        <!-- 老师消息 -->
        <section class="panel messages-panel">
          <div class="panel-header">
            <h3>💬 老师消息</h3>
            <span class="unread-badge">{{ messages.filter(m => !m.read).length }} 条未读</span>
          </div>
          <div class="msg-list">
            <div class="msg-item" v-for="msg in messages" :key="msg.id" :class="{ unread: !msg.read }">
              <img :src="msg.teacherAvatar" class="msg-avatar" />
              <div class="msg-body">
                <div class="msg-header">
                  <span class="msg-teacher">{{ msg.teacher }}</span>
                  <span class="msg-time">{{ msg.time }}</span>
                </div>
                <div class="msg-text">{{ msg.content }}</div>
                <div class="msg-subject-tag">{{ msg.subject }}</div>
              </div>
              <div v-if="!msg.read" class="unread-dot" />
            </div>
          </div>
          <div class="panel-footer">
            <button class="btn-full-outline" @click="contactAllTeachers">联系所有任课老师</button>
          </div>
        </section>

        <!-- 家长课堂 -->
        <section class="panel education-panel">
          <div class="panel-header">
            <h3>🎓 家长教育课堂</h3>
            <router-link to="/parent-classroom" class="more-link">进入课堂</router-link>
          </div>
          <div class="edu-list">
            <div
              v-for="item in parentEducation"
              :key="item.id"
              class="edu-item cursor-pointer hover:border-primary/40 transition-all"
              @click="router.push('/parent-classroom')"
            >
              <div class="edu-icon">{{ item.icon }}</div>
              <div class="edu-info">
                <div class="edu-title">{{ item.title }}</div>
                <div class="edu-desc">{{ item.desc }}</div>
              </div>
              <i class="fa fa-chevron-right text-gray-300" />
            </div>
          </div>
        </section>

        <!-- 推荐导师 -->
        <section class="panel tutor-panel">
          <div class="panel-header">
            <h3>🌟 AI 智能导师推荐</h3>
            <div class="flex items-center gap-2">
              <button 
                class="text-xs bg-blue-600/10 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                @click="refreshTutors"
              >
                <i class="fa fa-sync-alt" :class="{ 'fa-spin': isRefreshingTutors }"></i> 换一批
              </button>
              <router-link to="/star-teachers" class="more-link">查看全部</router-link>
            </div>
          </div>
          <div class="p-4 mb-4 bg-primary/5 rounded-xl border border-primary/10">
            <p class="text-xs text-primary font-medium mb-1">💡 智能分析：</p>
            <p class="text-[11px] text-gray-500 leading-relaxed">
              基于孩子在“{{ learningRecords[0]?.subject }}”模块的 {{ learningRecords[0]?.score }} 分表现，我们为您匹配了具备“{{ learningRecords[0]?.subject === '数学' ? '逻辑强化' : '编程进阶' }}”专长的导师。
            </p>
          </div>
          <div class="tutor-list">
            <div class="tutor-item" v-for="tutor in recommendedTutors" :key="tutor.id">
              <img :src="tutor.avatar" class="tutor-avatar" />
              <div class="tutor-info">
                <div class="tutor-name">{{ tutor.name }}</div>
                <div class="tutor-tags">
                  <span v-for="tag in tutor.tags" :key="tag" class="tutor-tag">{{ tag }}</span>
                </div>
              </div>
              <button class="btn-consult" @click="consultTutor(tutor)">咨询</button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 底部功能入口 -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        class="feature-card group cursor-pointer"
        @click="router.push('/parent/report')"
      >
        <div class="card-icon bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white">
          <i class="fa fa-file-invoice" />
        </div>
        <div class="card-text">
          <h4>深度月度报告</h4>
          <p>全方位分析孩子本月的进步与不足</p>
        </div>
      </div>
      <div
        class="feature-card group cursor-pointer"
        @click="router.push('/tweets')"
      >
        <div class="card-icon bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white">
          <i class="fa fa-users" />
        </div>
        <div class="card-text">
          <h4>家校互动社区</h4>
          <p>与其他家长和老师交流教育心得</p>
        </div>
      </div>
      <div
        class="feature-card group cursor-pointer"
        @click="router.push('/user/center')"
      >
        <div class="card-icon bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white">
          <i class="fa fa-cog" />
        </div>
        <div class="card-text">
          <h4>账号与孩子设置</h4>
          <p>管理绑定的孩子信息与接收通知偏好</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const router = useRouter();

const profile = computed(() => ({
  name: userStore.userInfo?.username || '家长',
  avatar: userStore.userInfo?.avatar || 'https://picsum.photos/seed/parent/200/200',
}));

const child = ref({
  name: '王小明',
  grade: '初三(2)班',
  school: '北京第一实验中学',
  avatar: 'https://picsum.photos/seed/child1/80/80',
  tags: ['数学优秀', '编程达人', '阅读之星'],
  checkedIn: true,
  checkinTime: '08:12 到校',
});

const stats = ref([
  { label: '本月学习', value: '124h' },
  { label: '完成任务', value: '38' },
  { label: '平均成绩', value: '88.5' },
  { label: '获得徽章', value: '12' },
  { label: '排名', value: '#5' },
]);

const learningRecords = ref([
  { id: 1, subject: '数学', title: '二次函数图像与性质', duration: 45, date: '今天', score: 92, image: 'https://picsum.photos/seed/math1/64/48' },
  { id: 2, subject: 'Python', title: '列表推导式与生成器', duration: 60, date: '今天', score: 88, image: 'https://picsum.photos/seed/py1/64/48' },
  { id: 3, subject: '英语', title: '阅读理解：科技专题', duration: 30, date: '昨天', score: 76, image: 'https://picsum.photos/seed/eng1/64/48' },
]);

const gradeReports = ref([
  { subject: '数学', icon: '📐', score: 94, rank: 3, trend: '↑2名', color: '#00f2ff' },
  { subject: '英语', icon: '🌍', score: 82, rank: 8, trend: '→持平', color: '#7209b7' },
]);

const todayStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

const todayPlan = ref([
  { id: 1, time: '07:30', name: '英语晨读', teacher: '李老师', duration: '30分钟', done: true },
  { id: 2, time: '08:00', name: '数学第7章练习', teacher: '王老师', duration: '45分钟', done: true },
]);

const messages = ref([
  { id: 1, teacher: '张老师', subject: 'Python', content: '小明今天的课堂表现非常出色，积极回答问题！', time: '09:23', read: false, teacherAvatar: 'https://picsum.photos/seed/teacher1/36/36' },
  { id: 2, teacher: '王老师', subject: '数学', content: '期中考试临近，请督促孩子复习第5-8章重点内容。', time: '昨天', read: false, teacherAvatar: 'https://picsum.photos/seed/teacher2/36/36' },
]);

const parentEducation = ref([
  { id: 1, icon: '💡', title: '如何培养孩子的编程兴趣？', desc: '从兴趣出发，让孩子爱上逻辑思考' },
  { id: 2, icon: '🛡️', title: '网络安全教育：引导孩子正确上网', desc: '建立健康的上网习惯，识别网络风险' },
]);

const recommendedTutors = ref([
  { id: 1, name: '李明哲', avatar: 'https://ui-avatars.com/api/?name=李明哲&background=6366f1&color=fff', tags: ['前端架构', '耐心细致'] },
]);

const isRefreshingTutors = ref(false);
const refreshTutors = () => {
  isRefreshingTutors.value = true;
  // 模拟 API 调用
  setTimeout(() => {
    const tutorsPool = [
      { id: 1, name: '李明哲', avatar: 'https://ui-avatars.com/api/?name=李明哲&background=6366f1&color=fff', tags: ['前端架构', '耐心细致'] },
      { id: 2, name: '张婉如', avatar: 'https://ui-avatars.com/api/?name=张婉如&background=ec4899&color=fff', tags: ['心理疏导', '升学规划'] },
      { id: 3, name: '王浩然', avatar: 'https://ui-avatars.com/api/?name=王浩然&background=10b981&color=fff', tags: ['算法竞赛', '严谨治学'] },
    ];
    // 随机选一个
    const random = Math.floor(Math.random() * tutorsPool.length);
    recommendedTutors.value = [tutorsPool[random]];
    isRefreshingTutors.value = false;
    ElMessage.success('已根据孩子最新进度重新匹配导师');
  }, 1000);
};

const contactAllTeachers = () => {
  router.push('/contact-teachers');
};

const consultTutor = (tutor) => {
  router.push({
    path: '/contact-teachers',
    query: { teacherId: tutor.id, teacherName: tutor.name }
  });
};
</script>

<style scoped>
.parent-dashboard {
  padding: 24px;
  background: var(--bg-base);
  min-height: 100vh;
  color: var(--text-primary);
}

.child-hero {
  background: linear-gradient(135deg, var(--primary-soft), var(--accent-soft));
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-xl);
  padding: 26px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}
.child-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--accent);
}
.child-name { font-size: 20px; font-weight: 700; }
.child-grade { font-size: 13px; color: var(--accent); margin-left: 8px; }
.child-school { font-size: 13px; color: var(--text-secondary); }
.child-tags { display: flex; gap: 8px; margin-top: 8px; }
.tag {
  background: var(--primary-soft);
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
}
.checkin-status { margin-left: auto; text-align: center; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.stat-item {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
}
.stat-v { font-size: 20px; font-weight: 700; color: var(--accent); }
.stat-l { font-size: 11px; color: var(--text-muted); }

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}
.col-left, .col-right { display: flex; flex-direction: column; gap: 20px; }

.panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 22px;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel-header h3 { font-size: 15px; font-weight: 700; }

.learning-records { display: flex; flex-direction: column; gap: 12px; }
.record-item { display: flex; align-items: center; gap: 12px; }
.rec-img { width: 64px; height: 48px; border-radius: 4px; object-fit: cover; }
.rec-info { flex: 1; }
.rec-subject { font-size: 12px; color: var(--accent); }
.rec-title { font-size: 14px; font-weight: 600; }
.rec-meta { font-size: 11px; color: var(--text-muted); }
.rec-score { font-weight: 700; }
.rec-score.high { color: var(--success); }

.grade-cards { display: flex; flex-direction: column; gap: 12px; }
.grade-card { padding: 12px; border: 1px solid var(--border); border-radius: 8px; }
.grade-bar { height: 6px; background: var(--bg-base); border-radius: 3px; margin: 8px 0; }
.grade-fill { height: 100%; border-radius: 3px; }

.plan-list { display: flex; flex-direction: column; gap: 12px; }
.plan-item { display: flex; align-items: center; gap: 12px; }
.plan-time { font-size: 12px; color: var(--text-muted); }
.plan-body { flex: 1; }

.msg-list { display: flex; flex-direction: column; gap: 12px; }
.msg-item { display: flex; gap: 12px; }
.msg-avatar { width: 36px; height: 36px; border-radius: 50%; }
.msg-body { flex: 1; }
.msg-header { display: flex; justify-content: space-between; }
.msg-teacher { font-weight: 600; }
.msg-text { font-size: 13px; color: var(--text-secondary); }

.unread-badge { background: var(--danger-soft); color: var(--danger); padding: 2px 8px; border-radius: 10px; font-size: 11px; }

.btn-full-outline { width: 100%; padding: 10px; border: 1px solid var(--primary); color: var(--primary); border-radius: 8px; cursor: pointer; background: transparent; }

.edu-list { display: flex; flex-direction: column; gap: 12px; }
.edu-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; }
.edu-icon { font-size: 24px; }
.edu-info { flex: 1; }
.edu-title { font-size: 14px; font-weight: 600; }
.edu-desc { font-size: 12px; color: var(--text-muted); }

.tutor-list { display: flex; flex-direction: column; gap: 12px; }
.tutor-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; }
.tutor-avatar { width: 44px; height: 44px; border-radius: 50%; }
.tutor-info { flex: 1; }
.tutor-tags { display: flex; gap: 4px; margin-top: 4px; }
.tutor-tag { font-size: 10px; background: var(--primary-soft); padding: 1px 6px; border-radius: 4px; }
.btn-consult { padding: 4px 12px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; }

.more-link { font-size: 12px; color: var(--primary); text-decoration: none; }

.feature-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}
.feature-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
}
.card-text h4 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.card-text p { font-size: 12px; color: var(--text-muted); }
</style>
