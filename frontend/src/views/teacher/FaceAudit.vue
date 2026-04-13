<template>
  <TeacherLayout>
    <div class="face-audit-page">
      <div class="page-header">
        <h2>防刷课监控中心</h2>
        <p class="desc">FaceGuard 静默核验 · 每2分钟余弦相似度比对 · 异常自动上报</p>
      </div>

      <el-row :gutter="20" class="stats-row">
        <el-col :xs="12" :md="6" v-for="s in stats" :key="s.label">
          <div class="stat-card">
            <div class="stat-icon" :style="{ background: s.bg }">
              <el-icon :style="{ color: s.color, fontSize: '22px' }"><component :is="s.icon" /></el-icon>
            </div>
            <div>
              <div class="stat-val" :style="{ color: s.color }">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 实时异常列表 -->
        <el-col :xs="24" :lg="14">
          <el-card class="alert-card">
            <template #header>
              <div class="card-header">
                <span><el-icon style="color:#FF4B6E"><Warning /></el-icon> 核验异常记录（今日）</span>
                <el-badge :value="anomalies.filter(a => !a.handled).length" type="danger">
                  <el-button size="small" @click="markAllHandled">全部标记处理</el-button>
                </el-badge>
              </div>
            </template>

            <div class="anomaly-list">
              <div v-for="a in anomalies" :key="a.id" class="anomaly-item" :class="{ handled: a.handled }">
                <div class="avatar-wrap">
                  <el-avatar :src="a.avatar" :size="40" />
                  <el-badge :value="a.fail_count" type="danger" v-if="!a.handled" />
                </div>
                <div class="anomaly-info">
                  <div class="anomaly-name">{{ a.name }} <el-tag size="small" type="info">{{ a.class }}</el-tag></div>
                  <div class="anomaly-course">课程：{{ a.course }}</div>
                  <div class="anomaly-meta">
                    <span>相似度: <strong :style="{ color: a.similarity < 60 ? '#FF4B6E' : '#FFB700' }">{{ a.similarity }}%</strong></span>
                    <span style="margin:0 8px">连续失败: {{ a.fail_count }}次</span>
                    <span>{{ a.time }}</span>
                  </div>
                </div>
                <div class="anomaly-actions">
                  <el-tag :type="a.handled ? 'success' : 'danger'" effect="dark">{{ a.handled ? '已处理' : '待处理' }}</el-tag>
                  <el-button v-if="!a.handled" link type="primary" size="small" @click="handleAnomaly(a)">处理</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 课程异常统计 -->
        <el-col :xs="24" :lg="10">
          <el-card class="course-stats-card">
            <template #header><span>各课程异常统计</span></template>
            <div v-for="c in courseStats" :key="c.course" class="course-stat-item">
              <div class="course-stat-name">{{ c.course }}</div>
              <el-progress
                :percentage="c.anomaly_rate"
                :color="c.anomaly_rate > 20 ? '#FF4B6E' : '#FFB700'"
                :stroke-width="10"
                style="flex:1;margin:0 12px"
              />
              <span style="font-size:13px;color:#F0F0F0;width:60px;text-align:right">{{ c.count }}人异常</span>
            </div>
          </el-card>

          <el-card class="push-card" style="margin-top:16px">
            <template #header>
              <div class="card-header">
                <span>差分推送记录</span>
                <el-button type="primary" size="small" @click="handlePush">立即推送</el-button>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item v-for="p in pushLogs" :key="p.id" :timestamp="p.time" type="primary">
                <div>推送给 <strong>{{ p.teacher }}</strong></div>
                <div style="font-size:12px;color:#909399">{{ p.course }}：{{ p.count }}名学生异常</div>
                <el-tag size="small" :type="p.status === 'success' ? 'success' : 'danger'">{{ p.status === 'success' ? '推送成功' : '推送失败' }}</el-tag>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>

      <!-- 核验日志表格 -->
      <el-card class="log-card" style="margin-top:16px">
        <template #header>
          <div class="card-header">
            <span>核验日志（最近48小时）</span>
            <el-select v-model="logFilter" size="small" style="width:120px">
              <el-option label="全部" value="" />
              <el-option label="通过" value="pass" />
              <el-option label="警告" value="warning" />
              <el-option label="失败" value="fail" />
            </el-select>
          </div>
        </template>
        <el-table :data="filteredLogs" stripe style="width:100%" size="small">
          <el-table-column prop="student" label="学生" width="100" />
          <el-table-column prop="course" label="课程" width="150" />
          <el-table-column label="相似度" width="100" align="center">
            <template #default="{ row }">
              <span :style="{ color: row.similarity >= 85 ? '#00FF94' : row.similarity >= 60 ? '#FFB700' : '#FF4B6E' }">{{ row.similarity }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="结果" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.result === 'pass' ? 'success' : row.result === 'warning' ? 'warning' : 'danger'">
                {{ ({ pass:'通过', warning:'警告', fail:'失败' } as Record<string, string>)[row.result] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="time" label="时间" width="160" />
          <el-table-column prop="device" label="设备" />
        </el-table>
      </el-card>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, CircleCheck, CircleClose, User } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'

const logFilter = ref('')

const stats = [
  { label: '今日核验总次数', value: 1248, color: '#00D4FF', bg: 'rgba(0,212,255,0.1)', icon: CircleCheck },
  { label: '通过次数',       value: 1189, color: '#00FF94', bg: 'rgba(0,255,148,0.1)', icon: CircleCheck },
  { label: '警告次数',       value: 42,   color: '#FFB700', bg: 'rgba(255,183,0,0.1)',  icon: Warning },
  { label: '失败次数',       value: 17,   color: '#FF4B6E', bg: 'rgba(255,75,110,0.1)', icon: CircleClose },
]

interface Anomaly { id:number; name:string; class:string; course:string; avatar:string; similarity:number; fail_count:number; time:string; handled:boolean }

const anomalies = ref<Anomaly[]>([
  { id:1, name:'赵磊',   class:'24软件2班', course:'数据结构与算法', avatar:'https://picsum.photos/seed/s1/40/40', similarity:42, fail_count:3, time:'10:24', handled:false },
  { id:2, name:'周浩',   class:'24软件2班', course:'Python零基础',  avatar:'https://picsum.photos/seed/s2/40/40', similarity:55, fail_count:2, time:'09:58', handled:false },
  { id:3, name:'林小燕', class:'24软件3班', course:'Java后端开发',   avatar:'https://picsum.photos/seed/s3/40/40', similarity:38, fail_count:4, time:'09:35', handled:true  },
  { id:4, name:'马超',   class:'24软件4班', course:'前端Vue3实战',   avatar:'https://picsum.photos/seed/s4/40/40', similarity:61, fail_count:1, time:'08:47', handled:true  },
  { id:5, name:'杨建国', class:'24软件2班', course:'数据结构与算法', avatar:'https://picsum.photos/seed/s5/40/40', similarity:29, fail_count:5, time:'08:15', handled:false },
])

const courseStats = [
  { course:'数据结构与算法', anomaly_rate:28, count:7 },
  { course:'Python零基础',   anomaly_rate:15, count:4 },
  { course:'Java后端开发',   anomaly_rate:12, count:3 },
  { course:'前端Vue3实战',   anomaly_rate:8,  count:2 },
  { course:'数据库原理',     anomaly_rate:5,  count:1 },
]

const pushLogs = [
  { id:1, teacher:'张老师', course:'数据结构与算法', count:5, status:'success', time:'10:30' },
  { id:2, teacher:'李老师', course:'Python零基础',   count:3, status:'success', time:'09:30' },
  { id:3, teacher:'王老师', course:'Java后端开发',   count:2, status:'success', time:'08:30' },
]

const verifyLogs = [
  { id:1,  student:'张小明', course:'数据结构与算法', similarity:92, result:'pass',    time:'2026-04-02 10:24', device:'Chrome/Win11' },
  { id:2,  student:'李华',   course:'Python零基础',  similarity:88, result:'pass',    time:'2026-04-02 10:22', device:'Chrome/Win11' },
  { id:3,  student:'赵磊',   course:'数据结构与算法', similarity:42, result:'fail',    time:'2026-04-02 10:20', device:'Edge/Win10' },
  { id:4,  student:'王芳',   course:'Java后端开发',  similarity:79, result:'warning', time:'2026-04-02 10:18', device:'Chrome/Mac' },
  { id:5,  student:'周浩',   course:'Python零基础',  similarity:55, result:'warning', time:'2026-04-02 10:16', device:'Firefox/Win11' },
  { id:6,  student:'陈伟',   course:'前端Vue3实战',  similarity:95, result:'pass',    time:'2026-04-02 10:14', device:'Chrome/Win11' },
  { id:7,  student:'刘洋',   course:'数据库原理',    similarity:87, result:'pass',    time:'2026-04-02 10:12', device:'Chrome/Win11' },
  { id:8,  student:'杨建国', course:'数据结构与算法', similarity:29, result:'fail',    time:'2026-04-02 10:10', device:'Chrome/Win10' },
  { id:9,  student:'孙丽',   course:'Python零基础',  similarity:91, result:'pass',    time:'2026-04-02 10:08', device:'Safari/Mac' },
  { id:10, student:'林小燕', course:'Java后端开发',  similarity:38, result:'fail',    time:'2026-04-02 10:06', device:'Chrome/Win11' },
]

const filteredLogs = computed(() => verifyLogs.filter(l => !logFilter.value || l.result === logFilter.value))

function handleAnomaly(a: Anomaly) { a.handled = true; ElMessage.success(`已处理 ${a.name} 的异常记录`) }
function markAllHandled() { anomalies.value.forEach(a => a.handled = true); ElMessage.success('已全部标记处理') }
function handlePush() { ElMessage.success('已向相关教师推送最新异常汇总') }
</script>

<style scoped>
.face-audit-page { padding: 20px; min-height: 100%; }
.page-header { margin-bottom: 24px; }
.page-header h2 { margin: 0 0 6px; font-size: 22px; color: #F0F0F0; }
.desc { margin: 0; color: #909399; font-size: 13px; }
.stats-row { margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; gap: 14px; padding: 18px; background: #252525; border-radius: 10px; border: 1px solid #333; }
.stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-val { font-size: 26px; font-weight: 700; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.anomaly-list { display: flex; flex-direction: column; gap: 12px; }
.anomaly-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: #1a1a1a; border: 1px solid #333; transition: opacity 0.3s; }
.anomaly-item.handled { opacity: 0.5; }
.avatar-wrap { position: relative; flex-shrink: 0; }
.anomaly-info { flex: 1; }
.anomaly-name { font-weight: 600; color: #F0F0F0; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.anomaly-course { font-size: 12px; color: #909399; margin-bottom: 4px; }
.anomaly-meta { font-size: 12px; color: #606266; }
.anomaly-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.course-stat-item { display: flex; align-items: center; margin-bottom: 16px; }
.course-stat-name { width: 130px; font-size: 13px; color: #F0F0F0; flex-shrink: 0; }
</style>
