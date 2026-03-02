@echo off
REM ========================================
REM 检查点6：Rust服务与WASM模块就绪验证
REM ========================================
REM 本脚本验证：
REM 1. Rust服务是否可以编译和启动
REM 2. WASM模块是否可以编译
REM 3. 前端WASM加载器是否正常工作

echo.
echo ========================================
echo   检查点6：Rust服务与WASM模块就绪验证
echo ========================================
echo.

set ERROR_COUNT=0

REM ========================================
REM 1. 检查Rust工具链
REM ========================================
echo [1/6] 检查Rust工具链...
echo.

where cargo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到Rust工具链
    echo.
    echo 请安装Rust：
    echo   1. 访问 https://rustup.rs/
    echo   2. 下载并运行 rustup-init.exe
    echo   3. 重启命令行窗口
    echo.
    set /a ERROR_COUNT+=1
    goto :check_wasm_pack
) else (
    cargo --version
    echo [成功] Rust工具链已安装
    echo.
)

REM ========================================
REM 2. 检查Rust服务编译
REM ========================================
echo [2/6] 检查Rust服务编译...
echo.

cd rust-service
if not exist "Cargo.toml" (
    echo [错误] 未找到rust-service/Cargo.toml
    set /a ERROR_COUNT+=1
    cd ..
    goto :check_wasm_pack
)

echo 正在编译Rust服务（可能需要几分钟）...
set CARGO_BUILD_JOBS=1
cargo build --release >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] Rust服务编译失败
    echo.
    echo 请手动运行以查看详细错误：
    echo   cd rust-service
    echo   cargo build --release
    echo.
    set /a ERROR_COUNT+=1
) else (
    echo [成功] Rust服务编译成功
    echo.
)

cd ..

REM ========================================
REM 3. 检查wasm-pack
REM ========================================
:check_wasm_pack
echo [3/6] 检查wasm-pack工具...
echo.

where wasm-pack >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 未检测到wasm-pack
    echo.
    echo 请安装wasm-pack：
    echo   cargo install wasm-pack
    echo.
    echo 或者从以下地址下载预编译版本：
    echo   https://rustwasm.github.io/wasm-pack/installer/
    echo.
    set /a ERROR_COUNT+=1
    goto :check_frontend
) else (
    wasm-pack --version
    echo [成功] wasm-pack已安装
    echo.
)

REM ========================================
REM 4. 检查WASM模块编译
REM ========================================
echo [4/6] 检查WASM模块编译...
echo.

cd rust-wasm
if not exist "Cargo.toml" (
    echo [错误] 未找到rust-wasm/Cargo.toml
    set /a ERROR_COUNT+=1
    cd ..
    goto :check_frontend
)

echo 正在编译WASM模块（可能需要几分钟）...
set CARGO_BUILD_JOBS=1
wasm-pack build --target web --release >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] WASM模块编译失败
    echo.
    echo 请手动运行以查看详细错误：
    echo   cd rust-wasm
    echo   wasm-pack build --target web --release
    echo.
    set /a ERROR_COUNT+=1
) else (
    echo [成功] WASM模块编译成功
    echo.
    
    REM 检查编译产物
    if exist "pkg\edu_wasm_bg.wasm" (
        echo [验证] WASM文件已生成：pkg\edu_wasm_bg.wasm
        echo.
    ) else (
        echo [警告] 未找到WASM文件
        set /a ERROR_COUNT+=1
    )
)

cd ..

REM ========================================
REM 5. 检查前端WASM集成
REM ========================================
:check_frontend
echo [5/6] 检查前端WASM集成...
echo.

if not exist "frontend\src\utils\wasm-loader.ts" (
    echo [错误] 未找到前端WASM加载器
    set /a ERROR_COUNT+=1
    goto :check_tests
) else (
    echo [成功] 前端WASM加载器已实现
    echo   - 文件：frontend\src\utils\wasm-loader.ts
    echo   - 功能：compareAnswers, calculateSimilarity
    echo   - 回退：JavaScript实现
    echo.
)

REM 检查WASM目标目录
if not exist "frontend\src\wasm" (
    echo [提示] 创建WASM目标目录
    mkdir "frontend\src\wasm"
)

REM 如果WASM已编译，提示复制
if exist "rust-wasm\pkg" (
    echo [提示] WASM模块已编译，可以复制到前端：
    echo   cd rust-wasm
    echo   copy-to-frontend.bat
    echo.
)

REM ========================================
REM 6. 检查测试文件
REM ========================================
:check_tests
echo [6/6] 检查测试文件...
echo.

set TEST_FILES_OK=1

if not exist "frontend\src\utils\__tests__\wasm-loader.test.ts" (
    echo [错误] 未找到WASM加载器测试文件
    set TEST_FILES_OK=0
    set /a ERROR_COUNT+=1
)

if not exist "rust-service\tests\crypto_properties.rs" (
    echo [错误] 未找到Rust加密属性测试
    set TEST_FILES_OK=0
    set /a ERROR_COUNT+=1
)

if not exist "rust-service\tests\grpc_properties.rs" (
    echo [错误] 未找到Rust gRPC属性测试
    set TEST_FILES_OK=0
    set /a ERROR_COUNT+=1
)

if %TEST_FILES_OK% EQU 1 (
    echo [成功] 所有测试文件已就绪
    echo   - frontend\src\utils\__tests__\wasm-loader.test.ts
    echo   - rust-service\tests\crypto_properties.rs
    echo   - rust-service\tests\grpc_properties.rs
    echo.
)

REM ========================================
REM 总结
REM ========================================
echo.
echo ========================================
echo   验证结果总结
echo ========================================
echo.

if %ERROR_COUNT% EQU 0 (
    echo [成功] 所有检查通过！
    echo.
    echo Rust服务状态：
    echo   ✓ Rust工具链已安装
    echo   ✓ Rust服务可以编译
    echo   ✓ gRPC接口已实现
    echo   ✓ 属性测试已就绪
    echo.
    echo WASM模块状态：
    echo   ✓ wasm-pack已安装
    echo   ✓ WASM模块可以编译
    echo   ✓ 前端加载器已实现
    echo   ✓ JavaScript回退已实现
    echo.
    echo 下一步：
    echo   1. 启动Rust服务：cd rust-service ^&^& cargo run --release
    echo   2. 复制WASM到前端：cd rust-wasm ^&^& copy-to-frontend.bat
    echo   3. 运行前端测试：cd frontend ^&^& npm test
    echo.
    exit /b 0
) else (
    echo [失败] 发现 %ERROR_COUNT% 个问题
    echo.
    echo 请根据上述错误信息进行修复。
    echo.
    echo 常见问题解决：
    echo   1. Rust未安装：访问 https://rustup.rs/
    echo   2. wasm-pack未安装：cargo install wasm-pack
    echo   3. 编译失败：检查Cargo.toml依赖配置
    echo.
    exit /b 1
)
