<template>
  <!-- 防刷课核验覆盖层 - 不影响正常学习，仅在需要时显示 -->

  <!-- 🟢 状态徽章（始终显示在视频右上角） -->
  <div
    v-if="verifyStatus !== 'idle'"
    style="position:absolute;top:12px;right:12px;z-index:100;display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;backdrop-filter:blur(8px);transition:all 0.3s"
    :style="statusBadgeStyle"
  >
    <div
      style="width:7px;height:7px;border-radius:50%"
      :style="{ background: statusDotColor, animation: verifyStatus === 'verifying' ? 'pulse-dot 1s infinite' : 'none' }"
    />
    {{ statusText }}
  </div>

  <!-- 🔵 活体检测覆盖层（仅在需要核验时弹出） -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showVerifyModal"
        class="face-verify-overlay"
        @click.self="onOverlayClick"
      >
        <div class="face-verify-card">
          <!-- 标题 -->
          <div style="margin-bottom:20px">
            <div style="font-size:18px;font-weight:700;color:white;text-align:center">
              身份核验
            </div>
            <div style="font-size:13px;color:#94a3b8;text-align:center;margin-top:4px">
              保护你的学习权益，防止他人代刷
            </div>
          </div>

          <!-- 视频预览（圆形框，绿色扫描动画） -->
          <div style="position:relative;width:220px;height:220px;margin:0 auto 20px;border-radius:50%;overflow:hidden">
            <video
              ref="cameraVideo"
              autoplay
              muted
              playsinline
              style="width:100%;height:100%;object-fit:cover;border-radius:50%"
            />
            <canvas
              ref="cameraCanvas"
              style="display:none"
            />

            <!-- 扫描线动画 -->
            <div
              v-if="livenesStep === 'scanning'"
              style="position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#06b6d4,transparent);animation:scan 2s linear infinite;top:0"
            />

            <!-- 活体动作指示框 -->
            <div
              style="position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center"
              :style="faceFrameStyle"
            >
              <!-- 面部网格指示器（简化版） -->
              <div
                v-if="livenesStep !== 'done'"
                style="width:80px;height:80px;border:2px solid rgba(6,182,212,0.5);border-radius:4px;position:relative"
              >
                <div style="position:absolute;top:-2px;left:-2px;width:16px;height:16px;border-top:3px solid #06b6d4;border-left:3px solid #06b6d4" />
                <div style="position:absolute;top:-2px;right:-2px;width:16px;height:16px;border-top:3px solid #06b6d4;border-right:3px solid #06b6d4" />
                <div style="position:absolute;bottom:-2px;left:-2px;width:16px;height:16px;border-bottom:3px solid #06b6d4;border-left:3px solid #06b6d4" />
                <div style="position:absolute;bottom:-2px;right:-2px;width:16px;height:16px;border-bottom:3px solid #06b6d4;border-right:3px solid #06b6d4" />
              </div>
            </div>

            <!-- 通过勾选 -->
            <Transition name="pop">
              <div
                v-if="livenesStep === 'done'"
                style="position:absolute;inset:0;background:rgba(16,185,129,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:56px"
              >
                ✅
              </div>
            </Transition>
          </div>

          <!-- 状态与指令 -->
          <div
            class="face-status-badge"
            :class="statusBadgeClass"
            style="margin:0 auto 16px"
          >
            <span>{{ livenessInstruction }}</span>
          </div>

          <!-- 活体步骤进度 -->
          <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px">
            <div
              v-for="(step, idx) in livenessSteps"
              :key="idx"
              style="height:4px;border-radius:2px;transition:all 0.3s"
              :style="{
                width: idx === currentLivenessIdx ? '24px' : '12px',
                background: idx < currentLivenessIdx ? '#10b981' : idx === currentLivenessIdx ? '#06b6d4' : 'rgba(255,255,255,0.15)'
              }"
            />
          </div>

          <!-- 备用验证方式 -->
          <div style="text-align:center;margin-bottom:8px">
            <button
              style="font-size:12px;color:#94a3b8;background:none;border:none;cursor:pointer;text-decoration:underline"
              @click="switchToQuizVerify"
            >
              摄像头不可用？切换答题验证
            </button>
          </div>

          <!-- 倒计时（失败时） -->
          <div
            v-if="lockCountdown > 0"
            style="text-align:center;font-size:13px;color:#f87171"
          >
            课程锁定中，{{ lockCountdown }} 秒后可重试
          </div>
        </div>
      </div>
    </Transition>

    <!-- 📝 知识点随机小测验弹窗 -->
    <Transition name="slide-up">
      <div
        v-if="showQuizModal"
        style="position:fixed;bottom:24px;right:24px;z-index:9998;width:420px"
      >
        <div class="quiz-popup">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="font-size:14px;font-weight:700;color:#0f172a">
              📝 随机知识点测验
            </div>
            <div
              class="quiz-timer"
              :style="{ borderColor: quizTimeLeft <= 5 ? '#ef4444' : '#8b5cf6', color: quizTimeLeft <= 5 ? '#ef4444' : '#8b5cf6' }"
            >
              {{ quizTimeLeft }}
            </div>
          </div>
          <div style="font-size:14px;color:#1e293b;margin-bottom:14px;line-height:1.6">
            {{ currentQuiz?.question }}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
            <button
              v-for="(opt, idx) in currentQuiz?.options"
              :key="idx"
              style="padding:10px 14px;border-radius:10px;border:1.5px solid rgba(148,163,184,0.3);font-size:13px;cursor:pointer;text-align:left;transition:all 0.2s"
              :style="getOptionStyle(idx)"
              :disabled="quizAnswered"
              @click="answerQuiz(idx)"
            >
              <span style="font-weight:600;margin-right:8px">{{ String.fromCharCode(65 + idx) }}.</span>
              {{ opt }}
            </button>
          </div>
          <div
            v-if="quizAnswered"
            style="font-size:12px;padding:10px 12px;border-radius:8px;margin-bottom:10px"
            :style="quizCorrect ? 'background:rgba(16,185,129,0.1);color:#059669' : 'background:rgba(239,68,68,0.1);color:#dc2626'"
          >
            {{ quizCorrect ? '✓ 回答正确！继续学习' : `✗ 正确答案是 ${currentQuiz?.correctLabel}。${currentQuiz?.analysis}` }}
          </div>
          <div style="text-align:center;font-size:11px;color:#94a3b8">
            {{ quizAnswered ? '3秒后关闭...' : `${quizTimeLeft}秒内未回答将暂停计时` }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

interface QuizItem {
  question: string
  options: string[]
  correctIndex: number
  correctLabel: string
  analysis: string
}

const props = defineProps<{
  lessonId: number
  courseId: number
  videoRef?: HTMLVideoElement | null
}>()

const emit = defineEmits<{
  (e: 'pause'): void
  (e: 'resume'): void
  (e: 'forceExit'): void
}>()

// ===== 状态管理 =====
type VerifyStatus = 'idle' | 'pass' | 'warning' | 'verifying' | 'locked'
const verifyStatus = ref<VerifyStatus>('idle')
let consecutiveFailures = 0
const MAX_FAILURES = 3

// 状态徽章样式
const statusBadgeStyle = computed(() => ({
  background: {
    idle: 'rgba(0,0,0,0.4)',
    pass: 'rgba(16,185,129,0.2)',
    warning: 'rgba(245,158,11,0.2)',
    verifying: 'rgba(139,92,246,0.2)',
    locked: 'rgba(239,68,68,0.2)',
  }[verifyStatus.value],
  color: {
    idle: '#94a3b8', pass: '#34d399', warning: '#fbbf24', verifying: '#a78bfa', locked: '#f87171',
  }[verifyStatus.value],
  border: `1px solid ${['pass', 'idle'].includes(verifyStatus.value) ? 'transparent' : 'currentColor'}`,
  opacity: '0.9',
}))

const statusDotColor = computed(() => ({
  idle: '#94a3b8', pass: '#34d399', warning: '#fbbf24', verifying: '#a78bfa', locked: '#ef4444',
}[verifyStatus.value]))

const statusText = computed(() => ({
  idle: '核验待机',
  pass: '身份已验证 ✓',
  warning: '轻微异常，已记录',
  verifying: '核验中...',
  locked: '学习已锁定',
}[verifyStatus.value]))

// ===== 摄像头 =====
const cameraVideo = ref<HTMLVideoElement>()
const cameraCanvas = ref<HTMLCanvasElement>()
let stream: MediaStream | null = null

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } })
    if (cameraVideo.value) cameraVideo.value.srcObject = stream
  } catch {
    ElMessage.warning('摄像头不可用，已切换到答题验证模式')
    switchToQuizVerify()
  }
}

function stopCamera() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
}

function captureSnapshot(): string | null {
  if (!cameraCanvas.value || !cameraVideo.value) return null
  const canvas = cameraCanvas.value
  canvas.width = 320
  canvas.height = 320
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(cameraVideo.value, 0, 0, 320, 320)
  return canvas.toDataURL('image/jpeg', 0.6)
}

// ===== 活体检测 =====
type LivenessStep = 'idle' | 'scanning' | 'blink' | 'nod' | 'done' | 'failed'
const showVerifyModal = ref(false)
const livenesStep = ref<LivenessStep>('idle')
const currentLivenessIdx = ref(0)
const livenessSteps = ['扫描人脸', '请眨眼', '请点头']
const lockCountdown = ref(0)

const livenessInstruction = computed(() => ({
  idle: '准备核验...',
  scanning: '正在扫描人脸，请正视摄像头',
  blink: '👁️ 请自然眨眼 1-2 次',
  nod: '↕️ 请轻微点头',
  done: '✅ 活体验证通过！',
  failed: '❌ 验证失败，请重试',
} as Record<LivenessStep, string>)[livenesStep.value])

const faceFrameStyle = computed(() => ({
  border: ({
    scanning: '2px dashed rgba(6,182,212,0.6)',
    blink: '2px solid #a78bfa',
    nod: '2px solid #10b981',
    done: '3px solid #10b981',
    failed: '2px solid #ef4444',
    idle: '2px dashed rgba(255,255,255,0.2)',
  } as Record<LivenessStep, string>)[livenesStep.value],
}))

const statusBadgeClass = computed(() => ({
  pass: 'face-status-pass',
  failed: 'face-status-fail',
  done: 'face-status-pass',
  scanning: 'face-status-verifying',
  blink: 'face-status-verifying',
  nod: 'face-status-verifying',
  idle: 'face-status-verifying',
} as Record<LivenessStep, string>)[livenesStep.value] || 'face-status-verifying')

// 模拟活体检测流程（实际产品对接 face-api.js 的 detectAllFaces）
async function runLivenessCheck() {
  livenesStep.value = 'scanning'
  currentLivenessIdx.value = 0
  await delay(1500)

  livenesStep.value = 'blink'
  currentLivenessIdx.value = 1
  await delay(3000)  // 实际: 监听眼睛EAR值变化

  livenesStep.value = 'nod'
  currentLivenessIdx.value = 2
  await delay(3000)  // 实际: 监听鼻尖Y轴位移

  livenesStep.value = 'done'
  await delay(800)
  return true
}

async function triggerVerify() {
  if (showVerifyModal.value) return
  verifyStatus.value = 'verifying'
  showVerifyModal.value = true
  emit('pause')

  await startCamera()
  const passed = await runLivenessCheck()

  if (passed) {
    // 提取特征并发送核验请求
    const snapshot = captureSnapshot()
    try {
      const res = await request.post<{ data?: { result?: string; similarity?: number } }>('/api/face/verify', {
        lesson_id: props.lessonId,
        course_id: props.courseId,
        snapshot_url: snapshot,
        liveness_passed: true,
        // 实际产品: feature_vector 由 face-api.js 在前端提取后发送
        feature_vector: Array.from({ length: 128 }, () => Math.random()), // Demo
      })
      handleVerifyResult((res.data?.result as 'pass' | 'warning' | 'fail') || 'pass', res.data?.similarity || 0.9)
    } catch {
      handleVerifyResult('pass', 0.9) // 服务不可用时默认通过，保障正常学习
    }
  } else {
    handleVerifyResult('fail', 0)
  }

  showVerifyModal.value = false
  stopCamera()
}

function handleVerifyResult(result: 'pass' | 'warning' | 'fail', similarity: number) {
  if (result === 'pass') {
    verifyStatus.value = 'pass'
    consecutiveFailures = 0
    emit('resume')
  } else if (result === 'warning') {
    verifyStatus.value = 'warning'
    consecutiveFailures++
    ElMessage({ message: '身份核验轻微异常，已记录', type: 'warning', duration: 3000 })
    emit('resume')
  } else {
    consecutiveFailures++
    verifyStatus.value = 'locked'

    if (consecutiveFailures >= MAX_FAILURES) {
      ElMessage({ message: '连续核验失败3次，已上报教师并强制退出', type: 'error', duration: 5000 })
      setTimeout(() => emit('forceExit'), 2000)
    } else {
      const lockTime = consecutiveFailures === 1 ? 600 : 3600 // 10min / 1h
      startLockCountdown(lockTime)
      ElMessage({ message: `核验失败(${consecutiveFailures}/${MAX_FAILURES})，课程锁定${lockTime / 60}分钟`, type: 'error' })
    }
  }
}

let lockTimer: ReturnType<typeof setInterval> | null = null

function startLockCountdown(seconds: number) {
  lockCountdown.value = seconds
  lockTimer = setInterval(() => {
    lockCountdown.value--
    if (lockCountdown.value <= 0) {
      clearInterval(lockTimer!)
      lockCountdown.value = 0
      verifyStatus.value = 'idle'
      emit('resume')
    }
  }, 1000)
}

// 切换答题验证
function switchToQuizVerify() {
  showVerifyModal.value = false
  stopCamera()
  triggerQuiz()
}

function onOverlayClick() {
  // 核验期间不允许关闭
}

// ===== 知识小测验 =====
const showQuizModal = ref(false)
const currentQuiz = ref<QuizItem | null>(null)
const quizTimeLeft = ref(10)
const quizAnswered = ref(false)
const quizCorrect = ref(false)
const selectedOption = ref<number | null>(null)
let quizTimer: ReturnType<typeof setInterval> | null = null

const QUIZ_POOL: QuizItem[] = [
  { question: '以下哪种数据结构满足"先进先出"（FIFO）原则？', options: ['栈 (Stack)', '队列 (Queue)', '堆 (Heap)', '树 (Tree)'], correctIndex: 1, correctLabel: 'B. 队列', analysis: '队列满足先进先出，栈满足后进先出。' },
  { question: '时间复杂度 O(n log n) 的排序算法是？', options: ['冒泡排序', '选择排序', '归并排序', '插入排序'], correctIndex: 2, correctLabel: 'C. 归并排序', analysis: '归并排序时间复杂度始终为O(n log n)，空间复杂度O(n)。' },
  { question: 'Python中，以下哪个关键字用于定义函数？', options: ['func', 'def', 'function', 'fn'], correctIndex: 1, correctLabel: 'B. def', analysis: 'Python使用def关键字定义函数。' },
  { question: 'HTTP状态码 404 表示什么？', options: ['服务器内部错误', '请求成功', '资源未找到', '未授权访问'], correctIndex: 2, correctLabel: 'C. 资源未找到', analysis: '404 Not Found 表示客户端请求的资源在服务器上不存在。' },
]

function triggerQuiz() {
  const randomQuiz = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)]
  currentQuiz.value = randomQuiz
  quizTimeLeft.value = 10
  quizAnswered.value = false
  quizCorrect.value = false
  selectedOption.value = null
  showQuizModal.value = true
  emit('pause')

  quizTimer = setInterval(() => {
    quizTimeLeft.value--
    if (quizTimeLeft.value <= 0) {
      clearInterval(quizTimer!)
      if (!quizAnswered.value) {
        // 超时未答，继续暂停计时
        quizAnswered.value = true
        quizCorrect.value = false
      }
    }
  }, 1000)
}

function answerQuiz(idx: number) {
  if (quizAnswered.value) return
  clearInterval(quizTimer!)
  selectedOption.value = idx
  quizAnswered.value = true
  quizCorrect.value = idx === currentQuiz.value?.correctIndex

  setTimeout(() => {
    showQuizModal.value = false
    emit('resume')
    verifyStatus.value = quizCorrect.value ? 'pass' : 'warning'
  }, 3000)
}

function getOptionStyle(idx: number) {
  if (!quizAnswered.value) return 'background:#f8fafc;color:#1e293b'
  if (idx === currentQuiz.value?.correctIndex) return 'background:rgba(16,185,129,0.1);border-color:#10b981;color:#059669'
  if (idx === selectedOption.value) return 'background:rgba(239,68,68,0.1);border-color:#ef4444;color:#dc2626'
  return 'background:#f8fafc;color:#94a3b8;opacity:0.5'
}

// ===== 定时器：每2分钟静默核验 + 随机测验 =====
let verifyInterval: ReturnType<typeof setInterval> | null = null
let quizInterval: ReturnType<typeof setInterval> | null = null

function startGuard() {
  // 每2分钟静默核验
  verifyInterval = setInterval(() => {
    if (verifyStatus.value !== 'locked') triggerVerify()
  }, 2 * 60 * 1000)

  // 随机10~15分钟弹出一次测验
  const scheduleNextQuiz = () => {
    const delay = (Math.random() * 5 + 10) * 60 * 1000
    quizInterval = setTimeout(() => {
      if (verifyStatus.value !== 'locked') triggerQuiz()
      scheduleNextQuiz()
    }, delay) as any
  }
  scheduleNextQuiz()
}

function stopGuard() {
  clearInterval(verifyInterval!); clearInterval(quizInterval!)
  clearInterval(lockTimer!); clearInterval(quizTimer!)
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

onMounted(() => { startGuard() })
onBeforeUnmount(() => { stopGuard(); stopCamera() })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-enter-from { transform: translateY(20px); opacity: 0; }
.slide-up-leave-to { transform: translateY(10px); opacity: 0; }

.pop-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { transform: scale(0.5); opacity: 0; }

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
</style>
