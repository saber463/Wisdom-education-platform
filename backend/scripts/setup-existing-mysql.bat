@echo off
REM ========================================
REM 使用现有MySQL创建数据库和表结构
REM 适用于已安装Navicat/MySQL的情况
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   智慧教育学习平台
echo   使用现有MySQL设置数据库
echo ========================================
echo.

REM 测试MySQL连接
echo [1/4] 测试MySQL连接...
mysql -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MySQL连接成功 ^(用户: root, 无密码^)
    set MYSQL_USER=root
    set MYSQL_PASS=
) else (
    mysql -u root -proot -e "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ MySQL连接成功 ^(用户: root, 密码: root^)
        set MYSQL_USER=root
        set MYSQL_PASS=root
    ) else (
        echo ✗ 无法连接到MySQL
        echo 请检查MySQL服务是否启动，或密码是否正确
        pause
        exit /b 1
    )
)
echo.

REM 创建数据库
echo [2/4] 创建数据库...
if "!MYSQL_PASS!"=="" (
    mysql -u !MYSQL_USER! -e "CREATE DATABASE IF NOT EXISTS edu_education_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
) else (
    mysql -u !MYSQL_USER! -p!MYSQL_PASS! -e "CREATE DATABASE IF NOT EXISTS edu_education_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
)

if %errorlevel% neq 0 (
    echo ✗ 数据库创建失败
    pause
    exit /b 1
)
echo ✓ 数据库创建成功
echo.

REM 创建表结构
echo [3/4] 创建表结构...
if "!MYSQL_PASS!"=="" (
    mysql -u !MYSQL_USER! edu_education_platform < "%~dp0..\..\docs\sql\schema.sql"
) else (
    mysql -u !MYSQL_USER! -p!MYSQL_PASS! edu_education_platform < "%~dp0..\..\docs\sql\schema.sql"
)

if %errorlevel% neq 0 (
    echo ✗ 表结构创建失败
    pause
    exit /b 1
)
echo ✓ 表结构创建成功 ^(14张表^)
echo.

REM 插入测试数据
echo [4/4] 插入测试数据...
if "!MYSQL_PASS!"=="" (
    mysql -u !MYSQL_USER! edu_education_platform < "%~dp0..\..\docs\sql\test-data.sql"
) else (
    mysql -u !MYSQL_USER! -p!MYSQL_PASS! edu_education_platform < "%~dp0..\..\docs\sql\test-data.sql"
)

if %errorlevel% neq 0 (
    echo ✗ 测试数据插入失败
    pause
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
echo   端口: 3306
echo   表数量: 14张
echo.
echo 测试数据:
echo   教师: 3人
echo   学生: 30人
echo   家长: 10人
echo   班级: 5个
echo   作业: 20份
echo   题目: 100道
echo   知识点: 20个
echo.
echo 你现在可以在Navicat中查看数据库！
echo.

pause
