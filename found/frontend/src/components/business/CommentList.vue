<template>
  <div class="space-y-4">
    <div v-for="comment in comments" :key="comment._id" class="ml-11">
      <CommentItem
        :comment="comment"
        @like="$emit('like-comment', comment)"
        @add-reply="$emit('add-reply', { comment, content: $event })"
      />
    </div>
  </div>
</template>

<script setup>
import CommentItem from './CommentItem.vue';

defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['like-comment', 'add-reply']);
</script>
