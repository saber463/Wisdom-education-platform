# Task 6 快速参考指南

## 快速启动

### 1. 开发环境启动

```bash
# 启动开发服务器（自动重载）
cd backend
npm run dev
```

### 2. 生产环境启动

```bash
# 编译TypeScript
cd backend
npm run build

# 使用PM2启动
cd ..
pm2 start ecosystem.config.json

# 查看状态
pm2 list

# 查看日志
pm2 logs smart-edu-backend
```

## 常用命令速查

### PM2基本命令

```bash
# 启动
pm2 start ecosystem.config.json

# 停止
pm2 stop smart-edu-backend

# 重启
pm2 restart smart-edu-backend

# 重载（0秒停机）
pm2 reload smart-edu-backend

# 删除
pm2 delete smart-edu-backend

# 查看列表
pm2 list

# 查看日志
pm2 logs smart-edu-backend

# 实时监控
pm2 monit

# 查看详情
pm2 show smart-edu-backend
```

### 日志管理

```bash
# 查看所有日志
pm2 logs

# 查看最近100行
pm2 logs smart-edu-backend --lines 100

# 只看错误日志
pm2 logs smart-edu-backend --err

# 清空日志
pm2 flush

# 查看日志文件
tail -f backend/logs/pm2-error.log
tail -f backend/logs/pm2-out.log
```

### 进程管理

```bash
# 保存进程列表
pm2 save

# 恢复进程列表
pm2 resurrect

# 配置开机自启
pm2 startup
pm2 save

# 取消开机自启
pm2 unstartup
```

## 端口配置

### 默认端口

- 默认端口: 3000
- 备用端口: 3001, 3002, 3003

### 修改端口

```bash
# 方式1: 修改.env文件
PORT=3000

# 方式2: 修改ecosystem.config.json
"env": {
  "PORT": 3000
}

# 方式3: 启动时指定
PORT=3000 pm2 start ecosystem.config.json
```

## 故障排查速查

### 问题1: 启动失败

```bash
# 查看错误日志
pm2 logs smart-edu-backend --err --lines 50

# 手动运行测试
node backend/dist/index.js

# 检查端口占用
netstat -tuln | grep 3000
lsof -i :3000
```

### 问题2: 频繁重启

```bash
# 查看重启次数
pm2 list

# 查看内存使用
pm2 monit

# 增加内存限制
# 修改ecosystem.config.json中的max_memory_restart
```

### 问题3: 日志过大

```bash
# 清空日志
pm2 flush

# 安装日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 问题4: 端口冲突

```bash
# 查看端口占用
netstat -tuln | grep 3000

# 终止占用进程
kill -9 <pid>

# 或让服务自动切换端口（已实现）
# 服务会自动尝试3001, 3002, 3003
```

## 配置文件位置

```
项目根目录/
├── ecosystem.config.json          # PM2配置文件
├── backend/
│   ├── .env                       # 环境变量
│   ├── src/
│   │   └── index.ts              # 后端入口（已修改）
│   ├── dist/
│   │   └── index.js              # 编译输出
│   └── logs/
│       ├── pm2-error.log         # PM2错误日志
│       └── pm2-out.log           # PM2输出日志
├── test-scripts/
│   └── task6-verification.sh     # 验证脚本
└── docs/
    ├── task6-implementation-summary.md  # 实施总结
    ├── task6-quick-reference.md         # 快速参考（本文档）
    └── PM2-USAGE-GUIDE.md              # PM2使用指南
```

## 验证测试

```bash
# 运行验证脚本
bash test-scripts/task6-verification.sh

# 预期结果
# 总测试数: 28
# 通过: 28
# 失败: 0
```

## 关键代码位置

### 端口检测函数

```typescript
// backend/src/index.ts
async function findAvailablePort(startPort: number, maxAttempts: number = 4): Promise<number>
```

### 优雅关闭函数

```typescript
// backend/src/index.ts
async function gracefulShutdown(signal: string, server?: any)
```

### 全局异常捕获

```typescript
// backend/src/index.ts
process.on('uncaughtException', ...)
process.on('unhandledRejection', ...)
process.on('SIGTERM', ...)
process.on('SIGINT', ...)
```

## 环境变量

```bash
# .env文件
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=edu_education_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

## 性能优化建议

### 1. 实例数量

```json
// 开发环境
"instances": 1

// 生产环境
"instances": 2              // 或 "max" 或 -1
```

### 2. 内存限制

```json
// 小型应用
"max_memory_restart": "256M"

// 中型应用
"max_memory_restart": "512M"

// 大型应用
"max_memory_restart": "1G"
```

### 3. 日志轮转

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 监控指标

### 关键指标

- **CPU使用率**: < 80%
- **内存使用**: < max_memory_restart
- **重启次数**: < 10次/天
- **响应时间**: < 200ms (P95)
- **错误率**: < 1%

### 监控命令

```bash
# 实时监控
pm2 monit

# 查看详情
pm2 show smart-edu-backend

# 查看日志
pm2 logs smart-edu-backend
```

## 部署检查清单

- [ ] TypeScript编译成功
- [ ] 环境变量配置正确
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] PM2配置文件正确
- [ ] 日志目录存在且有写权限
- [ ] 端口未被占用
- [ ] 防火墙规则配置
- [ ] 开机自启配置
- [ ] 监控和告警配置

## 紧急处理

### 服务崩溃

```bash
# 1. 查看错误日志
pm2 logs smart-edu-backend --err --lines 100

# 2. 重启服务
pm2 restart smart-edu-backend

# 3. 如果无法重启，删除后重新启动
pm2 delete smart-edu-backend
pm2 start ecosystem.config.json
```

### 内存泄漏

```bash
# 1. 查看内存使用
pm2 monit

# 2. 重启服务释放内存
pm2 restart smart-edu-backend

# 3. 增加内存限制（临时）
pm2 restart smart-edu-backend --max-memory-restart 1G

# 4. 修改配置文件（永久）
# 编辑ecosystem.config.json
```

### 端口冲突

```bash
# 1. 查看端口占用
netstat -tuln | grep 3000
lsof -i :3000

# 2. 终止占用进程
kill -9 <pid>

# 3. 或修改端口
# 编辑.env或ecosystem.config.json
```

## 联系支持

如遇到问题，请提供以下信息：

1. 错误日志: `pm2 logs smart-edu-backend --err --lines 100`
2. 进程状态: `pm2 list`
3. 进程详情: `pm2 show smart-edu-backend`
4. 系统信息: `uname -a`, `node --version`, `pm2 --version`

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护人员**: 开发团队
