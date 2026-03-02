<template>
  <div class="mt-3 ml-8 space-y-2">
    <div v-for="reply in replies" :key="reply._id" class="flex items-start">
      <NameAvatar :name="reply.username" :size="24" class="mr-2" />
      <div class="bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/10">
        <div class="flex justify-between">
          <span class="font-medium text-xs text-white">{{ reply.username }}</span>
          <span class="text-gray-400 text-xs">{{ formatTime(reply.createdAt) }}</span>
        </div>
        <p class="text-sm mt-1 text-white">
          {{ reply.content }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import NameAvatar from '../common/NameAvatar.vue';

defineProps({
  replies: {
    type: Array,
    default: () => [],
  },
});

const formatTime = time => dayjs(time).format('MM-DD HH:mm');
</script>
