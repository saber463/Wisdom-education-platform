<template>
  <div class="image-generation min-h-screen">
    <div class="container mx-auto px-4 py-8 relative">
      <h2
        class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-center mb-6 bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink bg-clip-text text-transparent"
      >
        AI图片生成
      </h2>

      <MembershipStatusCard :membership-info="membershipInfo" />

      <div class="max-w-3xl mx-auto">
        <div
          class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20 shadow-xl"
        >
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              图片描述
            </label>
            <textarea
              v-model="prompt"
              placeholder="请输入您想要生成的图片描述，例如：一只可爱的猫咪在花园里玩耍..."
              class="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-300"
              :disabled="isLoading || isAtLimit"
            />
          </div>

          <div class="flex items-center justify-between mb-4">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <span v-if="remainingCount !== Infinity">
                今日剩余次数：{{ remainingCount }} 次
              </span>
              <span v-else> 今日剩余次数：无限 </span>
            </div>
            <button
              @click="handleGenerate"
              :disabled="isLoading || isAtLimit || !prompt.trim()"
              class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <i v-if="isLoading" class="fa fa-spinner fa-spin mr-2" />
              <i v-else class="fa fa-magic mr-2" />
              {{ isLoading ? '生成中...' : '生成图片' }}
            </button>
          </div>

          <div
            v-if="isAtLimit"
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4 text-yellow-700 dark:text-yellow-400 mb-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="fa fa-exclamation-triangle" />
                <span>{{ limitMessage }}</span>
              </div>
              <router-link
                to="/membership"
                class="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                立即升级 <i class="fa fa-arrow-right ml-1" />
              </router-link>
            </div>
          </div>
        </div>

        <div
          v-if="errorMsg"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 text-red-600 dark:text-red-400 mb-6 backdrop-blur-sm"
        >
          <div class="flex items-center gap-2">
            <i class="fa fa-exclamation-circle" />
            <span>{{ errorMsg }}</span>
          </div>
        </div>

        <div
          v-if="generatedImage"
          class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl"
        >
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">生成结果</h3>
          <div class="relative">
            <img
              :src="generatedImage"
              alt="生成的图片"
              class="w-full rounded-lg shadow-lg"
              @load="onImageLoad"
            />
            <div class="absolute top-2 right-2 flex gap-2">
              <button
                @click="downloadImage"
                class="px-3 py-1 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-md"
              >
                <i class="fa fa-download mr-1" />
                下载
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useMembership } from '@/hooks/useMembership';
import MembershipStatusCard from '@/components/business/MembershipStatusCard.vue';
import api from '@/utils/api';

const { membershipInfo, fetchMembershipInfo, isAtLimit } = useMembership();

const prompt = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const generatedImage = ref('');
const remainingCount = ref(0);

const limitMessage = ref('');

const handleGenerate = async () => {
  if (!prompt.value.trim()) {
    errorMsg.value = '请输入图片描述';
    return;
  }

  if (isAtLimit.value) {
    errorMsg.value = limitMessage.value;
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';
  generatedImage.value = '';

  try {
    const response = await api.post('/ai/generate-image', {
      prompt: prompt.value.trim(),
    });

    if (response.success) {
      generatedImage.value = response.imageUrl;
      remainingCount.value = response.remainingCount;
      await fetchGenerationStatus();
    } else {
      errorMsg.value = response.message || '图片生成失败';
    }
  } catch (error) {
    console.error('图片生成错误:', error);
    errorMsg.value = error.response?.data?.message || '图片生成失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
};

const fetchGenerationStatus = async () => {
  try {
    const response = await api.get('/ai/image-generation-status');
    if (response.success) {
      remainingCount.value = response.remainingCount;
      if (response.remainingCount === 0) {
        limitMessage.value = response.message || '今日生成次数已达上限';
      }
    }
  } catch (_error) {
    console.error('获取生成状态失败:', _error);
  }
};

const onImageLoad = () => {
  console.log('图片加载完成');
};

const downloadImage = () => {
  if (!generatedImage.value) return;

  const link = document.createElement('a');
  link.href = generatedImage.value;
  link.download = `ai-generated-${Date.now()}.png`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(async () => {
  await fetchMembershipInfo();
  await fetchGenerationStatus();

  if (membershipInfo.value) {
    const level = membershipInfo.value.level || 'free';
    const limits = {
      free: 3,
      silver: 10,
      gold: Infinity,
    };
    const limit = limits[level] || 3;
    remainingCount.value = membershipInfo.value.remainingGenerations || limit;

    if (remainingCount.value === 0) {
      limitMessage.value = `今日生成次数已达上限 (${limit}次)，请明天再试`;
    }
  }
});
</script>

<style scoped>
.image-generation {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

.image-generation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 242, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(114, 9, 183, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(247, 37, 133, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

img {
  max-height: 600px;
  object-fit: contain;
}
</style>
