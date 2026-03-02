@echo off
REM ========================================
REM 智慧教育平台 - 完整数据库设置脚本
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   智慧教育学习平台
echo   数据库完整设置
echo ========================================
echo.

REM 步骤1: 检测Navicat
echo [步骤1/5] 检测Navicat...
call "%~dp0detect-navicat.bat"
if %errorlevel% equ 0 (
    echo ✓ Navicat已安装
    set HAS_NAVICAT=1
) else (
    echo ✗ Navicat未安装
    set HAS_NAVICAT=0
)
echo.

REM 步骤2: 检测或安装MySQL
echo [步骤2/5] 检测MySQL...
mysql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MySQL已安装
) else (
    echo ✗ MySQL未安装
    echo 正在安装轻量级MySQL...
    call "%~dp0install-mysql-portable.bat"
    if %errorlevel% neq 0 (
        echo 错误: MySQL安装失败
        exit /b 1
    )
)
echo.

REM 步骤3: 创建数据库
echo [步骤3/5] 创建数据库...
call "%~dp0create-database.bat"
if %errorlevel% neq 0 (
    echo 错误: 数据库创建失败
    exit /b 1
)
echo.

REM 步骤4: 创建表结构
echo [步骤4/5] 创建表结构...
mysql -u root edu_education_platform < "%~dp0..\..\docs\sql\schema.sql"
if %errorlevel% neq 0 (
    echo 错误: 表结构创建失败
    exit /b 1
)
echo ✓ 表结构创建成功
echo.

REM 步骤5: 插入测试数据
echo [步骤5/5] 插入测试数据...
mysql -u root edu_education_platform < "%~dp0..\..\docs\sql\test-data.sql"
if %errorlevel% neq 0 (
    echo 错误: 测试数据插入失败
    exit /b 1
)
echo ✓ 测试数据插入成功
echo.

echo ========================================
echo   数据库设置完成！
echo ========================================
echo.
echo 数据库信息:
echo   数据库名: edu_education_platform
echo   字符集: utf8mb4
echo   排序规则: utf8mb4_general_ci
echo   表数量: 14
echo   测试用户: 3个教师 + 30个学生 + 10个家长
echo   测试数据: 5个班级 + 20份作业 + 100道题目
echo.

pause
