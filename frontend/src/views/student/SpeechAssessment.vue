<template>
  <StudentLayout>
    <div class="speech-assessment-page">
      <el-row :gutter="20">
        <!-- 左侧：录制区域 -->
        <el-col :span="16">
          <el-card class="recording-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><Microphone /></el-icon> 口语评测</span>
                <el-button
                  v-if="recordingState !== 'idle'"
                  type="primary"
                  link
                  @click="resetRecording"
                >
                  <el-icon><RefreshRight /></el-icon> 重新录制
                </el-button>
              </div>
            </template>

            <!-- 录制状态显示 -->
            <div class="recording-status">
              <div
                class="status-indicator"
                :class="recordingState"
              >
                <div
                  v-if="recordingState === 'recording'"
                  class="pulse"
                />
                <span>{{ getStatusText() }}</span>
              </div>
              <div class="recording-time">
                {{ formatTime(recordingTime) }}
              </div>
            </div>

            <!-- 音频波形显示 -->
            <div class="waveform-container">
              <canvas
                ref="waveformCanvas"
                class="waveform"
              />
            </div>

            <!-- 录制控制按钮 -->
            <div class="recording-controls">
              <el-button 
                v-if="recordingState === 'idle'" 
                type="primary" 
                size="large"
                :loading="isInitializing"
                @click="startRecording"
              >
                <el-icon><VideoPlay /></el-icon> 开始录制
              </el-button>
              
              <el-button-group v-if="recordingState === 'recording'">
                <el-button
                  type="warning"
                  size="large"
                  @click="pauseRecording"
                >
                  <el-icon><VideoPause /></el-icon> 暂停
                </el-button>
                <el-button
                  type="danger"
                  size="large"
                  @click="stopRecording"
                >
                  <el-icon><VideoPause /></el-icon> 停止
                </el-button>
              </el-button-group>

              <el-button-group v-if="recordingState === 'paused'">
                <el-button
                  type="primary"
                  size="large"
                  @click="resumeRecording"
                >
                  <el-icon><VideoPlay /></el-icon> 继续
                </el-button>
                <el-button
                  type="danger"
                  size="large"
                  @click="stopRecording"
                >
                  <el-icon><VideoPause /></el-icon> 停止
                </el-button>
              </el-button-group>

              <el-button 
                v-if="recordingState === 'stopped'" 
                type="success" 
                size="large"
                :loading="isSubmitting"
                @click="submitRecording"
              >
                <el-icon><Upload /></el-icon> 提交评测
              </el-button>
            </div>

            <!-- 录制提示 -->
            <div class="recording-tips">
              <el-alert 
                title="录制提示" 
                type="info" 
                :closable="false"
                description="请在安静的环境中进行录制，确保音质清晰。支持MP3/WAV格式，最长5分钟，文件大小≤50MB。"
              />
            </div>

            <!-- 音频播放器 -->
            <div
              v-if="recordingState === 'stopped'"
              class="audio-player"
            >
              <div class="player-label">
                录制的音频：
              </div>
              <audio
                ref="audioPlayer"
                controls
                class="audio-element"
              >
                <source
                  :src="audioUrl"
                  type="audio/wav"
                >
                您的浏览器不支持音频播放
              </audio>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：信息面板 -->
        <el-col :span="8">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><InfoFilled /></el-icon> 评测说明</span>
              </div>
            </template>

            <div class="info-content">
              <div class="info-section">
                <h4>评测内容</h4>
                <ul>
                  <li>发音准确率</li>
                  <li>语调评分</li>
                  <li>流畅度评分</li>
                </ul>
              </div>

              <div class="info-section">
                <h4>评测标准</h4>
                <ul>
                  <li>0-100分评分制</li>
                  <li>逐句批改报告</li>
                  <li>标准发音示范</li>
                </ul>
              </div>

              <div class="info-section">
                <h4>技术特性</h4>
                <ul>
                  <li>AI自动评测</li>
                  <li>实时反馈</li>
                  <li>进度追踪</li>
                </ul>
              </div>

              <div class="info-section">
                <h4>会员权益</h4>
                <el-tag
                  type="success"
                  effect="plain"
                >
                  会员用户：≤1秒响应
                </el-tag>
                <el-tag effect="plain">
                  普通用户：≤3秒响应
                </el-tag>
              </div>
            </div>
          </el-card>

          <!-- 最近评测 -->
          <el-card
            class="recent-card"
            style="margin-top: 20px;"
          >
            <template #header>
              <div class="card-header">
                <span><el-icon><Clock /></el-icon> 最近评测</span>
                <el-button
                  type="primary"
                  link
                  @click="goToHistory"
                >
                  <el-icon><ArrowRight /></el-icon> 查看全部
                </el-button>
              </div>
            </template>

            <div
              v-if="recentAssessments.length > 0"
              class="recent-list"
            >
              <div
                v-for="assessment in recentAssessments.slice(0, 3)"
                :key="assessment.id" 
                class="recent-item"
                @click="viewAssessmentDetail(assessment)"
              >
                <div class="recent-score">
                  {{ assessment.accuracy_score }}
                </div>
                <div class="recent-info">
                  <div class="recent-time">
                    {{ formatDate(assessment.created_at) }}
                  </div>
                  <div class="recent-status">
                    <el-tag
                      :type="getScoreType(assessment.accuracy_score)"
                      size="small"
                    >
                      {{ getScoreLabel(assessment.accuracy_score) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            <el-empty
              v-else
              description="暂无评测记录"
              :image-size="60"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- 评测结果对话框 -->
      <el-dialog
        v-model="resultDialogVisible"
        title="评测结果"
        width="700px"
        @close="resetResultDialog"
      >
        <div
          v-if="assessmentResult"
          class="result-content"
        >
          <!-- 评分卡片 -->
          <el-row
            :gutter="20"
            class="score-cards"
          >
            <el-col :span="8">
              <div class="score-card">
                <div class="score-value">
                  {{ assessmentResult.accuracy_score }}
                </div>
                <div class="score-label">
                  发音准确率
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="score-card">
                <div class="score-value">
                  {{ assessmentResult.tone_score }}
                </div>
                <div class="score-label">
                  语调评分
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="score-card">
                <div class="score-value">
                  {{ assessmentResult.fluency_score }}
                </div>
                <div class="score-label">
                  流畅度评分
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- 逐句批改报告 -->
          <div class="report-section">
            <h4>逐句批改报告</h4>
            <div
              v-if="assessmentResult.sentence_reports && assessmentResult.sentence_reports.length > 0" 
              class="sentence-reports"
            >
              <div
                v-for="(report, index) in assessmentResult.sentence_reports"
                :key="index" 
                class="sentence-item"
              >
                <div class="sentence-number">
                  第{{ index + 1 }}句
                </div>
                <div class="sentence-text">
                  {{ report.text }}
                </div>
                <div
                  v-if="report.issues && report.issues.length > 0"
                  class="sentence-issues"
                >
                  <el-tag
                    v-for="(issue, i) in report.issues"
                    :key="i"
                    type="warning"
                    size="small"
                  >
                    {{ issue }}
                  </el-tag>
                </div>
                <div
                  v-else
                  class="sentence-perfect"
                >
                  <el-tag
                    type="success"
                    size="small"
                  >
                    完美
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 标准发音示范 -->
          <div class="reference-section">
            <h4>标准发音示范</h4>
            <audio
              controls
              class="reference-audio"
            >
              <source
                :src="assessmentResult.reference_audio_url"
                type="audio/mpeg"
              >
              您的浏览器不支持音频播放
            </audio>
          </div>

          <!-- 改进建议 -->
          <div
            v-if="assessmentResult.suggestions"
            class="suggestion-section"
          >
            <h4>改进建议</h4>
            <el-alert 
              :title="assessmentResult.suggestions" 
              type="info" 
              :closable="false"
            />
          </div>
        </div>
      </el-dialog>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生口语评测页面
 * 实现音频录制、预处理、提交评测、查看结果
 * 需求：20.1, 20.2, 20.3, 20.4, 20.8
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Microphone, RefreshRight, VideoPlay, VideoPause, Upload,
  InfoFilled, Clock, ArrowRight
} from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'
import { processAudioFile, audioBufferToWav, getAudioProcessor } from '@/utils/audio-processor'

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

interface AssessmentResult {
  id: number
  accuracy_score: number
  tone_score: number
  fluency_score: number
  sentence_reports: Array<{
    text: string
    issues: string[]
  }>
  reference_audio_url: string
  suggestions: string
  created_at: string
}

interface RecentAssessment {
  id: number
  accuracy_score: number
  created_at: string
}

const router = useRouter()

// 录制相关
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const audioUrl = ref('')
const recordingState = ref<RecordingState>('idle')
const recordingTime = ref(0)
const isInitializing = ref(false)
const isSubmitting = ref(false)
let recordingInterval: number | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animationId: number | null = null

// UI相关
const waveformCanvas = ref<HTMLCanvasElement | null>(null)
const audioPlayer = ref<HTMLAudioElement | null>(null)
const resultDialogVisible = ref(false)
const assessmentResult = ref<AssessmentResult | null>(null)
const recentAssessments = ref<RecentAssessment[]>([])

function getStatusText(): string {
  const statusMap: Record<RecordingState, string> = {
    idle: '准备就绪',
    recording: '正在录制...',
    paused: '已暂停',
    stopped: '已停止'
  }
  return statusMap[recordingState.value]
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

async function startRecording() {
  try {
    isInitializing.value = true
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // 初始化AudioContext用于波形显示
    audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 2048

    // 初始化MediaRecorder
    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data)
    }

    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
      audioUrl.value = URL.createObjectURL(audioBlob)
    }

    mediaRecorder.value.start()
    recordingState.value = 'recording'
    recordingTime.value = 0

    // 启动计时器
    recordingInterval = window.setInterval(() => {
      recordingTime.value++
      if (recordingTime.value >= 300) { // 5分钟限制
        stopRecording()
        ElMessage.warning('已达到最大录制时长（5分钟）')
      }
    }, 1000)

    // 启动波形动画
    drawWaveform()
    isInitializing.value = false
  } catch (error: unknown) {
    console.error('[口语评测] 获取麦克风权限失败:', error)
    ElMessage.error('无法访问麦克风，请检查权限设置')
    isInitializing.value = false
  }
}

function pauseRecording() {
  if (mediaRecorder.value && recordingState.value === 'recording') {
    mediaRecorder.value.pause()
    recordingState.value = 'paused'
    if (recordingInterval) clearInterval(recordingInterval)
    if (animationId) cancelAnimationFrame(animationId)
  }
}

function resumeRecording() {
  if (mediaRecorder.value && recordingState.value === 'paused') {
    mediaRecorder.value.resume()
    recordingState.value = 'recording'
    recordingInterval = window.setInterval(() => {
      recordingTime.value++
      if (recordingTime.value >= 300) {
        stopRecording()
        ElMessage.warning('已达到最大录制时长（5分钟）')
      }
    }, 1000)
    drawWaveform()
  }
}

function stopRecording() {
  if (mediaRecorder.value && recordingState.value !== 'idle') {
    mediaRecorder.value.stop()
    recordingState.value = 'stopped'
    if (recordingInterval) clearInterval(recordingInterval)
    if (animationId) cancelAnimationFrame(animationId)
    
    // 停止音频流
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
  }
}

function resetRecording() {
  if (recordingState.value !== 'idle') {
    ElMessageBox.confirm('确定要重新录制吗？当前录制将被丢弃。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      audioChunks.value = []
      audioUrl.value = ''
      recordingState.value = 'idle'
      recordingTime.value = 0
      if (recordingInterval) clearInterval(recordingInterval)
      if (animationId) cancelAnimationFrame(animationId)
    }).catch(() => {})
  }
}

function drawWaveform() {
  if (!waveformCanvas.value || !analyser) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    animationId = requestAnimationFrame(draw)
    analyser!.getByteFrequencyData(dataArray)

    ctx.fillStyle = '#f5f7fa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#409eff'
    ctx.lineWidth = 2
    ctx.beginPath()

    const sliceWidth = canvas.width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * canvas.height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
  }

  draw()
}

async function submitRecording() {
  if (audioChunks.value.length === 0) {
    ElMessage.error('请先录制音频')
    return
  }

  try {
    isSubmitting.value = true
    const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })

    // 检查文件大小
    if (audioBlob.size > 50 * 1024 * 1024) {
      ElMessage.error('文件大小超过50MB限制')
      return
    }

    // 预处理音频（降噪、格式转换）
    ElMessage.info('正在预处理音频...')
    const processor = getAudioProcessor()
    await processor.initWasm()
    
    const processResult = await processAudioFile(audioBlob, {
      noiseReduction: true,
      normalization: true
    })

    // 检查处理时间是否超过2秒
    if (processResult.processingTime > 2000) {
      console.warn(`[口语评测] 音频预处理耗时${processResult.processingTime.toFixed(0)}ms，超过2秒限制`)
    }

    // 将处理后的音频转换为WAV
    const processedWavBlob = await audioBufferToWav(processResult.audioBuffer)

    // 创建FormData用于上传
    const formData = new FormData()
    formData.append('audio', processedWavBlob, 'recording.wav')

    // 调用后端API进行评测
    const response = await request.post<{
      success?: boolean
      data?: AssessmentResult
    }>('/speech/assess', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (response.success && response.data) {
      assessmentResult.value = response.data
      resultDialogVisible.value = true
      ElMessage.success('评测完成！')
      
      // 刷新最近评测列表
      fetchRecentAssessments()
    }
  } catch (error: unknown) {
    console.error('[口语评测] 提交失败:', error)
    const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '评测提交失败，请稍后重试'
    ElMessage.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

async function fetchRecentAssessments() {
  try {
    const response = await request.get<{
      success?: boolean
      data?: { assessments: RecentAssessment[] }
    }>('/speech/assess/user/recent')

    if (response.success && response.data) {
      recentAssessments.value = response.data.assessments
    }
  } catch (error: unknown) {
    console.error('[口语评测] 获取最近评测失败:', error)
  }
}

function viewAssessmentDetail(assessment: RecentAssessment) {
  // 跳转到评测详情页面
  router.push(`/student/speech/${assessment.id}`)
}

function goToHistory() {
  router.push('/student/speech-history')
}

function resetResultDialog() {
  assessmentResult.value = null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function getScoreType(score: number): '' | 'success' | 'warning' | 'danger' {
  if (score >= 85) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 60) return '及格'
  return '需改进'
}

onMounted(() => {
  fetchRecentAssessments()
  
  // 初始化canvas大小
  nextTick(() => {
    if (waveformCanvas.value) {
      waveformCanvas.value.width = waveformCanvas.value.offsetWidth
      waveformCanvas.value.height = 200
    }
  })
})

onUnmounted(() => {
  if (recordingInterval) clearInterval(recordingInterval)
  if (animationId) cancelAnimationFrame(animationId)
  if (mediaRecorder.value && recordingState.value !== 'idle') {
    mediaRecorder.value.stop()
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
.speech-assessment-page { min-height: 100%; }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.recording-card { height: auto; }
.recording-status { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; }
.status-indicator.idle { color: #909399; }
.status-indicator.recording { color: #f56c6c; }
.status-indicator.paused { color: #e6a23c; }
.status-indicator.stopped { color: #67c23a; }

.pulse {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recording-time { font-size: 24px; font-weight: bold; color: #409eff; font-family: monospace; }

.waveform-container { margin: 20px 0; background: #f5f7fa; border-radius: 8px; overflow: hidden; }
.waveform { width: 100%; height: 200px; display: block; }

.recording-controls { display: flex; justify-content: center; gap: 12px; margin: 20px 0; }
.recording-controls :deep(.el-button) { min-width: 120px; }

.recording-tips { margin: 20px 0; }

.audio-player { margin-top: 20px; padding: 16px; background: #f5f7fa; border-radius: 8px; }
.player-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.audio-element { width: 100%; }

.info-card { height: auto; }
.info-content { }
.info-section { margin-bottom: 20px; }
.info-section h4 { margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 500; }
.info-section ul { margin: 0; padding-left: 20px; }
.info-section li { margin: 4px 0; font-size: 13px; color: #606266; }

.recent-card { }
.recent-list { display: flex; flex-direction: column; gap: 12px; }
.recent-item { padding: 12px; background: #f5f7fa; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 12px; }
.recent-item:hover { background: #ecf5ff; }
.recent-score { font-size: 24px; font-weight: bold; color: #409eff; min-width: 40px; text-align: center; }
.recent-info { flex: 1; }
.recent-time { font-size: 12px; color: #909399; }
.recent-status { margin-top: 4px; }

.result-content { }
.score-cards { margin-bottom: 20px; }
.score-card { text-align: center; padding: 16px; background: #f5f7fa; border-radius: 8px; }
.score-value { font-size: 32px; font-weight: bold; color: #409eff; }
.score-label { font-size: 13px; color: #909399; margin-top: 4px; }

.report-section { margin-bottom: 20px; }
.report-section h4 { margin: 0 0 12px 0; color: #333; }
.sentence-reports { display: flex; flex-direction: column; gap: 12px; }
.sentence-item { padding: 12px; background: #f5f7fa; border-radius: 8px; }
.sentence-number { font-size: 12px; color: #909399; margin-bottom: 4px; }
.sentence-text { font-size: 14px; color: #333; margin-bottom: 8px; }
.sentence-issues { display: flex; flex-wrap: wrap; gap: 4px; }
.sentence-perfect { }

.reference-section { margin-bottom: 20px; }
.reference-section h4 { margin: 0 0 12px 0; color: #333; }
.reference-audio { width: 100%; }

.suggestion-section { }
.suggestion-section h4 { margin: 0 0 12px 0; color: #333; }
</style>
