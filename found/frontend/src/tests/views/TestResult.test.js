import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import TestResult from '@/views/assessment/TestResult.vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia } from 'pinia';

vi.mock('@/hooks/useTestResult', () => ({
  useTestResult: () => ({
    assessmentResult: ref({
      totalScore: 85,
      correctRate: 0.85,
      testTitle: 'Vue.js 基础测试',
      testTime: 30,
      startTime: '2025-12-29T10:00:00Z',
      endTime: '2025-12-29T10:30:00Z',
      testDifficulty: '中等',
      knowledgePoints: [
        { name: 'Vue基础', mastery: 0.9 },
        { name: '组件通信', mastery: 0.8 },
        { name: '状态管理', mastery: 0.75 },
      ],
      answerDetails: [
        { id: 1, isCorrect: true, userAnswer: 'A', correctAnswer: 'A' },
        { id: 2, isCorrect: false, userAnswer: 'B', correctAnswer: 'A' },
        { id: 3, isCorrect: true, userAnswer: 'C', correctAnswer: 'C' },
      ],
      recommendations: {
        suggestions: [{ content: '建议加强组件通信的学习' }],
        resources: [],
        learningPath: [],
      },
    }),
    loading: ref(false),
    fetchTestResult: vi.fn(),
  }),
}));

describe('TestResult.vue', () => {
  let router;
  let pinia;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/test-result/:id', component: TestResult }],
    });

    pinia = createPinia();
  });

  it('renders test result summary correctly', async () => {
    const wrapper = mount(TestResult, {
      global: {
        plugins: [router, pinia],
      },
    });

    await router.push('/test-result/123');
    await router.isReady();

    expect(wrapper.find('h1').text()).toBe('学习评估报告');
  });

  it('calculates correct count correctly', async () => {
    const wrapper = mount(TestResult, {
      global: {
        plugins: [router, pinia],
      },
    });

    await router.push('/test-result/123');
    await router.isReady();

    const correctCount = wrapper.vm.correctCount;
    expect(correctCount).toBe(2);
  });

  it('calculates total questions correctly', async () => {
    const wrapper = mount(TestResult, {
      global: {
        plugins: [router, pinia],
      },
    });

    await router.push('/test-result/123');
    await router.isReady();

    const totalQuestions = wrapper.vm.totalQuestions;
    expect(totalQuestions).toBe(3);
  });
});
