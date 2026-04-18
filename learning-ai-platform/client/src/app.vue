<template>
  <div>
    <ErrorBoundary
      default-error-message="应用发生未知错误"
      @error="handleGlobalError"
      @retry="handleRetry"
    >
      <router-view />
      <!-- 仅在非家长角色时显示兴趣选择 -->
      <template v-if="userStore.userRole !== 'parent'">
        <InterestPopup @interest-selected="handleInterestSelected" @skipped="handleInterestSkipped" />
      </template>
    </ErrorBoundary>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore, safeLocalStorage } from './store/user';
import config from './config';
import InterestPopup from './components/common/InterestPopup.vue';
import ErrorBoundary from './components/common/ErrorBoundary.vue';
import { userApi } from './utils/api';
import { ElNotification } from 'element-plus';
import logger from './utils/logger';

// 根组件承载路由视图和全局组件
const userStore = useUserStore();

// 初始化用户状态
onMounted(async () => {
  try {
    // 检查用户登录状态并加载用户数据
    await userStore.loadUserData();
  } catch (error) {
    logger.error('初始化用户状态失败', error, 'App.vue');
    ElNotification.error({
      message: '初始化失败',
      description: '无法获取用户信息，请刷新页面重试',
    });
  }
});

// 处理全局错误
const handleGlobalError = errorInfo => {
  logger.error('全局错误捕获', errorInfo, 'App.vue');

  // 可以在这里添加全局错误处理逻辑，如上报错误、通知用户等
  ElNotification.error({
    message: '应用发生错误',
    description: errorInfo.message || '请点击重试按钮刷新页面',
  });
};

// 处理重试
const handleRetry = () => {
  logger.info('用户点击重试按钮', null, 'App.vue');
  // 刷新页面
  window.location.reload();
};

// 处理用户选择的兴趣
const handleInterestSelected = async interests => {
  try {
    if (userStore.isLogin) {
      // 更新用户兴趣到数据库
      await userApi.updateProfile({ learningInterests: interests });
      // 更新本地用户信息
      if (userStore.userInfo) {
        userStore.userInfo.learningInterests = interests;
      // 保存到localStorage
      safeLocalStorage.set(`${config.storagePrefix}user`, userStore.userInfo);
      }
      ElNotification.success({
        message: '兴趣选择成功',
        description: '我们将根据您的兴趣为您推荐相关内容',
      });
    }
  } catch (error) {
    logger.error('保存用户兴趣失败', error, 'App.vue');
    ElNotification.error({
      message: '保存失败',
      description: '请稍后重试',
    });
  }
};

// 处理用户跳过兴趣选择
const handleInterestSkipped = () => {
  // 可以记录用户跳过的状态，避免下次登录再次显示
  try {
    safeLocalStorage.set(`${config.storagePrefix}interestSkipped`, true);
  } catch (error) {
    logger.error('保存兴趣跳过状态失败', error, 'App.vue');
  }
};
</script>

<style scoped>
/* 全局基础样式已在 main.css 中导入，这里无需额外样式 */
</style>
