<template>
  <div class="flex items-start mb-3">
    <NameAvatar
      :name="tweet.user?.name || tweet.user?.username || '未知用户'"
      :size="40"
      class="mr-3"
    />
    <div class="flex-1">
      <h4 class="font-medium text-white">
        {{ tweet.user?.name || '未知用户' }}
      </h4>
      <p class="text-gray-400 text-sm">
        @{{ tweet.user?.username || 'unknown' }} · {{ formatTime(tweet.createdAt) }}
      </p>
    </div>
    <button
      v-if="showDeleteButton"
      class="text-red-400 hover:text-red-300 transition-colors"
      title="删除推文"
      @click="$emit('delete')"
    >
      <i class="fa fa-trash-o" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
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

const userStore = useUserStore();

const showDeleteButton = computed(() => {
  if (!userStore.userInfo?.id || !props.tweet.user?._id) {
    return false;
  }

  const tweetUserId =
    typeof props.tweet.user._id === 'object'
      ? props.tweet.user._id.toString()
      : props.tweet.user._id;
  const currentUserId =
    typeof userStore.userInfo.id === 'object'
      ? userStore.userInfo.id.toString()
      : userStore.userInfo.id;

  return tweetUserId === currentUserId;
});

const formatTime = time => dayjs(time).format('MM-DD HH:mm');
</script>
