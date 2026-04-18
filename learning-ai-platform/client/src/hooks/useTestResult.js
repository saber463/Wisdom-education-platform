import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { testApi } from '@/utils/api';

// Mock 测试结果数据 - 匹配 AnswerDetailItem 组件格式
const mockResult = {
  testTitle: 'Vue3 Composition API 专项测试',
  testTime: 45,
  totalScore: 3,
  correctRate: 60,
  startTime: new Date(Date.now() - 1800000).toISOString(),
  endTime: new Date().toISOString(),
  answerDetails: [
    {
      questionId: 'q1',
      question: '在 Vue3 Composition API 中，以下哪个函数用于创建响应式基本类型数据？',
      options: [
        { text: 'reactive()', isCorrect: false },
        { text: 'ref()', isCorrect: true },
        { text: 'computed()', isCorrect: false },
        { text: 'watch()', isCorrect: false },
      ],
      selected: 'ref()',
      correct: 'ref()',
      isCorrect: true,
      score: 1,
      totalPoints: 1,
      explanation: 'ref() 用于创建响应式的基本类型数据（如数字、字符串、布尔值），reactive() 用于创建响应式对象。',
      knowledgePoints: ['响应式系统', 'Composition API'],
    },
    {
      questionId: 'q2',
      question: 'Vue3 中 watch 和 watchEffect 的主要区别是什么？',
      options: [
        { text: 'watchEffect 不需要指定监听源', isCorrect: true },
        { text: 'watch 不支持深度监听', isCorrect: false },
        { text: 'watchEffect 性能更好', isCorrect: false },
        { text: '没有区别，只是别名', isCorrect: false },
      ],
      selected: 'watch 不支持深度监听',
      correct: 'watchEffect 不需要指定监听源',
      isCorrect: false,
      score: 0,
      totalPoints: 1,
      explanation: 'watchEffect 会自动收集回调函数中使用的响应式依赖，而 watch 需要显式指定要监听的源数据。watch 实际上是支持深度监听的。',
      knowledgePoints: ['watch/watchEffect', '响应式系统'],
    },
    {
      questionId: 'q3',
      question: '在 Vue3 的 setup() 函数中，this 指向当前组件实例。',
      options: [
        { text: '正确', isCorrect: false },
        { text: '错误', isCorrect: true },
      ],
      selected: '正确',
      correct: '错误',
      isCorrect: false,
      score: 0,
      totalPoints: 1,
      explanation: '在 Composition API 的 setup() 函数中没有 this 访问，因为它在组件实例创建之前执行。这是 Composition API 与 Options API 的关键区别之一。',
      knowledgePoints: ['setup函数', 'Composition API基础'],
    },
    {
      questionId: 'q4',
      question: '以下哪个是 Vue3 推荐的代码组织方式？',
      options: [
        { text: 'Options API', isCorrect: false },
        { text: 'Composition API + <script setup>', isCorrect: true },
        { text: 'Class-based API', isCorrect: false },
        { text: 'Mixin 模式', isCorrect: false },
      ],
      selected: 'Mixin 模式',
      correct: 'Composition API + <script setup>',
      isCorrect: false,
      score: 0,
      totalPoints: 1,
      explanation: '<script setup> 是 Vue3 的编译时语法糖，是官方推荐的 Composition API 书写方式。它比 Options API 更好的逻辑复用能力，也比 Class-based API 更简洁。',
      knowledgePoints: ['script setup', '代码组织方式'],
    },
    {
      questionId: 'q5',
      question: 'toRef 和 toRefs 的作用是什么？',
      options: [
        { text: '创建计算属性', isCorrect: false },
        { text: '将 reactive 对象的属性转为 ref', isCorrect: true },
        { text: '创建只读引用', isCorrect: false },
        { text: '进行类型转换', isCorrect: false },
      ],
      selected: '将 reactive 对象的属性转为 ref',
      correct: '将 reactive 对象的属性转为 ref',
      isCorrect: true,
      score: 1,
      totalPoints: 1,
      explanation: 'toRef 可以为 reactive 对象的某个属性创建一个 ref，toRefs 则将整个 reactive 对象的所有属性转为 ref 对象。这在解构时保持响应性非常有用。',
      knowledgePoints: ['toRef/toRefs', '响应式系统'],
    }
  ],
  knowledgePoints: [
    { name: 'ref/reactive', mastery: 85, status: 'good' },
    { name: 'watch/watchEffect', mastery: 40, status: 'weak' },
    { name: 'Composition API基础', mastery: 50, status: 'weak' },
    { name: '<script setup>', mastery: 30, status: 'weak' },
    { name: 'toRef/toRefs', mastery: 80, status: 'good' }
  ],
  recommendations: {
    suggestions: [
      { content: '建议加强学习Composition API核心概念，重点复习<script setup>语法糖和setup函数的使用场景' },
      { content: 'watch和watchEffect的区别需要重点掌握，建议多看官方文档示例' },
      { content: '推荐完成"前端框架-Vue3进阶"学习路径，预计30天掌握高级特性' }
    ],
    resources: [
      { title: 'Vue3 官方文档 - Composition API', type: '文档', url: '#' },
      { title: '深入理解 Vue3 响应式原理', type: '视频', url: '#' }
    ],
    learningPath: [
      { title: 'HTML与CSS基础', duration: '60分钟', status: 'completed' },
      { title: 'JavaScript核心', duration: '60分钟', status: 'completed' },
      { title: '前端框架-React/Vue', duration: '60分钟', status: 'in_progress' }
    ]
  }
};

export function useTestResult() {
  const assessmentResult = ref({
    testTitle: '',
    testTime: '',
    totalScore: 0,
    correctRate: 0,
    answerDetails: [],
    knowledgePoints: [],
    recommendations: {
      suggestions: [{ content: '正在生成学习建议...' }],
      resources: [],
      learningPath: [],
    },
  });

  const loading = ref(false);

  // 数据格式转换 - API返回的数据转换为组件期望的格式
  const transformAnswerDetail = (detail) => {
    if (!detail) return null;
    
    // 如果已经是正确格式，直接返回
    if (detail.question && detail.options?.[0]?.text) {
      return detail;
    }
    
    // 转换旧格式到新格式
    const options = Array.isArray(detail.options) && detail.options.length > 0
      ? detail.options.map((opt, idx) => ({
          text: typeof opt === 'string' ? opt : opt.text || String(opt),
          isCorrect: typeof opt !== 'string' 
            ? !!opt.isCorrect 
            : (typeof detail.correctAnswer === 'number' ? idx === detail.correctAnswer : opt === detail.correctAnswer)
        }))
      : [];
    
    const selectedIdx = detail.userAnswer;
    let selected = '';
    if (typeof selectedIdx === 'number' && options[selectedIdx]) {
      selected = options[selectedIdx].text;
    } else if (typeof selectedIdx === 'string') {
      selected = selectedIdx;
    } else if (selectedIdx === true || selectedIdx === false) {
      selected = selectedIdx ? '正确' : '错误';
    }

    return {
      questionId: detail.questionId || detail._id || `q${Math.random().toString(36).substr(2,9)}`,
      question: detail.question || detail.questionText || '',
      options,
      selected,
      correct: options.find(o => o.isCorrect)?.text || '',
      isCorrect: detail.isCorrect ?? (selected === (options.find(o => o.isCorrect)?.text || '')),
      score: detail.score ?? (detail.isCorrect ? 1 : 0),
      totalPoints: detail.totalPoints || 1,
      explanation: detail.explanation || '暂无解析',
      knowledgePoints: Array.isArray(detail.knowledgePoints) 
        ? detail.knowledgePoints 
        : (detail.knowledgePoint ? [detail.knowledgePoint] : []),
    };
  };

  const fetchTestResult = async resultId => {
    loading.value = true;
    try {
      const response = await testApi.getResultDetail(resultId);
      const data = response.data.data;

      if (data && data.answerDetails && data.answerDetails.length > 0) {
        // API返回有效数据 - 转换格式
        assessmentResult.value = {
          testTitle: data.test?.title || data.testTitle || '测试评估',
          testTime: data.test?.duration || data.testTime || 45,
          testDifficulty:
            {
              easy: '简单',
              medium: '中等',
              hard: '困难',
            }[data.test?.difficulty] || '中等',
          totalScore: data.testResult?.score ?? data.totalScore ?? 0,
          correctRate: data.testResult 
            ? ((data.testResult.score / data.testResult.totalQuestions) * 100)
            : (data.correctRate || 60),
          startTime: data.testResult?.startTime || data.startTime || new Date().toISOString(),
          endTime: data.testResult?.endTime || data.endTime || new Date().toISOString(),
          answerDetails: data.answerDetails.map(transformAnswerDetail),
          knowledgePoints: data.testResult?.knowledgePoints || data.knowledgePoints || mockResult.knowledgePoints,
          recommendations: data.testResult?.recommendations || data.recommendations || mockResult.recommendations,
        };
      } else {
        console.log('API返回空数据，使用Mock测试结果');
        assessmentResult.value = { ...mockResult };
      }
    } catch (_error) {
      console.error('获取测试结果错误:', _error);
      // API失败时也使用mock数据
      assessmentResult.value = { ...mockResult };
    } finally {
      loading.value = false;
    }
  };

  // 直接加载Mock数据（用于测试）
  const loadMockResult = () => {
    assessmentResult.value = { ...mockResult };
  };

  return {
    assessmentResult,
    loading,
    fetchTestResult,
    loadMockResult,
  };
}

export default useTestResult;
