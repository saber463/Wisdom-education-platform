@echo off
REM ========================================
REM 【国赛专用】应急修复工具
REM 自动修复常见问题并重启服务
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   应急修复工具
echo   ChuanZhi Cup National Competition
echo ========================================
echo.

REM 切换到项目根目录
cd /d "%~dp0.."

echo 开始诊断和修复系统问题...
echo.

REM ========================================
REM [1/6] 结束占用端口的进程
REM ========================================
echo [1/6] 清理占用端口的进程...

set PORTS=3306 8080 5000 3000 5173

for %%p in (%PORTS%) do (
    echo   检查端口 %%p...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr "LISTENING" 2^>nul') do (
        echo     正在停止进程 PID: %%a
        taskkill /F /PID %%a >nul 2>&1
        if %errorlevel% equ 0 (
            echo     ✓ 进程已停止
        )
    )
)

echo   ✓ 端口清理完成
echo.

REM ========================================
REM [2/6] 清理临时文件和缓存
REM ========================================
echo [2/6] 清理临时文件和缓存...

REM Node.js缓存
if exist "backend\node_modules\.cache" (
    rd /S /Q "backend\node_modules\.cache" >nul 2>&1
    echo   ✓ Node.js后端缓存已清理
)

if exist "frontend\node_modules\.cache" (
    rd /S /Q "frontend\node_modules\.cache" >nul 2>&1
    echo   ✓ 前端缓存已清理
)

REM Python缓存
if exist "python-ai\__pycache__" (
    rd /S /Q "python-ai\__pycache__" >nul 2>&1
    echo   ✓ Python缓存已清理
)

if exist "python-ai\tests\__pycache__" (
    rd /S /Q "python-ai\tests\__pycache__" >nul 2>&1
    echo   ✓ Python测试缓存已清理
)

REM Rust编译缓存（仅清理debug）
if exist "rust-service\target\debug" (
    rd /S /Q "rust-service\target\debug" >nul 2>&1
    echo   ✓ Rust调试缓存已清理
)

REM 清理日志文件中的错误日志
if exist "logs\*.log" (
    echo   ✓ 保留日志文件（可手动清理）
)

echo   ✓ 临时文件清理完成
echo.

REM ========================================
REM [3/6] 修复数据库连接
REM ========================================
echo [3/6] 修复数据库连接...

REM 检查MySQL是否可用
mysql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ MySQL已安装
    
    REM 尝试连接数据库
    mysql -u root -e "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ 数据库连接正常
        
        REM 刷新权限
        mysql -u root -e "FLUSH PRIVILEGES;" >nul 2>&1
        echo   ✓ 数据库权限已刷新
        
        REM 检查数据库是否存在
        mysql -u root -e "USE edu_education_platform;" >nul 2>&1
        if %errorlevel% equ 0 (
            echo   ✓ 数据库 edu_education_platform 存在
        ) else (
            echo   ⚠ 数据库不存在，需要运行初始化脚本
            echo     运行: backend\scripts\setup-all.bat
        )
    ) else (
        echo   ⚠ 无法连接到MySQL
        echo   尝试启动MySQL服务...
        
        REM 尝试启动MySQL服务
        net start MySQL80 >nul 2>&1
        if %errorlevel% equ 0 (
            echo   ✓ MySQL服务已启动
        ) else (
            echo   ⚠ MySQL服务启动失败
            echo     请检查MySQL安装或运行: backend\scripts\setup-all.bat
        )
    )
) else (
    echo   ⚠ MySQL未安装
    echo     运行: backend\scripts\setup-all.bat
)

echo.

REM ========================================
REM [4/6] 检查依赖完整性
REM ========================================
echo [4/6] 检查依赖完整性...

REM 检查Node.js依赖
if exist "backend\package.json" (
    if not exist "backend\node_modules" (
        echo   ⚠ Node.js后端依赖缺失
        echo     运行: cd backend ^&^& npm install
    ) else (
        echo   ✓ Node.js后端依赖完整
    )
)

if exist "frontend\package.json" (
    if not exist "frontend\node_modules" (
        echo   ⚠ 前端依赖缺失
        echo     运行: cd frontend ^&^& npm install
    ) else (
        echo   ✓ 前端依赖完整
    )
)

REM 检查Python依赖
if exist "python-ai\requirements.txt" (
    python -c "import flask" >nul 2>&1
    if %errorlevel% neq 0 (
        echo   ⚠ Python依赖缺失
        echo     运行: cd python-ai ^&^& pip install -r requirements.txt
    ) else (
        echo   ✓ Python依赖完整
    )
)

REM 检查Rust
if exist "rust-service\Cargo.toml" (
    rustc --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo   ⚠ Rust未安装
        echo     访问: https://rustup.rs/
    ) else (
        echo   ✓ Rust已安装
    )
)

echo.

REM ========================================
REM [5/6] 修复配置文件
REM ========================================
echo [5/6] 检查配置文件...

REM 检查后端配置
if exist "backend\.env.example" (
    if not exist "backend\.env" (
        echo   ⚠ 后端配置文件缺失
        echo     复制: backend\.env.example 到 backend\.env
        copy "backend\.env.example" "backend\.env" >nul 2>&1
        if %errorlevel% equ 0 (
            echo   ✓ 后端配置文件已创建
        )
    ) else (
        echo   ✓ 后端配置文件存在
    )
)

REM 检查Python配置
if exist "python-ai\.env.example" (
    if not exist "python-ai\.env" (
        echo   ⚠ Python配置文件缺失
        echo     复制: python-ai\.env.example 到 python-ai\.env
        copy "python-ai\.env.example" "python-ai\.env" >nul 2>&1
        if %errorlevel% equ 0 (
            echo   ✓ Python配置文件已创建
        )
    ) else (
        echo   ✓ Python配置文件存在
    )
)

REM 检查Rust配置
if exist "rust-service\.env.example" (
    if not exist "rust-service\.env" (
        echo   ⚠ Rust配置文件缺失
        echo     复制: rust-service\.env.example 到 rust-service\.env
        copy "rust-service\.env.example" "rust-service\.env" >nul 2>&1
        if %errorlevel% equ 0 (
            echo   ✓ Rust配置文件已创建
        )
    ) else (
        echo   ✓ Rust配置文件存在
    )
)

echo.

REM ========================================
REM [6/6] 重启所有服务
REM ========================================
echo [6/6] 重启所有服务...
echo.

set /p RESTART="是否立即重启所有服务? (Y/N): "

if /i "%RESTART%"=="Y" (
    echo.
    echo 正在启动服务...
    echo.
    
    REM 调用启动脚本
    if exist "scripts\start-all-services.bat" (
        call "scripts\start-all-services.bat"
    ) else (
        echo ✗ 启动脚本未找到
        echo   请手动运行: scripts\start-all-services.bat
    )
) else (
    echo.
    echo 跳过服务启动
    echo 手动启动: 运行 scripts\start-all-services.bat
)

echo.

REM ========================================
REM 修复完成
REM ========================================
echo ========================================
echo   应急修复完成！
echo ========================================
echo.

echo 修复摘要:
echo   [✓] 端口清理完成
echo   [✓] 临时文件已清理
echo   [✓] 数据库连接已检查
echo   [✓] 依赖完整性已验证
echo   [✓] 配置文件已检查
echo.

echo 常见问题解决方案:
echo   1. 端口被占用: 已自动清理
echo   2. 缓存问题: 已清理所有缓存
echo   3. 数据库连接失败: 已刷新权限
echo   4. 依赖缺失: 请按提示安装
echo   5. 配置文件缺失: 已自动创建
echo.

echo 如果问题仍然存在:
echo   1. 检查防火墙设置
echo   2. 检查杀毒软件是否拦截
echo   3. 重启计算机
echo   4. 查看日志文件: logs\*.log
echo   5. 联系技术支持
echo.

pause
