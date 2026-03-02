@echo off
REM 修复编译错误脚本
echo ========================================
echo   修复Node.js后端编译错误
echo ========================================
echo.

cd backend

echo [1/3] 安装缺失依赖...
call npm install node-cron
echo.

echo [2/3] 清理dist目录...
if exist "dist" (
    rmdir /s /q dist
    echo ✓ dist目录已清理
)
echo.

echo [3/3] 重新编译...
call npm run build
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo   ✓ 编译成功！
    echo ========================================
) else (
    echo ========================================
    echo   ✗ 编译失败，请检查错误信息
    echo ========================================
)

cd ..
pause
