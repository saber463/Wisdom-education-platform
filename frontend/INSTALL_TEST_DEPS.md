# 安装测试依赖

## 概述

本文档说明如何安装前端测试所需的依赖包。

## 必需依赖

运行以下命令安装测试依赖：

```bash
cd frontend
npm install --save-dev vitest @vitest/ui jsdom @vue/test-utils happy-dom @vitest/coverage-v8
```

## 依赖说明

| 包名 | 版本 | 用途 |
|------|------|------|
| vitest | ^1.0.0 | 测试框架（Vite原生支持） |
| @vitest/ui | ^1.0.0 | 测试UI界面 |
| jsdom | ^23.0.0 | 浏览器环境模拟 |
| @vue/test-utils | ^2.4.0 | Vue组件测试工具 |
| happy-dom | ^12.0.0 | 轻量级DOM模拟（可选） |
| @vitest/coverage-v8 | ^1.0.0 | 代码覆盖率工具 |

## 验证安装

安装完成后，运行以下命令验证：

```bash
npm run test
```

如果看到测试运行，说明安装成功。

## 可选：全局安装Vitest

```bash
npm install -g vitest
```

这样可以在任何地方运行 `vitest` 命令。

## 故障排查

### 问题1：npm install失败

**解决**：清理缓存后重试
```bash
npm cache clean --force
npm install
```

### 问题2：依赖版本冲突

**解决**：使用 `--legacy-peer-deps` 标志
```bash
npm install --save-dev vitest --legacy-peer-deps
```

### 问题3：网络问题

**解决**：使用国内镜像
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

## 完整的package.json devDependencies

安装完成后，你的 `package.json` 应包含：

```json
{
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "vue-tsc": "^1.8.27",
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "eslint-plugin-vue": "^9.19.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "jsdom": "^23.0.0",
    "@vue/test-utils": "^2.4.0",
    "happy-dom": "^12.0.0"
  }
}
```

## 下一步

安装完成后，参考 `TEST_README.md` 了解如何运行测试。
