/**
 * Jest配置文件
 */

export default {
  // 测试环境
  testEnvironment: 'node',
  
  // 使用ts-jest转换TypeScript
  preset: 'ts-jest/presets/default-esm',
  
  // 模块名称映射
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // 转换配置
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  
  // 扩展名
  extensionsToTreatAsEsm: ['.ts'],
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts'
  ],
  
  // 覆盖率收集
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 测试超时时间（毫秒）
  testTimeout: 10000, // 减少超时时间以更快发现问题
  
  // 详细输出
  verbose: true,
  
  // 清除模拟
  clearMocks: true,
  
  // 最大并发数
  maxWorkers: 2, // 允许一定并发以加快测试速度
  
  // 在第一个失败后停止
  bail: 1,
  
  // 强制退出
  forceExit: true,
  
  // 检测打开的句柄
  detectOpenHandles: true
};
