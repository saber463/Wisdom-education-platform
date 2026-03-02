@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   智慧教育平台 - 服务状态检查
echo ========================================
echo.

REM 检查curl是否可用
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] curl 命令未找到，无法进行健康检查
    echo 请安装 curl 或使用其他工具进行健康检查
    echo.
    set CURL_AVAILABLE=0
) else (
    set CURL_AVAILABLE=1
)

echo ========================================
echo   一、端口占用检查
echo ========================================
echo.

set PORT_COUNT=0
set PORT_UP=0
set PORT_DOWN=0

REM 定义端口和服务映射
set "ports=3306:MySQL数据库 3000:Node.js后端 5000:Python AI服务 5173:Vue3前端 8080:Rust降级服务 50051:gRPC服务"

for %%p in (3306 3000 5000 5173 8080 50051) do (
    set /a PORT_COUNT+=1
    set PORT_NAME=
    if "%%p"=="3306" set PORT_NAME=MySQL数据库
    if "%%p"=="3000" set PORT_NAME=Node.js后端
    if "%%p"=="5000" set PORT_NAME=Python AI服务
    if "%%p"=="5173" set PORT_NAME=Vue3前端
    if "%%p"=="8080" set PORT_NAME=Rust降级服务
    if "%%p"=="50051" set PORT_NAME=gRPC服务
    
    netstat -ano | findstr ":%%p" | findstr "LISTENING" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [√] 端口 %%p (!PORT_NAME!) - 已占用 ^(正常^)
        set /a PORT_UP+=1
    ) else (
        echo [!] 端口 %%p (!PORT_NAME!) - 未占用 ^(服务可能未启动^)
        set /a PORT_DOWN+=1
    )
)

echo.
echo 端口统计: 总计 %PORT_COUNT% 个，已占用 %PORT_UP% 个，未占用 %PORT_DOWN% 个
echo.

echo ========================================
echo   二、健康检查接口测试
echo ========================================
echo.

if %CURL_AVAILABLE%==0 (
    echo [跳过] curl 不可用，跳过健康检查
    goto :summary
)

set HEALTH_CHECK_COUNT=0
set HEALTH_CHECK_PASS=0
set HEALTH_CHECK_FAIL=0

REM 检查后端健康接口 (3000)
echo [1/4] 检查后端健康接口 (http://localhost:3000/health)...
curl -s -f -m 5 http://localhost:3000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo     [√] 后端服务健康检查通过
    set /a HEALTH_CHECK_PASS+=1
    curl -s http://localhost:3000/health
    echo.
) else (
    echo     [×] 后端服务健康检查失败 ^(服务可能未启动或接口不可用^)
    set /a HEALTH_CHECK_FAIL+=1
)
set /a HEALTH_CHECK_COUNT+=1
echo.

REM 检查Python AI服务健康接口 (5000)
echo [2/4] 检查Python AI服务健康接口 (http://localhost:5000/health)...
curl -s -f -m 5 http://localhost:5000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo     [√] Python AI服务健康检查通过
    set /a HEALTH_CHECK_PASS+=1
    curl -s http://localhost:5000/health
    echo.
) else (
    echo     [×] Python AI服务健康检查失败 ^(服务可能未启动或接口不可用^)
    set /a HEALTH_CHECK_FAIL+=1
)
set /a HEALTH_CHECK_COUNT+=1
echo.

REM 检查Rust降级服务健康接口 (8080)
echo [3/4] 检查Rust降级服务健康接口 (http://localhost:8080/health)...
curl -s -f -m 5 http://localhost:8080/health >nul 2>&1
if !errorlevel! equ 0 (
    echo     [√] Rust降级服务健康检查通过
    set /a HEALTH_CHECK_PASS+=1
    curl -s http://localhost:8080/health
    echo.
) else (
    echo     [×] Rust降级服务健康检查失败 ^(服务可能未启动或接口不可用^)
    set /a HEALTH_CHECK_FAIL+=1
)
set /a HEALTH_CHECK_COUNT+=1
echo.

REM 检查前端服务 (5173) - 尝试访问根路径
echo [4/4] 检查前端服务 (http://localhost:5173)...
curl -s -f -m 5 http://localhost:5173 >nul 2>&1
if !errorlevel! equ 0 (
    echo     [√] 前端服务可访问
    set /a HEALTH_CHECK_PASS+=1
) else (
    echo     [×] 前端服务不可访问 ^(服务可能未启动^)
    set /a HEALTH_CHECK_FAIL+=1
)
set /a HEALTH_CHECK_COUNT+=1
echo.

:summary
echo ========================================
echo   检查结果汇总
echo ========================================
echo.
echo 端口检查:
echo   - 总计: %PORT_COUNT% 个端口
echo   - 已占用: %PORT_UP% 个
echo   - 未占用: %PORT_DOWN% 个
echo.

if %CURL_AVAILABLE%==1 (
    echo 健康检查:
    echo   - 总计: %HEALTH_CHECK_COUNT% 个服务
    echo   - 通过: %HEALTH_CHECK_PASS% 个
    echo   - 失败: %HEALTH_CHECK_FAIL% 个
    echo.
)

if %PORT_DOWN% gtr 0 (
    echo [提示] 有 %PORT_DOWN% 个端口未占用，相关服务可能未启动
    echo        建议运行 start-services.bat 启动所有服务
    echo.
)

if %CURL_AVAILABLE%==1 (
    if %HEALTH_CHECK_FAIL% gtr 0 (
        echo [警告] 有 %HEALTH_CHECK_FAIL% 个服务健康检查失败
        echo        请检查服务是否正常运行
        echo.
    ) else if %HEALTH_CHECK_PASS% equ %HEALTH_CHECK_COUNT% (
        echo [√] 所有服务健康检查通过！
        echo.
    )
)

echo ========================================
echo   检查完成
echo ========================================
echo.
pause
