<template>
  <!-- eslint-disable vue/no-v-html -- 课节/练习题内容来自受信任后端，已通过 formatContent 处理 -->
  <StudentLayout>
    <template #content>
      <div
        v-loading="loading"
        class="lesson-player"
      >
        <div
          v-if="lesson"
          class="player-container"
        >
          <!-- 视频播放器 -->
          <el-card class="video-card">
            <div class="video-wrapper">
              <video
                ref="videoPlayer"
                class="video-js vjs-big-play-centered"
                controls
                preload="auto"
                :poster="lesson.video_poster"
              >
                <source
                  :src="lesson.video_url"
                  type="video/mp4"
                >
              </video>
            </div>
            <div class="video-info">
              <h2>{{ lesson.title }}</h2>
              <p v-if="lesson.description">
                {{ lesson.description }}
              </p>
            </div>
          </el-card>

          <!-- 视频答题弹窗 -->
          <VideoQuizModal
            v-model="showQuizModal"
            :lesson-id="parseInt(route.params.id as string)"
            :trigger-time="quizTriggerTime"
            :question="quizQuestion"
            @submitted="handleQuizSubmitted"
          />

          <!-- 课节内容 -->
          <el-card class="content-card">
            <template #header>
              <h3>课节内容</h3>
            </template>
            <div
              class="lesson-content"
              v-html="formatContent(lesson.content)"
            />
            
            <!-- 代码示例 -->
            <div
              v-if="lesson.code_example"
              class="code-example"
            >
              <h4>代码示例</h4>
              <pre><code>{{ lesson.code_example }}</code></pre>
            </div>

            <!-- 练习题 -->
            <div
              v-if="lesson.exercise_content"
              class="exercise-content"
            >
              <h4>练习题</h4>
              <div v-html="formatContent(lesson.exercise_content)" />
            </div>
          </el-card>
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </div>
    </template>
  </StudentLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import '@videojs/themes/dist/city/index.css'
import request from '@/utils/request'
import StudentLayout from '@/components/StudentLayout.vue'
import VideoQuizModal from '@/components/VideoQuizModal.vue'

const route = useRoute()

const loading = ref(false)
const lesson = ref<Record<string, unknown> | null>(null)
const videoPlayer = ref<HTMLVideoElement | null>(null)
let player: ReturnType<typeof videojs> | null = null

let progressTimer: number | null = null
let quizCheckTimer: number | null = null

const showQuizModal = ref(false)
const quizTriggerTime = ref(0)
const quizQuestion = ref<Record<string, unknown> | null>(null)
const lastQuizCheckTime = ref(0)

async function loadLesson() {
  loading.value = true
  try {
    const lessonId = route.params.id
    // 这里需要根据实际的API调整
    // 假设有GET /api/lessons/:id接口
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>(`/lessons/${lessonId}`)
    if (response.code === 200) {
      lesson.value = response.data
      initVideoPlayer()
    }
  } catch (error) {
    console.error('加载课节失败:', error)
    ElMessage.error('加载课节失败')
  } finally {
    loading.value = false
  }
}

function initVideoPlayer() {
  if (!videoPlayer.value || !lesson.value) return

  // 初始化Video.js播放器
  player = videojs(videoPlayer.value, {
    controls: true,
    responsive: true,
    fluid: true,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    plugins: {}
  })

  // 加载视频进度
  loadVideoProgress()

  // 监听播放事件，每5秒记录一次进度
  player.on('timeupdate', () => {
    if (progressTimer) {
      clearTimeout(progressTimer)
    }
    progressTimer = window.setTimeout(() => {
      recordProgress()
    }, 5000)
  })

  // 监听暂停事件
  player.on('pause', () => {
    recordProgress(true)
  })

  // 监听播放结束
  player.on('ended', () => {
    recordProgress()
  })

  // 监听播放时间，检查是否需要触发答题
  player.on('timeupdate', () => {
    checkQuizTrigger()
  })
}

async function loadVideoProgress() {
  try {
    const lessonId = route.params.id
    const response = await request.get<{ code?: number; data?: unknown; msg?: string }>(`/video-progress/${lessonId}`)
    if (response.code === 200 && response.data) {
      const progress = response.data as { current_position?: number }
      if (player && progress.current_position != null) {
        player.currentTime(progress.current_position)
      }
    }
  } catch (error) {
    console.error('加载视频进度失败:', error)
  }
}

async function recordProgress(isPause = false) {
  if (!player || !lesson.value) return

  try {
    const currentTime = player.currentTime()
    const duration = player.duration()
    const playbackRate = player.playbackRate()

    await request.post('/video-progress/record', {
      lesson_id: parseInt(route.params.id as string),
      video_url: lesson.value.video_url,
      current_position: Math.floor(currentTime),
      duration: Math.floor(duration),
      playback_speed: playbackRate,
      pause_position: isPause ? Math.floor(currentTime) : undefined,
      pause_duration: isPause ? 1 : undefined
    })
  } catch (error) {
    console.error('记录视频进度失败:', error)
  }
}

async function checkQuizTrigger() {
  if (!player || !lesson.value || showQuizModal.value) return

  const currentTime = Math.floor(player.currentTime())
  
  // 每10秒检查一次，避免频繁请求
  if (currentTime - lastQuizCheckTime.value < 10) return
  
  lastQuizCheckTime.value = currentTime

  // 检查是否在10-20分钟范围内（600-1200秒）
  if (currentTime < 600 || currentTime > 1200) return

  try {
    const response = await request.get<{ code?: number; data?: { should_trigger?: boolean; trigger_time?: number; question?: unknown }; msg?: string }>(`/video-quiz/trigger/${route.params.id}`)
    const data = response.data as { should_trigger?: boolean; trigger_time?: number; question?: unknown } | undefined
    if (response.code === 200 && data?.should_trigger) {
      const triggerTime = data.trigger_time ?? 0
      if (Math.abs(currentTime - triggerTime) <= 5) {
        quizTriggerTime.value = currentTime
        quizQuestion.value = data.question
        player.pause() // 暂停播放
        showQuizModal.value = true
      }
    }
  } catch (error) {
    console.error('检查答题触发失败:', error)
  }
}

function handleQuizSubmitted(result: { is_correct: boolean; reward?: number }) {
  if (result.is_correct) {
    ElMessage.success(`回答正确！获得${result.reward}积分`)
  } else {
    ElMessage.warning('回答错误，已添加到错题本')
  }
  
  // 继续播放
  if (player) {
    player.play()
  }
}

function formatContent(content: string): string {
  if (!content) return ''
  // 简单的Markdown转换（实际应该使用markdown解析库）
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

onMounted(() => {
  loadLesson()
})

onBeforeUnmount(() => {
  if (progressTimer) {
    clearTimeout(progressTimer)
  }
  if (quizCheckTimer) {
    clearInterval(quizCheckTimer)
  }
  if (player) {
    player.dispose()
  }
})
</script>

<style scoped>
.lesson-player {
  @apply p-6;
}

.player-container {
  @apply max-w-6xl mx-auto;
}

.video-card {
  @apply mb-6;
}

.video-wrapper {
  @apply mb-4;
}

.video-info h2 {
  @apply text-2xl font-bold text-gray-800 mb-2;
}

.video-info p {
  @apply text-gray-600;
}

.content-card {
  @apply mb-6;
}

.lesson-content {
  @apply prose max-w-none;
}

.code-example {
  @apply mt-6;
}

.code-example h4 {
  @apply text-lg font-semibold mb-2;
}

.code-example pre {
  @apply bg-gray-100 p-4 rounded-lg overflow-x-auto;
}

.code-example code {
  @apply text-sm;
}

.exercise-content {
  @apply mt-6;
}

.exercise-content h4 {
  @apply text-lg font-semibold mb-2;
}
</style>

