<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-dark mb-6">发布学习推文</h2>

      <div class="card">
        <form class="space-y-6 p-6" @submit.prevent="handlePublish">
          <div>
            <label class="block text-gray-700 font-medium mb-2">推文内容</label>
            <textarea
              v-model="content"
              class="input-primary h-40 resize-none"
              placeholder="分享你的学习经验、备考技巧或问题..."
              required
            />
            <p class="text-gray-500 text-sm mt-1">字数限制：1-500字</p>
          </div>

          <div>
            <label class="block text-gray-700 font-medium mb-2">添加图片（可选）</label>
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
              @click="document.getElementById('imageInput').click()"
            >
              <input id="imageInput" type="file" class="hidden" accept="image/*" multiple />
              <i class="fa fa-image text-gray-400 text-2xl mb-2" />
              <p class="text-gray-500">点击上传图片（最多9张）</p>
            </div>

            <div v-if="previewImages.length" class="grid grid-cols-3 gap-2 mt-3">
              <div v-for="(img, idx) in previewImages" :key="idx" class="relative h-32">
                <img :src="img" alt="预览图" class="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  @click="removeImage(idx)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div class="input-group">
            <label class="block text-gray-700 font-medium mb-2">添加话题（可选）</label>
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
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
            <input
              v-model="topic"
              class="input-primary"
              placeholder="输入话题，多个话题用空格分隔（如：#英语四级 #学习方法）"
            />
          </div>

          <div class="flex justify-end">
            <Button type="secondary" class="mr-3" @click="resetForm"> 取消 </Button>
            <Button type="primary" :disabled="isLoading">
              <span v-if="!isLoading">发布推文</span>
              <span v-if="isLoading">发布中...</span>
              <div v-if="isLoading" class="loader ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/common/Button.vue';
import { tweetApi } from '@/utils/api';
import config from '@/config';
import { useNotificationStore } from '@/store/notification';

const router = useRouter();
const notificationStore = useNotificationStore();

// 表单数据
const content = ref('');
const topic = ref('');
const selectedImages = ref([]);
const previewImages = ref([]);
const isLoading = ref(false);

// 重置表单
const resetForm = () => {
  content.value = '';
  topic.value = '';
  selectedImages.value = [];
  previewImages.value = [];
};

// 处理图片选择
const handleFileChange = event => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  // 限制上传图片数量（最多9张）
  if (selectedImages.value.length + files.length > 9) {
    notificationStore.error('最多只能上传9张图片');
    return;
  }

  // 处理每张图片
  Array.from(files).forEach(file => {
    // 检查图片大小（限制2MB）
    if (file.size > 2 * 1024 * 1024) {
      notificationStore.error(`${file.name} 图片大小不能超过2MB`);
      return;
    }

    // 检查图片类型
    if (!file.type.startsWith('image/')) {
      notificationStore.error(`${file.name} 不是有效的图片文件`);
      return;
    }

    // 添加到选择的图片列表
    selectedImages.value.push(file);

    // 生成预览URL
    const reader = new FileReader();
    reader.onload = e => {
      previewImages.value.push(e.target.result);
    };
    reader.readAsDataURL(file);
  });

  // 清空文件输入，以便下次可以选择相同的文件
  event.target.value = '';
};

// 移除图片
const removeImage = index => {
  selectedImages.value.splice(index, 1);
  previewImages.value.splice(index, 1);
};

// 发布推文
const handlePublish = async () => {
  if (content.value.length > 500) {
    notificationStore.error('推文内容不能超过500字');
    return;
  }

  // 检查用户是否已登录
  const token = localStorage.getItem(`${config.storagePrefix}token`);
  if (!token) {
    notificationStore.error('您还没有登录，请先登录');
    router.push('/login');
    return;
  }

  isLoading.value = true;

  try {
    // 创建FormData来处理文件上传
    const formData = new FormData();
    formData.append('content', content.value);
    formData.append('topic', topic.value);

    // 处理图片上传
    selectedImages.value.forEach(image => {
      formData.append('images', image);
    });

    // 调用后端API发布推文
    await tweetApi.publish(formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 发布成功跳转到推文列表
    router.push('/tweets');
  } catch (error) {
    // 更详细的错误信息
    const errorMsg = error.response?.data?.message || error.message || '推文发布失败，请稍后重试';
    notificationStore.error(`发布失败: ${errorMsg}`);
  } finally {
    isLoading.value = false;
  }
};

// 监听文件选择
onMounted(() => {
  const fileInput = document.getElementById('imageInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileChange);
  }
});
</script>
