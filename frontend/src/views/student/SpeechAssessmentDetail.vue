<template>
  <StudentLayout>
    <div
      v-if="assessment"
      class="assessment-detail-page"
    >
      <!-- 返回按钮 -->
      <div class="back-button">
        <el-button
          type="primary"
          link
          @click="goBack"
        >
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <!-- 评测信息卡片 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span><el-icon><InfoFilled /></el-icon> 评测信息</span>
            <span class="assessment-time">{{ formatDate(assessment.created_at) }}</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">
                评测状态
              </div>
              <el-tag type="success">
                已完成
              </el-tag>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">
                音频时长
              </div>
              <div class="info-value">
                {{ assessment.duration }}秒
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">
                处理时间
              </div>
              <div class="info-value">
                {{ assessment.processing_time }}ms
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-label">
                会员等级
              </div>
              <el-tag>{{ assessment.member_level || '普通用户' }}</el-tag>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 评分卡片 -->
      <el-row
        :gutter="20"
        class="score-row"
      >
        <el-col :span="8">
          <el-card class="score-card">
            <div class="score-content">
              <div class="score-value">
                {{ assessment.accuracy_score }}
              </div>
              <div class="score-label">
                发音准确率
              </div>
              <div class="score-bar">
                <el-progress 
                  :percentage="assessment.accuracy_score" 
                  :color="getScoreColor(assessment.accuracy_score)"
                />
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="score-card">
            <div class="score-content">
              <div class="score-value">
                {{ assessment.tone_score }}
              </div>
              <div class="score-label">
                语调评分
              </div>
              <div class="score-bar">
                <el-progress 
                  :percentage="assessment.tone_score" 
                  :color="getScoreColor(assessment.tone_score)"
                />
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="score-card">
            <div class="score-content">
              <div class="score-value">
                {{ assessment.fluency_score }}
              </div>
              <div class="score-label">
                流畅度评分
              </div>
              <div class="score-bar">
                <el-progress 
                  :percentage="assessment.fluency_score" 
                  :color="getScoreColor(assessment.fluency_score)"
                />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 总体评分 -->
      <el-card class="overall-card">
        <template #header>
          <div class="card-header">
            <span><el-icon><Trophy /></el-icon> 总体评分</span>
          </div>
        </template>

        <div class="overall-content">
          <div class="overall-score">
            <div class="score-circle">
              <div class="score-number">
                {{ overallScore }}
              </div>
              <div class="score-text">
                分
              </div>
            </div>
          </div>
          <div class="overall-level">
            <div class="level-label">
              评级
            </div>
            <el-tag
              :type="getScoreLevelType(overallScore)"
              size="large"
            >
              {{ getScoreLevel(overallScore) }}
            </el-tag>
          </div>
          <div class="overall-feedback">
            <div class="feedback-label">
              评价
            </div>
            <div class="feedback-text">
              {{ getScoreFeedback(overallScore) }}
            </div>
          </div>
        </div>
      </el-card>

      <!-- 逐句批改报告 -->
      <el-card class="report-card">
        <template #header>
          <div class="card-header">
            <span><el-icon><Document /></el-icon> 逐句批改报告</span>
            <span class="sentence-count">共{{ assessment.sentence_reports?.length || 0 }}句</span>
          </div>
        </template>

        <div
          v-if="assessment.sentence_reports && assessment.sentence_reports.length > 0" 
          class="sentence-reports"
        >
          <div
            v-for="(report, index) in assessment.sentence_reports"
            :key="index" 
            class="sentence-item"
          >
            <div class="sentence-header">
              <span class="sentence-number">第{{ index + 1 }}句</span>
              <el-tag
                v-if="!report.issues || report.issues.length === 0"
                type="success"
                size="small"
              >
                完美
              </el-tag>
              <el-tag
                v-else
                type="warning"
                size="small"
              >
                {{ report.issues.length }}个问题
              </el-tag>
            </div>
            
            <div class="sentence-text">
              {{ report.text }}
            </div>
            
            <div
              v-if="report.issues && report.issues.length > 0"
              class="sentence-issues"
            >
              <div class="issues-label">
                问题标注：
              </div>
              <div class="issues-list">
                <el-tag
                  v-for="(issue, i) in report.issues"
                  :key="i"
                  type="warning"
                  effect="plain"
                >
                  {{ issue }}
                </el-tag>
              </div>
            </div>

            <div
              v-if="report.score !== undefined"
              class="sentence-score"
            >
              <span class="score-label">句子评分：</span>
              <span class="score-value">{{ report.score }}/100</span>
            </div>
          </div>
        </div>
        <el-empty
          v-else
          description="暂无批改报告"
        />
      </el-card>

      <!-- 标准发音示范 -->
      <el-card class="reference-card">
        <template #header>
          <div class="card-header">
            <span><el-icon><VideoPlay /></el-icon> 标准发音示范</span>
          </div>
        </template>

        <div class="reference-content">
          <div class="reference-label">
            点击下方按钮播放标准发音：
          </div>
          <audio
            controls
            class="reference-audio"
          >
            <source
              :src="assessment.reference_audio_url"
              type="audio/mpeg"
            >
            您的浏览器不支持音频播放
          </audio>
          <div class="reference-tips">
            <el-alert 
              title="学习建议" 
              type="info" 
              :closable="false"
              description="请仔细对比标准发音和你的录音，注意发音、语调和流畅度的差异。"
            />
          </div>
        </div>
      </el-card>

      <!-- 改进建议 -->
      <el-card class="suggestion-card">
        <template #header>
          <div class="card-header">
            <span><el-icon><ReadingLamp /></el-icon> 改进建议</span>
          </div>
        </template>

        <div class="suggestion-content">
          <el-alert 
            :title="assessment.suggestions || '暂无建议'" 
            type="success" 
            :closable="false"
            :description="getSuggestionDescription()"
          />
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="goBack">
          返回列表
        </el-button>
        <el-button
          type="primary"
          @click="retakeAssessment"
        >
          重新评测
        </el-button>
        <el-button
          type="success"
          @click="downloadReport"
        >
          下载报告
        </el-button>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup lang="ts">
/**
 * 学生口语评测详情页面
 * 显示发音准确率、语调、流畅度评分
 * 显示逐句批改报告、播放标准发音示范
 * 需求：20.4, 20.8
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, InfoFilled, Trophy, Document, VideoPlay, ReadingLamp
} from '@element-plus/icons-vue'
import StudentLayout from '@/components/StudentLayout.vue'
import request from '@/utils/request'

interface SentenceReport {
  text: string
  issues: string[]
  score?: number
}

interface AssessmentDetail {
  id: number
  accuracy_score: number
  tone_score: number
  fluency_score: number
  sentence_reports: SentenceReport[]
  reference_audio_url: string
  suggestions: string
  created_at: string
  duration?: number
  processing_time?: number
  member_level?: string
}

const route = useRoute()
const router = useRouter()
const assessment = ref<AssessmentDetail | null>(null)
const loading = ref(true)

const overallScore = computed(() => {
  if (!assessment.value) return 0
  return Math.round(
    (assessment.value.accuracy_score + 
     assessment.value.tone_score + 
     assessment.value.fluency_score) / 3
  )
})

async function fetchAssessmentDetail() {
  try {
    loading.value = true
    const assessmentId = route.params.id as string
    
    const response = await request.get<{
      success?: boolean
      data?: AssessmentDetail
    }>(`/speech/assess/${assessmentId}`)

    if (response.success && response.data) {
      assessment.value = response.data
    } else {
      ElMessage.error('获取评测详情失败')
    }
  } catch (error: unknown) {
    console.error('[口语评测] 获取详情失败:', error)
    ElMessage.error('获取评测详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#00FF94'
  if (score >= 70) return '#e6a23c'
  if (score >= 60) return '#FFB700'
  return '#909399'
}

function getScoreLevel(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '及格'
  if (score >= 60) return '需改进'
  return '不及格'
}

function getScoreLevelType(score: number): '' | 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

function getScoreFeedback(score: number): string {
  if (score >= 90) return '你的发音非常标准，继续保持！'
  if (score >= 80) return '你的发音很不错，再加油就能更完美！'
  if (score >= 70) return '你的发音基本正确，需要多加练习。'
  if (score >= 60) return '你的发音需要改进，建议多听标准发音。'
  return '你的发音需要大幅改进，建议从基础开始学习。'
}

function getSuggestionDescription(): string {
  if (!assessment.value) return ''
  
  const suggestions: string[] = []
  
  if (assessment.value.accuracy_score < 80) {
    suggestions.push('• 发音准确率较低，建议多听标准发音并模仿练习')
  }
  if (assessment.value.tone_score < 80) {
    suggestions.push('• 语调需要改进，注意语音的抑扬顿挫')
  }
  if (assessment.value.fluency_score < 80) {
    suggestions.push('• 流畅度不够，建议放慢速度，确保每个音节清晰')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('• 你的表现很好，继续保持！')
  }
  
  return suggestions.join('\n')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goBack() {
  router.back()
}

function retakeAssessment() {
  router.push('/student/speech')
}

function downloadReport() {
  ElMessage.info('功能开发中...')
  // TODO: 实现报告下载功能
}

onMounted(() => {
  fetchAssessmentDetail()
})
</script>

<style scoped>
.assessment-detail-page { min-height: 100%; padding-bottom: 40px; }

.back-button { margin-bottom: 20px; }

.info-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.assessment-time { font-size: 13px; color: #909399; }

.info-item { }
.info-label { font-size: 12px; color: #909399; margin-bottom: 8px; }
.info-value { font-size: 16px; color: #F0F0F0; font-weight: 500; }

.score-row { margin-bottom: 20px; }
.score-card { }
.score-content { text-align: center; padding: 20px 0; }
.score-value { font-size: 48px; font-weight: bold; color: #00FF94; }
.score-label { font-size: 14px; color: #909399; margin: 8px 0; }
.score-bar { margin-top: 12px; }

.overall-card { margin-bottom: 20px; }
.overall-content { display: flex; align-items: center; gap: 40px; padding: 20px 0; }
.overall-score { flex: 1; }
.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00D4FF, #0099BB);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto;
}
.score-number { font-size: 48px; font-weight: bold; }
.score-text { font-size: 14px; }

.overall-level { flex: 1; }
.level-label { font-size: 12px; color: #909399; margin-bottom: 8px; }

.overall-feedback { flex: 1; }
.feedback-label { font-size: 12px; color: #909399; margin-bottom: 8px; }
.feedback-text { font-size: 14px; color: #F0F0F0; line-height: 1.6; }

.report-card { margin-bottom: 20px; }
.sentence-count { font-size: 13px; color: #909399; }

.sentence-reports { display: flex; flex-direction: column; gap: 16px; }
.sentence-item { padding: 16px; background: #2a2a2a; border-radius: 8px; }
.sentence-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.sentence-number { font-weight: 500; color: #F0F0F0; }
.sentence-text { font-size: 14px; color: #F0F0F0; margin: 8px 0; line-height: 1.6; }
.sentence-issues { margin-top: 8px; }
.issues-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
.issues-list { display: flex; flex-wrap: wrap; gap: 4px; }
.sentence-score { margin-top: 8px; font-size: 13px; color: #909399; }
.score-label { }
.score-value { font-weight: 500; color: #00FF94; }

.reference-card { margin-bottom: 20px; }
.reference-content { }
.reference-label { font-size: 14px; color: #F0F0F0; margin-bottom: 12px; }
.reference-audio { width: 100%; margin-bottom: 12px; }
.reference-tips { }

.suggestion-card { margin-bottom: 20px; }
.suggestion-content { }

.action-buttons { display: flex; justify-content: center; gap: 12px; margin-top: 40px; }
.action-buttons :deep(.el-button) { min-width: 120px; }
</style>
