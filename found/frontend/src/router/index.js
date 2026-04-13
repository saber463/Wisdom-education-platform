import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Home from '@/views/Home.vue';
import Register from '@/views/auth/Register.vue';
import Courses from '@/views/Courses.vue';
import KnowledgeBase from '@/views/KnowledgeBase.vue';
import Coupons from '@/views/Coupons.vue';
import NotFound from '@/views/NotFound.vue';

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

// 代码生成器
const CodeGenerator = () => import('@/views/learning/CodeGenerator.vue');

// 角色页面
const TeacherDashboard = () => import('@/views/role/TeacherDashboard.vue');
const ParentDashboard = () => import('@/views/role/ParentDashboard.vue');
const StudentDashboard = () => import('@/views/role/StudentDashboard.vue');

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
        meta: { requiresAuth: false },
      },
      {
        path: '/coupons',
        name: 'Coupons',
        component: Coupons,
        meta: { requiresAuth: false },
      },
      // 学习路径
      {
        path: '/learning-path/generate',
        name: 'LearningPathGenerate',
        component: LearningPathGenerate,
        meta: { requiresAuth: false },
      },
      {
        path: '/learning-path/:id',
        name: 'LearningPathDetail',
        component: LearningPathDetail,
        meta: { requiresAuth: false },
      },
      {
        path: '/learning-path/template/:id',
        name: 'LearningPathTemplateDetail',
        component: LearningPathTemplateDetail,
        meta: { requiresAuth: false },
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
      // 博主主页
      {
        path: '/user/:id',
        name: 'UserProfile',
        component: () => import('@/views/UserProfile.vue'),
        meta: { requiresAuth: false },
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
      // 代码生成器
      {
        path: '/learning/code-generator',
        name: 'CodeGenerator',
        component: CodeGenerator,
        meta: { requiresAuth: false },
      },
      // 角色页面
      {
        path: '/teacher',
        name: 'TeacherDashboard',
        component: TeacherDashboard,
        meta: { requiresAuth: false },
      },
      {
        path: '/parent',
        name: 'ParentDashboard',
        component: ParentDashboard,
        meta: { requiresAuth: false },
      },
      {
        path: '/student',
        name: 'StudentDashboard',
        component: StudentDashboard,
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
    ],
  },
  // 认证路由
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
  if (to.meta.requiresAuth) {
    // 从localStorage获取用户信息
    const userInfo = safeLocalStorage.get(`${config.storagePrefix}user`);
    const token = safeLocalStorage.get(`${config.storagePrefix}token`);
    if (!userInfo || !token) {
      // 未登录，重定向到登录页
      next({ name: 'Register', query: { redirect: to.fullPath } });
      return;
    }
    next();
  } else {
    next();
  }
});

export default router;
