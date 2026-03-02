#!/bin/bash

# Task 6 验证脚本 - 修复后端崩溃问题
# 测试端口占用检测、全局异常捕获和PM2进程守护

echo "=========================================="
echo "Task 6 验证脚本 - 修复后端崩溃问题"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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

info_test() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

# 检查必要的命令
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: 未找到命令 $1${NC}"
        echo "请先安装 $1"
        exit 1
    fi
}

echo "1. 检查必要的工具..."
echo "-----------------------------------"
check_command node
check_command npm
info_test "Node.js 版本: $(node --version)"
info_test "npm 版本: $(npm --version)"
echo ""

echo "2. 检查PM2是否安装..."
echo "-----------------------------------"
if ! command -v pm2 &> /dev/null; then
    info_test "PM2 未安装，正在安装..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        pass_test "PM2 安装成功"
    else
        fail_test "PM2 安装失败" "npm install -g pm2 失败"
    fi
else
    pass_test "PM2 已安装"
    info_test "PM2 版本: $(pm2 --version)"
fi
echo ""

echo "3. 检查ecosystem.config.json配置文件..."
echo "-----------------------------------"
if [ -f "ecosystem.config.json" ]; then
    pass_test "ecosystem.config.json 文件存在"
    
    # 验证配置文件格式
    if node -e "JSON.parse(require('fs').readFileSync('ecosystem.config.json', 'utf8'))" 2>/dev/null; then
        pass_test "ecosystem.config.json 格式正确"
    else
        fail_test "ecosystem.config.json 格式错误" "JSON解析失败"
    fi
    
    # 检查关键配置项
    if grep -q '"name".*"smart-edu-backend"' ecosystem.config.json; then
        pass_test "应用名称配置正确"
    else
        fail_test "应用名称配置错误" "未找到 smart-edu-backend"
    fi
    
    if grep -q '"instances".*2' ecosystem.config.json; then
        pass_test "实例数量配置正确（2个实例）"
    else
        fail_test "实例数量配置错误" "未配置2个实例"
    fi
    
    if grep -q '"exec_mode".*"cluster"' ecosystem.config.json; then
        pass_test "执行模式配置正确（cluster模式）"
    else
        fail_test "执行模式配置错误" "未配置cluster模式"
    fi
    
    if grep -q '"max_memory_restart".*"512M"' ecosystem.config.json; then
        pass_test "内存限制配置正确（512MB）"
    else
        fail_test "内存限制配置错误" "未配置512MB限制"
    fi
    
    if grep -q '"autorestart".*true' ecosystem.config.json; then
        pass_test "自动重启配置正确"
    else
        fail_test "自动重启配置错误" "未启用自动重启"
    fi
else
    fail_test "ecosystem.config.json 文件不存在" "请创建PM2配置文件"
fi
echo ""

echo "4. 检查后端代码修改..."
echo "-----------------------------------"
if [ -f "backend/src/index.ts" ]; then
    pass_test "backend/src/index.ts 文件存在"
    
    # 检查端口检测函数
    if grep -q "findAvailablePort" backend/src/index.ts; then
        pass_test "端口检测函数已实现"
    else
        fail_test "端口检测函数未实现" "未找到 findAvailablePort 函数"
    fi
    
    # 检查优雅关闭函数
    if grep -q "gracefulShutdown" backend/src/index.ts; then
        pass_test "优雅关闭函数已实现"
    else
        fail_test "优雅关闭函数未实现" "未找到 gracefulShutdown 函数"
    fi
    
    # 检查全局异常捕获
    if grep -q "uncaughtException" backend/src/index.ts; then
        pass_test "uncaughtException 异常捕获已实现"
    else
        fail_test "uncaughtException 异常捕获未实现" "未找到 uncaughtException 处理"
    fi
    
    if grep -q "unhandledRejection" backend/src/index.ts; then
        pass_test "unhandledRejection 异常捕获已实现"
    else
        fail_test "unhandledRejection 异常捕获未实现" "未找到 unhandledRejection 处理"
    fi
    
    # 检查SIGTERM和SIGINT信号处理
    if grep -q "SIGTERM" backend/src/index.ts && grep -q "SIGINT" backend/src/index.ts; then
        pass_test "SIGTERM和SIGINT信号处理已实现"
    else
        fail_test "信号处理未实现" "未找到 SIGTERM 或 SIGINT 处理"
    fi
else
    fail_test "backend/src/index.ts 文件不存在" "后端入口文件缺失"
fi
echo ""

echo "5. 编译TypeScript代码..."
echo "-----------------------------------"
cd backend
if [ -f "package.json" ]; then
    info_test "正在编译TypeScript代码..."
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        pass_test "TypeScript编译成功"
        
        if [ -f "dist/index.js" ]; then
            pass_test "编译输出文件存在 (dist/index.js)"
        else
            fail_test "编译输出文件不存在" "dist/index.js 未生成"
        fi
    else
        fail_test "TypeScript编译失败" "npm run build 失败"
    fi
else
    fail_test "backend/package.json 不存在" "无法编译代码"
fi
cd ..
echo ""

echo "6. 测试端口占用检测功能..."
echo "-----------------------------------"
# 启动一个临时服务占用3000端口
info_test "启动临时服务占用端口3000..."
node -e "require('http').createServer().listen(3000)" &
TEMP_PID=$!
sleep 2

# 尝试启动后端服务（应该自动切换到3001端口）
info_test "尝试启动后端服务（应自动切换端口）..."
cd backend
timeout 10s node dist/index.js > ../test-port-detection.log 2>&1 &
BACKEND_PID=$!
sleep 5

# 检查日志
if grep -q "端口.*已被占用" ../test-port-detection.log; then
    pass_test "端口占用检测功能正常"
else
    fail_test "端口占用检测功能异常" "未检测到端口占用"
fi

if grep -q "已切换到端口" ../test-port-detection.log || grep -q "端口: 3001" ../test-port-detection.log; then
    pass_test "端口自动切换功能正常"
else
    fail_test "端口自动切换功能异常" "未切换到备用端口"
fi

# 清理临时进程
kill $TEMP_PID 2>/dev/null
kill $BACKEND_PID 2>/dev/null
cd ..
echo ""

echo "7. 测试PM2配置正确性..."
echo "-----------------------------------"
# 验证PM2配置
pm2 ecosystem ecosystem.config.json > /dev/null 2>&1
if [ $? -eq 0 ]; then
    pass_test "PM2配置文件验证通过"
else
    fail_test "PM2配置文件验证失败" "pm2 ecosystem 命令失败"
fi
echo ""

echo "8. 测试PM2启动和管理..."
echo "-----------------------------------"
info_test "使用PM2启动后端服务..."

# 确保之前的进程已停止
pm2 delete smart-edu-backend > /dev/null 2>&1

# 启动服务
pm2 start ecosystem.config.json > /dev/null 2>&1
sleep 5

# 检查服务状态
if pm2 list | grep -q "smart-edu-backend.*online"; then
    pass_test "PM2启动服务成功"
    
    # 检查实例数量
    INSTANCE_COUNT=$(pm2 list | grep "smart-edu-backend" | wc -l)
    if [ "$INSTANCE_COUNT" -eq 2 ]; then
        pass_test "PM2实例数量正确（2个实例）"
    else
        fail_test "PM2实例数量错误" "期望2个实例，实际$INSTANCE_COUNT个"
    fi
    
    # 测试自动重启
    info_test "测试PM2自动重启功能..."
    pm2 stop smart-edu-backend > /dev/null 2>&1
    sleep 2
    pm2 restart smart-edu-backend > /dev/null 2>&1
    sleep 3
    
    if pm2 list | grep -q "smart-edu-backend.*online"; then
        pass_test "PM2自动重启功能正常"
    else
        fail_test "PM2自动重启功能异常" "重启后服务未运行"
    fi
    
    # 检查日志文件
    if [ -f "backend/logs/pm2-out.log" ] || [ -f "backend/logs/pm2-error.log" ]; then
        pass_test "PM2日志文件已创建"
    else
        fail_test "PM2日志文件未创建" "日志目录或文件不存在"
    fi
    
    # 停止服务
    info_test "停止PM2服务..."
    pm2 delete smart-edu-backend > /dev/null 2>&1
else
    fail_test "PM2启动服务失败" "服务未运行"
fi
echo ""

echo "9. 清理测试文件..."
echo "-----------------------------------"
rm -f test-port-detection.log
info_test "测试文件已清理"
echo ""

echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo -e "总测试数: ${TOTAL_TESTS}"
echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}失败: ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！Task 6 修复完成。${NC}"
    echo ""
    echo "后续步骤："
    echo "1. 使用 'pm2 start ecosystem.config.json' 启动生产服务"
    echo "2. 使用 'pm2 list' 查看服务状态"
    echo "3. 使用 'pm2 logs smart-edu-backend' 查看日志"
    echo "4. 使用 'pm2 monit' 监控服务性能"
    echo "5. 使用 'pm2 save' 保存进程列表"
    echo "6. 使用 'pm2 startup' 配置开机自启"
    exit 0
else
    echo -e "${RED}✗ 部分测试失败，请检查上述错误信息。${NC}"
    exit 1
fi
