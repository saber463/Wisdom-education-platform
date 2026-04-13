<template>
  <div class="teacher-dashboard">
    <!-- 顶部统计面板 -->
    <div class="stats-bar">
      <div class="stat-card" v-for="stat in statsData" :key="stat.label">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
          {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 左列：班级管理 + 课程管理 -->
      <div class="left-col">
        <!-- 班级卡片 -->
        <section class="section-card">
          <div class="section-header">
            <h2 class="section-title">📚 我的班级</h2>
            <button class="btn-add">+ 新建班级</button>
          </div>
          <div class="class-grid">
            <div class="class-card" v-for="cls in classes" :key="cls.id">
              <div class="class-cover">
                <img :src="cls.cover" :alt="cls.name" />
                <div class="class-badge">{{ cls.subject }}</div>
              </div>
              <div class="class-info">
                <div class="class-name">{{ cls.name }}</div>
                <div class="class-meta">
                  <span>👥 {{ cls.studentCount }}人</span>
                  <span>📅 {{ cls.schedule }}</span>
                </div>
                <div class="progress-wrap">
                  <div class="progress-label">
                    <span>课程完成率</span>
                    <span class="rate">{{ cls.completionRate }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: cls.completionRate + '%', background: cls.color }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 课程管理 -->
        <section class="section-card">
          <div class="section-header">
            <h2 class="section-title">🎓 我的课程</h2>
            <button class="btn-add">+ 发布课程</button>
          </div>
          <div class="course-list">
            <div class="course-item" v-for="course in courses" :key="course.id">
              <img :src="course.cover" :alt="course.title" class="course-thumb" />
              <div class="course-detail">
                <div class="course-title">{{ course.title }}</div>
                <div class="course-stats">
                  <span>👁 {{ course.views }}次观看</span>
                  <span>⭐ {{ course.rating }}</span>
                  <span>📝 {{ course.lessonCount }}课时</span>
                </div>
              </div>
              <div class="course-actions">
                <button class="btn-sm">编辑</button>
                <button class="btn-sm outline">预览</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右列：学生管理 + 消息 -->
      <div class="right-col">
        <!-- 学生管理列表 -->
        <section class="section-card">
          <div class="section-header">
            <h2 class="section-title">🧑‍🎓 学生管理</h2>
            <input class="search-input" placeholder="搜索学生..." v-model="studentSearch" />
          </div>
          <table class="student-table">
            <thead>
              <tr>
                <th>学生</th>
                <th>班级</th>
                <th>平均分</th>
                <th>出勤</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stu in filteredStudents" :key="stu.id">
                <td class="stu-name-cell">
                  <img :src="stu.avatar" class="stu-avatar" />
                  <span>{{ stu.name }}</span>
                </td>
                <td>{{ stu.className }}</td>
                <td>
                  <span class="score" :class="scoreClass(stu.avgScore)">{{ stu.avgScore }}</span>
                </td>
                <td>{{ stu.attendance }}%</td>
                <td>
                  <span class="status-badge" :class="stu.status">{{ statusLabel(stu.status) }}</span>
                </td>
                <td>
                  <button class="btn-xs">详情</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- 通知与消息 -->
        <section class="section-card notices">
          <div class="section-header">
            <h2 class="section-title">🔔 待办事项</h2>
            <span class="badge-count">{{ todos.length }}</span>
          </div>
          <div class="todo-list">
            <div class="todo-item" v-for="todo in todos" :key="todo.id" :class="{ done: todo.done }">
              <input type="checkbox" v-model="todo.done" class="todo-check" />
              <div class="todo-content">
                <div class="todo-title">{{ todo.title }}</div>
                <div class="todo-meta">{{ todo.deadline }} · {{ todo.class }}</div>
              </div>
              <span class="todo-priority" :class="todo.priority">{{ todo.priority }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 统计数据
const statsData = ref([
  { icon: '👥', label: '在校学生', value: '286', trend: 3.2 },
  { icon: '📚', label: '管理班级', value: '10', trend: 0 },
  { icon: '📝', label: '平均分', value: '82.4', trend: 1.5 },
  { icon: '✅', label: '作业完成率', value: '91%', trend: 2.8 },
  { icon: '📅', label: '出勤率', value: '96%', trend: -0.3 },
]);

// 班级数据 (10条)
const classes = ref([
  { id: 1, name: '高一(1)班·JavaScript', subject: 'JS', studentCount: 32, schedule: '周一/三/五', completionRate: 78, color: '#00f2ff', cover: 'https://picsum.photos/seed/jsclass1/280/140' },
  { id: 2, name: '高一(2)班·Python', subject: 'PY', studentCount: 29, schedule: '周二/四', completionRate: 65, color: '#7209b7', cover: 'https://picsum.photos/seed/pyclass/280/140' },
  { id: 3, name: '高二(1)班·数据结构', subject: 'DS', studentCount: 31, schedule: '周一/四', completionRate: 88, color: '#f72585', cover: 'https://picsum.photos/seed/dsclass/280/140' },
  { id: 4, name: '高二(3)班·算法', subject: 'AL', studentCount: 27, schedule: '周二/五', completionRate: 72, color: '#4cc9f0', cover: 'https://picsum.photos/seed/algoclass/280/140' },
  { id: 5, name: '高三(2)班·Web开发', subject: 'WD', studentCount: 33, schedule: '周一/三', completionRate: 55, color: '#f8961e', cover: 'https://picsum.photos/seed/webdev/280/140' },
  { id: 6, name: '初三(4)班·编程入门', subject: 'CS', studentCount: 35, schedule: '周三/五', completionRate: 91, color: '#43aa8b', cover: 'https://picsum.photos/seed/csintro/280/140' },
  { id: 7, name: '高一(3)班·Java', subject: 'JV', studentCount: 28, schedule: '周二/四/六', completionRate: 68, color: '#577590', cover: 'https://picsum.photos/seed/javaclass/280/140' },
  { id: 8, name: '高二(2)班·数据库', subject: 'DB', studentCount: 30, schedule: '周一/五', completionRate: 82, color: '#90be6d', cover: 'https://picsum.photos/seed/dbclass/280/140' },
  { id: 9, name: '高三(1)班·项目实战', subject: 'PJ', studentCount: 25, schedule: '周三/六', completionRate: 44, color: '#f3722c', cover: 'https://picsum.photos/seed/projectclass/280/140' },
  { id: 10, name: '初二(1)班·Scratch', subject: 'SC', studentCount: 38, schedule: '周二/五', completionRate: 96, color: '#277da1', cover: 'https://picsum.photos/seed/scratchclass/280/140' },
]);

// 课程数据 (5条)
const courses = ref([
  { id: 1, title: 'JavaScript从入门到精通', views: 1284, rating: 4.9, lessonCount: 42, cover: 'https://picsum.photos/seed/jscourse/80/60' },
  { id: 2, title: 'Python数据分析实战', views: 876, rating: 4.7, lessonCount: 35, cover: 'https://picsum.photos/seed/pycourse/80/60' },
  { id: 3, title: '数据结构与算法精讲', views: 653, rating: 4.8, lessonCount: 56, cover: 'https://picsum.photos/seed/dscourse/80/60' },
  { id: 4, title: 'Vue3全栈项目开发', views: 498, rating: 4.6, lessonCount: 38, cover: 'https://picsum.photos/seed/vuecourse/80/60' },
  { id: 5, title: 'Java面向对象编程', views: 721, rating: 4.5, lessonCount: 48, cover: 'https://picsum.photos/seed/javacourse/80/60' },
]);

// 学生数据 (10条)
const students = ref([
  { id: 1, name: '张晓明', className: '高一(1)班', avgScore: 94, attendance: 98, status: 'excellent', avatar: 'https://picsum.photos/seed/stu1/32/32' },
  { id: 2, name: '李思雨', className: '高一(2)班', avgScore: 87, attendance: 95, status: 'good', avatar: 'https://picsum.photos/seed/stu2/32/32' },
  { id: 3, name: '王建国', className: '高二(1)班', avgScore: 72, attendance: 88, status: 'normal', avatar: 'https://picsum.photos/seed/stu3/32/32' },
  { id: 4, name: '陈美丽', className: '高二(3)班', avgScore: 58, attendance: 75, status: 'warning', avatar: 'https://picsum.photos/seed/stu4/32/32' },
  { id: 5, name: '刘宇航', className: '高三(2)班', avgScore: 91, attendance: 100, status: 'excellent', avatar: 'https://picsum.photos/seed/stu5/32/32' },
  { id: 6, name: '杨雪莹', className: '初三(4)班', avgScore: 83, attendance: 92, status: 'good', avatar: 'https://picsum.photos/seed/stu6/32/32' },
  { id: 7, name: '赵浩然', className: '高一(3)班', avgScore: 66, attendance: 80, status: 'normal', avatar: 'https://picsum.photos/seed/stu7/32/32' },
  { id: 8, name: '周婷婷', className: '高二(2)班', avgScore: 45, attendance: 62, status: 'risk', avatar: 'https://picsum.photos/seed/stu8/32/32' },
  { id: 9, name: '吴俊杰', className: '高三(1)班', avgScore: 89, attendance: 94, status: 'good', avatar: 'https://picsum.photos/seed/stu9/32/32' },
  { id: 10, name: '郑晓芳', className: '初二(1)班', avgScore: 97, attendance: 100, status: 'excellent', avatar: 'https://picsum.photos/seed/stu10/32/32' },
]);

// 待办事项
const todos = ref([
  { id: 1, title: '批改高一(1)班第8章作业', deadline: '今天 18:00', class: '高一(1)班', priority: 'high', done: false },
  { id: 2, title: '准备明天数据结构课件', deadline: '今天 22:00', class: '高二(1)班', priority: 'high', done: false },
  { id: 3, title: '回复家长提问（3条）', deadline: '今天', class: '高一(2)班', priority: 'medium', done: false },
  { id: 4, title: '上传Python实验报告模板', deadline: '明天', class: '高一(2)班', priority: 'medium', done: true },
  { id: 5, title: '出期中考试题目', deadline: '本周五', class: '全班', priority: 'high', done: false },
]);

const studentSearch = ref('');
const filteredStudents = computed(() =>
  students.value.filter(s => s.name.includes(studentSearch.value) || s.className.includes(studentSearch.value))
);

const scoreClass = (score) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 75) return 'score-good';
  if (score >= 60) return 'score-normal';
  return 'score-low';
};

const statusLabel = (status) => {
  const map = { excellent: '优秀', good: '良好', normal: '一般', warning: '预警', risk: '高危' };
  return map[status] || status;
};
</script>

<style scoped>
.teacher-dashboard {
  padding: 24px;
  background: var(--bg-base);
  min-height: 100vh;
  color: var(--text-primary);
}

/* 统计条 */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  border-color: var(--border-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-primary);
}
.stat-icon { font-size: 26px; }
.stat-value { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.stat-trend { margin-left: auto; font-size: 12px; font-weight: 600; }
.stat-trend.up { color: var(--success); }
.stat-trend.down { color: var(--danger); }

/* 网格 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }

/* 卡片通用 */
.section-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 22px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.section-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn-add {
  background: var(--primary);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, box-shadow 0.2s;
}
.btn-add:hover {
  background: var(--primary-light);
  box-shadow: var(--shadow-glow-primary);
}

/* 班级网格 */
.class-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-height: 480px;
  overflow-y: auto;
}
.class-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s;
}
.class-card:hover { transform: translateY(-2px); border-color: var(--border-strong); }
.class-cover { position: relative; height: 88px; overflow: hidden; }
.class-cover img { width: 100%; height: 100%; object-fit: cover; }
.class-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(13, 17, 23, 0.8);
  color: var(--accent);
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 700;
  backdrop-filter: blur(4px);
}
.class-info { padding: 12px; }
.class-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 5px; }
.class-meta { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); margin-bottom: 9px; }
.progress-wrap { }
.progress-label { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
.rate { font-weight: 700; color: var(--text-secondary); }
.progress-bar { height: 5px; background: var(--bg-base); border-radius: 3px; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }

/* 课程列表 */
.course-list { display: flex; flex-direction: column; gap: 10px; }
.course-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.course-thumb { width: 76px; height: 52px; object-fit: cover; border-radius: 8px; }
.course-detail { flex: 1; }
.course-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 5px; }
.course-stats { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); }
.course-actions { display: flex; flex-direction: column; gap: 5px; }
.btn-sm {
  background: var(--primary-soft);
  border: 1px solid var(--border-accent);
  color: var(--primary-light);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.btn-sm:hover { background: var(--primary); color: #fff; }
.btn-sm.outline { background: transparent; color: var(--text-muted); border-color: var(--border-strong); }
.btn-sm.outline:hover { background: var(--bg-elevated); color: var(--text-primary); }

/* 学生表格 */
.search-input {
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  padding: 6px 12px;
  font-size: 12px;
  outline: none;
  width: 180px;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--primary); }
.search-input::placeholder { color: var(--text-muted); }
.student-table { width: 100%; border-collapse: collapse; }
.student-table th {
  text-align: left;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  padding: 8px 6px;
  border-bottom: 1px solid var(--border);
}
.student-table td {
  padding: 10px 6px;
  font-size: 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}
.stu-name-cell { display: flex; align-items: center; gap: 8px; }
.stu-name { color: var(--text-primary); font-weight: 500; }
.stu-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.score { font-weight: 700; }
.score-excellent { color: var(--success); }
.score-good      { color: #86efac; }
.score-normal    { color: var(--warning); }
.score-low       { color: var(--danger); }
.status-badge {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
}
.status-badge.excellent { background: var(--success-soft); color: var(--success); }
.status-badge.good      { background: rgba(134,239,172,0.1); color: #86efac; }
.status-badge.normal    { background: var(--warning-soft); color: var(--warning); }
.status-badge.warning   { background: rgba(251,146,60,0.1); color: #fb923c; }
.status-badge.risk      { background: var(--danger-soft); color: var(--danger); }
.btn-xs {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-muted);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-xs:hover { border-color: var(--primary); color: var(--primary-light); }

/* 待办 */
.badge-count {
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.todo-list { display: flex; flex-direction: column; gap: 10px; }
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.todo-icon { font-size: 18px; width: 28px; }
.todo-text { flex: 1; font-size: 13px; color: var(--text-secondary); }
.todo-text b { color: var(--text-primary); }
.todo-time { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.priority-tag {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 20px;
  font-weight: 600;
}
.priority-tag.high   { background: var(--danger-soft);  color: var(--danger); }
.priority-tag.medium { background: var(--warning-soft); color: var(--warning); }
.priority-tag.low    { background: var(--info-soft);    color: var(--info); }

@media (max-width: 1200px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .stats-bar { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .stats-bar { grid-template-columns: 1fr 1fr; }
}
</style>
