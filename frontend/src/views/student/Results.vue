<template>
  <StudentLayout>
    <div class="student-results-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>批改结果</h2>
        <p class="page-desc">查看已批改的作业结果</p>
      </div>

      <!-- 筛选条件 -->
      <el-card class="filter-card">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="已批改" value="graded" />
              <el-option label="已复核" value="reviewed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchResults">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 结果列表 -->
      <el-card class="results-card">
        <el-table :data="results" v-loading="loading" stripe>
          <el-table-column prop="assignment_title" label="作业名称" min-width="200">
            <template #default="{ row }">
              <span class="assignment-title">{{ row.assignment_title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="submit_time" label="提交时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.submit_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="grading_time" label="批改时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.grading_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="total_score" label="得分" width="120" align="center">
            <template #default="{ row }">
              <span class="score" :class="getScoreClass(row.total_score, row.max_score)">
                {{ row.total_score ?? '-' }}
              </span>
              <span class="max-score">/ {{ row.max_score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row.id)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchResults"
            @current-change="fetchResults"
          />
        </div>
      </el-card>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生批改结果列表页面
 * 显示已批改的作业列表
 * 需求：5.4
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)

interface GradingResult {
  id: number
  assignment_id: number
  assignment_title: string
  submit_time: string
  grading_time: string | null
  total_score: number | null
  max_score: number
  status: 'submitted' | 'grading' | 'graded' | 'reviewed'
}

const results = ref<GradingResult[]>([])
const filterForm = ref({ status: '' })
const pagination = ref({ page: 1, pageSize: 10, total: 0 })

async function fetchResults() {
  loading.value = true
  try {
    const response = await request.get<{
      success?: boolean
      data?: { submissions: GradingResult[]; total: number }
    }>('/grading/student/results', {
      params: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        status: filterForm.value.status || undefined
      }
    })
    if (response.success && response.data) {
      results.value = response.data.submissions || []
      pagination.value.total = response.data.total || 0
    }
  } catch (error: any) {
    console.error('[批改结果] 获取失败:', error)
    ElMessage.error(error.response?.data?.message || '获取批改结果失败')
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.value = { status: '' }
  pagination.value.page = 1
  fetchResults()
}

function viewDetail(id: number) {
  router.push(`/student/results/${id}`)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: '待批改', grading: '批改中', graded: '已批改', reviewed: '已复核'
  }
  return labels[status] || status
}

function getStatusType(status: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    submitted: 'warning', grading: 'info', graded: 'success', reviewed: ''
  }
  return types[status] || ''
}

function getScoreClass(score: number | null, maxScore: number): string {
  if (score === null) return ''
  const ratio = score / maxScore
  if (ratio >= 0.9) return 'excellent'
  if (ratio >= 0.6) return 'pass'
  return 'fail'
}

onMounted(() => { fetchResults() })
</script>

<style scoped>
.student-results-page { min-height: 100%; }
.page-header { margin-bottom: 20px; }
.page-header h2 { margin: 0 0 8px 0; font-size: 20px; color: #333; }
.page-desc { margin: 0; color: #909399; font-size: 14px; }
.filter-card { margin-bottom: 20px; }
.results-card { margin-bottom: 20px; }
.assignment-title { font-weight: 500; color: #333; }
.score { font-weight: bold; font-size: 16px; }
.score.excellent { color: #67c23a; }
.score.pass { color: #e6a23c; }
.score.fail { color: #f56c6c; }
.max-score { color: #909399; font-size: 13px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
