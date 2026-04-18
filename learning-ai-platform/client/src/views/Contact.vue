<template>
  <div class="contact-page max-w-4xl mx-auto py-8">
    <div class="bg-gray-800/80 rounded-2xl p-8 border border-gray-700">
      <h1 class="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <i class="fa fa-headset text-purple-400"></i>
        联系我们
      </h1>

      <p class="text-gray-300 mb-8 leading-relaxed">
        我们随时欢迎您的来信！无论是产品反馈、功能建议，还是遇到任何问题，您都可以通过以下方式联系我们。我们的团队会在1-3个工作日内回复您。
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- 联系方式卡片 -->
        <div class="bg-gray-700/50 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fa fa-address-card text-purple-400"></i>
            联系方式
          </h2>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <i class="fa fa-envelope text-purple-400"></i>
              </div>
              <div>
                <div class="text-sm text-gray-400">邮箱</div>
                <div class="text-white">support@ai-learning.com</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <i class="fa fa-phone text-blue-400"></i>
              </div>
              <div>
                <div class="text-sm text-gray-400">电话</div>
                <div class="text-white">400-123-4567</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <i class="fa fa-clock text-green-400"></i>
              </div>
              <div>
                <div class="text-sm text-gray-400">服务时间</div>
                <div class="text-white">周一至周五 9:00-18:00</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <i class="fa fa-map-marker-alt text-orange-400"></i>
              </div>
              <div>
                <div class="text-sm text-gray-400">地址</div>
                <div class="text-white">四川省成都市高新区某路123号</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 社交媒体 -->
        <div class="bg-gray-700/50 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fa fa-share-alt text-purple-400"></i>
            社交媒体
          </h2>
          <div class="space-y-4">
            <a href="#" class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
              <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <i class="fa fa-weixin text-green-400"></i>
              </div>
              <div>
                <div class="text-white group-hover:text-purple-400 transition-colors">微信公众号</div>
                <div class="text-sm text-gray-400">AI学习助手</div>
              </div>
            </a>
            <a href="#" class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
              <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <i class="fa fa-weibo text-red-400"></i>
              </div>
              <div>
                <div class="text-white group-hover:text-purple-400 transition-colors">官方微博</div>
                <div class="text-sm text-gray-400">AI学习助手官方</div>
              </div>
            </a>
            <a href="#" class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
              <div class="w-10 h-10 rounded-lg bg-gray-600/50 flex items-center justify-center">
                <i class="fa fa-github text-white"></i>
              </div>
              <div>
                <div class="text-white group-hover:text-purple-400 transition-colors">GitHub</div>
                <div class="text-sm text-gray-400">ai-learning-platform</div>
              </div>
            </a>
            <a href="#" class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
              <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <i class="fa fa-comments text-indigo-400"></i>
              </div>
              <div>
                <div class="text-white group-hover:text-purple-400 transition-colors">在线客服</div>
                <div class="text-sm text-gray-400">点击开始对话</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- 反馈表单 -->
      <div class="bg-gray-700/50 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i class="fa fa-paper-plane text-purple-400"></i>
          意见反馈
        </h2>
        <form @submit.prevent="submitFeedback" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">您的姓名</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="请输入姓名"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">邮箱地址</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">反馈类型</label>
            <select
              v-model="form.type"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="suggestion">功能建议</option>
              <option value="bug">问题反馈</option>
              <option value="complaint">投诉建议</option>
              <option value="cooperation">商务合作</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">详细描述</label>
            <textarea
              v-model="form.message"
              rows="4"
              placeholder="请详细描述您的问题或建议..."
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            ></textarea>
          </div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <i v-if="isSubmitting" class="fa fa-spinner fa-spin mr-2"></i>
            {{ isSubmitting ? '提交中...' : '提交反馈' }}
          </button>
        </form>

        <!-- 提交成功提示 -->
        <div v-if="submitted" class="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-center">
          <i class="fa fa-check-circle mr-2"></i>
          感谢您的反馈！我们会尽快处理并回复您。
        </div>
      </div>

      <!-- FAQ -->
      <div class="mt-8">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i class="fa fa-question-circle text-purple-400"></i>
          常见问题
        </h2>
        <div class="space-y-3">
          <div v-for="faq in faqs" :key="faq.q" class="bg-gray-700/50 rounded-lg overflow-hidden">
            <button
              @click="faq.open = !faq.open"
              class="w-full px-4 py-3 text-left text-white flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span>{{ faq.q }}</span>
              <i :class="['fa', faq.open ? 'fa-chevron-up' : 'fa-chevron-down', 'text-gray-400']"></i>
            </button>
            <div v-if="faq.open" class="px-4 pb-3 text-gray-400 text-sm">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const form = reactive({
  name: '',
  email: '',
  type: 'suggestion',
  message: ''
});

const isSubmitting = ref(false);
const submitted = ref(false);

const submitFeedback = async () => {
  if (!form.name || !form.email || !form.message) {
    alert('请填写完整信息');
    return;
  }

  isSubmitting.value = true;

  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 1500));

  isSubmitting.value = false;
  submitted.value = true;

  // 重置表单
  form.name = '';
  form.email = '';
  form.type = 'suggestion';
  form.message = '';

  // 3秒后隐藏成功提示
  setTimeout(() => {
    submitted.value = false;
  }, 5000);
};

const faqs = reactive([
  { q: '如何联系人工客服？', a: '您可以通过页面右侧的在线客服图标直接对话，或发送邮件至 support@ai-learning.com，我们会在1-3个工作日内回复。', open: false },
  { q: '提交反馈后多久能收到回复？', a: '我们承诺在1-3个工作日内处理您的反馈并回复您。对于紧急问题，建议直接拨打客服热线。', open: false },
  { q: '如何申请功能定制服务？', a: '如需定制化开发服务，请通过商务合作渠道联系我们，提供您的需求描述，我们的商务团队会尽快与您对接。', open: false },
  { q: '平台出现了技术问题怎么办？', a: '请通过反馈表单提交问题报告，选择"问题反馈"类型并详细描述您遇到的问题，我们的 技术团队会优先处理。', open: false },
  { q: '如何加入我们的社区？', a: '您可以关注我们的微信公众号"AI学习助手"，或在GitHub上关注我们的项目获取最新动态和社区邀请。', open: false }
]);
</script>
