<template>
  <div class="login-test-container">
    <h1>登录功能测试</h1>

    <div class="test-section">
      <h2>测试账号信息</h2>
      <div class="account-info">
        <div class="account-item">
          <strong>邮箱:</strong> test@example.com<br />
          <strong>密码:</strong> Test@123
        </div>
        <div class="account-item">
          <strong>邮箱:</strong> testuser_notification@example.com<br />
          <strong>密码:</strong> Test@123
        </div>
        <div class="account-item">
          <strong>邮箱:</strong> test_873015@example.com<br />
          <strong>密码:</strong> Test@123
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>登录测试表单</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="loginForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading"> 登录测试 </el-button>
          <el-button @click="handleReset"> 重置表单 </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="test-section">
      <h2>登录状态</h2>
      <div class="status-info">
        <p>
          当前登录状态:
          <span :class="{ 'logged-in': isLoggedIn, 'not-logged-in': !isLoggedIn }">
            {{ isLoggedIn ? '已登录' : '未登录' }}
          </span>
        </p>
        <p v-if="userInfo">
          登录用户信息: <br />
          用户名: {{ userInfo.username }}<br />
          邮箱: {{ userInfo.email }}
        </p>
      </div>
    </div>

    <div v-if="loginResult" class="test-section">
      <h2>登录结果</h2>
      <div
        class="result-info"
        :class="{ success: loginResult.success, error: !loginResult.success }"
      >
        <p>状态: {{ loginResult.success ? '成功' : '失败' }}</p>
        <p>消息: {{ loginResult.message }}</p>
        <p v-if="loginResult.data">
          返回数据: <br />
          {{ JSON.stringify(loginResult.data, null, 2) }}
        </p>
      </div>
    </div>

    <div class="test-section">
      <h2>操作</h2>
      <el-button type="danger" @click="handleLogout" :disabled="!isLoggedIn"> 退出登录 </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();
const loginFormRef = ref();
const loading = ref(false);
const loginResult = ref(null);

const loginForm = reactive({
  email: '',
  password: '',
});

const loginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8个字符', trigger: 'blur' },
  ],
};

const isLoggedIn = computed(() => userStore.isLogin);
const userInfo = computed(() => userStore.userInfo);

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loading.value = true;
    loginResult.value = null;

    // 调用登录方法
    const success = await userStore.login(loginForm.email, loginForm.password);

    if (success) {
      loginResult.value = {
        success: true,
        message: '登录成功！',
        data: userStore.userInfo,
      };
      ElMessage.success('登录成功！');
    } else {
      loginResult.value = {
        success: false,
        message: '登录失败，未知错误',
      };
      ElMessage.error('登录失败，未知错误');
    }
  } catch (error) {
    loginResult.value = {
      success: false,
      message: error.message || '登录失败',
    };
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.resetFields();
  loginResult.value = null;
};

const handleLogout = () => {
  userStore.logout();
  loginResult.value = null;
  ElMessage.success('已退出登录');
};
</script>

<style scoped>
.login-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #606266;
}

.account-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.account-item {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
}

.login-test-container .el-button {
  margin-right: 10px;
}

.status-info {
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
}

.status-info span {
  font-weight: bold;
}

.logged-in {
  color: #67c23a;
}

.not-logged-in {
  color: #f56c6c;
}

.result-info {
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
}

.result-info.success {
  background-color: #f0f9eb;
  border: 1px solid #c2e7b0;
  color: #67c23a;
}

.result-info.error {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #f56c6c;
}
</style>
