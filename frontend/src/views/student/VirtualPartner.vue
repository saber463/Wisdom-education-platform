<template>
  <StudentLayout>
    <div class="virtual-partner-page">
      <div class="page-header">
        <h2>AI学伴</h2>
        <el-tag class="online-tag" type="success">AI在线</el-tag>
      </div>

      <el-row :gutter="20">
        <!-- 左：AI对话 -->
        <el-col :xs="24" :lg="14">
          <el-card class="chat-card">
            <template #header>
              <div class="card-header">
                <div class="ai-avatar-wrap">
                  <div class="ai-avatar">AI</div>
                  <div>
                    <div class="ai-name">EduBot 学习助手</div>
                    <div class="ai-status"><span class="dot" />随时为你解答</div>
                  </div>
                </div>
              </div>
            </template>
            <div class="messages-container" ref="messagesEl">
              <div v-for="msg in messages" :key="msg.id" class="message-row" :class="msg.role">
                <div class="msg-avatar" v-if="msg.role === 'assistant'">AI</div>
                <div class="msg-bubble" :class="msg.role">
                  <div class="msg-text">{{ msg.content }}</div>
                  <div class="msg-time">{{ msg.time }}</div>
                </div>
              </div>
              <div v-if="thinking" class="message-row assistant">
                <div class="msg-avatar">AI</div>
                <div class="msg-bubble assistant thinking">
                  <span class="dot-anim" /><span class="dot-anim" /><span class="dot-anim" />
                </div>
              </div>
            </div>
            <div class="input-area">
              <el-input
                v-model="inputText"
                type="textarea"
                :rows="2"
                placeholder="输入问题，AI学伴为你解答..."
                resize="none"
                @keydown.enter.exact.prevent="sendMessage"
              />
              <el-button type="primary" :loading="thinking" @click="sendMessage" class="send-btn">
                发送
              </el-button>
            </div>
            <div class="quick-questions">
              <span class="quick-label">快速提问：</span>
              <el-button size="small" v-for="q in quickQuestions" :key="q" @click="quickAsk(q)" text>{{ q }}</el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 右：学伴信息+人类学伴 -->
        <el-col :xs="24" :lg="10">
          <el-card class="feature-card">
            <template #header><span class="card-title">AI学伴能力</span></template>
            <div class="feature-list">
              <div class="feature-item" v-for="f in features" :key="f.title">
                <div class="feature-icon">{{ f.icon }}</div>
                <div class="feature-info">
                  <div class="feature-title">{{ f.title }}</div>
                  <div class="feature-desc">{{ f.desc }}</div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card style="margin-top: 16px;">
            <template #header>
              <div class="card-header">
                <span class="card-title">真人学伴</span>
                <el-button type="primary" size="small" @click="$router.push('/student/my-partner')">查看配对</el-button>
              </div>
            </template>
            <div class="human-partner-hint">
              <el-icon style="font-size:32px;color:#00D4FF;"><User /></el-icon>
              <p>与进度相近的同学配对，共同学习进步</p>
              <el-button @click="$router.push('/student/my-partner')">前往真人学伴</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { User } from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

const inputText = ref('')
const thinking = ref(false)
const messagesEl = ref<HTMLElement>()

interface Msg { id: number; role: 'user' | 'assistant'; content: string; time: string }
const messages = ref<Msg[]>([
  { id: 1, role: 'assistant', content: '你好！我是你的AI学习助手 EduBot 🎓 有什么学习问题都可以问我，我会根据你的学习记录为你提供个性化解答！', time: now() }
])

const quickQuestions = ['我今天该学什么？', '帮我出几道练习题', '解释一下递归算法', '我的薄弱知识点有哪些？']

const features = [
  { icon: '🧠', title: '个性化解答', desc: '基于你的学习记录提供精准解答' },
  { icon: '📝', title: '出题练习', desc: '根据薄弱点生成针对性习题' },
  { icon: '📊', title: '学情分析', desc: '实时分析学习状态和进度' },
  { icon: '🗺️', title: '路径规划', desc: '协同AI优化你的学习路径' },
]

function now() { return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || thinking.value) return
  inputText.value = ''
  messages.value.push({ id: Date.now(), role: 'user', content: text, time: now() })
  await scrollBottom()
  thinking.value = true
  try {
    const res = await request.post<{ answer?: string; reply?: string; data?: { reply?: string } }>('/virtual-partner/ask-question', { question: text })
    const reply = res.answer || res.reply || res.data?.reply || '我理解你的问题。根据你当前的学习进度，建议先巩固基础知识，再尝试进阶内容。'
    messages.value.push({ id: Date.now() + 1, role: 'assistant', content: reply, time: now() })
  } catch {
    messages.value.push({ id: Date.now() + 1, role: 'assistant', content: '网络有些不稳定，请稍后再试。你也可以查看错题本或练习推荐来继续学习！', time: now() })
  } finally {
    thinking.value = false
    await scrollBottom()
  }
}

function quickAsk(q: string) { inputText.value = q; sendMessage() }

async function scrollBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

onMounted(scrollBottom)
</script>

<style scoped>
.virtual-partner-page { min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 900; color: #F0F0F0; font-family: 'Source Han Sans CN', sans-serif; }
.online-tag { font-family: Consolas, monospace; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 15px; font-weight: 700; color: #E0E0E0; }
.ai-avatar-wrap { display: flex; gap: 12px; align-items: center; }
.ai-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #00FF94, #00D4FF); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #000; font-size: 14px; }
.ai-name { font-size: 15px; font-weight: 700; color: #E0E0E0; }
.ai-status { font-size: 12px; color: #606060; display: flex; align-items: center; gap: 6px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #00FF94; display: inline-block; }
.messages-container { height: 360px; overflow-y: auto; padding: 8px 0; display: flex; flex-direction: column; gap: 16px; }
.message-row { display: flex; gap: 10px; }
.message-row.user { flex-direction: row-reverse; }
.msg-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #00FF94, #00D4FF); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #000; flex-shrink: 0; }
.msg-bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; }
.msg-bubble.assistant { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-top-left-radius: 4px; }
.msg-bubble.user { background: linear-gradient(135deg, rgba(0,255,148,0.15), rgba(0,212,255,0.12)); border: 1px solid rgba(0,255,148,0.2); border-top-right-radius: 4px; }
.msg-bubble.thinking { display: flex; gap: 4px; align-items: center; padding: 14px; }
.msg-text { font-size: 14px; color: #D0D0D0; line-height: 1.6; }
.msg-time { font-size: 11px; color: #505050; margin-top: 4px; font-family: Consolas, monospace; }
.dot-anim { width: 6px; height: 6px; border-radius: 50%; background: #00FF94; animation: blink 1.2s infinite; display: inline-block; }
.dot-anim:nth-child(2) { animation-delay: 0.2s; }
.dot-anim:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
.input-area { margin-top: 16px; display: flex; gap: 10px; align-items: flex-end; }
.input-area .el-textarea { flex: 1; }
.send-btn { height: 56px; min-width: 72px; }
.quick-questions { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.quick-label { font-size: 12px; color: #606060; }
.feature-list { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.feature-item { display: flex; gap: 12px; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); }
.feature-icon { font-size: 24px; flex-shrink: 0; }
.feature-title { font-size: 14px; font-weight: 600; color: #E0E0E0; margin-bottom: 2px; }
.feature-desc { font-size: 12px; color: #707070; }
.human-partner-hint { text-align: center; padding: 20px 0; }
.human-partner-hint p { color: #909090; font-size: 13px; margin: 12px 0 16px; }
</style>
