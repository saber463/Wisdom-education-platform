#!/bin/bash
# Python AI服务停止脚本
# 功能：优雅停止Python AI服务

set -e

# 配置
SERVICE_NAME="Python AI服务"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/ai-service-startup.log"
PID_FILE="$SCRIPT_DIR/ai-service.pid"

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
log_info "  $SERVICE_NAME 停止脚本"
log_info "========================================="

# 检查PID文件是否存在
if [ ! -f "$PID_FILE" ]; then
    log_warn "PID文件不存在，服务可能未运行"
    
    # 尝试查找运行中的AI服务进程
    local pids=$(pgrep -f "python.*app.py" || true)
    if [ -n "$pids" ]; then
        log_info "发现运行中的AI服务进程: $pids"
        for pid in $pids; do
            log_info "停止进程 $pid..."
            kill -TERM "$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null
        done
        log_info "所有AI服务进程已停止"
    else
        log_info "未发现运行中的AI服务进程"
    fi
    exit 0
fi

# 读取PID
PID=$(cat "$PID_FILE")
log_info "读取PID: $PID"

# 检查进程是否存在
if ! ps -p "$PID" > /dev/null 2>&1; then
    log_warn "进程 $PID 不存在，清理PID文件"
    rm -f "$PID_FILE"
    exit 0
fi

# 检查是否是AI服务进程
if ! ps -p "$PID" -o cmd= | grep -q "app.py"; then
    log_warn "进程 $PID 不是AI服务，清理PID文件"
    rm -f "$PID_FILE"
    exit 0
fi

# 优雅停止服务
log_info "正在停止 $SERVICE_NAME (PID: $PID)..."

# 发送TERM信号
kill -TERM "$PID" 2>/dev/null

# 等待进程退出
local max_wait=10
local waited=0

while [ $waited -lt $max_wait ]; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        log_info "$SERVICE_NAME 已停止 ✓"
        rm -f "$PID_FILE"
        log_info "========================================="
        exit 0
    fi
    sleep 1
    waited=$((waited + 1))
    echo -n "."
done

echo ""
log_warn "进程未在规定时间内退出，强制停止..."

# 强制停止
kill -KILL "$PID" 2>/dev/null

# 再次检查
sleep 1
if ! ps -p "$PID" > /dev/null 2>&1; then
    log_info "$SERVICE_NAME 已强制停止 ✓"
    rm -f "$PID_FILE"
else
    log_error "无法停止进程 $PID"
    exit 1
fi

log_info "========================================="
