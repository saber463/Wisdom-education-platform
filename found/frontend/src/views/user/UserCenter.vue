<template>
  <div class="user-center-page">
    <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-dark dark:text-white mb-6">个人中心</h2>

      <div class="glass-card mb-8">
        <div class="p-6">
          <div class="flex flex-col md:flex-row items-center mb-8">
            <div class="relative mb-4 md:mb-0">
              <img
                :src="userInfo.avatar"
                alt="用户头像"
                class="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20"
              />
              <label
                class="absolute bottom-0 right-0 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-tech-blue transition-colors cursor-pointer"
              >
                <i class="fa fa-camera" />
                <input
                  type="file"
                  accept="image/*"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  @change="handleAvatarChange"
                />
              </label>
              <!-- 预设头像选择面板按钮 -->
              <button
                class="absolute top-0 right-0 bg-secondary text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-tech-purple transition-colors cursor-pointer"
                @click="showPresetAvatars = true"
              >
                <i class="fa fa-image" />
              </button>
            </div>
            <div class="md:ml-8 text-center md:text-left">
              <h3 class="text-xl font-bold text-dark dark:text-white mb-1">
                {{ userInfo.username }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                {{ userInfo.email || '未设置邮箱' }}
              </p>
              <p class="text-gray-500 dark:text-gray-500 text-sm">
                注册时间：{{ formatTime(userInfo.createdAt) }}
              </p>
            </div>
          </div>

          <form class="space-y-6" @submit.prevent="handleUpdate">
            <div class="input-group">
              <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2" for="username"
                >用户名</label
              >
              <div class="relative">
                <i class="fa fa-user absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="username"
                  v-model="form.username"
                  type="text"
                  class="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark dark:text-white transition-all"
                  required
                />
              </div>
            </div>

            <div class="input-group">
              <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2" for="email"
                >邮箱</label
              >
              <div class="relative">
                <i class="fa fa-envelope absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark dark:text-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2" for="intro"
                >个人简介</label
              >
              <textarea
                id="intro"
                v-model="form.intro"
                class="w-full px-4 py-3 bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-dark dark:text-white transition-all h-24 resize-none"
                placeholder="分享你的学习目标或兴趣..."
              />
            </div>

            <div class="flex justify-end">
              <Button type="secondary" class="mr-3" @click="resetForm"> 取消 </Button>
              <Button
                type="primary"
                :disabled="isLoading"
                class="bg-gradient-to-r from-primary to-accent hover:from-tech-blue hover:to-primary border-none"
              >
                <span v-if="!isLoading">保存修改</span>
                <span v-if="isLoading">保存中...</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div class="glass-card">
        <div class="p-6">
          <h3 class="text-xl font-bold text-dark dark:text-white mb-4">我的学习数据</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white/5 p-4 rounded-lg border border-white/10 transition-all hover:border-primary/50 group">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-gray-600 dark:text-gray-400">累计学习</p>
                <i class="fa fa-clock-o text-primary group-hover:text-tech-blue transition-colors" />
              </div>
              <p class="text-2xl font-bold text-primary">{{ mockLearningStats.totalHours }}<span class="text-xs font-normal ml-1">小时</span></p>
            </div>
            <div class="bg-white/5 p-4 rounded-lg border border-white/10 transition-all hover:border-primary/50 group">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-gray-600 dark:text-gray-400">完成课程</p>
                <i class="fa fa-graduation-cap text-primary group-hover:text-tech-blue transition-colors" />
              </div>
              <p class="text-2xl font-bold text-primary">{{ mockLearningStats.completedCourses }}<span class="text-xs font-normal ml-1">门</span></p>
            </div>
            <div class="bg-white/5 p-4 rounded-lg border border-white/10 transition-all hover:border-primary/50 group">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-gray-600 dark:text-gray-400">连续打卡</p>
                <i class="fa fa-fire text-orange-400 group-hover:text-tech-blue transition-colors" />
              </div>
              <p class="text-2xl font-bold text-orange-400">{{ mockLearningStats.currentStreak }}<span class="text-xs font-normal ml-1">天</span></p>
            </div>
            <div class="bg-white/5 p-4 rounded-lg border border-white/10 transition-all hover:border-primary/50 group">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-gray-600 dark:text-gray-400">经验值</p>
                <i class="fa fa-star text-yellow-400 group-hover:text-tech-blue transition-colors" />
              </div>
              <p class="text-2xl font-bold text-yellow-400">{{ mockLearningStats.totalPoints }}<span class="text-xs font-normal ml-1">XP</span></p>
            </div>
          </div>

          <!-- 成就徽章 -->
          <div class="mt-6">
            <h4 class="text-base font-semibold text-white mb-3">🎖 我的成就</h4>
            <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div
                v-for="b in mockAchievements"
                :key="b.id"
                :title="b.desc"
                class="flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer"
                :class="b.unlocked ? 'bg-white/5 border-white/15 hover:border-tech-blue/50' : 'bg-white/2 border-white/5 opacity-40 grayscale'"
              >
                <div class="text-2xl mb-1">{{ b.icon }}</div>
                <div class="text-xs text-center text-gray-400">{{ b.name }}</div>
              </div>
            </div>
          </div>

          <!-- 我的课程进度 -->
          <div class="mt-6">
            <h4 class="text-base font-semibold text-white mb-3">📚 学习中的课程</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="course in mockCompletedCourses"
                :key="course.id"
                class="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/8 hover:border-white/20 transition-all"
              >
                <img :src="course.cover" :alt="course.title" class="w-16 h-11 object-cover rounded-lg flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-white truncate">{{ course.title }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="course.progress === 100 ? 'bg-green-400' : 'bg-gradient-to-r from-tech-blue to-tech-purple'"
                        :style="{ width: course.progress + '%' }"
                      />
                    </div>
                    <span class="text-xs text-gray-400 whitespace-nowrap">{{ course.progress }}%</span>
                  </div>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full bg-tech-blue/10 text-tech-blue flex-shrink-0">{{ course.category }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <router-link
              to="/student"
              class="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-medium rounded-lg transition-all hover:scale-105 w-full max-w-xs"
            >
              <span class="mr-2">🎒</span> 进入学习台
            </router-link>
            <button
              class="inline-flex items-center justify-center px-8 py-3 bg-secondary hover:bg-secondary-dark text-white font-medium rounded-lg transition-colors duration-300 w-full max-w-xs"
              @click="showInterestPopup"
            >
              <span class="mr-2">🎯</span> 修改兴趣标签
            </button>
          </div>
        </div>
      </div>

      <!-- 用户帖子列表 -->
      <div class="card mt-8">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-dark">我的帖子</h3>
            <router-link
              to="/tweets/publish"
              class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-300"
            >
              <i class="fa fa-pencil mr-2" /> 发布新帖子
            </router-link>
          </div>

          <!-- 帖子列表 -->
          <div v-if="userTweets.length > 0" class="space-y-6">
            <TweetCard
              v-for="tweet in userTweets"
              :key="tweet._id"
              :tweet="tweet"
              @tweet-deleted="handleTweetDeleted"
            />
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12">
            <div
              class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"
            >
              <i class="fa fa-comments text-4xl text-gray-400" />
            </div>
            <h4 class="text-lg font-medium mb-2">还没有发布任何帖子</h4>
            <p class="text-gray-500 mb-4">分享你的学习心得，与其他用户交流</p>
            <router-link
              to="/tweets/publish"
              class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-300"
            >
              <i class="fa fa-pencil mr-2" /> 发布第一条帖子
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 预设头像选择全屏弹窗 -->
  <div
    v-if="showPresetAvatars"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col"
    >
      <!-- 弹窗头部 -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">选择预设头像</h3>
        <button
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="showPresetAvatars = false"
        >
          <i class="fa fa-times text-xl" />
        </button>
      </div>

      <!-- 分类标签 -->
      <div
        class="flex flex-wrap gap-3 p-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
      >
        <!-- 预测头像标签 -->
        <button
          class="px-4 py-2 text-sm rounded-full transition-all"
          :class="
            selectedTab === 'predicted'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary/20 dark:hover:bg-primary/30'
          "
          @click="selectedTab = 'predicted'"
        >
          <i class="fa fa-magic mr-1" />预测头像
        </button>
        <!-- 预设头像标签 -->
        <button
          class="px-4 py-2 text-sm rounded-full transition-all"
          :class="
            selectedTab === 'preset'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary/20 dark:hover:bg-primary/30'
          "
          @click="selectedTab = 'preset'"
        >
          <i class="fa fa-image mr-1" />预设头像
        </button>
      </div>

      <!-- 头像内容区域 -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- 预测头像内容 -->
        <div v-if="selectedTab === 'predicted'">
          <div class="mb-4">
            <h4 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              基于您的学习兴趣推荐
            </h4>
            <p class="text-gray-500 dark:text-gray-400 text-sm">
              根据您的学习历史和兴趣，我们为您推荐以下头像
            </p>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            <div
              v-for="(avatar, index) in predictedAvatars"
              :key="'predicted-' + index"
              class="cursor-pointer hover:scale-105 transition-all duration-200"
              @click="selectPresetAvatar(avatar)"
            >
              <img
                :src="avatar"
                alt="预测头像"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors shadow-sm"
              />
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="predictedAvatars.length === 0" class="text-center py-12">
            <div
              class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"
            >
              <i class="fa fa-magic text-3xl text-gray-400" />
            </div>
            <p class="text-gray-500 dark:text-gray-400">暂无推荐头像</p>
          </div>
        </div>

        <!-- 预设头像内容 -->
        <div v-else>
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            <div
              v-for="(avatar, index) in categorizedAvatars[selectedCategory] || []"
              :key="index"
              class="cursor-pointer hover:scale-105 transition-all duration-200"
              @click="selectPresetAvatar(avatar)"
            >
              <img
                :src="avatar"
                alt="预设头像"
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors shadow-sm"
              />
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="
              !categorizedAvatars[selectedCategory] ||
              categorizedAvatars[selectedCategory].length === 0
            "
            class="text-center py-12"
          >
            <div
              class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"
            >
              <i class="fa fa-image text-3xl text-gray-400" />
            </div>
            <p class="text-gray-500 dark:text-gray-400">该分类下暂无头像</p>
          </div>
        </div>
      </div>

      <!-- 弹窗底部 -->
      <div class="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 gap-3">
        <Button type="secondary" @click="showPresetAvatars = false"> 取消 </Button>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';
import Button from '@/components/common/Button.vue';
import { useUserStore } from '@/store/user';
import { useNotificationStore } from '@/store/notification';
import dayjs from 'dayjs';
import { tweetApi, userApi } from '@/utils/api';
import TweetCard from '@/components/business/TweetCard.vue';

const userStore = useUserStore();
const notificationStore = useNotificationStore();
const instance = getCurrentInstance();

// 用户信息
const userInfo = ref({
  username: '用户名',
  email: 'user@example.com',
  avatar: 'https://picsum.photos/100/100?random=1',
  createdAt: new Date(),
  intro: '个人简介',
});

// 表单数据
const form = ref({
  username: '',
  email: '',
  intro: '',
});

// 预设头像相关状态
const showPresetAvatars = ref(false);
const selectedCategory = ref('默认');
const avatarCategories = ref(['默认']);
const categorizedAvatars = ref({});
// 预测头像相关状态
const selectedTab = ref('predicted');
const predictedAvatars = ref([]);
// 用户兴趣偏好
const userInterests = ref([]);

// 用户帖子列表
const userTweets = ref([]);

const isLoading = ref(false);

// Mock学习统计数据
const mockLearningStats = ref({
  totalHours: 284,
  completedCourses: 12,
  currentStreak: 21,
  totalPoints: 3420,
  level: 8,
  rank: 5,
});

// Mock已学课程
const mockCompletedCourses = ref([
  { id: 1, title: 'JavaScript高级程序设计', progress: 100, cover: 'https://picsum.photos/seed/uc1/80/55', category: 'JS' },
  { id: 2, title: 'Vue3实战项目开发', progress: 100, cover: 'https://picsum.photos/seed/uc2/80/55', category: 'Vue' },
  { id: 3, title: 'Python数据分析入门', progress: 78, cover: 'https://picsum.photos/seed/uc3/80/55', category: 'Python' },
  { id: 4, title: '数据结构与算法精讲', progress: 60, cover: 'https://picsum.photos/seed/uc4/80/55', category: '算法' },
  { id: 5, title: 'React 18完全指南', progress: 45, cover: 'https://picsum.photos/seed/uc5/80/55', category: 'React' },
  { id: 6, title: 'Node.js后端开发实战', progress: 100, cover: 'https://picsum.photos/seed/uc6/80/55', category: 'Node' },
  { id: 7, title: 'MySQL数据库优化', progress: 30, cover: 'https://picsum.photos/seed/uc7/80/55', category: 'DB' },
  { id: 8, title: 'Docker容器化部署', progress: 100, cover: 'https://picsum.photos/seed/uc8/80/55', category: 'DevOps' },
  { id: 9, title: 'Git版本控制精讲', progress: 100, cover: 'https://picsum.photos/seed/uc9/80/55', category: 'Git' },
  { id: 10, title: 'TypeScript完全教程', progress: 55, cover: 'https://picsum.photos/seed/uc10/80/55', category: 'TS' },
]);

// Mock成就徽章
const mockAchievements = ref([
  { id: 1, icon: '🔥', name: '连续21天', desc: '连续学习21天', unlocked: true },
  { id: 2, icon: '💻', name: '代码达人', desc: '完成100道编程题', unlocked: true },
  { id: 3, icon: '📚', name: '知识渴望者', desc: '学习超过100小时', unlocked: true },
  { id: 4, icon: '🏆', name: '竞赛先锋', desc: '参加并完成3次竞赛', unlocked: true },
  { id: 5, icon: '⭐', name: '优秀学员', desc: '平均成绩90分以上', unlocked: false },
  { id: 6, icon: '🚀', name: '全栈征途', desc: '完成全栈课程路径', unlocked: false },
]);

// 格式化时间
const formatTime = time => {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

// 页面加载时初始化数据
onMounted(async () => {
  // 初始化用户信息
  userInfo.value = userStore.userInfo || {
    username: '用户名',
    email: 'user@example.com',
    avatar: 'https://picsum.photos/100/100?random=1',
    createdAt: new Date(),
    intro: '个人简介',
  };

  // 初始化表单数据
  form.value = {
    username: userInfo.value.username,
    email: userInfo.value.email,
    intro: userInfo.value.intro || '',
  };

  // 删除获取用户积分的API调用
  // await userStore.getPoints()

  // 获取用户帖子列表
  await fetchUserTweets();

  // 获取预设头像列表
  await fetchPresetAvatars();

  // 获取用户兴趣偏好和预测头像
  await fetchUserInterests();
  await fetchPredictedAvatars();
});

// 获取用户帖子列表
const fetchUserTweets = async () => {
  try {
    const response = await tweetApi.getUserList();
    // 检查响应数据结构，确保安全访问
    userTweets.value = response?.data?.list || [];
  } catch (error) {
    console.error('获取用户帖子列表失败:', error);
    userTweets.value = []; // 出错时确保userTweets是一个数组
  }
};

// 获取预设头像列表
const fetchPresetAvatars = async () => {
  try {
    const response = await userApi.getPresetAvatars();

    // 检查响应数据
    if (response.data.success && response.data.data) {
      // 使用后端返回的分类
      categorizedAvatars.value = response.data.data;
      avatarCategories.value = Object.keys(response.data.data);
    }

    // 确保有选中的分类
    if (
      avatarCategories.value.length > 0 &&
      !avatarCategories.value.includes(selectedCategory.value)
    ) {
      selectedCategory.value = avatarCategories.value[0];
    }
  } catch (error) {
    console.error('获取预设头像列表失败:', error);
    // 出错时初始化空分类
    categorizedAvatars.value = { 默认: [] };
    avatarCategories.value = ['默认'];
    selectedCategory.value = '默认';
  }
};

// 获取用户兴趣偏好
const fetchUserInterests = async () => {
  try {
    // 调用后端API获取用户兴趣偏好
    const response = await userApi.getCurrentUser();
    if (response.data.success && response.data.data && response.data.data.learningInterests) {
      userInterests.value = response.data.data.learningInterests;
    } else {
      // 如果后端没有返回兴趣数据，使用默认兴趣
      userInterests.value = ['javascript', 'python', 'web开发', '机器学习'];
    }
  } catch (error) {
    console.error('获取用户兴趣偏好失败:', error);
    // 出错时使用默认兴趣
    userInterests.value = ['javascript', 'python', 'web开发', '机器学习'];
  }
};

// 获取预测头像
const fetchPredictedAvatars = async () => {
  try {
    // 调用后端API获取预测头像
    const response = await userApi.getPresetAvatars({
      interests: JSON.stringify(userInterests.value),
    });

    if (response.data.success && response.data.data && response.data.data['预测']) {
      // 使用后端返回的预测头像
      predictedAvatars.value = response.data.data['预测'];
    } else {
      // 后端没有返回预测头像，使用本地过滤逻辑
      const allAvatarsResponse = await userApi.getPresetAvatars();
      if (allAvatarsResponse.data.success && allAvatarsResponse.data.data) {
        const allAvatars = Object.values(allAvatarsResponse.data.data).flat();

        // 本地过滤逻辑作为备选
        const predicted = allAvatars.filter(avatar => {
          return userInterests.value.some(interest =>
            avatar.toLowerCase().includes(interest.toLowerCase())
          );
        });

        predictedAvatars.value = predicted.length > 0 ? predicted : allAvatars.slice(0, 6);
      }
    }
  } catch (error) {
    console.error('获取预测头像失败:', error);
    predictedAvatars.value = [];
  }
};

// 选择预设头像
const selectPresetAvatar = async avatarUrl => {
  try {
    // 更新本地头像预览
    userInfo.value.avatar = avatarUrl;

    // 更新用户头像
    await userStore.updateAvatar(avatarUrl);
    notificationStore.success('头像更新成功！');

    // 关闭预设头像选择面板
    showPresetAvatars.value = false;
  } catch (error) {
    console.error('更新头像失败:', error);
    notificationStore.error('头像更新失败，请稍后重试');
  }
};

// 重置表单
const resetForm = () => {
  form.value = {
    username: userInfo.value.username,
    email: userInfo.value.email,
    intro: userInfo.value.intro || '',
  };
};

// 保存修改
const handleUpdate = async () => {
  isLoading.value = true;
  try {
    // 更新用户信息
    await userStore.updateUserProfile(form.value);
    notificationStore.success('个人资料修改成功！');
  } catch (error) {
    // 处理敏感词检测失败的情况
    if (error.response?.data?.message) {
      notificationStore.error(error.response.data.message);
    } else {
      notificationStore.error('修改失败，请稍后重试');
    }
  } finally {
    isLoading.value = false;
  }
};

// 处理帖子删除
const handleTweetDeleted = tweetId => {
  // 从本地列表中移除已删除的帖子
  userTweets.value = userTweets.value.filter(tweet => tweet._id !== tweetId);
};

// 显示兴趣选择弹窗
const showInterestPopup = () => {
  // 通过事件总线触发兴趣选择弹窗显示
  if (instance?.proxy?.$emit) {
    instance.proxy.$emit('show-interest-popup');
  }
};

// 处理头像上传
const handleAvatarChange = event => {
  const file = event.target.files[0];
  if (!file) return;

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    notificationStore.error('请选择图片文件');
    return;
  }

  // 检查文件大小（限制为2MB）
  if (file.size > 2 * 1024 * 1024) {
    notificationStore.error('图片大小不能超过2MB');
    return;
  }

  // 读取文件并预览
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      // 更新本地头像预览
      userInfo.value.avatar = e.target.result;

      // 上传头像到服务器
      await userStore.updateAvatar(e.target.result);
      notificationStore.success('头像更新成功！');
    } catch (error) {
      console.error('更新头像失败:', error);
      notificationStore.error('头像更新失败，请稍后重试');
    }
  };
  reader.readAsDataURL(file);
};
</script>

<style scoped>
.user-center-page {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.text-dark {
  color: #e5e7eb;
}

.bg-white {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
