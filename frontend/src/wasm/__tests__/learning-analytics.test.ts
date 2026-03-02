/**
 * 学情分析计算模块测试
 * 测试WASM模块中的学情分析相关函数
 */

import {
  calculate_average_score,
  calculate_pass_rate,
  calculate_excellent_rate,
  calculate_progress,
  calculate_student_tier,
  calculate_knowledge_mastery,
  calculate_error_rate,
} from '../edu_wasm';

describe('Learning Analytics Calculations', () => {
  // ========== 平均分计算测试 ==========
  
  describe('calculate_average_score', () => {
    it('should return 0 for empty array', () => {
      expect(calculate_average_score(new Float32Array(0))).toBe(0.0);
    });

    it('should return the score for single element', () => {
      expect(calculate_average_score(new Float32Array([85.0]))).toBe(85.0);
    });

    it('should calculate average correctly', () => {
      const scores = new Float32Array([80.0, 90.0, 70.0, 85.0]);
      expect(calculate_average_score(scores)).toBe(81.25);
    });

    it('should round to 2 decimal places', () => {
      const scores = new Float32Array([80.123, 90.456, 70.789]);
      const avg = calculate_average_score(scores);
      // (80.123 + 90.456 + 70.789) / 3 = 80.456
      expect(avg).toBeCloseTo(80.46, 1);
    });

    it('should handle all same scores', () => {
      const scores = new Float32Array([75.0, 75.0, 75.0, 75.0]);
      expect(calculate_average_score(scores)).toBe(75.0);
    });
  });

  // ========== 及格率计算测试 ==========
  
  describe('calculate_pass_rate', () => {
    it('should return 0 for empty array', () => {
      expect(calculate_pass_rate(new Float32Array(0))).toBe(0.0);
    });

    it('should return 100 when all pass', () => {
      const scores = new Float32Array([60.0, 70.0, 80.0, 90.0]);
      expect(calculate_pass_rate(scores)).toBe(100.0);
    });

    it('should return 0 when all fail', () => {
      const scores = new Float32Array([30.0, 40.0, 50.0, 59.0]);
      expect(calculate_pass_rate(scores)).toBe(0.0);
    });

    it('should calculate partial pass rate correctly', () => {
      const scores = new Float32Array([50.0, 60.0, 70.0, 80.0]);
      expect(calculate_pass_rate(scores)).toBe(75.0);
    });

    it('should handle boundary case at 60', () => {
      const scores = new Float32Array([59.9, 60.0, 60.1]);
      expect(calculate_pass_rate(scores)).toBeCloseTo(66.67, 1);
    });
  });

  // ========== 优秀率计算测试 ==========
  
  describe('calculate_excellent_rate', () => {
    it('should return 0 for empty array', () => {
      expect(calculate_excellent_rate(new Float32Array(0))).toBe(0.0);
    });

    it('should return 100 when all excellent', () => {
      const scores = new Float32Array([85.0, 90.0, 95.0, 100.0]);
      expect(calculate_excellent_rate(scores)).toBe(100.0);
    });

    it('should return 0 when none excellent', () => {
      const scores = new Float32Array([50.0, 60.0, 70.0, 84.0]);
      expect(calculate_excellent_rate(scores)).toBe(0.0);
    });

    it('should calculate partial excellent rate correctly', () => {
      const scores = new Float32Array([70.0, 80.0, 85.0, 90.0]);
      expect(calculate_excellent_rate(scores)).toBe(50.0);
    });

    it('should handle boundary case at 85', () => {
      const scores = new Float32Array([84.9, 85.0, 85.1]);
      expect(calculate_excellent_rate(scores)).toBeCloseTo(66.67, 1);
    });
  });

  // ========== 进步幅度计算测试 ==========
  
  describe('calculate_progress', () => {
    it('should return 0 for empty arrays', () => {
      expect(calculate_progress(new Float32Array(0), new Float32Array(0))).toBe(0.0);
    });

    it('should calculate improvement correctly', () => {
      const prevScores = new Float32Array([70.0, 75.0, 80.0]);
      const currScores = new Float32Array([80.0, 85.0, 90.0]);
      expect(calculate_progress(prevScores, currScores)).toBe(10.0);
    });

    it('should calculate decline correctly', () => {
      const prevScores = new Float32Array([80.0, 85.0, 90.0]);
      const currScores = new Float32Array([70.0, 75.0, 80.0]);
      expect(calculate_progress(prevScores, currScores)).toBe(-10.0);
    });

    it('should return 0 when no change', () => {
      const scores = new Float32Array([80.0, 85.0, 90.0]);
      expect(calculate_progress(scores, scores)).toBe(0.0);
    });

    it('should handle different array lengths', () => {
      const prevScores = new Float32Array([80.0, 85.0]);
      const currScores = new Float32Array([85.0, 90.0, 95.0]);
      expect(calculate_progress(prevScores, currScores)).toBe(7.5);
    });
  });

  // ========== 学生分层测试 ==========
  
  describe('calculate_student_tier', () => {
    it('should return 0 for basic tier (< 60)', () => {
      expect(calculate_student_tier(50.0)).toBe(0);
      expect(calculate_student_tier(59.9)).toBe(0);
    });

    it('should return 1 for medium tier (60-84)', () => {
      expect(calculate_student_tier(60.0)).toBe(1);
      expect(calculate_student_tier(75.0)).toBe(1);
      expect(calculate_student_tier(84.0)).toBe(1);
      expect(calculate_student_tier(84.9)).toBe(1);
    });

    it('should return 2 for advanced tier (>= 85)', () => {
      expect(calculate_student_tier(85.0)).toBe(2);
      expect(calculate_student_tier(90.0)).toBe(2);
      expect(calculate_student_tier(100.0)).toBe(2);
    });

    it('should handle boundary cases correctly', () => {
      expect(calculate_student_tier(59.99)).toBe(0);
      expect(calculate_student_tier(60.0)).toBe(1);
      expect(calculate_student_tier(84.99)).toBe(1);
      expect(calculate_student_tier(85.0)).toBe(2);
    });
  });

  // ========== 知识点掌握度测试 ==========
  
  describe('calculate_knowledge_mastery', () => {
    it('should return 0 when total is 0', () => {
      expect(calculate_knowledge_mastery(0, 0)).toBe(0.0);
    });

    it('should return 100 for perfect mastery', () => {
      expect(calculate_knowledge_mastery(10, 10)).toBe(100.0);
    });

    it('should return 0 for no mastery', () => {
      expect(calculate_knowledge_mastery(0, 10)).toBe(0.0);
    });

    it('should calculate partial mastery correctly', () => {
      expect(calculate_knowledge_mastery(7, 10)).toBe(70.0);
    });

    it('should round to 2 decimal places', () => {
      const mastery = calculate_knowledge_mastery(1, 3);
      // 1/3 = 0.333... * 100 = 33.33%
      expect(mastery).toBeCloseTo(33.33, 1);
    });

    it('should handle various ratios', () => {
      expect(calculate_knowledge_mastery(5, 10)).toBe(50.0);
      expect(calculate_knowledge_mastery(8, 10)).toBe(80.0);
      expect(calculate_knowledge_mastery(3, 5)).toBe(60.0);
    });
  });

  // ========== 错误率计算测试 ==========
  
  describe('calculate_error_rate', () => {
    it('should return 0 when total is 0', () => {
      expect(calculate_error_rate(0, 0)).toBe(0.0);
    });

    it('should return 0 when all correct', () => {
      expect(calculate_error_rate(0, 10)).toBe(0.0);
    });

    it('should return 100 when all wrong', () => {
      expect(calculate_error_rate(10, 10)).toBe(100.0);
    });

    it('should calculate partial error rate correctly', () => {
      expect(calculate_error_rate(3, 10)).toBe(30.0);
    });

    it('should round to 2 decimal places', () => {
      const errorRate = calculate_error_rate(2, 3);
      // 2/3 = 0.666... * 100 = 66.67%
      expect(errorRate).toBeCloseTo(66.67, 1);
    });

    it('should handle various ratios', () => {
      expect(calculate_error_rate(5, 10)).toBe(50.0);
      expect(calculate_error_rate(2, 10)).toBe(20.0);
      expect(calculate_error_rate(1, 5)).toBe(20.0);
    });
  });

  // ========== 集成测试 ==========
  
  describe('Integration Tests', () => {
    it('should work together for complete learning analytics', () => {
      const classScores = new Float32Array([65, 72, 58, 85, 90, 78, 88, 92, 55, 80]);
      const avgScore = calculate_average_score(classScores);
      const passRate = calculate_pass_rate(classScores);
      const excellentRate = calculate_excellent_rate(classScores);
      
      // 验证结果
      expect(avgScore).toBeCloseTo(76.3, 1);
      expect(passRate).toBe(80.0); // 8个及格
      expect(excellentRate).toBe(40.0); // 4个优秀
    });

    it('should track student progress over time', () => {
      const month1 = new Float32Array([60, 65, 70, 75]);
      const month2 = new Float32Array([70, 75, 80, 85]);
      const progress = calculate_progress(month1, month2);
      expect(progress).toBe(10.0); // 进步10分
      
      // 验证分层
      const tier1 = calculate_student_tier(calculate_average_score(month1));
      const tier2 = calculate_student_tier(calculate_average_score(month2));
      expect(tier1).toBe(1); // 中等层
      expect(tier2).toBe(1); // 仍在中等层
    });

    it('should calculate knowledge point mastery and error rate', () => {
      // 学生在某知识点的答题情况
      const correctCount = 8;
      const totalCount = 10;
      
      const mastery = calculate_knowledge_mastery(correctCount, totalCount);
      const errorRate = calculate_error_rate(totalCount - correctCount, totalCount);
      
      expect(mastery).toBe(80.0);
      expect(errorRate).toBe(20.0);
      expect(mastery + errorRate).toBe(100.0); // 掌握度 + 错误率 = 100%
    });
  });
});
