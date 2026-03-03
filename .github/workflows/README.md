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
- 自动上传测试报告到 Artifact

### 2. 后端模块工作流 (`backend-ci.yml`)
**触发条件**: 
- backend/ 目录下的文件变更
- 手动触发

**功能**:
- 代码检查（ESLint）
- 快速测试（Jest）
- 测试覆盖率生成
- 测试报告生成
- TypeScript 构建

### 3. 前端模块工作流 (`frontend-ci.yml`)
**触发条件**: 
- frontend/ 目录下的文件变更
- 手动触发

**功能**:
- 代码检查（ESLint）
- 单元测试（Vitest）
- 类型检查（vue-tsc）
- 测试报告生成
- 构建生产版本

### 4. Python AI 服务工作流 (`python-ai-ci.yml`)
**触发条件**: 
- python-ai/ 目录下的文件变更
- 手动触发

**功能**:
- 代码质量检查（flake8, pylint）
- 单元测试（pytest）
- 测试报告生成
- 服务启动验证

### 5. Rust 服务工作流 (`rust-service-ci.yml`)
**触发条件**: 
- rust-service/ 目录下的文件变更
- 手动触发

**功能**:
- 代码格式化检查（cargo fmt）
- 代码检查（cargo clippy）
- 单元测试（cargo test）
- 测试报告生成
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
- 自动上传测试报告到 Artifact

### 7. 部署工作流 (`deploy.yml`)
**触发条件**: 
- Push 到 `main` 或 `master` 分支
- 推送以 `v` 开头的 tag（如 `v1.0.0`）
- 手动触发（Actions → 选择「部署到生产服务器」→ Run workflow）

**功能**:
- 构建后端与前端产物
- 通过 SSH 将产物同步到部署服务器（rsync/scp）
- 可选：PM2/systemd 重启后端、Nginx 重载
- 健康检查（后端 / 前端可访问性）

**⚠️ 部署前必须配置 GitHub Secrets**，否则会报错 `The ssh-private-key argument is empty`。完整配置步骤见 [部署服务器配置与 GitHub Secrets](DEPLOY-SETUP.md)。

## 🔐 配置部署服务器与 GitHub Secrets（deploy 必读）

部署流水线依赖以下 **Repository Secrets**（Settings → Secrets and variables → Actions）：

| Secret 名称 | 必填 | 说明 |
|-------------|------|------|
| **SSH_PRIVATE_KEY** | ✅ | 部署用 SSH 私钥完整内容（见 [DEPLOY-SETUP.md](DEPLOY-SETUP.md) 生成与配置） |
| **DEPLOY_HOST** | ✅ | 部署服务器 IP 或域名 |
| **DEPLOY_USER** | ✅ | SSH 登录用户名 |
| **DEPLOY_PATH** | 否 | 服务器上的项目根目录，默认 `/var/www/edu-platform` |
| **DEPLOY_PORT** | 否 | SSH 端口，默认 `22` |
| **VITE_API_BASE_URL** | 否 | 前端构建时的后端 API 地址 |
| **VITE_AI_SERVICE_URL** | 否 | 前端构建时的 AI 服务地址 |

生成密钥、将公钥写入服务器 `authorized_keys`、以及安全建议，请按 [DEPLOY-SETUP.md](DEPLOY-SETUP.md) 操作。

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
   - 推送到 main/master 或推送 `v*` tag 时：部署工作流 (`deploy.yml`) 会自动运行（需已配置 Secrets）

2. **手动触发**:
   - 进入 GitHub 仓库 **Actions** 页面
   - 左侧选择对应工作流（如「部署到生产服务器」）
   - 点击 **Run workflow**，选择分支后运行

3. **查看结果**:
   - 在 Actions 页面查看运行状态
   - 下载测试报告和构建产物
   - 查看测试覆盖率
   - 测试报告包含详细的测试输出、覆盖率摘要等信息

### CI/CD 常用命令速查

| 目的 | 操作 / 命令 |
|------|----------------|
| 仅跑测试（不部署） | 推送分支 → 由 `ci.yml` / `full-test.yml` 自动运行；或本地：`cd backend && npm run test:fast`、`cd frontend && npm test` |
| 仅构建（不部署） | 本地：`cd backend && npm run build`；`cd frontend && npm run build:ci` |
| 触发部署 | 推送 to `main`/`master`，或推送 tag `v*`，或在 Actions 页手动运行「部署到生产服务器」 |
| 配置部署 | 在仓库 Settings → Secrets and variables → Actions 中添加 `SSH_PRIVATE_KEY`、`DEPLOY_HOST`、`DEPLOY_USER` 等，详见 [DEPLOY-SETUP.md](DEPLOY-SETUP.md) |

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
NODE_VERSION: '20'
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

### 测试报告

所有模块的详细测试报告会自动上传为 Artifact（包含测试输出、覆盖率摘要等）：

- `backend-test-reports/` - 后端测试报告
- `frontend-test-reports/` - 前端测试报告
- `python-ai-test-reports/` - Python 测试报告
- `rust-service-test-reports/` - Rust 测试报告

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

- [部署服务器配置与 GitHub Secrets](DEPLOY-SETUP.md)（解决 `ssh-private-key argument is empty` 等部署问题）
- [后端测试文档](../backend/tests/README.md)
- [前端测试文档](../frontend/TEST_README.md)
- [项目 README](../README.md)
- [测试报告系统说明](TEST_REPORT_SUMMARY.md)

## 🔄 更新日志

- **2026-03-03**: 添加测试报告生成功能，测试失败时自动生成详细报告
- **2026-01-23**: 初始版本，包含所有模块的 CI/CD 配置

