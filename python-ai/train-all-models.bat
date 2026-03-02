@echo off
REM =====================================================
REM 一键训练所有AI模型脚本（Windows批处理）
REM 功能：依次训练3个AI模型（学情分析、资源推荐、口语评测）
REM 资源限制：CPU≤70%, 内存≤60%
REM =====================================================

echo ============================================================
echo 开始训练所有AI模型（CPU优化版）
echo ============================================================
echo.

REM 检查Python环境
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python环境，请先安装Python 3.10+
    pause
    exit /b 1
)

echo [1/4] 检查依赖包...
python -c "import torch; import transformers; import datasets" >nul 2>&1
if errorlevel 1 (
    echo [警告] 缺少必要依赖包，正在安装...
    pip install -r requirements-full.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    if errorlevel 1 (
        echo [错误] 依赖包安装失败
        pause
        exit /b 1
    )
)
echo [✓] 依赖包检查完成
echo.

REM 检查数据集是否已预处理
if not exist "data\processed\learning_analytics_dataset" (
    echo [2/4] 预处理数据集...
    python data_preprocess.py
    if errorlevel 1 (
        echo [错误] 数据预处理失败，请检查原始数据是否存在于 data/raw 目录
        pause
        exit /b 1
    )
    echo [✓] 数据预处理完成
) else (
    echo [2/4] 数据集已预处理，跳过
)
echo.

REM 训练模型1：学情分析
echo ============================================================
echo [3/4] 训练模型1/3：BERT学情分析模型
echo ============================================================
python train_learning_analytics.py
if errorlevel 1 (
    echo [错误] 学情分析模型训练失败
    pause
    exit /b 1
)
echo [✓] 学情分析模型训练完成
echo.

REM 训练模型2：资源推荐
echo ============================================================
echo [3/4] 训练模型2/3：BERT资源推荐模型
echo ============================================================
python train_resource_recommendation.py
if errorlevel 1 (
    echo [错误] 资源推荐模型训练失败
    pause
    exit /b 1
)
echo [✓] 资源推荐模型训练完成
echo.

REM 训练模型3：口语评测
echo ============================================================
echo [3/4] 训练模型3/3：Wav2Vec2口语评测模型
echo ============================================================
python train_speech_assessment.py
if errorlevel 1 (
    echo [错误] 口语评测模型训练失败
    pause
    exit /b 1
)
echo [✓] 口语评测模型训练完成
echo.

REM 训练完成总结
echo ============================================================
echo [4/4] 所有模型训练完成！
echo ============================================================
echo.
echo 训练结果：
echo   - 学情分析模型：./models/learning_analytics
echo   - 资源推荐模型：./models/resource_recommendation
echo   - 口语评测模型：./models/speech_assessment
echo.
echo 训练日志：
echo   - train_learning_analytics.log
echo   - train_resource_recommendation.log
echo   - train_speech_assessment.log
echo.
echo 下一步：
echo   1. 查看训练日志确认准确率是否达标（≥88%%）
echo   2. 如准确率未达标，可调整超参数或增加训练数据
echo   3. 将训练好的模型集成到Python AI服务中
echo.
pause
