<template>
  <el-alert
    v-if="adjustmentSummary"
    :title="adjustmentTitle"
    :type="adjustmentTypeStyle"
    :closable="closable"
    show-icon
    class="path-adjustment-alert"
  >
    <template #default>
      <div class="adjustment-content">
        <p class="adjustment-summary">
          {{ adjustmentSummary }}
        </p>
        <div
          v-if="adjustmentDetails && adjustmentDetails.length > 0"
          class="adjustment-details"
        >
          <h4>调整详情：</h4>
          <ul>
            <li
              v-for="(detail, index) in adjustmentDetails"
              :key="index"
            >
              <strong>{{ detail.knowledge_point_name }}</strong>：
              {{ formatAdjustmentAction(detail.action) }}
              <span class="reason">（{{ detail.reason }}）</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </el-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AdjustmentDetail {
  knowledge_point_id: number
  knowledge_point_name: string
  old_mastery_level: 'mastered' | 'consolidating' | 'weak'
  new_mastery_level: 'mastered' | 'consolidating' | 'weak'
  action: 'skip' | 'add_practice' | 'add_micro_lesson' | 'increase_difficulty' | 'decrease_difficulty'
  reason: string
}

interface Props {
  adjustmentSummary?: string
  adjustmentDetails?: AdjustmentDetail[]
  adjustmentType?: 'knowledge_evaluation' | 'ability_adaptation' | 'progress_optimization'
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  adjustmentSummary: '',
  adjustmentDetails: () => [] as AdjustmentDetail[],
  adjustmentType: 'knowledge_evaluation',
  closable: true
})

const adjustmentTitle = computed(() => {
  switch (props.adjustmentType) {
    case 'knowledge_evaluation':
      return '学习路径已根据您的知识点掌握情况调整'
    case 'ability_adaptation':
      return '学习路径已根据您的学习能力调整'
    case 'progress_optimization':
      return '学习路径已优化'
    default:
      return '学习路径已调整'
  }
})

const adjustmentTypeStyle = computed(() => {
  return 'info'
})

function formatAdjustmentAction(action: string): string {
  const actionMap: Record<string, string> = {
    skip: '跳过（已掌握）',
    add_practice: '添加针对性练习',
    add_micro_lesson: '添加微课程',
    increase_difficulty: '提升难度',
    decrease_difficulty: '降低难度'
  }
  return actionMap[action] || action
}
</script>

<style scoped>
.path-adjustment-alert {
  @apply mb-4;
}

.adjustment-content {
  @apply mt-2;
}

.adjustment-summary {
  @apply mb-3 text-gray-700;
}

.adjustment-details {
  @apply mt-3;
}

.adjustment-details h4 {
  @apply font-semibold mb-2 text-gray-800;
}

.adjustment-details ul {
  @apply list-disc list-inside space-y-1 text-sm text-gray-600;
}

.adjustment-details .reason {
  @apply text-gray-500 italic;
}
</style>

