<template>
  <div v-if="showComments" class="mt-4 border-t border-white/10 pt-4">
    <CommentForm
      :user-name="userName"
      :loading="loading.comment"
      @add-comment="$emit('add-comment', $event)"
    />

    <CommentList
      v-if="tweet.comments && tweet.comments.length"
      :comments="tweet.comments"
      @like-comment="$emit('like-comment', $event)"
      @add-reply="$emit('add-reply', $event)"
    />

    <div v-else class="text-center py-4 text-gray-400">暂无评论，快来抢沙发吧！</div>
  </div>
</template>

<script setup>
import CommentForm from './CommentForm.vue';
import CommentList from './CommentList.vue';

defineProps({
  showComments: {
    type: Boolean,
    default: false,
  },
  tweet: {
    type: Object,
    required: true,
  },
  userName: {
    type: String,
    default: '用户',
  },
  loading: {
    type: Object,
    default: () => ({}),
  },
});

defineEmits(['add-comment', 'like-comment', 'add-reply']);
</script>
