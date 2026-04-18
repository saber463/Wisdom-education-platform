<template>
  <div class="login-page">
    <!-- 动态背景 -->
    <div class="bg-layer">
      <!-- 渐变光晕 -->
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
      <!-- 网格纹理 -->
      <div class="grid-texture" />
      <!-- 浮动粒子 -->
      <div class="particles">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)" />
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="login-wrap">
      <!-- 左侧品牌区 -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-icon-wrap">
            <div class="brand-icon-glow" />
            <div class="brand-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L34 12V28L20 36L6 28V12L20 4Z" fill="url(#brandGrad)" opacity="0.9"/>
                <path d="M20 10L29 15V25L20 30L11 25V15L20 10Z" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
                <circle cx="20" cy="20" r="4" fill="white" opacity="0.9"/>
                <path d="M20 14V20M20 20L25 23" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="brandGrad" x1="6" y1="4" x2="34" y2="36">
                    <stop offset="0%" stop-color="#60a5fa"/>
                    <stop offset="100%" stop-color="#a78bfa"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h1 class="brand-title">智慧教育平台</h1>
          <p class="brand-slogan">智能学习 · AI辅助 · 个性化路径</p>

          <div class="feature-list">
            <div v-for="feat in features" :key="feat.text" class="feature-item">
              <div class="feature-dot" />
              <span>{{ feat.text }}</span>
            </div>
          </div>

          <div class="stats-row">
            <div v-for="s in stats" :key="s.label" class="stat-item">
              <div class="stat-val">{{ s.val }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-panel">
        <div class="form-card" :class="{ 'card-shake': shakeError }">
          <!-- 标题 -->
          <div class="form-header">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-subtitle">登录您的账户，继续学习之旅</p>
          </div>

          <!-- 快捷登录提示 -->
          <div class="quick-fill-group">
            <div class="quick-fill student" @click="quickFill('student')">
              <i class="fa fa-graduation-cap" />
              <span>学生登录</span>
            </div>
            <div class="quick-fill teacher" @click="quickFill('teacher')">
              <i class="fa fa-chalkboard-teacher" />
              <span>教师登录</span>
            </div>
            <div class="quick-fill parent" @click="quickFill('parent')">
              <i class="fa fa-user-friends" />
              <span>家长登录</span>
            </div>
            <div class="quick-fill vip" @click="quickFill('vip')">
              <i class="fa fa-crown" />
              <span>VIP 测试号</span>
            </div>
          </div>

          <form @submit.prevent="handleLogin" class="login-form" autocomplete="off">
            <!-- 邮箱 -->
            <div class="field-group" :class="{ focused: focused.email, hasVal: loginForm.email }">
              <label class="field-label">邮箱地址</label>
              <div class="field-wrap">
                <span class="field-prefix">
                  <i class="fa fa-envelope" />
                </span>
                <input
                  v-model="loginForm.email"
                  type="email"
                  class="field-input"
                  placeholder="example@edu.com"
                  autocomplete="username"
                  :disabled="isLoading"
                  @focus="focused.email = true"
                  @blur="focused.email = false"
                />
                <span v-if="loginForm.email" class="field-clear" @click="loginForm.email = ''">
                  <i class="fa fa-times-circle" />
                </span>
              </div>
            </div>

            <!-- 密码 -->
            <div class="field-group" :class="{ focused: focused.password, hasVal: loginForm.password }">
              <label class="field-label">登录密码</label>
              <div class="field-wrap">
                <span class="field-prefix">
                  <i class="fa fa-lock" />
                </span>
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="field-input"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  :disabled="isLoading"
                  @focus="focused.password = true"
                  @blur="focused.password = false"
                />
                <button
                  type="button"
                  class="field-eye"
                  @click="showPassword = !showPassword"
                  tabindex="-1"
                >
                  <i :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'" />
                </button>
              </div>
            </div>

            <!-- 辅助操作 -->
            <div class="form-extras">
              <label class="remember-wrap">
                <input type="checkbox" v-model="loginForm.rememberMe" class="remember-check" />
                <span class="remember-custom" />
                <span class="remember-text">记住我</span>
              </label>
              <router-link to="/forgot-password" class="forgot-link">
                忘记密码?
              </router-link>
            </div>

            <!-- 错误提示 -->
            <transition name="err-slide">
              <div v-if="errorMsg" class="error-banner">
                <i class="fa fa-exclamation-circle" />
                <span>{{ errorMsg }}</span>
              </div>
            </transition>

            <!-- 登录按钮 -->
            <button
              type="submit"
              class="submit-btn"
              :class="{ loading: isLoading }"
              :disabled="isLoading"
            >
              <span v-if="!isLoading" class="btn-inner">
                <i class="fa fa-sign-in-alt" />
                登 录
              </span>
              <span v-else class="btn-inner">
                <span class="spin-ring" />
                正在登录...
              </span>
              <div class="btn-shine" />
            </button>
          </form>

          <!-- 注册引导 -->
          <div class="register-prompt">
            <span>还没有账号?</span>
            <router-link to="/register" class="register-link">立即注册</router-link>
          </div>

          <!-- 分割线 -->
          <div class="divider"><span>安全登录保障</span></div>

          <!-- 安全标识 -->
          <div class="security-badges">
            <div v-for="b in badges" :key="b" class="security-badge">
              <i class="fa fa-shield-alt" />
              <span>{{ b }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';

const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false,
});

const isLoading = ref(false);
const showPassword = ref(false);
const errorMsg = ref('');
const shakeError = ref(false);
const focused = reactive({ email: false, password: false });

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

// 页面加载时检查URL参数，自动填入账号密码
if (route.query.email && route.query.password) {
  loginForm.email = route.query.email;
  loginForm.password = route.query.password;
  // 延迟一小会儿执行登录，确保 Vue 实例完全准备好
  setTimeout(() => handleLogin(), 500);
}

const features = [
  { text: 'AI 智能个性化学习路径规划' },
  { text: '实时评估与知识点掌握追踪' },
  { text: '多角色协同：学生、老师、家长' },
  { text: '海量优质课程资源一站获取' },
];

const stats = [
  { val: '10K+', label: '活跃学生' },
  { val: '500+', label: '学习路径' },
  { val: '98%', label: '满意度' },
];

const badges = ['SSL 加密', '数据安全', '隐私保护'];

// 随机粒子样式
const particleStyle = (i) => {
  const size = Math.random() * 4 + 2;
  const x = (i * 5.3 + Math.random() * 10) % 100;
  const y = (i * 7.1 + Math.random() * 10) % 100;
  const delay = (i * 0.4) % 8;
  const dur = 10 + (i % 6) * 3;
  return {
    width: size + 'px',
    height: size + 'px',
    left: x + '%',
    top: y + '%',
    animationDelay: delay + 's',
    animationDuration: dur + 's',
    opacity: (0.2 + (i % 5) * 0.08).toFixed(2),
  };
};

// 快速填充测试账号
const quickFill = (role) => {
  const accounts = {
    student: { email: 'student1@test.com', password: 'Student123!' },
    teacher: { email: 'teacher1@test.com', password: 'Teacher123!' },
    parent: { email: 'parent1@test.com', password: 'Parent123!' },
    vip: { email: 'vip_test@test.com', password: 'VipTest123!' }, // 专用 VIP 测试号
  };
  const acc = accounts[role];
  if (acc) {
    loginForm.email = acc.email;
    loginForm.password = acc.password;
    handleLogin(); // 自动点击登录
  }
};

const triggerShake = () => {
  shakeError.value = true;
  setTimeout(() => (shakeError.value = false), 600);
};

const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    errorMsg.value = '请填写邮箱和密码';
    triggerShake();
    return;
  }
  isLoading.value = true;
  errorMsg.value = '';
  try {
    // 1. 彻底清空所有可能的旧状态，防止任何形式的角色污染
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. 执行登录
    await userStore.login(loginForm.email, loginForm.password);
    
    // 3. 登录成功后，从 userStore 获取最准确的角色（使用最新推断逻辑）
    const role = userStore.userRole;
    console.log('登录成功，推断角色为:', role);

    // 4. 定义重定向目标
    let redirectPath = '/student';
    if (role === 'parent') redirectPath = '/parent';
    else if (role === 'teacher') redirectPath = '/teacher';
    else if (role === 'admin') redirectPath = '/teacher'; // 管理员默认去教师台（或专门管理页）
    
    // 5. 使用 window.location.href 强制刷新页面并跳转，彻底销毁旧的 Vue 实例
    window.location.href = redirectPath;
  } catch (error) {
    errorMsg.value = error.message || '登录失败，请检查邮箱和密码';
    triggerShake();
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* ===== 页面容器 ===== */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%);
  overflow: hidden;
  position: relative;
}

/* ===== 动态背景 ===== */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: orbFloat 12s ease-in-out infinite;
}
.orb-1 {
  width: 600px; height: 600px;
  top: -200px; left: -100px;
  background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
  animation-delay: 0s;
}
.orb-2 {
  width: 500px; height: 500px;
  bottom: -150px; right: -100px;
  background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
  animation-delay: -4s;
}
.orb-3 {
  width: 400px; height: 400px;
  top: 40%; left: 40%;
  background: radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%);
  animation-delay: -8s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 30px) scale(0.95); }
}

.grid-texture {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* 粒子 */
.particles { position: absolute; inset: 0; }
.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(59,130,246,0.4);
  animation: particleDrift linear infinite;
}
@keyframes particleDrift {
  0% { transform: translateY(20px) scale(0.8); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-120vh) scale(1.2); opacity: 0; }
}

/* ===== 主布局 ===== */
.login-wrap {
  display: flex;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* ===== 左侧品牌 ===== */
.brand-panel {
  display: none;
  flex: 1;
  padding: 60px 48px;
  justify-content: center;
  align-items: center;
  position: relative;
}
@media (min-width: 1024px) {
  .brand-panel { display: flex; }
}

.brand-content {
  max-width: 380px;
}

.brand-icon-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  margin-bottom: 24px;
}
.brand-icon-glow {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: iconGlow 3s ease-in-out infinite;
}
@keyframes iconGlow {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; }
}
.brand-icon {
  position: relative;
  width: 72px;
  height: 72px;
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(59,130,246,0.1);
}

.brand-title {
  font-size: 32px;
  font-weight: 800;
  color: #1e3a5f;
  margin-bottom: 8px;
}

.brand-slogan {
  font-size: 14px;
  color: rgba(30,58,95,0.6);
  margin-bottom: 40px;
  letter-spacing: 0.5px;
}

.feature-list {
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
  color: rgba(30,58,95,0.75);
}
.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(59,130,246,0.4);
}

.stats-row {
  display: flex;
  gap: 32px;
}
.stat-item { text-align: center; }
.stat-val {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-label {
  font-size: 12px;
  color: rgba(30,58,95,0.5);
  margin-top: 2px;
}

/* ===== 右侧表单 ===== */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  min-height: 100vh;
}

.form-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(30px) saturate(180%);
  border-radius: 24px;
  padding: 44px 40px 36px;
  border: 1px solid rgba(59,130,246,0.1);
  box-shadow:
    0 0 0 1px rgba(59,130,246,0.03),
    0 24px 64px rgba(0,0,0,0.08),
    0 4px 16px rgba(59,130,246,0.05);
  position: relative;
  overflow: hidden;
  transition: transform 0.1s;
}

.form-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #3b82f6);
}

.card-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}

/* 表单头部 */
.form-header { margin-bottom: 28px; }
.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #1e3a5f;
  margin-bottom: 6px;
}
.form-subtitle {
  font-size: 14px;
  color: rgba(30,58,95,0.5);
}

/* 快捷填充 */
.quick-fill-group {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.quick-fill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.quick-fill.student { color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); background: rgba(59,130,246,0.05); }
.quick-fill.teacher { color: #8b5cf6; border: 1px solid rgba(139,92,241,0.2); background: rgba(139,92,241,0.05); }
.quick-fill.parent { color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); background: rgba(245,158,11,0.05); }
.quick-fill.vip { color: #d97706; border: 1px solid rgba(217,119,6,0.2); background: rgba(217,119,6,0.05); }

.quick-fill:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.quick-fill.student:hover { border-color: #3b82f6; background: rgba(59,130,246,0.1); }
.quick-fill.teacher:hover { border-color: #8b5cf6; background: rgba(139,92,241,0.1); }
.quick-fill.parent:hover { border-color: #f59e0b; background: rgba(245,158,11,0.1); }
.quick-fill.vip:hover { border-color: #d97706; background: rgba(217,119,6,0.1); }

/* ===== 表单字段 ===== */
.field-group {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(30,58,95,0.7);
  margin-bottom: 8px;
  transition: color 0.2s;
}
.field-group.focused .field-label { color: #3b82f6; }

.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-prefix {
  position: absolute;
  left: 14px;
  color: rgba(30,58,95,0.4);
  font-size: 15px;
  z-index: 1;
  transition: color 0.2s;
}
.field-group.focused .field-prefix { color: #3b82f6; }

.field-input {
  width: 100%;
  padding: 13px 42px 13px 42px;
  background: rgba(59,130,246,0.04);
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 12px;
  color: #1e3a5f;
  font-size: 15px;
  outline: none;
  transition: all 0.25s;
  box-sizing: border-box;
}
.field-input::placeholder { color: rgba(30,58,95,0.4); }
.field-input:focus {
  border-color: rgba(59,130,246,0.5);
  background: rgba(59,130,246,0.08);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-clear, .field-eye {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: rgba(30,58,95,0.4);
  cursor: pointer;
  padding: 4px;
  font-size: 15px;
  transition: color 0.2s;
  line-height: 1;
}
.field-clear:hover, .field-eye:hover { color: rgba(30,58,95,0.7); }

/* ===== 辅助操作 ===== */
.form-extras {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.remember-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.remember-check { display: none; }
.remember-custom {
  width: 18px;
  height: 18px;
  border: 1.5px solid rgba(59,130,246,0.3);
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  background: rgba(59,130,246,0.04);
}
.remember-check:checked + .remember-custom {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-color: transparent;
}
.remember-check:checked + .remember-custom::after {
  content: '';
  width: 5px;
  height: 8px;
  border: 2px solid #fff;
  border-top: none;
  border-left: none;
  transform: rotate(45deg) translateY(-1px);
}
.remember-text {
  font-size: 13px;
  color: rgba(30,58,95,0.6);
}

.forgot-link {
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}
.forgot-link:hover { color: #2563eb; }

/* ===== 错误提示 ===== */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: #dc2626;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  margin-bottom: 16px;
}
.error-banner .fa { flex-shrink: 0; font-size: 14px; }

.err-slide-enter-active, .err-slide-leave-active {
  transition: all 0.25s ease;
}
.err-slide-enter-from { opacity: 0; transform: translateY(-8px); }
.err-slide-leave-to { opacity: 0; transform: translateY(-4px); }

/* ===== 提交按钮 ===== */
.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.5px;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(59,130,246,0.35);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}
.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}
.submit-btn.loading {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.btn-shine {
  position: absolute;
  top: 0; left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: skewX(-20deg);
  animation: btnShine 3s ease-in-out infinite;
}
@keyframes btnShine {
  0% { left: -100%; }
  50% { left: 150%; }
  100% { left: 150%; }
}

/* 加载圈 */
.spin-ring {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 注册引导 ===== */
.register-prompt {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: rgba(30,58,95,0.5);
}
.register-link {
  color: #3b82f6;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}
.register-link:hover { color: #2563eb; }

/* ===== 分割线 ===== */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(59,130,246,0.12);
}
.divider span {
  font-size: 11px;
  color: rgba(30,58,95,0.4);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

/* ===== 安全标识 ===== */
.security-badges {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.security-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(30,58,95,0.5);
}
.security-badge .fa { font-size: 10px; color: rgba(59,130,246,0.6); }

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .form-card {
    padding: 32px 24px 28px;
    border-radius: 20px;
  }
  .form-title { font-size: 22px; }
}
</style>
