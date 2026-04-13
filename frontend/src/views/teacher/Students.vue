<template>
  <TeacherLayout>
    <div class="students-page">
      <div class="page-header">
        <h2>学生列表</h2>
        <div class="header-actions">
          <el-input v-model="keyword" placeholder="搜索学生姓名/学号" clearable style="width:220px" @input="handleSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="selectedClass" placeholder="选择班级" clearable style="width:150px" @change="handleSearch">
            <el-option v-for="c in classList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select v-model="selectedStatus" placeholder="活跃状态" clearable style="width:120px" @change="handleSearch">
            <el-option label="活跃" value="active" />
            <el-option label="沉默" value="inactive" />
            <el-option label="预警" value="warning" />
          </el-select>
        </div>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="16" class="stats-row">
        <el-col :xs="12" :md="6" v-for="s in summaryStats" :key="s.label">
          <div class="stat-card">
            <div class="stat-icon" :style="{ background: s.bg }">
              <el-icon :style="{ color: s.color, fontSize: '20px' }"><component :is="s.icon" /></el-icon>
            </div>
            <div>
              <div class="stat-val" :style="{ color: s.color }">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-card>
        <el-table v-loading="loading" :data="pagedStudents" stripe style="width:100%">
          <el-table-column label="学生" min-width="180">
            <template #default="{ row }">
              <div class="student-cell">
                <el-avatar :size="36" :style="{ background: getAvatarBg(row.id), color:'#000', fontWeight:'700' }">
                  {{ row.name?.charAt(0) }}
                </el-avatar>
                <div>
                  <div class="student-name">{{ row.name }}</div>
                  <div class="student-id">{{ row.studentId }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="className" label="班级" width="120" />
          <el-table-column label="学习进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" :stroke-width="6" :color="getProgressColor(row.progress)" />
            </template>
          </el-table-column>
          <el-table-column label="平均分" width="90" align="center">
            <template #default="{ row }">
              <span :class="getScoreClass(row.avgScore)">{{ row.avgScore }}</span>
            </template>
          </el-table-column>
          <el-table-column label="连续天数" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.streak >= 7 ? 'success' : row.streak >= 3 ? 'warning' : 'info'" size="small">
                🔥 {{ row.streak }}天
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="提交/总计" width="100" align="center">
            <template #default="{ row }">
              <span class="mono">{{ row.submittedCount }}/{{ row.totalAssignments }}</span>
            </template>
          </el-table-column>
          <el-table-column label="知识薄弱点" min-width="160">
            <template #default="{ row }">
              <el-tag v-for="w in row.weakPoints.slice(0,2)" :key="w" size="small" type="danger" style="margin:2px">{{ w }}</el-tag>
              <span v-if="row.weakPoints.length === 0" style="color:#606060;font-size:12px">暂无</span>
            </template>
          </el-table-column>
          <el-table-column label="最近活跃" width="110" align="center">
            <template #default="{ row }">
              <span class="mono text-muted" style="font-size:12px">{{ row.lastActive }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.statusType" size="small" effect="dark">{{ row.statusLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewPortrait(row)">画像</el-button>
              <el-button type="warning" link size="small" @click="sendAlert(row)">提醒</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="filteredStudents.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="page = 1"
            @current-change="() => {}"
          />
        </div>
      </el-card>

      <!-- 学生知识画像抽屉 -->
      <el-drawer v-model="drawerVisible" :title="`${selectedStudent?.name} · 学习画像`" size="480px">
        <div v-if="selectedStudent" class="portrait-panel">
          <div class="portrait-avatar-row">
            <el-avatar :size="60" :style="{ background: getAvatarBg(selectedStudent.id), color:'#000', fontWeight:'700', fontSize:'24px' }">
              {{ selectedStudent.name.charAt(0) }}
            </el-avatar>
            <div>
              <div style="font-size:18px;font-weight:700;color:#F0F0F0">{{ selectedStudent.name }}</div>
              <div style="font-size:13px;color:#909399">{{ selectedStudent.studentId }} · {{ selectedStudent.className }}</div>
              <div style="margin-top:4px">
                <el-tag :type="selectedStudent.statusType" size="small" effect="dark">{{ selectedStudent.statusLabel }}</el-tag>
                <el-tag type="success" size="small" style="margin-left:6px">🔥 连续{{ selectedStudent.streak }}天</el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="portrait-section">
            <div class="section-title">学习数据</div>
            <div class="data-grid">
              <div class="data-item"><div class="data-val" style="color:#00FF94">{{ selectedStudent.avgScore }}</div><div class="data-key">平均分</div></div>
              <div class="data-item"><div class="data-val" style="color:#00D4FF">{{ selectedStudent.progress }}%</div><div class="data-key">课程进度</div></div>
              <div class="data-item"><div class="data-val" style="color:#FFB700">{{ selectedStudent.submittedCount }}/{{ selectedStudent.totalAssignments }}</div><div class="data-key">作业完成</div></div>
              <div class="data-item"><div class="data-val" style="color:#7C3AED">{{ selectedStudent.studyHours }}h</div><div class="data-key">累计学时</div></div>
            </div>
          </div>

          <el-divider />

          <div class="portrait-section">
            <div class="section-title">知识点掌握度</div>
            <div v-for="kp in selectedStudent.knowledgePoints" :key="kp.name" class="kp-item">
              <div class="kp-name">{{ kp.name }}</div>
              <el-progress :percentage="kp.mastery" :color="kp.mastery >= 80 ? '#00FF94' : kp.mastery >= 60 ? '#FFB700' : '#FF4B6E'" :stroke-width="8" style="flex:1;margin:0 10px" />
              <span style="font-size:12px;width:36px;text-align:right" :style="{ color: kp.mastery >= 80 ? '#00FF94' : kp.mastery >= 60 ? '#FFB700' : '#FF4B6E' }">{{ kp.mastery }}%</span>
            </div>
          </div>

          <el-divider />

          <div class="portrait-section">
            <div class="section-title">近7天学习热力</div>
            <div class="heatmap-row">
              <div v-for="d in selectedStudent.weekHeat" :key="d.day" class="heat-cell" :style="{ background: getHeatColor(d.minutes) }" :title="`${d.day}: ${d.minutes}分钟`">
                <span class="heat-day">{{ d.day }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-drawer>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, User, TrendCharts, Warning, CircleCheck } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'

const loading = ref(false)
const keyword = ref('')
const selectedClass = ref<number | null>(null)
const selectedStatus = ref('')
const page = ref(1)
const pageSize = ref(20)
const drawerVisible = ref(false)

interface KnowledgePoint { name: string; mastery: number }
interface WeekHeat { day: string; minutes: number }
interface Student {
  id: number; name: string; studentId: string; className: string
  progress: number; avgScore: number; streak: number
  submittedCount: number; totalAssignments: number
  weakPoints: string[]; lastActive: string
  statusType: '' | 'success' | 'info' | 'warning' | 'danger'
  statusLabel: string; studyHours: number
  knowledgePoints: KnowledgePoint[]; weekHeat: WeekHeat[]
}
interface ClassItem { id: number; name: string }

const classList = ref<ClassItem[]>([
  { id: 1, name: '24软件2班' },
  { id: 2, name: '24软件3班' },
  { id: 3, name: '24软件4班' },
])

const selectedStudent = ref<Student | null>(null)

const allStudents = ref<Student[]>([
  { id:1,  name:'张小明', studentId:'2024001', className:'24软件2班', progress:85, avgScore:92, streak:14, submittedCount:10, totalAssignments:10, weakPoints:[], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:124, knowledgePoints:[{name:'数据结构',mastery:90},{name:'算法分析',mastery:85},{name:'动态规划',mastery:78},{name:'图论',mastery:88},{name:'排序算法',mastery:95}], weekHeat:[{day:'周一',minutes:90},{day:'周二',minutes:75},{day:'周三',minutes:110},{day:'周四',minutes:60},{day:'周五',minutes:95},{day:'周六',minutes:45},{day:'周日',minutes:30}] },
  { id:2,  name:'李华',  studentId:'2024002', className:'24软件2班', progress:78, avgScore:88, streak:7,  submittedCount:9,  totalAssignments:10, weakPoints:['动态规划'], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:98,  knowledgePoints:[{name:'数据结构',mastery:85},{name:'算法分析',mastery:80},{name:'动态规划',mastery:62},{name:'图论',mastery:75},{name:'排序算法',mastery:90}], weekHeat:[{day:'周一',minutes:60},{day:'周二',minutes:80},{day:'周三',minutes:50},{day:'周四',minutes:70},{day:'周五',minutes:90},{day:'周六',minutes:40},{day:'周日',minutes:55}] },
  { id:3,  name:'王芳',  studentId:'2024003', className:'24软件2班', progress:65, avgScore:76, streak:5,  submittedCount:8,  totalAssignments:10, weakPoints:['图论','贪心算法'], lastActive:'昨天',         statusType:'success', statusLabel:'活跃', studyHours:76,  knowledgePoints:[{name:'数据结构',mastery:72},{name:'算法分析',mastery:68},{name:'动态规划',mastery:55},{name:'图论',mastery:48},{name:'排序算法',mastery:82}], weekHeat:[{day:'周一',minutes:40},{day:'周二',minutes:60},{day:'周三',minutes:0},{day:'周四',minutes:55},{day:'周五',minutes:70},{day:'周六',minutes:30},{day:'周日',minutes:0}] },
  { id:4,  name:'赵磊',  studentId:'2024004', className:'24软件2班', progress:42, avgScore:61, streak:2,  submittedCount:5,  totalAssignments:10, weakPoints:['动态规划','图论','递归'], lastActive:'3天前',   statusType:'warning', statusLabel:'预警', studyHours:42,  knowledgePoints:[{name:'数据结构',mastery:58},{name:'算法分析',mastery:45},{name:'动态规划',mastery:32},{name:'图论',mastery:38},{name:'排序算法',mastery:65}], weekHeat:[{day:'周一',minutes:20},{day:'周二',minutes:0},{day:'周三',minutes:0},{day:'周四',minutes:30},{day:'周五',minutes:0},{day:'周六',minutes:0},{day:'周日',minutes:0}] },
  { id:5,  name:'陈伟',  studentId:'2024005', className:'24软件3班', progress:93, avgScore:96, streak:21, submittedCount:10, totalAssignments:10, weakPoints:[], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:186, knowledgePoints:[{name:'数据结构',mastery:98},{name:'算法分析',mastery:95},{name:'动态规划',mastery:92},{name:'图论',mastery:94},{name:'排序算法',mastery:99}], weekHeat:[{day:'周一',minutes:120},{day:'周二',minutes:100},{day:'周三',minutes:90},{day:'周四',minutes:110},{day:'周五',minutes:130},{day:'周六',minutes:80},{day:'周日',minutes:70}] },
  { id:6,  name:'刘洋',  studentId:'2024006', className:'24软件3班', progress:71, avgScore:82, streak:9,  submittedCount:9,  totalAssignments:10, weakPoints:['贪心算法'], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:89,  knowledgePoints:[{name:'数据结构',mastery:84},{name:'算法分析',mastery:78},{name:'动态规划',mastery:72},{name:'图论',mastery:79},{name:'排序算法',mastery:88}], weekHeat:[{day:'周一',minutes:70},{day:'周二',minutes:85},{day:'周三',minutes:60},{day:'周四',minutes:75},{day:'周五',minutes:90},{day:'周六',minutes:50},{day:'周日',minutes:40}] },
  { id:7,  name:'孙丽',  studentId:'2024007', className:'24软件3班', progress:88, avgScore:90, streak:16, submittedCount:10, totalAssignments:10, weakPoints:[], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:142, knowledgePoints:[{name:'数据结构',mastery:92},{name:'算法分析',mastery:88},{name:'动态规划',mastery:85},{name:'图论',mastery:90},{name:'排序算法',mastery:93}], weekHeat:[{day:'周一',minutes:100},{day:'周二',minutes:90},{day:'周三',minutes:80},{day:'周四',minutes:95},{day:'周五',minutes:110},{day:'周六',minutes:60},{day:'周日',minutes:50}] },
  { id:8,  name:'周浩',  studentId:'2024008', className:'24软件2班', progress:55, avgScore:68, streak:1,  submittedCount:6,  totalAssignments:10, weakPoints:['动态规划','分治算法'], lastActive:'今天',         statusType:'warning', statusLabel:'预警', studyHours:55,  knowledgePoints:[{name:'数据结构',mastery:65},{name:'算法分析',mastery:58},{name:'动态规划',mastery:40},{name:'图论',mastery:55},{name:'排序算法',mastery:72}], weekHeat:[{day:'周一',minutes:30},{day:'周二',minutes:0},{day:'周三',minutes:45},{day:'周四',minutes:0},{day:'周五',minutes:60},{day:'周六',minutes:0},{day:'周日',minutes:20}] },
  { id:9,  name:'吴娟',  studentId:'2024009', className:'24软件4班', progress:79, avgScore:85, streak:11, submittedCount:9,  totalAssignments:10, weakPoints:['图论'], lastActive:'昨天',         statusType:'success', statusLabel:'活跃', studyHours:105, knowledgePoints:[{name:'数据结构',mastery:87},{name:'算法分析',mastery:82},{name:'动态规划',mastery:76},{name:'图论',mastery:60},{name:'排序算法',mastery:89}], weekHeat:[{day:'周一',minutes:80},{day:'周二',minutes:65},{day:'周三',minutes:90},{day:'周四',minutes:55},{day:'周五',minutes:75},{day:'周六',minutes:35},{day:'周日',minutes:45}] },
  { id:10, name:'郑强',  studentId:'2024010', className:'24软件4班', progress:38, avgScore:55, streak:0,  submittedCount:4,  totalAssignments:10, weakPoints:['动态规划','图论','回溯','贪心'], lastActive:'5天前',   statusType:'danger',  statusLabel:'沉默', studyHours:28,  knowledgePoints:[{name:'数据结构',mastery:48},{name:'算法分析',mastery:35},{name:'动态规划',mastery:22},{name:'图论',mastery:28},{name:'排序算法',mastery:55}], weekHeat:[{day:'周一',minutes:0},{day:'周二',minutes:0},{day:'周三',minutes:0},{day:'周四',minutes:0},{day:'周五',minutes:0},{day:'周六',minutes:0},{day:'周日',minutes:0}] },
  { id:11, name:'林小燕',studentId:'2024011', className:'24软件3班', progress:62, avgScore:74, streak:4,  submittedCount:7,  totalAssignments:10, weakPoints:['动态规划'], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:68,  knowledgePoints:[{name:'数据结构',mastery:75},{name:'算法分析',mastery:70},{name:'动态规划',mastery:50},{name:'图论',mastery:65},{name:'排序算法',mastery:78}], weekHeat:[{day:'周一',minutes:50},{day:'周二',minutes:60},{day:'周三',minutes:40},{day:'周四',minutes:70},{day:'周五',minutes:55},{day:'周六',minutes:30},{day:'周日',minutes:0}] },
  { id:12, name:'马超',  studentId:'2024012', className:'24软件4班', progress:74, avgScore:80, streak:6,  submittedCount:8,  totalAssignments:10, weakPoints:['贪心算法'], lastActive:'昨天',         statusType:'success', statusLabel:'活跃', studyHours:82,  knowledgePoints:[{name:'数据结构',mastery:82},{name:'算法分析',mastery:77},{name:'动态规划',mastery:68},{name:'图论',mastery:73},{name:'排序算法',mastery:85}], weekHeat:[{day:'周一',minutes:65},{day:'周二',minutes:75},{day:'周三',minutes:50},{day:'周四',minutes:80},{day:'周五',minutes:60},{day:'周六',minutes:25},{day:'周日',minutes:35}] },
  { id:13, name:'杨建国',studentId:'2024013', className:'24软件2班', progress:48, avgScore:63, streak:0,  submittedCount:5,  totalAssignments:10, weakPoints:['动态规划','图论'], lastActive:'4天前',   statusType:'warning', statusLabel:'预警', studyHours:38,  knowledgePoints:[{name:'数据结构',mastery:62},{name:'算法分析',mastery:52},{name:'动态规划',mastery:38},{name:'图论',mastery:42},{name:'排序算法',mastery:68}], weekHeat:[{day:'周一',minutes:0},{day:'周二',minutes:25},{day:'周三',minutes:0},{day:'周四',minutes:0},{day:'周五',minutes:40},{day:'周六',minutes:0},{day:'周日',minutes:0}] },
  { id:14, name:'谢明',  studentId:'2024014', className:'24软件3班', progress:82, avgScore:87, streak:12, submittedCount:10, totalAssignments:10, weakPoints:[], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:118, knowledgePoints:[{name:'数据结构',mastery:88},{name:'算法分析',mastery:85},{name:'动态规划',mastery:80},{name:'图论',mastery:83},{name:'排序算法',mastery:92}], weekHeat:[{day:'周一',minutes:85},{day:'周二',minutes:70},{day:'周三',minutes:95},{day:'周四',minutes:65},{day:'周五',minutes:100},{day:'周六',minutes:55},{day:'周日',minutes:45}] },
  { id:15, name:'韩梅',  studentId:'2024015', className:'24软件4班', progress:90, avgScore:93, streak:18, submittedCount:10, totalAssignments:10, weakPoints:[], lastActive:'今天',         statusType:'success', statusLabel:'活跃', studyHours:158, knowledgePoints:[{name:'数据结构',mastery:95},{name:'算法分析',mastery:92},{name:'动态规划',mastery:88},{name:'图论',mastery:91},{name:'排序算法:',mastery:97}], weekHeat:[{day:'周一',minutes:110},{day:'周二',minutes:95},{day:'周三',minutes:85},{day:'周四',minutes:105},{day:'周五',minutes:120},{day:'周六',minutes:75},{day:'周日',minutes:60}] },
])

const summaryStats = [
  { label: '总学生数', value: 15, color: '#00D4FF', bg: 'rgba(0,212,255,0.1)', icon: User },
  { label: '活跃学生', value: 10, color: '#00FF94', bg: 'rgba(0,255,148,0.1)', icon: CircleCheck },
  { label: '预警学生', value: 3,  color: '#FFB700', bg: 'rgba(255,183,0,0.1)',  icon: Warning },
  { label: '平均分',   value: 79, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: TrendCharts },
]

const filteredStudents = computed(() => {
  return allStudents.value.filter(s => {
    const kw = keyword.value.trim()
    if (kw && !s.name.includes(kw) && !s.studentId.includes(kw)) return false
    if (selectedClass.value) {
      const cls = classList.value.find(c => c.id === selectedClass.value)
      if (cls && !s.className.includes(cls.name.replace('24软件','').replace('班',''))) {
        if (s.className !== cls.name) return false
      }
    }
    if (selectedStatus.value) {
      if (selectedStatus.value === 'active' && s.statusType !== 'success') return false
      if (selectedStatus.value === 'inactive' && s.statusType !== 'danger') return false
      if (selectedStatus.value === 'warning' && s.statusType !== 'warning') return false
    }
    return true
  })
})

const pagedStudents = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

function handleSearch() { page.value = 1 }

function viewPortrait(s: Student) {
  selectedStudent.value = s
  drawerVisible.value = true
}

function sendAlert(s: Student) {
  ElMessage.success(`已向 ${s.name} 发送学习提醒`)
}

function getAvatarBg(id: number) {
  const colors = ['linear-gradient(135deg,#00FF94,#00D4FF)', 'linear-gradient(135deg,#7C3AED,#00D4FF)', 'linear-gradient(135deg,#FFB700,#FF4B6E)', 'linear-gradient(135deg,#00D4FF,#7C3AED)', 'linear-gradient(135deg,#FF4B6E,#FFB700)']
  return colors[id % colors.length]
}

function getProgressColor(p: number) {
  return p >= 80 ? '#00FF94' : p >= 60 ? '#00D4FF' : p >= 40 ? '#FFB700' : '#FF4B6E'
}

function getScoreClass(score: number) {
  return score >= 80 ? 'mono text-success' : score >= 60 ? 'mono text-warning' : 'mono text-danger'
}

function getHeatColor(minutes: number) {
  if (minutes === 0) return '#252525'
  if (minutes < 30) return 'rgba(0,255,148,0.2)'
  if (minutes < 60) return 'rgba(0,255,148,0.45)'
  if (minutes < 90) return 'rgba(0,255,148,0.7)'
  return 'rgba(0,255,148,0.95)'
}
</script>

<style scoped>
.students-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 900; color: #F0F0F0; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.stats-row { margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: #252525; border-radius: 10px; border: 1px solid #333; }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-val { font-size: 24px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.student-cell { display: flex; gap: 10px; align-items: center; }
.student-name { font-size: 14px; font-weight: 600; color: #E0E0E0; }
.student-id { font-size: 12px; color: #606060; font-family: Consolas, monospace; }
.mono { font-family: Consolas, monospace; }
.text-success { color: #00FF94; font-weight: 700; }
.text-warning { color: #FFB700; font-weight: 700; }
.text-danger { color: #FF4B6E; font-weight: 700; }
.text-muted { color: #606060; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }

/* 抽屉画像样式 */
.portrait-panel { padding: 0 4px; }
.portrait-avatar-row { display: flex; gap: 16px; align-items: center; }
.portrait-section { margin: 8px 0; }
.section-title { font-size: 13px; color: #909399; margin-bottom: 12px; letter-spacing: 1px; }
.data-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.data-item { text-align: center; padding: 12px 8px; background: #252525; border-radius: 8px; }
.data-val { font-size: 22px; font-weight: 700; }
.data-key { font-size: 11px; color: #909399; margin-top: 4px; }
.kp-item { display: flex; align-items: center; margin-bottom: 12px; }
.kp-name { width: 80px; font-size: 12px; color: #D0D0D0; flex-shrink: 0; }
.heatmap-row { display: flex; gap: 8px; }
.heat-cell { flex: 1; height: 48px; border-radius: 6px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; cursor: pointer; transition: transform 0.15s; }
.heat-cell:hover { transform: scaleY(1.1); }
.heat-day { font-size: 11px; color: rgba(255,255,255,0.6); }
</style>
