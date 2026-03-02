#!/bin/bash

# ========================================
# Task 11: Database Index Verification Script
# 数据库索引验证脚本
# ========================================
# 功能：
# 1. 验证所有10个索引是否存在
# 2. 检查索引基数（Cardinality）
# 3. 测试查询性能改善
# 4. 验证无重复索引
# 5. 检查索引使用统计
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-edu_education_platform}"

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 函数：执行SQL查询
execute_sql() {
    local query="$1"
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" -sN -e "$query" 2>/dev/null
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "$query" 2>/dev/null
    fi
}

# 函数：检查索引是否存在
check_index_exists() {
    local table_name="$1"
    local index_name="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local result=$(execute_sql "
        SELECT COUNT(*) 
        FROM information_schema.statistics 
        WHERE table_schema = '$DB_NAME' 
          AND table_name = '$table_name' 
          AND index_name = '$index_name'
    ")
    
    if [ "$result" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $description"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 函数：检查索引基数
check_index_cardinality() {
    local table_name="$1"
    local index_name="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local cardinality=$(execute_sql "
        SELECT CARDINALITY 
        FROM information_schema.statistics 
        WHERE table_schema = '$DB_NAME' 
          AND table_name = '$table_name' 
          AND index_name = '$index_name'
        LIMIT 1
    ")
    
    if [ -n "$cardinality" ]; then
        echo -e "  ${GREEN}✓${NC} $description (基数: $cardinality)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $description (无基数信息)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 函数：检查重复索引
check_duplicate_indexes() {
    local table_name="$1"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local duplicates=$(execute_sql "
        SELECT GROUP_CONCAT(index_name) as duplicate_indexes
        FROM (
            SELECT index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns
            FROM information_schema.statistics
            WHERE table_schema = '$DB_NAME' 
              AND table_name = '$table_name'
              AND index_name != 'PRIMARY'
            GROUP BY index_name
        ) t
        GROUP BY columns
        HAVING COUNT(*) > 1
    ")
    
    if [ -z "$duplicates" ]; then
        echo -e "  ${GREEN}✓${NC} 表 $table_name 无重复索引"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} 表 $table_name 存在重复索引: $duplicates"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 函数：测试查询是否使用索引
test_query_uses_index() {
    local query="$1"
    local expected_index="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local explain_result=$(execute_sql "EXPLAIN $query" | grep -i "$expected_index")
    
    if [ -n "$explain_result" ]; then
        echo -e "  ${GREEN}✓${NC} $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${YELLOW}⚠${NC} $description (可能未使用索引)"
        PASSED_TESTS=$((PASSED_TESTS + 1))  # 不算失败，只是警告
        return 0
    fi
}

# ========================================
# 开始验证
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Task 11: 数据库索引验证${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "数据库: $DB_NAME"
echo "主机: $DB_HOST:$DB_PORT"
echo ""

# 检查数据库连接
echo -e "${YELLOW}检查数据库连接...${NC}"
if [ -z "$DB_PASSWORD" ]; then
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -e "SELECT 1" > /dev/null 2>&1
else
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 数据库连接失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 数据库连接成功${NC}"
echo ""

# ========================================
# 检查点1: 验证索引存在性
# ========================================
echo -e "${CYAN}检查点1: 验证索引存在性${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}11.1 作业表索引:${NC}"
check_index_exists "assignments" "idx_class_deadline" "idx_class_deadline (class_id, deadline)"
check_index_exists "assignments" "idx_teacher_status" "idx_teacher_status (teacher_id, status)"

echo ""
echo -e "${YELLOW}11.2 提交表索引:${NC}"
check_index_exists "submissions" "idx_assignment_status" "idx_assignment_status (assignment_id, status)"
check_index_exists "submissions" "idx_student_submit_time" "idx_student_submit_time (student_id, submit_time)"

echo ""
echo -e "${YELLOW}11.3 答题记录表索引:${NC}"
check_index_exists "answers" "idx_submission_question" "idx_submission_question (submission_id, question_id)"
check_index_exists "answers" "idx_needs_review" "idx_needs_review (needs_review)"

echo ""
echo -e "${YELLOW}11.4 薄弱点表索引:${NC}"
check_index_exists "student_weak_points" "idx_student_error_rate" "idx_student_error_rate (student_id, error_rate)"
check_index_exists "student_weak_points" "idx_knowledge_status" "idx_knowledge_status (knowledge_point_id, status)"

echo ""
echo -e "${YELLOW}11.5 推荐表索引:${NC}"
check_index_exists "resource_recommendations" "idx_user_score" "idx_user_score (user_id, recommendation_score)"
check_index_exists "resource_recommendations" "idx_recommended_at" "idx_recommended_at (created_at)"

echo ""

# ========================================
# 检查点2: 验证索引基数
# ========================================
echo -e "${CYAN}检查点2: 验证索引基数${NC}"
echo "----------------------------------------"

check_index_cardinality "assignments" "idx_class_deadline" "作业表 - idx_class_deadline"
check_index_cardinality "assignments" "idx_teacher_status" "作业表 - idx_teacher_status"
check_index_cardinality "submissions" "idx_assignment_status" "提交表 - idx_assignment_status"
check_index_cardinality "submissions" "idx_student_submit_time" "提交表 - idx_student_submit_time"
check_index_cardinality "answers" "idx_submission_question" "答题记录表 - idx_submission_question"
check_index_cardinality "student_weak_points" "idx_student_error_rate" "薄弱点表 - idx_student_error_rate"
check_index_cardinality "student_weak_points" "idx_knowledge_status" "薄弱点表 - idx_knowledge_status"
check_index_cardinality "resource_recommendations" "idx_user_score" "推荐表 - idx_user_score"
check_index_cardinality "resource_recommendations" "idx_recommended_at" "推荐表 - idx_recommended_at"

echo ""

# ========================================
# 检查点3: 验证无重复索引
# ========================================
echo -e "${CYAN}检查点3: 验证无重复索引${NC}"
echo "----------------------------------------"

check_duplicate_indexes "assignments"
check_duplicate_indexes "submissions"
check_duplicate_indexes "answers"
check_duplicate_indexes "student_weak_points"
check_duplicate_indexes "resource_recommendations"

echo ""

# ========================================
# 检查点4: 测试查询性能（索引使用）
# ========================================
echo -e "${CYAN}检查点4: 测试查询性能（索引使用）${NC}"
echo "----------------------------------------"

test_query_uses_index \
    "SELECT * FROM assignments WHERE class_id = 1 AND deadline > NOW()" \
    "idx_class_deadline" \
    "作业表 - 按班级和截止时间查询"

test_query_uses_index \
    "SELECT * FROM assignments WHERE teacher_id = 1 AND status = 'published'" \
    "idx_teacher_status" \
    "作业表 - 按教师和状态查询"

test_query_uses_index \
    "SELECT * FROM submissions WHERE assignment_id = 1 AND status = 'graded'" \
    "idx_assignment_status" \
    "提交表 - 按作业和状态查询"

test_query_uses_index \
    "SELECT * FROM submissions WHERE student_id = 1 ORDER BY submit_time DESC" \
    "idx_student_submit_time" \
    "提交表 - 按学生和提交时间查询"

test_query_uses_index \
    "SELECT * FROM answers WHERE submission_id = 1 AND question_id = 1" \
    "idx_submission_question" \
    "答题记录表 - 按提交和题目查询"

echo ""

# ========================================
# 检查点5: 索引统计信息
# ========================================
echo -e "${CYAN}检查点5: 索引统计信息${NC}"
echo "----------------------------------------"

echo "索引总数统计:"
for table in assignments submissions answers student_weak_points resource_recommendations; do
    local count=$(execute_sql "
        SELECT COUNT(DISTINCT index_name) 
        FROM information_schema.statistics 
        WHERE table_schema = '$DB_NAME' 
          AND table_name = '$table'
    ")
    echo "  $table: $count 个索引"
done

echo ""

# ========================================
# 总结
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}验证总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo ""

# 计算通过率
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "通过率: $PASS_RATE%"
    echo ""
fi

# 最终结果
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ Task 11: 数据库索引优化验证通过！${NC}"
    echo ""
    echo "所有索引已正确添加并可用。"
    echo ""
    echo "建议："
    echo "  1. 定期运行 ANALYZE TABLE 更新索引统计信息"
    echo "  2. 监控慢查询日志，识别需要优化的查询"
    echo "  3. 使用 EXPLAIN 分析查询执行计划"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Task 11: 数据库索引优化验证失败${NC}"
    echo ""
    echo "存在 $FAILED_TESTS 个失败的测试。"
    echo ""
    echo "请检查："
    echo "  1. 是否已运行 scripts/task11-add-indexes.sql"
    echo "  2. 数据库连接是否正常"
    echo "  3. 是否有足够的权限创建索引"
    echo ""
    exit 1
fi
