<template>
  <div v-if="showModal" class="interest-modal-overlay">
    <div class="interest-modal">
      <div class="modal-header">
        <h2 class="modal-title">选择您的学习兴趣</h2>
        <p class="modal-subtitle">选择您感兴趣的学习方向，我们将为您推荐相关内容</p>
      </div>

      <div class="modal-body">
        <div class="interests-grid">
          <div
            v-for="interest in interests"
            :key="interest.id"
            class="interest-card"
            :class="{ selected: selectedInterests.includes(interest.id) }"
            @click="toggleInterest(interest.id)"
          >
            <div class="interest-icon" :style="{ background: interest.color }">
              <i :class="interest.icon" />
            </div>
            <div class="interest-info">
              <h3 class="interest-name">
                {{ interest.name }}
              </h3>
              <p class="interest-desc">
                {{ interest.description }}
              </p>
            </div>
            <div v-if="selectedInterests.includes(interest.id)" class="check-icon">
              <i class="fa fa-check-circle" />
            </div>
          </div>
        </div>

        <div class="selected-count">
          <span>已选择 {{ selectedInterests.length }} 个兴趣方向</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-skip" @click="handleSkip">跳过</button>
        <button class="btn-save" @click="handleSave" :disabled="selectedInterests.length === 0">
          <i class="fa fa-check mr-2" />保存选择
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { useNotificationStore } from '@/store/notification';
import { userApi } from '@/utils/api';

const userStore = useUserStore();
const notificationStore = useNotificationStore();

const showModal = ref(false);
const selectedInterests = ref([]);

const interests = [
  {
    id: 'frontend',
    name: '前端开发',
    description: 'HTML, CSS, JavaScript, Vue, React等',
    icon: 'fa fa-code',
    color: 'linear-gradient(135deg, #00f2ff, #7209b7)',
  },
  {
    id: 'backend',
    name: '后端开发',
    description: 'Node.js, Python, Java, Go等',
    icon: 'fa fa-server',
    color: 'linear-gradient(135deg, #7209b7, #f72585)',
  },
  {
    id: 'data',
    name: '数据分析',
    description: 'Python, Pandas, NumPy, 数据可视化',
    icon: 'fa fa-chart-line',
    color: 'linear-gradient(135deg, #00f2ff, #00ff88)',
  },
  {
    id: 'ai',
    name: '人工智能',
    description: '机器学习, 深度学习, 神经网络',
    icon: 'fa fa-brain',
    color: 'linear-gradient(135deg, #f72585, #ff6b6b)',
  },
  {
    id: 'algorithm',
    name: '算法与数据结构',
    description: 'LeetCode, 数据结构, 算法设计',
    icon: 'fa fa-sitemap',
    color: 'linear-gradient(135deg, #00ff88, #00f2ff)',
  },
  {
    id: 'english',
    name: '英语学习',
    description: '四六级, 雅思, 托福, 商务英语',
    icon: 'fa fa-language',
    color: 'linear-gradient(135deg, #ff6b6b, #f72585)',
  },
  {
    id: 'design',
    name: 'UI/UX设计',
    description: 'Figma, Sketch, 用户体验设计',
    icon: 'fa fa-paint-brush',
    color: 'linear-gradient(135deg, #7209b7, #00f2ff)',
  },
  {
    id: 'devops',
    name: 'DevOps',
    description: 'Docker, Kubernetes, CI/CD, 云服务',
    icon: 'fa fa-cogs',
    color: 'linear-gradient(135deg, #00ff88, #7209b7)',
  },
];

const checkFirstLogin = () => {
  const hasShownInterestModal = localStorage.getItem('has_shown_interest_modal');
  if (!hasShownInterestModal && userStore.isLogin) {
    showModal.value = true;
  }
};

const toggleInterest = interestId => {
  const index = selectedInterests.value.indexOf(interestId);
  if (index === -1) {
    if (selectedInterests.value.length < 5) {
      selectedInterests.value.push(interestId);
    } else {
      notificationStore.warning('最多只能选择5个兴趣方向');
    }
  } else {
    selectedInterests.value.splice(index, 1);
  }
};

const handleSkip = async () => {
  try {
    await userApi.updateProfile({
      learningInterests: [],
    });
    localStorage.setItem('has_shown_interest_modal', 'true');
    showModal.value = false;
    notificationStore.success('您可以随时在个人中心修改兴趣设置');
  } catch (error) {
    console.error('更新用户信息失败:', error);
    notificationStore.error('操作失败，请稍后重试');
  }
};

const handleSave = async () => {
  try {
    const interestNames = selectedInterests.value.map(id => {
      const interest = interests.find(i => i.id === id);
      return interest ? interest.name : id;
    });

    await userApi.updateProfile({
      learningInterests: interestNames,
    });

    localStorage.setItem('has_shown_interest_modal', 'true');
    showModal.value = false;
    notificationStore.success('兴趣设置已保存');

    await userStore.loadUserData();
  } catch (error) {
    console.error('更新用户信息失败:', error);
    notificationStore.error('保存失败，请稍后重试');
  }
};

onMounted(() => {
  checkFirstLogin();
});

defineExpose({
  show: () => {
    showModal.value = true;
  },
});
</script>

<style scoped>
.interest-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.interest-modal {
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(114, 9, 183, 0.05));
  border-bottom: 1px solid rgba(0, 242, 255, 0.1);
  text-align: center;
}

.modal-title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple), var(--tech-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.modal-subtitle {
  font-size: 1rem;
  color: #6b7280;
}

.modal-body {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.interest-card {
  position: relative;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 242, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.interest-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 242, 255, 0.15);
  border-color: rgba(0, 242, 255, 0.3);
}

.interest-card.selected {
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(114, 9, 183, 0.1));
  border-color: var(--tech-blue);
  box-shadow: 0 8px 20px rgba(0, 242, 255, 0.2);
}

.interest-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 1.5rem;
}

.interest-info {
  flex: 1;
}

.interest-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.interest-desc {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.check-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: var(--tech-blue);
  font-size: 1.5rem;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.selected-count {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(114, 9, 183, 0.05));
  border-radius: 12px;
  font-weight: 600;
  color: #4b5563;
}

.modal-footer {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(114, 9, 183, 0.05));
  border-top: 1px solid rgba(0, 242, 255, 0.1);
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-skip {
  padding: 0.875rem 2rem;
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 2px solid rgba(107, 114, 128, 0.2);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-skip:hover {
  background: rgba(107, 114, 128, 0.2);
  transform: translateY(-2px);
}

.btn-save {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 242, 255, 0.5);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .interest-modal {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1.5rem;
  }

  .modal-title {
    font-size: 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .interests-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    flex-direction: column;
  }

  .btn-skip,
  .btn-save {
    width: 100%;
  }
}
</style>
