<template>
  <div class="auth-container star-bg">
    <div class="auth-card">
      <h2 class="text-2xl font-bold text-dark mb-6 text-center">重置密码</h2>

      <form class="space-y-6" @submit.prevent="handleResetPassword">
        <div class="input-group">
          <label class="block text-gray-700 font-medium mb-2" for="password">新密码</label>
          <svg
            class="input-group-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input-primary"
            placeholder="请输入新密码（至少8位，包含大小写字母、数字和特殊字符）"
            minlength="8"
            required
          />
          <p v-if="password.length > 0 && password.length < 8" class="text-red-500 text-sm mt-1">
            密码长度不能少于8个字符
          </p>
          <p
            v-if="
              password.length >= 8 &&
              !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)
            "
            class="text-red-500 text-sm mt-1"
          >
            密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符
          </p>
        </div>

        <div class="input-group">
          <label class="block text-gray-700 font-medium mb-2" for="confirmPassword">确认密码</label>
          <svg
            class="input-group-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="input-primary"
            placeholder="请再次输入新密码"
            minlength="8"
            required
          />
          <p
            v-if="password !== confirmPassword && confirmPassword.length > 0"
            class="text-red-500 text-sm mt-1"
          >
            两次输入的密码不一致
          </p>
        </div>

        <Button type="primary" class="w-full" :disabled="isLoading">
          <span v-if="!isLoading">重置密码</span>
          <span v-if="isLoading">重置中...</span>
          <div v-if="isLoading" class="loader ml-2" />
        </Button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600">
          <router-link to="/login" class="text-primary hover:underline"> 返回登录 </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationStore } from '@/store/notification';
import Button from '@/components/common/Button.vue';
import { userApi } from '@/utils/api';

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const token = ref('');

// 页面加载时获取URL中的token
onMounted(() => {
  token.value = route.query.token;
  if (!token.value) {
    notificationStore.error('无效的重置密码链接');
    router.push('/login');
  }
});

const handleResetPassword = async () => {
  if (password.value !== confirmPassword.value) {
    notificationStore.error('两次输入的密码不一致');
    return;
  }

  isLoading.value = true;
  try {
    await userApi.resetPassword({
      token: token.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    });
    notificationStore.success('密码重置成功，请使用新密码登录');
    router.push('/login');
  } catch (error) {
    console.error('重置密码失败:', error);
    notificationStore.error('重置密码失败，请稍后重试或重新请求重置链接');
  } finally {
    isLoading.value = false;
  }
};
</script>
