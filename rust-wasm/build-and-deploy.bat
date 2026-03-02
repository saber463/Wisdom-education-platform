@echo off
REM 一键编译并部署WASM模块到前端

echo ========================================
echo Rust-WASM 一键编译部署脚本
echo ========================================
echo.

REM 步骤1：编译WASM模块
echo [步骤1/2] 编译WASM模块...
call build-wasm.bat
if %ERRORLEVEL% NEQ 0 (
    echo [失败] WASM编译失败
    exit /b 1
)

echo.
echo ========================================
echo.

REM 步骤2：复制到前端
echo [步骤2/2] 复制WASM模块到前端...
call copy-to-frontend.bat
if %ERRORLEVEL% NEQ 0 (
    echo [失败] 复制到前端失败
    exit /b 1
)

echo.
echo ========================================
echo [完成] WASM模块编译并部署成功！
echo ========================================
echo.

pause
