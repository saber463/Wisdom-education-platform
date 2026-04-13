<template>
  <div class="theme-selector">
    <h3 class="theme-title">选择专属主题</h3>
    <div class="themes-grid">
      <div
        v-for="theme in themes"
        :key="theme.id"
        class="theme-card"
        :class="{ 'theme-card-active': selectedTheme === theme.id }"
        @click="selectTheme(theme.id)"
      >
        <div class="theme-preview" :style="getThemePreviewStyle(theme)">
          <div class="theme-icon">
            {{ theme.icon }}
          </div>
        </div>
        <div class="theme-info">
          <h4 class="theme-name">
            {{ theme.name }}
          </h4>
          <p class="theme-description">
            {{ theme.description }}
          </p>
        </div>
        <div v-if="selectedTheme === theme.id" class="theme-badge">
          <i class="fa fa-check" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';

const _userStore = useUserStore();
const selectedTheme = ref('default');

const themes = [
  {
    id: 'default',
    name: '默认主题',
    description: '经典的深色科技风格',
    icon: '🎨',
    preview: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
  },
  {
    id: 'silver',
    name: '白银专属',
    description: '优雅的银色渐变风格',
    icon: '🌟',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #1a1a2e 100%)',
  },
  {
    id: 'gold',
    name: '黄金专属',
    description: '奢华的金色渐变风格',
    icon: '👑',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #3d3d5c 50%, #1a1a2e 100%)',
  },
  {
    id: 'ocean',
    name: '海洋之心',
    description: '清新的蓝色海洋风格',
    icon: '🌊',
    preview: 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #0a192f 100%)',
  },
  {
    id: 'forest',
    name: '森林秘境',
    description: '自然的绿色森林风格',
    icon: '🌲',
    preview: 'linear-gradient(135deg, #0d1b0d 0%, #1a2f1a 50%, #0d1b0d 100%)',
  },
  {
    id: 'sunset',
    name: '日落余晖',
    description: '温暖的橙色日落风格',
    icon: '🌅',
    preview: 'linear-gradient(135deg, #1a0f0f 0%, #2d1f1f 50%, #1a0f0f 100%)',
  },
];

const getThemePreviewStyle = theme => {
  return {
    background: theme.preview,
  };
};

const selectTheme = themeId => {
  selectedTheme.value = themeId;
  applyTheme(themeId);
  saveThemePreference(themeId);
};

const applyTheme = themeId => {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;

  document.documentElement.style.setProperty('--theme-primary', theme.primary || '#00f2ff');
  document.documentElement.style.setProperty('--theme-secondary', theme.secondary || '#bd00ff');
  document.documentElement.style.setProperty('--theme-background', theme.preview);
};

const saveThemePreference = themeId => {
  localStorage.setItem('userTheme', themeId);
};

const loadThemePreference = () => {
  const savedTheme = localStorage.getItem('userTheme');
  if (savedTheme) {
    selectedTheme.value = savedTheme;
    applyTheme(savedTheme);
  }
};

onMounted(() => {
  loadThemePreference();
});
</script>

<style scoped>
.theme-selector {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.theme-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.theme-card:hover {
  transform: translateY(-4px);
  border-color: var(--tech-blue);
  box-shadow: 0 8px 32px rgba(0, 242, 255, 0.2);
}

.theme-card-active {
  border-color: var(--tech-blue);
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.3);
}

.theme-preview {
  width: 100%;
  height: 100px;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.theme-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
}

.theme-icon {
  font-size: 32px;
  position: relative;
  z-index: 1;
}

.theme-info {
  text-align: center;
}

.theme-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.theme-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  line-height: 1.4;
}

.theme-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 12px;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
