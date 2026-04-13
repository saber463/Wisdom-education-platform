<template>
  <div class="dynamic-languages-container">
    <div
      ref="containerRef"
      class="languages-wrapper"
      :class="{ 'direction-right': direction === 'right', 'direction-left': direction === 'left' }"
    >
      <div
        v-for="(language, index) in displayedLanguages"
        :key="language.text + index"
        class="language-item"
        :style="getLanguageStyle(language)"
        @mouseenter="onLanguageHover(language)"
        @mouseleave="onLanguageLeave(language)"
        @click="onLanguageClick(language)"
      >
        <span class="language-text">{{ language.text }}</span>
        <span v-if="showEmojis" class="language-emoji">{{ language.emoji }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

// 组件属性
const props = defineProps({
  languages: {
    type: Array,
    required: true,
  },
  direction: {
    type: String,
    default: 'right', // left 或 right
    validator: value => ['left', 'right'].includes(value),
  },
  showEmojis: {
    type: Boolean,
    default: true,
  },
  speed: {
    type: Number,
    default: 200, // 更新间隔（毫秒）
  },
});

// 组件状态
const containerRef = ref(null);
const displayedLanguages = ref([]);
const animationFrame = ref(null);
const updateInterval = ref(null);
const hoveredLanguage = ref(null); // 跟踪当前悬浮的语言

// 生成随机表情
const generateRandomEmoji = () => {
  const emojis = ['👨‍💻', '👩‍💻', '💻', '🎯', '🚀', '🔧', '🧩', '📚', '✨', '⭐'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

// 计算对比度颜色
const getContrastColor = hexColor => {
  // 将十六进制颜色转换为RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // 计算相对亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 返回对比度最高的颜色
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

// 检查语言项是否重叠
const isOverlapping = (newPosition, existingPositions, size) => {
  const padding = 30;
  return existingPositions.some(pos => {
    const dx = Math.abs(newPosition.x - pos.x);
    const dy = Math.abs(newPosition.y - pos.y);
    return dx < size.width + padding && dy < size.height + padding;
  });
};

// 获取语言项样式
const getLanguageStyle = language => {
  // 如果当前语言是悬浮的，则保持原有透明度，否则降低透明度
  const isHovered = hoveredLanguage.value === language;
  const opacity = isHovered
    ? language.opacity
    : hoveredLanguage.value
      ? language.opacity * 0.5
      : language.opacity;

  return {
    color: language.textColor || getContrastColor(language.color),
    backgroundColor:
      language.color +
      (language.opacity
        ? Math.floor(language.opacity * 255)
            .toString(16)
            .padStart(2, '0')
        : 'FF'),
    left: `${language.x}px`,
    top: `${language.y}px`,
    opacity: opacity,
    zIndex: isHovered ? 100 : language.zIndex || Math.floor(Math.random() * 10),
    fontSize: `${language.fontSize || 14 + Math.random() * 20}px`,
    transform: `translateY(${language.yOffset}px) scale(${isHovered ? 1.2 : language.scale})`,
    transition: `all 0.5s ease-in-out, transform 0.3s ease`,
  };
};

// 初始化语言项
const initializeLanguages = () => {
  if (!containerRef.value) return;

  const container = containerRef.value;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 根据方向初始化位置
  const startX = props.direction === 'right' ? -200 : containerWidth + 200;

  const existingPositions = [];

  // 添加空值检查，防止 map 函数调用失败
  if (!props.languages || !Array.isArray(props.languages)) {
    displayedLanguages.value = [];
    return;
  }

  displayedLanguages.value = props.languages.map(lang => {
    let x, y;
    const maxAttempts = 10;
    let attempts = 0;

    // 尝试找到不重叠的位置
    do {
      x = startX;
      y = Math.random() * (containerHeight - 100) + 50;
      attempts++;
    } while (
      isOverlapping({ x, y }, existingPositions, { width: 150, height: 50 }) &&
      attempts < maxAttempts
    );

    existingPositions.push({ x, y });

    return {
      ...lang,
      x,
      y,
      emoji: generateRandomEmoji(),
      originalColor: lang.color,
      opacity: 0.8 + Math.random() * 0.2,
      zIndex: Math.floor(Math.random() * 10),
      fontSize: 14 + Math.random() * 20,
      yOffset: 0,
      xSpeed: 0,
      ySpeed: 0,
      scale: 1,
    };
  });
};

// 更新语言位置
const updateLanguagePositions = () => {
  if (!containerRef.value) return;

  const container = containerRef.value;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 基础速度，speed值越小，移动越慢
  const baseSpeed = 300 / props.speed;

  displayedLanguages.value = displayedLanguages.value.map(lang => {
    // 为每个语言项生成随机的横向和纵向速度
    if (lang.xSpeed === 0) {
      lang.xSpeed =
        (props.direction === 'right' ? 1 : -1) * (baseSpeed + Math.random() * baseSpeed * 2);
    }
    if (lang.ySpeed === 0) {
      lang.ySpeed = (Math.random() - 0.5) * baseSpeed * 0.5; // 垂直方向的小幅随机移动
    }

    // 随机调整垂直速度，使运动轨迹更自然
    if (Math.random() < 0.05) {
      lang.ySpeed += (Math.random() - 0.5) * baseSpeed * 0.2;
      // 限制垂直速度范围
      lang.ySpeed = Math.max(-baseSpeed * 0.5, Math.min(lang.ySpeed, baseSpeed * 0.5));
    }

    // 如果当前语言被悬浮，减慢速度
    const currentXSpeed = hoveredLanguage.value === lang ? lang.xSpeed * 0.3 : lang.xSpeed;
    const currentYSpeed = hoveredLanguage.value === lang ? lang.ySpeed * 0.3 : lang.ySpeed;

    // 应用移动
    const newX = lang.x + currentXSpeed;
    const newY = lang.y + currentYSpeed;

    // 边界检查
    if (props.direction === 'right' && newX > containerWidth + 200) {
      // 重新随机生成位置和速度
      lang.x = -200;
      lang.y = Math.random() * (containerHeight - 100) + 50;
      lang.xSpeed =
        (props.direction === 'right' ? 1 : -1) * (baseSpeed + Math.random() * baseSpeed * 2);
      lang.ySpeed = (Math.random() - 0.5) * baseSpeed * 0.5;
      lang.emoji = generateRandomEmoji(); // 同时更换表情
      lang.opacity = 0.8 + Math.random() * 0.2;
      lang.fontSize = 14 + Math.random() * 20;
    } else if (props.direction === 'left' && newX < -200) {
      // 重新随机生成位置和速度
      lang.x = containerWidth + 200;
      lang.y = Math.random() * (containerHeight - 100) + 50;
      lang.xSpeed =
        (props.direction === 'right' ? 1 : -1) * (baseSpeed + Math.random() * baseSpeed * 2);
      lang.ySpeed = (Math.random() - 0.5) * baseSpeed * 0.5;
      lang.emoji = generateRandomEmoji(); // 同时更换表情
      lang.opacity = 0.8 + Math.random() * 0.2;
      lang.fontSize = 14 + Math.random() * 20;
    } else {
      // 正常更新位置
      lang.x = newX;
      lang.y = newY;
    }

    // 确保y坐标在容器范围内
    if (lang.y < 50) {
      lang.y = 50;
      lang.ySpeed *= -1;
    } else if (lang.y > containerHeight - 50) {
      lang.y = containerHeight - 50;
      lang.ySpeed *= -1;
    }

    return lang;
  });
};

// 语言悬浮事件
const onLanguageHover = language => {
  hoveredLanguage.value = language;
};

// 语言离开事件
const onLanguageLeave = () => {
  hoveredLanguage.value = null;
};

// 语言点击事件
const onLanguageClick = language => {
  // 可以在这里添加点击事件的处理逻辑
  console.log('Clicked language:', language);
};

// 动画循环
const animate = () => {
  updateLanguagePositions();
  animationFrame.value = requestAnimationFrame(animate);
};

// 组件挂载时初始化
onMounted(() => {
  initializeLanguages();
  animate();

  // 定时添加新语言（如果需要）
  updateInterval.value = setInterval(() => {
    // 这里可以添加新的语言项
  }, 5000);

  // 监听窗口大小变化
  window.addEventListener('resize', initializeLanguages);
});

// 组件卸载时清理
onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
  window.removeEventListener('resize', initializeLanguages);
});

// 监听languages属性变化
watch(
  () => props.languages,
  () => {
    initializeLanguages();
  },
  { deep: true }
);
</script>

<style scoped>
.dynamic-languages-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}

.languages-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.language-item {
  position: absolute;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  pointer-events: all;
  white-space: nowrap;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  transform: translateY(0) scale(1);
}

.language-item:hover {
  transform: scale(1.2) translateY(0);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  filter: brightness(1.2);
}

.language-item.clicked {
  transform: scale(1.3) translateY(0);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
}

.language-text {
  user-select: none;
}

.language-emoji {
  font-size: 1.2em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .language-item {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
