<template>
  <div class="path-adjustment-log">
    <el-timeline>
      <el-timeline-item
        v-for="log in logs"
        :key="log.id"
        :timestamp="formatTime(log.created_at)"
        placement="top"
        :type="getLogType(log.adjustment_type)"
      >
        <el-card shadow="hover">
          <div class="log-header">
            <h4>{{ getLogTypeText(log.adjustment_type) }}</h4>
            <el-tag
              :type="getAbilityTagType(log.learning_ability_tag)"
              size="small"
            >
              {{ getAbilityTagText(log.learning_ability_tag) }}
            </el-tag>
          </div>
          <p class="log-summary">
            {{ log.adjustment_summary }}
          </p>
          <div
            v-if="log.adjustment_details && log.adjustment_details.length > 0"
            class="log-details"
          >
            <el-collapse>
              <el-collapse-item
                title="查看详情"
                name="details"
              >
                <ul class="details-list">
                  <li
                    v-for="(detail, index) in log.adjustment_details"
                    :key="index"
                  >
                    <strong>{{ detail.knowledge_point_name }}</strong>：
                    {{ formatAdjustmentAction(detail.action) }}
                    <span class="reason">（{{ detail.reason }}）</span>
                  </li>
                </ul>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
interface AdjustmentDetail {
  knowledge_point_id?: number
  knowledge_point_name: string
  old_mastery_level?: string
  new_mastery_level?: string
  action: string
  reason: string
}

interface AdjustmentLog {
  id: string
  learning_path_id: number
  adjustment_type: 'knowledge_evaluation' | 'ability_adaptation' | 'progress_optimization'
  trigger_event: string
  adjustment_details: AdjustmentDetail[]
  learning_ability_tag: string
  evaluation_score: number
  adjustment_summary: string
  created_at: string
}

interface Props {
  logs: AdjustmentLog[]
}

defineProps<Props>()

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

function getLogType(type: string): string {
  switch (type) {
    case 'knowledge_evaluation':
      return 'primary'
    case 'ability_adaptation':
      return 'success'
    case 'progress_optimization':
      return 'warning'
    default:
      return 'info'
  }
}

function getLogTypeText(type: string): string {
  switch (type) {
    case 'knowledge_evaluation':
      return '知识点评估调整'
    case 'ability_adaptation':
      return '学习能力适配调整'
    case 'progress_optimization':
      return '学习进度优化'
    default:
      return type
  }
}

function getAbilityTagType(tag: string): string {
  switch (tag) {
    case 'efficient':
      return 'success'
    case 'steady':
      return 'info'
    case 'basic':
      return 'warning'
    default:
      return 'info'
  }
}

function getAbilityTagText(tag: string): string {
  switch (tag) {
    case 'efficient':
      return '高效型'
    case 'steady':
      return '稳健型'
    case 'basic':
      return '基础型'
    default:
      return tag
  }
}

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
.path-adjustment-log {
  @apply p-4;
}

.log-header {
  @apply flex items-center justify-between mb-2;
}

.log-header h4 {
  @apply text-lg font-semibold text-gray-800;
}

.log-summary {
  @apply text-gray-600 mb-2;
}

.log-details {
  @apply mt-3;
}

.details-list {
  @apply list-disc list-inside space-y-1 text-sm text-gray-600;
}

.details-list .reason {
  @apply text-gray-500 italic;
}
</style>

