<template>
  <el-card
    class="task-card"
    shadow="hover"
  >
    <div class="task-header">
      <h4>{{ task.task_description }}</h4>
      <el-tag
        v-if="task.completed"
        type="success"
        size="small"
      >
        已完成
      </el-tag>
    </div>
    <div class="task-progress">
      <div class="progress-info">
        <span>我的进度：{{ task.user_progress }} / {{ task.target_count }}</span>
        <span>伙伴进度：{{ task.partner_progress }} / {{ task.target_count }}</span>
      </div>
      <el-progress
        :percentage="(task.user_progress / task.target_count) * 100"
        :status="task.completed ? 'success' : ''"
      />
    </div>
    <div
      v-if="task.completed && task.reward"
      class="task-reward"
    >
      <span>奖励：{{ task.reward.points }}积分</span>
      <span v-if="task.reward.badge_fragment">+ {{ task.reward.badge_fragment }}</span>
    </div>
    <div
      v-else
      class="task-actions"
    >
      <el-button
        type="primary"
        size="small"
        @click="updateProgress"
      >
        更新进度
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

interface Task {
  task_id: number
  task_description: string
  user_progress: number
  partner_progress: number
  target_count: number
  completed: boolean
  reward?: {
    points: number
    badge_fragment: string
  }
}

interface Props {
  task: Task
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'updated': []
}>()

async function updateProgress() {
  try {
    const newProgress = Math.min(props.task.user_progress + 1, props.task.target_count)
    const response = await request.post<{ code?: number; msg?: string }>(`/virtual-partner/tasks/${props.task.task_id}/progress`, {
      progress: newProgress
    })

    if (response.code === 200) {
      ElMessage.success('进度已更新')
      emit('updated')
    } else {
      ElMessage.error(response.msg || '更新失败')
    }
  } catch (error: unknown) {
    console.error('更新任务进度失败:', error)
    const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg
    ElMessage.error(msg || '更新失败')
  }
}
</script>

<style scoped>
.task-card {
  @apply mb-4;
}

.task-header {
  @apply flex items-center justify-between mb-3;
}

.task-header h4 {
  @apply text-lg font-semibold text-gray-800;
}

.task-progress {
  @apply mb-3;
}

.progress-info {
  @apply flex justify-between text-sm text-gray-600 mb-2;
}

.task-reward {
  @apply text-sm text-success-500 font-semibold;
}

.task-actions {
  @apply mt-3;
}
</style>

