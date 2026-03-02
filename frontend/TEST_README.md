# 前端测试指南

## 概述

本项目使用Vitest作为测试框架，包含WASM模块的属性测试。

## 安装测试依赖

```bash
npm install --save-dev vitest @vitest/ui jsdom @vue/test-utils happy-dom
```

## 运行测试

### 运行所有测试

```bash
npm run test
```

### 运行测试（监听模式）

```bash
npm run test:watch
```

### 运行测试（UI模式）

```bash
npm run test:ui
```

### 生成测试覆盖率报告

```bash
npm run test:coverage
```

## WASM属性测试

### 测试文件位置

```
frontend/src/utils/__tests__/wasm-loader.test.ts
```

### 测试内容

**属性56：WASM浏览器执行**（验证需求13.3）

测试验证以下属性：

1. **功能正确性**
   - 客观题答案比对（选择题、填空题、判断题）
   - 相似度计算（Levenshtein算法）
   - 中文和Unicode支持

2. **鲁棒性**
   - 边界情况处理（空字符串、长字符串）
   - 特殊字符处理
   - 大量计算稳定性

3. **性能**
   - 计算速度要求（100次计算<100ms）
   - 长字符串处理能力

4. **可靠性**
   - WASM不可用时自动回退到JavaScript
   - 状态检测功能

### 运行WASM测试

```bash
# 运行WASM相关测试
npm run test -- wasm-loader

# 运行单个测试套件
npm run test -- --grep "Property 56"
```

## 测试配置

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
```

### 关键配置说明

- `globals: true`: 全局注册测试API（describe, it, expect等）
- `environment: 'jsdom'`: 使用jsdom模拟浏览器环境
- `testTimeout: 10000`: 测试超时时间10秒（WASM加载需要时间）

## 测试结果解读

### 成功示例

```
✓ src/utils/__tests__/wasm-loader.test.ts (45)
  ✓ Property 56: WASM浏览器执行 (45)
    ✓ 客观题答案比对功能 (5)
    ✓ 相似度计算功能 (6)
    ✓ WASM执行环境 (4)
    ✓ 性能特性 (2)
    ✓ 边界情况 (3)

Test Files  1 passed (1)
     Tests  45 passed (45)
  Start at  10:30:00
  Duration  1.23s
```

### WASM回退警告

如果看到以下警告，说明WASM未加载，测试使用JavaScript回退实现：

```
WARN  WASM初始化失败，将使用JavaScript回退实现
```

这是正常的，因为：
1. WASM模块可能未编译
2. 测试环境可能不支持WASM
3. 系统会自动回退到JavaScript实现

## 故障排查

### 问题1：测试失败 - WASM模块未找到

**原因**：WASM模块未编译或未复制到前端

**解决**：
```bash
cd ../rust-wasm
build-and-deploy.bat
```

### 问题2：测试超时

**原因**：WASM加载时间过长

**解决**：增加测试超时时间
```typescript
// vitest.config.ts
test: {
  testTimeout: 20000  // 增加到20秒
}
```

### 问题3：jsdom环境错误

**原因**：jsdom未安装

**解决**：
```bash
npm install --save-dev jsdom
```

### 问题4：性能测试失败

**原因**：测试环境性能较差

**解决**：调整性能阈值或跳过性能测试
```typescript
it.skip('应该在合理时间内完成计算', () => {
  // 跳过此测试
});
```

## 持续集成

### GitHub Actions示例

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run test
```

## 测试最佳实践

1. **编写测试前先编译WASM**
   ```bash
   cd rust-wasm && build-and-deploy.bat
   ```

2. **使用描述性测试名称**
   ```typescript
   it('应该能够比对选择题答案（不区分大小写）', () => {
     // 测试代码
   });
   ```

3. **测试边界情况**
   - 空字符串
   - 长字符串
   - 特殊字符
   - Unicode字符

4. **验证属性而非具体值**
   ```typescript
   // 好的做法：验证属性
   expect(similarity).toBeGreaterThan(0.8);
   
   // 避免：验证具体值
   expect(similarity).toBe(0.857142857);
   ```

5. **使用合理的超时时间**
   - WASM加载：5-10秒
   - 单个测试：1-2秒
   - 性能测试：根据实际情况调整

## 参考资料

- [Vitest文档](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [jsdom文档](https://github.com/jsdom/jsdom)
