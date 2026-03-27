@echo off
chcp 65001 >nul
echo ========================================
echo 智慧教育平台 - 启动所有服务
echo ========================================
echo.

echo [1/5] 检查MySQL服务...
sc query MySQL80 | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo ✅ MySQL服务正在运行
) else (
    echo ⚠️  MySQL服务未运行，尝试启动...
    net start MySQL80
)
echo.

echo [2/5] 启动Redis服务...
echo 提示: 如果Redis未启动，请手动运行 start-redis.bat
timeout /t 2 /nobreak >nul
echo.

echo [3/5] 启动Node.js后端...
start "Node.js Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul
echo ✅ 后端服务已启动 (端口3000)
echo.

echo [4/5] 启动Python AI服务...
if exist "%~dp0python-ai\venv2\Scripts\activate.bat" (
    start "Python AI Service" cmd /k "cd /d %~dp0python-ai && venv2\Scripts\activate.bat && python app.py"
) else if exist "%~dp0python-ai\venv\Scripts\activate.bat" (
    start "Python AI Service" cmd /k "cd /d %~dp0python-ai && venv\Scripts\activate.bat && python app.py"
) else (
    echo [警告] 未找到Python虚拟环境，跳过启动AI服务。
    echo 请先进入python-ai目录运行: python -m venv venv2 ^& venv2\Scripts\pip install -r requirements.txt
)
timeout /t 3 /nobreak >nul
echo ✅ AI服务已启动 (端口5000/50051)
echo.

echo [5/5] 启动Vue3前端...
start "Vue3 Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo ✅ 前端服务已启动 (端口5173)
echo.

echo ========================================
echo 所有服务启动完成！
echo ========================================
echo.
echo 访问地址:
echo - 前端: http://localhost:5173
echo - 后端API: http://localhost:3000
echo - AI服务: http://localhost:5000
echo.
echo 健康检查:
echo - 后端: http://localhost:3000/health
echo - AI服务: http://localhost:5000/health
echo.
echo 提示: 关闭此窗口不会停止服务
echo       要停止服务，请关闭各个服务窗口
echo.
pause
