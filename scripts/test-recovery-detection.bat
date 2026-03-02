@echo off
REM ========================================
REM 蓝屏恢复检测测试脚本
REM Test Blue Screen Recovery Detection
REM ========================================
echo.
echo ========================================
echo   蓝屏恢复检测测试
echo   Testing Blue Screen Detection
echo ========================================
echo.

REM 创建测试标记
echo 正在创建测试标记...
echo Test flag created at %date% %time% > "%TEMP%\abnormal_shutdown.flag"
echo ✓ 测试标记已创建: %TEMP%\abnormal_shutdown.flag
echo.

REM 运行检测
echo 运行蓝屏检测...
echo.

cd /d "%~dp0\..\backend"
node -e "const { detectBlueScreenTraces } = require('./src/services/blue-screen-recovery'); detectBlueScreenTraces().then(result => { console.log('检测结果:', JSON.stringify(result, null, 2)); if (result.detected) { console.log('✓ 成功检测到蓝屏痕迹'); console.log('痕迹数量:', result.traces.length); result.traces.forEach((trace, i) => console.log(`  ${i+1}. ${trace}`)); } else { console.log('✗ 未检测到蓝屏痕迹'); } });"

echo.
echo ========================================
echo   测试完成
echo ========================================
echo.

REM 询问是否清理测试标记
set /p CLEANUP="是否清理测试标记? (Y/N): "
if /i "%CLEANUP%"=="Y" (
    del "%TEMP%\abnormal_shutdown.flag"
    echo ✓ 测试标记已清理
) else (
    echo ℹ️ 测试标记保留，可手动删除: %TEMP%\abnormal_shutdown.flag
)

echo.
pause
