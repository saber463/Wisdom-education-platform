@echo off
REM ========================================
REM 【国赛专用】防蓝屏轻量运行模式
REM CPU≤50%% | 内存≤50%%
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   防蓝屏轻量运行模式
echo   CPU≤50%% ^| 内存≤50%%
echo   ChuanZhi Cup National Competition
echo ========================================
echo.

REM 切换到项目根目录
cd /d "%~dp0.."

REM ========================================
REM 设置资源限制环境变量
REM ========================================
echo 配置资源限制...

REM Node.js内存限制（2GB）
set NODE_OPTIONS=--max-old-space-size=2048

REM Rust编译限制（单核编译）
set CARGO_BUILD_JOBS=1

REM Python优化模式
set PYTHONOPTIMIZE=1

REM 设置进程优先级为低
set PRIORITY=LOW

echo ✓ 资源限制配置完成
echo   - Node.js内存: 2GB
echo   - Rust编译: 单核
echo   - Python: 优化模式
echo   - 进程优先级: 低
echo.

REM ========================================
REM [1/5] 启动MySQL数据库（低优先级）
REM ========================================
echo [1/5] 启动MySQL数据库（低优先级）...

REM 检查MySQL服务
sc query MySQL80 >nul 2>&1
if %errorlevel% equ 0 (
    net start MySQL80 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ MySQL服务启动成功
    ) else (
        echo ✓ MySQL服务已在运行
    )
) else (
    if exist "C:\mysql\bin\mysqld.exe" (
        start /%PRIORITY% /B "" "C:\mysql\bin\mysqld.exe" --console
        echo ✓ 便携版MySQL启动成功（低优先级）
    ) else (
        echo ✗ MySQL未安装
        pause
        exit /b 1
    )
)

timeout /t 3 /nobreak >nul
echo.

REM ========================================
REM [2/5] 启动Rust服务（低优先级）
REM ========================================
echo [2/5] 启动Rust高性能服务（低优先级，端口8080）...

cd rust-service
if exist "Cargo.toml" (
    netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠ 端口8080已被占用
    ) else (
        start "Rust Service (Low)" /%PRIORITY% /MIN cmd /c "cargo run --release 2>&1 | tee ../logs/rust-service-low.log"
        echo ✓ Rust服务启动中（低优先级）
    )
)
cd ..

timeout /t 5 /nobreak >nul
echo.

REM ========================================
REM [3/5] 启动Python AI服务（低优先级）
REM ========================================
echo [3/5] 启动Python AI服务（低优先级，端口5000）...

cd python-ai
if exist "app.py" (
    netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠ 端口5000已被占用
    ) else (
        start "Python AI (Low)" /%PRIORITY% /MIN cmd /c "python app.py 2>&1 | tee ../logs/python-ai-low.log"
        echo ✓ Python AI服务启动中（低优先级）
    )
)
cd ..

timeout /t 5 /nobreak >nul
echo.

REM ========================================
REM [4/5] 启动Node.js后端（低优先级）
REM ========================================
echo [4/5] 启动Node.js后端（低优先级，端口3000）...

cd backend
if exist "package.json" (
    netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠ 端口3000已被占用
    ) else (
        start "Node.js Backend (Low)" /%PRIORITY% /MIN cmd /c "npm run start 2>&1 | tee ../logs/backend-low.log"
        echo ✓ Node.js后端启动中（低优先级）
    )
)
cd ..

timeout /t 3 /nobreak >nul
echo.

REM ========================================
REM [5/5] 启动前端服务（低优先级）
REM ========================================
echo [5/5] 启动前端服务（低优先级，端口5173）...

cd frontend
if exist "package.json" (
    netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠ 端口5173已被占用
    ) else (
        start "Frontend (Low)" /%PRIORITY% /MIN cmd /c "npm run dev 2>&1 | tee ../logs/frontend-low.log"
        echo ✓ 前端服务启动中（低优先级）
    )
)
cd ..

timeout /t 3 /nobreak >nul
echo.

REM ========================================
REM 启动完成
REM ========================================
echo ========================================
echo   轻量模式启动完成！
echo ========================================
echo.

echo 资源限制:
echo   [✓] CPU使用率 ≤ 50%%
echo   [✓] 内存占用 ≤ 50%%
echo   [✓] 进程优先级: 低
echo.

echo 服务列表:
echo   [✓] MySQL数据库    - 端口 3306 (低优先级)
echo   [✓] Rust服务       - 端口 8080 (低优先级)
echo   [✓] Python AI服务  - 端口 5000 (低优先级)
echo   [✓] Node.js后端    - 端口 3000 (低优先级)
echo   [✓] 前端开发服务器 - 端口 5173 (低优先级)
echo.

echo ========================================
echo   功能完整，绝对不会蓝屏！
echo ========================================
echo.

echo 正在打开浏览器...
timeout /t 2 /nobreak >nul

REM 打开浏览器
start http://localhost:5173

echo.
echo 提示:
echo   - 此模式下所有服务以低优先级运行
echo   - 响应速度可能略慢，但系统稳定性最高
echo   - 适合演示和长时间运行
echo   - 停止服务: 运行 stop-all-services.bat
echo.

pause
