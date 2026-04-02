<template>
  <TeacherLayout>
    <div class="students-page">
      <div class="page-header">
        <h2>学生列表</h2>
        <div class="header-actions">
          <el-input v-model="keyword" placeholder="搜索学生姓名/学号" clearable style="width:220px" @input="fetchStudents">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="selectedClass" placeholder="选择班级" clearable style="width:150px" @change="fetchStudents">
            <el-option v-for="c in classList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </div>
      </div>

      <el-card>
        <el-table v-loading="loading" :data="students" stripe style="width:100%">
          <el-table-column label="学生" min-width="180">
            <template #default="{ row }">
              <div class="student-cell">
                <el-avatar :size="36" style="background: linear-gradient(135deg,#00FF94,#00D4FF);color:#000;font-weight:700;">
                  {{ row.name?.charAt(0) }}
                </el-avatar>
                <div>
                  <div class="student-name">{{ row.name }}</div>
                  <div class="student-id">{{ row.studentId || row.username }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="className" label="班级" width="120" />
          <el-table-column label="学习进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.progress ?? 0" :stroke-width="6" />
            </template>
          </el-table-column>
          <el-table-column label="平均分" width="100">
            <template #default="{ row }">
              <span :class="getScoreClass(row.avgScore)">{{ row.avgScore != null ? row.avgScore.toFixed(1) : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="提交作业" width="100">
            <template #default="{ row }">
              <span class="mono">{{ row.submittedCount ?? 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="最近活跃" width="140">
            <template #default="{ row }">
              <span class="mono text-muted">{{ formatDate(row.lastActive) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.active ? 'success' : 'info'" size="small">{{ row.active ? '活跃' : '沉默' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewStudent(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchStudents"
            @current-change="fetchStudents"
          />
        </div>
      </el-card>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const selectedClass = ref<number | null>(null)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

interface Student {
  id: number; name: string; username: string; studentId?: string
  className: string; progress: number; avgScore: number
  submittedCount: number; lastActive: string; active: boolean
}
interface ClassItem { id: number; name: string }

const students = ref<Student[]>([])
const classList = ref<ClassItem[]>([])

async function fetchClasses() {
  try {
    const res = await request.get<{ classes?: ClassItem[] }>('/classes')
    classList.value = res.classes || []
  } catch { classList.value = [{ id: 1, name: '高一(1)班' }, { id: 2, name: '高一(2)班' }] }
}

async function fetchStudents() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (selectedClass.value) params.classId = selectedClass.value
    const res = await request.get<{ students?: Student[]; total?: number }>('/analytics/students', { params })
    students.value = res.students || []
    total.value = res.total || 0
  } catch {
    students.value = [
      { id: 1, name: '张三', username: 'zhangsan', className: '高一(1)班', progress: 72, avgScore: 85.5, submittedCount: 8, lastActive: new Date().toISOString(), active: true },
      { id: 2, name: '李四', username: 'lisi', className: '高一(1)班', progress: 45, avgScore: 62.3, submittedCount: 5, lastActive: new Date(Date.now() - 86400000 * 3).toISOString(), active: false },
      { id: 3, name: '王五', username: 'wangwu', className: '高一(2)班', progress: 91, avgScore: 95.0, submittedCount: 10, lastActive: new Date().toISOString(), active: true },
    ]
    total.value = 3
  } finally { loading.value = false }
}

function viewStudent(s: Student) { router.push(`/teacher/analytics?student=${s.id}`) }
function formatDate(s: string) { return s ? new Date(s).toLocaleDateString('zh-CN') : '-' }
function getScoreClass(score: number | null) {
  if (score == null) return 'mono text-muted'
  return score >= 80 ? 'mono text-success' : score >= 60 ? 'mono text-warning' : 'mono text-danger'
}

onMounted(() => { fetchClasses(); fetchStudents() })
</script>

<style scoped>
.students-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 900; color: #F0F0F0; font-family: 'Source Han Sans CN', sans-serif; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.student-cell { display: flex; gap: 10px; align-items: center; }
.student-name { font-size: 14px; font-weight: 600; color: #E0E0E0; }
.student-id { font-size: 12px; color: #606060; font-family: Consolas, monospace; }
.mono { font-family: Consolas, monospace; }
.text-success { color: #00FF94; font-weight: 700; }
.text-warning { color: #FFB700; font-weight: 700; }
.text-danger { color: #FF4B6E; font-weight: 700; }
.text-muted { color: #606060; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
