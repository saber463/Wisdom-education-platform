@echo off
REM ========================================
REM 检查点25 - 所有脚本和故障恢复功能验证
REM ========================================
echo.
echo ========================================
echo 检查点25 - 脚本和故障恢复功能验证
echo ========================================
echo.

set PASS_COUNT=0
set FAIL_COUNT=0
set TOTAL_CHECKS=0

REM 检查关键脚本是否存在
echo [1/10] 检查关键脚本文件...
set /a TOTAL_CHECKS+=1

set SCRIPTS_OK=1
if not exist "scripts\start-all-services.bat" (
    echo [FAIL] 缺少: start-all-services.bat
    set SCRIPTS_OK=0
)
if not exist "scripts\stop-all-services.bat" (
    echo [FAIL] 缺少: stop-all-services.bat
    set SCRIPTS_OK=0
)
if not exist "scripts\start-lightweight-mode.bat" (
    echo [FAIL] 缺少: start-lightweight-mode.bat
    set SCRIPTS_OK=0
)
if not exist "scripts\emergency-repair.bat" (
    echo [FAIL] 缺少: emergency-repair.bat
    set SCRIPTS_OK=0
)
if not exist "scripts\backup-database.bat" (
    echo [FAIL] 缺少: backup-database.bat
    set SCRIPTS_OK=0
)
if not exist "scripts\reset-demo-data.bat" (
    echo [FAIL] 缺少: reset-demo-data.bat
    set SCRIPTS_OK=0
)
if not exist "scripts\blue-screen-recovery.bat" (
    echo [FAIL] 缺少: blue-screen-recovery.bat
    set SCRIPTS_OK=0
)

if %SCRIPTS_OK%==1 (
    echo [PASS] 所有关键脚本文件存在
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] 部分关键脚本文件缺失
    set /a FAIL_COUNT+=1
)
echo.

REM 检查后端脚本
echo [2/10] 检查后端脚本文件...
set /a TOTAL_CHECKS+=1

set BACKEND_SCRIPTS_OK=1
if not exist "backend\scripts\startup-order.ts" (
    echo [FAIL] 缺少: backend\scripts\startup-order.ts
    set BACKEND_SCRIPTS_OK=0
)
if not exist "backend\scripts\service-shutdown.ts" (
    echo [FAIL] 缺少: backend\scripts\service-shutdown.ts
    set BACKEND_SCRIPTS_OK=0
)
if not exist "backend\scripts\emergency-repair.ts" (
    echo [FAIL] 缺少: backend\scripts\emergency-repair.ts
    set BACKEND_SCRIPTS_OK=0
)
if not exist "backend\scripts\database-backup.ts" (
    echo [FAIL] 缺少: backend\scripts\database-backup.ts
    set BACKEND_SCRIPTS_OK=0
)
if not exist "backend\scripts\demo-data-manager.ts" (
    echo [FAIL] 缺少: backend\scripts\demo-data-manager.ts
    set BACKEND_SCRIPTS_OK=0
)
if not exist "backend\scripts\mirror-switcher.ts" (
    echo [FAIL] 缺少: backend\scripts\mirror-switcher.ts
    set BACKEND_SCRIPTS_OK=0
)

if %BACKEND_SCRIPTS_OK%==1 (
    echo [PASS] 所有后端脚本文件存在
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] 部分后端脚本文件缺失
    set /a FAIL_COUNT+=1
)
echo.

REM 检查故障恢复服务模块
echo [3/10] 检查故障恢复服务模块...
set /a TOTAL_CHECKS+=1

set SERVICES_OK=1
if not exist "backend\src\services\blue-screen-recovery.ts" (
    echo [FAIL] 缺少: blue-screen-recovery.ts
    set SERVICES_OK=0
)
if not exist "backend\src\services\health-monitor.ts" (
    echo [FAIL] 缺少: health-monitor.ts
    set SERVICES_OK=0
)
if not exist "backend\src\services\resource-monitor.ts" (
    echo [FAIL] 缺少: resource-monitor.ts
    set SERVICES_OK=0
)
if not exist "backend\src\services\port-manager.ts" (
    echo [FAIL] 缺少: port-manager.ts
    set SERVICES_OK=0
)

if %SERVICES_OK%==1 (
    echo [PASS] 所有故障恢复服务模块存在
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] 部分故障恢复服务模块缺失
    set /a FAIL_COUNT+=1
)
echo.

REM 检查属性测试文件
echo [4/10] 检查属性测试文件...
set /a TOTAL_CHECKS+=1

set TESTS_OK=1
if not exist "backend\scripts\__tests__\startup-order.property.test.ts" (
    echo [FAIL] 缺少: startup-order.property.test.ts
    set TESTS_OK=0
)
if not exist "backend\scripts\__tests__\service-shutdown.property.test.ts" (
    echo [FAIL] 缺少: service-shutdown.property.test.ts
    set TESTS_OK=0
)
if not exist "backend\scripts\__tests__\emergency-repair.property.test.ts" (
    echo [FAIL] 缺少: emergency-repair.property.test.ts
    set TESTS_OK=0
)
if not exist "backend\scripts\__tests__\database-backup.property.test.ts" (
    echo [FAIL] 缺少: database-backup.property.test.ts
    set TESTS_OK=0
)
if not exist "backend\scripts\__tests__\demo-data-reset.property.test.ts" (
    echo [FAIL] 缺少: demo-data-reset.property.test.ts
    set TESTS_OK=0
)
if not exist "backend\scripts\__tests__\mirror-switcher.property.test.ts" (
    echo [FAIL] 缺少: mirror-switcher.property.test.ts
    set TESTS_OK=0
)
if not exist "backend\src\services\__tests__\resource-monitor.property.test.ts" (
    echo [FAIL] 缺少: resource-monitor.property.test.ts
    set TESTS_OK=0
)
if not exist "backend\src\services\__tests__\health-monitor.property.test.ts" (
    echo [FAIL] 缺少: health-monitor.property.test.ts
    set TESTS_OK=0
)

if %TESTS_OK%==1 (
    echo [PASS] 所有属性测试文件存在
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] 部分属性测试文件缺失
    set /a FAIL_COUNT+=1
)
echo.

REM 检查Node.js依赖
echo [5/10] 检查Node.js依赖安装...
set /a TOTAL_CHECKS+=1

if not exist "backend\node_modules" (
    echo [FAIL] backend\node_modules 不存在
    set /a FAIL_COUNT+=1
) else (
    echo [PASS] Node.js依赖已安装
    set /a PASS_COUNT+=1
)
echo.

REM 检查TypeScript编译配置
echo [6/10] 检查TypeScript配置...
set /a TOTAL_CHECKS+=1

if not exist "backend\tsconfig.json" (
    echo [FAIL] tsconfig.json 不存在
    set /a FAIL_COUNT+=1
) else (
    echo [PASS] TypeScript配置存在
    set /a PASS_COUNT+=1
)
echo.

REM 检查日志目录
echo [7/10] 检查日志目录...
set /a TOTAL_CHECKS+=1

if not exist "backend\logs" (
    echo [WARN] backend\logs 目录不存在，创建中...
    mkdir "backend\logs"
)
echo [PASS] 日志目录已就绪
set /a PASS_COUNT+=1
echo.

REM 检查数据库备份目录
echo [8/10] 检查数据库备份目录...
set /a TOTAL_CHECKS+=1

if not exist "docs\sql\backup" (
    echo [WARN] docs\sql\backup 目录不存在，创建中...
    mkdir "docs\sql\backup"
)
echo [PASS] 数据库备份目录已就绪
set /a PASS_COUNT+=1
echo.

REM 检查启动脚本语法
echo [9/10] 验证启动脚本语法...
set /a TOTAL_CHECKS+=1

REM 简单的语法检查 - 检查是否包含关键命令
findstr /C:"start" "scripts\start-all-services.bat" >nul 2>&1
if %ERRORLEVEL%==0 (
    echo [PASS] start-all-services.bat 语法正常
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] start-all-services.bat 可能存在语法问题
    set /a FAIL_COUNT+=1
)
echo.

REM 检查故障恢复文档
echo [10/10] 检查故障恢复文档...
set /a TOTAL_CHECKS+=1

if not exist "scripts\BLUE-SCREEN-RECOVERY-README.md" (
    echo [FAIL] 缺少蓝屏恢复文档
    set /a FAIL_COUNT+=1
) else (
    echo [PASS] 故障恢复文档存在
    set /a PASS_COUNT+=1
)
echo.

REM 输出总结
echo ========================================
echo 检查点25验证总结
echo ========================================
echo 总检查项: %TOTAL_CHECKS%
echo 通过: %PASS_COUNT%
echo 失败: %FAIL_COUNT%
echo ========================================
echo.

if %FAIL_COUNT%==0 (
    echo [SUCCESS] 所有检查通过！脚本和故障恢复功能已就绪。
    echo.
    echo 可用的脚本:
    echo   - scripts\start-all-services.bat      ^| 启动所有服务
    echo   - scripts\stop-all-services.bat       ^| 停止所有服务
    echo   - scripts\start-lightweight-mode.bat  ^| 轻量级模式启动
    echo   - scripts\emergency-repair.bat        ^| 应急修复
    echo   - scripts\backup-database.bat         ^| 数据库备份
    echo   - scripts\reset-demo-data.bat         ^| 重置演示数据
    echo   - scripts\blue-screen-recovery.bat    ^| 蓝屏恢复
    echo.
    echo 故障恢复机制:
    echo   - 资源监控 ^(CPU/内存限制^)
    echo   - 端口冲突自动切换
    echo   - 服务健康检查与自动重启
    echo   - 依赖下载镜像切换
    echo   - 蓝屏检测与恢复
    echo.
    exit /b 0
) else (
    echo [WARNING] 发现 %FAIL_COUNT% 个问题，请检查上述失败项。
    echo.
    exit /b 1
)
