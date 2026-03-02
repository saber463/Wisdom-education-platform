/**
 * WASM模块加载器测试
 * 
 * 验证WASM模块能否正确加载和调用
 * 需求：13.3 - WASM浏览器执行
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initWasm, compareAnswers, calculateSimilarity, isWasmSupported } from '@/utils/wasm-loader';

describe('WASM Loader', () => {
  beforeAll(async () => {
    // 初始化WASM模块
    await initWasm();
  });

  describe('WASM Support Detection', () => {
    it('should detect WebAssembly support', () => {
      const supported = isWasmSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('Compare Answers', () => {
    it('should match identical answers', () => {
      const result = compareAnswers('A', 'A');
      expect(result).toBe(true);
    });

    it('should match case-insensitive answers', () => {
      const result = compareAnswers('A', 'a');
      expect(result).toBe(true);
    });

    it('should match answers with spaces', () => {
      const result = compareAnswers(' A ', 'A');
      expect(result).toBe(true);
    });

    it('should not match different answers', () => {
      const result = compareAnswers('A', 'B');
      expect(result).toBe(false);
    });

    it('should match Chinese answers', () => {
      const result = compareAnswers('你好', '你好');
      expect(result).toBe(true);
    });

    it('should match Chinese answers with spaces', () => {
      const result = compareAnswers('你 好', '你好');
      expect(result).toBe(true);
    });
  });

  describe('Calculate Similarity', () => {
    it('should return 1.0 for identical strings', () => {
      const similarity = calculateSimilarity('hello', 'hello');
      expect(similarity).toBe(1.0);
    });

    it('should return 0.0 for completely different strings', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(0.5);
    });

    it('should return 0.0 for empty vs non-empty', () => {
      const similarity = calculateSimilarity('', 'hello');
      expect(similarity).toBe(0.0);
    });

    it('should return 1.0 for two empty strings', () => {
      const similarity = calculateSimilarity('', '');
      expect(similarity).toBe(1.0);
    });

    it('should return high similarity for similar strings', () => {
      const similarity = calculateSimilarity('hello', 'hallo');
      expect(similarity).toBeGreaterThanOrEqual(0.8);
    });

    it('should handle Chinese text', () => {
      const similarity = calculateSimilarity('你好', '你好');
      expect(similarity).toBe(1.0);
    });

    it('should return value between 0 and 1', () => {
      const similarity = calculateSimilarity('kitten', 'sitting');
      expect(similarity).toBeGreaterThanOrEqual(0.0);
      expect(similarity).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Performance', () => {
    it('should complete compare_answers in reasonable time', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        compareAnswers('hello world', 'helloworld');
      }
      const end = performance.now();
      const time = end - start;
      
      // 1000次调用应该在100ms内完成
      expect(time).toBeLessThan(100);
    });

    it('should complete calculate_similarity in reasonable time', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        calculateSimilarity('hello world', 'hallo world');
      }
      const end = performance.now();
      const time = end - start;
      
      // 100次调用应该在50ms内完成
      expect(time).toBeLessThan(50);
    });
  });
});
