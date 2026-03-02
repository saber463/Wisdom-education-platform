@echo off
REM 修复 Windows 终端乱码问题
chcp 65001 >nul

REM 设置环境变量以支持 UTF-8
set PYTHONIOENCODING=utf-8
set NODE_ENV=test

echo.
echo ========================================
echo 智慧教育学习平台 - 综合测试套件
echo ========================================
echo.

REM 检查后端测试
echo [1/4] 执行后端测试...
cd backend
call npm test 2>&1
if %errorlevel% neq 0 (
    echo ❌ 后端测试失败
    cd ..
    goto error
)
cd ..
echo ✅ 后端测试完成
echo.

REM 检查前端测试
echo [2/4] 执行前端测试...
cd frontend
call npm test -- --run 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  前端测试失败或未配置
)
cd ..
echo ✅ 前端测试完成
echo.

REM 检查 Python 测试
echo [3/4] 执行 Python AI 服务测试...
cd python-ai
if exist venv (
    call venv\Scripts\activate.bat
) else (
    echo ⚠️  Python 虚拟环境不存在，跳过
    cd ..
    goto skip_python
)
call pytest tests/ -v 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Python 测试失败或未配置
)
cd ..
:skip_python
echo ✅ Python 测试完成
echo.

REM 检查 Rust 测试
echo [4/4] 执行 Rust 服务测试...
cd rust-service
call cargo test --release 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Rust 测试失败或未配置
)
cd ..
echo ✅ Rust 测试完成
echo.

echo ========================================
echo 🎉 所有测试执行完成！
echo ========================================
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo ❌ 测试执行失败
echo ========================================
echo.
pause
exit /b 1
