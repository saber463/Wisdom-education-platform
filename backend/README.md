## 智慧教育学习平台后端（backend）

本目录是智慧教育学习平台的 **Node.js 后端服务**，提供课程、作业、学情分析、AI 集成等核心 API，同时负责与 MySQL/MongoDB/Redis 以及 Python、Rust 服务协同工作。

---

### 1. 快速开始（仅后端部分）

- **环境要求**
  - Node.js 18+
  - MySQL 8.0+（字符集 UTF8MB4）
  - 可选：Redis 6+、MongoDB 5+

- **安装依赖**

```bash
cd backend
npm install
```

- **数据库初始化（最简方式）**

```bash
# 创建数据库（如未创建）
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS edu_education_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入学习平台集成所需表结构（22 张新表 + 通知/作业表扩展）
mysql -u root -p edu_education_platform < sql/learning-platform-integration-tables.sql
```

- **启动开发环境**

```bash
cd backend
npm run dev
```

更多全栈启动方式、环境变量说明，请参考项目根目录 `README.md`。

---

### 2. 数据库脚本与迁移说明

与后端相关的数据库脚本主要分布在两个位置：

- `backend/sql/learning-platform-integration-tables.sql`
  - 定义学习平台集成的 **22 个新表**，并扩展：
    - `notifications` 通知表：增加 `priority`、`action_url`、`expires_at`、`metadata` 等字段和索引
    - `assignments` 作业表：增加 `learning_path_id` 外键
  - 覆盖课程体系、学习路径、用户兴趣调查、AI 动态学习路径、虚拟学习伙伴、视频答题与错题本等全部 MySQL 表结构
  - 详细迁移与回滚说明见：`backend/sql/README-LEARNING-PLATFORM-MIGRATION.md`

- `docs/sql/schema.sql` & `docs/sql/test-data.sql`
  - `schema.sql`：基础 17 张表（用户、班级、作业、通知等）的建表脚本
  - `test-data.sql`：初始化测试数据（基础用户/作业/题目等）

#### 2.1 一键数据库设置脚本

后端还提供了一套 Windows/Node.js 脚本用于自动完成数据库安装与初始化，文档在：

- `backend/scripts/README.md`

该目录中的脚本支持：

- 自动检测 Navicat
- 自动安装轻量级 MySQL（便携版）
- 自动创建 `edu_education_platform` 数据库（UTF8MB4）
- 自动创建 14 张基础表并导入测试数据

典型用法：

```bash
cd backend/scripts

# Windows 一键设置（推荐）
setup-all.bat

# 或使用 Node.js 脚本
node backend/scripts/setup-all.cjs
```

---

### 3. 测试（Jest + fast-check 属性测试）

后端测试使用 Jest 和 fast-check，数据库相关测试说明集中在：

- `backend/tests/README.md`

核心命令：

```bash
cd backend

# 运行所有单元/集成测试
npm test

# 运行快速测试（CI 默认）
npm run test:fast

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

数据库字符集与表结构会通过属性测试进行校验（例如验证数据库字符集为 UTF8MB4、排序规则为 `utf8mb4_general_ci`，并在随机数据库名上重复验证多次）。

---

### 4. 重要脚本与工具一览

- `src/config/database.ts`
  - MySQL 连接池与重试逻辑
  - `executeQuery` 封装：对 `SELECT` 语句统一返回数组，便于在业务与测试中安全使用 `length` / `forEach`

- `scripts/test-learning-platform-migration.cjs`
  - 用于验证 `learning-platform-integration-tables.sql` 是否正确创建所有表、外键与索引

- `scripts` 目录下的安装/初始化脚本
  - 详见 `backend/scripts/README.md`

---

### 5. 推荐阅读顺序（仅后端相关）

1. `backend/README.md`（本文件）—— 后端整体视图与脚本入口
2. `backend/sql/README-LEARNING-PLATFORM-MIGRATION.md`—— 学习平台集成表结构与迁移说明
3. `backend/scripts/README.md`—— 一键数据库安装与初始化脚本说明
4. `backend/tests/README.md`—— 数据库与后端属性测试说明

