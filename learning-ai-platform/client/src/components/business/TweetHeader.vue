<template>
  <div class="flex items-start mb-3">
    <NameAvatar
      :name="displayName"
      :size="40"
      :src="displayAvatar"
      class="mr-3 cursor-pointer hover:ring-2 hover:ring-tech-blue/50 rounded-full transition-all"
      @click="goToProfile"
    />
    <div class="flex-1 min-w-0">
      <h4
        class="font-medium text-white cursor-pointer hover:text-tech-blue transition-colors truncate"
        @click="goToProfile"
      >
        {{ displayName }}
      </h4>
      <p class="text-gray-400 text-sm truncate">
        @{{ displayHandle }} · {{ formatTime(tweet.createdAt) }}
      </p>
    </div>
    <!-- 关注按钮 -->
    <button
      v-if="showFollowBtn && !isOwnTweet"
      class="follow-btn"
      :class="{ following: isFollowing }"
      :disabled="!isLoggedIn || followLoading"
      @click.stop="handleFollow"
    >
      {{ isFollowing ? '已关注' : '+ 关注' }}
    </button>
    <button
      v-if="showDeleteButton"
      class="text-red-400 hover:text-red-300 transition-colors ml-2"
      title="删除推文"
      @click="$emit('delete')"
    >
      <i class="fa fa-trash-o" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import dayjs from 'dayjs';
import NameAvatar from '../common/NameAvatar.vue';

const props = defineProps({
  tweet: {
    type: Object,
    required: true,
  },
});

defineEmits(['delete']);

const router = useRouter();
const userStore = useUserStore();

// 关注状态
const isFollowing = ref(false);
const followLoading = ref(false);

// 显示名称优先级：user.name > user.username > tweet.username > userId映射 > "学习达人"
const displayName = computed(() => {
  if (props.tweet.user?.name) return props.tweet.user.name;
  if (props.tweet.user?.username) return props.tweet.user.username;
  if (props.tweet.username) return props.tweet.username;
  // userId到名称的映射（示例数据）
  const nameMap = {
    '1': '前端开发工程师',
    '2': '英语学习达人',
    '3': '数据分析师',
    '4': '算法爱好者',
    '5': '全栈开发者',
    '6': 'React工程师',
    '7': 'Java架构师',
    '8': 'AI学习者',
    '9': '产品经理转型',
    '10': 'DevOps工程师',
  };
  return nameMap[props.tweet.userId] || '学习达人';
});

// 头像显示
const displayAvatar = computed(() => {
  if (props.tweet.user?.avatar) return props.tweet.user.avatar;
  if (props.tweet.userAvatar) return props.tweet.userAvatar;
  // 默认头像
  const avatarMap = {
    '1': 'https://picsum.photos/seed/tw1/100/100',
    '2': 'https://picsum.photos/seed/tw2/100/100',
    '3': 'https://picsum.photos/seed/tw3/100/100',
    '4': 'https://picsum.photos/seed/tw4/100/100',
    '5': 'https://picsum.photos/seed/tw5/100/100',
    '6': 'https://picsum.photos/seed/tw6/100/100',
    '7': 'https://picsum.photos/seed/tw7/100/100',
    '8': 'https://picsum.photos/seed/tw8/100/100',
    '9': 'https://picsum.photos/seed/tw9/100/100',
    '10': 'https://picsum.photos/seed/tw10/100/100',
  };
  return avatarMap[props.tweet.userId] || `https://picsum.photos/seed/${props.tweet.userId}/100/100`;
});

const displayHandle = computed(() => {
  if (props.tweet.user?.username) return props.tweet.user.username;
  const handleMap = {
    '1': 'frontend_dev', '2': 'english_master', '3': 'data_guru',
    '4': 'algo_fan', '5': 'fullstack_pro', '6': 'react_expert',
    '7': 'java_arch', '8': 'ai_learner', '9': 'pm_transform',
    '10': 'devops_eng',
  };
  return handleMap[props.tweet.userId] || `user_${props.tweet.userId}`;
});

const showDeleteButton = computed(() => {
  if (!userStore.userInfo?.id || !props.tweet.user?._id) return false;
  const tweetUserId = typeof props.tweet.user._id === 'object' ? props.tweet.user._id.toString() : props.tweet.user._id;
  const currentUserId = typeof userStore.userInfo.id === 'object' ? userStore.userInfo.id.toString() : userStore.userInfo.id;
  return tweetUserId === currentUserId;
});

const showFollowBtn = computed(() => !!userStore.isLoggedIn);
const isLoggedIn = computed(() => userStore.isLoggedIn);
const isOwnTweet = computed(() => showDeleteButton.value);

const formatTime = time => dayjs(time).format('MM-DD HH:mm');

// 跳转到用户主页
const goToProfile = () => {
  const userId = props.tweet.user?._id || props.tweet.userId;
  if (!isLoggedIn.value) {
    userStore.$patch({ loginPrompt: true });
    return;
  }
  router.push(`/profile/${userId}`);
};

// 关注/取消关注
const handleFollow = async () => {
  if (!isLoggedIn.value) {
    userStore.$patch({ loginPrompt: true });
    return;
  }
  try {
    followLoading.value = true;
    isFollowing.value = !isFollowing.value;
    // TODO: 调用关注API
  } catch {
    isFollowing.value = !isFollowing.value;
  } finally {
    followLoading.value = false;
  }
};
</script>

<style scoped>
.follow-btn {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--tech-blue, #3b82f6);
  color: var(--tech-blue, #3b82f6);
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.follow-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.1);
}
.follow-btn.following {
  border-color: rgba(156, 163, 175, 0.4);
  color: #9ca3af;
  background: transparent;
}
.follow-btn.following:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}
.follow-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
