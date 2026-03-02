<template>
  <div class="auth-container star-bg">
    <div class="auth-card">
      <h2 class="text-2xl font-bold text-dark mb-6 text-center">登录测试</h2>

      <div v-if="loginStatus === 'not_logged_in'">
        <p class="mb-4">当前状态: 未登录</p>
        <button class="btn btn-primary w-full" @click="performLogin">执行登录测试</button>
        <button class="btn btn-secondary w-full mt-2" @click="navigateToHome">
          直接跳转到首页
        </button>
      </div>

      <div v-else-if="loginStatus === 'logging_in'">
        <p>登录中...</p>
      </div>

      <div v-else-if="loginStatus === 'logged_in'">
        <p class="mb-4 text-green-600">登录成功!</p>
        <p class="mb-4">用户信息: {{ userInfo }}</p>
        <button class="btn btn-secondary w-full" @click="logout">登出</button>
        <button class="btn btn-primary w-full mt-2" @click="navigateToHome">跳转到首页</button>
      </div>

      <div v-else-if="loginStatus === 'login_failed'">
        <p class="mb-4 text-red-600">登录失败: {{ errorMessage }}</p>
        <button class="btn btn-secondary w-full" @click="reset">重试</button>
        <button class="btn btn-primary w-full mt-2" @click="navigateToHome">跳转到首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import config from '@/config';

const router = useRouter();

const loginStatus = ref('not_logged_in'); // not_logged_in, logging_in, logged_in, login_failed
const userInfo = ref(null);
const errorMessage = ref('');

// 简化的登录函数，不依赖用户存储
const performLogin = async () => {
  loginStatus.value = 'logging_in';
  try {
    // 直接调用API进行登录
    const response = await axios.post(`${config.api.baseUrl}/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });

    if (response.data.success) {
      const { token, data: userData } = response.data;

      // 存储token到localStorage
      localStorage.setItem(`${config.storagePrefix}token`, token);

      // 存储用户信息到localStorage
      const userInfo = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: `https://picsum.photos/200/200?random=${Date.now()}`,
        createdAt: new Date().toISOString(),
        permissions: ['user'],
        learningInterests: userData.learningInterests || [],
      };

      localStorage.setItem(`${config.storagePrefix}user`, JSON.stringify(userInfo));

      loginStatus.value = 'logged_in';
      userInfo.value = userInfo;
    } else {
      loginStatus.value = 'login_failed';
      errorMessage.value = response.data.message || '登录失败';
    }
  } catch (error) {
    loginStatus.value = 'login_failed';
    errorMessage.value = error.response?.data?.message || error.message || '未知错误';
  }
};

// 简化的登出函数
const logout = () => {
  // 清除localStorage中的用户信息
  const prefix = config.storagePrefix;
  localStorage.removeItem(`${prefix}token`);
  localStorage.removeItem(`${prefix}user`);

  loginStatus.value = 'not_logged_in';
  userInfo.value = null;
};

const navigateToHome = () => {
  router.push('/');
};

const reset = () => {
  loginStatus.value = 'not_logged_in';
  errorMessage.value = '';
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 0.5rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  border: none;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.text-green-600 {
  color: #16a34a;
}

.text-red-600 {
  color: #dc2626;
}
</style>
