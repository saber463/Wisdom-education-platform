<template>
  <TeacherLayout>
    <div class="teacher-dashboard">
      <h2>欢迎回来，{{ userStore.displayName }}</h2>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #409eff;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalAssignments }}</div>
              <div class="stat-label">作业总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #67c23a;">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.gradedCount }}</div>
              <div class="stat-label">已批改</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #e6a23c;">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingCount }}</div>
              <div class="stat-label">待批改</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #f56c6c;">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalStudents }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 快捷操作 -->
      <el-row :gutter="20" class="quick-actions">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>快捷操作</span>
            </template>
            <div class="action-buttons">
              <el-button type="primary" @click="$router.push('/teacher/assignments/create')">
                <el-icon><Plus /></el-icon>创建作业
              </el-button>
              <el-button @click="$router.push('/teacher/grading')">
                <el-icon><Edit /></el-icon>批改作业
              </el-button>
              <el-button @click="$router.push('/teacher/analytics')">
                <el-icon><DataAnalysis /></el-icon>学情分析
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>最近作业</span>
            </template>
            <el-table :data="recentAssignments" size="small" style="width: 100%">
              <el-table-column prop="title" label="作业名称" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                    {{ row.status === 'published' ? '已发布' : '草稿' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'
import { Document, Check, Clock, User, Plus, Edit, DataAnalysis } from '@element-plus/icons-vue'

const userStore = useUserStore()

const stats = reactive({
  totalAssignments: 0,
  gradedCount: 0,
  pendingCount: 0,
  totalStudents: 0
})

const recentAssignments = ref<Array<{ id: number; title: string; status: string }>>([])

async function fetchDashboardData() {
  try {
    const response = await request.get<Record<string, unknown>>('/teacher/dashboard')
    if (response) {
      stats.totalAssignments = Number(response.totalAssignments) || 0
      stats.gradedCount = Number(response.gradedCount) || 0
      stats.pendingCount = Number(response.pendingCount) || 0
      stats.totalStudents = Number(response.totalStudents) || 0
      recentAssignments.value = (response.recentAssignments || []) as typeof recentAssignments.value
    }
  } catch (error) {
    console.error('[教师工作台] 获取数据失败:', error)
  }
}

onMounted(() => { fetchDashboardData() })
</script>

<style scoped>
.teacher-dashboard { padding: 10px; }
.teacher-dashboard h2 { margin: 0 0 20px 0; font-size: 24px; color: #333; }
.stat-cards { margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; padding: 10px; }
.stat-icon { width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; }
.stat-icon .el-icon { font-size: 28px; color: #fff; }
.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: bold; color: #333; }
.stat-label { font-size: 14px; color: #999; }
.quick-actions { margin-bottom: 20px; }
.action-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
</style>
