@echo off
chcp 65001 >nul
echo ========================================
echo   Python AI服务 - 虚拟环境设置
echo ========================================
echo.

cd /d %~dp0

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python，请先安装Python 3.9+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] 检查Python版本...
python --version
echo.

REM 检查虚拟环境是否已存在
if exist "venv" (
    echo [提示] 虚拟环境已存在
    echo.
    echo 选择操作:
    echo   1. 重新创建虚拟环境 (删除现有环境)
    echo   2. 激活现有虚拟环境
    echo   3. 退出
    echo.
    set /p choice=请输入选项 (1/2/3): 
    
    if "!choice!"=="1" (
        echo.
        echo [2/3] 删除现有虚拟环境...
        rmdir /s /q venv
        if %errorlevel% neq 0 (
            echo [错误] 删除虚拟环境失败，请手动删除 venv 目录
            pause
            exit /b 1
        )
        echo [√] 已删除
        echo.
        goto :create_venv
    ) else if "!choice!"=="2" (
        echo.
        echo [提示] 激活虚拟环境...
        call venv\Scripts\activate.bat
        echo.
        echo [√] 虚拟环境已激活
        echo.
        echo 当前Python路径: 
        where python
        echo.
        goto :install_deps
    ) else (
        exit /b 0
    )
) else (
    :create_venv
    echo [2/3] 创建虚拟环境...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo [√] 虚拟环境创建成功
    echo.
)

REM 激活虚拟环境
echo [3/3] 激活虚拟环境...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [错误] 激活虚拟环境失败
    pause
    exit /b 1
)
echo [√] 虚拟环境已激活
echo.

:install_deps
REM 升级pip
echo [额外] 升级pip...
python -m pip install --upgrade pip
echo.

REM 安装依赖
echo [额外] 安装Python依赖...
if exist "requirements.txt" (
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [警告] 部分依赖安装可能失败，请检查网络连接
        echo 建议使用国内镜像: pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    ) else (
        echo [√] 依赖安装成功
    )
) else (
    echo [错误] 未找到 requirements.txt 文件
    pause
    exit /b 1
)

echo.
echo ========================================
echo   设置完成！
echo ========================================
echo.
echo 虚拟环境位置: %CD%\venv
echo.
echo 使用说明:
echo   1. 激活虚拟环境: venv\Scripts\activate
echo   2. 运行服务: python app.py 或 python grpc_server.py
echo   3. 退出虚拟环境: deactivate
echo.
echo 注意: 每次使用Python服务前，请先激活虚拟环境
echo.
pause


