<template>
  <StudentLayout>
    <div class="resource-recommendations-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>学习资源推荐</h2>
        <p class="page-desc">根据您的学习行为，为您推荐优质学习资源</p>
      </div>

      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="10" animated />

      <div v-else>
        <!-- 资源类型筛选 -->
        <div class="filter-section">
          <el-button-group>
            <el-button 
              v-for="type in resourceTypes" 
              :key="type.value"
              :type="selectedType === type.value ? 'primary' : 'default'"
              @click="selectedType = type.value as 'article' | 'video' | 'exercise' | 'all' | 'tutorial'; fetchResources()"
            >
              {{ type.label }}
            </el-button>
          </el-button-group>
          <el-button type="primary" @click="refreshRecommendations" :loading="refreshing" class="refresh-btn">
            <el-icon><Refresh /></el-icon> 刷新推荐
          </el-button>
        </div>

        <!-- 推荐资源列表 -->
        <div v-if="resources.length > 0" class="resources-container">
          <el-row :gutter="20">
            <el-col v-for="resource in resources" :key="resource.id" :xs="24" :sm="12" :md="8" :lg="6">
              <div class="resource-card" @click="selectResource(resource)">
                <!-- 资源类型标签 -->
                <div class="resource-type-badge">
                  <el-tag :type="getResourceTypeColor(resource.type)" size="small">
                    {{ getResourceTypeLabel(resource.type) }}
                  </el-tag>
                </div>

                <!-- 资源缩略图 -->
                <div class="resource-thumbnail">
                  <img 
                    v-if="resource.thumbnail_url" 
                    :src="resource.thumbnail_url" 
                    :alt="resource.title"
                    loading="lazy"
                    decoding="async"
                  />
                  <div v-else class="placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </div>

                <!-- 资源信息 -->
                <div class="resource-info">
                  <h3 class="resource-title">{{ resource.title }}</h3>
                  <p class="resource-description">{{ truncateText(resource.description, 60) }}</p>
                  
                  <!-- 知识点标签 -->
                  <div class="knowledge-points">
                    <el-tag v-for="kp in resource.knowledge_points.slice(0, 2)" :key="kp" type="info" size="small">
                      {{ kp }}
                    </el-tag>
                    <el-tag v-if="resource.knowledge_points.length > 2" type="info" size="small">
                      +{{ resource.knowledge_points.length - 2 }}
                    </el-tag>
                  </div>

                  <!-- 资源统计 -->
                  <div class="resource-stats">
                    <span class="stat-item">
                      <el-icon><View /></el-icon> {{ resource.view_count }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Star /></el-icon> {{ resource.rating.toFixed(1) }}
                    </span>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="resource-actions">
                    <el-button type="primary" size="small" @click.stop="viewResource(resource)">
                      查看详情
                    </el-button>
                    <el-button type="danger" text size="small" @click.stop="markNotInterested(resource)">
                      不感兴趣
                    </el-button>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 空状态 -->
        <el-empty v-else description="暂无推荐资源" :image-size="100">
          <el-button type="primary" @click="refreshRecommendations">重新推荐</el-button>
        </el-empty>

        <!-- 分页 -->
        <div v-if="resources.length > 0" class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @change="fetchResources"
          />
        </div>
      </div>

      <!-- 资源详情抽屉 -->
      <el-drawer v-model="showDetailDrawer" title="资源详情" size="50%">
        <div v-if="selectedResourceDetail" class="resource-detail">
          <!-- 资源标题和类型 -->
          <div class="detail-header">
            <h2>{{ selectedResourceDetail.title }}</h2>
            <el-tag :type="getResourceTypeColor(selectedResourceDetail.type)">
              {{ getResourceTypeLabel(selectedResourceDetail.type) }}
            </el-tag>
          </div>
          
          <!-- 资源缩略图 -->
          <div v-if="selectedResourceDetail.thumbnail_url" class="detail-thumbnail">
            <img 
              :src="selectedResourceDetail.thumbnail_url" 
              :alt="selectedResourceDetail.title"
              loading="lazy"
              decoding="async"
            />
          </div>

          <!-- 资源描述 -->
          <div class="detail-section">
            <h3>资源描述</h3>
            <p>{{ selectedResourceDetail.description }}</p>
          </div>

          <!-- 知识点 -->
          <div class="detail-section">
            <h3>相关知识点</h3>
            <div class="knowledge-points-full">
              <el-tag v-for="kp in selectedResourceDetail.knowledge_points" :key="kp" type="info">
                {{ kp }}
              </el-tag>
            </div>
          </div>

          <!-- 资源链接 -->
          <div class="detail-section">
            <h3>资源链接</h3>
            <el-button type="primary" @click="openResource(selectedResourceDetail)">
              <el-icon><Link /></el-icon> 打开资源
            </el-button>
          </div>

          <!-- 资源统计 -->
          <div class="detail-section">
            <h3>资源统计</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ selectedResourceDetail.view_count }}</div>
                <div class="stat-label">浏览次数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ selectedResourceDetail.rating.toFixed(1) }}</div>
                <div class="stat-label">评分</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ selectedResourceDetail.click_count }}</div>
                <div class="stat-label">点击次数</div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-actions">
            <el-button type="primary" @click="openResource(selectedResourceDetail)">
              打开资源
            </el-button>
            <el-button type="danger" @click="markNotInterested(selectedResourceDetail)">
              不感兴趣
            </el-button>
          </div>
        </div>
      </el-drawer>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生资源推荐页面
 * 显示推荐的学习资源（文章/视频/练习/教程）
 * 支持资源反馈和历史查看
 * 需求：19.2, 19.4, 19.8
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Picture, View, Star, Link } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const studentId = computed(() => userStore.userInfo?.id)

const loading = ref(true)
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const selectedType = ref<'all' | 'article' | 'video' | 'exercise' | 'tutorial'>('all')
const showDetailDrawer = ref(false)

interface Resource {
  id: number
  title: string
  description: string
  type: 'article' | 'video' | 'exercise' | 'tutorial'
  thumbnail_url?: string
  knowledge_points: string[]
  view_count: number
  rating: number
  click_count: number
  url: string
}

interface ResourceDetail extends Resource {
  content?: string
}

const resourceTypes = [
  { value: 'all', label: '全部' },
  { value: 'article', label: '文章' },
  { value: 'video', label: '视频' },
  { value: 'exercise', label: '练习' },
  { value: 'tutorial', label: '教程' }
]

const resources = ref<Resource[]>([])
const selectedResourceDetail = ref<ResourceDetail | null>(null)

async function fetchResources() {
  if (!studentId.value) return
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      type: selectedType.value === 'all' ? undefined : selectedType.value
    }
    const response = await request.get<{
      success?: boolean
      data?: { resources: Resource[]; total: number }
    }>(`/recommendations/resources/${studentId.value}`, { params })
    
    if (response.success && response.data) {
      resources.value = response.data.resources
      total.value = response.data.total
    }
  } catch (error: any) {
    console.error('[资源推荐] 获取资源失败:', error)
    ElMessage.error(error.response?.data?.message || '获取资源失败')
  } finally {
    loading.value = false
  }
}

async function refreshRecommendations() {
  if (!studentId.value) return
  refreshing.value = true
  try {
    await request.post(`/recommendations/refresh/${studentId.value}`)
    ElMessage.success('推荐已刷新')
    currentPage.value = 1
    await fetchResources()
  } catch (error: any) {
    console.error('[资源推荐] 刷新失败:', error)
    ElMessage.error(error.response?.data?.message || '刷新失败')
  } finally {
    refreshing.value = false
  }
}

async function markNotInterested(resource: Resource) {
  if (!studentId.value) return
  try {
    await request.post(`/recommendations/feedback/${studentId.value}`, {
      resource_id: resource.id,
      feedback: 'not_interested'
    })
    ElMessage.success('已标记为不感兴趣')
    // 从列表中移除该资源
    resources.value = resources.value.filter(r => r.id !== resource.id)
    if (showDetailDrawer.value && selectedResourceDetail.value?.id === resource.id) {
      showDetailDrawer.value = false
    }
  } catch (error: any) {
    console.error('[资源推荐] 标记失败:', error)
    ElMessage.error(error.response?.data?.message || '标记失败')
  }
}

function selectResource(resource: Resource) {
  selectedResourceDetail.value = resource as ResourceDetail
}

async function viewResource(resource: Resource) {
  selectResource(resource)
  showDetailDrawer.value = true
  // 记录点击
  try {
    await request.post(`/recommendations/click/${studentId.value}`, {
      resource_id: resource.id
    })
  } catch (error) {
    console.error('[资源推荐] 记录点击失败:', error)
  }
}

function openResource(resource: Resource) {
  window.open(resource.url, '_blank')
  // 记录打开
  try {
    request.post(`/recommendations/open/${studentId.value}`, {
      resource_id: resource.id
    })
  } catch (error) {
    console.error('[资源推荐] 记录打开失败:', error)
  }
}

function getResourceTypeColor(type: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const colors: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    article: 'info',
    video: 'warning',
    exercise: 'danger',
    tutorial: 'success'
  }
  return colors[type] || ''
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    article: '文章',
    video: '视频',
    exercise: '练习',
    tutorial: '教程'
  }
  return labels[type] || type
}

function truncateText(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text
}

onMounted(async () => {
  loading.value = true
  await fetchResources()
  loading.value = false
})
</script>

<style scoped>
.resource-recommendations-page {
  min-height: 100%;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.page-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.refresh-btn {
  margin-left: auto;
}

.resources-container {
  margin-bottom: 30px;
}

.resource-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.resource-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.resource-type-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.resource-thumbnail {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f5f7fa;
  overflow: hidden;
}

.resource-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 40px;
}

.resource-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.resource-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  flex: 1;
}

.knowledge-points {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.resource-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #909399;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.resource-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.resource-actions :deep(.el-button) {
  flex: 1;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.resource-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.detail-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
  flex: 1;
}

.detail-thumbnail {
  width: 100%;
  height: 300px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.detail-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.detail-section p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.knowledge-points-full {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.detail-actions :deep(.el-button) {
  flex: 1;
}
</style>
