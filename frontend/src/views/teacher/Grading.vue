<template>
  <TeacherLayout>
    <div class="grading-page">
      <div class="page-header">
        <h2>批改管理</h2>
      </div>

      <el-card class="filter-card">
        <el-form
          :inline="true"
          :model="filterForm"
          class="filter-form"
        >
          <el-form-item label="作业">
            <el-select
              v-model="filterForm.assignmentId"
              placeholder="选择作业"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="a in assignmentList"
                :key="a.id"
                :label="a.title"
                :value="a.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="filterForm.status"
              placeholder="选择状态"
              clearable
            >
              <el-option
                label="待批改"
                value="submitted"
              />
              <el-option
                label="批改中"
                value="grading"
              />
              <el-option
                label="已批改"
                value="graded"
              />
              <el-option
                label="已复核"
                value="reviewed"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="fetchSubmissions"
            >
              查询
            </el-button>
            <el-button @click="resetFilter">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="list-card">
        <el-table
          v-loading="loading"
          :data="submissionList"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="studentName"
            label="学生姓名"
            width="120"
          />
          <el-table-column
            prop="assignmentTitle"
            label="作业名称"
            min-width="200"
          />
          <el-table-column
            prop="submitTime"
            label="提交时间"
            width="180"
          >
            <template #default="{ row }">
              {{ formatDate(row.submitTime) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="totalScore"
            label="得分"
            width="100"
          >
            <template #default="{ row }">
              <span
                v-if="row.totalScore !== null"
                :class="getScoreClass(row.totalScore, row.maxScore)"
              >
                {{ row.totalScore }} / {{ row.maxScore }}
              </span>
              <span
                v-else
                class="text-muted"
              >-</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            label="状态"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="150"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="handleDetail(row.id)"
              >
                {{ row.status === 'graded' || row.status === 'reviewed' ? '查看/复核' : '批改' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchSubmissions"
            @current-change="fetchSubmissions"
          />
        </div>
      </el-card>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)

interface Submission {
  id: number; studentId: number; studentName: string; assignmentId: number; assignmentTitle: string
  submitTime: string; totalScore: number | null; maxScore: number; status: string
}

const assignmentList = ref<Array<{ id: number; title: string }>>([])
const submissionList = ref<Submission[]>([])
const filterForm = reactive({ assignmentId: null as number | null, status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

async function fetchAssignments() {
  try {
    const response = await request.get<{ assignments?: Array<{ id: number; title: string }> }>('/assignments', { params: { status: 'published' } })
    assignmentList.value = response.assignments || []
  } catch (error) { console.error('[批改管理] 获取作业列表失败:', error) }
}

async function fetchSubmissions() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: pagination.page, pageSize: pagination.pageSize }
    if (filterForm.assignmentId) params.assignmentId = filterForm.assignmentId
    if (filterForm.status) params.status = filterForm.status
    const response = await request.get<{ submissions?: Submission[]; total?: number }>('/grading/submissions', { params })
    submissionList.value = response.submissions || []
    pagination.total = response.total || 0
  } catch (error) {
    console.error('[批改管理] 获取提交列表失败:', error)
    ElMessage.error('获取提交列表失败')
  } finally { loading.value = false }
}

function resetFilter() {
  filterForm.assignmentId = null
  filterForm.status = ''
  pagination.page = 1
  fetchSubmissions()
}

function handleDetail(id: number) { router.push(`/teacher/grading/${id}`) }
function formatDate(dateStr: string): string { return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-' }

function getScoreClass(score: number, maxScore: number): string {
  const ratio = score / maxScore
  if (ratio >= 0.9) return 'text-success'
  if (ratio >= 0.6) return 'text-warning'
  return 'text-danger'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = { submitted: '待批改', grading: '批改中', graded: '已批改', reviewed: '已复核' }
  return labels[status] || status
}

function getStatusType(status: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = { submitted: 'warning', grading: 'info', graded: 'success', reviewed: '' }
  return types[status] || ''
}

onMounted(() => { fetchAssignments(); fetchSubmissions() })
</script>

<style scoped>
.grading-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 900; color: #F0F0F0; font-family: 'Source Han Sans CN', sans-serif; }
.filter-card { margin-bottom: 20px; }
.filter-form { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.list-card { min-height: 400px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
.text-success { color: #00FF94; font-weight: bold; font-family: Consolas, monospace; }
.text-warning { color: #FFB700; font-weight: bold; font-family: Consolas, monospace; }
.text-danger  { color: #FF4B6E; font-weight: bold; font-family: Consolas, monospace; }
.text-muted   { color: #606060; font-family: Consolas, monospace; }
</style>
