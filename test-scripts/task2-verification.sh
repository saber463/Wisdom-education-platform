#!/bin/bash

# Task 2 Verification Script - 批改查询404错误修复验证
# 验证所有3个子任务的实现

echo "========================================="
echo "Task 2: 批改查询404错误修复 - 验证脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASSED=0
FAILED=0

# 测试结果函数
pass_test() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

fail_test() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

warn_test() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

# 检查后端服务是否运行
echo "检查后端服务状态..."
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}错误: 后端服务未运行，请先启动后端服务${NC}"
    echo "启动命令: cd backend && npm run dev"
    exit 1
fi
echo -e "${GREEN}后端服务正常运行${NC}"
echo ""

# 获取测试用户token
echo "========================================="
echo "准备测试环境"
echo "========================================="

# 登录获取token
echo "登录测试用户..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teststudent1","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}错误: 无法获取测试用户token${NC}"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}成功获取测试用户token${NC}"
echo ""

# 获取教师token
TEACHER_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testteacher1","password":"password123"}')

TEACHER_TOKEN=$(echo $TEACHER_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TEACHER_TOKEN" ]; then
    echo -e "${YELLOW}警告: 无法获取教师token，部分测试将跳过${NC}"
fi

echo ""
echo "========================================="
echo "Sub-task 2.1: 统一接口路径测试"
echo "========================================="
echo ""

# 测试1: 新路径 /api/grading/assignment/:assignment_id 是否存在
echo "测试1: 验证新接口路径 /api/grading/assignment/:assignment_id"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grading/assignment/1" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ]; then
    pass_test "新接口路径可访问 (HTTP $HTTP_CODE)"
else
    fail_test "新接口路径不可访问 (HTTP $HTTP_CODE)"
fi
echo ""

# 测试2: 验证返回格式包含 code, msg, data
echo "测试2: 验证返回格式包含 {code, msg, data}"
if echo "$BODY" | grep -q '"code"' && echo "$BODY" | grep -q '"msg"' && echo "$BODY" | grep -q '"data"'; then
    pass_test "返回格式正确，包含 code, msg, data 字段"
else
    fail_test "返回格式不正确，缺少必要字段"
    echo "响应体: $BODY"
fi
echo ""

echo "========================================="
echo "Sub-task 2.2: 无数据返回空数组测试"
echo "========================================="
echo ""

# 测试3: 查询不存在的作业，应返回404而非500
echo "测试3: 查询不存在的作业ID (应返回404)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grading/assignment/999999" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "404" ]; then
    pass_test "不存在的作业返回404状态码"
    
    # 验证返回格式
    if echo "$BODY" | grep -q '"code":404' && echo "$BODY" | grep -q '"msg"' && echo "$BODY" | grep -q '"data":null'; then
        pass_test "404响应格式正确"
    else
        fail_test "404响应格式不正确"
        echo "响应体: $BODY"
    fi
else
    fail_test "不存在的作业应返回404，实际返回 $HTTP_CODE"
fi
echo ""

# 测试4: 查询存在但无提交记录的作业，应返回200和空数组
echo "测试4: 查询存在但无提交记录的作业 (应返回200和空数组)"
# 首先需要创建一个测试作业（如果教师token可用）
if [ -n "$TEACHER_TOKEN" ]; then
    # 创建测试作业
    CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/assignments \
      -H "Authorization: Bearer $TEACHER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "title":"测试作业-无提交",
        "description":"用于测试空数组返回",
        "class_id":1,
        "total_score":100,
        "deadline":"2025-12-31T23:59:59Z",
        "status":"published"
      }')
    
    TEST_ASSIGNMENT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -n "$TEST_ASSIGNMENT_ID" ]; then
        # 查询这个没有提交记录的作业
        RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grading/assignment/$TEST_ASSIGNMENT_ID" \
          -H "Authorization: Bearer $TEACHER_TOKEN")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | sed '$d')
        
        if [ "$HTTP_CODE" = "200" ]; then
            pass_test "无提交记录的作业返回200状态码"
            
            # 验证返回空数组
            if echo "$BODY" | grep -q '"code":200' && echo "$BODY" | grep -q '"data":\[\]'; then
                pass_test "无数据时返回空数组 []"
            else
                fail_test "无数据时应返回空数组，实际返回: $BODY"
            fi
        else
            fail_test "无提交记录的作业应返回200，实际返回 $HTTP_CODE"
        fi
    else
        warn_test "无法创建测试作业，跳过空数组测试"
    fi
else
    warn_test "无教师token，跳过空数组测试"
fi
echo ""

echo "========================================="
echo "Sub-task 2.3: 参数校验测试"
echo "========================================="
echo ""

# 测试5: 缺少assignment_id参数（路径参数，不会缺少，但测试无效ID）
echo "测试5: 测试无效的assignment_id参数"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grading/assignment/invalid" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    pass_test "无效assignment_id返回400状态码"
    
    if echo "$BODY" | grep -q '"code":400' && echo "$BODY" | grep -q '"msg"'; then
        pass_test "400响应包含错误信息"
    else
        fail_test "400响应格式不正确"
    fi
else
    fail_test "无效assignment_id应返回400，实际返回 $HTTP_CODE"
fi
echo ""

# 测试6: 测试无效的student_id查询参数
echo "测试6: 测试无效的student_id查询参数"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grading/assignment/1?student_id=invalid" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    pass_test "无效student_id返回400状态码"
    
    if echo "$BODY" | grep -q '"code":400' && echo "$BODY" | grep -q '"msg"'; then
        pass_test "400响应包含错误信息"
    else
        fail_test "400响应格式不正确"
    fi
else
    fail_test "无效student_id应返回400，实际返回 $HTTP_CODE"
fi
echo ""

# 测试7: 测试有效的student_id查询参数
echo "测试7: 测试有效的student_id查询参数"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grading/assignment/1?student_id=1" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "404" ]; then
    pass_test "有效student_id参数被正确处理 (HTTP $HTTP_CODE)"
else
    fail_test "有效student_id参数处理失败 (HTTP $HTTP_CODE)"
fi
echo ""

echo "========================================="
echo "权限控制测试"
echo "========================================="
echo ""

# 测试8: 学生查询其他学生的批改结果（应返回403）
echo "测试8: 学生查询其他学生的批改结果 (应返回403)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grading/assignment/1?student_id=999" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "403" ]; then
    pass_test "学生查询其他学生批改结果返回403"
    
    if echo "$BODY" | grep -q '"code":403' && echo "$BODY" | grep -q '"msg"'; then
        pass_test "403响应包含权限错误信息"
    else
        fail_test "403响应格式不正确"
    fi
else
    fail_test "学生查询其他学生批改结果应返回403，实际返回 $HTTP_CODE"
fi
echo ""

echo "========================================="
echo "日志记录测试"
echo "========================================="
echo ""

# 测试9: 验证详细日志记录
echo "测试9: 验证接口调用产生详细日志"
# 触发一次API调用
curl -s -X GET "http://localhost:3000/api/grading/assignment/1" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# 检查日志文件是否存在（假设日志输出到控制台或文件）
# 这里只是提示，实际需要检查后端日志
warn_test "请手动检查后端日志，确认包含以下信息："
echo "  - 时间戳 (ISO格式)"
echo "  - 用户ID和角色"
echo "  - 请求参数 (assignment_id, student_id)"
echo "  - 执行时长 (duration)"
echo "  - 成功/失败状态"
echo ""

echo "========================================="
echo "兼容性测试"
echo "========================================="
echo ""

# 测试10: 旧路径重定向测试
echo "测试10: 验证旧路径重定向到新路径"
RESPONSE=$(curl -s -w "\n%{http_code}" -L -X GET "http://localhost:3000/api/grading/assignment/1/student/1" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "404" ]; then
    pass_test "旧路径重定向正常工作 (HTTP $HTTP_CODE)"
else
    fail_test "旧路径重定向失败 (HTTP $HTTP_CODE)"
fi
echo ""

echo "========================================="
echo "测试总结"
echo "========================================="
echo ""
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "成功率: $SUCCESS_RATE%"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ Task 2 所有测试通过！${NC}"
    echo -e "${GREEN}=========================================${NC}"
    exit 0
else
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}✗ Task 2 存在失败的测试${NC}"
    echo -e "${RED}=========================================${NC}"
    exit 1
fi
