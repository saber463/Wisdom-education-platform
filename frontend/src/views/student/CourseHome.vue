<template>
  <StudentLayout>
    <template #content>
      <div class="course-home">
        <div class="page-header">
          <h1>课程中心</h1>
          <p>探索丰富的编程课程，开启您的学习之旅</p>
        </div>

        <!-- 搜索和筛选 -->
        <el-card class="filter-card">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-input
                v-model="filters.search"
                placeholder="搜索课程名称、语言或描述"
                clearable
                @clear="loadCourses"
                @keyup.enter="loadCourses"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="6">
              <el-select
                v-model="filters.difficulty"
                placeholder="难度"
                clearable
                @change="loadCourses"
              >
                <el-option
                  label="初级"
                  value="beginner"
                />
                <el-option
                  label="中级"
                  value="intermediate"
                />
                <el-option
                  label="高级"
                  value="advanced"
                />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button
                type="primary"
                @click="loadCourses"
              >
                搜索
              </el-button>
              <el-button @click="resetFilters">
                重置
              </el-button>
            </el-col>
          </el-row>
        </el-card>

        <!-- 热门课程 -->
        <div
          v-if="hotCourses.length > 0"
          class="section"
        >
          <h2 class="section-title">
            🔥 热门课程
          </h2>
          <el-row :gutter="20">
            <el-col
              v-for="course in hotCourses"
              :key="course.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
            >
              <CourseCard
                :course="course"
                @click="goToDetail(course.id)"
              />
            </el-col>
          </el-row>
        </div>

        <!-- 全部课程 -->
        <div class="section">
          <h2 class="section-title">
            全部课程
          </h2>
          <el-row
            v-loading="loading"
            :gutter="20"
          >
            <el-col
              v-for="course in courses"
              :key="course.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
            >
              <CourseCard
                :course="course"
                @click="goToDetail(course.id)"
              />
            </el-col>
          </el-row>

          <!-- 分页 -->
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[12, 24, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @size-change="loadCourses"
            @current-change="loadCourses"
          />
        </div>
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'
import CourseCard from '@/components/CourseCard.vue'

interface Course {
  id: number
  language_name: string
  display_name: string
  description: string | null
  icon_url: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  price: number
  is_hot: boolean
  total_students: number
  total_lessons: number
  avg_rating: number
  rating_count: number
}

interface Filters {
  search: string
  difficulty: string
}

const router = useRouter()

const loading = ref(false)
const courses = ref<Course[]>([])
const hotCourses = ref<Course[]>([])

const filters = ref<Filters>({
  search: '',
  difficulty: ''
})

const pagination = ref({
  page: 1,
  limit: 12,
  total: 0
})

async function loadCourses() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (filters.value.search) {
      params.search = filters.value.search
    }
    if (filters.value.difficulty) {
      params.difficulty = filters.value.difficulty
    }

    const response = await request.get<{ code?: number; data?: { courses?: unknown[]; pagination?: { total?: number } }; msg?: string }>('/courses', { params })
    if (response.code === 200) {
      courses.value = (response.data?.courses || []) as typeof courses.value
      pagination.value.total = response.data?.pagination?.total || 0
    }
  } catch (error) {
    console.error('加载课程失败，使用模拟数据:', error)
    courses.value = [
      { id: 1, name: 'Python程序设计基础', teacher_name: '王老师', difficulty: 'basic', description: '从零开始学习Python，掌握变量、循环、函数、面向对象等核心概念', lesson_count: 24, cover_url: '', is_hot: true },
      { id: 2, name: '数据结构与算法', teacher_name: '李老师', difficulty: 'medium', description: '系统学习链表、栈、队列、树、图等数据结构及常用算法', lesson_count: 32, cover_url: '', is_hot: true },
      { id: 3, name: 'MySQL数据库应用', teacher_name: '张老师', difficulty: 'basic', description: '掌握MySQL数据库设计、SQL查询优化、事务处理等实用技能', lesson_count: 18, cover_url: '', is_hot: false },
      { id: 4, name: 'Web前端开发', teacher_name: '陈老师', difficulty: 'medium', description: '学习HTML/CSS/JavaScript，实现响应式页面开发', lesson_count: 28, cover_url: '', is_hot: true },
      { id: 5, name: '操作系统原理', teacher_name: '刘老师', difficulty: 'advanced', description: '深入理解进程管理、内存管理、文件系统等操作系统核心概念', lesson_count: 36, cover_url: '', is_hot: false },
      { id: 6, name: '计算机网络', teacher_name: '赵老师', difficulty: 'medium', description: 'TCP/IP协议栈、HTTP、网络安全基础知识', lesson_count: 22, cover_url: '', is_hot: false },
    ] as any
    pagination.value.total = 6
  } finally {
    loading.value = false
  }
}

async function loadHotCourses() {
  try {
    const response = await request.get<{ code?: number; data?: { courses?: unknown[] }; msg?: string }>('/courses', {
      params: { is_hot: true, limit: 8 }
    })
    if (response.code === 200) {
      hotCourses.value = (response.data?.courses || []) as typeof hotCourses.value
    }
  } catch (error) {
    console.error('加载热门课程失败:', error)
  }
}

function resetFilters() {
  filters.value = {
    search: '',
    difficulty: ''
  }
  pagination.value.page = 1
  loadCourses()
}

function goToDetail(courseId: number) {
  router.push(`/student/courses/${courseId}`)
}

onMounted(() => {
  loadHotCourses()
  loadCourses()
})
</script>

<style scoped>
.course-home {
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

.filter-card {
  @apply mb-6;
}

.section {
  @apply mb-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-800 mb-4;
}

.pagination {
  @apply mt-6 flex justify-center;
}
</style>

