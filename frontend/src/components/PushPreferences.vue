<template>
  <div class="push-preferences-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">⚙️ 推送偏好设置</span>
        </div>
      </template>

      <el-form
        :model="preferences"
        label-width="200px"
        @submit.prevent="savePreferences"
      >
        <el-form-item label="打卡提醒">
          <el-switch
            v-model="preferences.receive_check_in_reminder"
            active-text="启用"
            inactive-text="禁用"
          />
          <span class="help-text">每天接收学习打卡提醒</span>
        </el-form-item>

        <el-form-item label="任务提醒">
          <el-switch
            v-model="preferences.receive_task_reminder"
            active-text="启用"
            inactive-text="禁用"
          />
          <span class="help-text">接收未完成任务的提醒</span>
        </el-form-item>

        <el-form-item label="班级通知">
          <el-switch
            v-model="preferences.receive_class_notification"
            active-text="启用"
            inactive-text="禁用"
          />
          <span class="help-text">接收班级新作业和通知</span>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="saving"
            @click="savePreferences"
          >
            保存设置
          </el-button>
          <el-button @click="resetPreferences">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 推送统计信息 -->
      <el-divider />

      <div class="stats-section">
        <h3>📊 推送统计</h3>
        <el-row :gutter="20">
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <el-statistic
              title="总推送数"
              :value="stats.total"
            />
          </el-col>
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <el-statistic
              title="成功数"
              :value="stats.success"
            />
          </el-col>
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <el-statistic
              title="失败数"
              :value="stats.failed"
            />
          </el-col>
          <el-col
            :xs="24"
            :sm="12"
            :md="6"
          >
            <el-statistic
              title="成功率"
              :value="stats.successRate"
              suffix="%"
              :precision="2"
            />
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';

interface Preferences {
  receive_check_in_reminder: boolean;
  receive_task_reminder: boolean;
  receive_class_notification: boolean;
}

interface Stats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

const userStore = useUserStore();
const preferences = ref<Preferences>({
  receive_check_in_reminder: true,
  receive_task_reminder: true,
  receive_class_notification: true
});
const originalPreferences = ref<Preferences>({ ...preferences.value });
const saving = ref(false);
const stats = ref<Stats>({
  total: 0,
  success: 0,
  failed: 0,
  successRate: 0
});

/**
 * 获取用户推送偏好
 */
const fetchPreferences = async () => {
  try {
    const response = await fetch(
      `/api/push/preferences/${userStore.userInfo?.id}`,
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('获取推送偏好失败');
    }

    const data = await response.json();
    if (data.success && data.data) {
      preferences.value = {
        receive_check_in_reminder: data.data.receive_check_in_reminder,
        receive_task_reminder: data.data.receive_task_reminder,
        receive_class_notification: data.data.receive_class_notification
      };
      originalPreferences.value = { ...preferences.value };
    }
  } catch (error) {
    ElMessage.error('获取推送偏好失败');
    console.error(error);
  }
};

/**
 * 获取推送统计
 */
const fetchStats = async () => {
  try {
    const response = await fetch('/api/push/stats', {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    });

    if (!response.ok) {
      throw new Error('获取推送统计失败');
    }

    const data = await response.json();
    if (data.success && data.data) {
      stats.value = data.data;
    }
  } catch (error) {
    console.error('获取推送统计失败', error);
  }
};

/**
 * 保存推送偏好
 */
const savePreferences = async () => {
  try {
    saving.value = true;
    const response = await fetch(
      `/api/push/preferences/${userStore.userInfo?.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userStore.token}`
        },
        body: JSON.stringify(preferences.value)
      }
    );

    if (!response.ok) {
      throw new Error('保存推送偏好失败');
    }

    const data = await response.json();
    if (data.success) {
      ElMessage.success('推送偏好已保存');
      originalPreferences.value = { ...preferences.value };
    } else {
      ElMessage.error(data.message || '保存推送偏好失败');
    }
  } catch (error) {
    ElMessage.error('保存推送偏好失败');
    console.error(error);
  } finally {
    saving.value = false;
  }
};

/**
 * 重置推送偏好
 */
const resetPreferences = () => {
  preferences.value = { ...originalPreferences.value };
};

onMounted(() => {
  fetchPreferences();
  fetchStats();
});
</script>

<style scoped>
.push-preferences-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.help-text {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.stats-section {
  margin-top: 20px;
}

.stats-section h3 {
  margin-bottom: 15px;
  color: #303133;
}
</style>
