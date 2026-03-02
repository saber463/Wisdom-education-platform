# Python AI服务脚本使用说明

## 脚本文件

本目录包含以下脚本文件：

1. **start-ai-service.sh** - AI服务启动脚本
2. **stop-ai-service.sh** - AI服务停止脚本
3. **supervisor-ai-service.conf** - Supervisor进程守护配置
4. **ai-service.service** - Systemd服务配置

## Linux/Unix系统使用方法

### 1. 添加执行权限

```bash
chmod +x start-ai-service.sh
chmod +x stop-ai-service.sh
```

### 2. 启动服务

```bash
./start-ai-service.sh
```

### 3. 停止服务

```bash
./stop-ai-service.sh
```

## Windows系统使用方法

### 方法1: 使用Git Bash

如果安装了Git for Windows，可以使用Git Bash运行脚本：

```bash
# 打开Git Bash
# 进入python-ai目录
cd /f/edu-ai-platform-web/python-ai

# 运行启动脚本
bash start-ai-service.sh

# 运行停止脚本
bash stop-ai-service.sh
```

### 方法2: 使用WSL (Windows Subsystem for Linux)

如果安装了WSL，可以在WSL中运行脚本：

```bash
# 打开WSL终端
# 进入项目目录
cd /mnt/f/edu-ai-platform-web/python-ai

# 添加执行权限
chmod +x start-ai-service.sh stop-ai-service.sh

# 运行启动脚本
./start-ai-service.sh

# 运行停止脚本
./stop-ai-service.sh
```

### 方法3: 使用现有的批处理脚本

Windows系统可以继续使用现有的批处理脚本：

```cmd
start-service.bat
```

## 进程守护配置

### Supervisor配置（Linux）

1. 修改配置文件中的路径：
```bash
vim supervisor-ai-service.conf
```

2. 复制配置文件：
```bash
sudo cp supervisor-ai-service.conf /etc/supervisor/conf.d/ai-service.conf
```

3. 重新加载配置：
```bash
sudo supervisorctl reread
sudo supervisorctl update
```

4. 启动服务：
```bash
sudo supervisorctl start ai-service
```

### Systemd配置（Linux）

1. 修改配置文件中的路径：
```bash
vim ai-service.service
```

2. 复制配置文件：
```bash
sudo cp ai-service.service /etc/systemd/system/
```

3. 重新加载配置：
```bash
sudo systemctl daemon-reload
```

4. 启动服务：
```bash
sudo systemctl start ai-service
```

5. 设置开机自启：
```bash
sudo systemctl enable ai-service
```

## 注意事项

1. **路径配置**: 所有配置文件中的路径需要修改为实际部署路径
2. **权限管理**: 确保脚本有执行权限，日志目录有写入权限
3. **端口冲突**: 确保HTTP端口5000和gRPC端口50051未被占用
4. **依赖安装**: 确保已安装所有Python依赖（requirements.txt）

## 故障排查

### 问题1: 脚本无法执行

**Linux/Unix**:
```bash
# 检查权限
ls -l start-ai-service.sh

# 添加执行权限
chmod +x start-ai-service.sh
```

**Windows**:
```bash
# 使用bash显式运行
bash start-ai-service.sh
```

### 问题2: 端口被占用

```bash
# 查看端口占用
lsof -i :5000
netstat -ano | findstr :5000  # Windows

# 释放端口
kill -9 <PID>
```

### 问题3: 依赖缺失

```bash
# 安装依赖
pip3 install -r requirements.txt
```

## 更多信息

详细的实施文档请参考：`docs/task5-implementation-summary.md`
