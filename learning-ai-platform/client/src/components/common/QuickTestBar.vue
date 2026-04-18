<template>
  <!-- 测试快捷栏 - 开发测试用 -->
  <div v-if="showBar" class="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
    <button
      @click="toggleExpand"
      class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      title="测试快捷栏"
    >
      <i :class="isExpanded ? 'fa fa-times' : 'fa fa-flask'" />
    </button>
    
    <transition name="expand">
      <div v-if="isExpanded" class="bg-white rounded-xl shadow-2xl border border-gray-100 p-3 min-w-[200px]">
        <div class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">快速登录测试</div>
        <div class="space-y-2">
          <button
            v-for="account in testAccounts"
            :key="account.email"
            @click="loginAs(account)"
            class="w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center gap-2"
            :class="currentEmail === account.email 
              ? 'bg-blue-50 text-blue-600 font-medium' 
              : 'hover:bg-gray-50 text-gray-600'"
          >
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs" :class="account.bgClass">
              {{ account.icon }}
            </span>
            <span>{{ account.label }}</span>
          </button>
        </div>
        <div class="border-t border-gray-100 mt-3 pt-3 flex gap-2">
          <button @click="goTo('/')" class="flex-1 px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            首页
          </button>
          <button @click="goTo('/dashboard')" class="flex-1 px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            仪表盘
          </button>
          <button @click="goTo('/learning/code-generator')" class="flex-1 px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            代码
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { userApi } from '@/utils/api';

const router = useRouter();
const userStore = useUserStore();

const showBar = true; // 开发时显示，生产环境可设为 false
const isExpanded = ref(false);

const currentEmail = computed(() => userStore.userInfo?.email || '');

const testAccounts = [
  {
    email: 'student1@test.com',
    password: 'Student123!',
    label: '学生账号',
    icon: '🎒',
    bgClass: 'bg-blue-100 text-blue-600'
  },
  {
    email: 'teacher1@test.com',
    password: 'Teacher123!',
    label: '导师账号',
    icon: '🧑‍🏫',
    bgClass: 'bg-purple-100 text-purple-600'
  },
  {
    email: 'parent1@test.com',
    password: 'Parent123!',
    label: '家长账号',
    icon: '👪',
    bgClass: 'bg-green-100 text-green-600'
  },
  {
    email: 'vip1@test.com',
    password: 'Vip12345!',
    label: 'VIP会员',
    icon: '👑',
    bgClass: 'bg-amber-100 text-amber-600'
  },
];

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const loginAs = (account) => {
  isExpanded.value = false;
  // 跳转登录页，通过URL参数传递账号密码
  window.location.href = `/login?email=${encodeURIComponent(account.email)}&password=${encodeURIComponent(account.password)}`;
};

const goTo = (path) => {
  router.push(path);
  isExpanded.value = false;
};
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
