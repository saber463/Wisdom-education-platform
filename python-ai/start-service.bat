@echo off
chcp 65001 >nul
echo ========================================
echo   智慧教育平台 - Python AI服务启动
echo ========================================
echo.

echo [1/3] 检查依赖...
python -c "import flask, grpc, torch, transformers, pytesseract" 2>nul
if errorlevel 1 (
    echo 依赖缺失，正在安装...
    pip install -r requirements.txt
) else (
    echo 依赖检查通过 ✓
)

echo.
echo [2/3] 检查gRPC proto编译...
if not exist "ai_service_pb2.py" (
    echo 正在编译proto文件...
    python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto
    echo proto编译完成 ✓
) else (
    echo proto文件已编译 ✓
)

echo.
echo [3/3] 启动Python AI服务...
echo HTTP端口: 5000
echo gRPC端口: 50051
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

python app.py

pause
