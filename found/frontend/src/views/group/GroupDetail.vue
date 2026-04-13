<template>
  <div class="group-detail">
    <div class="group-header-section">
      <div v-if="group.avatar" class="group-cover">
        <img :src="group.avatar" alt="小组头像" />
      </div>
      <div class="group-info">
        <h1>{{ group.name }}</h1>
        <p class="group-description">
          {{ group.description }}
        </p>
        <div class="group-meta">
          <el-tag v-for="tag in group.tags" size="small" :key="tag" class="group-tag">
            {{ tag }}
          </el-tag>
          <span>{{ group.memberCount }} 成员</span>
          <span>{{ formatDate(group.createdAt) }} 创建</span>
        </div>
        <div class="group-actions">
          <el-button v-if="groupJoinStatus === 'notJoined'" type="primary" @click="handleJoin">
            加入小组
          </el-button>
          <el-button v-else-if="groupJoinStatus === 'joined'" type="success" @click="handleLeave">
            退出小组
          </el-button>
          <el-button v-else-if="groupJoinStatus === 'pending'" disabled> 等待审核 </el-button>
          <el-button
            v-if="group.currentUserRole === 'creator' || group.currentUserRole === 'admin'"
            type="warning"
            @click="handleManage"
          >
            管理小组
          </el-button>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="group-tabs">
      <el-tab-pane label="小组动态" name="posts">
        <div class="posts-section">
          <div class="create-post-section">
            <el-card>
              <el-input
                v-model="newPost.content"
                type="textarea"
                :rows="3"
                placeholder="分享你的学习心得..."
                maxlength="500"
                show-word-limit
              />
              <div class="post-actions">
                <el-upload
                  v-model="newPost.images"
                  :auto-upload="false"
                  :show-file-list="true"
                  :limit="3"
                  list-type="picture-card"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
                <el-button
                  type="primary"
                  :disabled="!newPost.content.trim()"
                  @click="handleCreatePost"
                >
                  发布
                </el-button>
              </div>
            </el-card>
          </div>

          <div class="posts-list">
            <el-card v-for="post in posts" :key="post._id" class="post-item">
              <div class="post-header">
                <div class="user-info">
                  <el-avatar :size="40" :src="post.user?.avatar || ''">
                    {{ post.user?.username?.charAt(0) || 'U' }}
                  </el-avatar>
                  <div class="user-details">
                    <span class="username">{{ post.user?.username || '未知用户' }}</span>
                    <span class="post-time">{{ formatDate(post.createdAt) }}</span>
                  </div>
                </div>
                <el-tag
                  v-if="post.user?.role === 'creator' || post.user?.role === 'admin'"
                  size="small"
                >
                  {{ post.user.role === 'creator' ? '创建者' : '管理员' }}
                </el-tag>
              </div>
              <div class="post-content">
                {{ post.content }}
              </div>
              <div v-if="post.images && post.images.length" class="post-images">
                <img
                  v-for="(image, index) in post.images"
                  :key="index"
                  :src="image"
                  alt="帖子图片"
                  @click="previewImage(image)"
                />
              </div>
              <div class="post-stats">
                <el-button
                  :icon="isLiked(post._id) ? 'StarFilled' : 'Star'"
                  :type="isLiked(post._id) ? 'primary' : 'text'"
                  @click="handleLikePost(post._id)"
                >
                  {{ post.likesCount || 0 }}
                </el-button>
                <el-button type="text" :icon="'ChatDotRound'">
                  {{ post.commentsCount || 0 }} 评论
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="成员列表" name="members">
        <div class="members-section">
          <el-card>
            <el-table :data="members" style="width: 100%">
              <el-table-column label="用户" width="200">
                <template #default="scope">
                  <div class="user-info">
                    <el-avatar :size="32" :src="scope.row.user?.avatar || ''">
                      {{ scope.row.user?.username?.charAt(0) || 'U' }}
                    </el-avatar>
                    <span>{{ scope.row.user?.username || '未知用户' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="角色" width="120">
                <template #default="scope">
                  <el-tag
                    :type="
                      scope.row.role === 'creator'
                        ? 'success'
                        : scope.row.role === 'admin'
                          ? 'warning'
                          : 'info'
                    "
                    size="small"
                  >
                    {{
                      scope.row.role === 'creator'
                        ? '创建者'
                        : scope.row.role === 'admin'
                          ? '管理员'
                          : '成员'
                    }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="加入时间" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.joinedAt) }}
                </template>
              </el-table-column>
              <el-table-column label="最后活跃" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.lastActiveAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" v-if="group.currentUserRole === 'creator'">
                <template #default="scope">
                  <el-button
                    v-if="scope.row.role !== 'creator'"
                    type="warning"
                    size="small"
                    @click="handleChangeRole(scope.row)"
                  >
                    {{ scope.row.role === 'admin' ? '取消管理员' : '设为管理员' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { groupApi } from '@/utils/api';

const route = useRoute();
const groupId = ref(route.params.id);
const activeTab = ref('posts');
const group = reactive({});
const posts = ref([]);
const members = ref([]);
const groupJoinStatus = ref('loading'); // loading, joined, notJoined, pending
const likedPosts = ref(new Set());

// 新帖子表单
const newPost = reactive({
  content: '',
  images: [],
});

// 获取小组详情
const fetchGroupDetail = async () => {
  try {
    const response = await groupApi.getDetail(groupId.value);
    Object.assign(group, response.data);
    updateGroupJoinStatus(response.data);
  } catch (error) {
    ElMessage.error('获取小组详情失败');
    console.error('获取小组详情失败:', error);
  }
};

// 获取小组帖子
const fetchGroupPosts = async () => {
  try {
    const response = await groupApi.getPosts(groupId.value);
    posts.value = response.data;
    // 初始化点赞状态
    posts.value.forEach(post => {
      if (post.isLikedByCurrentUser) {
        likedPosts.value.add(post._id);
      }
    });
  } catch (error) {
    ElMessage.error('获取小组帖子失败');
    console.error('获取小组帖子失败:', error);
  }
};

// 更新小组加入状态
const updateGroupJoinStatus = groupData => {
  if (!groupData.currentUserRole) {
    groupJoinStatus.value = 'notJoined';
  } else if (groupData.currentUserRole === 'pending') {
    groupJoinStatus.value = 'pending';
  } else {
    groupJoinStatus.value = 'joined';
  }
};

// 处理加入小组
const handleJoin = async () => {
  try {
    await groupApi.join(groupId.value);
    ElMessage.success('加入请求已发送');
    groupJoinStatus.value = 'pending';
    // 重新获取小组详情
    fetchGroupDetail();
  } catch (error) {
    ElMessage.error('加入小组失败');
    console.error('加入小组失败:', error);
  }
};

// 处理退出小组
const handleLeave = async () => {
  try {
    await groupApi.leave(groupId.value);
    ElMessage.success('已退出小组');
    groupJoinStatus.value = 'notJoined';
    // 重新获取小组详情
    fetchGroupDetail();
  } catch (error) {
    ElMessage.error('退出小组失败');
    console.error('退出小组失败:', error);
  }
};

// 处理管理小组
const handleManage = () => {
  ElMessage.info('管理功能开发中');
};

// 发布帖子
const handleCreatePost = async () => {
  if (!newPost.content.trim()) {
    ElMessage.warning('请输入帖子内容');
    return;
  }

  try {
    const postData = {
      content: newPost.content,
      images: newPost.images,
    };
    await groupApi.createPost(groupId.value, postData);
    ElMessage.success('帖子发布成功');
    // 重置表单
    newPost.content = '';
    newPost.images = [];
    // 重新获取帖子列表
    fetchGroupPosts();
  } catch (error) {
    ElMessage.error('发布帖子失败');
    console.error('发布帖子失败:', error);
  }
};

// 点赞帖子
const handleLikePost = async postId => {
  try {
    const response = await groupApi.likePost(groupId.value, postId);
    ElMessage.success('点赞成功');
    // 根据API返回的结果更新本地点赞状态
    const post = posts.value.find(p => p._id === postId);
    if (post && response.data) {
      post.likesCount = response.data.likesCount;
      // 更新点赞状态
      if (response.data.liked) {
        likedPosts.value.add(postId);
      } else {
        likedPosts.value.delete(postId);
      }
    }
  } catch (error) {
    ElMessage.error('点赞失败');
    console.error('点赞失败:', error);
  }
};

// 检查是否点赞了帖子
const isLiked = postId => {
  return likedPosts.value.has(postId);
};

// 预览图片
const previewImage = _imageUrl => {
  // 这里可以实现图片预览功能
  ElMessage.info('图片预览功能开发中');
};

// 处理角色变更
const handleChangeRole = async _member => {
  ElMessage.info('角色管理功能开发中');
};

// 格式化日期
const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 处理路由变化
watch(
  () => route.params.id,
  newId => {
    groupId.value = newId;
    fetchGroupDetail();
    fetchGroupPosts();
  }
);

onMounted(() => {
  fetchGroupDetail();
  fetchGroupPosts();
});
</script>

<style scoped>
.group-detail {
  padding: 20px;
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.group-header-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  padding: 30px;
  margin-bottom: 20px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.group-cover {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.group-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-info {
  flex: 1;
}

.group-info h1 {
  margin: 0 0 10px 0;
  color: #fff;
}

.group-description {
  margin: 0 0 15px 0;
  color: #9ca3af;
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.group-tag {
  margin-right: 5px;
}

.group-actions {
  display: flex;
  gap: 10px;
}

.group-tabs {
  margin-top: 20px;
}

.posts-section {
  padding: 20px 0;
}

.create-post-section {
  margin-bottom: 20px;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-item {
  transition: box-shadow 0.2s;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.post-item:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-details .username {
  font-weight: bold;
  margin-right: 10px;
  color: #fff;
}

.user-details .post-time {
  color: #9ca3af;
  font-size: 12px;
}

.post-content {
  margin-bottom: 15px;
  line-height: 1.6;
  color: #e5e7eb;
}

.post-images {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.post-images img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.post-stats {
  display: flex;
  gap: 20px;
}

.members-section {
  padding: 20px 0;
}
</style>
