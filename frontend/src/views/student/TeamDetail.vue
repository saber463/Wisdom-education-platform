<template>
  <div class="team-detail-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-button @click="goBack" link type="primary">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>{{ teamInfo?.name }}</h1>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="team-tabs">
      <!-- 小组信息标签页 -->
      <el-tab-pane label="小组信息" name="info">
        <div class="tab-content">
          <div class="team-overview">
            <div class="overview-item">
              <span class="label">学习目标</span>
              <span class="value">{{ teamInfo?.goal }}</span>
            </div>
            <div class="overview-item">
              <span class="label">创建者</span>
              <span class="value">{{ teamInfo?.creator_name }}</span>
            </div>
            <div class="overview-item">
              <span class="label">成员数量</span>
              <span class="value">{{ teamInfo?.current_members }}/{{ teamInfo?.max_members }}</span>
            </div>
            <div class="overview-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(teamInfo?.created_at ?? '') }}</span>
            </div>
          </div>

          <!-- 成员列表 -->
          <div class="members-section">
            <h3>小组成员</h3>
            <div class="members-list">
              <div v-for="member in teamMembers" :key="member.student_id" class="member-item">
                <el-avatar :src="member.avatar_url" :alt="member.real_name" size="large" />
                <div class="member-info">
                  <div class="member-name">
                    {{ member.real_name }}
                    <el-tag v-if="member.is_creator" type="success" size="small">创建者</el-tag>
                  </div>
                  <div class="member-stats">
                    <span>打卡: {{ member.statistics?.check_in_count || 0 }}次</span>
                    <span>互评: {{ member.statistics?.peer_review_count || 0 }}次</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 打卡功能标签页 -->
      <el-tab-pane label="每日打卡" name="checkin">
        <div class="tab-content">
          <!-- 打卡表单 -->
          <div class="checkin-form">
            <h3>今日打卡</h3>
            <el-form :model="checkInForm" label-width="100px">
              <el-form-item label="学习时长">
                <el-input-number
                  v-model="checkInForm.study_duration"
                  :min="0"
                  :max="480"
                  suffix="分钟"
                />
              </el-form-item>
              <el-form-item label="完成任务数">
                <el-input-number
                  v-model="checkInForm.completed_tasks"
                  :min="0"
                  :max="100"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleCheckIn" :loading="checkInLoading">
                  提交打卡
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 打卡记录 -->
          <div class="checkin-records">
            <h3>打卡记录</h3>
            <el-table :data="checkInRecords" stripe>
              <el-table-column prop="student_name" label="学生" width="120" />
              <el-table-column prop="check_in_time" label="打卡时间" width="150">
                <template #default="{ row }">
                  {{ formatDate(row.check_in_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="study_duration" label="学习时长" width="100">
                <template #default="{ row }">
                  {{ row.study_duration }}分钟
                </template>
              </el-table-column>
              <el-table-column prop="completed_tasks" label="完成任务数" width="120" />
            </el-table>
          </div>

          <!-- 打卡统计 -->
          <div class="checkin-statistics">
            <h3>打卡统计</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ checkInStats?.total_check_ins || 0 }}</div>
                <div class="stat-label">总打卡次数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ checkInStats?.active_members || 0 }}</div>
                <div class="stat-label">活跃成员</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ checkInStats?.check_in_rate || 0 }}%</div>
                <div class="stat-label">打卡率</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ checkInStats?.total_study_duration || 0 }}</div>
                <div class="stat-label">总学习时长(分)</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 互评功能标签页 -->
      <el-tab-pane label="互评" name="review">
        <div class="tab-content">
          <!-- 互评表单 -->
          <div class="peer-review-form">
            <h3>提交互评</h3>
            <el-form :model="peerReviewForm" :rules="peerReviewRules" ref="peerReviewFormRef" label-width="100px">
              <el-form-item label="被评价人" prop="reviewee_id">
                <el-select v-model="peerReviewForm.reviewee_id" placeholder="选择被评价人">
                  <el-option
                    v-for="member in teamMembers.filter(m => m.student_id !== currentUserId)"
                    :key="member.student_id"
                    :label="member.real_name"
                    :value="member.student_id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="作业" prop="assignment_id">
                <el-select v-model="peerReviewForm.assignment_id" placeholder="选择作业">
                  <el-option
                    v-for="assignment in assignments"
                    :key="assignment.id"
                    :label="assignment.title"
                    :value="assignment.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="评分" prop="score">
                <el-rate v-model="peerReviewForm.score" :max="10" allow-half />
                <span class="score-display">{{ peerReviewForm.score * 10 }}分</span>
              </el-form-item>
              <el-form-item label="评语" prop="comment">
                <el-input
                  v-model="peerReviewForm.comment"
                  type="textarea"
                  rows="4"
                  placeholder="请输入评语（最多200字）"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSubmitReview" :loading="reviewLoading">
                  提交互评
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 互评记录 -->
          <div class="peer-review-records">
            <h3>互评记录</h3>
            <el-table :data="peerReviews" stripe>
              <el-table-column prop="reviewer_name" label="评价人" width="120" />
              <el-table-column prop="reviewee_name" label="被评价人" width="120" />
              <el-table-column prop="assignment_title" label="作业" width="150" />
              <el-table-column prop="score" label="评分" width="80">
                <template #default="{ row }">
                  <el-rate v-model="row.score" :max="10" disabled allow-half />
                </template>
              </el-table-column>
              <el-table-column prop="comment" label="评语" min-width="200" />
              <el-table-column prop="created_at" label="时间" width="150">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 互评统计 -->
          <div class="review-statistics">
            <h3>互评统计</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ reviewStats?.total_reviews || 0 }}</div>
                <div class="stat-label">总互评数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ reviewStats?.active_reviewers || 0 }}</div>
                <div class="stat-label">参与互评人数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ reviewStats?.avg_score || 0 }}</div>
                <div class="stat-label">平均评分</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 小组学情报告标签页 -->
      <el-tab-pane label="学情报告" name="report">
        <div class="tab-content">
          <TeamReport :team-id="teamId" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import axios from 'axios'
import TeamReport from './TeamReport.vue'

interface TeamInfo {
  team_id: number
  name: string
  goal: string
  creator_id: number
  creator_name: string
  max_members: number
  current_members: number
  created_at: string
  members: any[]
}

const router = useRouter()
const route = useRoute()

const teamId = computed(() => parseInt(route.params.id as string))
const currentUserId = ref(0)

// 状态
const activeTab = ref('info')
const teamInfo = ref<TeamInfo | null>(null)
const teamMembers = ref<any[]>([])
const checkInRecords = ref<any[]>([])
const checkInStats = ref<any>(null)
const peerReviews = ref<any[]>([])
const reviewStats = ref<any>(null)
const assignments = ref<any[]>([])

// 打卡表单
const checkInForm = ref({
  study_duration: 0,
  completed_tasks: 0
})
const checkInLoading = ref(false)

// 互评表单
const peerReviewForm = ref({
  reviewee_id: '',
  assignment_id: '',
  score: 0,
  comment: ''
})

const peerReviewRules = {
  reviewee_id: [{ required: true, message: '请选择被评价人', trigger: 'change' }],
  assignment_id: [{ required: true, message: '请选择作业', trigger: 'change' }],
  score: [{ required: true, message: '请评分', trigger: 'change' }]
}

const peerReviewFormRef = ref()
const reviewLoading = ref(false)

// 获取小组信息
const fetchTeamInfo = async () => {
  try {
    const response = await axios.get(`/api/teams/${teamId.value}`)
    if (response.data.success) {
      teamInfo.value = response.data.data
      teamMembers.value = response.data.data.members
    }
  } catch (error) {
    console.error('获取小组信息失败:', error)
    ElMessage.error('获取小组信息失败')
  }
}

// 获取打卡记录
const fetchCheckInRecords = async () => {
  try {
    const response = await axios.get(`/api/teams/${teamId.value}/check-ins?days=30`)
    if (response.data.success) {
      checkInRecords.value = response.data.data.check_ins
      checkInStats.value = response.data.data.statistics
    }
  } catch (error) {
    console.error('获取打卡记录失败:', error)
  }
}

// 提交打卡
const handleCheckIn = async () => {
  try {
    checkInLoading.value = true
    const response = await axios.post(`/api/teams/${teamId.value}/check-in`, {
      study_duration: checkInForm.value.study_duration,
      completed_tasks: checkInForm.value.completed_tasks
    })

    if (response.data.success) {
      ElMessage.success('打卡成功')
      checkInForm.value = { study_duration: 0, completed_tasks: 0 }
      await fetchCheckInRecords()
    }
  } catch (error: any) {
    console.error('打卡失败:', error)
    ElMessage.error(error.response?.data?.message || '打卡失败')
  } finally {
    checkInLoading.value = false
  }
}

// 获取互评记录
const fetchPeerReviews = async () => {
  try {
    const response = await axios.get(`/api/teams/${teamId.value}/peer-reviews`)
    if (response.data.success) {
      peerReviews.value = response.data.data.peer_reviews
      reviewStats.value = response.data.data.statistics
    }
  } catch (error) {
    console.error('获取互评记录失败:', error)
  }
}

// 提交互评
const handleSubmitReview = async () => {
  if (!peerReviewFormRef.value) return

  try {
    await peerReviewFormRef.value.validate()
    reviewLoading.value = true

    const response = await axios.post(`/api/teams/${teamId.value}/peer-review`, {
      reviewee_id: peerReviewForm.value.reviewee_id,
      assignment_id: peerReviewForm.value.assignment_id,
      score: Math.round(peerReviewForm.value.score * 10),
      comment: peerReviewForm.value.comment
    })

    if (response.data.success) {
      ElMessage.success('互评提交成功')
      peerReviewForm.value = { reviewee_id: '', assignment_id: '', score: 0, comment: '' }
      await fetchPeerReviews()
    }
  } catch (error: any) {
    console.error('提交互评失败:', error)
    ElMessage.error(error.response?.data?.message || '提交互评失败')
  } finally {
    reviewLoading.value = false
  }
}

// 获取作业列表
const fetchAssignments = async () => {
  try {
    const response = await axios.get('/api/assignments?status=published')
    if (response.data.success) {
      assignments.value = response.data.data
    }
  } catch (error) {
    console.error('获取作业列表失败:', error)
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 返回
const goBack = () => {
  router.back()
}

// 页面加载
onMounted(async () => {
  // 获取当前用户ID（从localStorage或其他地方）
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    currentUserId.value = user.id
  }

  await Promise.all([
    fetchTeamInfo(),
    fetchCheckInRecords(),
    fetchPeerReviews(),
    fetchAssignments()
  ])
})
</script>

<style scoped lang="scss">
.team-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
}

.team-tabs {
  :deep(.el-tabs__content) {
    padding: 20px 0;
  }
}

.tab-content {
  padding: 20px;
}

.team-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;

  .overview-item {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 5px;
    }

    .value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
  }
}

.members-section {
  margin-bottom: 30px;

  h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .members-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;

    .member-item {
      display: flex;
      gap: 15px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      align-items: flex-start;

      .member-info {
        flex: 1;

        .member-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .member-stats {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}

.checkin-form,
.peer-review-form {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 30px;

  h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .score-display {
    margin-left: 15px;
    font-weight: 500;
  }
}

.checkin-records,
.peer-review-records {
  margin-bottom: 30px;

  h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.checkin-statistics,
.review-statistics {
  h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;

  .stat-card {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
    text-align: center;

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }

    &:nth-child(2) {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &:nth-child(3) {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    &:nth-child(4) {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
  }
}
</style>
