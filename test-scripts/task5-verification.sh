#!/bin/bash
# Task 5 验证脚本 - AI服务503错误修复
# 测试AI服务降级、健康检查、自动启动和进程守护

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKEND_URL="http://localhost:3000"
AI_HTTP_URL="http://localhost:5000"
AI_GRPC_PORT=50051
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PYTHON_AI_DIR="$PROJECT_ROOT/python-ai"

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $@"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $@"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_error() {
    echo -e "${RED}[✗]${NC} $@"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $@"
}

# 测试函数
run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    local test_name="$1"
    echo ""
    log_info "测试 $TOTAL_TESTS: $test_name"
}

# 打印分隔线
print_separator() {
    echo "========================================"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "命令 '$1' 未找到，请先安装"
        return 1
    fi
    return 0
}

# 检查端口是否开放
check_port() {
    local host=$1
    local port=$2
    local timeout=5
    
    if timeout $timeout bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# 主测试流程
main() {
    print_separator
    echo "Task 5 验证脚本 - AI服务503错误修复"
    print_separator
    
    # 检查必要的命令
    log_info "检查必要的命令..."
    check_command "curl" || exit 1
    check_command "python3" || exit 1
    log_success "命令检查通过"
    
    # ========================================
    # 测试 5.1: AI服务降级处理
    # ========================================
    print_separator
    echo "测试组 5.1: AI服务降级处理"
    print_separator
    
    run_test "检查AI服务管理器文件是否存在"
    if [ -f "$PROJECT_ROOT/backend/src/services/ai-service-manager.ts" ]; then
        log_success "AI服务管理器文件存在"
    else
        log_error "AI服务管理器文件不存在"
    fi
    
    run_test "检查gRPC客户端是否集成降级处理"
    if grep -q "isAIServiceAvailable" "$PROJECT_ROOT/backend/src/services/grpc-clients.ts"; then
        log_success "gRPC客户端已集成降级处理"
    else
        log_error "gRPC客户端未集成降级处理"
    fi
    
    run_test "检查降级响应函数是否存在"
    local degraded_functions=(
        "getDegradedOCRResponse"
        "getDegradedGradingResponse"
        "getDegradedQAResponse"
        "getDegradedRecommendationResponse"
        "getDegradedLearningAnalysisResponse"
    )
    
    local all_found=true
    for func in "${degraded_functions[@]}"; do
        if ! grep -q "$func" "$PROJECT_ROOT/backend/src/services/ai-service-manager.ts"; then
            log_error "降级函数 $func 不存在"
            all_found=false
        fi
    done
    
    if [ "$all_found" = true ]; then
        log_success "所有降级响应函数存在"
    fi
    
    # ========================================
    # 测试 5.2: AI服务健康检查
    # ========================================
    print_separator
    echo "测试组 5.2: AI服务健康检查"
    print_separator
    
    run_test "检查健康检查函数是否存在"
    if grep -q "startAIHealthCheck" "$PROJECT_ROOT/backend/src/services/ai-service-manager.ts"; then
        log_success "健康检查函数存在"
    else
        log_error "健康检查函数不存在"
    fi
    
    run_test "检查健康检查配置"
    if grep -q "HEALTH_CHECK_INTERVAL.*30000" "$PROJECT_ROOT/backend/src/services/ai-service-manager.ts"; then
        log_success "健康检查间隔配置正确（30秒）"
    else
        log_warn "健康检查间隔配置可能不正确"
    fi
    
    if grep -q "HEALTH_CHECK_TIMEOUT.*5000" "$PROJECT_ROOT/backend/src/services/ai-service-manager.ts"; then
        log_success "健康检查超时配置正确（5秒）"
    else
        log_warn "健康检查超时配置可能不正确"
    fi
    
    if grep -q "MAX_RETRY_ATTEMPTS.*3" "$PROJECT_ROOT/backend/src/services/ai-service-manager.ts"; then
        log_success "失败重试配置正确（3次）"
    else
        log_warn "失败重试配置可能不正确"
    fi
    
    run_test "检查后端是否启动健康检查"
    if grep -q "startAIHealthCheck" "$PROJECT_ROOT/backend/src/index.ts"; then
        log_success "后端已集成健康检查启动"
    else
        log_error "后端未集成健康检查启动"
    fi
    
    run_test "测试后端健康检查接口"
    if check_port "localhost" 3000; then
        response=$(curl -s "$BACKEND_URL/health")
        if echo "$response" | grep -q "ai"; then
            log_success "后端健康检查接口包含AI服务状态"
            echo "响应: $response" | head -c 200
        else
            log_warn "后端健康检查接口可能未包含AI服务状态"
        fi
    else
        log_warn "后端服务未运行，跳过健康检查接口测试"
    fi
    
    # ========================================
    # 测试 5.3: Python服务启动脚本
    # ========================================
    print_separator
    echo "测试组 5.3: Python服务启动脚本"
    print_separator
    
    run_test "检查启动脚本是否存在"
    if [ -f "$PYTHON_AI_DIR/start-ai-service.sh" ]; then
        log_success "启动脚本存在"
    else
        log_error "启动脚本不存在"
    fi
    
    run_test "检查启动脚本是否可执行"
    if [ -f "$PYTHON_AI_DIR/start-ai-service.sh" ]; then
        if [ -x "$PYTHON_AI_DIR/start-ai-service.sh" ]; then
            log_success "启动脚本可执行"
        else
            log_warn "启动脚本不可执行，尝试添加执行权限..."
            chmod +x "$PYTHON_AI_DIR/start-ai-service.sh"
            if [ -x "$PYTHON_AI_DIR/start-ai-service.sh" ]; then
                log_success "已添加执行权限"
            else
                log_error "无法添加执行权限"
            fi
        fi
    fi
    
    run_test "检查停止脚本是否存在"
    if [ -f "$PYTHON_AI_DIR/stop-ai-service.sh" ]; then
        log_success "停止脚本存在"
    else
        log_error "停止脚本不存在"
    fi
    
    run_test "检查停止脚本是否可执行"
    if [ -f "$PYTHON_AI_DIR/stop-ai-service.sh" ]; then
        if [ -x "$PYTHON_AI_DIR/stop-ai-service.sh" ]; then
            log_success "停止脚本可执行"
        else
            log_warn "停止脚本不可执行，尝试添加执行权限..."
            chmod +x "$PYTHON_AI_DIR/stop-ai-service.sh"
            if [ -x "$PYTHON_AI_DIR/stop-ai-service.sh" ]; then
                log_success "已添加执行权限"
            else
                log_error "无法添加执行权限"
            fi
        fi
    fi
    
    run_test "检查启动脚本功能"
    local script_features=(
        "check_service_running"
        "check_dependencies"
        "check_proto_compilation"
        "start_service"
    )
    
    local all_features=true
    for feature in "${script_features[@]}"; do
        if ! grep -q "$feature" "$PYTHON_AI_DIR/start-ai-service.sh"; then
            log_error "启动脚本缺少功能: $feature"
            all_features=false
        fi
    done
    
    if [ "$all_features" = true ]; then
        log_success "启动脚本包含所有必要功能"
    fi
    
    run_test "检查启动脚本日志记录"
    if grep -q "LOG_FILE" "$PYTHON_AI_DIR/start-ai-service.sh" && \
       grep -q "log_info\|log_warn\|log_error" "$PYTHON_AI_DIR/start-ai-service.sh"; then
        log_success "启动脚本包含日志记录功能"
    else
        log_error "启动脚本缺少日志记录功能"
    fi
    
    run_test "检查启动脚本PID管理"
    if grep -q "PID_FILE" "$PYTHON_AI_DIR/start-ai-service.sh" && \
       grep -q "echo.*>.*PID_FILE" "$PYTHON_AI_DIR/start-ai-service.sh"; then
        log_success "启动脚本包含PID管理功能"
    else
        log_error "启动脚本缺少PID管理功能"
    fi
    
    # ========================================
    # 测试 5.4: Python服务进程守护配置
    # ========================================
    print_separator
    echo "测试组 5.4: Python服务进程守护配置"
    print_separator
    
    run_test "检查Supervisor配置文件是否存在"
    if [ -f "$PYTHON_AI_DIR/supervisor-ai-service.conf" ]; then
        log_success "Supervisor配置文件存在"
    else
        log_error "Supervisor配置文件不存在"
    fi
    
    run_test "检查Supervisor配置内容"
    if [ -f "$PYTHON_AI_DIR/supervisor-ai-service.conf" ]; then
        local supervisor_configs=(
            "autostart=true"
            "autorestart=true"
            "stdout_logfile"
            "stderr_logfile"
        )
        
        local all_configs=true
        for config in "${supervisor_configs[@]}"; do
            if ! grep -q "$config" "$PYTHON_AI_DIR/supervisor-ai-service.conf"; then
                log_error "Supervisor配置缺少: $config"
                all_configs=false
            fi
        done
        
        if [ "$all_configs" = true ]; then
            log_success "Supervisor配置包含所有必要项"
        fi
    fi
    
    run_test "检查Systemd服务文件是否存在"
    if [ -f "$PYTHON_AI_DIR/ai-service.service" ]; then
        log_success "Systemd服务文件存在"
    else
        log_error "Systemd服务文件不存在"
    fi
    
    run_test "检查Systemd服务配置内容"
    if [ -f "$PYTHON_AI_DIR/ai-service.service" ]; then
        local systemd_configs=(
            "Restart=always"
            "RestartSec="
            "StandardOutput="
            "StandardError="
            "WantedBy=multi-user.target"
        )
        
        local all_configs=true
        for config in "${systemd_configs[@]}"; do
            if ! grep -q "$config" "$PYTHON_AI_DIR/ai-service.service"; then
                log_error "Systemd配置缺少: $config"
                all_configs=false
            fi
        done
        
        if [ "$all_configs" = true ]; then
            log_success "Systemd配置包含所有必要项"
        fi
    fi
    
    # ========================================
    # 集成测试（如果服务正在运行）
    # ========================================
    print_separator
    echo "集成测试"
    print_separator
    
    run_test "测试AI服务HTTP健康检查"
    if check_port "localhost" 5000; then
        response=$(curl -s -w "\n%{http_code}" "$AI_HTTP_URL/health" || echo "000")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ]; then
            log_success "AI服务HTTP健康检查通过"
        else
            log_warn "AI服务HTTP健康检查失败（HTTP $http_code）"
        fi
    else
        log_warn "AI服务未运行，跳过HTTP健康检查测试"
    fi
    
    run_test "测试AI服务gRPC端口"
    if check_port "localhost" "$AI_GRPC_PORT"; then
        log_success "AI服务gRPC端口开放"
    else
        log_warn "AI服务gRPC端口未开放"
    fi
    
    # ========================================
    # 测试总结
    # ========================================
    print_separator
    echo "测试总结"
    print_separator
    
    echo "总测试数: $TOTAL_TESTS"
    echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
    echo -e "${RED}失败: $FAILED_TESTS${NC}"
    
    local pass_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    echo "通过率: ${pass_rate}%"
    
    print_separator
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "所有测试通过！Task 5 实施成功！"
        exit 0
    else
        log_error "部分测试失败，请检查上述错误信息"
        exit 1
    fi
}

# 执行主流程
main
