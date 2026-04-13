<template>
  <div class="flex mb-4">
    <NameAvatar :name="userName" :size="32" class="mr-3" />
    <div class="flex-1">
      <input
        v-model="newComment"
        placeholder="写下你的评论..."
        class="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-blue/50 focus:border-tech-blue/50 transition-all"
        :disabled="loading"
        @keyup.enter="handleAddComment"
      />
    </div>
    <button
      class="ml-2 text-tech-blue font-medium hover:text-tech-blue/80 transition-colors"
      :disabled="!newComment.trim() || loading"
      @click="handleAddComment"
    >
      发送
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NameAvatar from '../common/NameAvatar.vue';

defineProps({
  userName: {
    type: String,
    default: '用户',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add-comment']);

const newComment = ref('');

const handleAddComment = () => {
  if (!newComment.value.trim()) return;
  emit('add-comment', newComment.value.trim());
  newComment.value = '';
};
</script>
