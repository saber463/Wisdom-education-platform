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
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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
  { id: 4, subject: '物理', title: '牛顿运动定律应用', duration: 50, date: '昨天', score: 95, image: 'https://picsum.photos/seed/phy1/64/48' },
  { id: 5, subject: '化学', title: '酸碱盐反应方程式', duration: 35, date: '前天', score: 68, image: 'https://picsum.photos/seed/chem1/64/48' },
  { id: 6, subject: '编程', title: '算法：动态规划入门', duration: 90, date: '前天', score: 91, image: 'https://picsum.photos/seed/algo1/64/48' },
  { id: 7, subject: '历史', title: '近代史：洋务运动', duration: 25, date: '3天前', score: 83, image: 'https://picsum.photos/seed/hist1/64/48' },
  { id: 8, subject: '地理', title: '中国地形与气候', duration: 40, date: '3天前', score: 79, image: 'https://picsum.photos/seed/geo1/64/48' },
  { id: 9, subject: '语文', title: '议论文写作技巧', duration: 55, date: '4天前', score: 87, image: 'https://picsum.photos/seed/chi1/64/48' },
  { id: 10, subject: '生物', title: '细胞分裂与遗传', duration: 45, date: '5天前', score: 94, image: 'https://picsum.photos/seed/bio1/64/48' },
]);

const gradeReports = ref([
  { subject: '数学', icon: '📐', score: 94, rank: 3, trend: '↑2名', color: '#00f2ff' },
  { subject: '英语', icon: '🌍', score: 82, rank: 8, trend: '→持平', color: '#7209b7' },
  { subject: '语文', icon: '📝', score: 88, rank: 5, trend: '↑1名', color: '#f72585' },
  { subject: '物理', icon: '⚡', score: 91, rank: 4, trend: '↑3名', color: '#4cc9f0' },
  { subject: '编程', icon: '💻', score: 97, rank: 1, trend: '↑2名', color: '#43aa8b' },
]);

const todayStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

const todayPlan = ref([
  { id: 1, time: '07:30', name: '英语晨读', teacher: '李老师', duration: '30分钟', done: true },
  { id: 2, time: '08:00', name: '数学第7章练习', teacher: '王老师', duration: '45分钟', done: true },
  { id: 3, time: '14:00', name: 'Python编程作业', teacher: '张老师', duration: '60分钟', done: false },
  { id: 4, time: '16:00', name: '物理实验报告', teacher: '陈老师', duration: '40分钟', done: false },
  { id: 5, time: '19:30', name: '英语阅读练习', teacher: '李老师', duration: '20分钟', done: false },
]);

const messages = ref([
  { id: 1, teacher: '张老师', subject: 'Python', content: '小明今天的课堂表现非常出色，积极回答问题！', time: '09:23', read: false, teacherAvatar: 'https://picsum.photos/seed/teacher1/36/36' },
  { id: 2, teacher: '王老师', subject: '数学', content: '期中考试临近，请督促孩子复习第5-8章重点内容。', time: '昨天', read: false, teacherAvatar: 'https://picsum.photos/seed/teacher2/36/36' },
  { id: 3, teacher: '李老师', subject: '英语', content: '作文已批改，整体不错，词汇量还需加强，可以多读英文原著。', time: '昨天', read: true, teacherAvatar: 'https://picsum.photos/seed/teacher3/36/36' },
  { id: 4, teacher: '陈老师', subject: '物理', content: '下周实验课请提前预习牛顿第二定律实验步骤。', time: '前天', read: true, teacherAvatar: 'https://picsum.photos/seed/teacher4/36/36' },
  { id: 5, teacher: '刘老师', subject: '化学', content: '今日作业有3题错误，已在系统中标注，请孩子今晚重做。', time: '前天', read: false, teacherAvatar: 'https://picsum.photos/seed/teacher5/36/36' },
  { id: 6, teacher: '赵老师', subject: '语文', content: '作文《我的梦想》写得很有深度，已推荐参加校刊投稿。', time: '3天前', read: true, teacherAvatar: 'https://picsum.photos/seed/teacher6/36/36' },
  { id: 7, teacher: '吴老师', subject: '历史', content: '近代史这一章比较重要，请孩子整理知识思维导图。', time: '3天前', read: true, teacherAvatar: 'https://picsum.photos/seed/teacher7/36/36' },
  { id: 8, teacher: '孙老师', subject: '生物', content: '下周实验：显微镜的使用，请准备好实验服。', time: '4天前', read: true, teacherAvatar: 'https://picsum.photos/seed/teacher8/36/36' },
  { id: 9, teacher: '周老师', subject: '地理', content: '地图作业画得很工整，地形分析准确！继续保持。', time: '4天前', read: true, teacherAvatar: 'https://picsum.photos/seed/teacher9/36/36' },
  { id: 10, teacher: '张老师', subject: '编程', content: '恭喜小明在本周算法竞赛中获得年级第1名！', time: '5天前', read: true, teacherAvatar: 'https://picsum.photos/seed/teacher10/36/36' },
]);
</script>

<style scoped>
.parent-dashboard {
  padding: 24px;
  background: var(--bg-base);
  min-height: 100vh;
  color: var(--text-primary);
}

/* 孩子卡 */
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
  box-shadow: var(--shadow-glow-accent);
}
.child-name { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.child-grade { font-size: 13px; color: var(--accent); margin-left: 8px; font-weight: 500; }
.child-school { font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
.child-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag {
  background: var(--primary-soft);
  border: 1px solid var(--border-accent);
  color: var(--primary-light);
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.checkin-status { margin-left: auto; text-align: center; }
.checkin-icon { font-size: 34px; margin-bottom: 4px; }
.checkin-label { font-size: 13px; color: var(--text-secondary); }
.checkin-time { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* 统计行 */
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
  transition: border-color 0.2s, transform 0.2s;
}
.stat-item:hover { border-color: var(--border-strong); transform: translateY(-2px); }
.stat-v { font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
.stat-l { font-size: 11px; color: var(--text-muted); }

/* 主网格 */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}
.col-left, .col-right { display: flex; flex-direction: column; gap: 20px; }

/* 面板通用 */
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
.panel-header h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.plan-date { font-size: 12px; color: var(--text-muted); }
.unread-badge {
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 600;
}

/* 学习记录 */
.learning-records { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; }
.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.rec-img { width: 62px; height: 46px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.rec-info { flex: 1; }
.rec-subject { font-size: 11px; color: var(--accent); font-weight: 600; margin-bottom: 2px; }
.rec-title { font-size: 13px; color: var(--text-primary); font-weight: 500; margin-bottom: 3px; }
.rec-meta { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); }
.rec-score { font-size: 15px; font-weight: 700; white-space: nowrap; }
.rec-score.high { color: var(--success); }
.rec-score.mid  { color: var(--warning); }
.rec-score.low  { color: var(--danger); }

/* 成绩卡 */
.grade-cards { display: flex; flex-direction: column; gap: 10px; }
.grade-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.grade-subject { width: 70px; font-size: 13px; color: var(--text-primary); font-weight: 600; }
.grade-score { width: 44px; font-size: 18px; font-weight: 700; color: var(--primary-light); }
.grade-rank { width: 80px; font-size: 11px; color: var(--text-muted); }
.grade-bar { flex: 1; height: 5px; background: var(--bg-base); border-radius: 3px; }
.grade-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
.grade-trend { width: 50px; text-align: right; font-size: 11px; color: var(--success); font-weight: 600; }

/* 今日计划 */
.plan-list { display: flex; flex-direction: column; gap: 10px; }
.plan-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent);
  border-top: 1px solid var(--border);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.plan-item.done { opacity: 0.5; border-left-color: var(--success); }
.plan-time { font-size: 13px; color: var(--accent); font-weight: 700; width: 44px; }
.plan-body { flex: 1; }
.plan-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.plan-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.plan-status { font-size: 17px; }

/* 消息 */
.msg-list { display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto; }
.msg-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  position: relative;
}
.msg-item.unread { background: var(--primary-soft); border-color: var(--border-accent); }
.msg-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }
.msg-body { flex: 1; }
.msg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.msg-teacher { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.msg-time { font-size: 10px; color: var(--text-muted); }
.msg-text { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 6px; }
.msg-subject-tag {
  display: inline-block;
  background: var(--primary-soft);
  color: var(--primary-light);
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 20px;
  font-weight: 500;
}
.unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--danger);
  flex-shrink: 0;
  margin-top: 5px;
}

@media (max-width: 1200px) {
  .main-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .child-hero { flex-direction: column; text-align: center; }
}
</style>
