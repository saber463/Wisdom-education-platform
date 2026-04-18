<template>
  <div class="flex space-x-5 py-1">
    <!-- 评论按钮 -->
    <button
      class="action-btn"
      :class="{ 'action-btn--disabled': !isLoggedIn }"
      :title="isLoggedIn ? '评论' : '登录后可评论'"
      @click="$emit('toggle-comments')"
    >
      <i class="fa fa-comment-o" /> <span>{{ tweet.comments.length }}</span>
    </button>

    <!-- 点赞按钮 -->
    <button
      class="action-btn"
      :class="[isLiked ? 'text-red-400' : '', { 'action-btn--disabled': !isLoggedIn }]"
      :disabled="loading.like || !isLoggedIn"
      :title="isLoggedIn ? (isLiked ? '取消点赞' : '点赞') : '登录后可点赞'"
      @click="$emit('like')"
    >
      <i :class="isLiked ? 'fas fa-heart' : 'far fa-heart'" />
      <span>{{ tweet.likes }}</span>
    </button>

    <!-- 分享按钮 - ★ 不需要登录 -->
    <button
      class="action-btn text-green-400/80 hover:text-green-300"
      :disabled="loading.share"
      title="分享链接（复制给朋友）"
      @click="$emit('share')"
    >
      <i class="fa fa-share" /> <span>{{ tweet.shares }}</span>
    </button>

    <!-- 收藏按钮 -->
    <button
      class="action-btn"
      :class="[isFavorited ? 'text-yellow-400' : '', { 'action-btn--disabled': !isLoggedIn }]"
      :disabled="loading.favorite || !isLoggedIn"
      :title="isLoggedIn ? (isFavorited ? '取消收藏' : '收藏') : '登录后可收藏'"
      @click="$emit('favorite')"
    >
      <i :class="isFavorited ? 'fa fa-star' : 'fa fa-star-o'" />
      <span>收藏</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tweet: { type: Object, required: true },
  isLiked: { type: Boolean, default: false },
  isFavorited: { type: Boolean, default: false },
  loading: { type: Object, default: () => ({}) },
  isLoggedIn: { type: Boolean, default: true },
});
defineEmits(['toggle-comments', 'like', 'share', 'favorite']);
</script>

<style scoped>
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 14px;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.action-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.06);
  transform: translateY(-1px);
}
.action-btn:active:not(:disabled) {
  transform: translateY(0);
}
.action-btn--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.action-btn--disabled:hover {
  background: transparent;
  transform: none;
}
</style>
