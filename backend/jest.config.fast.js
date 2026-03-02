/**
 * Jest 快速测试配置文件
 * 只运行快速的单元测试，跳过慢速的集成测试和系统命令测试
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
  
  // 测试文件匹配模式 - 排除慢速测试
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts'
  ],
  
  // 排除慢速测试
  testPathIgnorePatterns: [
    '/node_modules/',
    'mirror-switcher.property.test.ts',  // 执行系统命令，很慢
    'emergency-repair.property.test.ts',  // 执行系统命令，很慢
    'service-shutdown.property.test.ts',  // 执行系统命令，很慢
    'database-backup.property.test.ts',   // 需要数据库
    'demo-data-reset.property.test.ts',   // 需要数据库
    'startup-order.property.test.ts',     // 执行系统命令
    'integration/',                        // 所有集成测试
    'cross-service-communication.test.ts', // 需要多个服务
    'fault-recovery.test.ts',              // 需要服务
    'offline-sync.test.ts',                // 需要服务
    'speech-assessment.test.ts',           // 需要 gRPC 服务
    'grpc-retry.test.ts',                  // 需要 gRPC 服务
  ],
  
  // 覆盖率收集
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}'
  ],
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 清除模拟
  clearMocks: true,
  
  // 最大并发数
  maxWorkers: 2,
  
  // 在第一个失败后停止
  bail: 1,
  
  // 强制退出
  forceExit: true,
  
  // 检测打开的句柄
  detectOpenHandles: true
};
