# 测试报告系统说明

## 概述

本项目已配置完整的自动化测试报告生成系统。当测试在 GitHub Actions 中运行时，无论测试成功或失败，都会自动生成详细的测试报告并上传为 Artifact。

## 功能特性

### 1. 自动报告生成
- **触发时机**: 每次 CI/CD 流水线运行时自动触发
- **报告内容**: 包含测试概览、覆盖率摘要、详细测试输出等
- **报告格式**: Markdown 格式，易于阅读和解析

### 2. 支持的模块
- **后端 (Node.js/TypeScript)**: Jest + Vitest
- **前端 (Vue3)**: Vitest
- **Python AI 服务**: pytest
- **Rust 服务**: Cargo test

### 3. 详细报告内容

#### 后端测试报告
- 报告生成时间
- Node.js 和 npm 版本
- 测试环境配置
- 覆盖率摘要 (JSON 格式)
- 详细覆盖率报告 (HTML 链接)
- 原始覆盖率数据
- 测试输出日志 (最后 100 行)

#### 前端测试报告
- 报告生成时间
- Node.js、npm 和 Vitest 版本
- 测试环境配置
- 覆盖率摘要 (JSON 格式)
- 详细覆盖率报告 (HTML 链接)
- 测试输出日志 (最后 100 行)

#### Python 测试报告
- 报告生成时间
- Python 和 pytest 版本
- 测试环境配置
- 覆盖率报告 (XML 格式)
- 详细覆盖率报告 (HTML 链接)
- 测试输出日志 (最后 100 行)

#### Rust 测试报告
- 报告生成时间
- Rust 和 Cargo 版本
- 测试环境配置
- 完整测试输出 (最后 200 行)
- 构建输出 (最后 100 行)

## 使用方法

### 查看测试报告

1. **在 GitHub Actions 页面**:
   - 进入 Actions 标签页
   - 选择对应的运行记录
   - 在 "Artifacts" 部分下载测试报告
   - 测试报告文件位于 `test-reports/TEST_REPORT.md`

2. **报告结构**:
```
test-reports/
└── TEST_REPORT.md          # 主测试报告
```

### 下载测试报告

在 GitHub Actions 运行页面:
1. 点击 "Artifacts" 标签
2. 下载对应的报告压缩包
3. 解压后查看 `TEST_REPORT.md`

## 报告示例

### 后端测试报告示例

```markdown
# 后端测试报告

## 测试概览

- **报告生成时间**: 2026-03-03 12:00:00 UTC
- **Node.js 版本**: v20.10.0
- **npm 版本**: 10.2.3
- **测试环境**: test

## 测试结果

### 覆盖率摘要

```json
{
  "total": {
    "lines": {
      "total": 100,
      "covered": 85,
      "skipped": 0,
      "pct": 85
    }
  }
}
```

### 详细覆盖率报告

[查看详细覆盖率报告](coverage/lcov-report/index.html)

## 测试输出

```
PASS  src/test/example.test.ts
FAIL  src/test/failed.test.ts
...
```

---

*此报告由 CI/CD 系统自动生成*
```

### Python 测试报告示例

```markdown
# Python AI 服务测试报告

## 测试概览

- **报告生成时间**: 2026-03-03 12:00:00 UTC
- **Python 版本**: Python 3.10.12
- **pytest 版本**: pytest 7.4.0
- **测试环境**: 3.10

## 测试结果

### 覆盖率报告

```xml
<?xml version="1.0" ?>
<coverage version="6.5.0">
  <packages>
    <package name="tests" line-rate="0.85">
```

### 详细覆盖率报告

[查看详细覆盖率报告](htmlcov/index.html)

## 测试输出

```
============================= test session starts ==============================
collected 10 items

tests/test_example.py::test_example PASSED                            [ 10%]
tests/test_api.py::test_api_connection PASSED                         [ 20%]
...
```

---

*此报告由 CI/CD 系统自动生成*
```

## 工作流文件

所有测试报告相关的配置都在以下工作流文件中:

1. **backend-ci.yml** - 后端模块测试
2. **frontend-ci.yml** - 前端模块测试
3. **python-ai-ci.yml** - Python AI 服务测试
4. **rust-service-ci.yml** - Rust 服务测试
5. **ci.yml** - 主 CI 流程
6. **full-test.yml** - 完整测试套件

## 保留策略

- **测试报告**: 90 天
- **测试覆盖率**: 30-90 天 (根据工作流不同)
- **构建产物**: 7-30 天

## 故障排除

### 报告未生成

1. 检查测试是否成功运行
2. 确认覆盖率目录已创建 (`coverage/`)
3. 查看工作流日志中的错误信息

### 报告内容不完整

1. 确认测试命令正确生成覆盖率报告
2. 检查覆盖率报告文件是否存在
3. 查看测试输出日志获取更多信息

## 相关文档

- [CI/CD 工作流说明](README.md)
- [后端测试文档](../../backend/tests/README.md)
- [前端测试文档](../../frontend/TEST_README.md)
