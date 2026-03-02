<template>
  <StudentLayout>
    <template #content>
      <div class="my-partner">
        <div v-if="loading" v-loading="loading" class="loading-container"></div>
        
        <div v-else-if="partner" class="partner-content">
          <!-- 伙伴信息卡片 -->
          <PartnerCard :partner="partner" />

          <el-row :gutter="20">
            <!-- 聊天面板 -->
            <el-col :xs="24" :md="12">
              <el-card class="chat-card">
                <template #header>
                  <h3>与{{ partner.partner_name }}聊天</h3>
                </template>
                <PartnerChatPanel :partner-avatar="partner.partner_avatar" />
              </el-card>
            </el-col>

            <!-- 共同任务 -->
            <el-col :xs="24" :md="12">
              <el-card class="tasks-card">
                <template #header>
                  <h3>共同任务</h3>
                </template>
                <div v-if="tasks.length > 0">
                  <CollaborativeTaskCard
                    v-for="task in tasks"
                    :key="task.task_id"
                    :task="task"
                    @updated="loadTasks"
                  />
                </div>
                <el-empty v-else description="暂无任务" />
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" class="mt-4">
            <!-- 进度比拼 -->
            <el-col :xs="24" :md="12">
              <ProgressComparison
                v-if="progressData"
                :user-progress="progressData.userProgress"
                :partner-progress="progressData.partnerProgress"
                :progress-diff="progressData.progressDiff"
              />
            </el-col>

            <!-- 排行榜 -->
            <el-col :xs="24" :md="12">
              <CollaborationLeaderboard
                v-if="leaderboard.length > 0"
                :leaderboard="leaderboard"
              />
            </el-col>
          </el-row>
        </div>

        <el-empty v-else description="暂无学习伙伴，请先生成">
          <el-button type="primary" @click="generatePartner">生成学习伙伴</el-button>
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

const loading = ref(false)
const partner = ref<any>(null)
const tasks = ref<any[]>([])
const progressData = ref<any>(null)
const leaderboard = ref<any[]>([])

async function loadPartner() {
  loading.value = true
  try {
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>('/virtual-partner/info')
    const data = response.data as { partner?: unknown } | undefined
    if (response.code === 200 && data?.partner) {
      partner.value = data.partner
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
    const data = response.data as { tasks?: unknown[] } | undefined
    if (response.code === 200) {
      tasks.value = (data?.tasks || []) as typeof tasks.value
    }
  } catch (error) {
    console.error('加载任务失败:', error)
  }
}

async function loadProgressComparison() {
  try {
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>('/virtual-partner/leaderboard')
    const data = response.data as { progress_diff?: number } | undefined
    if (response.code === 200) {
      const diff = data?.progress_diff || 0
      // 模拟用户和伙伴进度
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
    const lbData = response.data as { leaderboard?: unknown[] } | undefined
    if (response.code === 200) {
      leaderboard.value = (lbData?.leaderboard || []) as typeof leaderboard.value
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
    const pathId = parseInt(value || '0')
    const response = await request.post<{ code?: number; data?: unknown; msg?: string }>('/virtual-partner/generate', {
      learning_path_id: pathId
    })

    if (response.code === 200) {
      ElMessage.success('伙伴生成成功！')
      await loadPartner()
    } else {
      ElMessage.error(response.msg || '生成失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('生成伙伴失败:', error)
      ElMessage.error(error.response?.data?.msg || '生成失败')
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

