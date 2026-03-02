<template>
  <StudentLayout>
    <template #content>
      <div
        v-loading="loading"
        class="course-detail"
      >
        <div
          v-if="course"
          class="detail-content"
        >
          <!-- 课程头部 -->
          <el-card class="course-header">
            <div class="header-content">
              <div class="course-info">
                <h1>{{ course.display_name }}</h1>
                <p class="course-description">
                  {{ course.description }}
                </p>
                <div class="course-meta">
                  <el-tag :type="difficultyType[course.difficulty]">
                    {{ difficultyText[course.difficulty] }}
                  </el-tag>
                  <span>👥 {{ course.total_students }} 人学习</span>
                  <span>📚 {{ course.total_lessons }} 个课节</span>
                  <el-rate
                    v-model="course.avg_rating"
                    disabled
                    show-score
                    :max="5"
                  />
                </div>
              </div>
              <div class="course-price-section">
                <div class="price">
                  <span
                    v-if="course.price === 0"
                    class="price-free"
                  >免费</span>
                  <span
                    v-else
                    class="price-paid"
                  >¥{{ course.price }}</span>
                </div>
                <el-button
                  type="primary"
                  size="large"
                  :loading="purchasing"
                  @click="handlePurchase"
                >
                  立即购买
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 课程分支和课节 -->
          <el-card class="branches-section">
            <template #header>
              <h2>课程内容</h2>
            </template>
            <el-tabs
              v-model="activeBranchId"
              @tab-change="loadLessons"
            >
              <el-tab-pane
                v-for="branch in branches"
                :key="branch.id"
                :label="`${branch.branch_name} (${branch.lesson_count || 0}课节)`"
                :name="branch.id.toString()"
              >
                <div class="lessons-list">
                  <div
                    v-for="lesson in lessons"
                    :key="lesson.id"
                    class="lesson-item"
                    :class="{ 'lesson-free': lesson.is_free }"
                  >
                    <div class="lesson-info">
                      <span class="lesson-number">第{{ lesson.lesson_number }}节</span>
                      <h3>{{ lesson.title }}</h3>
                      <p v-if="lesson.description">
                        {{ lesson.description }}
                      </p>
                      <div class="lesson-meta">
                        <span v-if="lesson.video_duration">
                          ⏱️ {{ formatDuration(lesson.video_duration) }}
                        </span>
                        <el-tag
                          v-if="lesson.is_free"
                          type="success"
                          size="small"
                        >
                          免费试看
                        </el-tag>
                      </div>
                    </div>
                    <el-button
                      v-if="isPurchased"
                      type="primary"
                      @click="goToLesson(lesson.id)"
                    >
                      开始学习
                    </el-button>
                    <el-button
                      v-else-if="lesson.is_free"
                      type="primary"
                      @click="goToLesson(lesson.id)"
                    >
                      免费试看
                    </el-button>
                    <el-button
                      v-else
                      disabled
                    >
                      需购买
                    </el-button>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </div>
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const purchasing = ref(false)
const course = ref<Record<string, unknown> | null>(null)
const branches = ref<Record<string, unknown>[]>([])
const lessons = ref<Record<string, unknown>[]>([])
const activeBranchId = ref('')
const isPurchased = ref(false)

const difficultyText: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级'
}

const difficultyType: Record<string, string> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger'
}

async function loadCourse() {
  loading.value = true
  try {
    const courseId = route.params.id
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>(`/courses/${courseId}`)
    if (response.code === 200) {
      course.value = response.data
    }
  } catch (error) {
    console.error('加载课程失败:', error)
    ElMessage.error('加载课程失败')
  } finally {
    loading.value = false
  }
}

async function loadBranches() {
  try {
    const courseId = route.params.id
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>(`/courses/${courseId}/branches`)
    if (response.code === 200) {
      branches.value = (response.data ?? []) as typeof branches.value
      if (branches.value.length > 0) {
        activeBranchId.value = branches.value[0].id.toString()
        loadLessons(activeBranchId.value)
      }
    }
  } catch (error) {
    console.error('加载分支失败:', error)
  }
}

async function loadLessons(branchId: string) {
  try {
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>(`/branches/${branchId}/lessons`)
    if (response.code === 200) {
      lessons.value = (response.data ?? []) as typeof lessons.value
    }
  } catch (error) {
    console.error('加载课节失败:', error)
  }
}

async function checkPurchaseStatus() {
  try {
    const courseId = route.params.id
    const response = await request.get<{ code?: number; data?: { courses?: unknown[] }; msg?: string }>('/courses/my-courses', {
      params: { course_id: courseId }
    })
    if (response.code === 200) {
      isPurchased.value = (response.data?.courses || []).length > 0
    }
  } catch (error) {
    console.error('检查购买状态失败:', error)
  }
}

async function handlePurchase() {
  if (isPurchased.value) {
    ElMessage.info('您已购买此课程')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要购买《${course.value.display_name}》吗？`,
      '确认购买',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    purchasing.value = true
    const courseId = route.params.id
    const response = await request.post<{ code?: number; msg?: string }>(`/courses/${courseId}/purchase`, {
      payment_method: course.value.price === 0 ? 'free' : 'balance'
    })

    if (response.code === 200) {
      ElMessage.success('购买成功！')
      isPurchased.value = true
      router.push(`/student/my-courses`)
    } else {
      ElMessage.error(response.msg || '购买失败')
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('购买失败:', error)
      const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg
      ElMessage.error(msg || '购买失败')
    }
  } finally {
    purchasing.value = false
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

function goToLesson(lessonId: number) {
  router.push(`/student/lessons/${lessonId}`)
}

onMounted(() => {
  loadCourse()
  loadBranches()
  checkPurchaseStatus()
})
</script>

<style scoped>
.course-detail {
  @apply p-6;
}

.detail-content {
  @apply max-w-6xl mx-auto;
}

.course-header {
  @apply mb-6;
}

.header-content {
  @apply flex justify-between items-start;
}

.course-info {
  @apply flex-1;
}

.course-info h1 {
  @apply text-3xl font-bold text-gray-800 mb-2;
}

.course-description {
  @apply text-gray-600 mb-4;
}

.course-meta {
  @apply flex items-center gap-4 flex-wrap;
}

.course-price-section {
  @apply text-center ml-8;
}

.price {
  @apply mb-4;
}

.price-free {
  @apply text-3xl font-bold text-success-500;
}

.price-paid {
  @apply text-3xl font-bold text-primary-500;
}

.branches-section {
  @apply mb-6;
}

.lessons-list {
  @apply space-y-4;
}

.lesson-item {
  @apply flex items-center justify-between p-4 border border-gray-200 rounded-lg;
  @apply hover:border-primary-400 hover:shadow-md transition-all;
}

.lesson-item.lesson-free {
  @apply bg-success-50;
}

.lesson-info {
  @apply flex-1;
}

.lesson-number {
  @apply text-sm text-gray-500 mr-2;
}

.lesson-info h3 {
  @apply text-lg font-semibold text-gray-800 mb-1;
}

.lesson-meta {
  @apply flex items-center gap-3 mt-2;
}
</style>

