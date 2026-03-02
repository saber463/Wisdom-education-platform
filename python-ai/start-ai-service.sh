#!/bin/bash
# Python AI服务启动脚本
# 功能：检测服务是否运行，自动启动Python服务，记录启动日志和PID
# 需求：5.3

set -e

# 配置
SERVICE_NAME="Python AI服务"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/ai-service-startup.log"
PID_FILE="$SCRIPT_DIR/ai-service.pid"
APP_FILE="$SCRIPT_DIR/app.py"
PORT=5000
GRPC_PORT=50051

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $@"
    log "INFO" "$@"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $@"
    log "WARN" "$@"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@"
    log "ERROR" "$@"
}

# 创建日志目录
mkdir -p "$LOG_DIR"

log_info "========================================="
log_info "  $SERVICE_NAME 启动脚本"
log_info "========================================="

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    log_error "Python3 未安装，请先安装 Python 3.10+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
log_info "Python 版本: $PYTHON_VERSION"

# 检查服务是否已在运行
check_service_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            # 检查进程是否是Python AI服务
            if ps -p "$pid" -o cmd= | grep -q "app.py"; then
                return 0  # 服务正在运行
            else
                log_warn "PID文件存在但进程不是AI服务，清理PID文件"
                rm -f "$PID_FILE"
            fi
        else
            log_warn "PID文件存在但进程不存在，清理PID文件"
            rm -f "$PID_FILE"
        fi
    fi
    
    # 检查端口是否被占用
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "端口 $PORT 已被占用"
        local port_pid=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        if ps -p "$port_pid" -o cmd= | grep -q "app.py"; then
            log_info "端口被AI服务占用，PID: $port_pid"
            echo "$port_pid" > "$PID_FILE"
            return 0  # 服务正在运行
        else
            log_error "端口被其他进程占用，PID: $port_pid"
            log_error "请先停止占用端口的进程"
            exit 1
        fi
    fi
    
    return 1  # 服务未运行
}

# 检查依赖
check_dependencies() {
    log_info "[1/4] 检查依赖..."
    
    if [ ! -f "$SCRIPT_DIR/requirements.txt" ]; then
        log_error "requirements.txt 文件不存在"
        exit 1
    fi
    
    # 检查关键依赖
    python3 -c "import flask, grpc, torch, transformers" 2>/dev/null
    if [ $? -ne 0 ]; then
        log_warn "依赖缺失，正在安装..."
        pip3 install -r "$SCRIPT_DIR/requirements.txt"
        if [ $? -ne 0 ]; then
            log_error "依赖安装失败"
            exit 1
        fi
        log_info "依赖安装完成 ✓"
    else
        log_info "依赖检查通过 ✓"
    fi
}

# 检查gRPC proto编译
check_proto_compilation() {
    log_info "[2/4] 检查gRPC proto编译..."
    
    if [ ! -f "$SCRIPT_DIR/ai_service_pb2.py" ] || [ ! -f "$SCRIPT_DIR/ai_service_pb2_grpc.py" ]; then
        log_warn "proto文件未编译，正在编译..."
        cd "$SCRIPT_DIR"
        python3 -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/ai_service.proto
        if [ $? -ne 0 ]; then
            log_error "proto编译失败"
            exit 1
        fi
        log_info "proto编译完成 ✓"
    else
        log_info "proto文件已编译 ✓"
    fi
}

# 启动服务
start_service() {
    log_info "[3/4] 启动 $SERVICE_NAME..."
    log_info "HTTP端口: $PORT"
    log_info "gRPC端口: $GRPC_PORT"
    
    cd "$SCRIPT_DIR"
    
    # 使用nohup在后台启动服务
    nohup python3 "$APP_FILE" > "$LOG_DIR/ai-service.log" 2>&1 &
    local pid=$!
    
    # 保存PID
    echo "$pid" > "$PID_FILE"
    log_info "服务已启动，PID: $pid"
    
    # 等待服务启动
    log_info "[4/4] 等待服务启动..."
    local max_wait=30
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        sleep 1
        waited=$((waited + 1))
        
        # 检查进程是否还在运行
        if ! ps -p "$pid" > /dev/null 2>&1; then
            log_error "服务启动失败，进程已退出"
            log_error "请查看日志: $LOG_DIR/ai-service.log"
            rm -f "$PID_FILE"
            exit 1
        fi
        
        # 检查HTTP端口
        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_info "HTTP服务已就绪 (端口 $PORT) ✓"
            
            # 检查健康状态
            if curl -s -f "http://localhost:$PORT/health" > /dev/null 2>&1; then
                log_info "健康检查通过 ✓"
                log_info "========================================="
                log_info "$SERVICE_NAME 启动成功！"
                log_info "PID: $pid"
                log_info "HTTP端口: $PORT"
                log_info "gRPC端口: $GRPC_PORT"
                log_info "日志文件: $LOG_DIR/ai-service.log"
                log_info "========================================="
                return 0
            fi
        fi
        
        echo -n "."
    done
    
    echo ""
    log_warn "服务启动超时，但进程仍在运行"
    log_warn "请手动检查服务状态: curl http://localhost:$PORT/health"
    return 0
}

# 主流程
main() {
    # 检查服务是否已在运行
    if check_service_running; then
        local pid=$(cat "$PID_FILE")
        log_info "$SERVICE_NAME 已在运行，PID: $pid"
        log_info "如需重启，请先运行: ./stop-ai-service.sh"
        exit 0
    fi
    
    # 检查依赖
    check_dependencies
    
    # 检查proto编译
    check_proto_compilation
    
    # 启动服务
    start_service
}

# 执行主流程
main
