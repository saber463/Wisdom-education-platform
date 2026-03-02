<template>
  <StudentLayout>
    <template #content>
      <div class="knowledge-portrait">
        <el-card class="portrait-card">
          <template #header>
            <h2>知识掌握画像</h2>
          </template>

          <div v-loading="loading">
            <!-- 能力画像 -->
            <el-card class="ability-profile-card" shadow="never">
              <h3>学习能力画像</h3>
              <div v-if="abilityProfile" class="ability-content">
                <el-tag :type="abilityTagType" size="large" class="ability-tag">
                  {{ abilityTagText }}
                </el-tag>
                <p class="ability-description">{{ abilityProfile.ability_tag_description }}</p>
                <div class="ability-stats">
                  <div class="stat-item">
                    <span class="stat-label">平均完成时间比率：</span>
                    <span class="stat-value">{{ (abilityProfile.avg_completion_time_ratio * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">重复练习次数：</span>
                    <span class="stat-value">{{ abilityProfile.repeat_practice_count }}次</span>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 知识点掌握度图表 -->
            <el-card class="mastery-chart-card" shadow="never">
              <h3>知识点掌握度分布</h3>
              <KnowledgeMasteryChart v-if="masteryList.length > 0" :mastery-list="masteryList" />
              <el-empty v-else description="暂无数据" />
            </el-card>

            <!-- 知识点掌握度列表 -->
            <el-card class="mastery-list-card" shadow="never">
              <h3>知识点详情</h3>
              <el-table :data="masteryList" stripe>
                <el-table-column prop="knowledge_point_name" label="知识点" />
                <el-table-column prop="mastery_level" label="掌握度">
                  <template #default="{ row }">
                    <el-tag :type="getMasteryTagType(row.mastery_level)">
                      {{ getMasteryText(row.mastery_level) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="mastery_score" label="掌握分数">
                  <template #default="{ row }">
                    {{ row.mastery_score }}分
                  </template>
                </el-table-column>
                <el-table-column prop="evaluation_count" label="评估次数" />
              </el-table>
            </el-card>
          </div>
        </el-card>
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'
import KnowledgeMasteryChart from '@/components/KnowledgeMasteryChart.vue'

interface AbilityProfile {
  ability_tag: 'efficient' | 'steady' | 'basic'
  ability_tag_description: string
  avg_completion_time_ratio: number
  repeat_practice_count: number
}

interface KnowledgeMastery {
  knowledge_point_id: number
  knowledge_point_name: string
  mastery_level: 'mastered' | 'consolidating' | 'weak'
  mastery_score: number
  evaluation_count: number
}

const loading = ref(false)
const abilityProfile = ref<AbilityProfile | null>(null)
const masteryList = ref<KnowledgeMastery[]>([])

const abilityTagType = computed(() => {
  if (!abilityProfile.value) return 'info'
  switch (abilityProfile.value.ability_tag) {
    case 'efficient':
      return 'success'
    case 'steady':
      return 'info'
    case 'basic':
      return 'warning'
    default:
      return 'info'
  }
})

const abilityTagText = computed(() => {
  if (!abilityProfile.value) return ''
  switch (abilityProfile.value.ability_tag) {
    case 'efficient':
      return '高效型学习者'
    case 'steady':
      return '稳健型学习者'
    case 'basic':
      return '基础型学习者'
    default:
      return ''
  }
})

function getMasteryTagType(level: string) {
  switch (level) {
    case 'mastered':
      return 'success'
    case 'consolidating':
      return 'warning'
    case 'weak':
      return 'danger'
    default:
      return 'info'
  }
}

function getMasteryText(level: string) {
  switch (level) {
    case 'mastered':
      return '已掌握'
    case 'consolidating':
      return '待巩固'
    case 'weak':
      return '薄弱'
    default:
      return level
  }
}

async function loadAbilityProfile() {
  try {
    const response = await request.get<{ code?: number; data?: { profile?: unknown }; msg?: string }>('/ai-learning-path/ability-profile')
    if (response.code === 200) {
      abilityProfile.value = response.data?.profile as typeof abilityProfile.value
    }
  } catch (error) {
    console.error('加载能力画像失败:', error)
    ElMessage.error('加载能力画像失败')
  }
}

async function loadKnowledgeMastery() {
  loading.value = true
  try {
    const response = await request.get<{ code?: number; data?: { mastery_list?: unknown[] }; msg?: string }>('/ai-learning-path/knowledge-mastery')
    if (response.code === 200) {
      masteryList.value = (response.data?.mastery_list || []) as typeof masteryList.value
    }
  } catch (error) {
    console.error('加载知识点掌握度失败:', error)
    ElMessage.error('加载知识点掌握度失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAbilityProfile()
  loadKnowledgeMastery()
})
</script>

<style scoped>
.knowledge-portrait {
  @apply p-6;
}

.portrait-card {
  @apply max-w-6xl mx-auto;
}

.ability-profile-card,
.mastery-chart-card,
.mastery-list-card {
  @apply mb-6;
}

.ability-content {
  @apply mt-4;
}

.ability-tag {
  @apply mb-3;
}

.ability-description {
  @apply text-gray-600 mb-4;
}

.ability-stats {
  @apply space-y-2;
}

.stat-item {
  @apply flex items-center;
}

.stat-label {
  @apply text-gray-600 mr-2;
}

.stat-value {
  @apply font-semibold text-primary-500;
}
</style>

