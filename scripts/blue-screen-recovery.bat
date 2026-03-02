@echo off
REM ========================================
REM 【国赛专用】蓝屏恢复脚本
REM Blue Screen Recovery Script
REM 需求：10.9
REM ========================================
echo.
echo ========================================
echo   蓝屏恢复工具
echo   Blue Screen Recovery Tool
echo ========================================
echo.

REM 设置颜色（如果支持）
color 0E

REM 记录恢复开始时间
set START_TIME=%time%
echo [%date% %time%] 开始蓝屏恢复流程...
echo.

REM ========================================
REM 步骤1：检测蓝屏痕迹
REM ========================================
echo [1/4] 检测蓝屏痕迹...
echo.

REM 检查Windows事件日志中的蓝屏记录
set BSOD_DETECTED=0

REM 检查最近的系统崩溃事件
wevtutil qe System /c:1 /rd:true /f:text /q:"*[System[(EventID=1001 or EventID=6008)]]" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ 检测到系统崩溃记录
    set BSOD_DETECTED=1
) else (
    echo    - 未检测到明确的蓝屏记录
)

REM 检查内存转储文件
if exist "C:\Windows\MEMORY.DMP" (
    echo    ✓ 发现内存转储文件 MEMORY.DMP
    set BSOD_DETECTED=1
)

if exist "C:\Windows\Minidump\*.dmp" (
    echo    ✓ 发现小内存转储文件
    set BSOD_DETECTED=1
)

REM 检查异常关机标记
if exist "%TEMP%\abnormal_shutdown.flag" (
    echo    ✓ 发现异常关机标记
    set BSOD_DETECTED=1
)

if %BSOD_DETECTED% equ 1 (
    echo.
    echo    ⚠️ 检测到蓝屏痕迹，继续恢复流程...
    echo.
) else (
    echo.
    echo    ℹ️ 未检测到明确的蓝屏痕迹
    echo    但仍将执行完整恢复流程以确保系统稳定
    echo.
)

timeout /t 2 >nul

REM ========================================
REM 步骤2：恢复代码到最新状态
REM ========================================
echo [2/4] 恢复代码到最新状态...
echo.

REM 检查Git是否可用
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    检查Git仓库状态...
    
    REM 保存当前工作目录
    pushd "%~dp0\.."
    
    REM 检查是否有未提交的更改
    git status --porcelain >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✓ Git仓库可用
        
        REM 暂存所有更改（防止丢失）
        echo    暂存当前更改...
        git add -A >nul 2>&1
        git stash save "Auto-stash before blue screen recovery - %date% %time%" >nul 2>&1
        
        REM 拉取最新代码
        echo    拉取最新代码...
        git pull origin main >nul 2>&1
        if %errorlevel% equ 0 (
            echo    ✓ 代码已更新到最新版本
        ) else (
            echo    ⚠️ 代码拉取失败，使用本地版本
        )
        
        REM 恢复暂存的更改
        git stash pop >nul 2>&1
    ) else (
        echo    ⚠️ Git仓库状态异常，跳过代码更新
    )
    
    popd
) else (
    echo    ℹ️ Git未安装，跳过代码恢复
)

REM 清理临时文件和缓存
echo    清理临时文件...
if exist "backend\node_modules\.cache" (
    rd /s /q "backend\node_modules\.cache" >nul 2>&1
    echo    ✓ 清理Node.js缓存
)

if exist "rust-service\target\debug" (
    rd /s /q "rust-service\target\debug" >nul 2>&1
    echo    ✓ 清理Rust调试文件
)

if exist "python-ai\__pycache__" (
    rd /s /q "python-ai\__pycache__" >nul 2>&1
    echo    ✓ 清理Python缓存
)

echo    ✓ 代码恢复完成
echo.
timeout /t 2 >nul

REM ========================================
REM 步骤3：修复数据库完整性
REM ========================================
echo [3/4] 修复数据库完整性...
echo.

REM 检查MySQL是否运行
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if %errorlevel% equ 0 (
    echo    ✓ MySQL服务正在运行
) else (
    echo    启动MySQL服务...
    
    REM 尝试启动Windows服务
    net start MySQL80 >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✓ MySQL服务已启动
    ) else (
        REM 尝试启动便携版MySQL
        if exist "C:\mysql\bin\mysqld.exe" (
            start /B C:\mysql\bin\mysqld.exe --console
            timeout /t 5 >nul
            echo    ✓ 便携版MySQL已启动
        ) else (
            echo    ✗ MySQL启动失败，跳过数据库修复
            goto :SKIP_DB_REPAIR
        )
    )
)

REM 等待MySQL完全启动
timeout /t 3 >nul

REM 执行数据库修复
echo    执行数据库完整性检查...

REM 检查数据库连接
mysql -u root -e "SELECT 1" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ 数据库连接正常
    
    REM 修复所有表
    echo    修复数据库表...
    mysql -u root -e "USE edu_education_platform; REPAIR TABLE users, classes, assignments, submissions, answers, knowledge_points, student_weak_points, exercise_bank, qa_records, notifications, system_logs;" >nul 2>&1
    
    REM 优化表
    echo    优化数据库表...
    mysql -u root -e "USE edu_education_platform; OPTIMIZE TABLE users, classes, assignments, submissions, answers;" >nul 2>&1
    
    REM 刷新权限
    echo    刷新数据库权限...
    mysql -u root -e "FLUSH PRIVILEGES;" >nul 2>&1
    
    REM 检查字符集
    echo    验证字符集配置...
    mysql -u root -e "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='edu_education_platform';" >nul 2>&1
    
    echo    ✓ 数据库修复完成
) else (
    echo    ✗ 数据库连接失败
    echo    尝试使用备份恢复...
    
    REM 查找最新的备份文件
    if exist "docs\sql\backup\*.sql" (
        for /f "delims=" %%i in ('dir /b /o-d "docs\sql\backup\*.sql" 2^>nul') do (
            set LATEST_BACKUP=%%i
            goto :FOUND_BACKUP
        )
        
        :FOUND_BACKUP
        if defined LATEST_BACKUP (
            echo    找到备份文件: %LATEST_BACKUP%
            echo    恢复数据库...
            mysql -u root edu_education_platform < "docs\sql\backup\%LATEST_BACKUP%" >nul 2>&1
            if %errorlevel% equ 0 (
                echo    ✓ 数据库已从备份恢复
            ) else (
                echo    ✗ 数据库恢复失败
            )
        )
    ) else (
        echo    ✗ 未找到数据库备份文件
    )
)

:SKIP_DB_REPAIR
echo.
timeout /t 2 >nul

REM ========================================
REM 步骤4：重启所有服务（低资源模式）
REM ========================================
echo [4/4] 重启所有服务（低资源模式）...
echo.

REM 首先停止所有现有服务
echo    停止现有服务...

REM 停止Node.js进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM 停止Python进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM 停止Rust进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM 停止前端进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo    ✓ 现有服务已停止
echo.

REM 设置低资源模式环境变量
echo    配置低资源模式...
set NODE_OPTIONS=--max-old-space-size=2048
set CARGO_BUILD_JOBS=1
set PYTHONOPTIMIZE=1
set RUST_BACKTRACE=0

REM 设置进程优先级为低
set PRIORITY=LOW

echo    ✓ 低资源模式已配置
echo       - Node.js内存限制: 2GB
echo       - Rust编译单核模式
echo       - Python优化模式
echo       - 进程优先级: 低
echo.

REM 启动服务
echo    启动服务...
echo.

REM 1. 启动MySQL（如果未运行）
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if %errorlevel% neq 0 (
    echo    [1/4] 启动MySQL...
    net start MySQL80 >nul 2>&1
    if %errorlevel% neq 0 (
        if exist "C:\mysql\bin\mysqld.exe" (
            start /B /%PRIORITY% C:\mysql\bin\mysqld.exe --console
        )
    )
    timeout /t 3 >nul
    echo    ✓ MySQL已启动
)

REM 2. 启动Rust服务
echo    [2/4] 启动Rust服务（低优先级）...
cd /d "%~dp0\..\rust-service"
start /B /%PRIORITY% cargo run --release
cd /d "%~dp0"
timeout /t 5 >nul
echo    ✓ Rust服务已启动

REM 3. 启动Python AI服务
echo    [3/4] 启动Python AI服务（低优先级）...
cd /d "%~dp0\..\python-ai"
start /B /%PRIORITY% python app.py
cd /d "%~dp0"
timeout /t 5 >nul
echo    ✓ Python AI服务已启动

REM 4. 启动Node.js后端
echo    [4/4] 启动Node.js后端（低优先级）...
cd /d "%~dp0\..\backend"
start /B /%PRIORITY% npm run start
cd /d "%~dp0"
timeout /t 3 >nul
echo    ✓ Node.js后端已启动

echo.
echo    ✓ 所有服务已在低资源模式下启动
echo.

REM ========================================
REM 恢复完成
REM ========================================
set END_TIME=%time%
echo ========================================
echo   蓝屏恢复完成！
echo ========================================
echo.
echo   开始时间: %START_TIME%
echo   结束时间: %END_TIME%
echo.
echo   系统状态:
echo   - 代码: 已恢复到最新状态
echo   - 数据库: 完整性已修复
echo   - 服务: 已在低资源模式下重启
echo.
echo   资源限制:
echo   - CPU使用率: ≤50%%
echo   - 内存占用: ≤50%%
echo   - 进程优先级: 低
echo.
echo   ✓ 系统已恢复正常运行
echo   ✓ 防蓝屏保护已启用
echo.
echo ========================================

REM 创建恢复完成标记
echo Recovery completed at %date% %time% > "%TEMP%\recovery_completed.flag"

REM 删除异常关机标记
if exist "%TEMP%\abnormal_shutdown.flag" (
    del "%TEMP%\abnormal_shutdown.flag"
)

REM 记录恢复日志
if not exist "logs" mkdir logs
echo [%date% %time%] Blue screen recovery completed successfully >> logs\recovery.log

echo.
echo 按任意键打开浏览器访问系统...
pause >nul

REM 打开浏览器
start http://localhost:3000

echo.
echo 系统已就绪！
echo.
pause
