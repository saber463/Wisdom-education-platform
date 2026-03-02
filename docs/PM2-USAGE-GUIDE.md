# PM2 使用指南

## 目录

1. [PM2简介](#pm2简介)
2. [安装PM2](#安装pm2)
3. [快速开始](#快速开始)
4. [常用命令](#常用命令)
5. [配置文件详解](#配置文件详解)
6. [日志管理](#日志管理)
7. [性能监控](#性能监控)
8. [开机自启](#开机自启)
9. [集群模式](#集群模式)
10. [故障排查](#故障排查)
11. [最佳实践](#最佳实践)

## PM2简介

PM2是一个带有负载均衡功能的Node.js应用进程管理器。主要特性：

- ✅ **进程守护**: 应用崩溃后自动重启
- ✅ **集群模式**: 充分利用多核CPU
- ✅ **负载均衡**: 自动分配请求到不同进程
- ✅ **零停机重启**: 不中断服务更新应用
- ✅ **日志管理**: 统一管理应用日志
- ✅ **性能监控**: 实时监控CPU、内存使用
- ✅ **开机自启**: 系统重启后自动启动应用

## 安装PM2

### 全局安装

```bash
# 使用npm安装
npm install -g pm2

# 使用yarn安装
yarn global add pm2

# 验证安装
pm2 --version
```

### 更新PM2

```bash
# 更新到最新版本
npm install -g pm2@latest

# 更新PM2守护进程
pm2 update
```

## 快速开始

### 1. 编译项目

```bash
cd backend
npm run build
```

### 2. 启动应用

```bash
# 方式1: 使用配置文件启动（推荐）
pm2 start ecosystem.config.json

# 方式2: 直接启动
pm2 start backend/dist/index.js --name smart-edu-backend

# 方式3: 集群模式启动
pm2 start backend/dist/index.js -i 2 --name smart-edu-backend
```

### 3. 查看状态

```bash
pm2 list
```

输出示例：
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┬────────┬──────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                 │ mode    │ ↺       │ status   │ cpu    │ mem  │ user     │ watching │
├─────┼──────────────────────┼─────────┼─────────┼──────────┼────────┼──────┼──────────┼──────────┤
│ 0   │ smart-edu-backend    │ cluster │ 0       │ online   │ 0%     │ 45MB │ user     │ disabled │
│ 1   │ smart-edu-backend    │ cluster │ 0       │ online   │ 0%     │ 43MB │ user     │ disabled │
└─────┴──────────────────────┴─────────┴─────────┴──────────┴────────┴──────┴──────────┴──────────┘
```

## 常用命令

### 进程管理

```bash
# 启动应用
pm2 start ecosystem.config.json
pm2 start app.js --name my-app

# 停止应用
pm2 stop smart-edu-backend
pm2 stop all                    # 停止所有应用

# 重启应用
pm2 restart smart-edu-backend
pm2 restart all                 # 重启所有应用

# 重载应用（0秒停机）
pm2 reload smart-edu-backend
pm2 reload all

# 删除应用
pm2 delete smart-edu-backend
pm2 delete all                  # 删除所有应用

# 查看应用列表
pm2 list
pm2 ls                          # 简写

# 查看应用详情
pm2 show smart-edu-backend
pm2 describe smart-edu-backend  # 别名
```

### 日志管理

```bash
# 查看所有日志
pm2 logs

# 查看指定应用日志
pm2 logs smart-edu-backend

# 查看最近100行日志
pm2 logs smart-edu-backend --lines 100

# 只查看错误日志
pm2 logs smart-edu-backend --err

# 只查看输出日志
pm2 logs smart-edu-backend --out

# 清空日志
pm2 flush

# 重载日志
pm2 reloadLogs
```

### 监控管理

```bash
# 实时监控
pm2 monit

# 查看进程信息
pm2 info smart-edu-backend

# 查看环境变量
pm2 env 0
```

### 进程列表管理

```bash
# 保存当前进程列表
pm2 save

# 恢复保存的进程列表
pm2 resurrect

# 清空保存的进程列表
pm2 cleardump
```

## 配置文件详解

### ecosystem.config.json

```json
{
  "apps": [
    {
      // 基本配置
      "name": "smart-edu-backend",              // 应用名称
      "script": "./backend/dist/index.js",      // 启动脚本
      "cwd": "./",                               // 工作目录
      "args": "",                                // 传递给脚本的参数
      
      // 集群配置
      "instances": 2,                            // 实例数量（数字或"max"）
      "exec_mode": "cluster",                    // 执行模式：cluster或fork
      
      // 内存管理
      "max_memory_restart": "512M",              // 内存超限自动重启
      
      // 重启策略
      "autorestart": true,                       // 崩溃后自动重启
      "max_restarts": 10,                        // 最大重启次数
      "min_uptime": "10s",                       // 最小运行时间
      "restart_delay": 4000,                     // 重启延迟（毫秒）
      "kill_timeout": 5000,                      // 强制终止超时（毫秒）
      "listen_timeout": 10000,                   // 监听超时（毫秒）
      
      // 监控配置
      "watch": false,                            // 文件变化监控
      "ignore_watch": ["node_modules", "logs"],  // 忽略监控的目录
      "watch_options": {
        "followSymlinks": false
      },
      
      // 日志配置
      "error_file": "./backend/logs/pm2-error.log",  // 错误日志
      "out_file": "./backend/logs/pm2-out.log",      // 输出日志
      "log_date_format": "YYYY-MM-DD HH:mm:ss",      // 日志时间格式
      "merge_logs": true,                             // 合并集群日志
      "log_type": "json",                             // 日志格式
      
      // 定时任务
      "cron_restart": "0 3 * * *",               // 定时重启（每天3点）
      
      // 环境变量
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "env_development": {
        "NODE_ENV": "development",
        "PORT": 3000
      },
      
      // 高级配置
      "wait_ready": false,                       // 等待应用就绪信号
      "instance_var": "INSTANCE_ID",             // 实例ID环境变量名
      "increment_var": "PORT",                   // 自增环境变量名
      "source_map_support": true,                // 启用source map支持
      "disable_source_map_support": false,       // 禁用source map
      "interpreter": "node",                     // 解释器
      "interpreter_args": "--max-old-space-size=512",  // 解释器参数
      "node_args": "--max-old-space-size=512"    // Node.js参数
    }
  ]
}
```

### 配置项说明

#### instances（实例数量）

```json
"instances": 1          // 单实例
"instances": 2          // 2个实例
"instances": "max"      // 使用所有CPU核心
"instances": -1         // CPU核心数 - 1
```

**建议**:
- 开发环境: 1个实例
- 生产环境: CPU核心数 - 1（留一个核心给系统）

#### exec_mode（执行模式）

```json
"exec_mode": "fork"     // 单进程模式
"exec_mode": "cluster"  // 集群模式（推荐）
```

**区别**:
- `fork`: 单进程，适合非HTTP应用
- `cluster`: 多进程，适合HTTP应用，支持负载均衡

#### max_memory_restart（内存限制）

```json
"max_memory_restart": "512M"   // 512MB
"max_memory_restart": "1G"     // 1GB
"max_memory_restart": "2048M"  // 2GB
```

**建议**:
- 小型应用: 256M - 512M
- 中型应用: 512M - 1G
- 大型应用: 1G - 2G

## 日志管理

### 日志文件位置

```bash
# 默认日志目录
~/.pm2/logs/

# 自定义日志目录（在配置文件中指定）
./backend/logs/pm2-error.log
./backend/logs/pm2-out.log
```

### 日志轮转

安装日志轮转模块：

```bash
pm2 install pm2-logrotate
```

配置日志轮转：

```bash
# 单个日志文件最大大小
pm2 set pm2-logrotate:max_size 10M

# 保留日志天数
pm2 set pm2-logrotate:retain 7

# 压缩旧日志
pm2 set pm2-logrotate:compress true

# 日期格式
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

# 轮转间隔（毫秒）
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # 每天午夜

# 查看配置
pm2 conf pm2-logrotate
```

### 日志查看技巧

```bash
# 实时查看日志（类似tail -f）
pm2 logs smart-edu-backend

# 查看最近N行日志
pm2 logs smart-edu-backend --lines 100

# 只看错误日志
pm2 logs smart-edu-backend --err

# 只看输出日志
pm2 logs smart-edu-backend --out

# 查看原始日志文件
tail -f backend/logs/pm2-error.log
tail -f backend/logs/pm2-out.log

# 使用grep过滤日志
pm2 logs smart-edu-backend | grep "ERROR"
pm2 logs smart-edu-backend | grep "数据库"
```

## 性能监控

### 实时监控

```bash
# 启动监控界面
pm2 monit
```

监控界面显示：
- CPU使用率
- 内存使用量
- 实时日志
- 进程状态

### 查看进程信息

```bash
# 查看详细信息
pm2 show smart-edu-backend

# 输出示例
Describing process with id 0 - name smart-edu-backend
┌───────────────────┬──────────────────────────────────────┐
│ status            │ online                               │
│ name              │ smart-edu-backend                    │
│ restarts          │ 0                                    │
│ uptime            │ 5m                                   │
│ script path       │ /path/to/backend/dist/index.js       │
│ script args       │ N/A                                  │
│ error log path    │ /path/to/backend/logs/pm2-error.log  │
│ out log path      │ /path/to/backend/logs/pm2-out.log    │
│ pid path          │ /path/to/.pm2/pids/app-0.pid         │
│ interpreter       │ node                                 │
│ interpreter args  │ N/A                                  │
│ script id         │ 0                                    │
│ exec cwd          │ /path/to/project                     │
│ exec mode         │ cluster_mode                         │
│ node.js version   │ 18.17.0                              │
│ watch & reload    │ ✘                                    │
│ unstable restarts │ 0                                    │
│ created at        │ 2024-01-01T00:00:00.000Z             │
└───────────────────┴──────────────────────────────────────┘
```

### PM2 Plus（高级监控）

PM2 Plus提供Web界面监控：

```bash
# 注册PM2 Plus
pm2 plus

# 链接应用
pm2 link <secret_key> <public_key>

# 取消链接
pm2 unlink
```

功能：
- Web界面监控
- 告警通知
- 性能分析
- 错误追踪
- 远程管理

## 开机自启

### Linux/Mac

```bash
# 1. 生成启动脚本
pm2 startup

# 2. 按照提示执行命令（需要sudo权限）
# 示例输出：
# [PM2] You have to run this command as root. Execute the following command:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_user --hp /home/your_user

# 3. 执行提示的命令
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_user --hp /home/your_user

# 4. 保存当前进程列表
pm2 save

# 5. 测试开机自启
sudo reboot
```

### Windows

```bash
# 1. 安装pm2-windows-startup
npm install -g pm2-windows-startup

# 2. 配置开机自启
pm2-startup install

# 3. 保存进程列表
pm2 save
```

### 取消开机自启

```bash
# Linux/Mac
pm2 unstartup

# Windows
pm2-startup uninstall
```

## 集群模式

### 什么是集群模式？

集群模式使用Node.js的 `cluster` 模块，创建多个工作进程共享同一个端口。

**优势**:
- 充分利用多核CPU
- 提高并发处理能力
- 单个进程崩溃不影响其他进程
- 支持零停机重启

### 启动集群

```bash
# 方式1: 指定实例数量
pm2 start app.js -i 2

# 方式2: 使用所有CPU核心
pm2 start app.js -i max

# 方式3: CPU核心数 - 1
pm2 start app.js -i -1

# 方式4: 使用配置文件
pm2 start ecosystem.config.json
```

### 集群管理

```bash
# 查看集群状态
pm2 list

# 扩展实例（增加到4个）
pm2 scale smart-edu-backend 4

# 缩减实例（减少到1个）
pm2 scale smart-edu-backend 1

# 重载集群（0秒停机）
pm2 reload smart-edu-backend

# 重启集群
pm2 restart smart-edu-backend
```

### 零停机重启

```bash
# reload命令实现零停机重启
pm2 reload smart-edu-backend

# 工作原理：
# 1. 启动新的工作进程
# 2. 新进程就绪后，停止旧进程
# 3. 重复步骤1-2，直到所有进程更新完成
```

### 负载均衡

PM2自动在工作进程间分配请求，使用轮询（Round-Robin）算法。

```javascript
// 在应用代码中获取进程ID
console.log(`Worker ${process.pid} started`);

// 在应用代码中获取实例ID
console.log(`Instance ID: ${process.env.INSTANCE_ID}`);
```

## 故障排查

### 问题1: 应用启动失败

**症状**: `pm2 start` 后应用状态为 `errored`

**排查步骤**:

```bash
# 1. 查看错误日志
pm2 logs smart-edu-backend --err --lines 50

# 2. 查看详细信息
pm2 show smart-edu-backend

# 3. 手动运行测试
node backend/dist/index.js

# 4. 检查文件路径
ls -la backend/dist/index.js

# 5. 检查Node.js版本
node --version
```

**常见原因**:
- 文件路径错误
- 依赖未安装
- 端口被占用
- 权限不足
- Node.js版本不兼容

### 问题2: 应用频繁重启

**症状**: `pm2 list` 显示重启次数不断增加

**排查步骤**:

```bash
# 1. 查看重启原因
pm2 logs smart-edu-backend --err --lines 100

# 2. 检查内存使用
pm2 monit

# 3. 查看进程详情
pm2 show smart-edu-backend

# 4. 检查系统资源
top
free -h
df -h
```

**常见原因**:
- 内存泄漏（超过max_memory_restart）
- 未捕获的异常
- 数据库连接失败
- 端口冲突
- 文件监控触发重启（watch: true）

**解决方案**:
```bash
# 增加内存限制
pm2 restart smart-edu-backend --max-memory-restart 1G

# 禁用文件监控
pm2 restart smart-edu-backend --watch false

# 增加最小运行时间
# 修改ecosystem.config.json中的min_uptime
```

### 问题3: 日志文件过大

**症状**: 日志文件占用大量磁盘空间

**解决方案**:

```bash
# 1. 清空日志
pm2 flush

# 2. 安装日志轮转
pm2 install pm2-logrotate

# 3. 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# 4. 手动删除旧日志
rm -f backend/logs/*.log.gz
```

### 问题4: PM2命令无响应

**症状**: PM2命令执行缓慢或无响应

**解决方案**:

```bash
# 1. 更新PM2守护进程
pm2 update

# 2. 重启PM2守护进程
pm2 kill
pm2 resurrect

# 3. 清理PM2缓存
rm -rf ~/.pm2

# 4. 重新安装PM2
npm uninstall -g pm2
npm install -g pm2
```

### 问题5: 开机自启失败

**症状**: 系统重启后应用未自动启动

**排查步骤**:

```bash
# 1. 检查启动脚本
systemctl status pm2-your_user

# 2. 查看启动日志
journalctl -u pm2-your_user

# 3. 检查保存的进程列表
cat ~/.pm2/dump.pm2

# 4. 重新配置开机自启
pm2 unstartup
pm2 startup
pm2 save
```

## 最佳实践

### 1. 使用配置文件

**推荐**: 使用 `ecosystem.config.json` 管理配置

```bash
# 好的做法
pm2 start ecosystem.config.json

# 不推荐
pm2 start app.js --name my-app -i 2 --max-memory-restart 512M ...
```

**优势**:
- 配置可版本控制
- 易于团队协作
- 支持多环境配置
- 便于维护和更新

### 2. 合理设置实例数量

```bash
# 查看CPU核心数
nproc

# 推荐配置
"instances": "max"        # 开发环境
"instances": -1           # 生产环境（CPU核心数 - 1）
```

**原则**:
- 不要超过CPU核心数
- 留一个核心给系统
- 根据应用类型调整（CPU密集型 vs IO密集型）

### 3. 配置内存限制

```json
{
  "max_memory_restart": "512M"
}
```

**建议**:
- 根据应用实际内存使用设置
- 留有20-30%的余量
- 定期监控内存使用情况

### 4. 启用日志轮转

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**原因**:
- 防止日志文件过大
- 节省磁盘空间
- 便于日志分析

### 5. 定期重启应用

```json
{
  "cron_restart": "0 3 * * *"  // 每天凌晨3点重启
}
```

**好处**:
- 清理内存
- 释放资源
- 应用更新

### 6. 使用零停机重启

```bash
# 使用reload而非restart
pm2 reload smart-edu-backend

# 而不是
pm2 restart smart-edu-backend
```

**区别**:
- `reload`: 零停机，逐个重启进程
- `restart`: 停机重启，所有进程同时重启

### 7. 监控和告警

```bash
# 使用PM2 Plus
pm2 plus

# 或使用自定义监控脚本
pm2 monit
```

**监控指标**:
- CPU使用率
- 内存使用量
- 重启次数
- 错误日志

### 8. 环境变量管理

```json
{
  "env": {
    "NODE_ENV": "production"
  },
  "env_production": {
    "NODE_ENV": "production",
    "PORT": 3000
  },
  "env_development": {
    "NODE_ENV": "development",
    "PORT": 3000
  }
}
```

**使用**:
```bash
# 生产环境
pm2 start ecosystem.config.json --env production

# 开发环境
pm2 start ecosystem.config.json --env development
```

### 9. 版本控制

```bash
# .gitignore
.pm2/
logs/
*.log
```

**提交到Git**:
- ✅ ecosystem.config.json
- ✅ package.json
- ❌ .pm2/
- ❌ logs/

### 10. 文档和注释

在 `ecosystem.config.json` 中添加注释（使用JSON5格式）：

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'smart-edu-backend',
    script: './backend/dist/index.js',
    // 集群模式，2个实例
    instances: 2,
    exec_mode: 'cluster',
    // 内存超过512MB自动重启
    max_memory_restart: '512M',
    // ... 其他配置
  }]
};
```

## 总结

PM2是Node.js应用生产部署的必备工具，提供了：

✅ **进程管理**: 自动重启、集群模式、负载均衡  
✅ **日志管理**: 统一日志、日志轮转、实时查看  
✅ **性能监控**: CPU、内存监控、实时监控界面  
✅ **开机自启**: 系统重启后自动启动应用  
✅ **零停机部署**: 不中断服务更新应用  

**推荐配置**:
- 使用配置文件管理
- 启用集群模式
- 配置内存限制
- 启用日志轮转
- 配置开机自启
- 定期监控和维护

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护人员**: 开发团队
