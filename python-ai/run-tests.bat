@echo off
chcp 65001 >nul
echo ========================================
echo   Python AI服务 - 运行所有测试
echo ========================================
echo.

echo 正在运行属性测试...
echo.

echo [1/5] OCR识别功能测试...
python -m pytest tests/test_ocr_properties.py -v --tb=short

echo.
echo [2/5] BERT评分功能测试...
python -m pytest tests/test_bert_properties.py -v --tb=short

echo.
echo [3/5] NLP问答功能测试...
python -m pytest tests/test_nlp_properties.py -v --tb=short

echo.
echo [4/5] 推荐算法功能测试...
python -m pytest tests/test_recommendation_properties.py -v --tb=short

echo.
echo [5/5] gRPC通信功能测试...
python -m pytest tests/test_grpc_properties.py -v --tb=short

echo.
echo ========================================
echo   测试完成
echo ========================================
pause
