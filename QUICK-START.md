# 智慧教育平台 - 快速启动指南

## 🚀 一键启动所有服务

### 方法1: 使用启动脚本（推荐）

1. **双击运行**: `start-all-services.bat`
2. **等待所有服务启动**（约10秒）
3. **访问前端**: http://localhost:5173

### 方法2: 手动启动

#### 1. 启动MySQL（如果未运行）
```powershell
net start MySQL80
```

#### 2. 启动Redis
```powershell
# 双击运行
start-redis.bat

# 或手动启动
cd "C:\Redis"  # 根据实际路径修改
redis-server.exe --requirepass 000000
```

#### 3. 启动后端服务
```powershell
cd backend
npm run dev
```

#### 4. 启动Python AI服务
```powershell
cd python-ai
python app.py
```

#### 5. 启动前端服务
```powershell
cd frontend
npm run dev
```

## 📋 服务检查清单

启动后，检查以下服务是否正常运行：

### 端口监听检查
```powershell
netstat -ano | findstr "3306 3000 5000 5173 6379 50051"
```

应该看到：
- ✅ 3306 - MySQL
- ✅ 3000 - Node.js后端
- ✅ 5000 - Python AI (HTTP)
- ✅ 5173 - Vue3前端
- ✅ 6379 - Redis
- ✅ 50051 - Python AI (gRPC)

### 健康检查
```powershell
# 后端健康检查
curl http://localhost:3000/health

# AI服务健康检查
curl http://localhost:5000/health

# 前端访问
start http://localhost:5173
```

## ⚙️ Redis配置

### 当前配置
- **地址**: 127.0.0.1:6379
- **密码**: 000000
- **配置文件**: `backend/.env`

### 配置内容
```env
REDIS_URL=redis://:000000@127.0.0.1:6379
```

### 测试Redis连接
```powershell
node test-redis-connection.js
```

应该看到：
```
✅ Redis连接成功
✅ Redis客户端就绪
✅ PING测试: PONG
✅ SET/GET测试: test_value
✅ Redis连接测试成功！
```

## 🔧 故障排除

### Redis连接失败
**症状**: 后端日志显示 "Redis客户端错误: ECONNREFUSED"

**解决方案**:
1. 检查Redis是否启动: `netstat -ano | findstr ":6379"`
2. 如果未启动，运行: `start-redis.bat`
3. 重启后端服务

### 后端连接Redis成功的日志
```
Redis客户端已连接
Redis客户端就绪
Redis客户端初始化成功
```

### 后端使用内存缓存的日志
```
Redis连接失败，已重试3次，将在后台继续尝试
Redis初始化失败，将使用内存缓存模式
✓ 已启用内存缓存降级方案
```

## 📊 服务状态监控

### 查看进程
```powershell
# 查看所有Node.js进程
tasklist | findstr "node.exe"

# 查看Python进程
tasklist | findstr "python.exe"

# 查看MySQL进程
tasklist | findstr "mysqld.exe"

# 查看Redis进程
tasklist | findstr "redis-server.exe"
```

### 停止服务
```powershell
# 停止特定进程
taskkill /PID [进程ID] /F

# 或在各个服务窗口按 Ctrl+C
```

## 🌐 访问地址

### 本地访问
- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:3000
- **Python AI**: http://localhost:5000
- **健康检查**: 
  - 后端: http://localhost:3000/health
  - AI服务: http://localhost:5000/health

### 网络访问
- **前端**: http://[你的IP]:5173
- **后端**: http://[你的IP]:3000
- **AI服务**: http://[你的IP]:5000

## 📝 注意事项

1. **Redis必须先启动**
   - 后端启动前确保Redis已运行
   - 否则会自动降级到内存缓存模式

2. **保持服务窗口打开**
   - 关闭窗口会停止对应服务
   - 建议最小化窗口保持运行

3. **端口冲突**
   - 如果端口被占用，检查是否有其他实例在运行
   - 使用 `netstat -ano | findstr ":[端口]"` 查找占用进程

4. **数据库密码**
   - 当前配置: root/123456
   - 如需修改，更新 `backend/.env` 文件

## 🎯 下一步

1. ✅ 启动所有服务
2. ✅ 验证服务状态
3. ✅ 访问前端界面
4. ✅ 测试核心功能
5. ✅ 查看健康报告: `FINAL-SYSTEM-HEALTH-REPORT.md`

---

**文档生成**: Kiro AI Assistant  
**最后更新**: 2026-01-17 00:32:00
