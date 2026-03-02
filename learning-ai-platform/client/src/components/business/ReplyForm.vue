<template>
  <div class="mt-3 flex">
    <img :src="getDefaultAvatar('current')" class="w-6 h-6 rounded-full mr-2" />
    <input
      v-model="replyContent"
      :placeholder="`回复 @${comment.username}...`"
      class="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-blue/50 focus:border-tech-blue/50 transition-all"
      :disabled="comment.loading"
      @keyup.enter="handleAddReply"
    />
    <button
      class="ml-2 text-tech-blue text-sm hover:text-tech-blue/80 transition-colors"
      :disabled="!replyContent.trim() || comment.loading"
      @click="handleAddReply"
    >
      发送
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  comment: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['add-reply', 'clear-reply']);

const replyContent = ref('');

const getDefaultAvatar = name => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};

const handleAddReply = () => {
  if (!replyContent.value.trim()) return;
  emit('add-reply', replyContent.value.trim());
  emit('clear-reply');
  replyContent.value = '';
};
</script>
