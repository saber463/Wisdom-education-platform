<template>
  <div class="push-history-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">📬 推送历史</span>
          <el-button type="primary" @click="refreshHistory">刷新</el-button>
        </div>
      </template>

      <!-- 时间范围筛选 -->
      <div class="filter-section">
        <el-space>
          <span>时间范围：</span>
          <el-radio-group v-model="selectedDays" @change="onDaysChange">
            <el-radio :label="7">最近7天</el-radio>
            <el-radio :label="30">最近30天</el-radio>
            <el-radio :label="90">最近90天</el-radio>
          </el-radio-group>
        </el-space>
      </div>

      <!-- 推送历史列表 -->
      <el-table
        :data="pushHistory"
        stripe
        style="width: 100%; margin-top: 20px"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="push_content" label="推送内容" min-width="300">
          <template #default="{ row }">
            <el-tooltip :content="row.push_content" placement="top">
              <span>{{ truncateText(row.push_content, 50) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="sent_time" label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.sent_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="receive_status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.receive_status === 'success' ? 'success' : 'danger'"
            >
              {{ row.receive_status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewDetails(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; text-align: right"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailsVisible" title="推送详情" width="600px">
      <div v-if="selectedPush" class="details-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="推送ID">
            {{ selectedPush.id }}
          </el-descriptions-item>
          <el-descriptions-item label="推送内容">
            {{ selectedPush.push_content }}
          </el-descriptions-item>
          <el-descriptions-item label="发送时间">
            {{ formatTime(selectedPush.sent_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="接收状态">
            <el-tag
              :type="selectedPush.receive_status === 'success' ? 'success' : 'danger'"
            >
              {{ selectedPush.receive_status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedPush.error_message" label="错误信息">
            {{ selectedPush.error_message }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedPush.response_code" label="响应码">
            {{ selectedPush.response_code }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';

interface PushLog {
  id: number;
  push_content: string;
  sent_time: string;
  receive_status: 'success' | 'failed' | 'pending';
  error_message?: string;
  response_code?: number;
}

const userStore = useUserStore();
const pushHistory = ref<PushLog[]>([]);
const loading = ref(false);
const selectedDays = ref(30);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const detailsVisible = ref(false);
const selectedPush = ref<PushLog | null>(null);

/**
 * 获取推送历史
 */
const fetchPushHistory = async () => {
  try {
    loading.value = true;
    const response = await fetch(
      `/api/push/history/${userStore.userInfo?.id}?days=${selectedDays.value}`,
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('获取推送历史失败');
    }

    const data = await response.json();
    if (data.success) {
      pushHistory.value = data.data || [];
      total.value = data.total || 0;
    } else {
      ElMessage.error(data.message || '获取推送历史失败');
    }
  } catch (error) {
    ElMessage.error('获取推送历史失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

/**
 * 刷新历史
 */
const refreshHistory = () => {
  currentPage.value = 1;
  fetchPushHistory();
};

/**
 * 时间范围变化
 */
const onDaysChange = () => {
  refreshHistory();
};

/**
 * 查看详情
 */
const viewDetails = (push: PushLog) => {
  selectedPush.value = push;
  detailsVisible.value = true;
};

/**
 * 格式化时间
 */
const formatTime = (time: string): string => {
  return new Date(time).toLocaleString('zh-CN');
};

/**
 * 截断文本
 */
const truncateText = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

onMounted(() => {
  fetchPushHistory();
});
</script>

<style scoped>
.push-history-container {
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

.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.details-content {
  padding: 20px 0;
}
</style>
