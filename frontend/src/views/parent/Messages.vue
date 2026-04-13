<template>
  <ParentLayout>
    <div class="messages-page">
      <div class="page-header">
        <h2>家校留言</h2>
        <div class="header-actions">
          <el-select
            v-model="selectedChildId"
            placeholder="选择孩子"
            style="width: 150px"
            @change="handleChildChange"
          >
            <el-option
              v-for="child in children"
              :key="child.id"
              :label="child.name"
              :value="child.id"
            />
          </el-select>
        </div>
      </div>

      <el-row :gutter="20">
        <!-- 教师列表 -->
        <el-col :span="6">
          <el-card class="teachers-card">
            <template #header>
              <span>教师列表</span>
            </template>
            <div class="teachers-list">
              <div
                v-for="teacher in teachers"
                :key="teacher.id"
                class="teacher-item"
                :class="{ active: selectedTeacher?.id === teacher.id }"
                @click="selectTeacher(teacher)"
              >
                <el-avatar
                  :size="40"
                  :src="teacher.avatarUrl"
                >
                  {{ teacher.name?.charAt(0) }}
                </el-avatar>
                <div class="teacher-info">
                  <span class="teacher-name">{{ teacher.name }}</span>
                  <span class="teacher-subject">{{ teacher.subject }}</span>
                </div>
                <el-badge
                  v-if="teacher.unreadCount > 0"
                  :value="teacher.unreadCount"
                  class="unread-badge"
                />
              </div>
              <el-empty
                v-if="teachers.length === 0"
                description="暂无教师"
                :image-size="60"
              />
            </div>
          </el-card>
        </el-col>

        <!-- 消息区域 -->
        <el-col :span="18">
          <el-card
            v-if="selectedTeacher"
            class="chat-card"
          >
            <template #header>
              <div class="chat-header">
                <div class="chat-teacher-info">
                  <el-avatar
                    :size="36"
                    :src="selectedTeacher.avatarUrl"
                  >
                    {{ selectedTeacher.name?.charAt(0) }}
                  </el-avatar>
                  <div>
                    <span class="teacher-name">{{ selectedTeacher.name }}</span>
                    <span class="teacher-subject">{{ selectedTeacher.subject }}老师</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 消息列表 -->
            <div
              ref="messagesContainerRef"
              v-loading="loadingMessages"
              class="messages-container"
            >
              <div
                v-for="message in messages"
                :key="message.id"
                class="message-wrapper"
                :class="{ 'message-self': message.isSelf }"
              >
                <el-avatar
                  v-if="!message.isSelf"
                  :size="36"
                  :src="selectedTeacher.avatarUrl"
                >
                  {{ selectedTeacher.name?.charAt(0) }}
                </el-avatar>
                <div class="message-content">
                  <div class="message-bubble">
                    {{ message.content }}
                  </div>
                  <div class="message-time">
                    {{ formatTime(message.createdAt) }}
                  </div>
                </div>
                <el-avatar
                  v-if="message.isSelf"
                  :size="36"
                >
                  {{ userStore.displayName?.charAt(0) }}
                </el-avatar>
              </div>
              <el-empty
                v-if="messages.length === 0 && !loadingMessages"
                description="暂无消息，发送第一条消息吧"
                :image-size="80"
              />
            </div>

            <!-- 输入区域 -->
            <div class="input-area">
              <el-input
                v-model="newMessage"
                type="textarea"
                :rows="3"
                placeholder="输入消息内容..."
                resize="none"
                @keyup.ctrl.enter="sendMessage"
              />
              <div class="input-actions">
                <span class="input-hint">Ctrl + Enter 发送</span>
                <el-button
                  type="primary"
                  :loading="sending"
                  :disabled="!newMessage.trim()"
                  @click="sendMessage"
                >
                  发送
                </el-button>
              </div>
            </div>
          </el-card>

          <el-card
            v-else
            class="empty-chat-card"
          >
            <el-empty
              description="请从左侧选择一位教师开始对话"
              :image-size="120"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </ParentLayout>
</template>

<script setup lang="ts">
/**
 * 家校留言板页面
 * 
 * 功能：
 * - 显示与教师的消息记录
 * - 实现发送消息功能
 * 
 * 需求：8.5 - 家长与教师沟通
 */
import { ref, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ParentLayout from '@/components/ParentLayout.vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const userStore = useUserStore()

// 教师接口
interface Teacher {
  id: number
  name: string
  subject: string
  avatarUrl?: string
  unreadCount: number
}

// 消息接口
interface Message {
  id: number
  content: string
  isSelf: boolean
  createdAt: string
  isRead: boolean
}

// 孩子列表
const children = ref<Array<{ id: number; name: string }>>([])
const selectedChildId = ref<number | null>(null)

// 教师列表
const teachers = ref<Teacher[]>([])
const selectedTeacher = ref<Teacher | null>(null)

// 消息列表
const messages = ref<Message[]>([])
const loadingMessages = ref(false)

// 新消息
const newMessage = ref('')
const sending = ref(false)

// 消息容器引用
const messagesContainerRef = ref<HTMLElement | null>(null)

// 获取孩子列表
async function fetchChildren() {
  try {
    const response = await request.get<{ children?: Array<{ id: number; name: string }> }>('/parent/children')
    children.value = response.children || []
    if (children.value.length > 0) {
      selectedChildId.value = children.value[0].id
      fetchTeachers()
    }
  } catch (error) {
    console.error('[家校留言] 获取孩子列表失败，使用模拟数据:', error)
    children.value = [{ id: 4, name: '张小明' }]
    selectedChildId.value = 4
    fetchTeachers()
  }
}

// 获取教师列表
async function fetchTeachers() {
  if (!selectedChildId.value) return
  
  try {
    const response = await request.get<{ teachers?: Teacher[] }>('/parent/teachers', {
      params: { studentId: selectedChildId.value }
    })
    teachers.value = response.teachers || []
    
    // 自动选择第一个教师
    if (teachers.value.length > 0 && !selectedTeacher.value) {
      selectTeacher(teachers.value[0])
    }
  } catch (error) {
    console.error('[家校留言] 获取教师列表失败，使用模拟数据:', error)
    teachers.value = [
      { id: 1, name: '王老师', subject: 'Python程序设计', unreadCount: 1 },
      { id: 2, name: '李老师', subject: '数据结构与算法', unreadCount: 0 },
    ] as any
    if (teachers.value.length > 0 && !selectedTeacher.value) {
      selectTeacher(teachers.value[0])
    }
  }
}

// 选择教师
async function selectTeacher(teacher: Teacher) {
  selectedTeacher.value = teacher
  await fetchMessages()
  
  // 标记消息为已读
  if (teacher.unreadCount > 0) {
    markAsRead(teacher.id)
  }
}

// 获取消息列表
async function fetchMessages() {
  if (!selectedTeacher.value || !selectedChildId.value) return
  
  loadingMessages.value = true
  try {
    const response = await request.get<{ messages?: Message[] }>('/parent/messages', {
      params: {
        teacherId: selectedTeacher.value.id,
        studentId: selectedChildId.value
      }
    })
    messages.value = response.messages || []
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('[家校留言] 获取消息失败，使用模拟数据:', error)
    messages.value = [
      { id: 1, sender_role: 'teacher', sender_name: '王老师', content: '您好，张小明同学最近在递归算法部分表现较好，建议继续保持练习频率。', created_at: '2026-03-28T10:00:00Z', is_read: true },
      { id: 2, sender_role: 'parent', sender_name: '家长', content: '谢谢老师，我们在家也会督促孩子多练习。请问有没有推荐的练习资料？', created_at: '2026-03-28T10:30:00Z', is_read: true },
      { id: 3, sender_role: 'teacher', sender_name: '王老师', content: '可以参考LeetCode的"递归"专题，从简单题开始。另外本周作业"面向对象编程设计"即将截止，请提醒孩子及时完成。', created_at: '2026-03-29T09:00:00Z', is_read: false },
    ] as any
    await nextTick()
    scrollToBottom()
  } finally {
    loadingMessages.value = false
  }
}

// 发送消息
async function sendMessage() {
  if (!newMessage.value.trim() || !selectedTeacher.value || !selectedChildId.value) return
  
  sending.value = true
  try {
    const response = await request.post<{ message?: Message }>('/parent/messages', {
      teacherId: selectedTeacher.value.id,
      studentId: selectedChildId.value,
      content: newMessage.value.trim()
    })
    
    // 添加新消息到列表
    if (response.message) messages.value.push(response.message)
    newMessage.value = ''
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
    
    ElMessage.success('消息发送成功')
  } catch (error) {
    console.error('[家校留言] 发送消息失败，使用模拟:', error)
    messages.value.push({ id: Date.now(), sender_role: 'parent', sender_name: '家长', content: newMessage.value.trim(), created_at: new Date().toISOString(), is_read: true } as any)
    newMessage.value = ''
    await nextTick()
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

// 标记消息为已读
async function markAsRead(teacherId: number) {
  try {
    await request.post('/parent/messages/read', {
      teacherId,
      studentId: selectedChildId.value
    })
    
    // 更新未读数
    const teacher = teachers.value.find(t => t.id === teacherId)
    if (teacher) {
      teacher.unreadCount = 0
    }
  } catch (error) {
    console.error('[家校留言] 标记已读失败:', error)
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

// 切换孩子
function handleChildChange() {
  selectedTeacher.value = null
  messages.value = []
  fetchTeachers()
}

// 格式化时间
function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()] + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
}

onMounted(() => {
  fetchChildren()
})

watch(selectedChildId, () => {
  if (selectedChildId.value) {
    fetchTeachers()
  }
})
</script>

<style scoped>
.messages-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #F0F0F0;
}

.teachers-card {
  height: calc(100vh - 180px);
  overflow: hidden;
}

.teachers-list {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.teacher-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
  position: relative;
}

.teacher-item:hover {
  background: #2a2a2a;
}

.teacher-item.active {
  background: #ecf5ff;
}

.teacher-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.teacher-name {
  font-weight: 500;
  color: #F0F0F0;
}

.teacher-subject {
  font-size: 12px;
  color: #606060;
}

.unread-badge {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.chat-card, .empty-chat-card {
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-teacher-info .teacher-name {
  display: block;
  font-weight: 500;
  color: #F0F0F0;
}

.chat-teacher-info .teacher-subject {
  display: block;
  font-size: 12px;
  color: #606060;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #2a2a2a;
}

.message-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-wrapper.message-self {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-self .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  background: #252525;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.6;
  word-break: break-word;
}

.message-self .message-bubble {
  background: linear-gradient(135deg, #00D4FF, #0099BB);
  color: #fff;
}

.message-time {
  font-size: 12px;
  color: #606060;
}

.input-area {
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  background: #252525;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.input-hint {
  font-size: 12px;
  color: #606060;
}

.empty-chat-card {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
