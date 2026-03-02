@echo off
REM Rust-WASM编译脚本（单核编译，防止CPU过载导致蓝屏）
REM 设置环境变量限制编译并发数

echo ========================================
echo Rust-WASM模块编译脚本
echo ========================================
echo.

REM 设置单核编译，防止CPU过载
set CARGO_BUILD_JOBS=1
echo [配置] 设置CARGO_BUILD_JOBS=1（单核编译）

REM 设置编译优化级别
set RUSTFLAGS=-C opt-level=z -C lto=fat
echo [配置] 设置编译优化：opt-level=z, lto=fat

echo.
echo [开始] 编译Rust-WASM模块...
echo.

REM 检查wasm-pack是否安装
where wasm-pack >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到wasm-pack，请先安装：
    echo        cargo install wasm-pack
    exit /b 1
)

REM 编译WASM模块（target=web，release模式）
wasm-pack build --target web --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [成功] WASM模块编译完成！
    echo [输出] 编译产物位于 pkg/ 目录
    echo.
    echo 下一步：运行 copy-to-frontend.bat 将WASM模块复制到前端项目
) else (
    echo.
    echo [失败] WASM模块编译失败，请检查错误信息
    exit /b 1
)

pause
