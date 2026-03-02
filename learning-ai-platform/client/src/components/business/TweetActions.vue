<template>
  <div class="flex space-x-6">
    <button
      class="flex items-center text-gray-400 hover:text-tech-blue transition-colors"
      title="评论"
      @click="$emit('toggle-comments')"
    >
      <i class="fa fa-comment-o mr-1" /> {{ tweet.comments.length }}
    </button>
    <button
      class="flex items-center transition-colors"
      :class="isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'"
      :disabled="loading.like"
      @click="$emit('like')"
    >
      <i :class="isLiked ? 'fas fa-heart mr-1' : 'far fa-heart mr-1'" /> {{ tweet.likes }}
    </button>
    <button
      class="flex items-center text-gray-400 hover:text-green-400 transition-colors"
      :disabled="loading.share"
      @click="$emit('share')"
    >
      <i class="fa fa-share mr-1" /> {{ tweet.shares }}
    </button>
    <button
      class="flex items-center transition-colors"
      :class="isFavorited ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'"
      :disabled="loading.favorite"
      @click="$emit('favorite')"
    >
      <i :class="isFavorited ? 'fa fa-star mr-1' : 'fa fa-star-o mr-1'" /> 收藏
    </button>
  </div>
</template>

<script setup>
defineProps({
  tweet: {
    type: Object,
    required: true,
  },
  isLiked: {
    type: Boolean,
    default: false,
  },
  isFavorited: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Object,
    default: () => ({}),
  },
});

defineEmits(['toggle-comments', 'like', 'share', 'favorite']);
</script>
