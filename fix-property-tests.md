# Property-Based 测试优化方案

## 问题分析

1. **迭代次数过多**: 许多测试使用 `numRuns: 100`，导致测试时间过长
2. **系统命令执行**: 某些测试执行实际的系统命令（npm config, pip等），非常慢
3. **无服务检查**: 测试没有检查依赖服务（数据库、Redis、gRPC）是否可用

## 优化策略

### 1. 减少迭代次数

将 property-based 测试的迭代次数从 100 降低到 20-30：

```typescript
// 之前
{ numRuns: 100 }

// 之后
{ numRuns: 20 }  // 对于简单的纯函数测试
{ numRuns: 10 }  // 对于涉及系统调用的测试
{ numRuns: 5 }   // 对于涉及外部服务的测试
```

### 2. 添加服务可用性检查

在集成测试前添加检查：

```typescript
beforeAll(async () => {
  // 检查数据库连接
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.warn('数据库不可用，跳过集成测试');
    return;
  }
});
```

### 3. 使用 Mock 替代实际系统调用

对于测试镜像切换等功能，应该 mock 系统命令而不是实际执行：

```typescript
jest.mock('child_process', () => ({
  execSync: jest.fn(() => 'https://registry.npmjs.org/')
}));
```

### 4. 分离测试类型

- **单元测试**: 快速，不依赖外部服务
- **集成测试**: 需要外部服务，应该可以跳过
- **E2E测试**: 完整流程，单独运行

## 需要修复的文件

### 后端 (Backend)

1. `backend/scripts/__tests__/mirror-switcher.property.test.ts` - 减少 numRuns，添加 mock
2. `backend/scripts/__tests__/*.property.test.ts` - 检查所有 property 测试
3. `backend/src/routes/__tests__/*.property.test.ts` - 添加服务检查
4. `backend/src/services/__tests__/*.property.test.ts` - 添加服务检查
5. `backend/tests/integration/*.test.ts` - 添加服务检查，允许跳过

### 前端 (Frontend)

1. `frontend/src/utils/__tests__/*.property.test.ts` - 减少 numRuns
2. `frontend/src/views/**/__tests__/*.property.test.ts` - 减少 numRuns
3. `frontend/src/wasm/__tests__/*.test.ts` - 检查 WASM 加载

## 实施步骤

1. ✅ 更新 Jest 配置（已完成）
2. [ ] 批量更新 property-based 测试的 numRuns
3. [ ] 为集成测试添加服务检查
4. [ ] 为系统命令测试添加 mock
5. [ ] 重新运行测试并记录结果
