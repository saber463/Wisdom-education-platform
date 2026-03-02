@echo off
REM CI/CD 完整测试套件 - 模拟 GitHub Actions 流程
REM 执行所有模块的测试、代码检查和构建验证

chcp 65001 >nul
setlocal enabledelayedexpansion

set TEST_REPORT=CI-CD-TEST-REPORT.md
set TIMESTAMP=%date:~0,10% %time:~0,8%
set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

echo # CI/CD 测试报告 > %TEST_REPORT%
echo. >> %TEST_REPORT%
echo **测试时间**: %TIMESTAMP% >> %TEST_REPORT%
echo **测试类型**: 完整 CI/CD 流程模拟 >> %TEST_REPORT%
echo. >> %TEST_REPORT%
echo --- >> %TEST_REPORT%
echo. >> %TEST_REPORT%

echo.
echo ========================================
echo 🚀 CI/CD 完整测试套件
echo ========================================
echo 模拟 GitHub Actions 工作流
echo 测试时间: %TIMESTAMP%
echo ========================================
echo.

REM ========== 后端模块测试 ==========
echo.
echo [1/6] 🔵 后端模块 (Node.js/TypeScript)
echo ========================================
echo ## 1. 后端模块测试 >> %TEST_REPORT%
echo. >> %TEST_REPORT%

cd backend

REM 1.1 代码检查
echo [1.1] 运行 ESLint 代码检查...
echo ### 1.1 代码检查 (ESLint) >> %TEST_REPORT%
call npm run lint > ..\backend-lint.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ ESLint 检查通过 >> %TEST_REPORT%
    echo ✅ ESLint 检查通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  ESLint 检查有警告 >> %TEST_REPORT%
    echo ⚠️  ESLint 检查有警告（查看 backend-lint.log）
    type ..\backend-lint.log | findstr /C:"error" >nul
    if %errorlevel% equ 0 (
        echo ❌ ESLint 检查失败 >> %TEST_REPORT%
        set /a FAILED_TESTS+=1
    ) else (
        set /a PASSED_TESTS+=1
    )
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 1.2 快速测试
echo [1.2] 运行快速测试 (Jest)...
echo ### 1.2 快速测试 (Jest) >> %TEST_REPORT%
set NODE_ENV=test
call npm run test:fast > ..\backend-test.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 快速测试通过 >> %TEST_REPORT%
    echo ✅ 快速测试通过
    set /a PASSED_TESTS+=1
) else (
    echo ❌ 快速测试失败 >> %TEST_REPORT%
    echo ❌ 快速测试失败（查看 backend-test.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 1.3 构建验证
echo [1.3] 验证 TypeScript 构建...
echo ### 1.3 构建验证 >> %TEST_REPORT%
call npm run build > ..\backend-build.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 构建成功 >> %TEST_REPORT%
    echo ✅ 构建成功
    set /a PASSED_TESTS+=1
) else (
    echo ❌ 构建失败 >> %TEST_REPORT%
    echo ❌ 构建失败（查看 backend-build.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

cd ..
echo ✅ 后端模块测试完成
echo. >> %TEST_REPORT%

REM ========== 前端模块测试 ==========
echo.
echo [2/6] 🟢 前端模块 (Vue3/TypeScript)
echo ========================================
echo ## 2. 前端模块测试 >> %TEST_REPORT%
echo. >> %TEST_REPORT%

cd frontend

REM 2.1 代码检查
echo [2.1] 运行 ESLint 代码检查...
echo ### 2.1 代码检查 (ESLint) >> %TEST_REPORT%
call npm run lint > ..\frontend-lint.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ ESLint 检查通过 >> %TEST_REPORT%
    echo ✅ ESLint 检查通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  ESLint 检查有警告 >> %TEST_REPORT%
    echo ⚠️  ESLint 检查有警告（查看 frontend-lint.log）
    type ..\frontend-lint.log | findstr /C:"error" >nul
    if %errorlevel% equ 0 (
        echo ❌ ESLint 检查失败 >> %TEST_REPORT%
        set /a FAILED_TESTS+=1
    ) else (
        set /a PASSED_TESTS+=1
    )
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 2.2 测试
echo [2.2] 运行前端测试 (Vitest)...
echo ### 2.2 前端测试 (Vitest) >> %TEST_REPORT%
call npm run test > ..\frontend-test.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 前端测试通过 >> %TEST_REPORT%
    echo ✅ 前端测试通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  前端测试失败或未配置 >> %TEST_REPORT%
    echo ⚠️  前端测试失败或未配置（查看 frontend-test.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 2.3 类型检查
echo [2.3] 运行 TypeScript 类型检查...
echo ### 2.3 类型检查 (vue-tsc) >> %TEST_REPORT%
call npx vue-tsc --noEmit > ..\frontend-typecheck.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 类型检查通过 >> %TEST_REPORT%
    echo ✅ 类型检查通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  类型检查有错误 >> %TEST_REPORT%
    echo ⚠️  类型检查有错误（查看 frontend-typecheck.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 2.4 构建验证
echo [2.4] 验证前端构建...
echo ### 2.4 构建验证 >> %TEST_REPORT%
call npm run build > ..\frontend-build.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 构建成功 >> %TEST_REPORT%
    echo ✅ 构建成功
    set /a PASSED_TESTS+=1
) else (
    echo ❌ 构建失败 >> %TEST_REPORT%
    echo ❌ 构建失败（查看 frontend-build.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

cd ..
echo ✅ 前端模块测试完成
echo. >> %TEST_REPORT%

REM ========== Python AI 服务测试 ==========
echo.
echo [3/6] 🐍 Python AI 服务
echo ========================================
echo ## 3. Python AI 服务测试 >> %TEST_REPORT%
echo. >> %TEST_REPORT%

cd python-ai

REM 3.1 代码质量检查
echo [3.1] 运行代码质量检查...
echo ### 3.1 代码质量检查 >> %TEST_REPORT%
python -m pip install flake8 >nul 2>&1
call flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics > ..\python-lint.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 代码质量检查通过 >> %TEST_REPORT%
    echo ✅ 代码质量检查通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  代码质量检查有警告 >> %TEST_REPORT%
    echo ⚠️  代码质量检查有警告（查看 python-lint.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 3.2 测试
echo [3.2] 运行 Python 测试 (pytest)...
echo ### 3.2 Python 测试 (pytest) >> %TEST_REPORT%
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    if exist tests (
        call pytest tests/ -v --tb=short > ..\python-test.log 2>&1
        if %errorlevel% equ 0 (
            echo ✅ Python 测试通过 >> %TEST_REPORT%
            echo ✅ Python 测试通过
            set /a PASSED_TESTS+=1
        ) else (
            echo ⚠️  Python 测试失败或未配置 >> %TEST_REPORT%
            echo ⚠️  Python 测试失败或未配置（查看 python-test.log）
            set /a FAILED_TESTS+=1
        )
    ) else (
        echo ⚠️  测试目录不存在，跳过 >> %TEST_REPORT%
        echo ⚠️  测试目录不存在，跳过
    )
    set /a TOTAL_TESTS+=1
) else (
    echo ⚠️  Python 虚拟环境不存在，跳过测试 >> %TEST_REPORT%
    echo ⚠️  Python 虚拟环境不存在，跳过测试
)
echo. >> %TEST_REPORT%

REM 3.3 服务验证
echo [3.3] 验证服务入口文件...
echo ### 3.3 服务验证 >> %TEST_REPORT%
if exist app.py (
    echo ✅ 服务入口文件存在 (app.py) >> %TEST_REPORT%
    echo ✅ 服务入口文件存在
    set /a PASSED_TESTS+=1
) else if exist grpc_server.py (
    echo ✅ 服务入口文件存在 (grpc_server.py) >> %TEST_REPORT%
    echo ✅ 服务入口文件存在
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  服务入口文件不存在 >> %TEST_REPORT%
    echo ⚠️  服务入口文件不存在
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

cd ..
echo ✅ Python AI 服务测试完成
echo. >> %TEST_REPORT%

REM ========== Rust 服务测试 ==========
echo.
echo [4/6] 🦀 Rust 服务 (可选)
echo ========================================
echo ## 4. Rust 服务测试 >> %TEST_REPORT%
echo. >> %TEST_REPORT%

cd rust-service

REM 4.1 格式化检查
echo [4.1] 运行代码格式化检查...
echo ### 4.1 格式化检查 (cargo fmt) >> %TEST_REPORT%
call cargo fmt --all -- --check > ..\rust-fmt.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 格式化检查通过 >> %TEST_REPORT%
    echo ✅ 格式化检查通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  格式化检查有差异 >> %TEST_REPORT%
    echo ⚠️  格式化检查有差异（查看 rust-fmt.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 4.2 代码检查
echo [4.2] 运行代码检查 (clippy)...
echo ### 4.2 代码检查 (clippy) >> %TEST_REPORT%
call cargo clippy --all-targets --all-features -- -D warnings > ..\rust-clippy.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ Clippy 检查通过 >> %TEST_REPORT%
    echo ✅ Clippy 检查通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  Clippy 检查有警告 >> %TEST_REPORT%
    echo ⚠️  Clippy 检查有警告（查看 rust-clippy.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 4.3 测试
echo [4.3] 运行 Rust 测试...
echo ### 4.3 Rust 测试 >> %TEST_REPORT%
call cargo test --release --verbose > ..\rust-test.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ Rust 测试通过 >> %TEST_REPORT%
    echo ✅ Rust 测试通过
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  Rust 测试失败或未配置 >> %TEST_REPORT%
    echo ⚠️  Rust 测试失败或未配置（查看 rust-test.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

REM 4.4 构建验证
echo [4.4] 验证 Release 构建...
echo ### 4.4 构建验证 >> %TEST_REPORT%
call cargo build --release > ..\rust-build.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ 构建成功 >> %TEST_REPORT%
    echo ✅ 构建成功
    set /a PASSED_TESTS+=1
) else (
    echo ⚠️  构建失败或未配置 >> %TEST_REPORT%
    echo ⚠️  构建失败或未配置（查看 rust-build.log）
    set /a FAILED_TESTS+=1
)
set /a TOTAL_TESTS+=1
echo. >> %TEST_REPORT%

cd ..
echo ✅ Rust 服务测试完成
echo. >> %TEST_REPORT%

REM ========== 测试总结 ==========
echo.
echo ========================================
echo 📊 测试总结
echo ========================================
echo.

set /a SUCCESS_RATE=(PASSED_TESTS * 100) / TOTAL_TESTS

echo ## 测试总结 >> %TEST_REPORT%
echo. >> %TEST_REPORT%
echo | 项目 | 通过 | 失败 | 总计 | >> %TEST_REPORT%
echo |------|------|------|------| >> %TEST_REPORT%
echo | 所有模块 | %PASSED_TESTS% | %FAILED_TESTS% | %TOTAL_TESTS% | >> %TEST_REPORT%
echo. >> %TEST_REPORT%
echo **成功率**: %SUCCESS_RATE%% >> %TEST_REPORT%
echo. >> %TEST_REPORT%

if %FAILED_TESTS% equ 0 (
    echo ✅ **所有测试通过！** >> %TEST_REPORT%
    echo.
    echo ✅ 所有测试通过！
    echo ✅ 通过: %PASSED_TESTS% / %TOTAL_TESTS%
    echo ✅ 成功率: %SUCCESS_RATE%%
) else (
    echo ❌ **部分测试失败** >> %TEST_REPORT%
    echo.
    echo ❌ 部分测试失败
    echo ✅ 通过: %PASSED_TESTS% / %TOTAL_TESTS%
    echo ❌ 失败: %FAILED_TESTS% / %TOTAL_TESTS%
    echo 📊 成功率: %SUCCESS_RATE%%
)

echo. >> %TEST_REPORT%
echo --- >> %TEST_REPORT%
echo. >> %TEST_REPORT%
echo **详细日志文件**: >> %TEST_REPORT%
echo - backend-lint.log, backend-test.log, backend-build.log >> %TEST_REPORT%
echo - frontend-lint.log, frontend-test.log, frontend-typecheck.log, frontend-build.log >> %TEST_REPORT%
echo - python-lint.log, python-test.log >> %TEST_REPORT%
echo - rust-fmt.log, rust-clippy.log, rust-test.log, rust-build.log >> %TEST_REPORT%
echo. >> %TEST_REPORT%

echo.
echo ========================================
echo 📄 测试报告已保存到: %TEST_REPORT%
echo ========================================
echo.

type %TEST_REPORT%

if %FAILED_TESTS% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)

