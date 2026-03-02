<template>
  <div class="flex items-start">
    <NameAvatar :name="localComment.username" :size="32" class="mr-3" />
    <div class="bg-white/5 backdrop-blur-sm rounded-lg p-3 flex-1 border border-white/10">
      <div class="flex justify-between items-start">
        <div>
          <span class="font-medium text-white">{{ localComment.username }}</span>
          <span class="text-gray-400 text-xs ml-2">{{ formatTime(localComment.createdAt) }}</span>
        </div>
        <button
          class="text-gray-400 hover:text-red-400 transition-colors"
          :disabled="localComment.loading"
          @click="$emit('like')"
        >
          <i :class="localComment.isLiked ? 'fa fa-heart' : 'fa fa-heart-o'" />
          <span class="ml-1 text-xs">{{ localComment.commentLikes }}</span>
        </button>
      </div>
      <p class="mt-1 text-white">
        {{ localComment.content }}
      </p>
      <button class="text-sm text-tech-blue mt-1 hover:text-tech-blue/80 transition-colors" @click="$emit('toggle-reply')">回复</button>

      <ReplyForm
        v-if="localComment.showReplyForm"
        :comment="localComment"
        @add-reply="$emit('add-reply', $event)"
        @clear-reply="
          localComment.replyContent = '';
          localComment.showReplyForm = false;
        "
      />

      <ReplyList
        v-if="localComment.replies && localComment.replies.length"
        :replies="localComment.replies"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import dayjs from 'dayjs';
import NameAvatar from '../common/NameAvatar.vue';
import ReplyForm from './ReplyForm.vue';
import ReplyList from './ReplyList.vue';

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});

defineEmits(['like', 'add-reply', 'toggle-reply']);

const localComment = ref({ ...props.comment });

const formatTime = time => dayjs(time).format('MM-DD HH:mm');
</script>
