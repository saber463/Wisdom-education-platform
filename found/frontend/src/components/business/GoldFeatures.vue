<template>
  <div class="gold-features">
    <div class="features-header">
      <h2 class="features-title">
        <i class="fa fa-crown mr-2" />
        黄金会员专属功能
      </h2>
      <p class="features-subtitle">解锁更多高级学习工具和特权</p>
    </div>

    <div class="features-grid">
      <div
        v-for="feature in goldFeatures"
        :key="feature.id"
        class="feature-card"
        :class="{ 'feature-card-active': feature.enabled }"
        @click="toggleFeature(feature.id)"
      >
        <div class="feature-icon" :style="{ background: feature.gradient }">
          <i :class="feature.icon" />
        </div>
        <div class="feature-content">
          <h3 class="feature-name">
            {{ feature.name }}
          </h3>
          <p class="feature-description">
            {{ feature.description }}
          </p>
          <div class="feature-status">
            <span class="status-badge" :class="{ 'status-active': feature.enabled }">
              {{ feature.enabled ? '已启用' : '点击启用' }}
            </span>
          </div>
        </div>
        <div v-if="feature.enabled" class="feature-check">
          <i class="fa fa-check-circle" />
        </div>
      </div>
    </div>

    <div class="advanced-section">
      <h3 class="section-title">高级学习工具</h3>

      <div class="tool-card">
        <div class="tool-header">
          <div class="tool-icon">
            <i class="fa fa-brain" />
          </div>
          <div class="tool-info">
            <h4 class="tool-name">AI 智能辅导</h4>
            <p class="tool-description">24/7 AI 导师，随时解答学习疑问</p>
          </div>
          <label class="toggle-switch">
            <input v-model="aiTutorEnabled" type="checkbox" />
            <span class="toggle-slider" />
          </label>
        </div>
        <div v-if="aiTutorEnabled" class="tool-content">
          <div class="chat-container">
            <div class="chat-messages">
              <div
                v-for="(msg, index) in chatMessages"
                :key="index"
                class="chat-message"
                :class="msg.type"
              >
                <div class="message-avatar">
                  <i :class="msg.type === 'user' ? 'fa fa-user' : 'fa fa-robot'" />
                </div>
                <div class="message-content">
                  {{ msg.content }}
                </div>
              </div>
            </div>
            <div class="chat-input">
              <input
                v-model="newMessage"
                type="text"
                placeholder="向 AI 导师提问..."
                @keypress.enter="sendMessage"
              />
              <button class="send-button" @click="sendMessage">
                <i class="fa fa-paper-plane" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="tool-card">
        <div class="tool-header">
          <div class="tool-icon">
            <i class="fa fa-chart-line" />
          </div>
          <div class="tool-info">
            <h4 class="tool-name">学习分析报告</h4>
            <p class="tool-description">深度分析学习数据，提供个性化建议</p>
          </div>
          <button class="generate-button" @click="generateReport">
            <i class="fa fa-magic mr-2" />
            生成报告
          </button>
        </div>
        <div v-if="reportGenerated" class="tool-content">
          <div class="report-stats">
            <div class="stat-item">
              <div class="stat-value">
                {{ learningStats.totalHours }}
              </div>
              <div class="stat-label">总学习时长</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">
                {{ learningStats.completedCourses }}
              </div>
              <div class="stat-label">完成课程</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ learningStats.accuracy }}%</div>
              <div class="stat-label">准确率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">
                {{ learningStats.streak }}
              </div>
              <div class="stat-label">连续学习天数</div>
            </div>
          </div>
          <div class="report-recommendations">
            <h5 class="recommendations-title">个性化建议</h5>
            <ul class="recommendations-list">
              <li v-for="(rec, index) in recommendations" :key="index">
                <i class="fa fa-lightbulb mr-2" />
                {{ rec }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="tool-card">
        <div class="tool-header">
          <div class="tool-icon">
            <i class="fa fa-users" />
          </div>
          <div class="tool-info">
            <h4 class="tool-name">专属学习群组</h4>
            <p class="tool-description">加入黄金会员专属学习社区</p>
          </div>
          <button class="join-button" @click="joinCommunity">
            <i class="fa fa-door-open mr-2" />
            加入群组
          </button>
        </div>
      </div>

      <div class="tool-card">
        <div class="tool-header">
          <div class="tool-icon">
            <i class="fa fa-gift" />
          </div>
          <div class="tool-info">
            <h4 class="tool-name">专属礼包</h4>
            <p class="tool-description">每月领取黄金会员专属学习资源</p>
          </div>
          <button class="claim-button" @click="claimGift">
            <i class="fa fa-download mr-2" />
            领取礼包
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const goldFeatures = ref([
  {
    id: 'priority-support',
    name: '优先客服支持',
    description: '享受 24 小时优先客服响应',
    icon: 'fa fa-headset',
    gradient: 'linear-gradient(135deg, #ffd700, #ffed4a)',
    enabled: false,
  },
  {
    id: 'unlimited-ai',
    name: '无限 AI 生成',
    description: '无限制使用 AI 学习路径生成',
    icon: 'fa fa-infinity',
    gradient: 'linear-gradient(135deg, #00f2ff, #0099ff)',
    enabled: false,
  },
  {
    id: 'exclusive-content',
    name: '独家内容',
    description: '访问黄金会员专属学习资源',
    icon: 'fa fa-gem',
    gradient: 'linear-gradient(135deg, #bd00ff, #7c00ff)',
    enabled: false,
  },
  {
    id: 'offline-mode',
    name: '离线学习',
    description: '下载课程离线学习',
    icon: 'fa fa-download',
    gradient: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
    enabled: false,
  },
]);

const aiTutorEnabled = ref(false);
const reportGenerated = ref(false);
const chatMessages = ref([
  {
    type: 'ai',
    content: '你好！我是你的 AI 学习导师，有什么可以帮助你的吗？',
  },
]);
const newMessage = ref('');

const learningStats = ref({
  totalHours: 156,
  completedCourses: 24,
  accuracy: 87,
  streak: 15,
});

const recommendations = ref([
  '建议加强 Python 数据分析方面的学习',
  '你的 JavaScript 基础很扎实，可以尝试进阶内容',
  '保持每天 2 小时的学习习惯，效果会更好',
  '可以多参与社区讨论，提升实战能力',
]);

const toggleFeature = featureId => {
  const feature = goldFeatures.value.find(f => f.id === featureId);
  if (feature) {
    feature.enabled = !feature.enabled;
    saveFeatureSettings();
  }
};

const sendMessage = () => {
  if (!newMessage.value.trim()) return;

  chatMessages.value.push({
    type: 'user',
    content: newMessage.value,
  });

  setTimeout(() => {
    chatMessages.value.push({
      type: 'ai',
      content: '这是一个很好的问题！让我来为你解答...',
    });
  }, 1000);

  newMessage.value = '';
};

const generateReport = () => {
  reportGenerated.value = true;
};

const joinCommunity = () => {
  alert('正在跳转到黄金会员专属社区...');
};

const claimGift = () => {
  alert('礼包已领取到您的账户！');
};

const saveFeatureSettings = () => {
  const settings = goldFeatures.value.map(f => ({
    id: f.id,
    enabled: f.enabled,
  }));
  localStorage.setItem('goldFeatures', JSON.stringify(settings));
};

const loadFeatureSettings = () => {
  const saved = localStorage.getItem('goldFeatures');
  if (saved) {
    const settings = JSON.parse(saved);
    settings.forEach(setting => {
      const feature = goldFeatures.value.find(f => f.id === setting.id);
      if (feature) {
        feature.enabled = setting.enabled;
      }
    });
  }
};

loadFeatureSettings();
</script>

<style scoped>
.gold-features {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.features-header {
  text-align: center;
  margin-bottom: 32px;
}

.features-title {
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.features-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.feature-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.2);
}

.feature-card-active {
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
  margin-bottom: 16px;
}

.feature-content {
  margin-bottom: 16px;
}

.feature-name {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.feature-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  line-height: 1.5;
}

.feature-status {
  margin-top: 12px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-active {
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  color: #0f172a;
  font-weight: 600;
}

.feature-check {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  font-size: 12px;
  animation: check-pop 0.3s ease-out;
}

@keyframes check-pop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.advanced-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 32px;
}

.section-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tool-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.tool-card:hover {
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.1);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20px;
  flex-shrink: 0;
}

.tool-info {
  flex: 1;
}

.tool-name {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.tool-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.generate-button,
.join-button,
.claim-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.generate-button:hover,
.join-button:hover,
.claim-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 242, 255, 0.3);
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.tool-content {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-container {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  overflow: hidden;
}

.chat-messages {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 14px;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: rgba(255, 255, 255, 0.2);
}

.message-content {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 14px;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  max-width: 70%;
}

.chat-message.user .message-content {
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.chat-input input:focus {
  border-color: var(--tech-blue);
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
}

.chat-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.send-button {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border: none;
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 242, 255, 0.3);
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.report-recommendations {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 16px;
}

.recommendations-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations-list li {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.recommendations-list li:last-child {
  border-bottom: none;
}

.recommendations-list li i {
  color: var(--tech-blue);
  margin-right: 8px;
}
</style>
