/**
 * 智慧教育学习平台 - 路由配置
 * 
 * 路由结构：
 * - /login - 登录页面
 * - /teacher/* - 教师端路由
 * - /student/* - 学生端路由
 * - /parent/* - 家长端路由
 * 
 * 需求：1.1, 5.1, 8.1 - 三角色登录和访问控制
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 公共路由（无需登录）
const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  }
]

// 教师端路由
const teacherRoutes: RouteRecordRaw[] = [
  {
    path: '/teacher',
    name: 'teacher',
    redirect: '/teacher/dashboard',
    meta: {
      title: '教师端',
      requiresAuth: true,
      role: 'teacher'
    },
    children: [
      {
        path: 'dashboard',
        name: 'teacher-dashboard',
        component: () => import('@/views/teacher/Dashboard.vue'),
        meta: {
          title: '教师工作台',
          requiresAuth: true,
          role: 'teacher'
        }
      },
      {
        path: 'assignments',
        name: 'teacher-assignments',
        component: () => import('@/views/teacher/Assignments.vue'),
        meta: {
          title: '作业管理',
          requiresAuth: true,
          role: 'teacher'
        }
      },
      {
        path: 'assignments/create',
        name: 'teacher-assignment-create',
        component: () => import('@/views/teacher/AssignmentCreate.vue'),
        meta: {
          title: '创建作业',
          requiresAuth: true,
          role: 'teacher'
        }
      },
      {
        path: 'assignments/:id',
        name: 'teacher-assignment-detail',
        component: () => import('@/views/teacher/AssignmentDetail.vue'),
        meta: {
          title: '作业详情',
          requiresAuth: true,
          role: 'teacher'
        }
      },
      {
        path: 'grading',
        name: 'teacher-grading',
        component: () => import('@/views/teacher/Grading.vue'),
        meta: {
          title: '批改管理',
          requiresAuth: true,
          role: 'teacher'
        }
      },
      {
        path: 'grading/:id',
        name: 'teacher-grading-detail',
        component: () => import('@/views/teacher/GradingDetail.vue'),
        meta: {
          title: '批改详情',
          requiresAuth: true,
          role: 'teacher'
        }
      },
      {
        path: 'analytics',
        name: 'teacher-analytics',
        component: () => import('@/views/teacher/Analytics.vue'),
        meta: {
          title: '学情分析',
          requiresAuth: true,
          role: 'teacher'
        }
      },
      {
        path: 'tiered-teaching',
        name: 'teacher-tiered-teaching',
        component: () => import('@/views/teacher/TieredTeaching.vue'),
        meta: {
          title: '分层教学',
          requiresAuth: true,
          role: 'teacher'
        }
      }
    ]
  }
]

// 学生端路由
const studentRoutes: RouteRecordRaw[] = [
  {
    path: '/student',
    name: 'student',
    redirect: '/student/dashboard',
    meta: {
      title: '学生端',
      requiresAuth: true,
      role: 'student'
    },
    children: [
      {
        path: 'dashboard',
        name: 'student-dashboard',
        component: () => import('@/views/student/Dashboard.vue'),
        meta: {
          title: '学生工作台',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'assignments',
        name: 'student-assignments',
        component: () => import('@/views/student/Assignments.vue'),
        meta: {
          title: '我的作业',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'assignments/:id',
        name: 'student-assignment-detail',
        component: () => import('@/views/student/AssignmentDetail.vue'),
        meta: {
          title: '作业详情',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'assignments/:id/submit',
        name: 'student-assignment-submit',
        component: () => import('@/views/student/AssignmentSubmit.vue'),
        meta: {
          title: '提交作业',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'results',
        name: 'student-results',
        component: () => import('@/views/student/Results.vue'),
        meta: {
          title: '批改结果',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'results/:id',
        name: 'student-result-detail',
        component: () => import('@/views/student/ResultDetail.vue'),
        meta: {
          title: '结果详情',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'recommendations',
        name: 'student-recommendations',
        component: () => import('@/views/student/Recommendations.vue'),
        meta: {
          title: '练习推荐',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'resources',
        name: 'student-resources',
        component: () => import('@/views/student/ResourceRecommendations.vue'),
        meta: {
          title: '学习资源',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'resources/history',
        name: 'student-resources-history',
        component: () => import('@/views/student/RecommendationHistory.vue'),
        meta: {
          title: '推荐历史',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'qa',
        name: 'student-qa',
        component: () => import('@/views/student/QA.vue'),
        meta: {
          title: 'AI答疑',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'teams',
        name: 'student-teams',
        component: () => import('@/views/student/Teams.vue'),
        meta: {
          title: '学习小组',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'teams/:id',
        name: 'student-team-detail',
        component: () => import('@/views/student/TeamDetail.vue'),
        meta: {
          title: '小组详情',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'speech',
        name: 'student-speech',
        component: () => import('@/views/student/SpeechAssessment.vue'),
        meta: {
          title: '口语评测',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'speech/:id',
        name: 'student-speech-detail',
        component: () => import('@/views/student/SpeechAssessmentDetail.vue'),
        meta: {
          title: '评测详情',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'speech-history',
        name: 'student-speech-history',
        component: () => import('@/views/student/SpeechAssessmentHistory.vue'),
        meta: {
          title: '评测历史',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'push-history',
        name: 'student-push-history',
        component: () => import('@/views/student/PushHistory.vue'),
        meta: {
          title: '推送历史',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'push-preferences',
        name: 'student-push-preferences',
        component: () => import('@/views/student/PushPreferences.vue'),
        meta: {
          title: '推送偏好',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'interest-settings',
        name: 'student-interest-settings',
        component: () => import('@/views/student/InterestSettings.vue'),
        meta: {
          title: '学习兴趣设置',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'courses',
        name: 'student-courses',
        component: () => import('@/views/student/CourseHome.vue'),
        meta: {
          title: '课程中心',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'courses/:id',
        name: 'student-course-detail',
        component: () => import('@/views/student/CourseDetail.vue'),
        meta: {
          title: '课程详情',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'my-courses',
        name: 'student-my-courses',
        component: () => import('@/views/student/MyCourses.vue'),
        meta: {
          title: '我的课程',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'lessons/:id',
        name: 'student-lesson-player',
        component: () => import('@/views/student/LessonPlayer.vue'),
        meta: {
          title: '课节学习',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'knowledge-portrait',
        name: 'student-knowledge-portrait',
        component: () => import('@/views/student/KnowledgePortrait.vue'),
        meta: {
          title: '知识掌握画像',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'adjustment-history',
        name: 'student-adjustment-history',
        component: () => import('@/views/student/AdjustmentHistory.vue'),
        meta: {
          title: '路径调整历史',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'my-partner',
        name: 'student-my-partner',
        component: () => import('@/views/student/MyPartner.vue'),
        meta: {
          title: '我的学习伙伴',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'wrong-book',
        name: 'student-wrong-book',
        component: () => import('@/views/student/WrongQuestionBook.vue'),
        meta: {
          title: '我的错题本',
          requiresAuth: true,
          role: 'student'
        }
      },
      {
        path: 'wrong-book/:id',
        name: 'student-wrong-book-detail',
        component: () => import('@/views/student/WrongQuestionBook.vue'),
        meta: {
          title: '错题详情',
          requiresAuth: true,
          role: 'student'
        }
      }
    ]
  }
]

// 家长端路由
const parentRoutes: RouteRecordRaw[] = [
  {
    path: '/parent',
    name: 'parent',
    redirect: '/parent/dashboard',
    meta: {
      title: '家长端',
      requiresAuth: true,
      role: 'parent'
    },
    children: [
      {
        path: 'dashboard',
        name: 'parent-dashboard',
        component: () => import('@/views/parent/Dashboard.vue'),
        meta: {
          title: '家长工作台',
          requiresAuth: true,
          role: 'parent'
        }
      },
      {
        path: 'monitor',
        name: 'parent-monitor',
        component: () => import('@/views/parent/Monitor.vue'),
        meta: {
          title: '学情监控',
          requiresAuth: true,
          role: 'parent'
        }
      },
      {
        path: 'weak-points',
        name: 'parent-weak-points',
        component: () => import('@/views/parent/WeakPoints.vue'),
        meta: {
          title: '薄弱点详情',
          requiresAuth: true,
          role: 'parent'
        }
      },
      {
        path: 'messages',
        name: 'parent-messages',
        component: () => import('@/views/parent/Messages.vue'),
        meta: {
          title: '家校留言',
          requiresAuth: true,
          role: 'parent'
        }
      }
    ]
  }
]

// 404页面
const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到',
      requiresAuth: false
    }
  }
]

// 合并所有路由
const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...teacherRoutes,
  ...studentRoutes,
  ...parentRoutes,
  ...errorRoutes
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫 - JWT验证和角色权限检查
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '智慧教育学习平台'} - 智慧教育`

  // 不需要认证的页面直接放行
  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  // 获取用户状态
  const userStore = useUserStore()
  const token = userStore.token || localStorage.getItem('token')

  // 未登录，跳转到登录页
  if (!token) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 验证token有效性（如果用户信息不存在，尝试获取）
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('[路由守卫] 获取用户信息失败:', error)
      userStore.logout()
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 检查角色权限
  const requiredRole = to.meta.role as string | undefined
  if (requiredRole && userStore.userInfo?.role !== requiredRole) {
    console.warn(`[路由守卫] 角色不匹配: 需要 ${requiredRole}, 当前 ${userStore.userInfo?.role}`)
    // 跳转到对应角色的首页
    const roleRedirects: Record<string, string> = {
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard'
    }
    const userRole = userStore.userInfo?.role
    const redirectPath = userRole ? roleRedirects[userRole] : '/login'
    next(redirectPath)
    return
  }

  next()
})

// 路由后置守卫
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等逻辑
  if (import.meta.env.DEV) {
    console.log(`[路由] ${from.path} -> ${to.path}`)
  }
})

export default router
