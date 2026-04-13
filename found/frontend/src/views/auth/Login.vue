<template>
  <div class="login-container">
    <!-- 背景图片层 -->
    <div class="background-image" />

    <!-- 背景遮罩层 -->
    <div class="background-overlay" />

    <!-- 编程风格背景 -->
    <div class="programming-background">
      <!-- 01效果背景 -->
      <BinaryBackground />

      <!-- 代码行效果 -->
      <div class="code-lines">
        <div
          v-for="(code, index) in codeLines"
          :key="index"
          class="code-line"
          :style="{ '--line-index': index + 1 }"
          :data-code="code"
        />
      </div>
      <div class="glowing-orbs">
        <div class="orb orb-1" />
        <div class="orb orb-2" />
        <div class="orb orb-3" />
      </div>
    </div>

    <!-- 编程语言流动文本 -->
    <ProgrammingLanguagesFlow :languages="programmingLanguages" />

    <!-- 登录表单 -->
    <div class="login-form-container">
      <div class="login-form">
        <h2 class="form-title">登录到学习AI平台</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="loginForm.email"
              type="email"
              placeholder="请输入邮箱"
              required
              :disabled="isLoading"
            />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              required
              :disabled="isLoading"
            />
          </div>
          <div class="form-options">
            <div class="remember-me">
              <input id="remember-me" type="checkbox" v-model="loginForm.rememberMe" />
              <label for="remember-me">记住我</label>
            </div>
            <router-link to="/forgot-password" class="forgot-password"> 忘记密码? </router-link>
          </div>
          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner" />
            <span>{{ isLoading ? '登录中...' : '登录' }}</span>
          </button>
        </form>
        <div class="register-link">
          <span>还没有账号?</span>
          <router-link to="/register"> 立即注册 </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import ProgrammingLanguagesFlow from '@/components/common/ProgrammingLanguagesFlow.vue';
import BinaryBackground from '@/components/common/BinaryBackground.vue';

// 生成随机的01数字流
const generateBinaryString = () => {
  let binary = '';
  for (let i = 0; i < 50; i++) {
    binary += Math.random() > 0.5 ? '1' : '0';
  }
  return binary;
};

// 生成20行不同的01数字流
const codeLines = ref(Array.from({ length: 20 }, () => generateBinaryString()));

// 表单数据
const loginForm = ref({
  email: '',
  password: '',
  rememberMe: false,
});

// 状态管理
const isLoading = ref(false);
const errorMsg = ref('');
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const _nextPath = route.query.redirect || '/';

// 添加缺失的编程语言数组定义
const programmingLanguages = [
  { text: 'Python', color: '#3776AB' },
  { text: 'JavaScript', color: '#F7DF1E' },
  { text: 'Java', color: '#007396' },
  { text: 'C++', color: '#00599C' },
  { text: 'C#', color: '#239120' },
  { text: 'HTML', color: '#E34F26' },
  { text: 'CSS', color: '#1572B6' },
  { text: 'React', color: '#61DAFB' },
  { text: 'Vue', color: '#4FC08D' },
  { text: 'Angular', color: '#DD0031' },
  { text: 'SQL', color: '#003B57' },
  { text: 'PHP', color: '#777BB4' },
  { text: 'Ruby', color: '#CC342D' },
  { text: 'Go', color: '#00ADD8' },
  { text: 'Rust', color: '#DEA584' },
  { text: 'Swift', color: '#FA7343' },
  { text: 'Kotlin', color: '#F18E33' },
  { text: 'TypeScript', color: '#3178C6' },
  { text: 'Dart', color: '#0175C2' },
  { text: 'Shell', color: '#89E051' },
];

// 处理登录
const handleLogin = async () => {
  isLoading.value = true;
  errorMsg.value = '';

  try {
    // 调用用户登录方法
    await userStore.login(loginForm.value.email, loginForm.value.password);

    // 登录成功后，获取重定向路径或默认跳转到首页
    const redirectPath = router.currentRoute.value.query.redirect || '/';

    // 跳转到首页或重定向路径
    router.push(redirectPath);
  } catch (error) {
    errorMsg.value = error.message || '登录失败，请检查邮箱和密码';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Arial', sans-serif;
}

/* 背景图片层 */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/images/login-background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -3;
}

.background-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  z-index: 1;
}

/* 背景遮罩层 */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(15, 15, 35, 0.85) 0%,
    rgba(26, 26, 46, 0.85) 50%,
    rgba(22, 33, 62, 0.85) 100%
  );
  z-index: -2;
}

/* 编程风格背景 */
.programming-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

/* 代码行效果 */
.code-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.15;
}

.code-line {
  position: absolute;
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, var(--tech-blue), transparent);
  animation: code-line-pulse 3s ease-in-out infinite;
  left: calc(var(--line-index) * 5%);
  top: calc(var(--line-index) * 2%);
}

.code-line::before {
  content: attr(data-code);
  position: absolute;
  top: 0;
  left: 5px;
  color: var(--tech-blue);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: nowrap;
  animation: code-flow 8s linear infinite;
  opacity: 0;
}

.code-line:nth-child(odd) {
  animation-delay: 1s;
}

.code-line:nth-child(even) {
  animation-delay: 2s;
}

@keyframes code-line-pulse {
  0%,
  100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes code-flow {
  0% {
    transform: translateY(-200px);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

.code-line {
  --line-index: attr(data-index number);
}

@keyframes code-line-pulse {
  0%,
  100% {
    opacity: 0.1;
    height: 20%;
  }
  50% {
    opacity: 0.3;
    height: 60%;
  }
}

/* 发光球体效果 */
.glowing-orbs {
  position: absolute;
  width: 100%;
  height: 100%;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: orb-float 15s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: var(--tech-green);
  top: 10%;
  left: 10%;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: var(--tech-blue);
  bottom: 10%;
  right: 20%;
  animation-delay: 5s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: var(--tech-pink);
  top: 50%;
  right: 10%;
  animation-delay: 10s;
}

@keyframes orb-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}

/* 登录表单容器 */
.login-form-container {
  position: relative;
  z-index: 1;
  animation: form-fade-in 1s ease-out;
}

/* 登录表单 */
.login-form {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 40px;
  width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.login-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--tech-blue), var(--tech-purple), var(--tech-pink));
}

/* 表单标题 */
.form-title {
  text-align: center;
  color: #ffffff;
  font-size: 28px;
  margin-bottom: 32px;
  font-weight: 700;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 表单组 */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 16px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.form-group input:focus {
  outline: none;
  border-color: var(--tech-blue);
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input[type='checkbox'] {
  margin-right: 8px;
  width: 18px;
  height: 18px;
  accent-color: var(--tech-blue);
  cursor: pointer;
}

.remember-me label {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}

.forgot-password {
  color: var(--tech-blue);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.forgot-password:hover {
  color: var(--tech-purple);
  text-shadow: 0 0 10px rgba(114, 9, 183, 0.5);
  transform: translateX(2px);
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0, 242, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 242, 255, 0.6);
}

.login-button:hover:not(:disabled)::before {
  left: 100%;
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 注册链接 */
.register-link {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.register-link span {
  margin-right: 5px;
}

.register-link a {
  color: var(--tech-blue);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.register-link a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--tech-blue), var(--tech-purple));
  transition: width 0.3s ease;
}

.register-link a:hover {
  color: var(--tech-purple);
  text-shadow: 0 0 10px rgba(114, 9, 183, 0.5);
}

.register-link a:hover::after {
  width: 100%;
}

/* 表单淡入动画 */
@keyframes form-fade-in {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-form {
    width: 340px;
    padding: 36px 28px;
  }

  .form-title {
    font-size: 24px;
    margin-bottom: 28px;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .remember-me,
  .forgot-password {
    width: 100%;
  }
}
</style>
