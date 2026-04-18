<template>
  <div class="profile-page min-h-screen bg-[#080d18]">
    <!-- 顶部封面 -->
    <div class="cover-section">
      <div class="cover-bg" :style="{ background: coverGradient }" />
      <div class="cover-content max-w-4xl mx-auto px-4 pt-20 pb-16 relative">
        <!-- 返回按钮 -->
        <button class="back-btn" @click="router.back()">
          <i class="fa fa-arrow-left" /> 返回
        </button>

        <!-- 头像 + 基本信息 -->
        <div class="flex items-end gap-6 -mt-12">
          <div class="avatar-wrapper">
            <NameAvatar :name="userInfo.username || '用户'" :size="96" :src="userInfo.avatar" class="ring-4 ring-[#080d18] rounded-full shadow-xl" />
            <span v-if="userRoleBadge" class="role-badge">{{ userRoleBadge }}</span>
          </div>
          <div class="pb-2 flex-1">
            <h1 class="text-2xl font-bold text-white">{{ userInfo.username || '未知用户' }}</h1>
            <p class="text-gray-400 text-sm mt-0.5">@{{ userInfo.email?.split('@')[0] || userInfo.username }}</p>
            <p v-if="userInfo.bio" class="text-white/70 text-sm mt-2 leading-relaxed max-w-lg">{{ userInfo.bio }}</p>
            <p v-else class="text-white/50 text-sm mt-2 italic">这个人很懒，什么都没写~</p>
            
            <!-- 操作按钮区 -->
            <div class="action-row mt-4 flex gap-3">
              <button
                v-if="!isOwnProfile"
                :class="[followed ? 'followed-btn' : 'follow-btn']"
                @click="handleFollow"
                :disabled="followLoading || !isLoggedIn"
              >
                {{ followed ? '已关注' : '+ 关注' }}
              </button>
              <router-link
                v-if="isOwnProfile"
                to="/user/center"
                class="edit-profile-btn"
              >
                <i class="fa fa-edit mr-1" /> 编辑资料
              </router-link>
              <button class="share-btn" @click="copyProfileLink">
                <i class="fa fa-share-alt" />
              </button>
              <button v-if="!isOwnProfile && isLoggedIn" class="msg-btn" @click="goMessage">
                <i class="fa fa-envelope" />
              </button>
            </div>
          </div>
        </div>

        <!-- 统计数据 -->
        <div class="stats-row mt-8 flex gap-10">
          <div class="stat-item" v-for="s in statsData" :key="s.label" @click="s.onClick">
            <div class="stat-val">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="tab-bar sticky top-[60px] z-30 border-b border-white/5 bg-[#080d18]/95 backdrop-blur-md">
      <div class="max-w-4xl mx-auto px-4 flex gap-8">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-item', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 标签内容 -->
    <div class="max-w-4xl mx-auto px-4 py-6">

      <!-- 帖子列表 -->
      <div v-if="activeTab === 'posts'" class="space-y-0">
        <div v-if="loadingPosts" class="py-20 text-center text-gray-500">
          <i class="fa fa-spinner fa-spin text-2xl mb-3 block" /> 加载中...
        </div>
        <template v-else-if="tweets.length > 0">
          <TweetCard
            v-for="tweet in tweets"
            :key="tweet._id"
            :tweet="tweet"
            @tweet-deleted="onTweetDeleted"
          />
        </template>
        <div v-else class="py-20 text-center text-gray-500">
          <i class="fa fa-file-alt text-4xl opacity-30 mb-3 block" />
          还没有发布帖子
        </div>
      </div>

      <!-- 收藏列表 -->
      <div v-if="activeTab === 'favorites'">
        <div class="py-20 text-center text-gray-500">
          <i class="fa fa-star-o text-4xl opacity-30 mb-3 block" />
          暂无收藏内容
        </div>
      </div>

      <!-- 关于 -->
      <div v-if="activeTab === 'about'" class="about-card p-6 rounded-2xl bg-white/[0.03] border border-white/8">
        <h3 class="font-bold text-white mb-4"><i class="fa fa-info-circle mr-2 text-tech-blue" />个人信息</h3>
        <div class="space-y-3">
          <div class="info-row"><span class="info-label">邮箱</span><span>{{ userInfo.email || '-' }}</span></div>
          <div class="info-row"><span class="info-label">角色</span><span><span class="role-tag">{{ userRoleLabel }}</span></span></div>
          <div class="info-row"><span class="info-label">注册时间</span><span>{{ formatTime(userInfo.createdAt) }}</span></div>
          <div v-if="learningInterests.length" class="info-row">
            <span class="info-label">学习兴趣</span>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in learningInterests" :key="tag" class="interest-tag"># {{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { tweetApi, userApi } from '../../utils/api';
import NameAvatar from '../../components/common/NameAvatar.vue';
import TweetCard from '../../components/business/TweetCard.vue';
import { getTeacherTweets, isTeacherId, TEACHER_DATA } from '../../data/teacherPosts';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const userId = computed(() => route.params.userId);
const activeTab = ref('posts');
const loadingPosts = ref(true);
const followed = ref(false);
const followLoading = ref(false);

// 用户数据
const userInfo = ref({});
const tweets = ref([]);

const tabs = [
  { key: 'posts', label: '帖子', icon: 'fa-file-text-o' },
  { key: 'favorites', label: '收藏', icon: 'fa-star-o' },
  { key: 'about', label: '关于', icon: 'fa-user-o' },
];

// 是否为自己的主页
const isOwnProfile = computed(() => {
  const currentUserId = userStore.userInfo?._id || userStore.userInfo?.id;
  return userId.value && currentUserId && String(userId.value) === String(currentUserId);
});

const isLoggedIn = computed(() => userStore.isLoggedIn);

// 角色徽章
const userRoleBadge = computed(() => {
  const roleMap = { student: '学生', teacher: '导师', parent: '家长', admin: '管理员' };
  const r = userInfo.value.role || userInfo.value.level;
  if (r === '高级' || r === 'teacher') return '🎓 导师';
  if (r) return roleMap[r] || r;
  return null;
});

const userRoleLabel = computed(() => {
  const map = { student: '学生', teacher: '导师', parent: '家长', admin: '管理员' };
  return map[userInfo.value.role] || userInfo.value.role || '学习者';
});

// 封面渐变色
const coverGradient = computed(() => {
  // 导师使用自己的主题色
  if (userInfo.value.accentColor) {
    const c = userInfo.value.accentColor;
    return `linear-gradient(135deg, ${c}cc 0%, ${c}66 50%, ${c}33 100%)`;
  }
  // 普通用户根据userId选择颜色
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  const idx = (userId.value?.length || 0) % gradients.length;
  return gradients[idx];
});

// 统计数据
const statsData = computed(() => {
  // 导师使用更详细的统计
  if (userInfo.value.role === 'teacher' || isTeacherId(userId.value)) {
    const teacherTweets = getTeacherTweets(userId.value);
    return [
      { value: teacherTweets.length || tweets.value.length, label: '帖子', onClick: () => activeTab.value = 'posts' },
      { value: formatNumber(userInfo.value.students || 0), label: '学员', onClick: () => {} },
      { value: `${userInfo.value.experience || 0}年`, label: '经验', onClick: () => {} },
      { value: userInfo.value.coursesList?.length || 0, label: '课程', onClick: () => {} },
    ];
  }
  return [
    { value: tweets.value.length, label: '帖子', onClick: () => activeTab.value = 'posts' },
    { value: socialStats.value.followers || 0, label: '关注者', onClick: () => {} },
    { value: socialStats.value.receivedLikes || 0, label: '获赞数', onClick: () => {} },
    { value: socialStats.value.createdTweets || 0, label: '被收藏', onClick: () => {} },
  ];
});

const socialStats = computed(() => userInfo.value.socialStats || {});

const learningInterests = computed(() => userInfo.value.learningInterests || []);

const formatTime = t => t ? new Date(t).toLocaleDateString('zh-CN') : '-';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const loadUserInfo = async () => {
  try {
    // 1. 优先检查 TEACHER_DATA (硬编码的明星导师数据)
    if (isTeacherId(userId.value)) {
      const t = TEACHER_DATA[userId.value];
      userInfo.value = {
        username: t.name,
        avatar: t.avatar,
        bio: t.bio,
        role: 'teacher',
        email: `${t.name.toLowerCase()}@ai-learnhub.com`,
        skills: t.skills,
        isVIP: t.isVIP,
        students: t.students,
        experience: t.experience,
        coursesList: t.coursesList,
        accentColor: t.accentColor,
        rating: t.rating,
      };
      return;
    }

    // 2. 检查是否为自己的主页
    if (isOwnProfile.value && userStore.userInfo) {
      userInfo.value = { ...userStore.userInfo };
      return;
    }

    // 3. 检查 localStorage (作为备份，比如刚点击过来的导师)
    const storedTeacher = localStorage.getItem('viewing_teacher');
    if (storedTeacher) {
      try {
        const teacherInfo = JSON.parse(storedTeacher);
        // 验证这个存储的导师是否就是我们要看的那个（通过名称或ID推断）
        const slug = teacherInfo.name ? teacherInfo.name.toLowerCase() : '';
        if (userId.value.includes(slug) || String(teacherInfo.id) === userId.value) {
          userInfo.value = {
            username: teacherInfo.name,
            avatar: teacherInfo.avatar,
            bio: teacherInfo.bio,
            role: 'teacher',
            email: `${(teacherInfo.name || 'teacher').toLowerCase()}@ai-learnhub.com`,
            skills: teacherInfo.skills,
            isVIP: teacherInfo.isVIP,
            students: teacherInfo.students,
            experience: teacherInfo.experience,
            coursesList: teacherInfo.coursesList,
            accentColor: teacherInfo.accentColor,
            rating: teacherInfo.rating,
          };
          return;
        }
      } catch (e) {}
    }

    // 4. 最后尝试从 API 获取 (通用用户数据)
    if (userId.value) {
      const res = await userApi.getUserInfo(userId.value);
      userInfo.value = res.data || res;
    }
  } catch (err) {
    console.error('加载用户信息失败:', err);
    // 使用默认数据作为降级
    const nameMap = {
      'student1': { username: '前端开发工程师', bio: '热爱前端技术，专注Vue3生态。分享学习心得，一起成长进步！', role: 'student', learningInterests: ['前端开发', 'Vue3', 'React'] },
      'teacher_zhang': { username: '张老师', bio: '全栈开发工程师，10年+教学经验。专注于Web开发和AI教育，帮助更多人入门编程。', role: 'teacher', learningInterests: ['全栈开发', '架构设计', 'AI教育'] },
      'parent_wang': { username: '王家长', bio: '关注孩子教育，分享家庭教育经验。', role: 'parent', learningInterests: ['家庭教育'] },
    };
    userInfo.value = nameMap[userId.value] || { username: '学习达人' };
  }
};

// 加载用户的帖子
const loadUserTweets = async () => {
  try {
    loadingPosts.value = true;

    // 如果是导师，使用预设的帖子数据（每个导师10条）
    if (isTeacherId(userId.value)) {
      const teacherTweets = getTeacherTweets(userId.value);
      if (teacherTweets.length > 0) {
        tweets.value = teacherTweets;
        return;
      }
    }

    // 尝试从API获取
    const res = await tweetApi.getUserList({ authorId: userId.value });
    tweets.value = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
  } catch {
    // 降级：使用模拟数据
    tweets.value = generateMockTweets();
  } finally {
    loadingPosts.value = false;
  }
};

// 模拟帖子数据（当API不可用时）
const generateMockTweets = () => {
  const name = userInfo.value.username || '学习达人';
  return [
    {
      _id: `mock_${Date.now()}_1`,
      content: `这是${name}分享的第一篇帖子。持续学习，每天进步一点点！\n\n#学习方法 #技术分享`,
      images: [],
      likes: Math.floor(Math.random() * 200),
      comments: [], shares: Math.floor(Math.random() * 30),
      likedBy: [], createdAt: new Date(Date.now() - 3600000).toISOString(),
      user: { _id: userId.value, username: name, avatar: userInfo.value.avatar },
      knowledgePoints: ['坚持每日学习', '做好笔记整理', '多动手实践'],
    },
    {
      _id: `mock_${Date.now()}_2`,
      content: `${name}的深度思考：\n\n在学习过程中，最重要的不是学了多少知识，而是培养了怎样的思维方式。\n\n学会提问比记住答案更重要。遇到问题不要急着找答案，先自己想一想，为什么会出现这个问题？背后的原理是什么？\n\n#深度学习 #思维方法`,
      images: ['https://picsum.photos/seed/mock2/600/400'],
      likes: Math.floor(Math.random() * 300), comments: [], shares: Math.floor(Math.random() * 40),
      likedBy: [], createdAt: new Date(Date.now() - 7200000).toISOString(),
      user: { _id: userId.value, username: name, avatar: userInfo.value.avatar },
      knowledgePoints: ['主动思考', '培养逻辑', '举一反三'],
    },
  ];
};

// 帖子删除回调
const onTweetDeleted = id => {
  tweets.value = tweets.value.filter(t => t._id !== id);
};

// 关注操作
const handleFollow = async () => {
  if (!isLoggedIn.value) {
    router.push(`/login?redirect=${route.fullPath}`);
    return;
  }
  followLoading.value = true;
  followed.value = !followed.value;
  setTimeout(() => followLoading.value = false, 600);
};

// 复制个人主页链接
const copyProfileLink = async () => {
  const link = `${window.location.origin}${route.fullPath}`;
  try {
    await navigator.clipboard.writeText(link);
    alert('链接已复制！');
  } catch {
    alert(link);
  }
};

// 发消息
const goMessage = () => {
  // TODO: 跳转到聊天页面
  alert('私信功能开发中...');
};

onMounted(async () => {
  await Promise.all([loadUserInfo(), loadUserTweets()]);
});

watch(userId, async () => {
  await Promise.all([loadUserInfo(), loadUserTweets()]);
});
</script>

<style scoped>
.cover-section { position: relative; overflow: hidden; }
.cover-bg {
  position: absolute;
  inset: 0;
  height: 220px;
}
.cover-content { position: relative; z-index: 1; }

.back-btn {
  position: absolute;
  top: -24px;
  left: 0;
  padding: 8px 16px;
  color: white;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}
.back-btn:hover { background: rgba(255,255,255,0.25); }

.avatar-wrapper { position: relative; flex-shrink: 0; }
.role-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  padding: 2px 10px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  border: 2px solid #080d18;
}

.action-row .btn-base {
  padding: 7px 22px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  display: inline-flex;
  align-items: center;
}

.follow-btn {
  padding: 7px 22px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}
.follow-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
.followed-btn {
  padding: 7px 22px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: 1px solid rgba(156,163,175,0.35);
  color: #9ca3af;
}
.followed-btn:hover:not(:disabled) { border-color: #ef4444; color: #ef4444; }

.edit-profile-btn {
  padding: 7px 22px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.15);
  color: #e2e8f0;
}
.edit-profile-btn:hover { background: rgba(255,255,255,0.12); }

.share-btn, .msg-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.15);
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.share-btn:hover, .msg-btn:hover { background: rgba(255,255,255,0.12); color: white; }

.stats-row { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; }
.stat-item { text-align: center; cursor: pointer; }
.stat-val { font-size: 22px; font-weight: 800; color: white; }
.stat-label { font-size: 13px; color: #9ca3af; margin-top: 2px; }

/* Tab栏 */
.tab-item {
  padding: 14px 0;
  font-size: 15px;
  font-weight: 500;
  color: #9ca3af;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tab-item.active { color: white !important; border-bottom-color: #3b82f6; }
.tab-item:hover:not(.active) { color: #d1d5db; }

/* About卡片 */
.info-row { display: flex; align-items: flex-start; gap: 16px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
.info-label { color: #9ca3af; min-width: 80px; flex-shrink: 0; }
.role-tag {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(59,130,246,0.15);
  color: #60a5fa;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}
.interest-tag {
  display: inline-block;
  padding: 2px 12px;
  background: rgba(139,92,246,0.12);
  color: #a78bfa;
  border-radius: 14px;
  font-size: 13px;
}
</style>
