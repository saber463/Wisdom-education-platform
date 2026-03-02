<template>
  <div ref="tweetCardRef" class="border-b border-white/10 pb-4 mb-4">
    <TweetHeader :tweet="tweet" @delete="handleDelete" />

    <TweetContent :tweet="tweet" />

    <TweetActions
      :tweet="tweet"
      :is-liked="isLiked"
      :is-favorited="isFavorited"
      :loading="loading"
      @toggle-comments="showComments = !showComments"
      @like="handleLike"
      @share="handleShare"
      @favorite="handleFavorite"
    />

    <TweetComments
      v-if="showComments"
      :show-comments="showComments"
      :tweet="tweet"
      :user-name="userStore.userInfo?.name || '用户'"
      :loading="loading"
      @add-comment="handleAddComment"
      @like-comment="handleLikeComment"
      @add-reply="handleAddReply"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { tweetApi, favoriteApi, notificationApi } from '../../utils/api';
import { useUserStore } from '@/store/user';
import { useNotificationStore } from '@/store/notification';
import TweetHeader from './TweetHeader.vue';
import TweetContent from './TweetContent.vue';
import TweetActions from './TweetActions.vue';
import TweetComments from './TweetComments.vue';

const props = defineProps({ tweet: { type: Object, required: true } });
const emit = defineEmits(['tweetDeleted']);
const userStore = useUserStore();
const notificationStore = useNotificationStore();

const tweet = ref({
  ...props.tweet,
  comments: Array.isArray(props.tweet.comments) ? props.tweet.comments : [],
  shares: typeof props.tweet.shares === 'number' ? props.tweet.shares : 0,
  likes: typeof props.tweet.likes === 'number' ? props.tweet.likes : 0,
  likedBy: Array.isArray(props.tweet.likedBy) ? props.tweet.likedBy : [],
});

watch(
  () => props.tweet,
  newTweet => {
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
  },
  { deep: true }
);

const isLiked = ref(false);
const isFavorited = ref(false);
const showComments = ref(false);
const tweetCardRef = ref(null);

const loading = ref({
  like: false,
  comment: false,
  reply: false,
  favorite: false,
  delete: false,
  share: false,
});

onMounted(async () => {
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

  checkLikeStatus();
  checkCommentLikeStatus();

  document.addEventListener('click', handleClickOutside);
});

const handleClickOutside = event => {
  if (showComments.value && tweetCardRef.value && !tweetCardRef.value.contains(event.target)) {
    const isCommentButton =
      event.target.closest('button[title="评论"]') || event.target.closest('.fa-comment-o');
    if (!isCommentButton) {
      showComments.value = false;
    }
  }
};

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const checkCommentLikeStatus = () => {
  if (userStore.userInfo && Array.isArray(tweet.value.comments)) {
    const currentUserId = userStore.userInfo.id;
    const currentIdStr =
      typeof currentUserId === 'object' ? currentUserId.toString() : currentUserId;

    tweet.value.comments = tweet.value.comments.map(comment => ({
      ...comment,
      isLiked: Array.isArray(comment.likedBy)
        ? comment.likedBy.some(likedUserId => {
            const userIdStr =
              typeof likedUserId === 'object' ? likedUserId.toString() : likedUserId;
            return userIdStr === currentIdStr;
          })
        : false,
    }));
  }
};

watch(
  () => tweet.value,
  newTweet => {
    if (newTweet && newTweet._id) {
      checkFavorite();
    }
  },
  { deep: true }
);

const checkLikeStatus = () => {
  if (userStore.userInfo && tweet.value.likedBy && Array.isArray(tweet.value.likedBy)) {
    const currentUserId = userStore.userInfo.id;
    isLiked.value = tweet.value.likedBy.some(likedUserId => {
      const userIdStr = typeof likedUserId === 'object' ? likedUserId.toString() : likedUserId;
      const currentIdStr =
        typeof currentUserId === 'object' ? currentUserId.toString() : currentUserId;
      return userIdStr === currentIdStr;
    });
  } else {
    isLiked.value = false;
  }
};

const handleLike = async () => {
  if (loading.value.like) return;

  try {
    loading.value.like = true;
    isLiked.value = !isLiked.value;

    if (isLiked.value) {
      tweet.value.likes += 1;
    } else {
      tweet.value.likes = Math.max(0, tweet.value.likes - 1);
    }

    await tweetApi.like(tweet.value._id, isLiked.value);

    if (!tweet.value.likedBy) {
      tweet.value.likedBy = [];
    }
    const currentUserId = userStore.userInfo.id;
    const currentIdStr =
      typeof currentUserId === 'object' ? currentUserId.toString() : currentUserId;

    if (isLiked.value) {
      tweet.value.likedBy.push(currentUserId);
    } else {
      tweet.value.likedBy = tweet.value.likedBy.filter(id => {
        const idStr = typeof id === 'object' ? id.toString() : id;
        return idStr !== currentIdStr;
      });
    }

    notificationStore.success(isLiked.value ? '点赞成功' : '取消点赞成功');
  } catch {
    isLiked.value = !isLiked.value;

    if (isLiked.value) {
      tweet.value.likes += 1;
    } else {
      tweet.value.likes = Math.max(0, tweet.value.likes - 1);
    }

    notificationStore.error('点赞失败，请稍后重试');
  } finally {
    loading.value.like = false;
  }
};

const handleAddComment = async content => {
  if (loading.value.comment) return;

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

      if (!Array.isArray(tweet.value.comments)) {
        tweet.value.comments = [];
      }
      tweet.value.comments.push(newCommentItem);

      notificationStore.success('评论成功！');

      setTimeout(() => {
        notificationStore.info('请刷新页面查看最新评论');
      }, 1500);

      const commentInput = tweetCardRef.value?.querySelector(
        'input[placeholder="写下你的评论..."]'
      );
      if (commentInput) {
        commentInput.blur();
      }

      const currentUserId = userStore.userInfo?.id;
      const tweetAuthorId = tweet.value.user?._id;

      const currentIdStr =
        typeof currentUserId === 'object' ? currentUserId.toString() : currentUserId;
      const authorIdStr =
        typeof tweetAuthorId === 'object' ? tweetAuthorId.toString() : tweetAuthorId;

      if (currentIdStr && authorIdStr && currentIdStr !== authorIdStr) {
        await notificationApi.add({
          title: '评论通知',
          content: `${userStore.userInfo?.username} 评论了你的帖子: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`,
          type: 'comment',
          link: `/tweets/${tweet.value._id}`,
          recipientId: tweetAuthorId,
        });
      }
    } else {
      notificationStore.error('评论失败，请稍后重试');
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '评论失败，请稍后重试';
    notificationStore.error(errorMsg);
  } finally {
    loading.value.comment = false;
  }
};

const handleAddReply = async ({ comment, content }) => {
  if (!content.trim() || comment.loading) return;

  try {
    comment.loading = true;

    const res = await tweetApi.reply(tweet.value._id, comment._id, { content });

    const newReply = res.data.reply;
    const localComment = tweet.value.comments.find(c => c._id === comment._id);
    if (localComment) {
      if (!localComment.replies) {
        localComment.replies = [];
      }
      localComment.replies.push(newReply);
    }
    notificationStore.success('回复成功');
  } catch (error) {
    const errorMsg = error.response?.data?.message || '回复失败，请稍后重试';
    notificationStore.error(errorMsg);
  } finally {
    const localComment = tweet.value.comments.find(c => c._id === comment._id);
    if (localComment) {
      localComment.loading = false;
    }
  }
};

const handleLikeComment = async comment => {
  if (comment.loading) return;

  try {
    const localComment = tweet.value.comments.find(c => c._id === comment._id);
    if (!localComment) return;

    localComment.loading = true;
    const wasLiked = localComment.isLiked;
    localComment.isLiked = !wasLiked;
    localComment.commentLikes += localComment.isLiked ? 1 : -1;

    localComment.commentLikes = Math.max(0, localComment.commentLikes);

    await tweetApi.likeComment(tweet.value._id, comment._id, { liked: localComment.isLiked });
    notificationStore.success(localComment.isLiked ? '点赞评论成功' : '取消点赞评论成功');
  } catch {
    const localComment = tweet.value.comments.find(c => c._id === comment._id);
    if (localComment) {
      localComment.isLiked = !localComment.isLiked;
      localComment.commentLikes = Math.max(
        0,
        localComment.commentLikes + (localComment.isLiked ? 1 : -1)
      );
    }
    notificationStore.error('点赞失败，请稍后重试');
  } finally {
    const localComment = tweet.value.comments.find(c => c._id === comment._id);
    if (localComment) {
      localComment.loading = false;
    }
  }
};

const handleShare = async () => {
  if (loading.value.share) return;

  try {
    loading.value.share = true;
    tweet.value.shares += 1;

    await tweetApi.share(tweet.value._id);

    let copySuccess = false;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/tweets/${tweet.value._id}`);
      copySuccess = true;
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = `${window.location.origin}/tweets/${tweet.value._id}`;
        document.body.appendChild(textArea);
        textArea.select();
        copySuccess = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (fallbackError) {
        console.error('Clipboard fallback failed:', fallbackError);
      }
    }

    if (copySuccess) {
      notificationStore.success('分享成功！链接已复制到剪贴板');
    } else {
      notificationStore.success('分享成功！请手动复制链接');
      alert(`分享链接：${window.location.origin}/tweets/${tweet.value._id}`);
    }
  } catch {
    tweet.value.shares -= 1;
    notificationStore.error('分享失败，请稍后重试');
  } finally {
    loading.value.share = false;
  }
};

const checkFavorite = async () => {
  try {
    if (!tweet.value || !tweet.value._id) {
      return;
    }
    isFavorited.value = false;
  } catch {
    isFavorited.value = false;
  }
};

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
      notificationStore.success('收藏成功');
    }
  } catch {
    notificationStore.error('操作失败，请稍后重试');
  } finally {
    loading.value.favorite = false;
  }
};

const handleDelete = async () => {
  if (!confirm('确定要删除这条推文吗？')) return;
  if (loading.value.delete) return;

  try {
    loading.value.delete = true;
    await tweetApi.delete(tweet.value._id);
    emit('tweetDeleted', tweet.value._id);
    notificationStore.success('推文删除成功');
  } catch {
    notificationStore.error('删除推文失败，请稍后重试');
  } finally {
    loading.value.delete = false;
  }
};
</script>
