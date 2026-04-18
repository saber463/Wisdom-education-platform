<template>
  <div class="course-create-page min-h-screen py-10 bg-[#f8fafc]">
    <div class="container mx-auto px-4 max-w-6xl">
      <!-- 页面头部：增加渐变效果和更清晰的层次 -->
      <div class="mb-10 p-8 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
        <div class="relative z-10">
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">创建卓越课程</h1>
          <p class="text-gray-500 text-base mt-2 max-w-md">通过智学AI平台，将您的专业知识转化为影响深远的在线课程。</p>
        </div>
        <button @click="$router.back()" class="relative z-10 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all flex items-center gap-2 text-sm font-bold border border-gray-200">
          <i class="fa fa-arrow-left"></i> 返回上一页
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- 左侧：表单主区 (占 8 列) -->
        <div class="lg:col-span-8 space-y-8">
          <!-- 核心内容卡片 -->
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <h3 class="font-bold text-gray-800 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <i class="fa fa-info"></i>
                </span>
                课程基本信息
              </h3>
              <span class="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Step 1</span>
            </div>
            
            <div class="p-8 space-y-6">
              <!-- 课程标题：增强视觉焦点 -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  课程标题 <span class="text-red-400">*</span>
                </label>
                <div class="relative group">
                  <input
                    v-model="courseForm.title"
                    type="text"
                    placeholder="例如：Vue3 从入门到专家级实战"
                    class="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-lg font-medium placeholder:text-gray-300"
                  />
                  <i class="fa fa-pencil absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors"></i>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-3">所属分类</label>
                  <div class="relative">
                    <select v-model="courseForm.category" class="w-full appearance-none px-5 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-gray-700">
                      <option value="frontend">前端开发</option>
                      <option value="backend">后端开发</option>
                      <option value="ai">人工智能</option>
                      <option value="design">设计/艺术</option>
                    </select>
                    <i class="fa fa-angle-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-3">难度系数</label>
                  <div class="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                    <button 
                      v-for="lv in [{id:'beginner',l:'入门'},{id:'intermediate',l:'进阶'},{id:'advanced',l:'高级'}]" 
                      :key="lv.id"
                      @click="courseForm.level = lv.id"
                      class="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      :class="courseForm.level === lv.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                    >
                      {{ lv.l }}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">详细介绍</label>
                <textarea
                  v-model="courseForm.description"
                  rows="5"
                  placeholder="用生动的语言描述这门课程的价值..."
                  class="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none font-medium placeholder:text-gray-300"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- 课程大纲卡片：交互式设计 -->
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <h3 class="font-bold text-gray-800 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <i class="fa fa-list"></i>
                </span>
                教学大纲设计
              </h3>
              <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Step 2</span>
            </div>
            
            <div class="p-8 space-y-6">
              <div v-for="(chapter, idx) in courseForm.chapters" :key="idx" class="group relative p-6 rounded-2xl border-2 border-gray-50 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 text-sm flex items-center justify-center font-black">
                    {{ (idx + 1).toString().padStart(2, '0') }}
                  </div>
                  <input 
                    v-model="chapter.title" 
                    type="text" 
                    placeholder="输入章节名称" 
                    class="flex-1 bg-transparent border-none text-lg font-bold text-gray-800 focus:ring-0 p-0 placeholder:text-gray-200" 
                  />
                  <button @click="removeChapter(idx)" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
                <div class="relative">
                  <textarea 
                    v-model="chapter.content" 
                    placeholder="描述本章节的学习要点和目标..." 
                    class="w-full bg-gray-50/50 border-2 border-transparent rounded-xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-indigo-100 transition-all resize-none" 
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <button @click="addChapter" class="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-sm font-bold flex items-center justify-center gap-2">
                <i class="fa fa-plus-circle text-lg"></i> 规划下一个章节
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：侧边设置栏 (占 4 列) -->
        <div class="lg:col-span-4 space-y-8">
          <!-- 封面卡片 -->
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h4 class="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
              <i class="fa fa-image text-blue-500"></i> 视觉封面
            </h4>
            <div class="aspect-video rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer group overflow-hidden relative">
              <div v-if="!courseForm.cover" class="text-center p-6 transition-transform group-hover:scale-105">
                <div class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-50">
                  <i class="fa fa-cloud-upload text-2xl text-blue-400"></i>
                </div>
                <p class="text-sm font-bold text-gray-600">点击上传</p>
                <p class="text-xs text-gray-400 mt-2">支持 JPG/PNG, 最大 2MB</p>
              </div>
              <img v-else :src="courseForm.cover" class="w-full h-full object-cover" />
            </div>
          </div>

          <!-- 设置卡片 -->
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h4 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <i class="fa fa-cog text-gray-400"></i> 发布设置
            </h4>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-amber-50/30 transition-colors group">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <i class="fa fa-crown"></i>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-gray-800">VIP 专属</p>
                    <p class="text-[10px] text-gray-400">仅限付费会员学习</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="courseForm.isVIP" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div class="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-blue-50/30 transition-colors group">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <i class="fa fa-globe"></i>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-gray-800">公开展示</p>
                    <p class="text-[10px] text-gray-400">允许在课程列表检索</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="courseForm.isPublic" class="sr-only peer" checked>
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <!-- 操作按钮区 -->
          <div class="space-y-4">
            <button @click="submitCourse" class="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-95">
              <i class="fa fa-rocket"></i> 立即发布课程
            </button>
            <button class="w-full py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-3xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2">
              <i class="fa fa-save"></i> 暂存到草稿箱
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

const router = useRouter();

const courseForm = ref({
  title: '',
  category: 'frontend',
  level: 'beginner',
  description: '',
  cover: '',
  isVIP: false,
  isPublic: true,
  chapters: [
    { title: '第一章：基础概念与环境准备', content: '' }
  ]
});

const addChapter = () => {
  courseForm.value.chapters.push({ 
    title: `第${courseForm.value.chapters.length + 1}章：核心知识点解析`, 
    content: '' 
  });
};

const removeChapter = (index) => {
  if (courseForm.value.chapters.length > 1) {
    courseForm.value.chapters.splice(index, 1);
  } else {
    ElMessage.warning('课程至少需要一个教学章节');
  }
};

const submitCourse = () => {
  if (!courseForm.value.title) return ElMessage.error('请为您的卓越课程起一个标题');
  if (courseForm.value.chapters.some(c => !c.title)) return ElMessage.error('请完善所有章节的标题');
  
  ElMessage.success({
    message: '🎉 恭喜！课程发布成功',
    duration: 3000
  });
  setTimeout(() => router.push('/dashboard'), 1500);
};
</script>

<style scoped>
.course-create-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 输入框焦点动画增强 */
input:focus, select:focus, textarea:focus {
  transform: translateY(-1px);
}

/* 按钮点击波纹模拟 */
button:active {
  transform: scale(0.98);
}
</style>
