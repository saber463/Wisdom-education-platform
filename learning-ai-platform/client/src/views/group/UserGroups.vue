<template>
  <div class="user-groups">
    <div class="page-header">
      <h1>我的小组</h1>
      <el-button type="primary" @click="navigateToCreate"> 创建小组 </el-button>
    </div>

    <el-card class="groups-card">
      <div class="groups-list">
        <el-card
          v-for="group in groups"
          :key="group._id"
          class="group-item"
          @click="navigateToDetail(group._id)"
        >
          <template #header>
            <div class="group-header">
              <h3>{{ group.name }}</h3>
              <el-tag
                :type="
                  group.currentUserRole === 'creator'
                    ? 'success'
                    : group.currentUserRole === 'admin'
                      ? 'warning'
                      : 'info'
                "
                size="small"
              >
                {{
                  group.currentUserRole === 'creator'
                    ? '创建者'
                    : group.currentUserRole === 'admin'
                      ? '管理员'
                      : '成员'
                }}
              </el-tag>
            </div>
          </template>
          <p class="group-description">
            {{ group.description }}
          </p>
          <div class="group-meta">
            <span>{{ group.memberCount }} 成员</span>
            <span>{{ formatDate(group.createdAt) }} 创建</span>
          </div>
          <div class="group-stats">
            <el-statistic title="今日动态" :value="group.todayPostsCount || 0" />
            <el-statistic title="总帖子数" :value="group.totalPostsCount || 0" />
          </div>
          <div class="group-actions">
            <el-button type="primary" size="small" @click.stop="navigateToDetail(group._id)">
              查看详情
            </el-button>
            <el-button
              v-if="group.currentUserRole !== 'creator'"
              type="danger"
              size="small"
              @click.stop="handleLeave(group._id)"
            >
              退出小组
            </el-button>
            <el-button
              v-if="group.currentUserRole === 'creator' || group.currentUserRole === 'admin'"
              type="warning"
              size="small"
              @click.stop="handleManage(group._id)"
            >
              管理小组
            </el-button>
          </div>
        </el-card>
      </div>

      <div v-if="groups.length === 0" class="empty-state">
        <el-empty
          description="您还没有加入任何小组"
          image="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
        >
          <el-button type="primary" @click="navigateToGroupList"> 浏览推荐小组 </el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { groupApi } from '@/utils/api';

const router = useRouter();
const groups = ref([]);
const loading = ref(true);

// 获取用户的小组列表
const fetchUserGroups = async () => {
  loading.value = true;
  try {
    const response = await groupApi.getUserGroups();
    groups.value = response.data;
  } catch (error) {
    ElMessage.error('获取我的小组失败');
    console.error('获取我的小组失败:', error);
  } finally {
    loading.value = false;
  }
};

// 导航到创建小组页面
const navigateToCreate = () => {
  router.push('/groups/create');
};

// 导航到小组列表页面
const navigateToGroupList = () => {
  router.push('/groups');
};

// 导航到小组详情页面
const navigateToDetail = groupId => {
  router.push(`/groups/${groupId}`);
};

// 退出小组
const handleLeave = async groupId => {
  try {
    await groupApi.leave(groupId);
    ElMessage.success('已退出小组');
    // 重新获取我的小组列表
    fetchUserGroups();
  } catch (error) {
    ElMessage.error('退出小组失败');
    console.error('退出小组失败:', error);
  }
};

// 管理小组
const handleManage = _groupId => {
  // 这里可以跳转到小组管理页面
  ElMessage.info('小组管理功能开发中');
};

// 格式化日期
const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

onMounted(() => {
  fetchUserGroups();
});
</script>

<style scoped>
.user-groups {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.groups-card {
  margin-bottom: 20px;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-item {
  transition: box-shadow 0.2s;
}

.group-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-description {
  margin-bottom: 15px;
  color: #666;
}

.group-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  color: #999;
  font-size: 14px;
}

.group-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
  padding: 10px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.group-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 50px 0;
}
</style>
