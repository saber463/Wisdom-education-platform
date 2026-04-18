<template>
  <div class="binary-background">
    <div
      v-for="(column, colIndex) in binaryColumns"
      :key="colIndex"
      class="binary-column"
      :style="{ left: `${column.x}px` }"
    >
      <div
        v-for="(bit, rowIndex) in column.bits"
        :key="`${colIndex}-${rowIndex}`"
        class="binary-bit"
        :style="getBitStyle(bit)"
      >
        {{ bit.value }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const binaryColumns = ref([]);
let animationFrameId = null;

const generateBinaryColumn = x => {
  const bits = [];
  const bitCount = Math.ceil(window.innerHeight / 20);

  for (let i = 0; i < bitCount; i++) {
    bits.push({
      value: Math.random() > 0.5 ? '1' : '0',
      y: i * 20,
      opacity: 0.15 + Math.random() * 0.15, // 固定范围，减少闪烁
      speed: 0.3 + Math.random() * 0.5, // 降低速度，减少更新频率
      direction: Math.random() > 0.5 ? 1 : -1,
      fontSize: 12 + Math.random() * 4, // 固定字体大小范围
    });
  }

  return { x, bits };
};

const initBinaryBackground = () => {
  const columns = [];
  const columnWidth = 35; // 增加列宽，减少列数
  const columnCount = Math.ceil(window.innerWidth / columnWidth);

  for (let i = 0; i < columnCount; i++) {
    columns.push(generateBinaryColumn(i * columnWidth));
  }

  binaryColumns.value = columns;
};

const getBitStyle = bit => {
  // '1' 用青色，'0' 用浅紫色提高对比度
  const isBlue = bit.value === '1';
  return {
    top: `${bit.y}px`,
    opacity: bit.opacity,
    color: isBlue ? '#00f2ff' : '#b388ff', // 提高'0'的对比度
    fontSize: `${bit.fontSize}px`,
    fontFamily: 'Courier New, monospace',
    textShadow: isBlue
      ? '0 0 8px #00f2ff, 0 0 15px rgba(0,242,255,0.5)'
      : '0 0 8px #b388ff, 0 0 15px rgba(179,136,255,0.5)', // 增强发光效果
  };
};

let frameCount = 0;

const updateBinaryPositions = () => {
  frameCount++;

  binaryColumns.value.forEach(column => {
    column.bits.forEach(bit => {
      // 每2帧更新一次位置，大幅减少计算量
      if (frameCount % 2 === 0) {
        bit.y += bit.speed * bit.direction;
      }

      if (bit.y > window.innerHeight) {
        bit.y = -20;
        bit.direction = -1;
        bit.value = Math.random() > 0.5 ? '1' : '0';
      } else if (bit.y < -20) {
        bit.y = window.innerHeight;
        bit.direction = 1;
        bit.value = Math.random() > 0.5 ? '1' : '0';
      }
    });
  });

  // 降低帧率到30fps，避免过度渲染
  setTimeout(() => {
    animationFrameId = requestAnimationFrame(updateBinaryPositions);
  }, 33);
};

onMounted(() => {
  initBinaryBackground();
  animationFrameId = requestAnimationFrame(updateBinaryPositions);
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.binary-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}

.binary-column {
  position: absolute;
  top: 0;
  height: 100%;
  width: 30px;
}

.binary-bit {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  user-select: none;
  will-change: top, opacity;
}
</style>
