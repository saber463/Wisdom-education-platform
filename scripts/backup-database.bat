@echo off
REM ========================================
REM 【国赛专用】数据库备份脚本
REM 使用mysqldump导出数据库
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   数据库备份工具
echo   ChuanZhi Cup National Competition
echo ========================================
echo.

REM 切换到项目根目录
cd /d "%~dp0.."

REM ========================================
REM 检查MySQL是否可用
REM ========================================
echo 检查MySQL...

mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ MySQL未安装或未在PATH中
    echo   请确保MySQL已安装并添加到系统PATH
    pause
    exit /b 1
)

echo ✓ MySQL已安装
echo.

REM ========================================
REM 检查数据库连接
REM ========================================
echo 检查数据库连接...

mysql -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ 无法连接到MySQL数据库
    echo   请确保MySQL服务正在运行
    pause
    exit /b 1
)

echo ✓ 数据库连接正常
echo.

REM ========================================
REM 检查数据库是否存在
REM ========================================
echo 检查数据库...

mysql -u root -e "USE edu_education_platform;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ 数据库 edu_education_platform 不存在
    echo   请先运行数据库初始化脚本
    pause
    exit /b 1
)

echo ✓ 数据库 edu_education_platform 存在
echo.

REM ========================================
REM 创建备份目录
REM ========================================
set BACKUP_DIR=docs\sql\backup

if not exist "%BACKUP_DIR%" (
    echo 创建备份目录: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
    echo ✓ 备份目录已创建
) else (
    echo ✓ 备份目录已存在
)

echo.

REM ========================================
REM 生成备份文件名
REM ========================================
REM 获取当前日期和时间
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set YEAR=%datetime:~0,4%
set MONTH=%datetime:~4,2%
set DAY=%datetime:~6,2%
set HOUR=%datetime:~8,2%
set MINUTE=%datetime:~10,2%
set SECOND=%datetime:~12,2%

set BACKUP_FILE=%BACKUP_DIR%\edu_platform_%YEAR%%MONTH%%DAY%_%HOUR%%MINUTE%%SECOND%.sql

echo 备份文件: %BACKUP_FILE%
echo.

REM ========================================
REM 执行数据库备份
REM ========================================
echo 开始备份数据库...
echo 这可能需要几分钟，请耐心等待...
echo.

REM 使用mysqldump导出数据库
mysqldump -u root --databases edu_education_platform --add-drop-database --add-drop-table --routines --triggers --events > "%BACKUP_FILE%" 2>nul

if %errorlevel% neq 0 (
    echo ✗ 数据库备份失败
    echo   请检查MySQL权限和磁盘空间
    pause
    exit /b 1
)

echo ✓ 数据库备份成功
echo.

REM ========================================
REM 验证备份文件
REM ========================================
echo 验证备份文件...

if not exist "%BACKUP_FILE%" (
    echo ✗ 备份文件未找到
    pause
    exit /b 1
)

REM 获取文件大小
for %%A in ("%BACKUP_FILE%") do set FILESIZE=%%~zA

if %FILESIZE% LSS 1024 (
    echo ✗ 备份文件太小，可能备份失败
    pause
    exit /b 1
)

REM 计算文件大小（KB）
set /a FILESIZE_KB=%FILESIZE% / 1024

echo ✓ 备份文件有效
echo   文件大小: %FILESIZE_KB% KB
echo.

REM ========================================
REM 统计备份信息
REM ========================================
echo 统计备份信息...

REM 统计表数量
for /f %%i in ('mysql -u root edu_education_platform -e "SHOW TABLES;" ^| find /c /v ""') do set TABLE_COUNT=%%i
set /a TABLE_COUNT=%TABLE_COUNT%-1

REM 统计记录数
for /f %%i in ('mysql -u root edu_education_platform -e "SELECT COUNT(*) FROM users;" ^| find /c /v ""') do set USER_COUNT=%%i
set /a USER_COUNT=%USER_COUNT%-1

for /f %%i in ('mysql -u root edu_education_platform -e "SELECT COUNT(*) FROM assignments;" ^| find /c /v ""') do set ASSIGNMENT_COUNT=%%i
set /a ASSIGNMENT_COUNT=%ASSIGNMENT_COUNT%-1

echo.

REM ========================================
REM 备份完成
REM ========================================
echo ========================================
echo   数据库备份完成！
echo ========================================
echo.

echo 备份信息:
echo   [✓] 数据库: edu_education_platform
echo   [✓] 备份文件: %BACKUP_FILE%
echo   [✓] 文件大小: %FILESIZE_KB% KB
echo   [✓] 表数量: %TABLE_COUNT% 张
echo   [✓] 用户数: %USER_COUNT% 个
echo   [✓] 作业数: %ASSIGNMENT_COUNT% 份
echo.

echo 备份位置:
echo   %CD%\%BACKUP_FILE%
echo.

REM ========================================
REM 清理旧备份（可选）
REM ========================================
echo 检查旧备份文件...

REM 统计备份文件数量
set BACKUP_COUNT=0
for %%f in (%BACKUP_DIR%\*.sql) do set /a BACKUP_COUNT+=1

echo   当前备份文件数: %BACKUP_COUNT%

if %BACKUP_COUNT% GTR 10 (
    echo.
    echo ⚠ 备份文件超过10个
    set /p CLEANUP="是否删除最旧的备份文件? (Y/N): "
    
    if /i "!CLEANUP!"=="Y" (
        echo 删除最旧的备份文件...
        
        REM 获取最旧的文件并删除
        for /f "delims=" %%f in ('dir /b /o:d %BACKUP_DIR%\*.sql') do (
            del "%BACKUP_DIR%\%%f" >nul 2>&1
            echo   ✓ 已删除: %%f
            goto :cleanup_done
        )
        
        :cleanup_done
        echo   清理完成
    )
)

echo.

REM ========================================
REM 恢复说明
REM ========================================
echo 恢复数据库:
echo   1. 停止所有服务
echo   2. 运行命令: mysql -u root ^< %BACKUP_FILE%
echo   3. 重启所有服务
echo.

echo 提示:
echo   - 定期备份数据库以防数据丢失
echo   - 备份文件保存在: %BACKUP_DIR%
echo   - 建议保留最近10个备份文件
echo   - 重要备份请复制到其他位置
echo.

pause
