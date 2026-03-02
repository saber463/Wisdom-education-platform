# Redis 启动指南

## 问题诊断

根据测试结果，Redis服务当前**未运行**：
- ❌ 端口6379未监听
- ❌ Redis进程未运行
- ❌ Redis服务未安装

## 解决方案

### 方案1: 使用启动脚本（推荐）

1. **运行启动脚本**
   ```
   双击运行: start-redis.bat
   ```
   
   脚本会自动：
   - 查找Redis安装目录
   - 使用正确的密码配置启动Redis
   - 测试连接是否成功

2. **保持Redis窗口打开**
   - Redis会在新窗口中运行
   - 关闭窗口会停止Redis服务
   - 建议最小化窗口保持运行

### 方案2: 手动启动Redis

如果您知道Redis安装路径，可以手动启动：

```powershell
# 进入Redis安装目录（根据实际路径修改）
cd "C:\Redis"  # 或 "C:\Program Files\Redis"

# 启动Redis服务器（带密码）
redis-server.exe --requirepass 000000

# 或使用配置文件
redis-server.exe redis.windows.conf
```

### 方案3: 安装Redis为Windows服务

如果希望Redis开机自动启动：

```powershell
# 以管理员身份运行PowerShell
cd "C:\Redis"  # 根据实际路径修改

# 安装为Windows服务
redis-server.exe --service-install redis.windows.conf --service-name Redis

# 启动服务
redis-server.exe --service-start

# 设置开机自动启动
sc.exe config Redis start= auto
```

### 方案4: 如果Redis未安装

如果Redis确实未安装，请按以下步骤安装：

1. **下载Redis for Windows**
   ```
   https://github.com/tporadowski/redis/releases
   下载最新版本: Redis-x64-*.zip
   ```

2. **解压到指定目录**
   ```
   推荐路径: C:\Redis
   ```

3. **配置密码**
   编辑 `redis.windows.conf` 文件，找到并修改：
   ```
   requirepass 000000
   ```

4. **启动Redis**
   ```powershell
   cd C:\Redis
   redis-server.exe redis.windows.conf
   ```

## 验证Redis运行

### 检查端口监听
```powershell
netstat -ano | findstr ":6379"
```
应该看到：
```
TCP    0.0.0.0:6379           0.0.0.0:0              LISTENING       [PID]
```

### 测试连接
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

## 重启后端服务

Redis启动成功后，需要重启后端服务以连接Redis：

```powershell
# 停止当前后端进程（如果正在运行）
# 在后端终端按 Ctrl+C

# 重新启动后端
cd backend
npm run dev
```

后端日志应该显示：
```
Redis客户端已连接
Redis客户端就绪
Redis客户端初始化成功
```

## 配置信息

当前Redis配置（已更新到 `backend/.env`）：
```
REDIS_URL=redis://:000000@127.0.0.1:6379
```

- **地址**: 127.0.0.1
- **端口**: 6379
- **密码**: 000000

## 常见问题

### Q: Redis窗口关闭后服务停止
**A**: 这是正常的。如果需要后台运行，请安装为Windows服务（方案3）

### Q: 端口6379被占用
**A**: 检查是否有其他Redis实例在运行
```powershell
netstat -ano | findstr ":6379"
taskkill /PID [进程ID] /F
```

### Q: 连接被拒绝
**A**: 检查防火墙设置，确保允许6379端口

### Q: 密码错误
**A**: 确认Redis配置文件中的密码设置与.env文件一致

## 下一步

1. ✅ 启动Redis服务
2. ✅ 验证Redis连接
3. ✅ 重启后端服务
4. ✅ 检查后端日志确认Redis连接成功
5. ✅ 测试缓存功能

---

**文档生成**: Kiro AI Assistant  
**最后更新**: 2026-01-17 00:30:00
