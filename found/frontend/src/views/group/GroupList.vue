<template>
  <div class="group-list">
    <div class="page-header">
      <h1>学习小组</h1>
      <el-button type="primary" @click="navigateToCreate"> 创建小组 </el-button>
    </div>

    <el-card class="group-list-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="推荐小组" name="recommended">
          <div class="group-grid">
            <el-card
              v-for="group in groups"
              :key="group._id"
              class="group-item"
              @click="navigateToDetail(group._id)"
            >
              <template #header>
                <div class="group-header">
                  <h3>{{ group.name }}</h3>
                  <el-tag size="small"> {{ group.memberCount }} 成员 </el-tag>
                </div>
              </template>
              <p class="group-description">
                {{ group.description }}
              </p>
              <div class="group-meta">
                <span>创建者: {{ group.creator?.username || '未知' }}</span>
                <span>{{ formatDate(group.createdAt) }}</span>
              </div>
              <el-button
                v-if="!isJoined(group._id)"
                type="primary"
                size="small"
                @click.stop="handleJoin(group._id)"
              >
                加入
              </el-button>
              <el-button
                v-else
                type="success"
                size="small"
                @click.stop="navigateToDetail(group._id)"
              >
                已加入
              </el-button>
            </el-card>
          </div>
        </el-tab-pane>
        <el-tab-pane label="我的小组" name="my">
          <div class="group-grid">
            <el-card
              v-for="group in userGroups"
              :key="group._id"
              class="group-item"
              @click="navigateToDetail(group._id)"
            >
              <template #header>
                <div class="group-header">
                  <h3>{{ group.name }}</h3>
                  <el-tag size="small" type="success">
                    {{ group.role }}
                  </el-tag>
                </div>
              </template>
              <p class="group-description">
                {{ group.description }}
              </p>
              <div class="group-meta">
                <span>创建者: {{ group.creator?.username || '未知' }}</span>
                <span>{{ formatDate(group.createdAt) }}</span>
              </div>
              <el-button type="info" size="small" @click.stop="navigateToDetail(group._id)">
                查看详情
              </el-button>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { groupApi } from '@/utils/api';

const router = useRouter();
const activeTab = ref('recommended');
const groups = ref([]);
const userGroups = ref([]);
const joinedGroupIds = ref(new Set());

// Mock小组数据
const mockGroups = [
  { _id: 'g1', name: 'Vue3实战开发交流群', description: '专注Vue3/Nuxt3/Vite实战开发，每周分享项目经验与最佳实践', memberCount: 1256, cover: 'https://picsum.photos/seed/group1/300/180', category: '前端开发', tags: ['Vue3', 'Nuxt3'] },
  { _id: 'g2', name: 'Python数据科学圈', description: 'Pandas/NumPy/Sklearn/PyTorch，从数据处理到模型训练全覆盖', memberCount: 2341, cover: 'https://picsum.photos/seed/group2/300/180', category: '数据科学', tags: ['Python', 'ML'] },
  { _id: 'g3', name: 'LeetCode刷题联盟', description: '每天一题，互相解析思路，面试冲刺必备小组', memberCount: 4582, cover: 'https://picsum.photos/seed/group3/300/180', category: '算法', tags: ['LeetCode', '面试'] },
  { _id: 'g4', name: '英语四六级备考团', description: '共同备考英语四六级，资料共享、打卡监督、互助答疑', memberCount: 3867, cover: 'https://picsum.photos/seed/group4/300/180', category: '英语', tags: ['四级', '六级'] },
  { _id: 'g5', name: 'Java后端架构师之路', description: 'Spring全家桶、微服务、分布式架构、性能调优深度讨论', memberCount: 1893, cover: 'https://picsum.photos/seed/group5/300/180', category: '后端开发', tags: ['Java', 'Spring'] },
  { _id: 'g6', name: 'React/Next.js 实战营', description: 'React18新特性、Next.js全栈、TypeScript最佳实践分享', memberCount: 987, cover: 'https://picsum.photos/seed/group6/300/180', category: '前端开发', tags: ['React', 'Next.js'] },
  { _id: 'g7', name: 'AI/大模型应用探索', description: 'GPT/Claude/本地LLM应用开发，提示词工程与Agent实战', memberCount: 3124, cover: 'https://picsum.photos/seed/group7/300/180', category: 'AI', tags: ['LLM', 'Agent'] },
  { _id: 'g8', name: 'DevOps云原生实践', description: 'Docker/K8s/CI-CD/监控告警，云原生技术栈实战交流', memberCount: 756, cover: 'https://picsum.photos/seed/group8/300/180', category: 'DevOps', tags: ['K8s', 'Docker'] },
  { _id: 'g9', name: '计算机考研备战群', description: '数据结构、计算机组成原理、操作系统、计网四科联合备考', memberCount: 5234, cover: 'https://picsum.photos/seed/group9/300/180', category: '考研', tags: ['考研', '计算机'] },
  { _id: 'g10', name: 'UI/UX设计师成长圈', description: 'Figma/Adobe XD实战、设计系统构建、用户体验研究方法', memberCount: 1432, cover: 'https://picsum.photos/seed/group10/300/180', category: '设计', tags: ['UI', 'UX', 'Figma'] },
];

// 获取推荐小组列表
const fetchGroups = async () => {
  try {
    const response = await groupApi.getList();
    groups.value = response.data;
    if (!groups.value || groups.value.length === 0) {
      groups.value = mockGroups;
    }
  } catch (error) {
    console.error('获取小组列表失败:', error);
    groups.value = mockGroups;
  }
};

// 获取用户的小组列表
const fetchUserGroups = async () => {
  try {
    const response = await groupApi.getUserGroups();
    userGroups.value = response.data;
    // 记录已加入的小组ID - 添加空值检查
    if (Array.isArray(userGroups.value)) {
      joinedGroupIds.value = new Set(userGroups.value.map(group => group._id));
    } else {
      joinedGroupIds.value = new Set();
    }
  } catch (error) {
    ElMessage.error('获取我的小组失败');
    console.error('获取我的小组失败:', error);
  }
};

// 检查是否已加入小组
const isJoined = groupId => {
  return joinedGroupIds.value.has(groupId);
};

// 导航到创建小组页面
const navigateToCreate = () => {
  router.push('/groups/create');
};

// 导航到小组详情页面
const navigateToDetail = groupId => {
  router.push(`/groups/${groupId}`);
};

// 加入小组
const handleJoin = async groupId => {
  try {
    await groupApi.join(groupId);
    ElMessage.success('加入小组成功');
    // 更新已加入状态
    joinedGroupIds.value.add(groupId);
    // 刷新用户小组列表
    fetchUserGroups();
  } catch (error) {
    ElMessage.error('加入小组失败');
    console.error('加入小组失败:', error);
  }
};

// 处理标签页切换
const handleTabChange = tab => {
  if (tab === 'my' && userGroups.value.length === 0) {
    fetchUserGroups();
  }
};

// 格式化日期
const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

onMounted(() => {
  fetchGroups();
  fetchUserGroups();
});
</script>

<style scoped>
.group-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.group-list-card {
  margin-bottom: 20px;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.group-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.group-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-description {
  margin-bottom: 15px;
  color: #666;
  height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.group-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  color: #999;
  font-size: 12px;
}
</style>
