@echo off
chcp 65001 >nul

echo ========================================
echo 快速测试检查
echo ========================================
echo.

REM 检查后端测试文件
echo [1] 检查后端测试文件...
cd backend
dir /s /b *test.ts 2>nul | find /c ".test.ts"
echo 找到的测试文件数量: 
dir /s /b *test.ts 2>nul
cd ..
echo.

REM 检查前端测试文件
echo [2] 检查前端测试文件...
cd frontend
dir /s /b *test.ts 2>nul | find /c ".test.ts"
echo 找到的测试文件数量:
dir /s /b *test.ts 2>nul
cd ..
echo.

REM 检查 Python 测试文件
echo [3] 检查 Python 测试文件...
cd python-ai
dir /s /b test_*.py 2>nul | find /c "test_"
echo 找到的测试文件数量:
dir /s /b test_*.py 2>nul
cd ..
echo.

REM 检查 Rust 测试文件
echo [4] 检查 Rust 测试文件...
cd rust-service
dir /s /b *test*.rs 2>nul
cd ..
echo.

echo ========================================
echo 检查完成
echo ========================================
pause
