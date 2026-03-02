<template>
  <StudentLayout>
    <div class="qa-page">
      <el-row :gutter="20">
        <!-- 左侧：对话窗口 -->
        <el-col :span="16">
          <el-card class="chat-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><ChatDotRound /></el-icon> AI答疑助手</span>
                <el-button
                  type="primary"
                  link
                  @click="clearChat"
                >
                  <el-icon><Delete /></el-icon> 清空对话
                </el-button>
              </div>
            </template>

            <!-- 对话消息区域 -->
            <div
              ref="messagesContainer"
              class="chat-messages"
            >
              <!-- 欢迎消息 -->
              <div
                v-if="messages.length === 0"
                class="welcome-message"
              >
                <el-icon class="welcome-icon">
                  <ChatDotRound />
                </el-icon>
                <h3>你好！我是AI答疑助手</h3>
                <p>有任何学习问题都可以问我，我会尽力帮你解答。</p>
                <div class="quick-questions">
                  <p>试试这些问题：</p>
                  <el-tag
                    v-for="q in quickQuestions"
                    :key="q"
                    class="quick-tag"
                    effect="plain"
                    @click="askQuickQuestion(q)"
                  >
                    {{ q }}
                  </el-tag>
                </div>
              </div>

              <!-- 消息列表 -->
              <div
                v-for="(msg, index) in messages"
                :key="index"
                class="message-item"
                :class="msg.role"
              >
                <div class="message-avatar">
                  <el-avatar
                    v-if="msg.role === 'user'"
                    :size="36"
                    :icon="User"
                  />
                  <el-avatar
                    v-else
                    :size="36"
                    :icon="ChatDotRound"
                    style="background: #409eff"
                  />
                </div>
                <div class="message-content">
                  <div class="message-text">
                    {{ msg.content }}
                  </div>
                  
                  <!-- AI回答的额外信息 -->
                  <template v-if="msg.role === 'assistant' && msg.extra">
                    <!-- 解题步骤 -->
                    <div
                      v-if="msg.extra.steps && msg.extra.steps.length > 0"
                      class="answer-steps"
                    >
                      <div class="steps-title">
                        <el-icon><List /></el-icon> 解题步骤
                      </div>
                      <ol>
                        <li
                          v-for="(step, i) in msg.extra.steps"
                          :key="i"
                        >
                          {{ step }}
                        </li>
                      </ol>
                    </div>
                    
                    <!-- 相关例题 -->
                    <div
                      v-if="msg.extra.related_examples && msg.extra.related_examples.length > 0"
                      class="related-examples"
                    >
                      <div class="examples-title">
                        <el-icon><Document /></el-icon> 相关例题
                      </div>
                      <ul>
                        <li
                          v-for="(ex, i) in msg.extra.related_examples"
                          :key="i"
                        >
                          {{ ex }}
                        </li>
                      </ul>
                    </div>

                    <!-- 满意度反馈 -->
                    <div
                      v-if="msg.extra.qa_record_id && !msg.feedbackGiven"
                      class="feedback-section"
                    >
                      <span>这个回答对你有帮助吗？</span>
                      <el-button-group size="small">
                        <el-button
                          :icon="CircleCheck"
                          @click="giveFeedback(msg, 'satisfied')"
                        >
                          有帮助
                        </el-button>
                        <el-button @click="giveFeedback(msg, 'neutral')">
                          一般
                        </el-button>
                        <el-button
                          :icon="CircleClose"
                          @click="giveFeedback(msg, 'unsatisfied')"
                        >
                          没帮助
                        </el-button>
                      </el-button-group>
                    </div>
                    <div
                      v-if="msg.feedbackGiven"
                      class="feedback-given"
                    >
                      <el-icon><Check /></el-icon> 感谢您的反馈！
                    </div>
                  </template>
                </div>
              </div>

              <!-- 加载中 -->
              <div
                v-if="loading"
                class="message-item assistant"
              >
                <div class="message-avatar">
                  <el-avatar
                    :size="36"
                    :icon="ChatDotRound"
                    style="background: #409eff"
                  />
                </div>
                <div class="message-content">
                  <div class="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="chat-input">
              <el-input
                v-model="inputQuestion"
                type="textarea"
                :rows="2"
                placeholder="输入你的问题..."
                :disabled="loading"
                @keydown.enter.ctrl="sendQuestion"
              />
              <div class="input-actions">
                <span class="input-hint">Ctrl + Enter 发送</span>
                <el-button
                  type="primary"
                  :loading="loading"
                  :disabled="!inputQuestion.trim()"
                  @click="sendQuestion"
                >
                  <el-icon><Promotion /></el-icon> 发送
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：历史记录 -->
        <el-col :span="8">
          <el-card class="history-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><Clock /></el-icon> 问答历史</span>
                <el-button
                  type="primary"
                  link
                  @click="fetchHistory"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>

            <div
              v-if="history.length > 0"
              class="history-list"
            >
              <div
                v-for="record in history"
                :key="record.id"
                class="history-item"
                @click="viewHistoryDetail(record)"
              >
                <div class="history-question">
                  {{ truncateText(record.question, 50) }}
                </div>
                <div class="history-meta">
                  <span class="history-time">{{ formatDate(record.created_at) }}</span>
                  <el-tag
                    v-if="record.satisfaction"
                    :type="getSatisfactionType(record.satisfaction)"
                    size="small"
                  >
                    {{ getSatisfactionLabel(record.satisfaction) }}
                  </el-tag>
                </div>
              </div>
            </div>
            <el-empty
              v-else
              description="暂无问答记录"
              :image-size="60"
            />

            <!-- 分页 -->
            <div
              v-if="historyPagination.total > historyPagination.limit"
              class="history-pagination"
            >
              <el-pagination
                v-model:current-page="historyPagination.page"
                small
                layout="prev, pager, next"
                :total="historyPagination.total"
                :page-size="historyPagination.limit"
                @current-change="fetchHistory"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 历史详情对话框 -->
      <el-dialog
        v-model="historyDialogVisible"
        title="问答详情"
        width="600px"
      >
        <div
          v-if="selectedHistory"
          class="history-detail"
        >
          <div class="detail-section">
            <div class="detail-label">
              问题
            </div>
            <div class="detail-content">
              {{ selectedHistory.question }}
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-label">
              回答
            </div>
            <div class="detail-content">
              {{ selectedHistory.answer }}
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-label">
              时间
            </div>
            <div class="detail-content">
              {{ formatDate(selectedHistory.created_at) }}
            </div>
          </div>
          <div
            v-if="selectedHistory.satisfaction"
            class="detail-section"
          >
            <div class="detail-label">
              评价
            </div>
            <div class="detail-content">
              <el-tag :type="getSatisfactionType(selectedHistory.satisfaction)">
                {{ getSatisfactionLabel(selectedHistory.satisfaction) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生AI答疑页面
 * 创建对话窗口组件、实现问题输入、调用/api/qa/ask接口
 * 显示答案、解题步骤、相关例题
 * 需求：7.1, 7.2, 7.3
 */
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, User, Delete, Promotion, Clock, Refresh, List, Document,
         CircleCheck, CircleClose, Check } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

interface Message {
  role: 'user' | 'assistant'
  content: string
  extra?: {
    steps?: string[]
    related_examples?: string[]
    qa_record_id?: number
  }
  feedbackGiven?: boolean
}

interface HistoryRecord {
  id: number
  question: string
  answer: string
  satisfaction: 'satisfied' | 'unsatisfied' | 'neutral' | null
  created_at: string
}

const messagesContainer = ref<HTMLElement | null>(null)
const messages = ref<Message[]>([])
const inputQuestion = ref('')
const loading = ref(false)
const history = ref<HistoryRecord[]>([])
const historyPagination = ref({ page: 1, limit: 10, total: 0 })
const historyDialogVisible = ref(false)
const selectedHistory = ref<HistoryRecord | null>(null)

const quickQuestions = [
  '如何解一元二次方程？',
  '什么是勾股定理？',
  '如何计算圆的面积？'
]

async function sendQuestion() {
  const question = inputQuestion.value.trim()
  if (!question || loading.value) return

  messages.value.push({ role: 'user', content: question })
  inputQuestion.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const response = await request.post<{
      success?: boolean
      data?: { answer: string; steps: string[]; related_examples: string[]; qa_record_id: number }
    }>('/qa/ask', { question })

    if (response.success && response.data) {
      messages.value.push({
        role: 'assistant',
        content: response.data.answer,
        extra: {
          steps: response.data.steps,
          related_examples: response.data.related_examples,
          qa_record_id: response.data.qa_record_id
        },
        feedbackGiven: false
      })
    }
  } catch (error: unknown) {
    console.error('[AI答疑] 提问失败:', error)
    const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'AI服务暂时不可用，请稍后重试'
    messages.value.push({ role: 'assistant', content: errorMsg })
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

async function giveFeedback(msg: Message, satisfaction: 'satisfied' | 'unsatisfied' | 'neutral') {
  if (!msg.extra?.qa_record_id) return
  try {
    await request.post('/qa/feedback', {
      qa_record_id: msg.extra.qa_record_id,
      satisfaction
    })
    msg.feedbackGiven = true
    ElMessage.success('感谢您的反馈！')
  } catch (error: unknown) {
    console.error('[AI答疑] 反馈失败:', error)
    ElMessage.error('反馈提交失败')
  }
}

async function fetchHistory() {
  try {
    const response = await request.get<{
      success?: boolean
      data?: { records: HistoryRecord[]; pagination: { total: number } }
    }>('/qa/history', {
      params: { page: historyPagination.value.page, limit: historyPagination.value.limit }
    })
    if (response.success && response.data) {
      history.value = response.data.records
      historyPagination.value.total = response.data.pagination.total
    }
  } catch (error: unknown) {
    console.error('[AI答疑] 获取历史失败:', error)
  }
}

function askQuickQuestion(question: string) {
  inputQuestion.value = question
  sendQuestion()
}

function clearChat() {
  messages.value = []
}

function viewHistoryDetail(record: HistoryRecord) {
  selectedHistory.value = record
  historyDialogVisible.value = true
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function getSatisfactionType(satisfaction: string): '' | 'success' | 'warning' | 'danger' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger'> = {
    satisfied: 'success', neutral: 'warning', unsatisfied: 'danger'
  }
  return types[satisfaction] || ''
}

function getSatisfactionLabel(satisfaction: string): string {
  const labels: Record<string, string> = {
    satisfied: '有帮助', neutral: '一般', unsatisfied: '没帮助'
  }
  return labels[satisfaction] || satisfaction
}

onMounted(() => { fetchHistory() })
</script>

<style scoped>
.qa-page { min-height: 100%; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.chat-card { height: calc(100vh - 180px); display: flex; flex-direction: column; }
.chat-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; padding: 0; }
.chat-messages { flex: 1; overflow-y: auto; padding: 20px; }
.welcome-message { text-align: center; padding: 40px 20px; color: #909399; }
.welcome-icon { font-size: 48px; color: #409eff; margin-bottom: 16px; }
.welcome-message h3 { margin: 0 0 8px 0; color: #333; }
.quick-questions { margin-top: 20px; }
.quick-tag { cursor: pointer; margin: 4px; }
.quick-tag:hover { background: #ecf5ff; }
.message-item { display: flex; gap: 12px; margin-bottom: 20px; }
.message-item.user { flex-direction: row-reverse; }
.message-item.user .message-content { align-items: flex-end; }
.message-content { display: flex; flex-direction: column; max-width: 70%; }
.message-text { padding: 12px 16px; border-radius: 12px; line-height: 1.6; }
.message-item.user .message-text { background: #409eff; color: #fff; border-bottom-right-radius: 4px; }
.message-item.assistant .message-text { background: #f5f7fa; color: #333; border-bottom-left-radius: 4px; }
.answer-steps, .related-examples { margin-top: 12px; padding: 12px; background: #f5f7fa; border-radius: 8px; }
.steps-title, .examples-title { font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
.answer-steps ol, .related-examples ul { margin: 0; padding-left: 20px; }
.answer-steps li, .related-examples li { margin: 4px 0; }
.feedback-section { margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #909399; }
.feedback-given { margin-top: 12px; font-size: 13px; color: #67c23a; display: flex; align-items: center; gap: 4px; }
.typing-indicator { display: flex; gap: 4px; padding: 12px 16px; }
.typing-indicator span { width: 8px; height: 8px; background: #909399; border-radius: 50%; animation: typing 1.4s infinite; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
.chat-input { padding: 16px; border-top: 1px solid #ebeef5; }
.input-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.input-hint { font-size: 12px; color: #909399; }
.history-card { height: calc(100vh - 180px); }
.history-card :deep(.el-card__body) { height: calc(100% - 60px); overflow-y: auto; }
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-item { padding: 12px; background: #f5f7fa; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
.history-item:hover { background: #ecf5ff; }
.history-question { font-size: 14px; color: #333; margin-bottom: 8px; line-height: 1.4; }
.history-meta { display: flex; justify-content: space-between; align-items: center; }
.history-time { font-size: 12px; color: #909399; }
.history-pagination { margin-top: 16px; display: flex; justify-content: center; }
.history-detail .detail-section { margin-bottom: 16px; }
.detail-label { font-weight: 500; color: #909399; margin-bottom: 4px; font-size: 13px; }
.detail-content { color: #333; line-height: 1.6; }
</style>
