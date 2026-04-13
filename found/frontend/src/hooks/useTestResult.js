import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { testApi } from '@/utils/api';

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

  const fetchTestResult = async resultId => {
    loading.value = true;
    try {
      const response = await testApi.getResultDetail(resultId);
      const data = response.data.data;

      assessmentResult.value = {
        testTitle: data.test.title,
        testTime: data.test.duration,
        testDifficulty:
          {
            easy: '简单',
            medium: '中等',
            hard: '困难',
          }[data.test.difficulty] || '中等',
        totalScore: data.testResult.score,
        correctRate: (data.testResult.score / data.testResult.totalQuestions) * 100,
        startTime: data.testResult.startTime,
        endTime: data.testResult.endTime,
        answerDetails: data.answerDetails,
        knowledgePoints: data.testResult.knowledgePoints,
        recommendations: data.testResult.recommendations || {
          suggestions: [{ content: '正在生成学习建议...' }],
          resources: [],
          learningPath: [],
        },
      };
    } catch (_error) {
      console.error('获取测试结果错误:', _error);
      ElMessage.error('获取测试结果失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  };

  return {
    assessmentResult,
    loading,
    fetchTestResult,
  };
}
