@echo off
REM ========================================
REM 【国赛专用】演示数据初始化脚本
REM 清空数据库并重新插入演示数据
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   演示数据初始化
echo   ChuanZhi Cup National Competition
echo ========================================
echo.

REM 切换到项目根目录
cd /d "%~dp0.."

REM 确认操作
echo 警告: 此操作将清空所有数据并重新插入演示数据！
echo.
set /p CONFIRM="确认继续? (Y/N): "

if /i not "%CONFIRM%"=="Y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo ========================================
REM [1/4] 检查MySQL连接
REM ========================================
echo [1/4] 检查MySQL连接...

mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ MySQL未安装或未在PATH中
    echo   请先运行: backend\scripts\setup-all.bat
    pause
    exit /b 1
)

REM 测试数据库连接
mysql -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ 无法连接到MySQL数据库
    echo   请确保MySQL服务正在运行
    pause
    exit /b 1
)

echo ✓ MySQL连接成功
echo.

REM ========================================
REM [2/4] 清空数据库
REM ========================================
echo [2/4] 清空数据库...

REM 删除数据库
mysql -u root -e "DROP DATABASE IF EXISTS edu_education_platform;" 2>nul
if %errorlevel% neq 0 (
    echo ✗ 删除数据库失败
    pause
    exit /b 1
)

echo ✓ 旧数据已清空
echo.

REM ========================================
REM [3/4] 重新创建数据库
REM ========================================
echo [3/4] 重新创建数据库...

REM 创建数据库
mysql -u root -e "CREATE DATABASE edu_education_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;" 2>nul
if %errorlevel% neq 0 (
    echo ✗ 创建数据库失败
    pause
    exit /b 1
)

echo ✓ 数据库创建成功
echo   - 数据库名: edu_education_platform
echo   - 字符集: utf8mb4
echo   - 排序规则: utf8mb4_general_ci
echo.

REM ========================================
REM [4/4] 导入演示数据
REM ========================================
echo [4/4] 导入演示数据...

REM 导入表结构
echo   导入表结构...
if exist "docs\sql\schema.sql" (
    mysql -u root edu_education_platform < "docs\sql\schema.sql" 2>nul
    if %errorlevel% neq 0 (
        echo ✗ 表结构导入失败
        pause
        exit /b 1
    )
    echo   ✓ 表结构导入成功 (14张表)
) else (
    echo ✗ 找不到schema.sql文件
    pause
    exit /b 1
)

REM 导入测试数据
echo   导入测试数据...
if exist "docs\sql\test-data.sql" (
    mysql -u root edu_education_platform < "docs\sql\test-data.sql" 2>nul
    if %errorlevel% neq 0 (
        echo ✗ 测试数据导入失败
        pause
        exit /b 1
    )
    echo   ✓ 测试数据导入成功
) else (
    echo ✗ 找不到test-data.sql文件
    pause
    exit /b 1
)

REM 导入扩展题库（如果存在）
if exist "docs\sql\extended-exercise-bank.sql" (
    echo   导入扩展题库...
    mysql -u root edu_education_platform < "docs\sql\extended-exercise-bank.sql" 2>nul
    if %errorlevel% equ 0 (
        echo   ✓ 扩展题库导入成功
    ) else (
        echo   ⚠ 扩展题库导入失败（可选）
    )
)

echo.

REM ========================================
REM 验证数据
REM ========================================
echo 验证数据完整性...

REM 统计表数量
for /f %%i in ('mysql -u root edu_education_platform -e "SHOW TABLES;" ^| find /c /v ""') do set TABLE_COUNT=%%i
set /a TABLE_COUNT=%TABLE_COUNT%-1

REM 统计用户数量
for /f %%i in ('mysql -u root edu_education_platform -e "SELECT COUNT(*) FROM users;" ^| find /c /v ""') do set USER_COUNT=%%i
set /a USER_COUNT=%USER_COUNT%-1

REM 统计作业数量
for /f %%i in ('mysql -u root edu_education_platform -e "SELECT COUNT(*) FROM assignments;" ^| find /c /v ""') do set ASSIGNMENT_COUNT=%%i
set /a ASSIGNMENT_COUNT=%ASSIGNMENT_COUNT%-1

REM 统计题目数量
for /f %%i in ('mysql -u root edu_education_platform -e "SELECT COUNT(*) FROM exercise_bank;" ^| find /c /v ""') do set EXERCISE_COUNT=%%i
set /a EXERCISE_COUNT=%EXERCISE_COUNT%-1

echo.
echo ========================================
echo   演示数据初始化完成！
echo ========================================
echo.

echo 数据统计:
echo   [✓] 数据表: %TABLE_COUNT% 张
echo   [✓] 用户数: %USER_COUNT% 个
echo   [✓] 作业数: %ASSIGNMENT_COUNT% 份
echo   [✓] 题库: %EXERCISE_COUNT% 道题目
echo.

echo 演示账号:
echo   教师账号:
echo     用户名: teacher1  密码: 123456
echo     用户名: teacher2  密码: 123456
echo     用户名: teacher3  密码: 123456
echo.
echo   学生账号:
echo     用户名: student1  密码: 123456
echo     用户名: student2  密码: 123456
echo     ... (共30个学生账号)
echo.
echo   家长账号:
echo     用户名: parent1   密码: 123456
echo     用户名: parent2   密码: 123456
echo     ... (共10个家长账号)
echo.

echo ========================================
echo   系统已就绪，可以开始演示！
echo ========================================
echo.

echo 提示:
echo   - 所有密码均为: 123456
echo   - 数据已针对竞赛演示优化
echo   - 包含完整的作业、批改、学情数据
echo   - 启动系统: 运行 start-all-services.bat
echo.

pause
