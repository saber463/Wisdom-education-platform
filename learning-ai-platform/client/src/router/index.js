import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Home from '@/views/Home.vue';
import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue';
import Courses from '@/views/Courses.vue';
import KnowledgeBase from '@/views/KnowledgeBase.vue';
import Coupons from '@/views/Coupons.vue';
import NotFound from '@/views/NotFound.vue';
import MainDashboard from '@/views/MainDashboard.vue';
import StarTeachers from '@/views/StarTeachers.vue';

import config from '@/config';
import { safeLocalStorage } from '@/store/user';

// 懒加载组件
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue');
const ResetPassword = () => import('@/views/auth/ResetPassword.vue');

// 学习路径相关
const LearningPathDetail = () => import('@/views/learning/LearningPathDetail.vue');
const LearningPathGenerate = () => import('@/views/learning/LearningPathGenerate.vue');
const LearningPathTemplateDetail = () => import('@/views/learning/LearningPathTemplateDetail.vue');

// 用户相关
const UserCenter = () => import('@/views/user/UserCenter.vue');
const BrowseHistory = () => import('@/views/user/BrowseHistory.vue');

// 评估相关
const TestList = () => import('@/views/assessment/TestList.vue');
const TestDetail = () => import('@/views/assessment/TestDetail.vue');
const TestResult = () => import('@/views/assessment/TestResult.vue');
const KnowledgePointsAnalysis = () => import('@/views/assessment/KnowledgePointsAnalysis.vue');

// 帖子相关
const TweetList = () => import('@/views/tweet/TweetList.vue');
const TweetPublish = () => import('@/views/tweet/TweetPublish.vue');

// 小组相关
const GroupList = () => import('@/views/group/GroupList.vue');
const GroupDetail = () => import('@/views/group/GroupDetail.vue');
const GroupCreate = () => import('@/views/group/GroupCreate.vue');
const UserGroups = () => import('@/views/group/UserGroups.vue');

// 会员相关
const Membership = () => import('@/views/Membership.vue');

// 钱包相关
const Wallet = () => import('@/views/Wallet.vue');

// AI相关
const ImageGeneration = () => import('@/views/ai/ImageGeneration.vue');
const CodeGenerator = () => import('@/views/ai/CodeGenerator.vue');
const RoadmapDisplay = () => import('@/views/learning/RoadmapDisplay.vue');

// 角色页面
const TeacherDashboard = () => import('@/views/role/TeacherDashboard.vue');
const ParentDashboard = () => import('@/views/role/ParentDashboard.vue');
const ParentClassroom = () => import('@/views/role/ParentClassroom.vue');
const ContactTeachers = () => import('@/views/role/ContactTeachers.vue');
const StudentDashboard = () => import('@/views/role/StudentDashboard.vue');
const AlgoViz = () => import('@/views/learning/AlgoViz.vue');

// 导师个人主页（参照小红书风格）
const ProfilePage = () => import('@/views/user/ProfilePage.vue');

// VIP课程
const VipCourses = () => import('@/views/VipCourses.vue');
// 创建课程
const CourseCreate = () => import('@/views/CourseCreate.vue');

// 作业中心
const Homework = () => import('@/views/homework/Homework.vue');
const HomeworkCreate = () => import('@/views/homework/HomeworkCreate.vue');

const routes = [
  {
    path: '/',
    name: 'MainLayout',
    component: MainLayout,
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: { requiresAuth: false },
      },
      {
        path: '/courses',
        name: 'Courses',
        component: Courses,
        meta: { requiresAuth: false },
      },
      {
        path: '/knowledge-base',
        name: 'KnowledgeBase',
        component: KnowledgeBase,
        meta: { requiresAuth: true },
      },
      {
        path: '/coupons',
        name: 'Coupons',
        component: Coupons,
        meta: { requiresAuth: false },
      },
      // 学习路径 - 需要登录，且仅限学生和老师
      {
        path: '/learning-path/generate',
        name: 'LearningPathGenerate',
        component: LearningPathGenerate,
        meta: { requiresAuth: true, roles: ['student', 'teacher', 'admin'] },
      },
      {
        path: '/learning-path/:id',
        name: 'LearningPathDetail',
        component: LearningPathDetail,
        meta: { requiresAuth: true, roles: ['student', 'teacher', 'admin'] },
      },
      {
        path: '/learning-path/template/:id',
        name: 'LearningPathTemplateDetail',
        component: LearningPathTemplateDetail,
        meta: { requiresAuth: true, roles: ['student', 'teacher', 'admin'] },
      },
      // 评估
      {
        path: '/assessment/tests',
        name: 'TestList',
        component: TestList,
        meta: { requiresAuth: false },
      },
      {
        path: '/assessment/test/:id',
        name: 'TestDetail',
        component: TestDetail,
        meta: { requiresAuth: true },
      },
      {
        path: '/assessment/result/:id',
        name: 'TestResult',
        component: TestResult,
        meta: { requiresAuth: true },
      },
      {
        path: '/assessment/analysis',
        name: 'KnowledgePointsAnalysis',
        component: KnowledgePointsAnalysis,
        meta: { requiresAuth: true },
      },
      {
        path: '/assessment/question-bank',
        name: 'QuestionBank',
        component: () => import('@/views/assessment/QuestionBank.vue'),
        meta: { requiresAuth: true },
      },
      // 帖子
      {
        path: '/tweets',
        name: 'TweetList',
        component: TweetList,
        meta: { requiresAuth: false },
      },
      {
        path: '/tweets/publish',
        name: 'TweetPublish',
        component: TweetPublish,
        meta: { requiresAuth: true },
      },
      // 热门话题详情
      {
        path: '/topic/:id',
        name: 'HotTopicDetail',
        component: () => import('@/views/HotTopicDetail.vue'),
        meta: { requiresAuth: false },
      },
      // 博主主页（旧路由兼容）
      {
        path: '/user/:id',
        name: 'UserProfile',
        component: () => import('@/views/UserProfile.vue'),
        meta: { requiresAuth: false },
      },
      // 导师个人主页（新 - 小红书风格）
      {
        path: '/profile/:userId',
        name: 'ProfilePage',
        component: ProfilePage,
        meta: { requiresAuth: false },
      },
      // VIP课程
      {
        path: '/vip-courses',
        name: 'VipCourses',
        component: VipCourses,
        meta: { requiresAuth: false },
      },
      // 创建课程
      {
        path: '/course/create',
        name: 'CourseCreate',
        component: CourseCreate,
        meta: { requiresAuth: true, roles: ['teacher', 'admin'] },
      },
      // 小组
      {
        path: '/groups',
        name: 'GroupList',
        component: GroupList,
        meta: { requiresAuth: false },
      },
      {
        path: '/groups/create',
        name: 'GroupCreate',
        component: GroupCreate,
        meta: { requiresAuth: true },
      },
      {
        path: '/groups/:id',
        name: 'GroupDetail',
        component: GroupDetail,
        meta: { requiresAuth: false },
      },
      {
        path: '/user/groups',
        name: 'UserGroups',
        component: UserGroups,
        meta: { requiresAuth: true },
      },
      // 代码生成器 - 需要登录
      {
        path: '/learning/code-generator',
        name: 'CodeGenerator',
        component: CodeGenerator,
        meta: { requiresAuth: true },
      },
      {
        path: '/teacher',
        name: 'TeacherDashboard',
        component: TeacherDashboard,
        meta: { requiresAuth: true, roles: ['teacher', 'admin'] },
      },
      {
        path: '/parent',
        name: 'ParentDashboard',
        component: ParentDashboard,
        meta: { requiresAuth: true, roles: ['parent', 'admin'] },
      },
      {
        path: '/parent-classroom',
        name: 'ParentClassroom',
        component: ParentClassroom,
        meta: { requiresAuth: true, roles: ['parent', 'admin'] },
      },
      {
        path: '/parent/report',
        name: 'ParentReport',
        component: () => import('@/views/NotFound.vue'), // 暂时指向 NotFound 或创建一个报告页
        meta: { requiresAuth: true, roles: ['parent', 'admin'] },
      },
      {
        path: '/contact-teachers',
        name: 'ContactTeachers',
        component: ContactTeachers,
        meta: { requiresAuth: true, roles: ['parent', 'admin'] },
      },
      {
        path: '/student',
        name: 'StudentDashboard',
        component: MainDashboard, // 将学生首页指向 MainDashboard (Hub)
        meta: { requiresAuth: true, roles: ['student', 'teacher', 'admin'] },
      },
      // 算法可视化页面
      {
        path: '/student/algo-viz',
        name: 'AlgoViz',
        component: AlgoViz,
        meta: { requiresAuth: true },
      },
      // 主界面（登录后）
      {
        path: '/dashboard',
        name: 'MainDashboard',
        component: MainDashboard,
        meta: { requiresAuth: true },
      },
      // 明星老师
      {
        path: '/star-teachers',
        name: 'StarTeachers',
        component: StarTeachers,
        meta: { requiresAuth: false },
      },
      // 用户中心
      {
        path: '/user/center',
        name: 'UserCenter',
        component: UserCenter,
        meta: { requiresAuth: true },
      },
      {
        path: '/user/browse-history',
        name: 'BrowseHistory',
        component: BrowseHistory,
        meta: { requiresAuth: true },
      },
      // 会员
      {
        path: '/membership',
        name: 'Membership',
        component: Membership,
        meta: { requiresAuth: true },
      },
      // 钱包
      {
        path: '/wallet',
        name: 'Wallet',
        component: Wallet,
        meta: { requiresAuth: true },
      },
      // AI图片生成
      {
        path: '/ai/image-generation',
        name: 'ImageGeneration',
        component: ImageGeneration,
        meta: { requiresAuth: true },
      },
      // 开发者路线图
      {
        path: '/roadmap',
        name: 'RoadmapDisplay',
        component: RoadmapDisplay,
        meta: { requiresAuth: false },
      },
      // 作业中心
      {
        path: '/homework',
        name: 'Homework',
        component: Homework,
        meta: { requiresAuth: true },
      },
      {
        path: '/homework/create',
        name: 'HomeworkCreate',
        component: HomeworkCreate,
        meta: { requiresAuth: true, roles: ['teacher', 'admin'] },
      },
      // 法律页面
      {
        path: '/about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: '/terms',
        name: 'Terms',
        component: () => import('@/views/Terms.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: '/privacy',
        name: 'Privacy',
        component: () => import('@/views/Privacy.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: '/contact',
        name: 'Contact',
        component: () => import('@/views/Contact.vue'),
        meta: { requiresAuth: false },
      },
    ],
  },
  // 认证路由
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { requiresAuth: false },
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(''),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userInfo = safeLocalStorage.get(`${config.storagePrefix}user`);
  const token = safeLocalStorage.get(`${config.storagePrefix}token`);

  if (to.meta.requiresAuth) {
    if (!userInfo || !token) {
      // 未登录，重定向到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    // 检查角色权限
    if (to.meta.roles && !to.meta.roles.includes(userInfo.role || 'student')) {
      // 无权访问，重定向到首页或错误页
      next({ name: 'Home' });
      return;
    }

    next();
  } else {
    next();
  }
});

export default router;
