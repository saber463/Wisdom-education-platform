<template>
  <TeacherLayout>
    <div class="video-publish-page">
      <div class="page-header">
        <h2>视频智能上下架</h2>
        <p class="desc">系统每日凌晨2点自动统计完成率，完成率＜30%且上线超7天自动下架</p>
      </div>

      <el-row :gutter="20" class="stats-row">
        <el-col :xs="12" :md="6" v-for="s in stats" :key="s.label">
          <div class="stat-card">
            <div class="stat-icon" :style="{ background: s.bg }">
              <el-icon :style="{ color: s.color, fontSize: '24px' }"><component :is="s.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-val" :style="{ color: s.color }">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-card class="filter-card">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-select v-model="filterStatus" placeholder="上架状态" style="width:100%">
              <el-option label="全部" value="" />
              <el-option label="已上架" value="published" />
              <el-option label="已下架" value="unpublished" />
              <el-option label="保护期" value="protected" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input v-model="searchKey" placeholder="搜索视频名称..." clearable>
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="handleManualTrigger">
              <el-icon><RefreshRight /></el-icon> 手动触发
            </el-button>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>视频列表（共{{ filteredVideos.length }}条）</span>
            <el-tag>最近检查：2026-04-02 02:00</el-tag>
          </div>
        </template>
        <el-table :data="filteredVideos" stripe style="width:100%">
          <el-table-column label="视频名称" min-width="200">
            <template #default="{ row }">
              <el-tag size="small" :type="getLangType(row.language)" style="margin-right:8px">{{ row.language }}</el-tag>
              {{ row.title }}
            </template>
          </el-table-column>
          <el-table-column prop="course" label="所属课程" width="160" />
          <el-table-column label="完成率" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.completion_rate" :color="row.completion_rate >= 30 ? '#00FF94' : '#FF4B6E'" :stroke-width="8" />
              <span style="font-size:12px;color:#909399">{{ row.completion_rate }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="上线天数" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.days_online <= 7 ? 'warning' : ''">{{ row.days_online }}天</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="dark">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="锁定" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.locked" style="color:#FFB700"><Lock /></el-icon>
              <span v-else style="color:#606266">—</span>
            </template>
          </el-table-column>
          <el-table-column label="下架原因" min-width="180">
            <template #default="{ row }">
              <span style="font-size:12px;color:#909399">{{ row.reason || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="togglePublish(row)">
                {{ row.status === 'published' ? '手动下架' : '手动上架' }}
              </el-button>
              <el-button link :type="row.locked ? 'warning' : 'success'" size="small" @click="toggleLock(row)">
                {{ row.locked ? '取消锁定' : '锁定上架' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card>
        <template #header><span>上下架审计日志（最近7天）</span></template>
        <el-timeline>
          <el-timeline-item v-for="log in auditLogs" :key="log.id" :timestamp="log.time" :type="log.action === 'unpublish' ? 'danger' : 'success'">
            <strong>{{ log.action === 'unpublish' ? '⬇ 自动下架' : '⬆ 自动上架' }}</strong>
            ·《{{ log.title }}》
            <span style="color:#909399;font-size:12px;margin-left:8px">完成率{{ log.rate }}% · {{ log.reason }}</span>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight, Lock, CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'

const filterStatus = ref('')
const searchKey = ref('')

const stats = [
  { label: '已上架视频', value: 38, color: '#00FF94', bg: 'rgba(0,255,148,0.1)', icon: CircleCheck },
  { label: '已下架视频', value: 6,  color: '#FF4B6E', bg: 'rgba(255,75,110,0.1)', icon: CircleClose },
  { label: '保护期视频', value: 9,  color: '#409EFF', bg: 'rgba(64,158,255,0.1)', icon: Warning },
  { label: '今日处理数', value: 4,  color: '#FFB700', bg: 'rgba(255,183,0,0.1)',  icon: Warning },
]

interface VideoItem { id:number; title:string; course:string; language:string; completion_rate:number; days_online:number; status:'published'|'unpublished'|'protected'; locked:boolean; reason:string }

const videos = ref<VideoItem[]>([
  { id:1,  title:'Python基础语法概览',    course:'Python零基础入门',  language:'Python', completion_rate:72, days_online:45, status:'published',   locked:false, reason:'' },
  { id:2,  title:'列表与字典操作详解',    course:'Python零基础入门',  language:'Python', completion_rate:65, days_online:40, status:'published',   locked:false, reason:'' },
  { id:3,  title:'函数与作用域',          course:'Python零基础入门',  language:'Python', completion_rate:58, days_online:35, status:'published',   locked:false, reason:'' },
  { id:4,  title:'递归算法深度解析',      course:'数据结构与算法',    language:'Python', completion_rate:22, days_online:18, status:'unpublished', locked:false, reason:'完成率22%低于30%阈值，自动下架' },
  { id:5,  title:'图论BFS/DFS实现',       course:'数据结构与算法',    language:'Java',   completion_rate:18, days_online:25, status:'unpublished', locked:false, reason:'完成率18%低于30%阈值，自动下架' },
  { id:6,  title:'动态规划入门',          course:'数据结构与算法',    language:'Python', completion_rate:35, days_online:12, status:'published',   locked:false, reason:'' },
  { id:7,  title:'Java面向对象编程',      course:'Java后端开发',      language:'Java',   completion_rate:81, days_online:60, status:'published',   locked:true,  reason:'' },
  { id:8,  title:'Spring Boot快速上手',   course:'Java后端开发',      language:'Java',   completion_rate:44, days_online:5,  status:'protected',  locked:false, reason:'新视频7天保护期内' },
  { id:9,  title:'Vue3组合式API',         course:'前端Vue3实战',      language:'JS',     completion_rate:91, days_online:30, status:'published',   locked:true,  reason:'' },
  { id:10, title:'数据库索引优化',        course:'数据库原理与应用',  language:'SQL',    completion_rate:26, days_online:20, status:'unpublished', locked:false, reason:'完成率26%低于30%阈值，自动下架' },
  { id:11, title:'SQL联表查询技巧',       course:'数据库原理与应用',  language:'SQL',    completion_rate:67, days_online:28, status:'published',   locked:false, reason:'' },
  { id:12, title:'React Hooks深入',       course:'前端Vue3实战',      language:'JS',     completion_rate:3,  days_online:3,  status:'protected',  locked:false, reason:'新视频7天保护期内' },
])

const filteredVideos = computed(() => videos.value.filter(v => {
  if (filterStatus.value && v.status !== filterStatus.value) return false
  if (searchKey.value && !v.title.includes(searchKey.value)) return false
  return true
}))

const auditLogs = [
  { id:1, action:'unpublish', title:'递归算法深度解析',  rate:22, reason:'完成率不达标', time:'2026-04-02 02:03' },
  { id:2, action:'unpublish', title:'图论BFS/DFS实现',   rate:18, reason:'完成率不达标', time:'2026-04-02 02:03' },
  { id:3, action:'unpublish', title:'数据库索引优化',    rate:26, reason:'完成率不达标', time:'2026-04-02 02:04' },
  { id:4, action:'publish',   title:'动态规划入门',      rate:35, reason:'完成率达标重新上架', time:'2026-04-01 02:02' },
  { id:5, action:'unpublish', title:'高级排序算法',      rate:21, reason:'完成率不达标', time:'2026-03-31 02:01' },
  { id:6, action:'publish',   title:'Vue3组合式API',     rate:91, reason:'完成率达标持续上架', time:'2026-03-30 02:00' },
]

function getLangType(lang: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const m: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = { Python:'', Java:'success', JS:'warning', SQL:'info' }
  return m[lang] || ''
}
function getStatusType(s: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const m: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = { published:'success', unpublished:'danger', protected:'warning' }
  return m[s] || ''
}
function getStatusLabel(s: string) {
  return { published:'已上架', unpublished:'已下架', protected:'保护期' }[s] || s
}
function handleManualTrigger() { ElMessage.success('手动触发上下架检查完成，共处理3条视频') }
function togglePublish(row: VideoItem) {
  row.status = row.status === 'published' ? 'unpublished' : 'published'
  row.reason = row.status === 'unpublished' ? '教师手动下架' : ''
  ElMessage.success(`已${row.status === 'published' ? '上架' : '下架'}：${row.title}`)
}
function toggleLock(row: VideoItem) {
  row.locked = !row.locked
  ElMessage.success(`已${row.locked ? '锁定' : '解锁'}：${row.title}`)
}
</script>

<style scoped>
.video-publish-page { padding: 20px; min-height: 100%; }
.page-header { margin-bottom: 24px; }
.page-header h2 { margin: 0 0 6px; font-size: 22px; color: #F0F0F0; }
.desc { margin: 0; color: #909399; font-size: 13px; }
.stats-row { margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; gap: 14px; padding: 18px; background: #252525; border-radius: 10px; border: 1px solid #333; }
.stat-icon { width: 52px; height: 52px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-val { font-size: 28px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.filter-card { margin-bottom: 16px; }
.table-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
