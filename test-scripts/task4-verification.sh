#!/bin/bash

# Task 4 验证脚本 - 个性化推荐403错误修复
# 测试所有子任务的实现

echo "=========================================="
echo "Task 4: 个性化推荐403错误修复 - 验证测试"
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

# API基础URL
API_URL="http://localhost:3000/api"

# 测试结果记录
declare -a TEST_RESULTS

# 辅助函数：运行测试
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    local description="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}测试 $TOTAL_TESTS: $test_name${NC}"
    echo "描述: $description"
    
    # 执行测试命令
    response=$(eval "$test_command")
    actual_status=$(echo "$response" | jq -r '.status // empty')
    
    # 如果没有status字段，尝试从HTTP响应中提取
    if [ -z "$actual_status" ]; then
        actual_status=$(echo "$response" | grep -oP 'HTTP/\d\.\d \K\d+' | head -1)
    fi
    
    # 检查结果
    if [ "$actual_status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 通过${NC} (状态码: $actual_status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✓ $test_name")
    else
        echo -e "${RED}✗ 失败${NC} (期望: $expected_status, 实际: $actual_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("✗ $test_name")
        echo "响应内容: $response"
    fi
    echo ""
}

# 获取测试用户token
echo "正在获取测试用户令牌..."

# 学生登录 (假设student001的ID是2)
STUDENT_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"student001","password":"password123"}' | jq -r '.data.token // empty')

# 另一个学生登录 (假设student002的ID是3)
STUDENT2_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"student002","password":"password123"}' | jq -r '.data.token // empty')

# 教师登录 (假设teacher001的ID是1，教授班级1)
TEACHER_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"teacher001","password":"password123"}' | jq -r '.data.token // empty')

# 管理员登录
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token // empty')

if [ -z "$STUDENT_TOKEN" ] || [ -z "$TEACHER_TOKEN" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}错误: 无法获取测试用户令牌${NC}"
    echo "学生令牌: $STUDENT_TOKEN"
    echo "教师令牌: $TEACHER_TOKEN"
    echo "管理员令牌: $ADMIN_TOKEN"
    exit 1
fi

echo -e "${GREEN}✓ 令牌获取成功${NC}"
echo ""

# ==================== Sub-task 4.2: 参数校验测试 ====================
echo "=========================================="
echo "Sub-task 4.2: 参数校验测试"
echo "=========================================="
echo ""

# 测试1: 缺少student_id参数（访问根路径）
run_test \
    "4.2.1 - 缺少student_id参数" \
    "curl -s -X GET '$API_URL/recommendations/' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "404" \
    "访问/recommendations/路径（无student_id），应返回404（路由不匹配）"

# 测试2: student_id为undefined
run_test \
    "4.2.2 - student_id为undefined" \
    "curl -s -X GET '$API_URL/recommendations/undefined' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "400" \
    "student_id为undefined，应返回400参数错误"

# 测试3: student_id为null
run_test \
    "4.2.3 - student_id为null" \
    "curl -s -X GET '$API_URL/recommendations/null' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "400" \
    "student_id为null，应返回400参数错误"

# 测试4: student_id为非数字
run_test \
    "4.2.4 - student_id为非数字" \
    "curl -s -X GET '$API_URL/recommendations/abc' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "400" \
    "student_id为非数字字符串，应返回400参数错误"

# 测试5: student_id为负数
run_test \
    "4.2.5 - student_id为负数" \
    "curl -s -X GET '$API_URL/recommendations/-1' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "400" \
    "student_id为负数，应返回400参数错误"

# 测试6: student_id为0
run_test \
    "4.2.6 - student_id为0" \
    "curl -s -X GET '$API_URL/recommendations/0' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "400" \
    "student_id为0，应返回400参数错误"

# 测试7: 提供有效的student_id
run_test \
    "4.2.7 - 提供有效的student_id" \
    "curl -s -X GET '$API_URL/recommendations/2' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "200" \
    "提供有效的student_id，学生查询自己的推荐，应返回200成功"

# ==================== Sub-task 4.1: 权限控制测试 ====================
echo "=========================================="
echo "Sub-task 4.1: 权限控制测试"
echo "=========================================="
echo ""

# 测试8: 学生查询自己的推荐
run_test \
    "4.1.1 - 学生查询自己的推荐" \
    "curl -s -X GET '$API_URL/recommendations/2' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "200" \
    "学生查询自己的推荐（student_id=2），应返回200成功"

# 测试9: 学生尝试查询其他学生的推荐
run_test \
    "4.1.2 - 学生查询其他学生的推荐" \
    "curl -s -X GET '$API_URL/recommendations/3' \
        -H 'Authorization: Bearer $STUDENT_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "403" \
    "学生尝试查询其他学生的推荐（student_id=3），应返回403权限不足"

# 测试10: 教师查询本班学生的推荐
run_test \
    "4.1.3 - 教师查询本班学生的推荐" \
    "curl -s -X GET '$API_URL/recommendations/2' \
        -H 'Authorization: Bearer $TEACHER_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "200" \
    "教师查询本班学生的推荐（student_id=2在班级1中），应返回200成功"

# 测试11: 教师尝试查询其他班级学生的推荐
run_test \
    "4.1.4 - 教师查询其他班级学生的推荐" \
    "curl -s -X GET '$API_URL/recommendations/999' \
        -H 'Authorization: Bearer $TEACHER_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "403" \
    "教师尝试查询不在本班的学生推荐（student_id=999），应返回403权限不足或404学生不存在"

# 测试12: 管理员查询任意学生的推荐
run_test \
    "4.1.5 - 管理员查询任意学生的推荐" \
    "curl -s -X GET '$API_URL/recommendations/2' \
        -H 'Authorization: Bearer $ADMIN_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "200" \
    "管理员查询任意学生的推荐（student_id=2），应返回200成功"

# 测试13: 管理员查询另一个学生的推荐
run_test \
    "4.1.6 - 管理员查询另一个学生的推荐" \
    "curl -s -X GET '$API_URL/recommendations/3' \
        -H 'Authorization: Bearer $ADMIN_TOKEN' \
        -w '\n{\"status\":%{http_code}}' | jq -s 'add'" \
    "200" \
    "管理员查询另一个学生的推荐（student_id=3），应返回200成功"

# ==================== 响应格式验证 ====================
echo "=========================================="
echo "响应格式验证"
echo "=========================================="
echo ""

# 测试14: 验证成功响应格式
echo -e "${YELLOW}测试 14: 验证成功响应格式${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

response=$(curl -s -X GET "$API_URL/recommendations/2" \
    -H "Authorization: Bearer $STUDENT_TOKEN")

code=$(echo "$response" | jq -r '.code // empty')
msg=$(echo "$response" | jq -r '.msg // empty')
data=$(echo "$response" | jq -r '.data // empty')

if [ "$code" = "200" ] && [ -n "$msg" ] && [ "$data" != "null" ]; then
    echo -e "${GREEN}✓ 通过${NC} - 响应格式正确 {code: $code, msg: \"$msg\", data: {...}}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✓ 成功响应格式验证")
else
    echo -e "${RED}✗ 失败${NC} - 响应格式不正确"
    echo "响应内容: $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("✗ 成功响应格式验证")
fi
echo ""

# 测试15: 验证参数错误响应格式
echo -e "${YELLOW}测试 15: 验证参数错误响应格式${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

response=$(curl -s -X GET "$API_URL/recommendations/undefined" \
    -H "Authorization: Bearer $STUDENT_TOKEN")

code=$(echo "$response" | jq -r '.code // empty')
msg=$(echo "$response" | jq -r '.msg // empty')
data=$(echo "$response" | jq -r '.data // empty')

if [ "$code" = "400" ] && [ -n "$msg" ] && [[ "$msg" == *"student_id"* ]] && [ "$data" = "null" ]; then
    echo -e "${GREEN}✓ 通过${NC} - 参数错误响应格式正确 {code: $code, msg: \"$msg\", data: null}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✓ 参数错误响应格式验证")
else
    echo -e "${RED}✗ 失败${NC} - 参数错误响应格式不正确"
    echo "响应内容: $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("✗ 参数错误响应格式验证")
fi
echo ""

# 测试16: 验证权限错误响应格式
echo -e "${YELLOW}测试 16: 验证权限错误响应格式${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

response=$(curl -s -X GET "$API_URL/recommendations/3" \
    -H "Authorization: Bearer $STUDENT_TOKEN")

code=$(echo "$response" | jq -r '.code // empty')
msg=$(echo "$response" | jq -r '.msg // empty')
data=$(echo "$response" | jq -r '.data // empty')

if [ "$code" = "403" ] && [ -n "$msg" ] && [[ "$msg" == *"权限"* ]] && [ "$data" = "null" ]; then
    echo -e "${GREEN}✓ 通过${NC} - 权限错误响应格式正确 {code: $code, msg: \"$msg\", data: null}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✓ 权限错误响应格式验证")
else
    echo -e "${RED}✗ 失败${NC} - 权限错误响应格式不正确"
    echo "响应内容: $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("✗ 权限错误响应格式验证")
fi
echo ""

# 测试17: 验证错误消息明确性
echo -e "${YELLOW}测试 17: 验证错误消息明确性${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

response=$(curl -s -X GET "$API_URL/recommendations/3" \
    -H "Authorization: Bearer $STUDENT_TOKEN")

msg=$(echo "$response" | jq -r '.msg // empty')

if [[ "$msg" == *"学生只能查询自己的推荐"* ]]; then
    echo -e "${GREEN}✓ 通过${NC} - 错误消息明确: \"$msg\""
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✓ 错误消息明确性验证")
else
    echo -e "${RED}✗ 失败${NC} - 错误消息不够明确"
    echo "实际消息: $msg"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("✗ 错误消息明确性验证")
fi
echo ""

# ==================== 测试总结 ====================
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

echo "详细结果:"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done
echo ""

# 计算通过率
if [ $TOTAL_TESTS -gt 0 ]; then
    pass_rate=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
    echo "通过率: $pass_rate%"
else
    echo "通过率: 0%"
fi
echo ""

# 返回退出码
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！Task 4 修复成功！${NC}"
    exit 0
else
    echo -e "${RED}✗ 部分测试失败，请检查实现${NC}"
    exit 1
fi
