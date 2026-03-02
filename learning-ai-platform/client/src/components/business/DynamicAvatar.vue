<template>
  <div class="dynamic-avatar-container">
    <div class="avatar-display">
      <div
        class="avatar-frame"
        :class="{ 'avatar-frame-silver': isSilverMember, 'avatar-frame-gold': isGoldMember }"
      >
        <div class="avatar-image" :style="avatarStyle">
          <div v-if="!customAvatar" class="avatar-placeholder">
            <i class="fa fa-user" />
          </div>
          <img v-else :src="customAvatar" alt="Avatar" class="avatar-img" />
        </div>
        <div v-if="isSilverMember || isGoldMember" class="avatar-glow" />
      </div>
      <div v-if="isSilverMember || isGoldMember" class="avatar-badge">
        <i :class="isGoldMember ? 'fa fa-crown' : 'fa fa-star'" />
      </div>
    </div>

    <div v-if="isSilverMember || isGoldMember" class="avatar-controls">
      <h3 class="controls-title">个性化头像</h3>

      <div class="control-section">
        <label class="control-label">上传自定义头像</label>
        <div class="upload-area" @click="triggerFileUpload">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="handleFileUpload"
          />
          <div class="upload-content">
            <i class="fa fa-cloud-upload-alt upload-icon" />
            <span class="upload-text">点击上传图片</span>
            <span class="upload-hint">支持 JPG、PNG、GIF 格式</span>
          </div>
        </div>
      </div>

      <div class="control-section">
        <label class="control-label">选择动态效果</label>
        <div class="effects-grid">
          <div
            v-for="effect in effects"
            :key="effect.id"
            class="effect-card"
            :class="{ 'effect-card-active': selectedEffect === effect.id }"
            @click="selectEffect(effect.id)"
          >
            <div class="effect-preview" :class="effect.class">
              <i :class="effect.icon" />
            </div>
            <span class="effect-name">{{ effect.name }}</span>
          </div>
        </div>
      </div>

      <div class="control-section">
        <label class="control-label">边框样式</label>
        <div class="borders-grid">
          <div
            v-for="border in borders"
            :key="border.id"
            class="border-card"
            :class="{ 'border-card-active': selectedBorder === border.id }"
            @click="selectBorder(border.id)"
          >
            <div class="border-preview" :style="border.style" />
            <span class="border-name">{{ border.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="upgrade-prompt">
      <div class="prompt-icon">
        <i class="fa fa-lock" />
      </div>
      <h3 class="prompt-title">升级会员解锁</h3>
      <p class="prompt-text">白银及以上会员可使用个性化头像功能</p>
      <router-link to="/membership" class="upgrade-button">
        立即升级 <i class="fa fa-arrow-right ml-2" />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const fileInput = ref(null);

const customAvatar = ref('');
const selectedEffect = ref('none');
const selectedBorder = ref('none');

const isSilverMember = computed(() => {
  return userStore.userInfo?.membershipLevel === 'silver';
});

const isGoldMember = computed(() => {
  return userStore.userInfo?.membershipLevel === 'gold';
});

const avatarStyle = computed(() => {
  const styles = {};

  if (selectedEffect.value !== 'none') {
    const effect = effects.find(e => e.id === selectedEffect.value);
    if (effect) {
      Object.assign(styles, effect.style);
    }
  }

  return styles;
});

const effects = [
  {
    id: 'none',
    name: '无效果',
    icon: 'fa fa-times',
    class: 'effect-none',
    style: {},
  },
  {
    id: 'pulse',
    name: '脉冲',
    icon: 'fa fa-heartbeat',
    class: 'effect-pulse',
    style: {
      animation: 'avatar-pulse 2s ease-in-out infinite',
    },
  },
  {
    id: 'rotate',
    name: '旋转',
    icon: 'fa fa-sync',
    class: 'effect-rotate',
    style: {
      animation: 'avatar-rotate 10s linear infinite',
    },
  },
  {
    id: 'float',
    name: '浮动',
    icon: 'fa fa-arrow-up',
    class: 'effect-float',
    style: {
      animation: 'avatar-float 3s ease-in-out infinite',
    },
  },
  {
    id: 'glow',
    name: '发光',
    icon: 'fa fa-lightbulb',
    class: 'effect-glow',
    style: {
      animation: 'avatar-glow 2s ease-in-out infinite',
    },
  },
  {
    id: 'shake',
    name: '抖动',
    icon: 'fa fa-hand-rock',
    class: 'effect-shake',
    style: {
      animation: 'avatar-shake 0.5s ease-in-out infinite',
    },
  },
];

const borders = [
  {
    id: 'none',
    name: '无边框',
    style: {},
  },
  {
    id: 'silver',
    name: '银色',
    style: {
      border: '3px solid #c0c0c0',
      boxShadow: '0 0 10px rgba(192, 192, 192, 0.5)',
    },
  },
  {
    id: 'gold',
    name: '金色',
    style: {
      border: '3px solid #ffd700',
      boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
    },
  },
  {
    id: 'neon-blue',
    name: '霓虹蓝',
    style: {
      border: '3px solid #00f2ff',
      boxShadow: '0 0 10px rgba(0, 242, 255, 0.5)',
    },
  },
  {
    id: 'neon-purple',
    name: '霓虹紫',
    style: {
      border: '3px solid #bd00ff',
      boxShadow: '0 0 10px rgba(189, 0, 255, 0.5)',
    },
  },
  {
    id: 'rainbow',
    name: '彩虹',
    style: {
      border: '3px solid transparent',
      background:
        'linear-gradient(white, white) padding-box, linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) border-box',
      boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
    },
  },
];

const triggerFileUpload = () => {
  fileInput.value.click();
};

const handleFileUpload = event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    customAvatar.value = e.target.result;
    saveAvatarSettings();
  };
  reader.readAsDataURL(file);
};

const selectEffect = effectId => {
  selectedEffect.value = effectId;
  saveAvatarSettings();
};

const selectBorder = borderId => {
  selectedBorder.value = borderId;
  saveAvatarSettings();
};

const saveAvatarSettings = () => {
  const settings = {
    customAvatar: customAvatar.value,
    selectedEffect: selectedEffect.value,
    selectedBorder: selectedBorder.value,
  };
  localStorage.setItem('avatarSettings', JSON.stringify(settings));
};

const loadAvatarSettings = () => {
  const saved = localStorage.getItem('avatarSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    customAvatar.value = settings.customAvatar || '';
    selectedEffect.value = settings.selectedEffect || 'none';
    selectedBorder.value = settings.selectedBorder || 'none';
  }
};

onMounted(() => {
  loadAvatarSettings();
});
</script>

<style scoped>
.dynamic-avatar-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.avatar-frame {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  position: relative;
  overflow: visible;
  transition: all 0.3s ease;
}

.avatar-frame-silver {
  border: 3px solid #c0c0c0;
  box-shadow: 0 0 20px rgba(192, 192, 192, 0.5);
}

.avatar-frame-gold {
  border: 3px solid #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 48px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-glow {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  opacity: 0.3;
  filter: blur(10px);
  animation: glow-pulse 2s ease-in-out infinite;
  z-index: -1;
}

.avatar-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.avatar-controls {
  margin-top: 24px;
}

.controls-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.control-section {
  margin-bottom: 24px;
}

.control-label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.02);
}

.upload-area:hover {
  border-color: var(--tech-blue);
  background: rgba(0, 242, 255, 0.05);
}

.hidden-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 32px;
  color: var(--tech-blue);
}

.upload-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.upload-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.effect-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.effect-card:hover {
  transform: translateY(-2px);
  border-color: var(--tech-blue);
}

.effect-card-active {
  border-color: var(--tech-blue);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
}

.effect-preview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tech-blue);
  font-size: 20px;
}

.effect-name {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.borders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.border-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.border-card:hover {
  transform: translateY(-2px);
  border-color: var(--tech-blue);
}

.border-card-active {
  border-color: var(--tech-blue);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
}

.border-preview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 auto 8px;
}

.border-name {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.upgrade-prompt {
  text-align: center;
  padding: 40px 20px;
}

.prompt-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 32px;
}

.prompt-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.prompt-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-bottom: 20px;
}

.upgrade-button {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: #ffffff;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.upgrade-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 242, 255, 0.3);
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

@keyframes avatar-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes avatar-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes avatar-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes avatar-glow {
  0%,
  100% {
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 242, 255, 0.8);
  }
}

@keyframes avatar-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
</style>
