# 智慧教育学习平台 - 快速启动指南

## 🚀 一键启动脚本

### 正常启动 (推荐)
```batch
scripts\start-all-services.bat
```
- 启动所有服务 (MySQL → Rust → Python → Node → 前端)
- 自动打开浏览器
- 目标时间: ≤ 10秒

### 轻量级模式启动 (防蓝屏)
```batch
scripts\start-lightweight-mode.bat
```
- 资源限制: CPU ≤ 50%, 内存 ≤ 50%
- 低优先级运行
- 适合低配置电脑或竞赛演示

## 🛠️ 维护脚本

### 停止所有服务
```batch
scripts\stop-all-services.bat
```
- 安全关闭所有服务
- 释放端口
- 清理临时文件

### 应急修复
```batch
scripts\emergency-repair.bat
```
- 结束占用端口的进程
- 清理临时文件
- 修复数据库连接
- 重启所有服务

### 数据库备份
```batch
scripts\backup-database.bat
```
- 使用mysqldump导出数据库
- 保存到 `docs/sql/backup/`
- 自动添加时间戳

### 重置演示数据
```batch
scripts\reset-demo-data.bat
```
- 清空数据库
- 重新插入演示数据
- 快速恢复演示状态

### 蓝屏恢复
```batch
scripts\blue-screen-recovery.bat
```
- 检测蓝屏痕迹
- 恢复代码和数据
- 低资源模式重启

## 📊 系统监控

### 资源监控
系统自动监控:
- CPU使用率 (阈值: 70%)
- 内存使用率 (阈值: 60%)
- 检查间隔: 5秒

超过阈值时自动降低服务负载。

### 服务健康检查
系统每5秒检查服务状态:
- MySQL数据库
- Node.js后端
- Python AI服务
- Rust高性能服务

服务崩溃时自动重启 (最多3次)。

### 端口管理
自动检测端口占用并切换:
- MySQL: 3306 → 3307 → 3308
- Node.js: 3000 → 3001 → 3002
- Python: 5000 → 5001 → 5002
- Rust: 8080 → 8081 → 8082

## 🎯 竞赛演示流程

### 准备阶段
1. 运行 `scripts\reset-demo-data.bat` 重置演示数据
2. 运行 `scripts\start-lightweight-mode.bat` 启动系统
3. 等待浏览器自动打开

### 演示阶段
1. 登录教师端 (username: teacher1, password: password123)
2. 发布作业
3. 切换到学生端 (username: student1, password: password123)
4. 提交作业
5. 查看AI批改结果
6. 切换到家长端 (username: parent1, password: password123)
7. 查看学情报告

### 结束阶段
1. 运行 `scripts\stop-all-services.bat` 停止所有服务
2. 运行 `scripts\backup-database.bat` 备份数据库

## 🔧 故障排查

### 问题: 端口被占用
**解决方案**: 运行 `scripts\emergency-repair.bat`

### 问题: 服务启动失败
**解决方案**: 
1. 检查日志文件 `backend/logs/`
2. 运行 `scripts\emergency-repair.bat`
3. 如果仍然失败，运行 `scripts\start-lightweight-mode.bat`

### 问题: 数据库连接失败
**解决方案**:
1. 检查MySQL是否运行
2. 运行 `scripts\emergency-repair.bat`
3. 检查端口是否被占用

### 问题: 系统运行缓慢
**解决方案**:
1. 停止当前服务 `scripts\stop-all-services.bat`
2. 使用轻量级模式启动 `scripts\start-lightweight-mode.bat`

### 问题: 蓝屏后恢复
**解决方案**: 运行 `scripts\blue-screen-recovery.bat`

## 📝 日志文件位置

- **后端日志**: `backend/logs/`
  - `health-monitor.log` - 健康监控日志
  - `resource-monitor.log` - 资源监控日志
  - `blue-screen-recovery.log` - 蓝屏恢复日志
  - `mirror-switcher.log` - 镜像切换日志

- **数据库备份**: `docs/sql/backup/`

## 🎓 测试账号

### 教师账号
- username: teacher1, teacher2, teacher3
- password: password123

### 学生账号
- username: student1 ~ student30
- password: password123

### 家长账号
- username: parent1 ~ parent10
- password: password123

## ⚙️ 系统要求

- **操作系统**: Windows 10/11
- **CPU**: 建议4核以上
- **内存**: 建议8GB以上
- **磁盘空间**: 建议10GB以上

## 📞 技术支持

如遇到问题，请查看:
1. `scripts/BLUE-SCREEN-RECOVERY-README.md` - 蓝屏恢复详细说明
2. `backend/scripts/README.md` - 后端脚本使用说明
3. `CHECKPOINT-25-SUMMARY.md` - 系统验证报告

---

**版本**: 1.0.0  
**更新日期**: 2026-01-15  
**适用于**: 传智杯国赛演示
