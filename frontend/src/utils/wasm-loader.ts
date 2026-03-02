/**
 * Rust-WASM模块加载器
 * 
 * 本模块负责加载和初始化Rust编译的WebAssembly模块
 * 提供客观题答案比对和相似度计算功能
 * 
 * 功能特性：
 * - 自动检测WASM支持
 * - 懒加载WASM模块
 * - JavaScript回退实现
 * - 性能监控
 * 
 * 需求：13.3 - WASM浏览器执行
 */

// WASM模块类型定义
interface WasmModule {
  compare_answers: (student: string, standard: string) => boolean;
  calculate_similarity: (text1: string, text2: string) => number;
}

// WASM加载状态
export enum WasmStatus {
  NOT_LOADED = 'not_loaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  FAILED = 'failed',
  FALLBACK = 'fallback'
}

// WASM模块实例
let wasmModule: WasmModule | null = null;
let wasmStatus: WasmStatus = WasmStatus.NOT_LOADED;
let initPromise: Promise<boolean> | null = null;
let loadError: Error | null = null;

/**
 * 检查浏览器是否支持WebAssembly
 */
export function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch (e) {
    // WebAssembly不支持
  }
  return false;
}

/**
 * 初始化WASM模块
 * 
 * @returns Promise<boolean> - 返回是否成功加载WASM（false表示使用回退）
 */
export async function initWasm(): Promise<boolean> {
  // 如果已经加载成功，直接返回
  if (wasmStatus === WasmStatus.LOADED) {
    return true;
  }

  // 如果已经失败，使用回退
  if (wasmStatus === WasmStatus.FAILED || wasmStatus === WasmStatus.FALLBACK) {
    return false;
  }

  // 如果正在加载，等待加载完成
  if (initPromise) {
    return initPromise;
  }

  // 检查浏览器支持
  if (!isWasmSupported()) {
    console.warn('[WASM] 浏览器不支持WebAssembly，使用JavaScript回退');
    wasmStatus = WasmStatus.FALLBACK;
    return false;
  }

  // 开始加载
  wasmStatus = WasmStatus.LOADING;
  
  initPromise = (async () => {
    try {
      console.log('[WASM] 开始加载模块...');
      const startTime = performance.now();
      
      // 动态导入WASM模块
      const wasm = await import('@/wasm/edu_wasm');
      
      // 初始化WASM
      if (typeof wasm.default === 'function') {
        await wasm.default();
      }
      
      // 验证导出函数存在
      if (typeof wasm.compare_answers !== 'function' ||
          typeof wasm.calculate_similarity !== 'function') {
        throw new Error('WASM模块缺少必要的导出函数');
      }
      
      // 保存模块实例
      wasmModule = {
        compare_answers: wasm.compare_answers,
        calculate_similarity: wasm.calculate_similarity
      };
      
      const loadTime = performance.now() - startTime;
      wasmStatus = WasmStatus.LOADED;
      console.log(`[WASM] 模块加载成功，耗时: ${loadTime.toFixed(2)}ms`);
      
      return true;
    } catch (error) {
      loadError = error instanceof Error ? error : new Error(String(error));
      console.error('[WASM] 模块加载失败:', loadError.message);
      console.warn('[WASM] 将使用JavaScript回退实现');
      wasmStatus = WasmStatus.FALLBACK;
      return false;
    }
  })();

  return initPromise;
}

/**
 * 客观题答案比对（WASM加速）
 * 
 * 比较学生答案和标准答案是否一致
 * 自动标准化：去除空格、转小写
 * 
 * @param student - 学生答案
 * @param standard - 标准答案
 * @returns 如果答案匹配返回true，否则返回false
 */
export function compareAnswers(student: string, standard: string): boolean {
  // 如果WASM已加载，使用WASM实现
  if (wasmStatus === WasmStatus.LOADED && wasmModule) {
    try {
      return wasmModule.compare_answers(student, standard);
    } catch (error) {
      console.error('[WASM] compare_answers调用失败:', error);
      console.warn('[WASM] 回退到JavaScript实现');
    }
  }

  // JavaScript回退实现
  return compareAnswersJS(student, standard);
}

/**
 * 相似度计算（WASM加速）
 * 
 * 使用Levenshtein算法计算两个字符串的相似度
 * 
 * @param text1 - 第一个字符串
 * @param text2 - 第二个字符串
 * @returns 相似度值，范围[0.0, 1.0]，1.0表示完全相同
 */
export function calculateSimilarity(text1: string, text2: string): number {
  // 如果WASM已加载，使用WASM实现
  if (wasmStatus === WasmStatus.LOADED && wasmModule) {
    try {
      return wasmModule.calculate_similarity(text1, text2);
    } catch (error) {
      console.error('[WASM] calculate_similarity调用失败:', error);
      console.warn('[WASM] 回退到JavaScript实现');
    }
  }

  // JavaScript回退实现
  return calculateSimilarityJS(text1, text2);
}

/**
 * 检查WASM是否已初始化
 * 
 * @returns 如果WASM已初始化返回true
 */
export function isWasmInitialized(): boolean {
  return wasmStatus === WasmStatus.LOADED;
}

/**
 * 获取WASM加载状态
 */
export function getWasmStatus(): WasmStatus {
  return wasmStatus;
}

/**
 * 获取WASM加载错误
 */
export function getWasmError(): Error | null {
  return loadError;
}

// ========== JavaScript回退实现 ==========

/**
 * 标准化答案（JavaScript实现）
 * 去除空格、转小写
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 客观题答案比对（JavaScript实现）
 */
function compareAnswersJS(student: string, standard: string): boolean {
  const studentNormalized = normalizeAnswer(student);
  const standardNormalized = normalizeAnswer(standard);
  return studentNormalized === standardNormalized;
}

/**
 * Levenshtein距离计算（JavaScript实现）
 * 优化空间复杂度至O(min(n,m))
 */
function levenshteinDistance(s1: string, s2: string): number {
  // 确保s1是较短的字符串，优化空间
  if (s1.length > s2.length) {
    [s1, s2] = [s2, s1];
  }
  
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // 只使用两行数组，优化空间复杂度
  let prevRow: number[] = Array.from({ length: len1 + 1 }, (_, i) => i);
  let currRow: number[] = new Array(len1 + 1);

  for (let j = 1; j <= len2; j++) {
    currRow[0] = j;
    for (let i = 1; i <= len1; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,      // 删除
        currRow[i - 1] + 1,  // 插入
        prevRow[i - 1] + cost // 替换
      );
    }
    // 交换行
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[len1];
}

/**
 * 相似度计算（JavaScript实现）
 */
function calculateSimilarityJS(text1: string, text2: string): number {
  if (text1.length === 0 && text2.length === 0) {
    return 1.0;
  }
  if (text1.length === 0 || text2.length === 0) {
    return 0.0;
  }

  const distance = levenshteinDistance(text1, text2);
  const maxLen = Math.max(text1.length, text2.length);
  return 1.0 - distance / maxLen;
}

// ========== 性能测试工具 ==========

/**
 * 性能对比测试
 * 
 * 比较WASM和JavaScript实现的性能差异
 */
export async function performanceTest(): Promise<{
  wasmTime: number | null;
  jsTime: number;
  speedup: number | null;
}> {
  const testCases = [
    { student: 'Hello World', standard: 'helloworld' },
    { student: 'A', standard: 'a' },
    { student: '你好世界', standard: '你好世界' },
    { student: 'The quick brown fox', standard: 'the quick brown fox' },
    { student: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', standard: 'abcdefghijklmnopqrstuvwxyz' }
  ];

  const iterations = 1000;
  let wasmTime: number | null = null;
  let jsTime: number;
  let speedup: number | null = null;

  console.log('========== WASM性能测试 ==========');
  console.log(`测试用例数: ${testCases.length}`);
  console.log(`迭代次数: ${iterations}`);

  // 测试WASM实现
  if (wasmStatus === WasmStatus.LOADED && wasmModule) {
    const wasmStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      testCases.forEach(tc => {
        wasmModule!.compare_answers(tc.student, tc.standard);
        wasmModule!.calculate_similarity(tc.student, tc.standard);
      });
    }
    const wasmEnd = performance.now();
    wasmTime = wasmEnd - wasmStart;
    console.log(`WASM实现: ${wasmTime.toFixed(2)}ms`);
  } else {
    console.warn('WASM未加载，跳过WASM测试');
  }

  // 测试JavaScript实现
  const jsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    testCases.forEach(tc => {
      compareAnswersJS(tc.student, tc.standard);
      calculateSimilarityJS(tc.student, tc.standard);
    });
  }
  const jsEnd = performance.now();
  jsTime = jsEnd - jsStart;
  console.log(`JavaScript实现: ${jsTime.toFixed(2)}ms`);

  // 计算性能提升
  if (wasmTime !== null) {
    speedup = jsTime / wasmTime;
    console.log(`性能提升: ${speedup.toFixed(2)}x`);
  }

  console.log('==================================');

  return { wasmTime, jsTime, speedup };
}

/**
 * 批量批改客观题
 * 
 * @param answers - 答案数组，每项包含学生答案和标准答案
 * @returns 批改结果数组
 */
export function batchGradeObjective(
  answers: Array<{ studentAnswer: string; standardAnswer: string; score: number }>
): Array<{ isCorrect: boolean; score: number }> {
  return answers.map(item => {
    const isCorrect = compareAnswers(item.studentAnswer, item.standardAnswer);
    return {
      isCorrect,
      score: isCorrect ? item.score : 0
    };
  });
}

/**
 * 导出JavaScript回退函数（用于测试）
 */
export const _internal = {
  compareAnswersJS,
  calculateSimilarityJS,
  normalizeAnswer,
  levenshteinDistance
};
