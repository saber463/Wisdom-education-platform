# Python 虚拟环境设置指南

## 为什么使用虚拟环境？

Python虚拟环境可以：
- 隔离项目依赖，避免不同项目之间的依赖冲突
- 保持系统Python环境的干净
- 便于项目部署和迁移

## 快速设置

### Windows 系统

1. **运行自动设置脚本**（推荐）：
   ```batch
   cd python-ai
   setup-venv.bat
   ```

2. **手动设置**：
   ```batch
   cd python-ai
   
   # 创建虚拟环境
   python -m venv venv
   
   # 激活虚拟环境
   venv\Scripts\activate
   
   # 升级pip
   python -m pip install --upgrade pip
   
   # 安装依赖
   pip install -r requirements.txt
   ```

### Linux/Mac 系统

```bash
cd python-ai

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级pip
python -m pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt
```

## 使用虚拟环境

### 激活虚拟环境

**Windows:**
```batch
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

激活后，命令行提示符前会显示 `(venv)`，表示虚拟环境已激活。

### 运行服务

激活虚拟环境后，可以正常运行Python服务：

```batch
# 运行Flask应用
python app.py

# 运行gRPC服务
python grpc_server.py
```

### 退出虚拟环境

```batch
deactivate
```

## 在CI/CD中使用

GitHub Actions等CI/CD平台会自动处理虚拟环境，无需手动激活。

## 常见问题

### 1. 虚拟环境创建失败

**问题**: `python -m venv venv` 报错

**解决方案**:
- 确保Python版本 >= 3.9
- 检查是否有足够的磁盘空间
- 尝试使用 `python3` 代替 `python`

### 2. 依赖安装失败

**问题**: `pip install -r requirements.txt` 失败

**解决方案**:
- 使用国内镜像源（推荐）:
  ```batch
  pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
  ```
- 检查网络连接
- 升级pip: `python -m pip install --upgrade pip`

### 3. 虚拟环境未激活

**问题**: 运行Python脚本时提示模块未找到

**解决方案**:
- 确保已激活虚拟环境（命令行前有 `(venv)` 提示）
- 检查是否在正确的目录下

### 4. 虚拟环境占用空间过大

**问题**: `venv` 目录占用大量磁盘空间

**解决方案**:
- 这是正常的，虚拟环境包含所有依赖包
- 如果不需要，可以删除 `venv` 目录后重新创建
- 建议将 `venv` 添加到 `.gitignore`（已添加）

## 最佳实践

1. **始终使用虚拟环境**: 每个Python项目都应该有自己的虚拟环境
2. **不要提交虚拟环境**: `venv` 目录已在 `.gitignore` 中，不要提交到Git
3. **定期更新依赖**: 定期运行 `pip install --upgrade -r requirements.txt` 更新依赖
4. **记录依赖变更**: 修改依赖后，运行 `pip freeze > requirements.txt` 更新依赖列表

## 相关文件

- `requirements.txt` - Python依赖列表
- `setup-venv.bat` - Windows自动设置脚本
- `Check-Environment.ps1` - 环境检查脚本（会检测虚拟环境）


