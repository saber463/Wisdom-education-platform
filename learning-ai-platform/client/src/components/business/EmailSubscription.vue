<template>
  <div class="email-subscription">
    <!-- 订阅表单 -->
    <div v-if="!isSubscribed" class="subscription-form">
      <h3>📧 订阅更新通知</h3>
      <p class="subscription-desc">订阅后，您将第一时间收到新课程、课程更新、明星老师动态等通知</p>
      
      <div class="subscribe-row">
        <el-input
          v-model="email"
          placeholder="请输入您的邮箱地址"
          size="large"
          :disabled="isLoading"
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
        
        <el-button
          type="primary"
          size="large"
          :loading="isLoading"
          @click="handleSubscribe"
          :disabled="!email"
        >
          {{ isLoading ? '发送中...' : '订阅' }}
        </el-button>
      </div>

      <!-- 订阅偏好选项 -->
      <div class="subscription-options">
        <el-checkbox v-model="preferences.newCourse">新课程上线</el-checkbox>
        <el-checkbox v-model="preferences.courseUpdate">课程更新</el-checkbox>
        <el-checkbox v-model="preferences.teacherNews">明星老师动态</el-checkbox>
        <el-checkbox v-model="preferences.vipNews">VIP专属内容</el-checkbox>
        <el-checkbox v-model="preferences.systemNotice">系统通知</el-checkbox>
      </div>
    </div>

    <!-- 验证邮箱 -->
    <div v-else-if="!isVerified" class="verify-form">
      <h3>🔐 验证您的邮箱</h3>
      <p>我们已向 <strong>{{ email }}</strong> 发送了验证码</p>
      
      <div class="verify-row">
        <el-input
          v-model="verifyCode"
          placeholder="请输入6位验证码"
          size="large"
          maxlength="6"
          :disabled="isLoading"
        />
        
        <el-button
          type="success"
          size="large"
          :loading="isLoading"
          @click="handleVerify"
          :disabled="verifyCode.length !== 6"
        >
          验证
        </el-button>
      </div>
      
      <div class="verify-tips">
        <p>📩 验证码 5 分钟内有效</p>
        <el-button link type="primary" @click="resendCode" :disabled="countdown > 0">
          {{ countdown > 0 ? `${countdown}秒后重发` : '重新发送验证码' }}
        </el-button>
      </div>
    </div>

    <!-- 已订阅状态 -->
    <div v-else class="subscribed-status">
      <div class="success-message">
        <el-icon size="24" color="#67C23A"><CircleCheck /></el-icon>
        <span>已成功订阅更新通知</span>
      </div>
      
      <div class="subscription-info">
        <p><strong>订阅邮箱：</strong>{{ email }}</p>
        <p><strong>订阅内容：</strong></p>
        <ul>
          <li v-if="preferences.newCourse">🆕 新课程上线</li>
          <li v-if="preferences.courseUpdate">📚 课程更新</li>
          <li v-if="preferences.teacherNews">⭐ 明星老师动态</li>
          <li v-if="preferences.vipNews">👑 VIP专属内容</li>
          <li v-if="preferences.systemNotice">📢 系统通知</li>
        </ul>
      </div>

      <div class="subscription-actions">
        <el-button @click="showPreferencesDialog = true">修改订阅偏好</el-button>
        <el-button type="danger" plain @click="handleUnsubscribe">取消订阅</el-button>
      </div>
    </div>

    <!-- 订阅偏好对话框 -->
    <el-dialog v-model="showPreferencesDialog" title="修改订阅偏好" width="500px">
      <div class="preferences-edit">
        <p>选择您希望接收的通知类型：</p>
        <el-checkbox v-model="preferences.newCourse">🆕 新课程上线通知</el-checkbox>
        <el-checkbox v-model="preferences.courseUpdate">📚 课程内容更新</el-checkbox>
        <el-checkbox v-model="preferences.teacherNews">⭐ 明星老师动态</el-checkbox>
        <el-checkbox v-model="preferences.vipNews">👑 VIP专属内容</el-checkbox>
        <el-checkbox v-model="preferences.systemNotice">📢 系统通知</el-checkbox>
      </div>
      <template #footer>
        <el-button @click="showPreferencesDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdatePreferences">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Message, CircleCheck } from '@element-plus/icons-vue';
import axios from 'axios';

const email = ref('');
const verifyCode = ref('');
const isLoading = ref(false);
const isSubscribed = ref(false);
const isVerified = ref(false);
const showPreferencesDialog = ref(false);
const countdown = ref(0);

const preferences = reactive({
  newCourse: true,
  courseUpdate: true,
  teacherNews: true,
  vipNews: true,
  systemNotice: true,
});

let countdownTimer = null;

// 检查订阅状态
const checkSubscription = async () => {
  if (!email.value) return;
  
  try {
    const res = await axios.get(`/api/subscriptions/check?email=${email.value}`);
    if (res.data.success) {
      isSubscribed.value = res.data.data.isSubscribed;
      isVerified.value = res.data.data.isVerified;
      if (res.data.data.subscriptions) {
        Object.assign(preferences, res.data.data.subscriptions);
      }
    }
  } catch (error) {
    console.error('检查订阅状态失败:', error);
  }
};

// 订阅
const handleSubscribe = async () => {
  if (!email.value) {
    ElMessage.warning('请输入邮箱地址');
    return;
  }

  // 简单邮箱验证
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email.value)) {
    ElMessage.warning('请输入有效的邮箱地址');
    return;
  }

  isLoading.value = true;
  try {
    const res = await axios.post('/api/subscriptions/subscribe', {
      email: email.value,
      subscriptions: preferences,
    });
    
    if (res.data.success) {
      isSubscribed.value = true;
      ElMessage.success('验证邮件已发送，请查收');
      startCountdown();
      
      // 如果是测试环境，显示预览URL
      if (res.data.previewUrl) {
        console.log('📧 邮件预览:', res.data.previewUrl);
      }
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '订阅失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 验证
const handleVerify = async () => {
  if (verifyCode.value.length !== 6) {
    ElMessage.warning('请输入6位验证码');
    return;
  }

  isLoading.value = true;
  try {
    const res = await axios.post('/api/subscriptions/verify', {
      email: email.value,
      code: verifyCode.value,
    });
    
    if (res.data.success) {
      isVerified.value = true;
      ElMessage.success('邮箱验证成功！');
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '验证失败');
  } finally {
    isLoading.value = false;
  }
};

// 重发验证码
const resendCode = async () => {
  if (countdown.value > 0) return;
  
  isLoading.value = true;
  try {
    const res = await axios.post('/api/subscriptions/subscribe', {
      email: email.value,
    });
    
    if (res.data.success) {
      ElMessage.success('验证码已重新发送');
      startCountdown();
    }
  } catch (error) {
    ElMessage.error('发送失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
    }
  }, 1000);
};

// 更新订阅偏好
const handleUpdatePreferences = async () => {
  isLoading.value = true;
  try {
    const res = await axios.put('/api/subscriptions/preferences', {
      email: email.value,
      subscriptions: preferences,
    });
    
    if (res.data.success) {
      ElMessage.success('订阅偏好已更新');
      showPreferencesDialog.value = false;
    }
  } catch (error) {
    ElMessage.error('更新失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 取消订阅
const handleUnsubscribe = async () => {
  try {
    await ElMessageBox.confirm('确定要取消订阅吗？取消后您将不再收到更新通知。', '取消订阅', {
      confirmButtonText: '确定取消',
      cancelButtonText: '保留订阅',
      type: 'warning',
    });
  } catch {
    return;
  }

  isLoading.value = true;
  try {
    const res = await axios.delete(`/api/subscriptions/unsubscribe?email=${email.value}`);
    
    if (res.data.success) {
      isSubscribed.value = false;
      isVerified.value = false;
      email.value = '';
      ElMessage.success('已取消订阅');
    }
  } catch (error) {
    ElMessage.error('取消订阅失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时检查登录用户的邮箱
onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.email) {
    email.value = user.email;
    checkSubscription();
  }
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped>
.email-subscription {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.subscription-form h3,
.verify-form h3,
.subscribed-status h3 {
  margin-top: 0;
  color: #303133;
}

.subscription-desc {
  color: #909399;
  margin-bottom: 20px;
}

.subscribe-row {
  display: flex;
  gap: 10px;
}

.subscribe-row .el-input {
  flex: 1;
}

.subscription-options {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.verify-row {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.verify-row .el-input {
  flex: 1;
}

.verify-tips {
  text-align: center;
  color: #909399;
}

.verify-tips p {
  margin: 10px 0;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #67C23A;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.subscription-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.subscription-info ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.subscription-actions {
  display: flex;
  gap: 10px;
}

.preferences-edit {
  padding: 10px 0;
}

.preferences-edit p {
  margin-bottom: 15px;
  color: #606266;
}

.preferences-edit .el-checkbox {
  display: block;
  margin: 10px 0;
}
</style>
