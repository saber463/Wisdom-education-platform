<template>
  <div class="programming-languages-flow">
    <div
      v-for="(language, _index) in flowingLanguages"
      :key="_index"
      class="language-text"
      :class="{ 'language-text-bouncing': language.isBouncing }"
      :style="getLanguageStyle(language)"
    >
      {{ language.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  languages: {
    type: Array,
    default: () => [],
  },
});

const flowingLanguages = ref([]);
let animationFrameId = null;

const initLanguages = () => {
  const languages = [...props.languages];
  flowingLanguages.value = languages.map((lang, _index) => ({
    ...lang,
    x: -200 - Math.random() * 300,
    y: 50 + Math.random() * (window.innerHeight - 100),
    speed: 0.5 + Math.random() * 1, // 降低速度
    isBouncing: false,
    bounceSpeed: 0,
    bounceHeight: 0,
    originalY: 50 + Math.random() * (window.innerHeight - 100),
    fontSize: 14 + Math.random() * 10, // 固定字体大小
  }));
};

const getLanguageStyle = language => {
  return {
    left: `${language.x}px`,
    top: `${language.y}px`,
    color: language.color,
    fontSize: `${language.fontSize}px`, // 使用固定的字体大小
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    textShadow: `0 0 10px ${language.color}`,
    transform: `translateY(${language.bounceHeight}px)`,
    opacity: 0.6, // 降低不透明度，减少视觉干扰
  };
};

let frameCount = 0;

const updatePositions = () => {
  frameCount++;

  // 每2帧更新一次，减少性能消耗
  if (frameCount % 2 === 0) {
    flowingLanguages.value.forEach(language => {
      if (language.isBouncing) {
        language.bounceHeight -= language.bounceSpeed;
        language.bounceSpeed -= 0.5;

        if (language.bounceHeight <= 0) {
          language.bounceHeight = 0;
          language.isBouncing = false;
          language.bounceSpeed = 0;
        }
      } else {
        language.x += language.speed;

        if (language.x > window.innerWidth + 100) {
          language.x = -200 - Math.random() * 300;
          language.y = 50 + Math.random() * (window.innerHeight - 100);
          language.originalY = language.y;
        }
      }
    });
  }

  // 降低帧率到30fps
  setTimeout(() => {
    animationFrameId = requestAnimationFrame(updatePositions);
  }, 33);
};

onMounted(() => {
  initLanguages();
  animationFrameId = requestAnimationFrame(updatePositions);
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.programming-languages-flow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.language-text {
  position: absolute;
  white-space: nowrap;
  opacity: 0.8;
  transition: opacity 0.3s ease;
  user-select: none;
  will-change: transform, left, top;
}

.language-text:hover {
  opacity: 1;
  text-shadow:
    0 0 15px currentColor,
    0 0 30px currentColor,
    0 0 45px currentColor;
}

.language-text-bouncing {
  animation: bounce-glow 0.3s ease-out;
}

@keyframes bounce-glow {
  0% {
    text-shadow:
      0 0 10px currentColor,
      0 0 20px currentColor;
  }
  50% {
    text-shadow:
      0 0 20px currentColor,
      0 0 40px currentColor,
      0 0 60px currentColor;
  }
  100% {
    text-shadow:
      0 0 10px currentColor,
      0 0 20px currentColor;
  }
}
</style>
