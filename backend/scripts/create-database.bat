@echo off
REM 数据库创建脚本
REM 使用MySQL命令行创建数据库（UTF8MB4字符集）

setlocal enabledelayedexpansion

echo ========================================
echo   数据库自动创建脚本
echo ========================================
echo.

REM 设置数据库配置
set DB_NAME=edu_education_platform
set DB_CHARSET=utf8mb4
set DB_COLLATE=utf8mb4_general_ci

REM 检测MySQL是否可用
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: MySQL未安装或未添加到PATH
    echo 请先安装MySQL或运行轻量级MySQL安装脚本
    exit /b 1
)

echo [1/3] 检测MySQL连接...

REM 尝试连接MySQL（无密码）
mysql -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    set MYSQL_USER=root
    set MYSQL_PASS=
    echo MySQL连接成功 ^(用户: root, 无密码^)
) else (
    REM 尝试使用常见默认密码
    mysql -u root -proot -e "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        set MYSQL_USER=root
        set MYSQL_PASS=root
        echo MySQL连接成功 ^(用户: root, 密码: root^)
    ) else (
        echo 错误: 无法连接到MySQL
        echo 请检查MySQL服务是否启动
        exit /b 1
    )
)

echo [2/3] 创建数据库...

REM 创建数据库SQL命令
if "!MYSQL_PASS!"=="" (
    mysql -u !MYSQL_USER! -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET %DB_CHARSET% COLLATE %DB_COLLATE%;"
) else (
    mysql -u !MYSQL_USER! -p!MYSQL_PASS! -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET %DB_CHARSET% COLLATE %DB_COLLATE%;"
)

if %errorlevel% neq 0 (
    echo 错误: 数据库创建失败
    exit /b 1
)

echo 数据库创建成功: %DB_NAME%

echo [3/3] 验证数据库字符集...

REM 验证字符集配置
if "!MYSQL_PASS!"=="" (
    mysql -u !MYSQL_USER! -e "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='%DB_NAME%';"
) else (
    mysql -u !MYSQL_USER! -p!MYSQL_PASS! -e "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='%DB_NAME%';"
)

echo.
echo ========================================
echo   数据库创建完成！
echo   数据库名: %DB_NAME%
echo   字符集: %DB_CHARSET%
echo   排序规则: %DB_COLLATE%
echo ========================================
echo.

exit /b 0
