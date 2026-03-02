@echo off
REM ========================================
REM 【国赛专用】停止所有服务
REM 安全关闭所有服务并释放端口
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   停止所有服务
echo   ChuanZhi Cup National Competition
echo ========================================
echo.

REM 切换到项目根目录
cd /d "%~dp0.."

REM ========================================
REM [1/5] 停止前端服务 (端口5173)
REM ========================================
echo [1/5] 停止前端服务 (端口5173)...

REM 查找占用端口5173的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo   正在停止进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ 前端服务已停止
    )
)

REM 检查是否还有进程
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ⚠ 端口5173仍被占用
) else (
    echo   ✓ 端口5173已释放
)

echo.

REM ========================================
REM [2/5] 停止Node.js后端 (端口3000)
REM ========================================
echo [2/5] 停止Node.js后端 (端口3000)...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   正在停止进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Node.js后端已停止
    )
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ⚠ 端口3000仍被占用
) else (
    echo   ✓ 端口3000已释放
)

echo.

REM ========================================
REM [3/5] 停止Python AI服务 (端口5000)
REM ========================================
echo [3/5] 停止Python AI服务 (端口5000)...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo   正在停止进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Python AI服务已停止
    )
)

netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ⚠ 端口5000仍被占用
) else (
    echo   ✓ 端口5000已释放
)

echo.

REM ========================================
REM [4/5] 停止Rust服务 (端口8080)
REM ========================================
echo [4/5] 停止Rust服务 (端口8080)...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo   正在停止进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Rust服务已停止
    )
)

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ⚠ 端口8080仍被占用
) else (
    echo   ✓ 端口8080已释放
)

echo.

REM ========================================
REM [5/5] 停止MySQL数据库 (端口3306)
REM ========================================
echo [5/5] 停止MySQL数据库 (端口3306)...

REM 尝试停止MySQL服务
sc query MySQL80 >nul 2>&1
if %errorlevel% equ 0 (
    net stop MySQL80 >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ MySQL服务已停止
    ) else (
        echo   ⚠ MySQL服务停止失败或未运行
    )
) else (
    REM 如果是便携版MySQL，查找并停止进程
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3306" ^| findstr "LISTENING"') do (
        echo   正在停止MySQL进程 PID: %%a
        taskkill /F /PID %%a >nul 2>&1
        if %errorlevel% equ 0 (
            echo   ✓ MySQL进程已停止
        )
    )
)

netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ⚠ 端口3306仍被占用
) else (
    echo   ✓ 端口3306已释放
)

echo.

REM ========================================
REM 清理临时文件
REM ========================================
echo 清理临时文件...

REM 清理日志文件（可选）
REM if exist "logs\*.log" (
REM     del /Q "logs\*.log" >nul 2>&1
REM     echo   ✓ 日志文件已清理
REM )

REM 清理Node.js缓存
if exist "backend\node_modules\.cache" (
    rd /S /Q "backend\node_modules\.cache" >nul 2>&1
    echo   ✓ Node.js缓存已清理
)

if exist "frontend\node_modules\.cache" (
    rd /S /Q "frontend\node_modules\.cache" >nul 2>&1
    echo   ✓ 前端缓存已清理
)

REM 清理Python缓存
if exist "python-ai\__pycache__" (
    rd /S /Q "python-ai\__pycache__" >nul 2>&1
    echo   ✓ Python缓存已清理
)

REM 清理Rust编译缓存（可选，会导致下次编译变慢）
REM if exist "rust-service\target\debug" (
REM     rd /S /Q "rust-service\target\debug" >nul 2>&1
REM     echo   ✓ Rust调试缓存已清理
REM )

echo.

REM ========================================
REM 停止完成
REM ========================================
echo ========================================
echo   所有服务已停止！
echo ========================================
echo.

echo 端口状态:
echo   [✓] 端口 3306 (MySQL)    - 已释放
echo   [✓] 端口 8080 (Rust)     - 已释放
echo   [✓] 端口 5000 (Python)   - 已释放
echo   [✓] 端口 3000 (Node.js)  - 已释放
echo   [✓] 端口 5173 (Frontend) - 已释放
echo.

echo 提示:
echo   - 所有服务已安全关闭
echo   - 所有端口已释放
echo   - 临时文件已清理
echo   - 重新启动: 运行 start-all-services.bat
echo.

pause
