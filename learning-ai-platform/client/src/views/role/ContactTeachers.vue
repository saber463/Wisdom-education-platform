<template>
  <div class="contact-teachers-page min-h-screen bg-gray-50 p-4 md:p-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <button @click="router.back()" class="p-2 hover:bg-white rounded-full transition-colors text-gray-500">
          <i class="fa fa-arrow-left"></i>
        </button>
        <h1 class="text-2xl font-bold text-gray-800">联系任课老师</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 老师列表 -->
        <div class="lg:col-span-1 space-y-4">
          <div 
            v-for="teacher in teachers" 
            :key="teacher.id"
            @click="selectTeacher(teacher)"
            class="teacher-card p-4 rounded-2xl cursor-pointer transition-all border-2"
            :class="selectedTeacher?.id === teacher.id ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-transparent hover:border-gray-200'"
          >
            <div class="flex items-center gap-3">
              <div class="relative">
                <img :src="teacher.avatar" class="w-12 h-12 rounded-full border border-gray-100" />
                <div v-if="teacher.online" class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-gray-800">{{ teacher.name }}</h4>
                  <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{{ teacher.subject }}</span>
                </div>
                <p class="text-xs text-gray-400 line-clamp-1 mt-1">{{ teacher.lastMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 对话框 -->
        <div class="lg:col-span-2 flex flex-col h-[600px] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <template v-if="selectedTeacher">
            <!-- 对话头部 -->
            <div class="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
              <div class="flex items-center gap-3">
                <img :src="selectedTeacher.avatar" class="w-10 h-10 rounded-full" />
                <div>
                  <h3 class="font-bold text-gray-800">{{ selectedTeacher.name }}</h3>
                  <p class="text-xs text-green-500">{{ selectedTeacher.online ? '在线' : '离线' }} · {{ selectedTeacher.subject }}老师</p>
                </div>
              </div>
              <div class="flex items-center gap-4 text-gray-400">
                <i class="fa fa-phone hover:text-blue-500 cursor-pointer"></i>
                <i class="fa fa-video hover:text-blue-500 cursor-pointer"></i>
                <i class="fa fa-ellipsis-v hover:text-blue-500 cursor-pointer"></i>
              </div>
            </div>

            <!-- 消息列表 -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              <div v-for="(msg, i) in chatHistory" :key="i" :class="['flex', msg.from === 'me' ? 'justify-end' : 'justify-start']">
                <div :class="['max-w-[80%] p-3 rounded-2xl text-sm', 
                            msg.from === 'me' ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100']">
                  {{ msg.text }}
                  <div :class="['text-[10px] mt-1 opacity-60', msg.from === 'me' ? 'text-right' : 'text-left']">
                    {{ msg.time }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入框 -->
            <div class="p-4 border-t border-gray-50 bg-white">
              <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <button class="p-2 text-gray-400 hover:text-blue-500"><i class="fa fa-paperclip"></i></button>
                <input 
                  v-model="newMessage" 
                  @keyup.enter="sendMessage"
                  placeholder="给老师发个消息吧..." 
                  class="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 py-2" 
                />
                <button @click="sendMessage" class="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                  <i class="fa fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </template>

          <!-- 未选择老师状态 -->
          <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <i class="fa fa-comments text-4xl opacity-20"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-600 mb-2">欢迎来到家校通</h3>
            <p class="text-sm max-w-xs">请从左侧选择一位老师，开始沟通孩子近期的学习表现。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const selectedTeacher = ref(null);
const newMessage = ref('');

const teachers = ref([
  { id: 1, name: '张老师', subject: 'Python 基础', avatar: 'https://ui-avatars.com/api/?name=张&background=6366f1&color=fff', online: true, lastMessage: '小明最近的作业完成得很棒！' },
  { id: 2, name: '李老师', subject: '算法竞赛', avatar: 'https://ui-avatars.com/api/?name=李&background=10b981&color=fff', online: false, lastMessage: '关于昨天的递归算法，我有几个点想谈谈。' },
  { id: 3, name: '王老师', subject: 'Web 前端', avatar: 'https://ui-avatars.com/api/?name=王&background=ec4899&color=fff', online: true, lastMessage: '请提醒孩子注意 CSS 布局的基础练习。' },
]);

const chatHistory = ref([
  { from: 'teacher', text: '您好，我是张老师。最近小明在课堂上非常积极。', time: '09:30' },
  { from: 'me', text: '张老师您好，谢谢您的反馈！他在家里也一直在练习。', time: '09:45' },
  { from: 'teacher', text: '不错，继续保持。特别是他的逻辑思维能力提升很快。', time: '09:50' },
]);

const selectTeacher = (teacher) => {
  selectedTeacher.value = teacher;
};

const sendMessage = () => {
  if (!newMessage.value.trim()) return;
  
  chatHistory.value.push({
    from: 'me',
    text: newMessage.value,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  const tempMsg = newMessage.value;
  newMessage.value = '';

  // 模拟自动回复
  setTimeout(() => {
    chatHistory.value.push({
      from: 'teacher',
      text: `收到您的消息："${tempMsg}"。我会在课间休息时给您详细回复。`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }, 1500);
};
</script>

<style scoped>
.teacher-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.teacher-card:hover {
  transform: translateX(4px);
}
</style>