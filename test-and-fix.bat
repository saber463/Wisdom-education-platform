@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo 系统测试和错误修复工具
echo ========================================
echo.

set ERROR_FILE=ERROR-SUMMARY.md
set TIMESTAMP=%date:~0,10% %time:~0,8%

echo # 系统测试错误汇总 > %ERROR_FILE%
echo. >> %ERROR_FILE%
echo **测试时间**: %TIMESTAMP% >> %ERROR_FILE%
echo **测试范围**: 全系统功能测试 >> %ERROR_FILE%
echo. >> %ERROR_FILE%
echo --- >> %ERROR_FILE%
echo. >> %ERROR_FILE%

REM ========== 1. 后端测试 ==========
echo [1/5] 测试后端服务...
echo ## 1. 后端测试结果 >> %ERROR_FILE%
echo. >> %ERROR_FILE%

cd backend
call npm test -- --listTests > test-list.txt 2>&1
if exist test-list.txt (
    echo 找到测试文件: >> %ERROR_FILE%
    type test-list.txt >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
)

call npm test -- --bail --no-coverage 2>&1 | tee backend-test-output.txt
if %errorlevel% neq 0 (
    echo ❌ 后端测试失败 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    type backend-test-output.txt >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    echo. >> %ERROR_FILE%
) else (
    echo ✅ 后端测试通过 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
)
cd ..

REM ========== 2. 前端测试 ==========
echo [2/5] 测试前端...
echo ## 2. 前端测试结果 >> %ERROR_FILE%
echo. >> %ERROR_FILE%

cd frontend
call npm test -- --reporter=verbose 2>&1 | tee frontend-test-output.txt
if %errorlevel% neq 0 (
    echo ❌ 前端测试失败 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    type frontend-test-output.txt >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    echo. >> %ERROR_FILE%
) else (
    echo ✅ 前端测试通过 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
)
cd ..

REM ========== 3. Python AI 测试 ==========
echo [3/5] 测试 Python AI 服务...
echo ## 3. Python AI 服务测试结果 >> %ERROR_FILE%
echo. >> %ERROR_FILE%

cd python-ai
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    call pytest tests/ -v --tb=short 2>&1 | tee python-test-output.txt
    if %errorlevel% neq 0 (
        echo ❌ Python 测试失败 >> %ERROR_FILE%
        echo. >> %ERROR_FILE%
        echo ```>> %ERROR_FILE%
        type python-test-output.txt >> %ERROR_FILE%
        echo ```>> %ERROR_FILE%
        echo. >> %ERROR_FILE%
    ) else (
        echo ✅ Python 测试通过 >> %ERROR_FILE%
        echo. >> %ERROR_FILE%
    )
) else (
    echo ⚠️  Python 虚拟环境未找到 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
)
cd ..

REM ========== 4. Rust 服务测试 ==========
echo [4/5] 测试 Rust 服务...
echo ## 4. Rust 服务测试结果 >> %ERROR_FILE%
echo. >> %ERROR_FILE%

cd rust-service
call cargo test 2>&1 | tee rust-test-output.txt
if %errorlevel% neq 0 (
    echo ❌ Rust 测试失败 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    type rust-test-output.txt >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    echo. >> %ERROR_FILE%
) else (
    echo ✅ Rust 测试通过 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
)
cd ..

REM ========== 5. 代码诊断 ==========
echo [5/5] 运行代码诊断...
echo ## 5. 代码诊断结果 >> %ERROR_FILE%
echo. >> %ERROR_FILE%

echo ### TypeScript 编译检查 >> %ERROR_FILE%
cd backend
call npx tsc --noEmit 2>&1 | tee ts-check-output.txt
if %errorlevel% neq 0 (
    echo ❌ TypeScript 编译错误 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    type ts-check-output.txt >> %ERROR_FILE%
    echo ```>> %ERROR_FILE%
    echo. >> %ERROR_FILE%
) else (
    echo ✅ TypeScript 编译通过 >> %ERROR_FILE%
    echo. >> %ERROR_FILE%
)
cd ..

echo.
echo ========================================
echo 测试完成！错误汇总已保存到 %ERROR_FILE%
echo ========================================
echo.
type %ERROR_FILE%
echo.
pause
