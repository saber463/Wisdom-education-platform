<template>
  <div class="partner-chat-panel">
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message-item', message.sender === 'user' ? 'user-message' : 'partner-message']"
      >
        <el-avatar
          v-if="message.sender === 'partner'"
          :src="partnerAvatar"
          :size="32"
          class="message-avatar"
        />
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
        <el-avatar
          v-if="message.sender === 'user'"
          :size="32"
          class="message-avatar"
        >
          我
        </el-avatar>
      </div>
    </div>
    <div class="chat-input">
      <el-input
        v-model="inputMessage"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
      >
        <template #append>
          <el-button @click="sendMessage" :loading="sending">发送</el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

interface Message {
  sender: 'user' | 'partner'
  content: string
  message_type: string
  timestamp: string
}

interface Props {
  partnerAvatar: string
}

const props = defineProps<Props>()

const messages = ref<Message[]>([])
const inputMessage = ref('')
const sending = ref(false)
const messagesContainer = ref<HTMLDivElement | null>(null)
let refreshTimer: number | null = null

async function loadMessages() {
  try {
    const response = await request.get<{ code: number; data?: { interactions?: unknown[] }; msg?: string }>('/virtual-partner/interactions')
    if (response.code === 200) {
      messages.value = (response.data?.interactions ?? []) as typeof messages.value
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || sending.value) return

  sending.value = true
  try {
    const response = await request.post<{ code?: number; msg?: string }>('/virtual-partner/send-message', {
      message_type: 'question_answer',
      content: inputMessage.value
    })

    if (response.code === 200) {
      inputMessage.value = ''
      await loadMessages()
    } else {
      ElMessage.error(response.msg || '发送失败')
    }
  } catch (error: any) {
    console.error('发送消息失败:', error)
    ElMessage.error(error.response?.data?.msg || '发送失败')
  } finally {
    sending.value = false
  }
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  loadMessages()
  // 每分钟自动刷新
  refreshTimer = window.setInterval(() => {
    loadMessages()
  }, 60000)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.partner-chat-panel {
  @apply flex flex-col h-full;
}

.chat-messages {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.message-item {
  @apply flex items-start gap-3;
}

.user-message {
  @apply flex-row-reverse;
}

.message-content {
  @apply flex flex-col max-w-[70%];
}

.user-message .message-content {
  @apply items-end;
}

.partner-message .message-content {
  @apply items-start;
}

.message-text {
  @apply px-4 py-2 rounded-lg;
}

.user-message .message-text {
  @apply bg-primary-500 text-white;
}

.partner-message .message-text {
  @apply bg-gray-100 text-gray-800;
}

.message-time {
  @apply text-xs text-gray-500 mt-1;
}

.chat-input {
  @apply p-4 border-t border-gray-200;
}
</style>

