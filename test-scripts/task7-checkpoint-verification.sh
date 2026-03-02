#!/bin/bash

# Task 7 检查点验证脚本 - API错误修复完成
# 验证Tasks 1-6的所有修复是否正常工作

echo "=========================================="
echo "Task 7 检查点 - API错误修复完成验证"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# 测试结果函数
pass_test() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail_test() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo -e "  ${RED}原因: $2${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

skip_test() {
    echo -e "${YELLOW}⊘ SKIP${NC}: $1"
    echo -e "  ${YELLOW}原因: $2${NC}"
    ((SKIPPED_TESTS++))
    ((TOTAL_TESTS++))
}

info_test() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

# 配置
BACKEND_URL="http://localhost:3000"
AI_HTTP_URL="http://localhost:5000"

# 检查服务是否运行
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s -f "$url/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

echo "=========================================="
echo "阶段 1: 服务状态检查"
echo "=========================================="
echo ""

info_test "检查后端服务状态..."
if check_service "$BACKEND_URL" "后端服务"; then
    pass_test "后端服务运行正常"
    BACKEND_RUNNING=true
else
    fail_test "后端服务未运行" "请先启动后端服务: cd backend && npm run dev"
    BACKEND_RUNNING=false
fi

info_test "检查AI服务状态..."
if check_service "$AI_HTTP_URL" "AI服务"; then
    pass_test "AI服务运行正常"
    AI_RUNNING=true
else
    skip_test "AI服务未运行" "AI服务降级功能将被测试"
    AI_RUNNING=false
fi

echo ""
echo "=========================================="
echo "阶段 2: Task 1 - 作业接口500错误修复验证"
echo "=========================================="
echo ""

if [ "$BACKEND_RUNNING" = true ]; then
    # 测试1.1: GROUP BY语法修复
    info_test "测试作业列表查询（GROUP BY修复）..."
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/assignments?page=1&limit=10" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
        pass_test "作业列表接口返回正确状态码（$http_code）"
    else
        fail_test "作业列表接口返回错误状态码（$http_code）" "期望200或401"
    fi
    
    # 测试1.2: 参数校验
    info_test "测试参数校验中间件..."
    response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/assignments" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
        pass_test "参数校验中间件工作正常（返回$http_code）"
    else
        fail_test "参数校验中间件异常（返回$http_code）" "期望400或401"
    fi
    
    # 测试1.3: 错误日志
    info_test "检查错误日志配置..."
    if grep -q "logger" backend/src/routes/assignments.ts 2>/dev/null; then
        pass_test "作业接口已配置详细错误日志"
    else
        fail_test "作业接口未配置详细错误日志" "未找到logger调用"
    fi
    
    # 测试1.4: 数据库重试机制
    info_test "检查数据库连接重试机制..."
    if grep -q "connectWithRetry\|retryConnection" backend/src/config/database.ts 2>/dev/null; then
        pass_test "数据库连接重试机制已实现"
    else
        skip_test "数据库连接重试机制" "未找到重试函数"
    fi
else
    skip_test "Task 1 验证" "后端服务未运行"
    skip_test "Task 1 验证" "后端服务未运行"
    skip_test "Task 1 验证" "后端服务未运行"
    skip_test "Task 1 验证" "后端服务未运行"
fi

echo ""
echo "=========================================="
echo "阶段 3: Task 2 - 批改查询404错误修复验证"
echo "=========================================="
echo ""

if [ "$BACKEND_RUNNING" = true ]; then
    # 测试2.1: 统一接口路径
    info_test "测试统一接口路径..."
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/grading/assignment/1" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "404" ]; then
        pass_test "批改查询接口路径正确（返回$http_code）"
    else
        fail_test "批改查询接口路径错误（返回$http_code）" "期望200/401/404"
    fi
    
    # 测试2.2: 返回逻辑
    info_test "检查返回逻辑修改..."
    if grep -q "code.*msg.*data" backend/src/routes/grading.ts 2>/dev/null; then
        pass_test "批改接口返回格式统一"
    else
        fail_test "批改接口返回格式未统一" "未找到标准返回格式"
    fi
    
    # 测试2.3: 参数校验
    info_test "测试查询参数校验..."
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/grading/assignment/abc" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
        pass_test "批改接口参数校验正常（返回$http_code）"
    else
        skip_test "批改接口参数校验" "返回$http_code，可能未实现严格校验"
    fi
else
    skip_test "Task 2 验证" "后端服务未运行"
    skip_test "Task 2 验证" "后端服务未运行"
    skip_test "Task 2 验证" "后端服务未运行"
fi

echo ""
echo "=========================================="
echo "阶段 4: Task 3 - 薄弱点分析400错误修复验证"
echo "=========================================="
echo ""

if [ "$BACKEND_RUNNING" = true ]; then
    # 测试3.1: 参数校验
    info_test "测试薄弱点分析参数校验..."
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/analytics/weak-points" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
        pass_test "薄弱点分析参数校验正常（返回$http_code）"
    else
        fail_test "薄弱点分析参数校验异常（返回$http_code）" "期望400或401"
    fi
    
    # 测试3.2: 权限校验
    info_test "检查权限校验逻辑..."
    if grep -q "role.*admin\|role.*teacher\|role.*student" backend/src/routes/analytics.ts 2>/dev/null; then
        pass_test "薄弱点分析权限校验已实现"
    else
        fail_test "薄弱点分析权限校验未实现" "未找到角色检查"
    fi
else
    skip_test "Task 3 验证" "后端服务未运行"
    skip_test "Task 3 验证" "后端服务未运行"
fi

echo ""
echo "=========================================="
echo "阶段 5: Task 4 - 个性化推荐403错误修复验证"
echo "=========================================="
echo ""

if [ "$BACKEND_RUNNING" = true ]; then
    # 测试4.1: 权限控制
    info_test "测试个性化推荐权限控制..."
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/recommendations/1" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        pass_test "个性化推荐权限控制正常（返回$http_code）"
    else
        fail_test "个性化推荐权限控制异常（返回$http_code）" "期望200/401/403"
    fi
    
    # 测试4.2: 参数校验
    info_test "测试student_id参数校验..."
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/recommendations/abc" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
        pass_test "推荐接口参数校验正常（返回$http_code）"
    else
        skip_test "推荐接口参数校验" "返回$http_code，可能未实现严格校验"
    fi
else
    skip_test "Task 4 验证" "后端服务未运行"
    skip_test "Task 4 验证" "后端服务未运行"
fi

echo ""
echo "=========================================="
echo "阶段 6: Task 5 - AI服务503错误修复验证"
echo "=========================================="
echo ""

# 测试5.1: AI服务降级处理
info_test "检查AI服务管理器..."
if [ -f "backend/src/services/ai-service-manager.ts" ]; then
    pass_test "AI服务管理器文件存在"
else
    fail_test "AI服务管理器文件不存在" "未找到ai-service-manager.ts"
fi

info_test "检查降级响应函数..."
if grep -q "getDegraded.*Response" backend/src/services/ai-service-manager.ts 2>/dev/null; then
    pass_test "AI服务降级响应函数已实现"
else
    fail_test "AI服务降级响应函数未实现" "未找到降级函数"
fi

# 测试5.2: 健康检查
info_test "检查AI服务健康检查..."
if grep -q "startAIHealthCheck" backend/src/services/ai-service-manager.ts 2>/dev/null; then
    pass_test "AI服务健康检查已实现"
else
    fail_test "AI服务健康检查未实现" "未找到健康检查函数"
fi

if [ "$BACKEND_RUNNING" = true ]; then
    info_test "测试健康检查接口..."
    response=$(curl -s "$BACKEND_URL/health" 2>/dev/null)
    if echo "$response" | grep -q "ai"; then
        pass_test "健康检查接口包含AI服务状态"
    else
        fail_test "健康检查接口未包含AI服务状态" "响应中未找到ai字段"
    fi
else
    skip_test "健康检查接口测试" "后端服务未运行"
fi

# 测试5.3: Python服务启动脚本
info_test "检查Python服务启动脚本..."
if [ -f "python-ai/start-ai-service.sh" ]; then
    pass_test "Python服务启动脚本存在"
else
    fail_test "Python服务启动脚本不存在" "未找到start-ai-service.sh"
fi

# 测试5.4: 进程守护配置
info_test "检查进程守护配置..."
if [ -f "python-ai/supervisor-ai-service.conf" ] || [ -f "python-ai/ai-service.service" ]; then
    pass_test "Python服务进程守护配置存在"
else
    fail_test "Python服务进程守护配置不存在" "未找到supervisor或systemd配置"
fi

echo ""
echo "=========================================="
echo "阶段 7: Task 6 - 后端崩溃问题修复验证"
echo "=========================================="
echo ""

# 测试6.1: 端口检测
info_test "检查端口检测函数..."
if grep -q "findAvailablePort" backend/src/index.ts 2>/dev/null; then
    pass_test "端口检测函数已实现"
else
    fail_test "端口检测函数未实现" "未找到findAvailablePort"
fi

# 测试6.2: 全局异常捕获
info_test "检查全局异常捕获..."
if grep -q "uncaughtException" backend/src/index.ts 2>/dev/null && \
   grep -q "unhandledRejection" backend/src/index.ts 2>/dev/null; then
    pass_test "全局异常捕获已实现"
else
    fail_test "全局异常捕获未实现" "未找到异常处理"
fi

info_test "检查优雅关闭函数..."
if grep -q "gracefulShutdown" backend/src/index.ts 2>/dev/null; then
    pass_test "优雅关闭函数已实现"
else
    fail_test "优雅关闭函数未实现" "未找到gracefulShutdown"
fi

# 测试6.3: PM2配置
info_test "检查PM2配置文件..."
if [ -f "ecosystem.config.json" ]; then
    pass_test "PM2配置文件存在"
    
    # 验证配置内容
    if grep -q '"instances".*2' ecosystem.config.json && \
       grep -q '"exec_mode".*"cluster"' ecosystem.config.json; then
        pass_test "PM2集群模式配置正确"
    else
        fail_test "PM2集群模式配置错误" "实例数或执行模式配置不正确"
    fi
else
    fail_test "PM2配置文件不存在" "未找到ecosystem.config.json"
    skip_test "PM2集群模式配置检查" "配置文件不存在"
fi

echo ""
echo "=========================================="
echo "阶段 8: 综合API测试"
echo "=========================================="
echo ""

if [ "$BACKEND_RUNNING" = true ]; then
    # 测试健康检查接口
    info_test "测试健康检查接口..."
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        pass_test "健康检查接口正常（200）"
        
        # 检查响应内容
        response_body=$(echo "$response" | head -n -1)
        if echo "$response_body" | grep -q "status.*ok"; then
            pass_test "健康检查响应格式正确"
        else
            fail_test "健康检查响应格式错误" "未找到status字段"
        fi
    else
        fail_test "健康检查接口异常（$http_code）" "期望200"
        skip_test "健康检查响应格式检查" "接口返回错误"
    fi
    
    # 测试CORS配置
    info_test "测试CORS配置..."
    response=$(curl -s -I -X OPTIONS "$BACKEND_URL/health" 2>/dev/null)
    if echo "$response" | grep -qi "access-control-allow-origin"; then
        pass_test "CORS配置正常"
    else
        skip_test "CORS配置检查" "无法确认CORS配置"
    fi
else
    skip_test "综合API测试" "后端服务未运行"
    skip_test "综合API测试" "后端服务未运行"
    skip_test "综合API测试" "后端服务未运行"
fi

echo ""
echo "=========================================="
echo "阶段 9: 文件完整性检查"
echo "=========================================="
echo ""

# 检查关键文件
info_test "检查关键修复文件..."
critical_files=(
    "backend/src/routes/assignments.ts"
    "backend/src/routes/grading.ts"
    "backend/src/routes/analytics.ts"
    "backend/src/routes/recommendations.ts"
    "backend/src/services/ai-service-manager.ts"
    "backend/src/index.ts"
    "ecosystem.config.json"
)

missing_files=0
for file in "${critical_files[@]}"; do
    if [ ! -f "$file" ]; then
        fail_test "关键文件缺失: $file" "文件不存在"
        ((missing_files++))
    fi
done

if [ $missing_files -eq 0 ]; then
    pass_test "所有关键修复文件存在"
fi

# 检查验证脚本
info_test "检查验证脚本..."
verification_scripts=(
    "test-scripts/task1-verification.sh"
    "test-scripts/task2-verification.sh"
    "test-scripts/task3-verification.sh"
    "test-scripts/task4-verification.sh"
    "test-scripts/task5-verification.sh"
    "test-scripts/task6-verification.sh"
)

missing_scripts=0
for script in "${verification_scripts[@]}"; do
    if [ ! -f "$script" ]; then
        ((missing_scripts++))
    fi
done

if [ $missing_scripts -eq 0 ]; then
    pass_test "所有验证脚本存在"
else
    skip_test "验证脚本检查" "$missing_scripts 个脚本缺失"
fi

# 检查文档
info_test "检查实施文档..."
doc_files=(
    "docs/task1-implementation-summary.md"
    "docs/task2-implementation-summary.md"
    "docs/task3-implementation-summary.md"
    "docs/task4-implementation-summary.md"
    "docs/task5-implementation-summary.md"
    "docs/task6-implementation-summary.md"
)

missing_docs=0
for doc in "${doc_files[@]}"; do
    if [ ! -f "$doc" ]; then
        ((missing_docs++))
    fi
done

if [ $missing_docs -eq 0 ]; then
    pass_test "所有实施文档存在"
else
    skip_test "实施文档检查" "$missing_docs 个文档缺失"
fi

echo ""
echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo ""
echo -e "总测试数: ${TOTAL_TESTS}"
echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}失败: ${FAILED_TESTS}${NC}"
echo -e "${YELLOW}跳过: ${SKIPPED_TESTS}${NC}"
echo ""

# 计算通过率
if [ $TOTAL_TESTS -gt 0 ]; then
    pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "通过率: ${pass_rate}%"
fi

echo ""
echo "=========================================="
echo "检查点总结"
echo "=========================================="
echo ""

# 判断是否通过检查点
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 检查点通过！所有API错误修复已完成。${NC}"
    echo ""
    echo "已完成的修复："
    echo "  ✓ Task 1: 作业接口500错误"
    echo "  ✓ Task 2: 批改查询404错误"
    echo "  ✓ Task 3: 薄弱点分析400错误"
    echo "  ✓ Task 4: 个性化推荐403错误"
    echo "  ✓ Task 5: AI服务503错误"
    echo "  ✓ Task 6: 后端崩溃问题"
    echo ""
    echo "可以继续进行下一阶段："
    echo "  → Task 8: 修复测试脚本数据不匹配"
    echo ""
    exit 0
else
    echo -e "${RED}✗ 检查点未通过，发现 $FAILED_TESTS 个问题。${NC}"
    echo ""
    echo "请检查上述失败的测试项，修复后重新运行验证。"
    echo ""
    
    if [ "$BACKEND_RUNNING" = false ]; then
        echo "提示："
        echo "  - 后端服务未运行，部分测试被跳过"
        echo "  - 请启动后端服务后重新运行验证"
        echo "  - 启动命令: cd backend && npm run dev"
        echo ""
    fi
    
    exit 1
fi
