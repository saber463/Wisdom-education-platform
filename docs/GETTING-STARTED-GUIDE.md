# 新手入门指南

## 🎯 本指南适合谁？

- ✅ 第一次接触本项目的开发者
- ✅ 想要快速体验项目功能的用户
- ✅ 需要部署项目的运维人员
- ✅ 想要了解项目架构的技术人员

## 📋 前置准备

在开始之前，请确保您已经：

1. ✅ **安装了必要的软件**（见下方清单）
2. ✅ **有基本的命令行操作经验**
3. ✅ **有30-60分钟的连续时间**（首次安装）

### 软件安装清单

| 软件 | 版本要求 | 如何检查 | 下载地址 |
|------|---------|---------|---------|
| Node.js | 18.0+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| Python | 3.10+ | `python --version` | [python.org](https://www.python.org/) |
| MySQL | 8.0+ | `mysql --version` | [mysql.com](https://www.mysql.com/) |
| Git | 最新 | `git --version` | [git-scm.com](https://git-scm.com/) |

**💡 提示**: 如果您的电脑上已经安装了这些软件，可以跳过安装步骤。

---

## 🚀 快速开始（5分钟上手）

### 步骤1: 获取项目代码 ⏱️ 1分钟

**方式A: 从Git仓库克隆**
```bash
git clone <repository_url>
cd edu-ai-platform-web
```

**方式B: 解压项目压缩包**
1. 解压项目压缩包到任意目录（如 `D:\edu-ai-platform-web`）
2. 打开命令行，进入项目目录：
   ```bash
   cd D:\edu-ai-platform-web
   ```

### 步骤2: 配置数据库 ⏱️ 2分钟

#### 2.1 启动MySQL

**Windows系统**:
```powershell
# 方法1: 使用服务管理器（推荐）
# 按 Win+R，输入 services.msc，找到"MySQL80"，右键"启动"

# 方法2: 使用命令行
net start MySQL80
```

**验证MySQL是否启动**:
```bash
mysql -u root -p
# 输入密码后，如果看到 mysql> 提示符，说明启动成功
# 输入 exit 退出
```

#### 2.2 创建数据库

打开MySQL客户端（MySQL Workbench、Navicat或命令行），执行：

```sql
-- 创建数据库
CREATE DATABASE edu_education_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 验证数据库创建成功
SHOW DATABASES;
-- 应该能看到 edu_education_platform 数据库
```

#### 2.3 导入表结构

```bash
# 进入backend目录
cd backend

# 执行SQL脚本（Windows PowerShell）
mysql -u root -p edu_education_platform < sql\learning-platform-integration-tables.sql

# 或使用MySQL客户端导入
# 打开MySQL Workbench，连接到数据库，执行 sql/learning-platform-integration-tables.sql 文件
```

**验证表是否创建成功**:
```sql
USE edu_education_platform;
SHOW TABLES;
-- 应该能看到很多表，如 users, courses, learning_paths 等
```

### 步骤3: 配置环境变量 ⏱️ 1分钟

#### 3.1 后端配置

在 `backend` 目录下创建 `.env` 文件：

**Windows PowerShell**:
```powershell
cd backend
New-Item -Path .env -ItemType File
notepad .env
```

**复制以下内容到 `.env` 文件**:
```env
# 数据库配置（根据您的实际情况修改）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=edu_education_platform

# JWT密钥（请修改为随机字符串，至少32位）
JWT_SECRET=edu-platform-secret-key-2024-change-this-in-production

# 服务端口
PORT=3000

# MongoDB配置（如果已安装MongoDB）
MONGODB_URI=mongodb://localhost:27017/edu_education_platform

# Redis配置（可选，如未安装可删除此行）
# REDIS_URL=redis://localhost:6379

# AI服务地址（如果使用Python AI服务）
AI_SERVICE_ADDRESS=localhost:50051
```

**⚠️ 重要**: 请将 `your_mysql_password` 替换为您的MySQL root密码！

#### 3.2 前端配置（可选）

如果需要自定义API地址，在 `frontend` 目录下创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 步骤4: 安装依赖 ⏱️ 5-10分钟

#### 4.1 安装后端依赖

```bash
# 进入backend目录
cd backend

# 安装依赖（可能需要3-5分钟）
npm install

# 如果安装失败，尝试使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

**验证安装成功**: 看到 `added XXX packages` 且没有错误。

#### 4.2 安装前端依赖

```bash
# 进入frontend目录
cd frontend

# 安装依赖（可能需要3-5分钟）
npm install

# 如果安装失败，尝试使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

**验证安装成功**: 看到 `added XXX packages` 且没有错误。

### 步骤5: 启动服务 ⏱️ 1分钟

#### 方式A: 一键启动（Windows，推荐）

双击运行项目根目录下的 `start-all-services.bat` 文件。

脚本会自动：
1. ✅ 检查MySQL服务
2. ✅ 启动后端服务（端口3000）
3. ✅ 启动前端服务（端口5173）

**等待看到以下信息**:
```
后端服务启动成功: http://localhost:3000
前端服务启动成功: http://localhost:5173
```

#### 方式B: 手动启动

**终端1 - 启动后端**:
```bash
cd backend
npm run dev
```

**等待看到**:
```
数据库连接成功
智慧教育学习平台后端服务运行在端口 3000
```

**终端2 - 启动前端**:
```bash
cd frontend
npm run dev
```

**等待看到**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 步骤6: 访问应用 ⏱️ 30秒

1. **打开浏览器**，访问：http://localhost:5173
2. **应该看到登录页面**

**🎉 恭喜！项目启动成功！**

---

## ✅ 验证安装

### 检查服务状态

#### 1. 检查后端服务

打开浏览器访问：http://localhost:3000/health

**应该看到**:
```json
{
  "status": "ok",
  "message": "智慧教育学习平台后端服务运行中",
  "timestamp": "2024-...",
  "services": {
    "backend": "ok"
  }
}
```

#### 2. 检查前端服务

打开浏览器访问：http://localhost:5173

**应该看到**: 登录页面

#### 3. 检查端口占用

**Windows**:
```powershell
netstat -ano | findstr "3000 5173"
```

**应该看到**:
```
TCP    0.0.0.0:3000     LISTENING
TCP    0.0.0.0:5173     LISTENING
```

---

## 🎓 创建测试账号

### 方式1: 使用SQL脚本创建

在MySQL客户端执行：

```sql
USE edu_education_platform;

-- 创建测试学生账号
INSERT INTO users (username, password_hash, real_name, role, status, email) 
VALUES ('student', '$2b$10$YourHashedPassword', '测试学生', 'student', 'active', 'student@test.com');

-- 创建测试教师账号
INSERT INTO users (username, password_hash, real_name, role, status, email) 
VALUES ('teacher', '$2b$10$YourHashedPassword', '测试教师', 'teacher', 'active', 'teacher@test.com');

-- 创建测试家长账号
INSERT INTO users (username, password_hash, real_name, role, status, email) 
VALUES ('parent', '$2b$10$YourHashedPassword', '测试家长', 'parent', 'active', 'parent@test.com');
```

**⚠️ 注意**: 上面的密码哈希是示例，实际使用时需要使用bcrypt加密后的密码。

### 方式2: 使用注册功能

1. 访问 http://localhost:5173
2. 点击"注册"
3. 填写信息并选择角色
4. 完成注册

---

## 🎯 快速体验功能

### 学生端体验流程

1. **登录** → 使用学生账号登录
2. **完成问卷** → 首次登录会弹出兴趣调查问卷
3. **浏览课程** → 在课程首页浏览课程
4. **购买课程** → 选择课程并完成购买（测试环境可以跳过支付）
5. **开始学习** → 在"我的课程"页面点击"继续学习"
6. **观看视频** → 视频播放器会自动记录进度
7. **生成伙伴** → 在学习路径页面生成虚拟学习伙伴
8. **查看错题本** → 在错题本页面查看错题

### 教师端体验流程

1. **登录** → 使用教师账号登录
2. **创建课程** → 在课程管理页面创建课程
3. **发布作业** → 创建作业并发布到班级
4. **查看学情** → 在学情分析页面查看数据

### 家长端体验流程

1. **登录** → 使用家长账号登录
2. **绑定孩子** → 输入孩子的账号信息
3. **查看学情** → 查看学习路径、视频进度、错题本

---

## 🐛 常见问题解决

### 问题1: npm install 很慢或失败

**解决方案**:
```bash
# 使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或设置全局镜像
npm config set registry https://registry.npmmirror.com
```

### 问题2: 数据库连接失败

**检查清单**:
- [ ] MySQL服务是否启动？
- [ ] 数据库用户名密码是否正确？
- [ ] 数据库是否已创建？
- [ ] `.env` 文件配置是否正确？

**解决方案**:
```bash
# 检查MySQL服务
net start MySQL80  # Windows

# 测试数据库连接
mysql -u root -p
# 输入密码，如果成功进入mysql>，说明连接正常
```

### 问题3: 端口被占用

**解决方案**:
```bash
# 查找占用端口的进程
netstat -ano | findstr ":3000"

# 结束进程（替换PID）
taskkill /F /PID <进程ID>
```

### 问题4: 前端页面空白

**检查清单**:
- [ ] 后端服务是否启动？
- [ ] 浏览器控制台是否有错误？
- [ ] 网络请求是否成功？

**解决方案**:
1. 打开浏览器开发者工具（F12）
2. 查看Console标签页的错误信息
3. 查看Network标签页的请求状态

### 问题5: 找不到模块错误

**解决方案**:
```bash
# 删除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

---

## 📚 下一步学习

### 了解项目结构

- 📖 阅读 [README.md](README.md) 了解项目概述
- 🏗️ 阅读 [架构设计文档](.kiro/specs/learning-platform-integration/design.md) 了解系统架构
- 📋 阅读 [需求文档](.kiro/specs/learning-platform-integration/requirements.md) 了解功能需求

### 学习API使用

- 📡 阅读 [API接口文档](docs/API-DOCUMENTATION.md) 了解API使用方法
- 🔐 了解JWT认证机制

### 深入学习

- 🚀 阅读 [部署指南](docs/DEPLOYMENT-GUIDE.md) 学习生产环境部署
- ⚡ 阅读 [性能优化报告](docs/PERFORMANCE-OPTIMIZATION-REPORT.md) 了解性能优化技巧
- 👥 阅读 [用户使用手册](docs/USER-MANUAL.md) 了解功能使用

---

## 💡 开发建议

### 开发环境设置

1. **使用VS Code**（推荐）
   - 安装扩展：Volar、ESLint、Prettier
   - 配置自动保存和格式化

2. **使用Git**（推荐）
   - 创建功能分支进行开发
   - 定期提交代码

3. **使用Postman**（可选）
   - 测试API接口
   - 导入API文档

### 代码规范

- ✅ 使用TypeScript类型注解
- ✅ 遵循ESLint规则
- ✅ 使用有意义的变量名
- ✅ 添加必要的注释

### 调试技巧

1. **前端调试**
   - 使用浏览器开发者工具
   - 使用Vue DevTools扩展
   - 查看Network标签页

2. **后端调试**
   - 使用console.log输出日志
   - 使用VS Code调试器
   - 查看终端输出

---

## 🎉 恭喜！

您已经成功启动了智慧教育学习平台！

**现在您可以**:
- ✅ 体验所有功能
- ✅ 查看源代码
- ✅ 进行二次开发
- ✅ 部署到生产环境

**需要帮助？**
- 📖 查看项目文档
- 🐛 查看故障排除章节
- 💬 查看常见问题

**祝您使用愉快！** 🚀

