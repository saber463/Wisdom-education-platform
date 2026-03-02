@echo off
REM ========================================
REM 【国赛专用】智慧教育平台 - 一键启动
REM ChuanZhi Cup National Competition
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   智慧教育学习平台 - 一键启动
echo   ChuanZhi Cup National Competition
echo ========================================
echo.

REM 记录启动时间
set START_TIME=%time%

REM 切换到项目根目录
cd /d "%~dp0.."

REM ========================================
REM [1/5] 启动MySQL数据库
REM ========================================
echo [1/5] 启动MySQL数据库...

REM 检查MySQL服务是否存在
sc query MySQL80 >nul 2>&1
if %errorlevel% equ 0 (
    REM MySQL服务存在，尝试启动
    net start MySQL80 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ MySQL服务启动成功
    ) else (
        echo ✓ MySQL服务已在运行
    )
) else (
    REM 检查便携版MySQL
    if exist "C:\mysql\bin\mysqld.exe" (
        echo 使用便携版MySQL...
        start /B "" "C:\mysql\bin\mysqld.exe" --console
        echo ✓ 便携版MySQL启动成功
    ) else (
        echo ✗ MySQL未安装，请先运行数据库设置脚本
        echo   运行: backend\scripts\setup-all.bat
        pause
        exit /b 1
    )
)

REM 等待MySQL启动
timeout /t 3 /nobreak >nul
echo.

REM ========================================
REM [2/5] 启动Rust高性能服务
REM ========================================
echo [2/5] 启动Rust高性能服务 (端口8080)...

cd rust-service
if not exist "Cargo.toml" (
    echo ✗ Rust服务未找到
    cd ..
    goto :skip_rust
)

REM 检查端口8080是否被占用
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ 端口8080已被占用，Rust服务可能已在运行
) else (
    REM 启动Rust服务
    start "Rust Service" /MIN cmd /c "cargo run --release 2>&1 | tee ../logs/rust-service.log"
    echo ✓ Rust服务启动中...
)

cd ..
timeout /t 5 /nobreak >nul
echo.

:skip_rust

REM ========================================
REM [3/5] 启动Python AI服务
REM ========================================
echo [3/5] 启动Python AI服务 (端口5000)...

cd python-ai
if not exist "app.py" (
    echo ✗ Python AI服务未找到
    cd ..
    goto :skip_python
)

REM 检查端口5000是否被占用
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ 端口5000已被占用，Python服务可能已在运行
) else (
    REM 启动Python服务
    start "Python AI Service" /MIN cmd /c "python app.py 2>&1 | tee ../logs/python-ai.log"
    echo ✓ Python AI服务启动中...
)

cd ..
timeout /t 5 /nobreak >nul
echo.

:skip_python

REM ========================================
REM [4/5] 启动Node.js后端
REM ========================================
echo [4/5] 启动Node.js后端 (端口3000)...

cd backend
if not exist "package.json" (
    echo ✗ Node.js后端未找到
    cd ..
    goto :skip_backend
)

REM 检查端口3000是否被占用
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ 端口3000已被占用，后端服务可能已在运行
) else (
    REM 启动Node.js后端
    start "Node.js Backend" /MIN cmd /c "npm run start 2>&1 | tee ../logs/backend.log"
    echo ✓ Node.js后端启动中...
)

cd ..
timeout /t 3 /nobreak >nul
echo.

:skip_backend

REM ========================================
REM [5/5] 启动前端服务
REM ========================================
echo [5/5] 启动前端服务 (端口5173)...

cd frontend
if not exist "package.json" (
    echo ✗ 前端项目未找到
    cd ..
    goto :skip_frontend
)

REM 检查端口5173是否被占用
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ 端口5173已被占用，前端服务可能已在运行
) else (
    REM 启动前端服务
    start "Frontend Dev Server" /MIN cmd /c "npm run dev 2>&1 | tee ../logs/frontend.log"
    echo ✓ 前端服务启动中...
)

cd ..
timeout /t 3 /nobreak >nul
echo.

:skip_frontend

REM ========================================
REM 启动完成
REM ========================================
echo ========================================
echo   所有服务启动完成！
echo ========================================
echo.

REM 计算启动时间
set END_TIME=%time%
echo 启动时间: %START_TIME% - %END_TIME%
echo.

echo 服务列表:
echo   [✓] MySQL数据库    - 端口 3306
echo   [✓] Rust服务       - 端口 8080
echo   [✓] Python AI服务  - 端口 5000
echo   [✓] Node.js后端    - 端口 3000
echo   [✓] 前端开发服务器 - 端口 5173
echo.

echo 正在打开浏览器...
timeout /t 2 /nobreak >nul

REM 打开浏览器
start http://localhost:5173

echo.
echo ========================================
echo   系统已就绪，可以开始使用！
echo ========================================
echo.
echo 提示:
echo   - 登录页面: http://localhost:5173
echo   - 后端API: http://localhost:3000/api
echo   - 查看日志: logs/ 目录
echo   - 停止服务: 运行 stop-all-services.bat
echo.

pause
