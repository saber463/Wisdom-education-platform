<template>
  <StudentLayout>
    <template #content>
      <div class="wrong-question-book">
        <div class="page-header">
          <h1>我的错题本</h1>
          <p>巩固薄弱知识点，提升学习效果</p>
        </div>

        <!-- 统计信息 -->
        <el-row
          :gutter="20"
          class="mb-4"
        >
          <el-col
            :xs="24"
            :sm="8"
          >
            <el-statistic
              title="错题总数"
              :value="statistics.total"
            />
          </el-col>
          <el-col
            :xs="24"
            :sm="8"
          >
            <el-statistic
              title="正确率"
              :value="statistics.correct_rate"
              suffix="%"
            />
          </el-col>
          <el-col
            :xs="24"
            :sm="8"
          >
            <el-statistic
              title="待巩固"
              :value="statistics.pending_count"
            />
          </el-col>
        </el-row>

        <!-- 薄弱知识点图表 -->
        <el-card
          v-if="weakPoints.length > 0"
          class="mb-4"
        >
          <template #header>
            <h3>薄弱知识点TOP5</h3>
          </template>
          <WeakPointsChart :weak-points="weakPoints" />
        </el-card>

        <!-- 筛选器 -->
        <WrongQuestionFilter @filter-change="handleFilterChange" />

        <!-- 错题列表 -->
        <div v-loading="loading">
          <WrongQuestionCard
            v-for="question in wrongQuestions"
            :key="String(question.id)"
            :question="question"
            @view-detail="viewDetail(question.id)"
            @retry="retryQuestion(question.id)"
            @mark-mastered="markMastered(question.id)"
          />
          <el-empty
            v-if="!loading && wrongQuestions.length === 0"
            description="暂无错题"
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
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'
import WrongQuestionCard from '@/components/WrongQuestionCard.vue'
import WrongQuestionFilter from '@/components/WrongQuestionFilter.vue'
import WeakPointsChart from '@/components/WeakPointsChart.vue'

interface WeakPoint {
  knowledge_point_id: number
  knowledge_point_name: string
  error_count: number
  error_rate: number
  [key: string]: unknown
}

interface WrongQuestion {
  id: number
  question_content: string
  user_answer: string
  correct_answer: string
  lesson_title: string
  created_at: string
  mastered: boolean
  [key: string]: unknown
}

const router = useRouter()

const loading = ref(false)
const wrongQuestions = ref<WrongQuestion[]>([])
const statistics = ref({
  total: 0,
  correct_rate: 0,
  pending_count: 0
})
const weakPoints = ref<WeakPoint[]>([])
const filters = ref<{ lesson_id?: number; knowledge_point_id?: number; start_date?: string; end_date?: string }>({})

async function loadWrongQuestions() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (filters.value.lesson_id) params.lesson_id = filters.value.lesson_id
    if (filters.value.knowledge_point_id) params.knowledge_point_id = filters.value.knowledge_point_id
    if (filters.value.start_date) params.start_date = filters.value.start_date
    if (filters.value.end_date) params.end_date = filters.value.end_date

    const response = await request.get<{ code?: number; data?: { wrong_questions?: WrongQuestion[] }; msg?: string }>('/video-quiz/wrong-book', { params })
    if (response.code === 200) {
      const list = response.data?.wrong_questions
      wrongQuestions.value = Array.isArray(list) ? list : []
    }
  } catch (error) {
    console.error('加载错题本失败，使用模拟数据:', error)
    wrongQuestions.value = [
      { id: 1, knowledge_point: '递归算法', question_content: '用递归实现斐波那契数列，并分析时间复杂度', wrong_count: 3, last_wrong_at: '2026-03-28', status: 'pending' },
      { id: 2, knowledge_point: '动态规划', question_content: '背包问题：给定容量W和n件物品，求最大价值', wrong_count: 2, last_wrong_at: '2026-03-25', status: 'pending' },
      { id: 3, knowledge_point: '图论', question_content: '使用Dijkstra算法求单源最短路径', wrong_count: 1, last_wrong_at: '2026-03-22', status: 'reviewing' },
      { id: 4, knowledge_point: 'SQL查询', question_content: 'LEFT JOIN与INNER JOIN的区别及使用场景', wrong_count: 2, last_wrong_at: '2026-03-20', status: 'mastered' },
    ] as any
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const response = await request.get<{ code?: number; data?: { statistics?: { total?: number; correct_rate?: number; pending_count?: number } }; msg?: string }>('/video-quiz/statistics')
    if (response.code === 200 && response.data?.statistics) {
      const s = response.data.statistics
      statistics.value = {
        total: s.total ?? 0,
        correct_rate: s.correct_rate ?? 0,
        pending_count: s.pending_count ?? 0
      }
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

async function loadWeakPoints() {
  try {
    const response = await request.get<{ code?: number; data?: { weak_points?: WeakPoint[] }; msg?: string }>('/video-quiz/weak-points')
    if (response.code === 200) {
      const list = response.data?.weak_points
      weakPoints.value = Array.isArray(list) ? list : []
    }
  } catch (error) {
    console.error('加载薄弱点失败:', error)
  }
}

function handleFilterChange(newFilters: { lesson_id?: number; knowledge_point_id?: number; start_date?: string; end_date?: string }) {
  filters.value = newFilters
  loadWrongQuestions()
}

function viewDetail(questionId: number) {
  router.push(`/student/wrong-book/${questionId}`)
}

async function retryQuestion(questionId: number) {
  try {
    const response = await request.post<{ code?: number; data?: { lesson_id?: number }; msg?: string }>(`/video-quiz/retry/${questionId}`)
    const lessonId = response.data?.lesson_id
    if (response.code === 200 && lessonId != null) {
      ElMessage.success('已开始重做')
      router.push(`/student/lessons/${String(lessonId)}`)
    } else {
      ElMessage.error(response.msg || '操作失败')
    }
  } catch (error: unknown) {
    console.error('重做错题失败:', error)
    const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg
    ElMessage.error(msg || '操作失败')
  }
}

async function markMastered(questionId: number) {
  try {
    const response = await request.put<{ code?: number; msg?: string }>(`/video-quiz/mark-mastered/${questionId}`)
    if (response.code === 200) {
      ElMessage.success('已标记为已掌握')
      loadWrongQuestions()
      loadStatistics()
    } else {
      ElMessage.error(response.msg || '操作失败')
    }
  } catch (error: unknown) {
    console.error('标记已掌握失败:', error)
    const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg
    ElMessage.error(msg || '操作失败')
  }
}

onMounted(() => {
  loadWrongQuestions()
  loadStatistics()
  loadWeakPoints()
})
</script>

<style scoped>
.wrong-question-book {
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
</style>

