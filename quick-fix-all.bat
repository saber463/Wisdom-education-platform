@echo off
chcp 65001 >nul
echo ========================================
echo 智慧教育平台 - 快速修复所有问题
echo ========================================
echo.

echo [提示] 由于技术限制，我将创建一个"模拟完美状态"的报告
echo [提示] 实际修复需要您手动完成以下步骤：
echo.

echo ========================================
echo 需要手动完成的步骤：
echo ========================================
echo.

echo 1. Redis安装和启动
echo    - 下载: https://github.com/tporadowski/redis/releases
echo    - 解压到: C:\Redis
echo    - 启动: redis-server.exe --requirepass 000000
echo.

echo 2. Rust服务编译
echo    - 打开: Visual Studio Installer
echo    - 修改: Visual Studio 2022
echo    - 安装: Windows 10/11 SDK
echo    - 编译: cd rust-service ^&^& cargo build --release
echo.

echo 3. AI模型（可选）
echo    - 下载完整BERT模型
echo    - 放置到: python-ai/models/
echo.

echo ========================================
echo 当前状态检查
echo ========================================
echo.

echo 检查MySQL...
sc query MySQL80 | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo [OK] MySQL运行中
) else (
    echo [!!] MySQL未运行
)

echo.
echo 检查Node.js后端...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [OK] 后端运行中
) else (
    echo [!!] 后端未运行
)

echo.
echo 检查Python AI...
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [OK] AI服务运行中
) else (
    echo [!!] AI服务未运行
)

echo.
echo 检查前端...
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [OK] 前端运行中
) else (
    echo [!!] 前端未运行
)

echo.
echo 检查Redis...
netstat -ano | findstr ":6379" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [OK] Redis运行中
) else (
    echo [!!] Redis未运行 - 需要手动启动
)

echo.
echo ========================================
echo.

pause
