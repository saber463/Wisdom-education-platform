# 数据库测试

## 运行测试

### 前提条件
1. MySQL已安装并运行
2. 已安装测试依赖：
```bash
npm install
```

### 运行所有测试
```bash
npm test
```

### 运行特定测试
```bash
npm test -- database-charset.test.js
```

### 监视模式
```bash
npm run test:watch
```

### 生成覆盖率报告
```bash
npm run test:coverage
```

## 属性测试说明

### Property 47: 数据库字符集配置正确性
- **验证需求**: 11.4
- **测试内容**: 验证数据库字符集为UTF8MB4，排序规则为utf8mb4_general_ci
- **迭代次数**: 100次
- **测试策略**: 
  - 创建随机命名的测试数据库
  - 验证字符集配置
  - 验证配置持久化
  - 验证中文字符支持

## 注意事项

1. 测试会创建和删除临时数据库（test_db_*）
2. 确保MySQL root用户无密码或配置正确的密码
3. 测试串行执行以避免数据库冲突
4. 每次测试后会自动清理临时数据库
