<template>
  <StudentLayout>
    <template #content>
      <div class="adjustment-history">
        <el-card>
          <template #header>
            <div class="header-content">
              <h2>路径调整历史</h2>
              <div class="filters">
                <el-select
                  v-model="filters.adjustmentType"
                  placeholder="调整类型"
                  clearable
                  @change="loadLogs"
                >
                  <el-option
                    label="知识点评估"
                    value="knowledge_evaluation"
                  />
                  <el-option
                    label="能力适配"
                    value="ability_adaptation"
                  />
                  <el-option
                    label="进度优化"
                    value="progress_optimization"
                  />
                </el-select>
                <el-input-number
                  v-model="filters.limit"
                  :min="10"
                  :max="100"
                  :step="10"
                  style="width: 120px; margin-left: 10px;"
                  @change="loadLogs"
                />
              </div>
            </div>
          </template>

          <div v-loading="loading">
            <PathAdjustmentLog
              v-if="logs.length > 0"
              :logs="logs"
            />
            <el-empty
              v-else
              description="暂无调整记录"
            />
          </div>
        </el-card>
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'
import PathAdjustmentLog from '@/components/PathAdjustmentLog.vue'

/** 与 PathAdjustmentLog 组件的 logs 类型一致 */
interface AdjustmentLog {
  id: string
  learning_path_id: number
  adjustment_type: 'knowledge_evaluation' | 'ability_adaptation' | 'progress_optimization'
  trigger_event: string
  adjustment_details: Array<{
    knowledge_point_id?: number
    knowledge_point_name: string
    old_mastery_level?: string
    new_mastery_level?: string
    action: string
    reason: string
    [key: string]: unknown
  }>
  learning_ability_tag: string
  evaluation_score: number
  adjustment_summary: string
  created_at: string
}

const route = useRoute()

const loading = ref(false)
const logs = ref<AdjustmentLog[]>([])

const filters = ref({
  adjustmentType: '',
  limit: 20
})

async function loadLogs() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      limit: filters.value.limit
    }

    if (filters.value.adjustmentType) {
      params.adjustment_type = filters.value.adjustmentType
    }

    const pathId = route.query.path_id
    if (pathId) {
      params.learning_path_id = pathId
    }

    const response = await request.get<{ code?: number; data?: { logs?: AdjustmentLog[] }; msg?: string }>('/ai-learning-path/adjustment-log', { params })
    if (response.code === 200) {
      logs.value = response.data?.logs ?? []
    }
  } catch (error) {
    console.error('加载调整日志失败:', error)
    ElMessage.error('加载调整日志失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.adjustment-history {
  @apply p-6;
}

.header-content {
  @apply flex items-center justify-between;
}

.header-content h2 {
  @apply text-2xl font-bold text-gray-800;
}

.filters {
  @apply flex items-center;
}
</style>

