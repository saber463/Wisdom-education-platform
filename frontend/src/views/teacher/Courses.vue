<template>
  <TeacherLayout>
    <div class="courses-page">
      <div class="page-header">
        <h2>课程管理</h2>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon> 新建课程
        </el-button>
      </div>

      <!-- 筛选 -->
      <el-card class="filter-card">
        <el-form :inline="true" :model="filter" class="filter-form">
          <el-form-item label="课程名称">
            <el-input v-model="filter.keyword" placeholder="搜索课程" clearable style="width:200px" @input="fetchCourses" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filter.status" placeholder="全部" clearable style="width:120px" @change="fetchCourses">
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
              <el-option label="已归档" value="archived" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchCourses">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 课程列表 -->
      <el-row :gutter="20" v-loading="loading" class="courses-grid">
        <el-col v-for="course in courses" :key="course.id" :xs="24" :sm="12" :lg="8">
          <el-card class="course-card" shadow="hover">
            <div class="course-cover">
              <img v-if="course.cover" :src="course.cover" class="cover-img" />
              <div v-else class="cover-placeholder">
                <el-icon style="font-size:40px;color:#00FF94"><Reading /></el-icon>
              </div>
              <el-tag class="status-tag" :type="getStatusType(course.status)" size="small">{{ getStatusLabel(course.status) }}</el-tag>
              <el-tag v-if="course.language" class="lang-tag" size="small" type="info">{{ course.language }}</el-tag>
            </div>
            <div class="course-info">
              <div class="course-title">{{ course.title }}</div>
              <div class="course-desc">{{ course.description }}</div>
              <div class="course-meta">
                <span class="meta-item"><el-icon><User /></el-icon> {{ course.studentCount }} 人学习</span>
                <span class="meta-item"><el-icon><VideoCamera /></el-icon> {{ course.lessonCount }} 节课</span>
              </div>
            </div>
            <div class="course-actions">
              <el-button size="small" type="primary" @click="editCourse(course)">编辑</el-button>
              <el-button size="small" @click="viewStats(course)">数据</el-button>
              <el-button size="small" :type="course.status === 'published' ? 'warning' : 'success'" @click="togglePublish(course)">
                {{ course.status === 'published' ? '下架' : '发布' }}
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="24" v-if="courses.length === 0 && !loading">
          <el-empty description="暂无课程，点击新建课程开始创建" />
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchCourses"
        />
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="showCreateDialog" :title="editingCourse ? '编辑课程' : '新建课程'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="课程名称" required>
          <el-input v-model="form.title" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="课程简介" />
        </el-form-item>
        <el-form-item label="课程分类">
          <el-select v-model="form.category" placeholder="选择分类" style="width:100%">
            <el-option label="编程开发" value="programming" />
            <el-option label="数学" value="math" />
            <el-option label="英语" value="english" />
            <el-option label="科学" value="science" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Reading, User, VideoCamera } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)

interface Course {
  id: number; title: string; description: string; status: string
  studentCount: number; lessonCount: number; category: string
  cover?: string; language?: string; completionRate?: number
}

const courses = ref<Course[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(9)
const filter = reactive({ keyword: '', status: '' })
const editingCourse = ref<Course | null>(null)
const form = reactive({ title: '', description: '', category: '' })

const mockCourses: Course[] = [
  { id:1,  title:'Python零基础入门',    description:'从零开始学Python，包含语法、函数、面向对象，适合编程小白',  status:'published', studentCount:128, lessonCount:24, category:'programming', cover:'https://picsum.photos/seed/py1/400/200',  language:'Python', completionRate:72 },
  { id:2,  title:'数据结构与算法精讲',  description:'深入理解栈、队列、树、图、动态规划，帮你拿下大厂面试',      status:'published', studentCount:96,  lessonCount:32, category:'programming', cover:'https://picsum.photos/seed/ds2/400/200',  language:'Python', completionRate:65 },
  { id:3,  title:'Java后端开发实战',    description:'Spring Boot + MyBatis + MySQL，企业级项目从0到1',          status:'published', studentCount:84,  lessonCount:28, category:'programming', cover:'https://picsum.photos/seed/java3/400/200', language:'Java',   completionRate:81 },
  { id:4,  title:'前端Vue3全栈实战',   description:'Vue3 + TypeScript + Element Plus，打造现代Web应用',         status:'published', studentCount:72,  lessonCount:20, category:'programming', cover:'https://picsum.photos/seed/vue4/400/200',  language:'JS',     completionRate:88 },
  { id:5,  title:'数据库原理与应用',   description:'MySQL深度优化，索引、事务、存储过程，附真实业务案例',        status:'published', studentCount:58,  lessonCount:18, category:'programming', cover:'https://picsum.photos/seed/db5/400/200',   language:'SQL',    completionRate:67 },
  { id:6,  title:'计算机网络核心',     description:'TCP/IP协议、HTTP详解、网络安全，理论与实践结合',             status:'published', studentCount:44,  lessonCount:16, category:'programming', cover:'https://picsum.photos/seed/net6/400/200',  language:'—',      completionRate:55 },
  { id:7,  title:'操作系统原理',       description:'进程管理、内存管理、文件系统，考研/面试必备',               status:'draft',     studentCount:0,   lessonCount:12, category:'programming', cover:'https://picsum.photos/seed/os7/400/200',   language:'—',      completionRate:0  },
  { id:8,  title:'机器学习入门',       description:'线性回归、决策树、神经网络基础，附Python实战代码',            status:'draft',     studentCount:0,   lessonCount:10, category:'programming', cover:'https://picsum.photos/seed/ml8/400/200',   language:'Python', completionRate:0  },
  { id:9,  title:'C++程序设计',        description:'从C到C++，面向对象、STL、设计模式全覆盖',                   status:'archived',  studentCount:35,  lessonCount:22, category:'programming', cover:'https://picsum.photos/seed/cpp9/400/200',  language:'C++',    completionRate:45 },
]

async function fetchCourses() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
    if (filter.keyword) params.keyword = filter.keyword
    if (filter.status) params.status = filter.status
    const res = await request.get<{ courses?: Course[]; total?: number }>('/courses', { params })
    courses.value = res.courses || []
    total.value = res.total || 0
  } catch {
    courses.value = mockCourses
    total.value = mockCourses.length
  } finally { loading.value = false }
}

function resetFilter() { filter.keyword = ''; filter.status = ''; fetchCourses() }

function editCourse(c: Course) {
  editingCourse.value = c
  form.title = c.title; form.description = c.description; form.category = c.category
  showCreateDialog.value = true
}

function viewStats(c: Course) { ElMessage.info(`查看课程「${c.title}」的数据统计`) }

async function togglePublish(c: Course) {
  const action = c.status === 'published' ? '下架' : '发布'
  await ElMessageBox.confirm(`确认${action}课程「${c.title}」？`, '操作确认', { type: 'warning' })
  try {
    await request.patch(`/courses/${c.id}`, { status: c.status === 'published' ? 'draft' : 'published' })
    ElMessage.success(`${action}成功`)
    fetchCourses()
  } catch { ElMessage.error(`${action}失败`) }
}

async function saveCourse() {
  if (!form.title.trim()) { ElMessage.warning('请输入课程名称'); return }
  saving.value = true
  try {
    if (editingCourse.value) {
      await request.put(`/courses/${editingCourse.value.id}`, form)
    } else {
      await request.post('/courses', form)
    }
    ElMessage.success('保存成功')
    showCreateDialog.value = false
    editingCourse.value = null
    Object.assign(form, { title: '', description: '', category: '' })
    fetchCourses()
  } catch { ElMessage.error('保存失败') } finally { saving.value = false }
}

function getStatusLabel(s: string) { return { published: '已发布', draft: '草稿', archived: '已归档' }[s] || s }
function getStatusType(s: string): '' | 'success' | 'info' | 'warning' | 'danger' {
  return ({ published: 'success', draft: 'info', archived: 'warning' } as Record<string, '' | 'success' | 'info' | 'warning' | 'danger'>)[s] || ''
}

onMounted(fetchCourses)
</script>

<style scoped>
.courses-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 900; color: #F0F0F0; font-family: 'Source Han Sans CN', sans-serif; }
.filter-card { margin-bottom: 20px; }
.filter-form { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.courses-grid { margin-bottom: 20px; }
.course-card { height: 100%; }
.course-cover { position: relative; height: 120px; background: linear-gradient(135deg, #1a1a1a, #252525); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; border: 1px solid rgba(0,255,148,0.1); overflow: hidden; }
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.lang-tag { position: absolute; top: 8px; left: 8px; }
.status-tag { position: absolute; top: 8px; right: 8px; }
.course-info { padding: 0 0 12px; }
.course-title { font-size: 15px; font-weight: 700; color: #E0E0E0; margin-bottom: 6px; }
.course-desc { font-size: 12px; color: #707070; line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.course-meta { display: flex; gap: 16px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #606060; font-family: Consolas, monospace; }
.course-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 10px; }
</style>
