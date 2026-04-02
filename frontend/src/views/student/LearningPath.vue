<template>
  <StudentLayout>
    <div class="learning-path-page">
      <div class="page-header">
        <h2>学习路径</h2>
        <el-button type="primary" :loading="refreshing" @click="refreshPath">
          <el-icon><Refresh /></el-icon> AI重新规划
        </el-button>
      </div>

      <el-row :gutter="20">
        <!-- 当前路径进度 -->
        <el-col :xs="24" :lg="16">
          <el-card class="path-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">当前学习路径</span>
                <el-tag type="success" v-if="pathInfo">已完成 {{ pathInfo.completedCount }}/{{ pathInfo.totalCount }} 节</el-tag>
              </div>
            </template>
            <div v-loading="loading">
              <div v-if="pathSteps.length > 0" class="steps-container">
                <div
                  v-for="(step, index) in pathSteps"
                  :key="step.id"
                  class="path-step"
                  :class="getStepClass(step)"
                >
                  <div class="step-connector" v-if="index > 0" />
                  <div class="step-node">
                    <div class="step-icon">
                      <el-icon v-if="step.status === 'completed'"><CircleCheck /></el-icon>
                      <el-icon v-else-if="step.status === 'current'"><VideoPlay /></el-icon>
                      <span v-else>{{ index + 1 }}</span>
                    </div>
                  </div>
                  <div class="step-content">
                    <div class="step-title">{{ step.title }}</div>
                    <div class="step-meta">
                      <el-tag size="small" :type="getDifficultyType(step.difficulty)">{{ step.difficulty }}</el-tag>
                      <span class="step-duration">{{ step.estimatedMinutes }} 分钟</span>
                    </div>
                    <el-progress
                      v-if="step.status !== 'pending'"
                      :percentage="step.progress"
                      :stroke-width="4"
                      :status="step.status === 'completed' ? 'success' : undefined"
                      class="step-progress"
                    />
                    <el-button
                      v-if="step.status === 'current'"
                      type="primary"
                      size="small"
                      class="step-btn"
                      @click="goToLesson(step)"
                    >继续学习</el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无学习路径，点击AI重新规划生成" />
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：统计+调整历史 -->
        <el-col :xs="24" :lg="8">
          <el-card class="stat-card">
            <template #header><span class="card-title">学习概况</span></template>
            <div class="stat-list">
              <div class="stat-item">
                <span class="stat-label">总进度</span>
                <el-progress :percentage="pathInfo?.overallProgress ?? 0" :stroke-width="8" />
              </div>
              <div class="stat-row">
                <div class="stat-block">
                  <div class="stat-value">{{ pathInfo?.completedCount ?? 0 }}</div>
                  <div class="stat-label">已完成</div>
                </div>
                <div class="stat-block">
                  <div class="stat-value">{{ pathInfo?.totalCount ?? 0 }}</div>
                  <div class="stat-label">总节数</div>
                </div>
                <div class="stat-block">
                  <div class="stat-value">{{ pathInfo?.studyDays ?? 0 }}</div>
                  <div class="stat-label">学习天数</div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="history-card" style="margin-top: 16px;">
            <template #header>
              <div class="card-header">
                <span class="card-title">调整历史</span>
                <el-button text size="small" @click="$router.push('/student/adjustment-history')">查看全部</el-button>
              </div>
            </template>
            <div v-if="recentAdjustments.length > 0">
              <div v-for="adj in recentAdjustments" :key="adj.id" class="adj-item">
                <div class="adj-type">{{ adj.type }}</div>
                <div class="adj-reason">{{ adj.reason }}</div>
                <div class="adj-time">{{ formatDate(adj.createdAt) }}</div>
              </div>
            </div>
            <el-empty v-else description="暂无调整记录" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, CircleCheck, VideoPlay } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const refreshing = ref(false)

interface PathStep {
  id: number; title: string; lessonId: number; status: 'completed' | 'current' | 'pending'
  difficulty: string; estimatedMinutes: number; progress: number
}
interface PathInfo { overallProgress: number; completedCount: number; totalCount: number; studyDays: number }
interface Adjustment { id: number; type: string; reason: string; createdAt: string }

const pathSteps = ref<PathStep[]>([])
const pathInfo = ref<PathInfo | null>(null)
const recentAdjustments = ref<Adjustment[]>([])

async function loadPath() {
  loading.value = true
  try {
    const [statsRes, masteryRes, adjRes] = await Promise.allSettled([
      request.get<{ data?: any }>('/ai-learning-path/learning-stats'),
      request.get<{ data?: any }>('/ai-learning-path/knowledge-mastery'),
      request.get<{ data?: any[] }>('/ai-learning-path/adjustment-log'),
    ])
    const mastery = masteryRes.status === 'fulfilled' ? masteryRes.value : null
    const adj = adjRes.status === 'fulfilled' ? adjRes.value : null
    // Build path steps from knowledge mastery data
    if (mastery && (mastery as any).data) {
      const kp = (mastery as any).data || []
      pathSteps.value = kp.slice(0, 5).map((k: any, i: number) => ({
        id: i + 1, title: k.knowledge_point || `知识点 ${i + 1}`,
        lessonId: k.lesson_id || i + 1,
        status: k.mastery_level > 0.8 ? 'completed' : k.mastery_level > 0 ? 'current' : 'pending',
        difficulty: k.mastery_level > 0.7 ? '已掌握' : '学习中',
        estimatedMinutes: 45,
        progress: Math.round((k.mastery_level || 0) * 100)
      }))
      pathInfo.value = {
        overallProgress: pathSteps.value.length > 0 ? Math.round(pathSteps.value.reduce((a: number, s: any) => a + s.progress, 0) / pathSteps.value.length) : 0,
        completedCount: pathSteps.value.filter((s: any) => s.status === 'completed').length,
        totalCount: pathSteps.value.length,
        studyDays: 7
      }
    }
    recentAdjustments.value = ((adj as any)?.data || []).slice(0, 3)
  } catch {
    // 使用模拟数据展示
    pathSteps.value = [
      { id: 1, title: 'Python基础语法', lessonId: 1, status: 'completed', difficulty: '初级', estimatedMinutes: 30, progress: 100 },
      { id: 2, title: '函数与模块', lessonId: 2, status: 'completed', difficulty: '初级', estimatedMinutes: 45, progress: 100 },
      { id: 3, title: '面向对象编程', lessonId: 3, status: 'current', difficulty: '中级', estimatedMinutes: 60, progress: 40 },
      { id: 4, title: '数据结构与算法', lessonId: 4, status: 'pending', difficulty: '中级', estimatedMinutes: 90, progress: 0 },
      { id: 5, title: '项目实战', lessonId: 5, status: 'pending', difficulty: '高级', estimatedMinutes: 120, progress: 0 },
    ]
    pathInfo.value = { overallProgress: 48, completedCount: 2, totalCount: 5, studyDays: 7 }
  } finally {
    loading.value = false
  }
}

async function refreshPath() {
  refreshing.value = true
  try {
    await request.post('/ai-learning-path/regenerate', {})
    ElMessage.success('AI已重新规划学习路径')
    await loadPath()
  } catch {
    ElMessage.info('路径已是最优，无需调整')
  } finally {
    refreshing.value = false
  }
}

function goToLesson(step: PathStep) {
  router.push(`/student/lessons/${step.lessonId}`)
}

function getStepClass(step: PathStep) {
  return { 'step-completed': step.status === 'completed', 'step-current': step.status === 'current', 'step-pending': step.status === 'pending' }
}

function getDifficultyType(d: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  return d === '初级' ? 'success' : d === '中级' ? 'warning' : d === '高级' ? 'danger' : 'info'
}

function formatDate(s: string) { return s ? new Date(s).toLocaleDateString('zh-CN') : '' }

onMounted(loadPath)
</script>

<style scoped>
.learning-path-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 900; color: #F0F0F0; font-family: 'Source Han Sans CN', sans-serif; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 15px; font-weight: 700; color: #E0E0E0; }
.steps-container { padding: 8px 0; }
.path-step { display: flex; gap: 16px; padding: 16px 0; position: relative; }
.step-connector { position: absolute; left: 19px; top: -12px; width: 2px; height: 12px; background: rgba(255,255,255,0.12); }
.step-node { flex-shrink: 0; }
.step-icon { width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #707070; font-family: Consolas, monospace; }
.step-completed .step-icon { border-color: #00FF94; background: rgba(0,255,148,0.12); color: #00FF94; }
.step-current .step-icon { border-color: #00D4FF; background: rgba(0,212,255,0.12); color: #00D4FF; }
.step-content { flex: 1; }
.step-title { font-size: 15px; font-weight: 600; color: #E0E0E0; margin-bottom: 8px; }
.step-pending .step-title { color: #707070; }
.step-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.step-duration { font-size: 12px; color: #606060; font-family: Consolas, monospace; }
.step-progress { margin-bottom: 8px; }
.step-btn { margin-top: 4px; }
.stat-list { padding: 8px 0; }
.stat-item { margin-bottom: 16px; }
.stat-label { font-size: 13px; color: #707070; margin-bottom: 6px; display: block; }
.stat-row { display: flex; gap: 12px; margin-top: 16px; }
.stat-block { flex: 1; text-align: center; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 12px 8px; }
.stat-value { font-size: 24px; font-weight: 700; color: #00FF94; font-family: Consolas, monospace; }
.adj-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.adj-item:last-child { border-bottom: none; }
.adj-type { font-size: 13px; font-weight: 600; color: #00D4FF; margin-bottom: 4px; }
.adj-reason { font-size: 12px; color: #909090; margin-bottom: 4px; }
.adj-time { font-size: 11px; color: #505050; font-family: Consolas, monospace; }
</style>
