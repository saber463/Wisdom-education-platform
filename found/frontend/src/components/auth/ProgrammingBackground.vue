<template>
  <div class="programming-background">
    <div class="code-lines">
      <div
        v-for="(code, index) in codeLines"
        :key="index"
        class="code-line"
        :style="{ '--line-index': index + 1 }"
        :data-code="code"
      />
    </div>
    <div class="glowing-orbs">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const generateBinaryString = () => {
  let binary = '';
  for (let i = 0; i < 50; i++) {
    binary += Math.random() > 0.5 ? '1' : '0';
  }
  return binary;
};

const codeLines = ref(Array.from({ length: 20 }, () => generateBinaryString()));
</script>

<style scoped>
.programming-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  z-index: -2;
}

.code-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.15;
}

.code-line {
  position: absolute;
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, #00ff41, transparent);
  animation: code-line-pulse 3s ease-in-out infinite;
  left: calc(var(--line-index) * 5%);
  top: calc(var(--line-index) * 2%);
}

.code-line::before {
  content: attr(data-code);
  position: absolute;
  top: 0;
  left: 5px;
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: nowrap;
  animation: code-flow 8s linear infinite;
  opacity: 0;
}

.code-line:nth-child(odd) {
  animation-delay: 1s;
}

.code-line:nth-child(even) {
  animation-delay: 2s;
}

@keyframes code-line-pulse {
  0%,
  100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes code-flow {
  0% {
    transform: translateY(-200px);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

.glowing-orbs {
  position: absolute;
  width: 100%;
  height: 100%;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: orb-float 15s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: #00ff88;
  top: 10%;
  left: 10%;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: #00aaff;
  bottom: 10%;
  right: 20%;
  animation-delay: 5s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: #ff00aa;
  top: 50%;
  right: 10%;
  animation-delay: 10s;
}

@keyframes orb-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}
</style>
