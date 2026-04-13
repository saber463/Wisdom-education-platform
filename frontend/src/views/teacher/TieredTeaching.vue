<template>
  <TeacherLayout>
    <div class="tiered-teaching-page">
      <div class="page-header">
        <h2>分层教学</h2>
        <div class="header-actions">
          <el-select
            v-model="selectedClassId"
            placeholder="选择班级"
            style="width: 200px"
            @change="handleClassChange"
          >
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </div>
      </div>

      <!-- 层次分布统计 -->
      <el-row
        :gutter="20"
        class="tier-stats"
      >
        <el-col :span="8">
          <el-card
            shadow="hover"
            class="tier-card basic"
          >
            <div class="tier-header">
              <el-icon><Star /></el-icon>
              <span>基础层</span>
            </div>
            <div class="tier-count">
              {{ tierStats.basic.count }}
            </div>
            <div class="tier-info">
              <span>平均分: {{ tierStats.basic.averageScore?.toFixed(1) || '-' }}</span>
              <span>进步率: {{ tierStats.basic.progressRate?.toFixed(1) || '-' }}%</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card
            shadow="hover"
            class="tier-card medium"
          >
            <div class="tier-header">
              <el-icon><StarFilled /></el-icon>
              <span>中等层</span>
            </div>
            <div class="tier-count">
              {{ tierStats.medium.count }}
            </div>
            <div class="tier-info">
              <span>平均分: {{ tierStats.medium.averageScore?.toFixed(1) || '-' }}</span>
              <span>进步率: {{ tierStats.medium.progressRate?.toFixed(1) || '-' }}%</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card
            shadow="hover"
            class="tier-card advanced"
          >
            <div class="tier-header">
              <el-icon><Trophy /></el-icon>
              <span>提高层</span>
            </div>
            <div class="tier-count">
              {{ tierStats.advanced.count }}
            </div>
            <div class="tier-info">
              <span>平均分: {{ tierStats.advanced.averageScore?.toFixed(1) || '-' }}</span>
              <span>进步率: {{ tierStats.advanced.progressRate?.toFixed(1) || '-' }}%</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 分层作业列表 -->
        <el-col :span="14">
          <el-card class="assignments-card">
            <template #header>
              <div class="card-header">
                <span>分层作业</span>
                <el-button
                  type="primary"
                  size="small"
                  @click="showAssignDialog = true"
                >
                  <el-icon><Plus /></el-icon>分配作业
                </el-button>
              </div>
            </template>
            <el-table
              v-loading="loading"
              :data="tieredAssignments"
              style="width: 100%"
            >
              <el-table-column
                prop="title"
                label="作业名称"
                min-width="150"
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
                label="分配层次"
                width="120"
              >
                <template #default="{ row }">
                  <el-tag
                    v-for="tier in row.assignedTiers"
                    :key="tier"
                    :type="getTierType(tier)"
                    size="small"
                    style="margin-right: 4px"
                  >
                    {{ getTierLabel(tier) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="completionRate"
                label="完成率"
                width="100"
              >
                <template #default="{ row }">
                  {{ row.completionRate?.toFixed(1) || 0 }}%
                </template>
              </el-table-column>
              <el-table-column
                label="操作"
                width="100"
              >
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    link
                    @click="viewAssignmentDetail(row.id)"
                  >
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 学生层次列表 -->
        <el-col :span="10">
          <el-card class="students-card">
            <template #header>
              <div class="card-header">
                <span>学生层次分布</span>
                <el-button
                  type="primary"
                  size="small"
                  :loading="recalculating"
                  @click="recalculateTiers"
                >
                  重新分层
                </el-button>
              </div>
            </template>
            <el-tabs v-model="activeTierTab">
              <el-tab-pane
                label="基础层"
                name="basic"
              >
                <el-table
                  :data="studentsByTier.basic"
                  size="small"
                  max-height="300"
                >
                  <el-table-column
                    prop="studentName"
                    label="姓名"
                  />
                  <el-table-column
                    prop="averageScore"
                    label="平均分"
                    width="80"
                  >
                    <template #default="{ row }">
                      {{ row.averageScore?.toFixed(1) }}
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="trend"
                    label="趋势"
                    width="80"
                  >
                    <template #default="{ row }">
                      <span :class="row.trend >= 0 ? 'text-success' : 'text-danger'">
                        {{ row.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(row.trend)?.toFixed(1) }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              <el-tab-pane
                label="中等层"
                name="medium"
              >
                <el-table
                  :data="studentsByTier.medium"
                  size="small"
                  max-height="300"
                >
                  <el-table-column
                    prop="studentName"
                    label="姓名"
                  />
                  <el-table-column
                    prop="averageScore"
                    label="平均分"
                    width="80"
                  >
                    <template #default="{ row }">
                      {{ row.averageScore?.toFixed(1) }}
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="trend"
                    label="趋势"
                    width="80"
                  >
                    <template #default="{ row }">
                      <span :class="row.trend >= 0 ? 'text-success' : 'text-danger'">
                        {{ row.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(row.trend)?.toFixed(1) }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              <el-tab-pane
                label="提高层"
                name="advanced"
              >
                <el-table
                  :data="studentsByTier.advanced"
                  size="small"
                  max-height="300"
                >
                  <el-table-column
                    prop="studentName"
                    label="姓名"
                  />
                  <el-table-column
                    prop="averageScore"
                    label="平均分"
                    width="80"
                  >
                    <template #default="{ row }">
                      {{ row.averageScore?.toFixed(1) }}
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="trend"
                    label="趋势"
                    width="80"
                  >
                    <template #default="{ row }">
                      <span :class="row.trend >= 0 ? 'text-success' : 'text-danger'">
                        {{ row.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(row.trend)?.toFixed(1) }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
            </el-tabs>
          </el-card>

          <!-- 分层效果统计 -->
          <el-card class="effect-card">
            <template #header>
              <span>分层效果统计</span>
            </template>
            <div
              ref="effectChartRef"
              class="chart-container"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- 分配作业对话框 -->
      <el-dialog
        v-model="showAssignDialog"
        title="分配分层作业"
        width="500px"
      >
        <el-form
          :model="assignForm"
          label-width="100px"
        >
          <el-form-item label="选择作业">
            <el-select
              v-model="assignForm.assignmentId"
              placeholder="请选择作业"
              style="width: 100%"
            >
              <el-option
                v-for="a in availableAssignments"
                :key="a.id"
                :label="a.title"
                :value="a.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分配层次">
            <el-checkbox-group v-model="assignForm.tiers">
              <el-checkbox label="basic">
                基础层
              </el-checkbox>
              <el-checkbox label="medium">
                中等层
              </el-checkbox>
              <el-checkbox label="advanced">
                提高层
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAssignDialog = false">
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="assigning"
            @click="handleAssign"
          >
            确定分配
          </el-button>
        </template>
      </el-dialog>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, StarFilled, Trophy, Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const recalculating = ref(false)
const assigning = ref(false)
const showAssignDialog = ref(false)
const selectedClassId = ref<number | null>(null)
const activeTierTab = ref('basic')

const classList = ref<Array<{ id: number; name: string }>>([])
const tierStats = reactive({
  basic: { count: 0, averageScore: 0, progressRate: 0 },
  medium: { count: 0, averageScore: 0, progressRate: 0 },
  advanced: { count: 0, averageScore: 0, progressRate: 0 }
})

interface TieredAssignment {
  id: number; title: string; difficulty: string; assignedTiers: string[]; completionRate: number
}

interface StudentTier {
  studentId: number; studentName: string; tier: string; averageScore: number; trend: number
}

const tieredAssignments = ref<TieredAssignment[]>([])
const studentsByTier = reactive<{ basic: StudentTier[]; medium: StudentTier[]; advanced: StudentTier[] }>({
  basic: [], medium: [], advanced: []
})
const availableAssignments = ref<Array<{ id: number; title: string }>>([])
const assignForm = reactive({ assignmentId: null as number | null, tiers: [] as string[] })

const effectChartRef = ref<HTMLElement | null>(null)
let effectChart: echarts.ECharts | null = null

async function fetchClasses() {
  try {
    const response = await request.get<{ classes?: Array<{ id: number; name: string }> }>('/classes')
    classList.value = response.classes || []
    if (classList.value.length > 0) {
      selectedClassId.value = classList.value[0].id
      fetchTieredData()
    }
  } catch (error) { console.error('[分层教学] 获取班级列表失败，使用模拟数据:', error); classList.value = [{ id: 1, name: '24软件2班' }, { id: 2, name: '24软件3班' }]; selectedClassId.value = 1; fetchTieredData() }
}

async function fetchTieredData() {
  if (!selectedClassId.value) return
  loading.value = true
  try {
    const response = await request.get<Record<string, unknown>>(`/tiered-teaching/class/${selectedClassId.value}`)
    const data = response as { tierStats?: { basic?: unknown; medium?: unknown; advanced?: unknown }; assignments?: unknown[]; students?: { tier?: string }[]; effectData?: unknown }
    tierStats.basic = (data.tierStats?.basic as typeof tierStats.basic) || { count: 0, averageScore: 0, progressRate: 0 }
    tierStats.medium = (data.tierStats?.medium as typeof tierStats.medium) || { count: 0, averageScore: 0, progressRate: 0 }
    tierStats.advanced = (data.tierStats?.advanced as typeof tierStats.advanced) || { count: 0, averageScore: 0, progressRate: 0 }
    tieredAssignments.value = (data.assignments || []) as typeof tieredAssignments.value
    const students = (data.students || []) as StudentTier[]
    studentsByTier.basic = students.filter(s => s.tier === 'basic')
    studentsByTier.medium = students.filter(s => s.tier === 'medium')
    studentsByTier.advanced = students.filter(s => s.tier === 'advanced')
    const effectPayload = (data.effectData ?? {}) as { basic?: unknown[]; medium?: unknown[]; advanced?: unknown[]; dates?: unknown[] }
    updateEffectChart(effectPayload)
  } catch (error) {
    console.error('[分层教学] 获取数据失败，使用模拟数据:', error)
    tierStats.basic = { count: 15, averageScore: 72, progressRate: 65 }
    tierStats.medium = { count: 22, averageScore: 84, progressRate: 78 }
    tierStats.advanced = { count: 8, averageScore: 93, progressRate: 88 }
    tieredAssignments.value = [
      { id: 1, title: 'Python基础语法强化练习', tier: 'basic', deadline: '2026-04-10T23:59:00Z', submissionCount: 12, totalCount: 15 },
      { id: 2, title: '数据结构综合应用', tier: 'medium', deadline: '2026-04-10T23:59:00Z', submissionCount: 18, totalCount: 22 },
      { id: 3, title: '算法设计与优化挑战', tier: 'advanced', deadline: '2026-04-10T23:59:00Z', submissionCount: 6, totalCount: 8 },
    ] as any
    studentsByTier.basic = [{ id: 5, realName: '刘小刚', averageScore: 68, tier: 'basic' }, { id: 6, realName: '陈丽丽', averageScore: 71, tier: 'basic' }] as any
    studentsByTier.medium = [{ id: 7, realName: '王建国', averageScore: 83, tier: 'medium' }, { id: 8, realName: '李晓燕', averageScore: 87, tier: 'medium' }] as any
    studentsByTier.advanced = [{ id: 4, realName: '张小明', averageScore: 95, tier: 'advanced' }] as any
  } finally { loading.value = false }
}

async function fetchAvailableAssignments() {
  try {
    const response = await request.get<{ assignments?: Array<{ id: number; title: string }> }>('/assignments', { params: { status: 'published' } })
    availableAssignments.value = response.assignments || []
  } catch (error) { console.error('[分层教学] 获取作业列表失败:', error) }
}

async function recalculateTiers() {
  if (!selectedClassId.value) return
  recalculating.value = true
  try {
    await request.post(`/tiered-teaching/class/${selectedClassId.value}/recalculate`)
    ElMessage.success('重新分层完成')
    fetchTieredData()
  } catch (error) {
    console.error('[分层教学] 重新分层失败:', error)
    ElMessage.error('重新分层失败')
  } finally { recalculating.value = false }
}

async function handleAssign() {
  if (!assignForm.assignmentId || assignForm.tiers.length === 0) {
    ElMessage.warning('请选择作业和分配层次')
    return
  }
  assigning.value = true
  try {
    await request.post(`/tiered-teaching/assignments/${assignForm.assignmentId}/assign`, {
      classId: selectedClassId.value,
      tiers: assignForm.tiers
    })
    ElMessage.success('作业分配成功')
    showAssignDialog.value = false
    assignForm.assignmentId = null
    assignForm.tiers = []
    fetchTieredData()
  } catch (error: unknown) {
    console.error('[分层教学] 分配作业失败:', error)
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(msg || '分配失败')
  } finally { assigning.value = false }
}

function handleClassChange() { fetchTieredData() }
function viewAssignmentDetail(id: number) { router.push(`/teacher/assignments/${id}`) }

function initEffectChart() {
  if (effectChartRef.value) {
    effectChart = echarts.init(effectChartRef.value)
  }
}

function updateEffectChart(data: { basic?: unknown[]; medium?: unknown[]; advanced?: unknown[]; dates?: unknown[] }) {
  if (!effectChart) return
  const effectData = data || { basic: [], medium: [], advanced: [], dates: [] }
  effectChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['基础层', '中等层', '提高层'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: effectData.dates || [] },
    yAxis: { type: 'value', name: '平均分', min: 0, max: 100 },
    series: [
      { name: '基础层', type: 'line', data: effectData.basic || [], smooth: true, itemStyle: { color: '#00FF94' } },
      { name: '中等层', type: 'line', data: effectData.medium || [], smooth: true, itemStyle: { color: '#FFB700' } },
      { name: '提高层', type: 'line', data: effectData.advanced || [], smooth: true, itemStyle: { color: '#FF4B6E' } }
    ]
  })
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = { basic: '基础', medium: '中等', advanced: '提高' }
  return labels[difficulty] || difficulty
}

function getDifficultyType(difficulty: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = { basic: 'success', medium: 'warning', advanced: 'danger' }
  return types[difficulty] || ''
}

function getTierLabel(tier: string): string {
  const labels: Record<string, string> = { basic: '基础', medium: '中等', advanced: '提高' }
  return labels[tier] || tier
}

function getTierType(tier: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = { basic: 'success', medium: 'warning', advanced: 'danger' }
  return types[tier] || ''
}

function handleResize() { effectChart?.resize() }

onMounted(() => {
  fetchClasses()
  fetchAvailableAssignments()
  initEffectChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  effectChart?.dispose()
})
</script>

<style scoped>
.tiered-teaching-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #F0F0F0; }
.header-actions { display: flex; gap: 12px; }
.tier-stats { margin-bottom: 20px; }
.tier-card { text-align: center; padding: 20px; }
.tier-card.basic { border-top: 4px solid #00FF94; }
.tier-card.medium { border-top: 4px solid #FFB700; }
.tier-card.advanced { border-top: 4px solid #FF4B6E; }
.tier-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px; font-size: 16px; color: #666; }
.tier-count { font-size: 48px; font-weight: bold; color: #F0F0F0; }
.tier-info { display: flex; justify-content: space-around; margin-top: 12px; font-size: 14px; color: #606060; }
.assignments-card, .students-card, .effect-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.chart-container { height: 200px; }
.text-success { color: #00FF94; }
.text-danger { color: #FF4B6E; }
</style>
