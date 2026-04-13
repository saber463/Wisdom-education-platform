<template>
  <div class="auth-container star-bg">
    <div class="auth-card">
      <h2 class="text-2xl font-bold text-dark mb-6 text-center">忘记密码</h2>

      <form class="space-y-6" @submit.prevent="handleForgotPassword">
        <div class="input-group">
          <label class="block text-gray-700 font-medium mb-2" for="email">邮箱</label>
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
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <input
            id="email"
            v-model="email"
            type="email"
            class="input-primary"
            placeholder="请输入您的邮箱"
            required
          />
        </div>

        <Button type="primary" class="w-full" :disabled="isLoading">
          <span v-if="!isLoading">发送重置链接</span>
          <span v-if="isLoading">发送中...</span>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/store/notification';
import Button from '@/components/common/Button.vue';
import { userApi } from '@/utils/api';

const router = useRouter();
const notificationStore = useNotificationStore();
const email = ref('');
const isLoading = ref(false);

const handleForgotPassword = async () => {
  isLoading.value = true;
  try {
    await userApi.forgotPassword(email.value);
    notificationStore.success('重置密码链接已发送到您的邮箱，请查收');
    router.push('/login');
  } catch (error) {
    console.error('发送重置链接失败:', error);
    notificationStore.error('发送重置链接失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};
</script>
