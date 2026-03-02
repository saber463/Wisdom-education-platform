@echo off
REM 轻量级MySQL 8.0自动安装脚本
REM 适用于Windows 10/11本地环境

setlocal enabledelayedexpansion

echo ========================================
echo   轻量级MySQL 8.0自动安装
echo ========================================
echo.

REM 设置MySQL配置
set MYSQL_VERSION=8.0.35
set MYSQL_DIR=C:\mysql-portable
set MYSQL_DATA_DIR=%MYSQL_DIR%\data
set MYSQL_PORT=3306

REM 检查是否已安装
if exist "%MYSQL_DIR%\bin\mysqld.exe" (
    echo MySQL已安装在: %MYSQL_DIR%
    echo 跳过安装步骤
    goto :start_mysql
)

echo [1/5] 创建MySQL目录...
if not exist "%MYSQL_DIR%" mkdir "%MYSQL_DIR%"
if not exist "%MYSQL_DATA_DIR%" mkdir "%MYSQL_DATA_DIR%"
echo ✓ 目录创建完成

echo [2/5] 下载MySQL 8.0...
echo 正在从MySQL官方镜像下载...
echo 文件大小约200MB，请耐心等待...

REM 使用PowerShell下载MySQL ZIP包
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; try { Invoke-WebRequest -Uri 'https://cdn.mysql.com/Downloads/MySQL-8.0/mysql-%MYSQL_VERSION%-winx64.zip' -OutFile '%MYSQL_DIR%\mysql.zip' -TimeoutSec 300 } catch { Write-Host '下载失败，尝试备用镜像...'; Invoke-WebRequest -Uri 'https://mirrors.tuna.tsinghua.edu.cn/mysql/downloads/MySQL-8.0/mysql-%MYSQL_VERSION%-winx64.zip' -OutFile '%MYSQL_DIR%\mysql.zip' -TimeoutSec 300 }}"

if %errorlevel% neq 0 (
    echo ✗ 下载失败
    echo 请检查网络连接或手动下载MySQL
    exit /b 1
)
echo ✓ 下载完成

echo [3/5] 解压MySQL...
powershell -Command "Expand-Archive -Path '%MYSQL_DIR%\mysql.zip' -DestinationPath '%MYSQL_DIR%' -Force"

REM 移动文件到根目录
for /d %%i in ("%MYSQL_DIR%\mysql-*") do (
    xcopy /E /I /Y "%%i\*" "%MYSQL_DIR%"
    rmdir /S /Q "%%i"
)

del "%MYSQL_DIR%\mysql.zip"
echo ✓ 解压完成

echo [4/5] 创建MySQL配置文件...
(
echo [mysqld]
echo # 基本配置
echo port=%MYSQL_PORT%
echo basedir=%MYSQL_DIR%
echo datadir=%MYSQL_DATA_DIR%
echo character-set-server=utf8mb4
echo collation-server=utf8mb4_general_ci
echo default-storage-engine=INNODB
echo 
echo # 性能优化（低资源模式）
echo max_connections=50
echo innodb_buffer_pool_size=128M
echo innodb_log_file_size=32M
echo 
echo # 安全配置
echo skip-name-resolve
echo sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
echo 
echo [mysql]
echo default-character-set=utf8mb4
echo 
echo [client]
echo port=%MYSQL_PORT%
echo default-character-set=utf8mb4
) > "%MYSQL_DIR%\my.ini"
echo ✓ 配置文件创建完成

echo [5/5] 初始化MySQL数据库...
cd /d "%MYSQL_DIR%\bin"

REM 初始化数据库（无密码）
mysqld --initialize-insecure --console

if %errorlevel% neq 0 (
    echo ✗ 初始化失败
    exit /b 1
)
echo ✓ 初始化完成

:start_mysql
echo.
echo ========================================
echo   启动MySQL服务
echo ========================================
echo.

cd /d "%MYSQL_DIR%\bin"

REM 检查端口是否被占用
netstat -ano | findstr ":%MYSQL_PORT%" >nul
if %errorlevel% equ 0 (
    echo 警告: 端口%MYSQL_PORT%已被占用
    echo 尝试使用备用端口3307...
    set MYSQL_PORT=3307
)

REM 启动MySQL服务
echo 正在启动MySQL服务...
start /B mysqld --console --port=%MYSQL_PORT%

REM 等待MySQL启动
echo 等待MySQL启动...
timeout /t 5 >nul

REM 测试连接
mysql -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MySQL启动成功
) else (
    echo ✗ MySQL启动失败
    echo 请检查日志文件: %MYSQL_DATA_DIR%\*.err
    exit /b 1
)

echo.
echo ========================================
echo   MySQL安装完成！
echo   安装路径: %MYSQL_DIR%
echo   端口: %MYSQL_PORT%
echo   用户: root
echo   密码: 无
echo ========================================
echo.

REM 添加到PATH环境变量
echo 是否将MySQL添加到系统PATH？(Y/N)
set /p ADD_PATH=
if /i "%ADD_PATH%"=="Y" (
    setx PATH "%PATH%;%MYSQL_DIR%\bin"
    echo ✓ 已添加到PATH
)

echo.
echo 安装完成！可以使用以下命令连接MySQL:
echo mysql -u root
echo.

exit /b 0
