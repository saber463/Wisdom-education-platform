<template>
  <StudentLayout>
    <template #content>
      <div class="my-partner">
        <div
          v-if="loading"
          v-loading="loading"
          class="loading-container"
        />
        
        <div
          v-else-if="partner"
          class="partner-content"
        >
          <!-- 伙伴信息卡片 -->
          <PartnerCard :partner="partner" />

          <el-row :gutter="20">
            <!-- 聊天面板 -->
            <el-col
              :xs="24"
              :md="12"
            >
              <el-card class="chat-card">
                <template #header>
                  <h3>与{{ partner.partner_name }}聊天</h3>
                </template>
                <PartnerChatPanel :partner-avatar="partner.partner_avatar ?? ''" />
              </el-card>
            </el-col>

            <!-- 共同任务 -->
            <el-col
              :xs="24"
              :md="12"
            >
              <el-card class="tasks-card">
                <template #header>
                  <h3>共同任务</h3>
                </template>
                <div v-if="tasks.length > 0">
                  <CollaborativeTaskCard
                    v-for="task in tasks"
                    :key="String(task.task_id)"
                    :task="task"
                    @updated="loadTasks"
                  />
                </div>
                <el-empty
                  v-else
                  description="暂无任务"
                />
              </el-card>
            </el-col>
          </el-row>

          <el-row
            :gutter="20"
            class="mt-4"
          >
            <!-- 进度比拼 -->
            <el-col
              :xs="24"
              :md="12"
            >
              <ProgressComparison
                v-if="progressData"
                :user-progress="progressData.userProgress"
                :partner-progress="progressData.partnerProgress"
                :progress-diff="progressData.progressDiff"
              />
            </el-col>

            <!-- 排行榜 -->
            <el-col
              :xs="24"
              :md="12"
            >
              <CollaborationLeaderboard
                v-if="leaderboard.length > 0"
                :leaderboard="leaderboard"
              />
            </el-col>
          </el-row>
        </div>

        <el-empty
          v-else
          description="暂无学习伙伴，请先生成"
        >
          <el-button
            type="primary"
            @click="generatePartner"
          >
            生成学习伙伴
          </el-button>
        </el-empty>
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'
import PartnerCard from '@/components/PartnerCard.vue'
import PartnerChatPanel from '@/components/PartnerChatPanel.vue'
import CollaborativeTaskCard from '@/components/CollaborativeTaskCard.vue'
import ProgressComparison from '@/components/ProgressComparison.vue'
import CollaborationLeaderboard from '@/components/CollaborationLeaderboard.vue'

interface Partner {
  partner_id: number
  partner_name: string
  partner_avatar: string
  partner_signature: string
  learning_ability_tag: 'efficient' | 'steady' | 'basic'
  partner_level?: number
  [key: string]: unknown
}

interface Task {
  task_id: number
  task_description: string
  user_progress: number
  partner_progress: number
  target_count: number
  completed: boolean
  reward?: { points: number; badge_fragment: string }
  [key: string]: unknown
}

interface LeaderboardItem {
  user_id: number
  partner_name: string
  completed_tasks: number
  rank: number
  [key: string]: unknown
}

interface ProgressData {
  userProgress: number
  partnerProgress: number
  progressDiff: number
}

const loading = ref(false)
const partner = ref<Partner | null>(null)
const tasks = ref<Task[]>([])
const progressData = ref<ProgressData | null>(null)
const leaderboard = ref<LeaderboardItem[]>([])

async function loadPartner() {
  loading.value = true
  try {
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>('/virtual-partner/info')
    const data = response.data as { partner?: Record<string, unknown> } | undefined
    if (response.code === 200 && data?.partner) {
      const tag = (data.partner.learning_ability_tag ?? 'steady') as 'efficient' | 'steady' | 'basic'
      partner.value = { ...data.partner, learning_ability_tag: tag } as Partner
      loadTasks()
      loadProgressComparison()
      loadLeaderboard()
    }
  } catch (error) {
    console.error('加载伙伴信息失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadTasks() {
  try {
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>('/virtual-partner/tasks')
    const data = response.data as { tasks?: Task[] } | undefined
    if (response.code === 200) {
      const list = (data?.tasks ?? []) as Array<Record<string, unknown>>
      tasks.value = list.map(t => {
        const r = t.reward as Record<string, unknown> | undefined
        return {
          ...t,
          reward: r ? { points: Number(r.points) || 0, badge_fragment: String(r.badge_fragment ?? '') } : undefined
        }
      }) as Task[]
    }
  } catch (error) {
    console.error('加载任务失败:', error)
  }
}

async function loadProgressComparison() {
  try {
    const response = await request.get<{ code?: number; data?: { progress_diff?: number }; msg?: string }>('/virtual-partner/leaderboard')
    const data = response.data
    if (response.code === 200 && data) {
      const diff = data.progress_diff ?? 0
      const userProgress = 50
      const partnerProgress = userProgress + (diff > 0 ? diff : -diff)
      progressData.value = {
        userProgress,
        partnerProgress,
        progressDiff: diff
      }
    }
  } catch (error) {
    console.error('加载进度比拼失败:', error)
  }
}

async function loadLeaderboard() {
  try {
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>('/virtual-partner/leaderboard')
    const lbData = response.data as { leaderboard?: LeaderboardItem[] } | undefined
    if (response.code === 200) {
      leaderboard.value = Array.isArray(lbData?.leaderboard) ? lbData.leaderboard : []
    }
  } catch (error) {
    console.error('加载排行榜失败:', error)
  }
}

async function generatePartner() {
  try {
    const { value } = await ElMessageBox.prompt('请输入学习路径ID', '生成学习伙伴', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^\d+$/,
      inputErrorMessage: '请输入有效的路径ID'
    })
    const pathId = parseInt(value ?? '0', 10)
    const response = await request.post<{ code?: number; data?: unknown; msg?: string }>('/virtual-partner/generate', {
      learning_path_id: pathId
    })

    if (response.code === 200) {
      ElMessage.success('伙伴生成成功！')
      await loadPartner()
    } else {
      ElMessage.error(response.msg || '生成失败')
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('生成伙伴失败:', error)
      const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg
      ElMessage.error(msg || '生成失败')
    }
  }
}

onMounted(() => {
  loadPartner()
})
</script>

<style scoped>
.my-partner {
  @apply p-6;
}

.loading-container {
  @apply min-h-[400px];
}

.partner-content {
  @apply space-y-4;
}

.chat-card,
.tasks-card {
  @apply h-[500px];
}
</style>

