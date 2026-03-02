@echo off
REM 【国赛专用】AI模型批量训练脚本
echo ========================================
echo   智慧教育平台 - AI模型批量训练
echo ========================================
echo.

REM 检查Python环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Python未安装
    echo   请先安装Python 3.10+
    pause
    exit /b 1
)

echo ✓ Python环境检测通过
echo.

REM 检查GPU环境
echo 检测GPU环境...
python check_gpu.py
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ GPU检测失败，将使用CPU训练（速度极慢）
    echo.
    choice /C YN /M "是否继续使用CPU训练"
    if errorlevel 2 exit /b 1
)

echo.
echo ========================================
echo   开始训练所有模型
echo ========================================
echo.

REM 创建日志目录
if not exist logs mkdir logs

REM 训练所有模型
python train_all_models.py

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ 所有模型训练完成！
    echo ========================================
    echo.
    echo 模型保存位置:
    echo   - models/learning_analytics/best_model
    echo   - models/resource_recommendation/best_model
    echo   - models/speech_assessment/best_model
    echo.
) else (
    echo.
    echo ========================================
    echo   ✗ 训练过程中出现错误
    echo ========================================
    echo.
    echo 请查看日志文件:
    echo   - logs/training_learning_analytics.log
    echo   - logs/training_resource_recommendation.log
    echo   - logs/training_speech_assessment.log
    echo.
)

pause
