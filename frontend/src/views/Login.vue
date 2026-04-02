<template>
  <div class="login-page">
    <!-- 数字雨背景画布 -->
    <canvas ref="rainCanvas" class="rain-canvas"></canvas>

    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-logo">⚡</div>
        <h1 class="brand-title">EduAI</h1>
        <p class="brand-subtitle">智慧教育学习平台 · V2.0</p>
        <div class="brand-features">
          <div class="feature-item" v-for="f in features" :key="f.text">
            <span class="feature-icon">{{ f.icon }}</span>
            <span>{{ f.text }}</span>
          </div>
        </div>
        <div class="brand-stats">
          <div class="stat-item">
            <div class="stat-num">3,120+</div>
            <div class="stat-label">在读学生</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">98.6%</div>
            <div class="stat-label">好评率</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">6</div>
            <div class="stat-label">精品课程</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="login-panel">
      <div class="login-card">
        <!-- 标题 -->
        <div class="login-header">
          <h2>欢迎回来</h2>
          <p>WELCOME BACK</p>
        </div>

        <!-- 角色切换 -->
        <div class="role-tabs">
          <button
            v-for="r in roles"
            :key="r.key"
            class="role-tab"
            :class="{ active: selectedRole === r.key }"
            @click="selectRole(r)"
          >
            <span class="role-emoji">{{ r.emoji }}</span>
            <span>{{ r.label }}</span>
          </button>
        </div>

        <!-- 登录表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <div class="input-wrapper">
              <span class="input-prefix">
                <el-icon><User /></el-icon>
              </span>
              <el-input
                v-model="loginForm.username"
                :placeholder="`请输入${currentRole.label}用户名`"
                size="large"
                class="dark-input"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-wrapper">
              <span class="input-prefix">
                <el-icon><Lock /></el-icon>
              </span>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                class="dark-input"
                @keyup.enter="handleLogin"
              />
            </div>
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>验证中...</span>
          </el-button>
        </el-form>

        <!-- 快速填充 -->
        <div class="quick-fill">
          <p class="quick-label">// 演示账号快速填充</p>
          <div class="quick-btns">
            <button
              v-for="r in roles"
              :key="r.key"
              class="quick-btn"
              @click="fillTestAccount(r.key)"
            >
              {{ r.emoji }} {{ r.label }}
            </button>
          </div>
          <p class="pwd-hint">默认密码：teacher123 / student123 / parent123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const rainCanvas = ref<HTMLCanvasElement>()

const loginForm = reactive({ username: '', password: '' })
const loading = ref(false)
const selectedRole = ref<'teacher' | 'student' | 'parent'>('student')

const roles = [
  { key: 'student' as const, label: '学生', emoji: '📚', user: 'student001', pwd: 'student123' },
  { key: 'teacher' as const, label: '教师', emoji: '🎓', user: 'teacher001', pwd: 'teacher123' },
  { key: 'parent'  as const, label: '家长', emoji: '👨‍👩‍👧', user: 'parent001',  pwd: 'parent123'  },
]

const features = [
  { icon: '🤖', text: 'AI智能批改 · 毫秒级反馈' },
  { icon: '🛡️', text: 'FaceGuard · 防刷课系统' },
  { icon: '📊', text: '实时学情分析 · 精准推荐' },
  { icon: '💻', text: '在线代码编辑器 · 多语言' },
]

const currentRole = computed(() => roles.find(r => r.key === selectedRole.value)!)

function selectRole(r: typeof roles[0]) {
  selectedRole.value = r.key
  loginForm.username = ''
  loginForm.password = ''
}

function fillTestAccount(role: 'teacher' | 'student' | 'parent') {
  const r = roles.find(x => x.key === role)!
  selectedRole.value = role
  loginForm.username = r.user
  loginForm.password = r.pwd
}

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!loginFormRef.value) return
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    loading.value = true
    const response = await userStore.login({ username: loginForm.username, password: loginForm.password })
    ElMessage.success(`欢迎回来，${response.user.realName}！`)
    const redirect = route.query.redirect as string
    router.push(redirect || userStore.getHomePath())
  } catch (error: unknown) {
    ElMessage.error((error instanceof Error ? error.message : null) || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

// ===== 数字雨动画 =====
let animFrame: number
function initRain() {
  const canvas = rainCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ'.split('')
  const cols = Math.floor(canvas.width / 18)
  const drops: number[] = Array(cols).fill(1)

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#00FF94'
    ctx.font = '14px Consolas, monospace'
    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillText(char, i * 18, drops[i] * 18)
      if (drops[i] * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0
      drops[i]++
    }
    animFrame = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(() => {
  setTimeout(initRain, 100)
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: #0A0A0A;
  position: relative;
  overflow: hidden;
}

/* 数字雨画布 */
.rain-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.12;
  pointer-events: none;
}

/* ===== 左侧品牌区 ===== */
.login-brand {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  z-index: 1;
}

.brand-content {
  max-width: 420px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #00FF94, #00D4FF);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 24px;
  box-shadow: 0 0 40px rgba(0, 255, 148, 0.4);
}

.brand-title {
  font-size: 52px;
  font-weight: 900;
  background: linear-gradient(135deg, #00FF94, #00D4FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: Consolas, monospace;
  letter-spacing: 2px;
  margin: 0 0 8px 0;
}

.brand-subtitle {
  font-size: 14px;
  color: #606060;
  font-family: Consolas, monospace;
  letter-spacing: 1px;
  margin: 0 0 40px 0;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #808080;
  font-family: Consolas, monospace;
}

.feature-icon {
  font-size: 18px;
  width: 28px;
  flex-shrink: 0;
}

.brand-stats {
  display: flex;
  gap: 32px;
}

.stat-item { text-align: center; }

.stat-num {
  font-size: 22px;
  font-weight: 900;
  background: linear-gradient(135deg, #00FF94, #00D4FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: Consolas, monospace;
}

.stat-label {
  font-size: 11px;
  color: #505050;
  margin-top: 2px;
  letter-spacing: 1px;
}

/* ===== 右侧登录区 ===== */
.login-panel {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  z-index: 1;
  background: rgba(17, 17, 17, 0.9);
  border-left: 1px solid rgba(0, 255, 148, 0.1);
  backdrop-filter: blur(20px);
}

.login-card { width: 100%; max-width: 360px; }

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 900;
  color: #F0F0F0;
  margin: 0 0 4px 0;
}

.login-header p {
  font-size: 11px;
  color: #404040;
  font-family: Consolas, monospace;
  letter-spacing: 4px;
  margin: 0;
}

/* 角色切换 */
.role-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 4px;
}

.role-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #606060;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-tab:hover { color: #A0A0A0; background: rgba(255,255,255,0.04); }

.role-tab.active {
  background: rgba(0, 255, 148, 0.12);
  color: #00FF94;
  border: 1px solid rgba(0, 255, 148, 0.25);
  text-shadow: 0 0 10px rgba(0, 255, 148, 0.4);
}

.role-emoji { font-size: 16px; }

/* 输入框 */
.input-wrapper {
  position: relative;
  width: 100%;
}

.input-prefix {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #404040;
  z-index: 2;
  font-size: 16px;
  pointer-events: none;
}

.dark-input :deep(.el-input__wrapper) {
  background: #141414 !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  padding-left: 42px !important;
  height: 48px !important;
  transition: all 0.2s ease !important;
}

.dark-input :deep(.el-input__wrapper:hover) {
  border-color: rgba(0,255,148,0.3) !important;
}

.dark-input :deep(.el-input__wrapper.is-focus) {
  border-color: #00FF94 !important;
  box-shadow: 0 0 0 2px rgba(0,255,148,0.12) !important;
}

.dark-input :deep(.el-input__inner) {
  color: #E0E0E0 !important;
  font-size: 14px !important;
  background: transparent !important;
}

.dark-input :deep(.el-input__inner::placeholder) { color: #404040 !important; }

.login-form :deep(.el-form-item) { margin-bottom: 16px; }
.login-form :deep(.el-form-item__error) {
  color: #FF4B6E;
  font-size: 12px;
}

/* 登录按钮 */
.login-btn {
  width: 100% !important;
  height: 50px !important;
  background: linear-gradient(135deg, #00FF94, #00D4FF) !important;
  border: none !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  color: #000 !important;
  letter-spacing: 4px !important;
  box-shadow: 0 4px 24px rgba(0, 255, 148, 0.35) !important;
  transition: all 0.25s ease !important;
  margin-top: 8px;
}

.login-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 32px rgba(0, 255, 148, 0.5) !important;
}

/* 快速填充 */
.quick-fill {
  margin-top: 28px;
  text-align: center;
}

.quick-label {
  font-size: 11px;
  color: #404040;
  font-family: Consolas, monospace;
  margin-bottom: 12px;
}

.quick-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 12px;
}

.quick-btn {
  padding: 6px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  color: #808080;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: rgba(0,255,148,0.08);
  border-color: rgba(0,255,148,0.25);
  color: #00FF94;
}

.pwd-hint {
  font-size: 11px;
  color: #404040;
  font-family: Consolas, monospace;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .login-brand { display: none; }
  .login-panel { width: 100%; padding: 24px; border-left: none; }
}
</style>
