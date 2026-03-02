<template>
  <div class="question-bank-container">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1
          class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-blue to-tech-purple mb-4"
        >
          我的题库
        </h1>
        <p class="text-gray-600">查看您的错题记录，巩固薄弱知识点</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-3">
          <div class="glass-card">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">错题记录</h2>
                <div class="flex items-center space-x-4">
                  <span class="text-sm text-gray-500">共 {{ wrongQuestions.length }} 道错题</span>
                  <button
                    class="btn-secondary text-sm px-4 py-2 rounded-lg"
                    @click="clearWrongQuestions"
                  >
                    <i class="fa fa-trash mr-2" />清空错题
                  </button>
                </div>
              </div>

              <div v-if="loading" class="flex justify-center items-center py-12">
                <div
                  class="w-12 h-12 border-4 border-gray-200 border-t-4 border-tech-blue rounded-full animate-spin"
                />
              </div>

              <div v-else-if="wrongQuestions.length === 0" class="text-center py-12">
                <i class="fa fa-check-circle text-6xl text-green-500 mb-4" />
                <p class="text-xl text-gray-600">太棒了！您还没有错题记录</p>
                <p class="text-gray-500 mt-2">继续努力学习吧！</p>
              </div>

              <div v-else class="space-y-6">
                <div
                  v-for="(item, index) in wrongQuestions"
                  :key="item.questionId"
                  class="question-item"
                >
                  <div class="question-header">
                    <div class="flex items-center">
                      <span class="question-number">{{ index + 1 }}</span>
                      <span class="question-type">{{
                        getQuestionTypeText(item.questionType)
                      }}</span>
                      <span class="ml-auto text-sm text-gray-500">{{
                        formatDate(item.wrongDate)
                      }}</span>
                    </div>
                  </div>

                  <div class="question-content">
                    <h3 class="question-text">
                      {{ item.questionText }}
                    </h3>

                    <div v-if="item.questionType === 'single'" class="options-list">
                      <div
                        v-for="(option, optionIndex) in item.options"
                        :key="optionIndex"
                        class="option-item"
                        :class="{
                          'option-wrong':
                            item.selectedOption === optionIndex &&
                            item.correctOption !== optionIndex,
                          'option-correct': item.correctOption === optionIndex,
                        }"
                      >
                        <span class="option-label"
                          >{{ String.fromCharCode(65 + optionIndex) }}.</span
                        >
                        <span class="option-text">{{ option.text }}</span>
                        <i
                          v-if="
                            item.selectedOption === optionIndex &&
                            item.correctOption !== optionIndex
                          "
                          class="fa fa-times text-red-500 ml-auto"
                        />
                        <i
                          v-if="item.correctOption === optionIndex"
                          class="fa fa-check text-green-500 ml-auto"
                        />
                      </div>
                    </div>

                    <div v-else-if="item.questionType === 'truefalse'" class="true-false-options">
                      <div
                        class="option-item"
                        :class="{
                          'option-wrong':
                            item.selectedOption === true && item.correctOption !== true,
                          'option-correct': item.correctOption === true,
                        }"
                      >
                        <span class="option-label">正确</span>
                        <i
                          v-if="item.selectedOption === true && item.correctOption !== true"
                          class="fa fa-times text-red-500 ml-auto"
                        />
                        <i
                          v-if="item.correctOption === true"
                          class="fa fa-check text-green-500 ml-auto"
                        />
                      </div>
                      <div
                        class="option-item"
                        :class="{
                          'option-wrong':
                            item.selectedOption === false && item.correctOption !== false,
                          'option-correct': item.correctOption === false,
                        }"
                      >
                        <span class="option-label">错误</span>
                        <i
                          v-if="item.selectedOption === false && item.correctOption !== false"
                          class="fa fa-times text-red-500 ml-auto"
                        />
                        <i
                          v-if="item.correctOption === false"
                          class="fa fa-check text-green-500 ml-auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="item.explanation" class="explanation-section">
                    <div class="explanation-header">
                      <i class="fa fa-lightbulb text-yellow-500 mr-2" />
                      <span class="font-semibold">解析</span>
                    </div>
                    <div class="explanation-content">
                      {{ item.explanation }}
                    </div>
                  </div>

                  <div
                    v-if="item.knowledgePoints && item.knowledgePoints.length > 0"
                    class="knowledge-points"
                  >
                    <span class="text-sm text-gray-500">相关知识点：</span>
                    <span
                      v-for="(point, idx) in item.knowledgePoints"
                      :key="idx"
                      class="knowledge-point-tag"
                    >
                      {{ point }}
                    </span>
                  </div>

                  <div class="question-actions">
                    <button
                      class="btn-secondary text-sm"
                      @click="removeFromWrongQuestions(item.questionId)"
                    >
                      <i class="fa fa-check mr-2" />标记为已掌握
                    </button>
                    <button class="btn-primary text-sm" @click="retryQuestion(item)">
                      <i class="fa fa-redo mr-2" />重新练习
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="glass-card sticky top-24">
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-6">错题统计</h3>

              <div class="space-y-4">
                <div class="stat-card">
                  <div class="stat-value">
                    {{ wrongQuestions.length }}
                  </div>
                  <div class="stat-label">错题总数</div>
                </div>

                <div class="stat-card">
                  <div class="stat-value">
                    {{ getWrongCountByType('single') }}
                  </div>
                  <div class="stat-label">选择题错题</div>
                </div>

                <div class="stat-card">
                  <div class="stat-value">
                    {{ getWrongCountByType('truefalse') }}
                  </div>
                  <div class="stat-label">判断题错题</div>
                </div>
              </div>

              <div class="mt-8">
                <h4 class="font-semibold text-gray-700 mb-4">薄弱知识点</h4>
                <div class="space-y-2">
                  <div
                    v-for="(point, index) in getWeakKnowledgePoints()"
                    :key="index"
                    class="weak-point-item"
                  >
                    <span class="point-name">{{ point.name }}</span>
                    <span class="point-count">{{ point.count }}次</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/store/notification';

const notificationStore = useNotificationStore();

const STORAGE_KEY = 'wrong_questions';
const loading = ref(false);
const wrongQuestions = ref([]);

const loadWrongQuestions = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    wrongQuestions.value = JSON.parse(stored);
  }
};

const saveWrongQuestions = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wrongQuestions.value));
};

const addWrongQuestion = question => {
  const existingIndex = wrongQuestions.value.findIndex(q => q.questionId === question.questionId);
  if (existingIndex === -1) {
    wrongQuestions.value.unshift({
      ...question,
      wrongDate: new Date().toISOString(),
      wrongCount: 1,
    });
  } else {
    wrongQuestions.value[existingIndex].wrongCount++;
    wrongQuestions.value[existingIndex].wrongDate = new Date().toISOString();
  }
  saveWrongQuestions();
};

const removeFromWrongQuestions = questionId => {
  wrongQuestions.value = wrongQuestions.value.filter(q => q.questionId !== questionId);
  saveWrongQuestions();
  notificationStore.success('已标记为已掌握');
};

const clearWrongQuestions = () => {
  if (confirm('确定要清空所有错题记录吗？')) {
    wrongQuestions.value = [];
    saveWrongQuestions();
    notificationStore.success('错题记录已清空');
  }
};

const retryQuestion = _question => {
  notificationStore.info('重新练习功能开发中...');
};

const getQuestionTypeText = type => {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    truefalse: '判断题',
    fill: '填空题',
    essay: '简答题',
  };
  return typeMap[type] || '未知类型';
};

const formatDate = dateString => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

const getWrongCountByType = type => {
  return wrongQuestions.value.filter(q => q.questionType === type).length;
};

const getWeakKnowledgePoints = () => {
  const pointCounts = {};
  wrongQuestions.value.forEach(q => {
    if (q.knowledgePoints) {
      q.knowledgePoints.forEach(point => {
        pointCounts[point] = (pointCounts[point] || 0) + 1;
      });
    }
  });

  return Object.entries(pointCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

onMounted(() => {
  loadWrongQuestions();
});

defineExpose({
  addWrongQuestion,
});
</script>

<style scoped>
.question-bank-container {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.question-item {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6));
  border-radius: 16px;
  border: 1px solid rgba(0, 242, 255, 0.1);
  transition: all 0.3s ease;
}

.question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 242, 255, 0.15);
}

.question-header {
  margin-bottom: 1rem;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: white;
  border-radius: 50%;
  font-weight: 600;
  margin-right: 0.75rem;
}

.question-type {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(114, 9, 183, 0.1));
  color: var(--tech-blue);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.question-content {
  margin-bottom: 1rem;
}

.question-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid rgba(0, 242, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.option-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 242, 255, 0.4);
}

.option-wrong {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.option-correct {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.option-label {
  font-weight: 600;
  color: #4b5563;
  margin-right: 0.5rem;
}

.option-text {
  color: #374151;
}

.true-false-options {
  display: flex;
  gap: 1rem;
}

.explanation-section {
  padding: 1rem;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.2);
  margin-bottom: 1rem;
}

.explanation-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #d97706;
}

.explanation-content {
  color: #78350f;
  line-height: 1.6;
}

.knowledge-points {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.knowledge-point-tag {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, rgba(114, 9, 183, 0.1), rgba(247, 37, 133, 0.1));
  color: var(--tech-purple);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.question-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary {
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 242, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 242, 255, 0.5);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--tech-purple), var(--tech-pink));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(114, 9, 183, 0.3);
}

.btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(114, 9, 183, 0.5);
}

.stat-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(114, 9, 183, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.weak-point-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.05));
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.point-name {
  font-size: 0.875rem;
  color: #374151;
}

.point-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
