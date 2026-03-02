<template>
  <div class="wasm-demo">
    <h2>Rust-WASM 模块演示</h2>
    
    <!-- WASM状态 -->
    <div class="status-card">
      <h3>WASM状态</h3>
      <p>
        <span :class="wasmStatus.class">{{ wasmStatus.text }}</span>
      </p>
      <button v-if="!isWasmReady" @click="initializeWasm">初始化WASM</button>
    </div>

    <!-- 客观题答案比对演示 -->
    <div class="demo-card">
      <h3>客观题答案比对</h3>
      <div class="input-group">
        <label>学生答案：</label>
        <input v-model="studentAnswer" placeholder="输入学生答案" />
      </div>
      <div class="input-group">
        <label>标准答案：</label>
        <input v-model="standardAnswer" placeholder="输入标准答案" />
      </div>
      <button @click="testCompareAnswers">比对答案</button>
      <div v-if="compareResult !== null" class="result">
        <p>比对结果：<strong :class="compareResult ? 'correct' : 'incorrect'">
          {{ compareResult ? '✓ 正确' : '✗ 错误' }}
        </strong></p>
      </div>
    </div>

    <!-- 相似度计算演示 -->
    <div class="demo-card">
      <h3>相似度计算</h3>
      <div class="input-group">
        <label>文本1：</label>
        <input v-model="text1" placeholder="输入第一个文本" />
      </div>
      <div class="input-group">
        <label>文本2：</label>
        <input v-model="text2" placeholder="输入第二个文本" />
      </div>
      <button @click="testSimilarity">计算相似度</button>
      <div v-if="similarityResult !== null" class="result">
        <p>相似度：<strong>{{ (similarityResult * 100).toFixed(2) }}%</strong></p>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: (similarityResult * 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 性能测试 -->
    <div class="demo-card">
      <h3>性能测试</h3>
      <button @click="runPerformanceTest" :disabled="!isWasmReady">
        运行性能测试
      </button>
      <p class="hint">测试将在控制台输出结果</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  initWasm, 
  compareAnswers, 
  calculateSimilarity, 
  isWasmInitialized,
  performanceTest 
} from '@/utils/wasm-loader';

// WASM状态
const isWasmReady = ref(false);

// 客观题答案比对
const studentAnswer = ref('Hello World');
const standardAnswer = ref('helloworld');
const compareResult = ref<boolean | null>(null);

// 相似度计算
const text1 = ref('hello');
const text2 = ref('hallo');
const similarityResult = ref<number | null>(null);

// WASM状态显示
const wasmStatus = computed(() => {
  if (isWasmReady.value) {
    return {
      text: '✓ WASM已加载（使用Rust高性能实现）',
      class: 'status-success'
    };
  } else {
    return {
      text: '⚠ WASM未加载（使用JavaScript回退实现）',
      class: 'status-warning'
    };
  }
});

// 初始化WASM
async function initializeWasm() {
  try {
    await initWasm();
    isWasmReady.value = isWasmInitialized();
  } catch (error) {
    console.error('WASM初始化失败:', error);
  }
}

// 测试答案比对
function testCompareAnswers() {
  compareResult.value = compareAnswers(studentAnswer.value, standardAnswer.value);
}

// 测试相似度计算
function testSimilarity() {
  similarityResult.value = calculateSimilarity(text1.value, text2.value);
}

// 运行性能测试
async function runPerformanceTest() {
  await performanceTest();
  alert('性能测试完成，请查看控制台输出');
}

// 组件挂载时初始化WASM
onMounted(async () => {
  await initializeWasm();
});
</script>

<style scoped>
.wasm-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.status-card,
.demo-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  color: #409eff;
  margin-top: 0;
  margin-bottom: 15px;
}

.status-success {
  color: #67c23a;
  font-weight: bold;
}

.status-warning {
  color: #e6a23c;
  font-weight: bold;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  color: #606266;
  font-weight: 500;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #409eff;
}

button {
  background: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

button:hover {
  background: #66b1ff;
}

button:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.result {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.result p {
  margin: 0;
  font-size: 16px;
}

.correct {
  color: #67c23a;
}

.incorrect {
  color: #f56c6c;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transition: width 0.3s ease;
}

.hint {
  color: #909399;
  font-size: 12px;
  margin-top: 10px;
}
</style>
