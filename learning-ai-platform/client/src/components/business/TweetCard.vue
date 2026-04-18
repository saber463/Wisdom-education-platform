<template>
  <div ref="tweetCardRef" class="border-b border-white/10 pb-4 mb-4">
    <!-- 帖子头部（用户信息） -->
    <TweetHeader :tweet="tweet" @delete="handleDelete" />

    <!-- 帖子内容增强版 -->
    <TweetContent :tweet="tweet" :show-full-content="showFullContent" @toggle-detail="showFullContent = !showFullContent" />

    <!-- 操作栏 - 添加登录权限控制提示 -->
    <TweetActions
      :tweet="tweet"
      :is-liked="isLiked"
      :is-favorited="isFavorited"
      :loading="loading"
      :is-logged-in="isLoggedIn"
      @toggle-comments="handleToggleComments"
      @like="requireLogin(handleLike, '请先登录后点赞')"
      @share="handleShare"
      @favorite="requireLogin(handleFavorite, '请先登录后收藏')"
      @follow="handleFollowAuthor"
    />

    <!-- 评论区域 - 登录检查 -->
    <Transition name="comment-slide">
      <div v-if="showComments" class="mt-4 pt-4 border-t border-white/10">
        <!-- 未登录：显示提示 + 登录按钮 -->
        <div v-if="!isLoggedIn" class="text-center py-6">
          <p class="text-gray-400 mb-3">
            <i class="fa fa-lock mr-2 opacity-60" />登录后即可评论、点赞和分享
          </p>
          <router-link
            to="/login"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-tech-blue to-tech-purple text-white font-medium hover:shadow-lg hover:shadow-tech-blue/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <i class="fa fa-sign-in-alt" /> 立即登录
          </router-link>
        </div>

        <!-- 已登录：评论组件 -->
        <template v-else>
          <CommentForm
            :user-name="userStore.userInfo?.username || userStore.userInfo?.name || '用户'"
            :loading="loading.comment"
            @add-comment="handleAddComment"
          />
          <CommentList
            v-if="tweet.comments && tweet.comments.length"
            :comments="tweet.comments"
            :is-logged-in="isLoggedIn"
            @like-comment="$emit('like-comment', $event)"
            @add-reply="$emit('add-reply', $event)"
          />
          <div v-else class="text-center py-4 text-gray-400 text-sm">暂无评论，快来抢沙发吧！</div>
        </template>
      </div>
    </Transition>

    <!-- 分享弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showShareModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" style="background: rgba(0,0,0,0.65); backdrop-filter: blur(8px);" @click.self="showShareModal = false">
          <div class="w-full max-w-md rounded-2xl p-6 shadow-2xl" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.08);">
            <h3 class="text-lg font-bold text-white mb-4 text-center">
              <i class="fa fa-share-alt mr-2 text-tech-blue" />分享帖子
            </h3>
            <div class="flex gap-2 mb-3">
              <input
                ref="shareInput"
                :value="shareLink"
                readonly
                class="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-tech-blue/50"
                style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff;"
                @click="$event.target.select()"
              />
              <button
                class="px-5 py-3 rounded-xl font-semibold text-sm text-white whitespace-nowrap transition-all hover:-translate-y-0.5 active:translate-y-0"
                :class="copied ? 'bg-green-500' : 'bg-gradient-to-r from-tech-blue to-tech-purple'"
                @click="copyShareLink"
              >
                {{ copied ? '✓ 已复制' : '复制链接' }}
              </button>
            </div>
            <p class="text-xs text-gray-500 text-center mb-4">复制此链接分享给其他用户</p>
            <button
              class="w-full py-2.5 rounded-xl text-gray-400 text-sm border border-white/10 hover:bg-white/5 hover:text-white transition-all"
              @click="showShareModal = false"
            >关闭</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { tweetApi, favoriteApi, notificationApi } from '../../utils/api';
import { useUserStore } from '@/store/user';
import { useNotificationStore } from '@/store/notification';
import TweetHeader from './TweetHeader.vue';
import TweetContent from './TweetContent.vue';
import TweetActions from './TweetActions.vue';
import CommentForm from './CommentForm.vue';
import CommentList from './CommentList.vue';

const props = defineProps({ tweet: { type: Object, required: true } });
const emit = defineEmits(['tweetDeleted']);
const router = useRouter();
const userStore = useUserStore();
const notificationStore = useNotificationStore();

const showFullContent = ref(false);
const showShareModal = ref(false);
const copied = ref(false);
const shareInput = ref(null);

// 核心数据
const tweet = ref({
  ...props.tweet,
  comments: Array.isArray(props.tweet.comments) ? props.tweet.comments : [],
  shares: typeof props.tweet.shares === 'number' ? props.tweet.shares : 0,
  likes: typeof props.tweet.likes === 'number' ? props.tweet.likes : 0,
  likedBy: Array.isArray(props.tweet.likedBy) ? props.tweet.likedBy : [],
});

watch(() => props.tweet, newTweet => {
  if (newTweet) {
    tweet.value = {
      ...newTweet,
      comments: Array.isArray(newTweet.comments) ? newTweet.comments : [],
      shares: typeof newTweet.shares === 'number' ? newTweet.shares : 0,
      likes: typeof newTweet.likes === 'number' ? newTweet.likes : 0,
      likedBy: Array.isArray(newTweet.likedBy) ? newTweet.likedBy : [],
    };
    checkLikeStatus();
    checkCommentLikeStatus();
  }
}, { deep: true });

const isLiked = ref(false);
const isFavorited = ref(false);
const showComments = ref(false);
const tweetCardRef = ref(null);

const loading = ref({
  like: false, comment: false, reply: false,
  favorite: false, delete: false, share: false,
});

// 是否已登录
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 分享链接
const shareLink = computed(() =>
  `${window.location.origin}/tweets/${tweet.value._id || tweet.value.id}`
);

onMounted(async () => {
  // 初始化评论数据结构
  if (Array.isArray(tweet.value.comments)) {
    tweet.value.comments = tweet.value.comments.map(comment => ({
      ...comment,
      showReplyForm: false,
      replyContent: '',
      isLiked: false,
      loading: false,
      replies: Array.isArray(comment.replies) ? comment.replies : [],
    }));
  }
  // 尝试从 localStorage 加载持久化的评论
  loadPersistedComments();
  checkLikeStatus();
  checkCommentLikeStatus();
  document.addEventListener('click', handleClickOutside);
});

const handleClickOutside = event => {
  if (showComments.value && tweetCardRef.value && !tweetCardRef.value.contains(event.target)) {
    const isCommentButton = event.target.closest('button[title="评论"]') ||
      event.target.closest('.fa-comment-o');
    if (!isCommentButton) showComments.value = false;
  }
};

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// ==================== 权限控制 ====================

/** 未登录时弹出提示并跳转 */
const requireLogin = (actionFn, message) => {
  return (...args) => {
    if (!userStore.isLoggedIn) {
      notificationStore.warning(message || '请先登录');
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
      return;
    }
    actionFn(...args);
  };
};

// ==================== 点赞状态检测 ====================

const checkCommentLikeStatus = () => {
  if (!userStore.userInfo || !Array.isArray(tweet.value.comments)) return;
  const currentUserId = userStore.userInfo.id;
  const currentIdStr = typeof currentUserId === 'object' ? currentUserId.toString() : currentUserId;

  tweet.value.comments = tweet.value.comments.map(comment => ({
    ...comment,
    isLiked: Array.isArray(comment.likedBy)
      ? comment.likedBy.some(id => {
          const s = typeof id === 'object' ? id.toString() : id;
          return s === currentIdStr;
        })
      : false,
  }));
};

const checkLikeStatus = () => {
  if (!userStore.userInfo?.id || !Array.isArray(tweet.value.likedBy)) {
    isLiked.value = false;
    return;
  }

  const currentUserId = userStore.userInfo.id;
  const currentIdStr = typeof currentUserId === 'object'
    ? currentUserId.toString() : currentUserId;

  isLiked.value = tweet.value.likedBy.some(id => {
    const s = typeof id === 'object' ? id.toString() : id;
    return s === currentIdStr;
  });
};

// ==================== 评论切换 ====================

const handleToggleComments = () => {
  if (!isLoggedIn.value) {
    requireLogin(() => {}, '请先登录后查看评论')();
    return;
  }
  showComments.value = !showComments.value;
};

// ==================== 点赞 ====================

const handleLike = async () => {
  if (loading.value.like || !isLoggedIn.value) return;

  try {
    loading.value.like = true;
    isLiked.value = !isLiked.value;
    tweet.value.likes += isLiked.value ? 1 : -1;
    tweet.value.likes = Math.max(0, tweet.value.likes);

    await tweetApi.like(tweet.value._id, isLiked.value);

    // 更新 likedBy 数组
    if (!tweet.value.likedBy) tweet.value.likedBy = [];
    const currentUserId = userStore.userInfo.id;
    const currentIdStr = typeof currentUserId === 'object'
      ? currentUserId.toString() : currentUserId;

    if (isLiked.value) {
      tweet.value.likedBy.push(currentUserId);
    } else {
      tweet.value.likedBy = tweet.value.likedBy.filter(id =>
        (typeof id === 'object' ? id.toString() : id) !== currentIdStr
      );
    }

    notificationStore.success(isLiked.value ? '❤️ 点赞成功' : '已取消点赞');
  } catch {
    isLiked.value = !isLiked.value;
    tweet.value.likes += isLiked.value ? 1 : -1;
    tweet.value.likes = Math.max(0, tweet.value.likes);
    notificationStore.error('点赞失败，请稍后重试');
  } finally {
    loading.value.like = false;
  }
};

// ==================== 发表评论（核心修复：即时显示+持久化）====================

const handleAddComment = async content => {
  if (loading.value.comment || !content.trim()) return;

  try {
    loading.value.comment = true;
    const res = await tweetApi.comment(tweet.value._id, { content });

    if (res?.data) {
      const newCommentItem = {
        ...res.data,
        showReplyForm: false,
        replyContent: '',
        isLiked: false,
        loading: false,
        replies: Array.isArray(res.data.replies) ? res.data.replies : [],
      };

      if (!Array.isArray(tweet.value.comments)) tweet.value.comments = [];

      // ★ 关键：立即推入列表实现即时显示
      tweet.value.comments.unshift(newCommentItem);

      // ★ 关键：持久化到 localStorage 实现刷新不丢失
      persistComments();

      notificationStore.success('💬 评论已发布！');
    } else {
      notificationStore.error('评论失败，请稍后重试');
    }

    // 发送通知给帖子作者（静默失败）
    sendNotification(content);
  } catch (error) {
    const msg = error.response?.data?.message || error.message || '评论失败';
    notificationStore.error(msg);
  } finally {
    loading.value.comment = false;
  }
};

/** 持久化评论到 localStorage */
const persistComments = () => {
  try {
    const STORAGE_KEY = `tc_${tweet.value._id || tweet.value.id}`;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data: tweet.value.comments,
      ts: Date.now(),
    }));
  } catch { /* 静默处理 */ }
};

/** 从 localStorage 恢复评论 */
const loadPersistedComments = () => {
  try {
    const STORAGE_KEY = `tc_${tweet.value._id || tweet.value.id}`;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.data && Array.isArray(parsed.data)) {
        // 合并本地缓存与服务器数据（以本地最新为准）
        tweet.value.comments = parsed.data.map(c => ({
          ...c,
          showReplyForm: false,
          replyContent: '',
          isLiked: c.isLiked || false,
          loading: false,
          replies: Array.isArray(c.replies) ? c.replies : [],
        }));
      }
    }
  } catch { /* 静默处理 */ }
};

const sendNotification = async (content) => {
  try {
    const currentUserId = userStore.userInfo?.id;
    const authorId = tweet.value.user?._id;
    const uid = typeof currentUserId === 'object' ? currentUserId.toString() : currentUserId;
    const aid = typeof authorId === 'object' ? authorId.toString() : authorId;
    if (uid && aid && uid !== aid) {
      await notificationApi.add({
        title: '新评论通知',
        content: `${userStore.userInfo?.username || '用户'} 评论了你的帖子`,
        type: 'comment',
        link: `/tweets/${tweet.value._id}`,
        recipientId: aid,
      });
    }
  } catch { /* 静默 */ }
};

// ==================== 回复 ====================

const handleAddReply = async ({ comment, content }) => {
  if (!content.trim() || comment.loading) return;

  try {
    comment.loading = true;
    const res = await tweetApi.reply(tweet.value._id, comment._id, { content });
    const newReply = res.data.reply;
    const localComment = tweet.value.comments.find(c => c._id === comment._id);
    if (localComment) {
      if (!localComment.replies) localComment.replies = [];
      localComment.replies.push(newReply);
      persistComments(); // 同步持久化
    }
    notificationStore.success('✉️ 回复成功');
  } catch (error) {
    notificationStore.error(error.response?.data?.message || '回复失败');
  } finally {
    const lc = tweet.value.comments.find(c => c._id === comment._id);
    if (lc) lc.loading = false;
  }
};

// ==================== 点赞评论 ====================

const handleLikeComment = async comment => {
  if (comment.loading) return;

  try {
    const lc = tweet.value.comments.find(c => c._id === comment._id);
    if (!lc) return;

    lc.loading = true;
    const wasLiked = lc.isLiked;
    lc.isLiked = !wasLiked;
    lc.commentLikes += lc.isLiked ? 1 : -1;
    lc.commentLikes = Math.max(0, lc.commentLikes);

    await tweetApi.likeComment(tweet.value._id, comment._id, { liked: lc.isLiked });
    notificationStore.success(lc.isLiked ? '👍 已点赞' : '取消点赞');
  } catch {
    const lc = tweet.value.comments.find(c => c._id === comment._id);
    if (lc) {
      lc.isLiked = !lc.isLiked;
      lc.commentLikes = Math.max(0, lc.commentLikes + (lc.isLiked ? 1 : -1));
    }
    notificationStore.error('操作失败');
  } finally {
    const lc = tweet.value.comments.find(c => c._id === comment._id);
    if (lc) lc.loading = false;
  }
};

// ==================== 分享功能 ====================

const handleShare = async () => {
  // ★ 分享不需要登录——任何人都可以复制链接
  showShareModal.value = true;

  setTimeout(() => {
    if (shareInput.value) shareInput.value.select();
  }, 100);

  // 同时增加分享计数（仅计数，不限制权限）
  try {
    loading.value.share = true;
    tweet.value.shares += 1;
    await tweetApi.share(tweet.value._id);
  } catch {
    tweet.value.shares = Math.max(0, tweet.value.shares - 1);
  } finally {
    loading.value.share = false;
  }
};

const copyShareLink = async () => {
  let ok = false;
  try {
    await navigator.clipboard.writeText(shareLink.value);
    ok = true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = shareLink.value;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    ok = document.execCommand('copy');
    document.body.removeChild(ta);
  }

  if (ok) {
    copied.value = true;
    notificationStore.success('✅ 链接已复制到剪贴板！');
    setTimeout(() => { showShareModal.value = false; copied.value = false; }, 1500);
  } else {
    alert(`请手动复制链接：\n${shareLink.value}`);
  }
};

// ==================== 收藏 ====================

const handleFavorite = async () => {
  if (loading.value.favorite || !tweet.value._id) return;

  try {
    loading.value.favorite = true;
    if (isFavorited.value) {
      await favoriteApi.remove(tweet.value._id, 'Tweet');
      isFavorited.value = false;
      notificationStore.success('已取消收藏');
    } else {
      await favoriteApi.add(tweet.value._id, 'Tweet');
      isFavorited.value = true;
      notificationStore.success('⭐ 收藏成功 ✨');
    }
  } catch {
    notificationStore.error('操作失败，请重试');
  } finally {
    loading.value.favorite = false;
  }
};

// ==================== 关注作者 ====================

const handleFollowAuthor = () => {
  if (!isLoggedIn.value) {
    requireLogin(() => {}, '请先登录关注作者')();
    return;
  }
  notificationStore.success(`🔔 正在关注 ${props.tweet.username || '该用户'}...`);
};

// ==================== 删除 ====================

const handleDelete = async () => {
  if (!confirm('确定删除这条帖子吗？')) return;
  if (loading.value.delete) return;
  try {
    loading.value.delete = true;
    await tweetApi.delete(tweet.value._id);
    emit('tweetDeleted', tweet.value._id);
    notificationStore.success('帖子已删除');
  } catch {
    notificationStore.error('删除失败');
  } finally {
    loading.value.delete = false;
  }
};
</script>

<style scoped>
/* 评论区域过渡 */
.comment-slide-enter-active { transition: all 0.25s ease-out; }
.comment-slide-leave-active { transition: all 0.2s ease-in; }
.comment-slide-enter-from { opacity: 0; transform: translateY(-12px); }
.comment-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* 弹窗淡入 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
