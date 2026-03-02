@echo off
echo ========================================
echo Redis 启动脚本
echo ========================================
echo.

REM 检查常见的Redis安装路径
set REDIS_PATH=

if exist "C:\Program Files\Redis\redis-server.exe" (
    set REDIS_PATH=C:\Program Files\Redis
    goto :found
)

if exist "C:\Redis\redis-server.exe" (
    set REDIS_PATH=C:\Redis
    goto :found
)

if exist "D:\Redis\redis-server.exe" (
    set REDIS_PATH=D:\Redis
    goto :found
)

if exist "E:\Redis\redis-server.exe" (
    set REDIS_PATH=E:\Redis
    goto :found
)

echo ❌ 未找到Redis安装目录
echo.
echo 请手动指定Redis安装路径，或从以下地址下载：
echo https://github.com/tporadowski/redis/releases
echo.
pause
exit /b 1

:found
echo ✅ 找到Redis安装目录: %REDIS_PATH%
echo.

REM 检查配置文件
if exist "%REDIS_PATH%\redis.windows.conf" (
    echo ✅ 找到配置文件: redis.windows.conf
    echo.
    echo 正在启动Redis服务器...
    echo 地址: 127.0.0.1:6379
    echo 密码: 000000
    echo.
    cd /d "%REDIS_PATH%"
    start "Redis Server" redis-server.exe redis.windows.conf
    timeout /t 3 /nobreak >nul
    echo.
    echo ✅ Redis服务器已启动
    echo.
    echo 提示: 请保持此窗口打开，关闭窗口将停止Redis服务
    echo.
) else (
    echo ⚠️  未找到配置文件，使用默认配置启动...
    echo.
    cd /d "%REDIS_PATH%"
    start "Redis Server" redis-server.exe --requirepass 000000
    timeout /t 3 /nobreak >nul
    echo.
    echo ✅ Redis服务器已启动（默认配置）
    echo.
)

echo 按任意键测试Redis连接...
pause >nul

REM 测试连接
echo.
echo 正在测试Redis连接...
node test-redis-connection.js

pause
