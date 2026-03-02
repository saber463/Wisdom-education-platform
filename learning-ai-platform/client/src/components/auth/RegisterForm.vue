<template>
  <div class="register-form-container">
    <div class="register-form">
      <div class="welcome-section">
        <h1 class="welcome-text">🎉 欢迎加入学习AI平台</h1>
        <p class="welcome-subtext">开启您的编程学习之旅</p>
      </div>

      <h2 class="form-title">创建新账号</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            required
            :disabled="isLoading"
          />
          <div v-if="errors.username" class="error-message">
            {{ errors.username }}
          </div>
        </div>

        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            required
            :disabled="isLoading"
          />
          <div v-if="errors.email" class="error-message">
            {{ errors.email }}
          </div>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            required
            :disabled="isLoading"
          />
          <div v-if="errors.password" class="error-message">
            {{ errors.password }}
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            required
            :disabled="isLoading"
          />
          <div v-if="errors.confirmPassword" class="error-message">
            {{ errors.confirmPassword }}
          </div>
        </div>
      </form>
    </div>

    <button type="submit" class="register-button" :disabled="isLoading">
      <span v-if="isLoading" class="loading-spinner" />
      <span>{{ isLoading ? '注册中...' : '注册' }}</span>
    </button>

    <div class="login-link">
      <span>已有账号?</span>
      <router-link to="/login"> 立即登录 </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const errors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const isLoading = ref(false);

const validateForm = () => {
  let isValid = true;

  errors.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  if (formData.value.username.length < 3) {
    errors.value.username = '用户名至少需要3个字符';
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.value.email)) {
    errors.value.email = '请输入有效的邮箱地址';
    isValid = false;
  }

  if (formData.value.password.length < 6) {
    errors.value.password = '密码至少需要6个字符';
    isValid = false;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;

  try {
    const success = await userStore.register(
      formData.value.username,
      formData.value.email,
      formData.value.password
    );

    if (success) {
      router.push('/login');
    }
  } catch (error) {
    console.error('注册失败:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-form-container {
  position: relative;
  z-index: 1;
  animation: form-fade-in 1s ease-out;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.register-form {
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

.register-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--tech-blue), var(--tech-purple), var(--tech-pink));
}

.register-form::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 242, 255, 0.05) 0%, transparent 50%);
  animation: rotate 20s linear infinite;
  pointer-events: none;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.welcome-section {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.welcome-text {
  font-size: 28px;
  color: #ffffff;
  margin-bottom: 8px;
  font-weight: 700;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: text-glow 3s ease-in-out infinite;
}

@keyframes text-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 10px rgba(0, 242, 255, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(114, 9, 183, 0.5));
  }
}

.welcome-subtext {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  letter-spacing: 0.5px;
}

.form-title {
  text-align: center;
  color: #ffffff;
  font-size: 24px;
  margin-bottom: 32px;
  font-weight: 700;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.form-group label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
  font-weight: 500;
}

.form-group input:focus {
  outline: none;
  border-color: var(--tech-blue);
  box-shadow:
    0 0 20px rgba(0, 242, 255, 0.3),
    inset 0 0 20px rgba(0, 242, 255, 0.05);
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--tech-pink);
  font-size: 13px;
  margin-top: 8px;
  font-weight: 500;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.register-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0, 242, 255, 0.4);
  position: relative;
  overflow: hidden;
  z-index: 1;
  margin-top: 8px;
}

.register-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 242, 255, 0.6);
}

.register-button:hover:not(:disabled)::before {
  left: 100%;
}

.register-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.login-link {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  position: relative;
  z-index: 1;
}

.login-link span {
  margin-right: 5px;
  font-weight: 400;
}

.login-link a {
  color: var(--tech-blue);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  display: inline-block;
}

.login-link a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--tech-blue), var(--tech-purple));
  transition: width 0.3s ease;
}

.login-link a:hover {
  color: var(--tech-purple);
  text-shadow: 0 0 10px rgba(114, 9, 183, 0.5);
}

.login-link a:hover::after {
  width: 100%;
}

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

@media (max-width: 768px) {
  .register-form-container {
    padding: 15px;
  }

  .register-form {
    width: 100%;
    max-width: 380px;
    padding: 36px 28px;
  }

  .welcome-text {
    font-size: 24px;
  }

  .welcome-subtext {
    font-size: 14px;
  }

  .form-title {
    font-size: 20px;
    margin-bottom: 28px;
  }

  .form-group input {
    padding: 12px 14px;
    font-size: 14px;
  }

  .register-button {
    padding: 14px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .register-form {
    padding: 28px 20px;
  }

  .welcome-text {
    font-size: 22px;
  }

  .form-title {
    font-size: 18px;
    margin-bottom: 24px;
  }
}
</style>
