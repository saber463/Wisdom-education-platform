<template>
  <ParentLayout>
    <div class="weak-points-page">
      <div class="page-header">
        <h2>薄弱点详情</h2>
        <div class="header-actions">
          <el-select v-model="selectedChildId" placeholder="选择孩子" @change="handleChildChange" style="width: 150px">
            <el-option v-for="child in children" :key="child.id" :label="child.name" :value="child.id" />
          </el-select>
        </div>
      </div>

      <!-- 薄弱知识点列表 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="weak-points-card">
            <template #header>
              <div class="card-header">
                <span>薄弱知识点列表</span>
                <el-tag type="danger" size="small">{{ weakPoints.length }}个</el-tag>
              </div>
            </template>
            <div class="weak-points-list">
              <div
                v-for="point in weakPoints"
                :key="point.id"
                class="weak-point-item"
                :class="{ active: selectedPoint?.id === point.id }"
                @click="selectPoint(point)"
              >
                <div class="point-info">
                  <span class="point-name">{{ point.name }}</span>
                  <span class="point-subject">{{ point.subject }}</span>
                </div>
                <div class="point-stats">
                  <el-progress
                    :percentage="point.masteryRate"
                    :stroke-width="6"
                    :status="getMasteryStatus(point.masteryRate)"
                    style="width: 80px"
                  />
                  <span class="mastery-rate">{{ point.masteryRate }}%</span>
                </div>
              </div>
              <el-empty v-if="weakPoints.length === 0" description="暂无薄弱知识点，继续保持！" :image-size="80" />
            </div>
          </el-card>
        </el-col>

        <!-- 薄弱点详情 -->
        <el-col :span="16">
          <el-card v-if="selectedPoint" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>{{ selectedPoint.name }}</span>
                <el-tag :type="getMasteryTagType(selectedPoint.masteryRate)">
                  掌握度: {{ selectedPoint.masteryRate }}%
                </el-tag>
              </div>
            </template>

            <!-- 知识点基本信息 -->
            <div class="detail-section">
              <h4>基本信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="学科">{{ selectedPoint.subject }}</el-descriptions-item>
                <el-descriptions-item label="年级">{{ selectedPoint.grade }}</el-descriptions-item>
                <el-descriptions-item label="错误次数">{{ selectedPoint.errorCount }}次</el-descriptions-item>
                <el-descriptions-item label="总答题次数">{{ selectedPoint.totalCount }}次</el-descriptions-item>
                <el-descriptions-item label="错误率">{{ selectedPoint.errorRate?.toFixed(1) }}%</el-descriptions-item>
                <el-descriptions-item label="最后练习">{{ formatDate(selectedPoint.lastPracticeTime) }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- AI辅导建议 -->
            <div class="detail-section">
              <h4>
                <el-icon><MagicStick /></el-icon>
                AI辅导建议
              </h4>
              <div class="ai-suggestions" v-loading="loadingSuggestions">
                <div v-if="aiSuggestions.length > 0" class="suggestions-list">
                  <div v-for="(suggestion, index) in aiSuggestions" :key="index" class="suggestion-item">
                    <el-icon class="suggestion-icon"><CircleCheck /></el-icon>
                    <span>{{ suggestion }}</span>
                  </div>
                </div>
                <el-empty v-else description="暂无AI辅导建议" :image-size="60" />
              </div>
            </div>

            <!-- 推荐学习资源 -->
            <div class="detail-section">
              <h4>
                <el-icon><Reading /></el-icon>
                推荐学习资源
              </h4>
              <div class="resources-list" v-loading="loadingResources">
                <div v-for="resource in recommendedResources" :key="resource.id" class="resource-item">
                  <div class="resource-icon" :style="{ background: getResourceColor(resource.type) }">
                    <el-icon v-if="resource.type === 'video'"><VideoPlay /></el-icon>
                    <el-icon v-else-if="resource.type === 'article'"><Document /></el-icon>
                    <el-icon v-else-if="resource.type === 'exercise'"><Edit /></el-icon>
                    <el-icon v-else><Link /></el-icon>
                  </div>
                  <div class="resource-info">
                    <span class="resource-title">{{ resource.title }}</span>
                    <span class="resource-desc">{{ resource.description }}</span>
                  </div>
                  <el-button type="primary" size="small" link @click="openResource(resource)">
                    查看
                  </el-button>
                </div>
                <el-empty v-if="recommendedResources.length === 0" description="暂无推荐资源" :image-size="60" />
              </div>
            </div>

            <!-- 相关错题 -->
            <div class="detail-section">
              <h4>
                <el-icon><Warning /></el-icon>
                相关错题
              </h4>
              <el-table :data="relatedWrongQuestions" size="small" style="width: 100%" max-height="300">
                <el-table-column prop="questionContent" label="题目内容" show-overflow-tooltip />
                <el-table-column prop="studentAnswer" label="学生答案" width="150" show-overflow-tooltip />
                <el-table-column prop="correctAnswer" label="正确答案" width="150" show-overflow-tooltip />
                <el-table-column prop="errorTime" label="错误时间" width="120">
                  <template #default="{ row }">{{ formatDate(row.errorTime) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>

          <el-card v-else class="empty-detail-card">
            <el-empty description="请从左侧选择一个薄弱知识点查看详情" :image-size="120" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </ParentLayout>
</template>

<script setup lang="ts">
/**
 * 家长薄弱点详情页面
 * 
 * 功能：
 * - 显示薄弱点详细信息
 * - 显示AI生成的辅导建议
 * - 显示推荐学习资源
 * 
 * 需求：8.4 - 家长查看薄弱点详情
 */
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick, CircleCheck, Reading, VideoPlay, Document, Edit, Link, Warning } from '@element-plus/icons-vue'
import ParentLayout from '@/components/ParentLayout.vue'
import request from '@/utils/request'

// 薄弱知识点接口
interface WeakPoint {
  id: number
  name: string
  subject: string
  grade: string
  masteryRate: number
  errorCount: number
  totalCount: number
  errorRate: number
  lastPracticeTime: string
}

// 学习资源接口
interface LearningResource {
  id: number
  title: string
  description: string
  type: 'video' | 'article' | 'exercise' | 'link'
  url: string
}

// 错题接口
interface WrongQuestion {
  id: number
  questionContent: string
  studentAnswer: string
  correctAnswer: string
  errorTime: string
}

// 孩子列表
const children = ref<Array<{ id: number; name: string }>>([])
const selectedChildId = ref<number | null>(null)

// 薄弱知识点列表
const weakPoints = ref<WeakPoint[]>([])
const selectedPoint = ref<WeakPoint | null>(null)

// AI辅导建议
const aiSuggestions = ref<string[]>([])
const loadingSuggestions = ref(false)

// 推荐学习资源
const recommendedResources = ref<LearningResource[]>([])
const loadingResources = ref(false)

// 相关错题
const relatedWrongQuestions = ref<WrongQuestion[]>([])

// 获取孩子列表
async function fetchChildren() {
  try {
    const response = await request.get<{ children?: Array<{ id: number; name: string }> }>('/parent/children')
    children.value = response.children || []
    if (children.value.length > 0) {
      selectedChildId.value = children.value[0].id
      fetchWeakPoints()
    }
  } catch (error) {
    console.error('[薄弱点详情] 获取孩子列表失败:', error)
  }
}

// 获取薄弱知识点列表
async function fetchWeakPoints() {
  if (!selectedChildId.value) return
  
  try {
    const response = await request.get<{ weakPoints?: WeakPoint[] }>('/parent/weak-points', {
      params: { studentId: selectedChildId.value }
    })
    weakPoints.value = response.weakPoints || []
    
    // 自动选择第一个薄弱点
    if (weakPoints.value.length > 0 && !selectedPoint.value) {
      selectPoint(weakPoints.value[0])
    }
  } catch (error) {
    console.error('[薄弱点详情] 获取薄弱知识点失败:', error)
    ElMessage.error('获取薄弱知识点失败')
  }
}

// 选择薄弱知识点
async function selectPoint(point: WeakPoint) {
  selectedPoint.value = point
  
  // 获取AI辅导建议
  fetchAISuggestions(point.id)
  
  // 获取推荐学习资源
  fetchRecommendedResources(point.id)
  
  // 获取相关错题
  fetchRelatedWrongQuestions(point.id)
}

// 获取AI辅导建议
async function fetchAISuggestions(knowledgePointId: number) {
  loadingSuggestions.value = true
  try {
    const response = await request.get<{ suggestions?: string[] }>('/parent/ai-suggestions', {
      params: { studentId: selectedChildId.value, knowledgePointId }
    })
    aiSuggestions.value = response.suggestions || []
  } catch (error) {
    console.error('[薄弱点详情] 获取AI辅导建议失败:', error)
    aiSuggestions.value = []
  } finally {
    loadingSuggestions.value = false
  }
}

// 获取推荐学习资源
async function fetchRecommendedResources(knowledgePointId: number) {
  loadingResources.value = true
  try {
    const response = await request.get<{ resources?: LearningResource[] }>('/parent/recommended-resources', {
      params: { knowledgePointId }
    })
    recommendedResources.value = response.resources || []
  } catch (error) {
    console.error('[薄弱点详情] 获取推荐资源失败:', error)
    recommendedResources.value = []
  } finally {
    loadingResources.value = false
  }
}

// 获取相关错题
async function fetchRelatedWrongQuestions(knowledgePointId: number) {
  try {
    const response = await request.get<{ wrongQuestions?: WrongQuestion[] }>('/parent/wrong-questions', {
      params: { studentId: selectedChildId.value, knowledgePointId }
    })
    relatedWrongQuestions.value = response.wrongQuestions || []
  } catch (error) {
    console.error('[薄弱点详情] 获取相关错题失败:', error)
    relatedWrongQuestions.value = []
  }
}

// 切换孩子
function handleChildChange() {
  selectedPoint.value = null
  fetchWeakPoints()
}

// 获取掌握度状态
function getMasteryStatus(rate: number): '' | 'success' | 'warning' | 'exception' {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'warning'
  return 'exception'
}

// 获取掌握度标签类型
function getMasteryTagType(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'warning'
  return 'danger'
}

// 获取资源图标颜色
function getResourceColor(type: string): string {
  const colors: Record<string, string> = {
    video: '#409eff',
    article: '#67c23a',
    exercise: '#e6a23c',
    link: '#909399'
  }
  return colors[type] || '#909399'
}

// 打开资源
function openResource(resource: LearningResource) {
  if (resource.url) {
    window.open(resource.url, '_blank')
  } else {
    ElMessage.info('资源链接暂不可用')
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  fetchChildren()
})

watch(selectedChildId, () => {
  if (selectedChildId.value) {
    fetchWeakPoints()
  }
})
</script>

<style scoped>
.weak-points-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weak-points-card {
  height: calc(100vh - 180px);
  overflow: hidden;
}

.weak-points-list {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.weak-point-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
  border: 1px solid #eee;
}

.weak-point-item:hover {
  background: #f5f7fa;
}

.weak-point-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.point-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.point-name {
  font-weight: 500;
  color: #333;
}

.point-subject {
  font-size: 12px;
  color: #999;
}

.point-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mastery-rate {
  font-size: 12px;
  font-weight: bold;
  width: 40px;
  text-align: right;
}

.detail-card, .empty-detail-card {
  min-height: calc(100vh - 180px);
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.ai-suggestions {
  min-height: 100px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #f0f9eb;
  border-radius: 8px;
  line-height: 1.6;
}

.suggestion-icon {
  color: #67c23a;
  margin-top: 2px;
  flex-shrink: 0;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.resource-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resource-icon .el-icon {
  font-size: 20px;
  color: #fff;
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-title {
  font-weight: 500;
  color: #333;
}

.resource-desc {
  font-size: 12px;
  color: #999;
}
</style>
