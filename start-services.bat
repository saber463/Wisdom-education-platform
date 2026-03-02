@echo off
chcp 65001 >nul
echo ========================================
echo 智慧教育学习平台 - 服务启动脚本
echo ========================================
echo.

echo [1/4] 检查并清理端口占用...
echo.

REM 检查并停止占用3000端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo 停止占用端口3000的进程 %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM 检查并停止占用5173端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo 停止占用端口5173的进程 %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM 检查并停止占用50051端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":50051" ^| findstr "LISTENING"') do (
    echo 停止占用端口50051的进程 %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [2/4] 启动后端服务 (端口 3000)...
cd backend
start "后端服务" cmd /k "npm run dev"
cd ..
timeout /t 3 >nul

echo.
echo [3/4] 启动Python AI服务 (端口 50051)...
cd python-ai
start "Python AI服务" cmd /k "python grpc_server.py"
cd ..
timeout /t 3 >nul

echo.
echo [4/4] 启动前端开发服务器 (端口 5173)...
cd frontend
start "前端服务" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo ✓ 所有服务启动完成！
echo ========================================
echo.
echo 服务地址：
echo - 前端: http://localhost:5173
echo - 后端: http://localhost:3000
echo - AI服务: localhost:50051
echo.
echo 按任意键退出...
pause >nul
