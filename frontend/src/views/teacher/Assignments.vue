<template>
  <TeacherLayout>
    <div class="assignments-page">
      <!-- 页面标题和操作 -->
      <div class="page-header">
        <h2>作业管理</h2>
        <el-button
          type="primary"
          @click="handleCreate"
        >
          <el-icon><Plus /></el-icon>
          创建作业
        </el-button>
      </div>

      <!-- 搜索和筛选 -->
      <el-card class="filter-card">
        <el-form
          :inline="true"
          :model="filterForm"
          class="filter-form"
        >
          <el-form-item label="班级">
            <el-select
              v-model="filterForm.classId"
              placeholder="选择班级"
              clearable
            >
              <el-option
                v-for="cls in classList"
                :key="cls.id"
                :label="cls.name"
                :value="cls.id"
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
                label="草稿"
                value="draft"
              />
              <el-option
                label="已发布"
                value="published"
              />
              <el-option
                label="已关闭"
                value="closed"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="fetchAssignments"
            >
              查询
            </el-button>
            <el-button @click="resetFilter">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 作业列表 -->
      <el-card class="list-card">
        <el-table
          v-loading="loading"
          :data="assignmentList"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="title"
            label="作业名称"
            min-width="200"
          >
            <template #default="{ row }">
              <el-link
                type="primary"
                @click="handleDetail(row.id)"
              >
                {{ row.title }}
              </el-link>
            </template>
          </el-table-column>
          
          <el-table-column
            prop="className"
            label="班级"
            width="120"
          />
          
          <el-table-column
            prop="difficulty"
            label="难度"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="getDifficultyType(row.difficulty)">
                {{ getDifficultyLabel(row.difficulty) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column
            prop="createdAt"
            label="发布时间"
            width="180"
          >
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          
          <el-table-column
            prop="deadline"
            label="截止时间"
            width="180"
          >
            <template #default="{ row }">
              <span :class="{ 'text-danger': isExpired(row.deadline) }">
                {{ formatDate(row.deadline) }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column
            label="提交人数"
            width="120"
          >
            <template #default="{ row }">
              <span>{{ row.submittedCount || 0 }} / {{ row.totalStudents || 0 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column
            label="批改进度"
            width="150"
          >
            <template #default="{ row }">
              <el-progress
                :percentage="getGradingProgress(row)"
                :status="getProgressStatus(row)"
                :stroke-width="8"
              />
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
            width="200"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'draft'"
                type="primary"
                size="small"
                @click="handlePublish(row)"
              >
                发布
              </el-button>
              <el-button
                size="small"
                @click="handleDetail(row.id)"
              >
                详情
              </el-button>
              <el-button
                v-if="row.status === 'draft'"
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchAssignments"
            @current-change="fetchAssignments"
          />
        </div>
      </el-card>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
/**
 * 作业管理页面
 * 
 * 功能：
 * - 显示作业列表（名称、发布时间、提交人数、批改进度）
 * - 作业创建、发布、删除
 * 
 * 需求：1.2, 1.6
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 班级列表
const classList = ref<Array<{ id: number; name: string }>>([])

// 筛选表单
const filterForm = reactive({
  classId: null as number | null,
  status: '' as string
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 作业列表数据
interface Assignment {
  id: number
  title: string
  description: string
  classId: number
  className: string
  teacherId: number
  difficulty: 'basic' | 'medium' | 'advanced'
  totalScore: number
  deadline: string
  status: 'draft' | 'published' | 'closed'
  createdAt: string
  updatedAt: string
  submittedCount: number
  gradedCount: number
  totalStudents: number
}

const assignmentList = ref<Assignment[]>([])

// 获取班级列表
async function fetchClasses() {
  try {
    const response = await request.get<{ classes?: Array<{ id: number; name: string }> }>('/classes')
    classList.value = response.classes || []
  } catch (error) {
    console.error('[作业管理] 获取班级列表失败:', error)
  }
}

// 获取作业列表
async function fetchAssignments() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterForm.classId) {
      params.classId = filterForm.classId
    }
    if (filterForm.status) {
      params.status = filterForm.status
    }
    
    const response = await request.get<{ 
      assignments?: Assignment[]
      total?: number 
    }>('/assignments', { params })
    
    assignmentList.value = response.assignments || []
    pagination.total = response.total || 0
  } catch (error) {
    console.error('[作业管理] 获取作业列表失败:', error)
    ElMessage.error('获取作业列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选
function resetFilter() {
  filterForm.classId = null
  filterForm.status = ''
  pagination.page = 1
  fetchAssignments()
}

// 创建作业
function handleCreate() {
  router.push('/teacher/assignments/create')
}

// 查看详情
function handleDetail(id: number) {
  router.push(`/teacher/assignments/${id}`)
}

// 发布作业
async function handlePublish(row: Assignment) {
  try {
    await ElMessageBox.confirm(
      `确定要发布作业"${row.title}"吗？发布后将通知班级所有学生。`,
      '发布确认',
      {
        confirmButtonText: '确定发布',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await request.post(`/assignments/${row.id}/publish`)
    ElMessage.success('作业发布成功')
    fetchAssignments()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('[作业管理] 发布作业失败:', error)
      const d = (error as { response?: { data?: { message?: string } } })?.response?.data
      ElMessage.error(d?.message || '发布作业失败')
    }
  }
}

// 删除作业
async function handleDelete(row: Assignment) {
  try {
    await ElMessageBox.confirm(
      `确定要删除作业"${row.title}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await request.delete(`/assignments/${row.id}`)
    ElMessage.success('作业删除成功')
    fetchAssignments()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('[作业管理] 删除作业失败:', error)
      ElMessage.error('删除作业失败')
    }
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 判断是否过期
function isExpired(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

// 获取批改进度百分比
function getGradingProgress(row: Assignment): number {
  if (!row.submittedCount) return 0
  return Math.round((row.gradedCount / row.submittedCount) * 100)
}

// 获取进度状态
function getProgressStatus(row: Assignment): '' | 'success' | 'warning' | 'exception' {
  const progress = getGradingProgress(row)
  if (progress === 100) return 'success'
  if (progress >= 50) return ''
  return 'warning'
}

// 获取难度标签
function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    basic: '基础',
    medium: '中等',
    advanced: '提高'
  }
  return labels[difficulty] || difficulty
}

// 获取难度类型
function getDifficultyType(difficulty: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    basic: 'success',
    medium: 'warning',
    advanced: 'danger'
  }
  return types[difficulty] || ''
}

// 获取状态标签
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    closed: '已关闭'
  }
  return labels[status] || status
}

// 获取状态类型
function getStatusType(status: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    draft: 'info',
    published: 'success',
    closed: 'warning'
  }
  return types[status] || ''
}

// 初始化
onMounted(() => {
  fetchClasses()
  fetchAssignments()
})
</script>

<style scoped>
.assignments-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.list-card {
  min-height: 400px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.text-danger {
  color: #f56c6c;
}
</style>
