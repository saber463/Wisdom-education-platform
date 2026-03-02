@echo off
REM 复制WASM模块到前端项目脚本

echo ========================================
echo 复制WASM模块到前端项目
echo ========================================
echo.

REM 检查pkg目录是否存在
if not exist "pkg" (
    echo [错误] pkg目录不存在，请先运行 build-wasm.bat 编译WASM模块
    exit /b 1
)

REM 设置前端WASM目标目录
set FRONTEND_WASM_DIR=..\frontend\src\wasm

REM 创建前端WASM目录（如果不存在）
if not exist "%FRONTEND_WASM_DIR%" (
    echo [创建] 创建前端WASM目录：%FRONTEND_WASM_DIR%
    mkdir "%FRONTEND_WASM_DIR%"
)

REM 复制pkg目录内容到前端
echo [复制] 复制WASM模块到前端项目...
xcopy /E /I /Y "pkg\*" "%FRONTEND_WASM_DIR%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [成功] WASM模块已复制到前端项目！
    echo [位置] %FRONTEND_WASM_DIR%
    echo.
    echo 前端可以通过以下方式导入：
    echo   import init, { compare_answers, calculate_similarity } from '@/wasm/edu_wasm';
) else (
    echo.
    echo [失败] 复制失败，请检查错误信息
    exit /b 1
)

pause
