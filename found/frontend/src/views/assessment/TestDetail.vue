<template>
  <div class="test-detail-container">
    <div class="container mx-auto px-4 py-8">
      <!-- 测试信息和计时 -->
      <div class="glass-card rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div
          class="absolute inset-0 bg-gradient-to-r from-tech-blue/5 via-transparent to-tech-purple/5"
        />
        <div class="relative">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex-1">
              <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3">
                {{ test.title }}
              </h1>
              <div
                class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400"
              >
                <span
                  class="flex items-center gap-1.5 bg-gradient-to-r from-tech-blue/10 to-tech-blue/5 px-3 py-1.5 rounded-full border border-tech-blue/20"
                >
                  <i class="fa fa-question-circle text-tech-blue" />{{ test.totalQuestions }}题
                </span>
                <span
                  class="flex items-center gap-1.5 bg-gradient-to-r from-tech-purple/10 to-tech-purple/5 px-3 py-1.5 rounded-full border border-tech-purple/20"
                >
                  <i class="fa fa-clock-o text-tech-purple" />{{ duration }}分钟
                </span>
                <span
                  class="px-3 py-1.5 rounded-full text-xs font-semibold border"
                  :class="{
                    'bg-green-100 text-green-800 border-green-200': test.difficulty === '简单',
                    'bg-yellow-100 text-yellow-800 border-yellow-200': test.difficulty === '中等',
                    'bg-red-100 text-red-800 border-red-200': test.difficulty === '困难',
                  }"
                  >{{ test.difficulty }}</span
                >
                <span
                  class="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-tech-pink/10 to-tech-pink/5 text-tech-pink border border-tech-pink/20"
                >
                  {{ test.categoryName }}
                </span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-3">
              <div class="text-center">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">剩余时间</div>
                <div
                  class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-blue to-tech-purple"
                >
                  {{ minutes }}:{{ seconds.padStart(2, '0') }}
                </div>
              </div>
              <button
                class="btn-primary px-6 py-2.5 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                @click="submitTest"
              >
                <i class="fa fa-check mr-2" /> 提交答案
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 测试题目 -->
      <div class="glass-card rounded-2xl p-6">
        <div v-if="loading" class="text-center py-12">
          <div class="relative inline-block">
            <div
              class="absolute inset-0 bg-gradient-to-r from-tech-blue to-tech-purple rounded-full blur-xl opacity-20"
            />
            <div
              class="relative w-16 h-16 border-4 border-gray-200 border-t-4 border-tech-blue rounded-full animate-spin"
            />
          </div>
          <p class="mt-4 text-gray-500 dark:text-gray-400">加载题目中...</p>
        </div>

        <div v-else>
          <div
            v-for="(question, index) in questions"
            :key="question._id"
            class="mb-8 pb-6 border-b border-gray-200 dark:border-white/10 last:border-0"
          >
            <div class="flex items-start">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-tech-blue to-tech-purple text-white flex items-center justify-center font-bold mr-4 shadow-neon-blue"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  {{ question.questionText }}
                </h3>

                <!-- 选择题选项 -->
                <div v-if="question.questionType === 'single'" class="space-y-3">
                  <div
                    v-for="(option, optionIndex) in question.options"
                    :key="optionIndex"
                    class="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group"
                    :class="{
                      'border-tech-blue bg-gradient-to-r from-tech-blue/10 to-tech-blue/5 shadow-neon-blue':
                        selectedAnswers[question._id] === optionIndex,
                      'border-gray-200 dark:border-white/10 hover:border-tech-blue/50 hover:bg-gray-50 dark:hover:bg-white/5':
                        selectedAnswers[question._id] !== optionIndex,
                    }"
                    @click="selectAnswer(question._id, optionIndex)"
                  >
                    <div
                      class="w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-300"
                      :class="{
                        'border-tech-blue bg-tech-blue':
                          selectedAnswers[question._id] === optionIndex,
                        'border-gray-300 dark:border-white/30':
                          selectedAnswers[question._id] !== optionIndex,
                      }"
                    >
                      <div
                        v-if="selectedAnswers[question._id] === optionIndex"
                        class="w-2.5 h-2.5 bg-white rounded-full"
                      />
                    </div>
                    <div class="flex-1">
                      <span class="font-semibold text-gray-700 dark:text-gray-300"
                        >{{ String.fromCharCode(65 + optionIndex) }}.
                      </span>
                      <span class="text-gray-800 dark:text-gray-200">{{ option.text }}</span>
                    </div>
                  </div>
                </div>

                <!-- 判断题选项 -->
                <div v-else-if="question.questionType === 'truefalse'" class="flex space-x-4">
                  <div
                    class="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors"
                    :class="{
                      'border-primary bg-blue-50': selectedAnswers[question._id] === true,
                      'hover:border-primary hover:bg-gray-50':
                        selectedAnswers[question._id] !== true,
                    }"
                    @click="selectAnswer(question._id, true)"
                  >
                    <div
                      class="w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center"
                      :class="{
                        'border-primary text-primary bg-primary':
                          selectedAnswers[question._id] === true,
                        'border-gray-300': selectedAnswers[question._id] !== true,
                      }"
                    >
                      <div
                        v-if="selectedAnswers[question._id] === true"
                        class="w-2 h-2 bg-white rounded-full"
                      />
                    </div>
                    <span class="font-medium">正确</span>
                  </div>
                  <div
                    class="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors"
                    :class="{
                      'border-primary bg-blue-50': selectedAnswers[question._id] === false,
                      'hover:border-primary hover:bg-gray-50':
                        selectedAnswers[question._id] !== false,
                    }"
                    @click="selectAnswer(question._id, false)"
                  >
                    <div
                      class="w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center"
                      :class="{
                        'border-primary text-primary bg-primary':
                          selectedAnswers[question._id] === false,
                        'border-gray-300': selectedAnswers[question._id] !== false,
                      }"
                    >
                      <div
                        v-if="selectedAnswers[question._id] === false"
                        class="w-2 h-2 bg-white rounded-full"
                      />
                    </div>
                    <span class="font-medium">错误</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="flex justify-center mt-8">
            <button class="btn-primary btn-lg" @click="submitTest">
              <i class="fa fa-check mr-1" /> 提交答案
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useNotificationStore } from '@/store/notification';
import { testApi } from '@/utils/api';

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();

// 测试数据
const testId = route.params.id;
const test = ref({});
const questions = ref([]);
const loading = ref(true);
const selectedAnswers = ref({});

// 计时
const duration = ref(0);
const remainingTime = ref(0);
const minutes = ref(0);
const seconds = ref('00');
let timer = null;

// 选择答案
const selectAnswer = (questionId, optionIndex) => {
  selectedAnswers.value[questionId] = optionIndex;
};

// 获取测试详情和题目
const fetchTestData = async () => {
  try {
    // 获取测试详情
    const testResponse = await testApi.getDetail(testId);
    test.value = testResponse.data.data;

    // 添加categoryName字段，用于前端显示
    if (test.value.category) {
      test.value.categoryName = test.value.category.name || '未分类';
    } else {
      test.value.categoryName = '未分类';
    }

    duration.value = test.value.duration;
    remainingTime.value = duration.value * 60;

    // 获取测试题目
    const questionsResponse = await testApi.getQuestions(testId);
    questions.value = questionsResponse.data.data;

    // 初始化答案对象
    questions.value.forEach(question => {
      selectedAnswers.value[question._id] = null;
    });

    loading.value = false;
    startTimer();
  } catch (error) {
    console.error('获取测试数据失败:', error);
    notificationStore.error('获取测试数据失败，请稍后再试');
    loading.value = false;
  }
};

// 开始计时
const startTimer = () => {
  if (timer) clearInterval(timer);

  updateTimeDisplay();
  timer = setInterval(() => {
    remainingTime.value--;
    updateTimeDisplay();

    // 时间到，自动提交
    if (remainingTime.value <= 0) {
      clearInterval(timer);
      submitTest();
    }
  }, 1000);
};

// 更新时间显示
const updateTimeDisplay = () => {
  minutes.value = Math.floor(remainingTime.value / 60);
  seconds.value = String(remainingTime.value % 60).padStart(2, '0');
};

// 提交测试答案
const submitTest = async () => {
  try {
    // 准备提交的数据
    const startTime = new Date(
      Date.now() - (duration.value * 60 * 1000 - remainingTime.value * 1000)
    ).toISOString();
    const answers = Object.entries(selectedAnswers.value)
      .map(([questionId, selectedIndex]) => {
        const question = questions.value.find(q => q._id === questionId);
        if (!question) return null;

        return {
          questionId,
          selectedOption: Array.isArray(selectedIndex)
            ? selectedIndex.map(idx => String.fromCharCode(97 + idx))
            : String.fromCharCode(97 + selectedIndex),
          selectedIndex,
        };
      })
      .filter(answer => answer !== null);

    // 提交测试
    const response = await testApi.submit(testId, {
      testId: testId,
      answers: answers,
      startTime: startTime,
    });

    // 保存错题到本地存储
    saveWrongQuestions(response.data.data.testResult);

    // 停止计时
    if (timer) clearInterval(timer);

    // 跳转到测试结果页面
    router.push({
      name: 'TestResult',
      query: {
        testId: testId,
        score: response.data.data.testResult.score,
        correctCount: response.data.data.testResult.correctAnswers,
        totalCount: response.data.data.testResult.totalQuestions,
        resultId: response.data.data.resultId,
      },
    });
  } catch (error) {
    console.error('提交测试答案失败:', error);
    notificationStore.error('提交失败，请稍后再试');
  }
};

// 保存错题到本地存储
const saveWrongQuestions = testResult => {
  const STORAGE_KEY = 'wrong_questions';
  const wrongQuestions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  testResult.answers?.forEach(answer => {
    if (!answer.isCorrect) {
      const question = questions.value.find(q => q._id === answer.questionId);
      if (question) {
        const wrongQuestion = {
          questionId: question._id,
          questionType: question.questionType,
          questionText: question.questionText,
          options: question.options,
          selectedOption: answer.selectedIndex,
          correctOption: question.correctAnswer,
          explanation: question.explanation || '',
          knowledgePoints: question.knowledgePoints || [],
          wrongDate: new Date().toISOString(),
          wrongCount: 1,
        };

        const existingIndex = wrongQuestions.findIndex(
          q => q.questionId === wrongQuestion.questionId
        );
        if (existingIndex === -1) {
          wrongQuestions.unshift(wrongQuestion);
        } else {
          wrongQuestions[existingIndex].wrongCount++;
          wrongQuestions[existingIndex].wrongDate = wrongQuestion.wrongDate;
        }
      }
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(wrongQuestions.slice(0, 100)));
};

// 组件挂载时加载数据
onMounted(() => {
  fetchTestData();
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.test-detail-container {
  min-height: calc(100vh - 120px);
}
</style>
