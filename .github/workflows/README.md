# CI/CD 工作流说明

本项目包含完整的CI/CD配置，支持所有模块的自动化测试和构建。

## 📋 工作流概览

### 1. 主工作流 (`ci.yml`)
**触发条件**: 
- Push 到 main/develop/master 分支
- Pull Request 到 main/develop/master 分支
- 手动触发

**功能**:
- 并行运行所有模块的测试
- 后端测试（Node.js + MySQL + Redis）
- 前端测试（Vue3 + Vitest）
- Python AI 服务测试
- Rust 服务测试（可选）
- 生成测试总结报告

### 2. 后端模块工作流 (`backend-ci.yml`)
**触发条件**: 
- backend/ 目录下的文件变更
- 手动触发

**功能**:
- 代码检查（ESLint）
- 快速测试（Jest）
- 测试覆盖率生成
- TypeScript 构建

### 3. 前端模块工作流 (`frontend-ci.yml`)
**触发条件**: 
- frontend/ 目录下的文件变更
- 手动触发

**功能**:
- 代码检查（ESLint）
- 单元测试（Vitest）
- 类型检查（vue-tsc）
- 构建生产版本

### 4. Python AI 服务工作流 (`python-ai-ci.yml`)
**触发条件**: 
- python-ai/ 目录下的文件变更
- 手动触发

**功能**:
- 代码质量检查（flake8, pylint）
- 单元测试（pytest）
- 服务启动验证

### 5. Rust 服务工作流 (`rust-service-ci.yml`)
**触发条件**: 
- rust-service/ 目录下的文件变更
- 手动触发

**功能**:
- 代码格式化检查（cargo fmt）
- 代码检查（cargo clippy）
- 单元测试（cargo test）
- Release 构建

### 6. 完整测试套件 (`full-test.yml`)
**触发条件**: 
- **自动**：Push / Pull Request 到 main、develop、master 分支
- 手动触发（可选择运行哪些模块）
- 定时任务（每天凌晨 2:00 UTC）

**功能**:
- 运行所有模块的完整测试套件
- 生成详细的覆盖率报告
- 测试总结报告

## 🚀 使用方法

### 本地测试

在提交代码前，建议先在本地运行测试：

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test

# Python 测试
cd python-ai
pytest tests/ -v

# Rust 测试
cd rust-service
cargo test --release
```

### GitHub Actions 使用

1. **自动触发**: 
   - 推送到 main/develop/master 分支时：主 CI (`ci.yml`) 与完整测试套件 (`full-test.yml`) 会自动运行
   - 创建 Pull Request 到上述分支时同样自动运行
   - 仅修改某目录时，对应模块 CI（如 `backend-ci.yml`）会按路径自动触发

2. **手动触发**:
   - 进入 GitHub Actions 页面
   - 选择对应的工作流
   - 点击 "Run workflow"

3. **查看结果**:
   - 在 Actions 页面查看运行状态
   - 下载测试报告和构建产物
   - 查看测试覆盖率

## 📊 测试环境

### 后端测试环境
- **Node.js**: 18.x
- **MySQL**: 8.0 (测试数据库)
- **Redis**: 6.x (缓存服务)
- **测试数据库**: `edu_education_platform_test`

### 前端测试环境
- **Node.js**: 18.x
- **测试框架**: Vitest
- **环境模拟**: jsdom

### Python 测试环境
- **Python**: 3.10
- **测试框架**: pytest
- **代码检查**: flake8, pylint

### Rust 测试环境
- **Rust**: 1.70+
- **测试框架**: Cargo 内置测试
- **代码检查**: clippy

## 🔧 配置说明

### 环境变量

工作流中使用的环境变量：

```yaml
NODE_VERSION: '18'
PYTHON_VERSION: '3.10'
RUST_VERSION: '1.70'
```

### 服务配置

后端测试需要 MySQL 和 Redis 服务，工作流会自动启动：

```yaml
services:
  mysql:
    image: mysql:8.0
    env:
      MYSQL_ROOT_PASSWORD: test_password
      MYSQL_DATABASE: edu_education_platform_test
  
  redis:
    image: redis:6-alpine
```

后端 job 会先安装 MySQL 客户端，将 `backend/sql/learning-platform-integration-tables.sql` 中的库名替换为 `edu_education_platform_test` 后导入，保证测试有完整表结构。前端在 CI 中使用 `npm run build:ci`（仅 `vite build`），避免类型检查阻塞流水线；本地仍可使用 `npm run build`（含 `vue-tsc`）。

## 📝 测试报告

### 覆盖率报告

所有模块的测试覆盖率报告会自动上传为 Artifact：

- `backend-coverage/` - 后端测试覆盖率
- `frontend-coverage/` - 前端测试覆盖率
- `python-ai-coverage/` - Python 测试覆盖率

### 构建产物

构建成功的产物也会上传为 Artifact：

- `backend-dist/` - 后端构建产物
- `frontend-dist/` - 前端构建产物
- `rust-service-binary/` - Rust 服务二进制文件

## ⚠️ 注意事项

1. **Rust 服务是可选的**: 
   - Rust 服务测试失败不会导致整个 CI 失败
   - 使用 `continue-on-error: true` 配置

2. **测试数据库**:
   - 使用独立的测试数据库，不会影响生产数据
   - 测试完成后自动清理

3. **缓存优化**:
   - Node.js 依赖使用 npm cache
   - Python 依赖使用 pip cache
   - Rust 依赖使用 Cargo cache

4. **并行执行**:
   - 主工作流中所有模块并行测试
   - 提高 CI 执行效率

## 🐛 故障排除

### 测试失败

1. **检查日志**: 在 GitHub Actions 页面查看详细日志
2. **本地复现**: 在本地运行相同的测试命令
3. **检查环境**: 确认测试环境配置正确

### 构建失败

1. **检查依赖**: 确认所有依赖都已正确安装
2. **检查配置**: 确认环境变量和配置文件正确
3. **查看错误**: 查看构建日志中的具体错误信息

### 服务启动失败

1. **检查服务配置**: 确认 MySQL/Redis 服务配置正确
2. **检查端口**: 确认端口没有被占用
3. **检查健康检查**: 确认服务健康检查通过

## 📚 相关文档

- [后端测试文档](../backend/tests/README.md)
- [前端测试文档](../frontend/TEST_README.md)
- [项目 README](../README.md)

## 🔄 更新日志

- **2026-01-23**: 初始版本，包含所有模块的 CI/CD 配置

