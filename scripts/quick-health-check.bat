@echo off
REM 快速健康检查脚本
echo ========================================
echo   智慧教育平台 - 快速健康检查
echo ========================================
echo.

echo [1/5] 检查MySQL数据库 (端口3306)...
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MySQL数据库正在运行
) else (
    echo ✗ MySQL数据库未运行
)

echo.
echo [2/5] 检查Rust服务 (端口8080)...
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Rust服务正在运行
) else (
    echo ✗ Rust服务未运行
)

echo.
echo [3/5] 检查Python AI服务 (端口5000)...
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Python AI服务正在运行
) else (
    echo ✗ Python AI服务未运行
)

echo.
echo [4/5] 检查Node.js后端 (端口3000)...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js后端正在运行
) else (
    echo ✗ Node.js后端未运行
)

echo.
echo [5/5] 检查前端服务 (端口5173)...
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 前端服务正在运行
) else (
    echo ✗ 前端服务未运行
)

echo.
echo ========================================
echo   健康检查完成
echo ========================================
pause
