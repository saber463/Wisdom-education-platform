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
      opacity: 0.1 + Math.random() * 0.3,
      speed: 0.5 + Math.random() * 1.5,
      direction: Math.random() > 0.5 ? 1 : -1,
    });
  }

  return { x, bits };
};

const initBinaryBackground = () => {
  const columns = [];
  const columnWidth = 30;
  const columnCount = Math.ceil(window.innerWidth / columnWidth);

  for (let i = 0; i < columnCount; i++) {
    columns.push(generateBinaryColumn(i * columnWidth));
  }

  binaryColumns.value = columns;
};

const getBitStyle = bit => {
  return {
    top: `${bit.y}px`,
    opacity: bit.opacity,
    color: bit.value === '1' ? '#00f2ff' : '#7209b7',
    fontSize: '14px',
    fontFamily: 'Courier New, monospace',
    textShadow:
      bit.value === '1' ? '0 0 5px #00f2ff, 0 0 10px #00f2ff' : '0 0 5px #7209b7, 0 0 10px #7209b7',
  };
};

const updateBinaryPositions = () => {
  binaryColumns.value.forEach(column => {
    column.bits.forEach(bit => {
      bit.y += bit.speed * bit.direction;

      if (bit.y > window.innerHeight) {
        bit.y = -20;
        bit.direction = -1;
      } else if (bit.y < -20) {
        bit.y = window.innerHeight;
        bit.direction = 1;
      }

      bit.opacity = 0.1 + Math.random() * 0.3;
    });
  });

  animationFrameId = requestAnimationFrame(updateBinaryPositions);
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
