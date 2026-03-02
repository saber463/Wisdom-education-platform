<template>
  <StudentLayout>
    <template #content>
      <div class="my-courses">
        <div class="page-header">
          <h1>我的课程</h1>
          <p>继续您的学习之旅</p>
        </div>

        <el-row :gutter="20" v-loading="loading">
          <el-col
            v-for="item in myCourses"
            :key="item.purchase.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <el-card class="course-card" shadow="hover">
              <div class="course-image">
                <img 
                  v-if="item.course.icon_url" 
                  :src="item.course.icon_url" 
                  :alt="item.course.display_name"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="course-icon-placeholder">
                  {{ item.course.language_name.charAt(0) }}
                </div>
              </div>
              <div class="course-content">
                <h3>{{ item.course.display_name }}</h3>
                <p v-if="item.branch">{{ item.branch.branch_name }}</p>
                <div class="course-progress">
                  <el-progress :percentage="getProgress(item)" :status="getProgressStatus(item)" />
                </div>
                <div class="course-actions">
                  <el-button type="primary" @click="goToCourse(item.course.id)">
                    继续学习
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="!loading && myCourses.length === 0" description="暂无课程" />

        <!-- 分页 -->
        <el-pagination
          v-if="pagination.total > 0"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadMyCourses"
          @current-change="loadMyCourses"
          class="pagination"
        />
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'

const router = useRouter()

const loading = ref(false)
const myCourses = ref<any[]>([])

const pagination = ref({
  page: 1,
  limit: 12,
  total: 0
})

async function loadMyCourses() {
  loading.value = true
  try {
    const response = await request.get<{ code?: number; data?: { courses?: unknown[]; pagination?: { total?: number } }; msg?: string }>('/courses/my-courses', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit
      }
    })
    if (response.code === 200 && response.data) {
      myCourses.value = (response.data.courses || []) as typeof myCourses.value
      pagination.value.total = response.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('加载我的课程失败:', error)
    ElMessage.error('加载课程失败')
  } finally {
    loading.value = false
  }
}

function getProgress(item: any): number {
  // 这里应该从API获取实际进度，暂时返回0
  return 0
}

function getProgressStatus(item: any): string {
  const progress = getProgress(item)
  if (progress === 0) return ''
  if (progress === 100) return 'success'
  return ''
}

function goToCourse(courseId: number) {
  router.push(`/student/courses/${courseId}`)
}

onMounted(() => {
  loadMyCourses()
})
</script>

<style scoped>
.my-courses {
  @apply p-6;
}

.page-header {
  @apply mb-6 text-center;
}

.page-header h1 {
  @apply text-3xl font-bold text-gray-800 mb-2;
}

.page-header p {
  @apply text-gray-600;
}

.course-card {
  @apply mb-4;
}

.course-image {
  @apply h-40 bg-gray-100 overflow-hidden rounded-t-lg;
}

.course-image img {
  @apply w-full h-full object-cover;
}

.course-icon-placeholder {
  @apply w-full h-full flex items-center justify-center text-6xl font-bold text-gray-400;
}

.course-content {
  @apply p-4;
}

.course-content h3 {
  @apply text-lg font-bold text-gray-800 mb-2;
}

.course-progress {
  @apply my-4;
}

.course-actions {
  @apply mt-4;
}

.pagination {
  @apply mt-6 flex justify-center;
}
</style>

