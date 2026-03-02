<template>
  <div class="group-create">
    <div class="page-header">
      <h1>创建学习小组</h1>
      <el-button @click="navigateBack"> 返回 </el-button>
    </div>

    <el-card class="create-form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        label-width="100px"
      >
        <el-form-item label="小组名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入小组名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="小组描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入小组描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="小组头像">
          <el-upload
            v-model="formData.avatar"
            action=""
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarChange"
          >
            <div v-if="formData.avatar" class="avatar-preview">
              <img :src="formData.avatar" alt="小组头像" />
            </div>
            <el-button v-else type="primary">
              <el-icon><Plus /></el-icon>上传头像
            </el-button>
          </el-upload>
        </el-form-item>

        <el-form-item label="加入方式" prop="joinType">
          <el-radio-group v-model="formData.joinType">
            <el-radio label="free"> 自由加入 </el-radio>
            <el-radio label="approval"> 需要审核 </el-radio>
            <el-radio label="closed"> 禁止加入 </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="formData.joinType === 'approval'" label="审核说明">
          <el-input
            v-model="formData.approvalDescription"
            type="textarea"
            :rows="2"
            placeholder="请输入审核要求"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="小组标签">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            placeholder="请选择或输入标签"
            style="width: 100%"
          >
            <el-option v-for="tag in recommendedTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            创建小组
          </el-button>
          <el-button @click="resetForm"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { groupApi } from '@/utils/api';

const router = useRouter();
const formRef = ref(null);
const submitting = ref(false);

// 推荐标签
const recommendedTags = [
  '编程',
  '前端',
  '后端',
  '人工智能',
  '机器学习',
  '数据科学',
  '算法',
  'Python',
  'JavaScript',
  'Java',
  '深度学习',
  '计算机科学',
  '数据分析',
  '大数据',
  '云计算',
];

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  avatar: '',
  joinType: 'free', // free: 自由加入, approval: 需要审核, closed: 禁止加入
  approvalDescription: '',
  tags: [],
});

// 表单规则
const rules = {
  name: [
    { required: true, message: '请输入小组名称', trigger: 'blur' },
    { min: 2, max: 20, message: '小组名称长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入小组描述', trigger: 'blur' },
    { min: 5, max: 200, message: '小组描述长度在 5 到 200 个字符', trigger: 'blur' },
  ],
  joinType: [{ required: true, message: '请选择加入方式', trigger: 'change' }],
};

// 处理头像上传
const handleAvatarChange = file => {
  const reader = new FileReader();
  reader.onload = e => {
    formData.avatar = e.target.result;
  };
  reader.readAsDataURL(file.raw);
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      submitting.value = true;
      try {
        // 过滤掉空字段
        const submitData = {
          ...formData,
          tags: formData.tags.filter(tag => tag),
        };

        await groupApi.create(submitData);
        ElMessage.success('小组创建成功');
        router.push('/groups');
      } catch (error) {
        ElMessage.error('小组创建失败');
        console.error('创建小组失败:', error);
      } finally {
        submitting.value = false;
      }
    } else {
      return false;
    }
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 返回上一页
const navigateBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.group-create {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.create-form-card {
  max-width: 600px;
  margin: 0 auto;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #ddd;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
