# 数据库设置脚本

## 概述

本目录包含智慧教育学习平台的数据库自动设置脚本，支持：
- Navicat检测
- MySQL自动安装（轻量级便携版）
- 数据库自动创建（UTF8MB4字符集）
- 表结构自动创建（14张核心表）
- 测试数据自动初始化（43个用户 + 20份作业 + 100道题目）

## 快速开始

### 方式1: 一键设置（推荐）

**Windows批处理脚本：**
```bash
cd backend/scripts
setup-all.bat
```

**Node.js脚本：**
```bash
node backend/scripts/setup-all.cjs
```

这将自动完成所有设置步骤。

### 方式2: 分步执行

#### 步骤1: 检测Navicat
```bash
# Windows
cd backend/scripts
detect-navicat.bat

# Node.js
node backend/scripts/setup-database.cjs
```

#### 步骤2: 安装MySQL（如果未安装）
```bash
# Windows
cd backend/scripts
install-mysql-portable.bat

# Node.js
node backend/scripts/install-mysql.cjs
```

#### 步骤3: 创建数据库
```bash
# Windows
cd backend/scripts
create-database.bat

# Node.js
node backend/scripts/setup-database.cjs
```

#### 步骤4: 创建表结构
```bash
mysql -u root edu_education_platform < ../../docs/sql/schema.sql
```

#### 步骤5: 插入测试数据
```bash
mysql -u root edu_education_platform < ../../docs/sql/test-data.sql
```

## 脚本说明

### Windows批处理脚本

| 脚本 | 功能 | 说明 |
|------|------|------|
| `detect-navicat.bat` | 检测Navicat安装 | 查询Windows注册表 |
| `create-database.bat` | 创建数据库 | 使用MySQL命令行 |
| `install-mysql-portable.bat` | 安装轻量级MySQL | 下载、解压、初始化MySQL 8.0 |
| `setup-all.bat` | 一键完整设置 | 执行所有步骤 |

### Node.js脚本

| 脚本 | 功能 | 说明 |
|------|------|------|
| `setup-database.cjs` | 数据库设置 | Navicat检测 + 数据库创建 |
| `install-mysql.cjs` | MySQL安装 | 自动下载安装MySQL |
| `setup-all.cjs` | 一键完整设置 | 执行所有步骤 |

## 数据库配置

### 默认配置
- **数据库名**: `edu_education_platform`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_general_ci`
- **端口**: `3306` (占用时自动切换到3307/3308)
- **用户**: `root`
- **密码**: 无（或`root`）

### 表结构
创建14张核心表：
1. users - 用户表
2. classes - 班级表
3. class_students - 学生班级关联表
4. parent_students - 家长学生关联表
5. assignments - 作业表
6. questions - 题目表
7. submissions - 作业提交表
8. answers - 答题记录表
9. knowledge_points - 知识点表
10. student_weak_points - 学生薄弱点表
11. exercise_bank - 题库表
12. qa_records - AI问答记录表
13. notifications - 通知表
14. system_logs - 系统日志表

### 测试数据
- **用户**: 3个教师 + 30个学生 + 10个家长
- **班级**: 5个班级
- **作业**: 20份作业
- **题目**: 100道题目（数学、语文、英语、科学）
- **知识点**: 20个知识点

## 故障排查

### MySQL未安装
**问题**: 运行脚本提示"MySQL未安装"

**解决方案**:
1. 运行 `install-mysql-portable.bat` 安装轻量级MySQL
2. 或手动安装MySQL 8.0并添加到PATH

### 端口占用
**问题**: 端口3306被占用

**解决方案**:
脚本会自动检测并切换到备用端口（3307/3308）

### 字符集错误
**问题**: 中文显示乱码

**解决方案**:
1. 确认数据库字符集为UTF8MB4
2. 运行字符集测试: `node backend/tests/run-charset-test.cjs`
3. 重新创建数据库: `create-database.bat`

### 权限错误
**问题**: MySQL拒绝访问

**解决方案**:
1. 确认MySQL root用户无密码
2. 或修改脚本中的密码配置

## 测试验证

### 运行字符集测试
```bash
node backend/tests/run-charset-test.cjs
```

### 验证数据库
```bash
mysql -u root -e "SHOW DATABASES;"
mysql -u root -e "USE edu_education_platform; SHOW TABLES;"
mysql -u root -e "USE edu_education_platform; SELECT COUNT(*) FROM users;"
```

## 环境要求

- **操作系统**: Windows 10/11
- **Node.js**: 18.x 或更高
- **MySQL**: 8.0 或更高（可自动安装）
- **磁盘空间**: 至少500MB（用于MySQL安装）

## 注意事项

1. **首次运行**: 首次运行可能需要下载MySQL（约200MB），请确保网络连接正常
2. **防火墙**: 可能需要允许MySQL通过防火墙
3. **杀毒软件**: 某些杀毒软件可能阻止MySQL安装，请临时禁用
4. **管理员权限**: 某些操作可能需要管理员权限
5. **数据备份**: 重新运行脚本会清空现有数据，请先备份

## 相关文档

- [数据库表结构](../../docs/sql/schema.sql)
- [测试数据](../../docs/sql/test-data.sql)
- [需求文档](../../.kiro/specs/smart-education-platform/requirements.md)
- [设计文档](../../.kiro/specs/smart-education-platform/design.md)
