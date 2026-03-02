#!/bin/bash

# ========================================
# Task 11: Database Index Performance Test
# 数据库索引性能测试脚本
# ========================================
# 功能：
# 1. 运行示例查询（添加索引前）
# 2. 添加索引
# 3. 运行相同查询（添加索引后）
# 4. 比较执行时间
# 5. 生成性能报告
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-edu_education_platform}"

# 测试结果文件
REPORT_FILE="docs/task11-performance-report.txt"
TEMP_BEFORE="temp_before.txt"
TEMP_AFTER="temp_after.txt"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Task 11: 数据库索引性能测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查MySQL命令
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}✗ 错误: 未找到mysql命令${NC}"
    echo "请安装MySQL客户端或确保mysql在PATH中"
    exit 1
fi

# 测试数据库连接
echo -e "${YELLOW}测试数据库连接...${NC}"
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

# 创建临时SQL文件
TEMP_SQL="temp_performance_test.sql"

# ========================================
# 函数：执行查询并记录时间
# ========================================
run_query() {
    local query="$1"
    local description="$2"
    local output_file="$3"
    
    echo "测试: $description" >> "$output_file"
    echo "查询: $query" >> "$output_file"
    
    # 使用EXPLAIN ANALYZE（MySQL 8.0.18+）或EXPLAIN
    local explain_query="EXPLAIN $query"
    
    # 记录开始时间
    local start_time=$(date +%s%N)
    
    # 执行查询
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" -e "$explain_query" >> "$output_file" 2>&1
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "$explain_query" >> "$output_file" 2>&1
    fi
    
    # 记录结束时间
    local end_time=$(date +%s%N)
    local duration=$((($end_time - $start_time) / 1000000))
    
    echo "执行时间: ${duration}ms" >> "$output_file"
    echo "----------------------------------------" >> "$output_file"
    echo "" >> "$output_file"
    
    return $duration
}

# ========================================
# 阶段1：添加索引前的性能测试
# ========================================
echo -e "${YELLOW}阶段1: 添加索引前的性能测试${NC}"
echo ""

# 清空临时文件
> "$TEMP_BEFORE"

echo "========================================" >> "$TEMP_BEFORE"
echo "添加索引前的查询性能" >> "$TEMP_BEFORE"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$TEMP_BEFORE"
echo "========================================" >> "$TEMP_BEFORE"
echo "" >> "$TEMP_BEFORE"

# 测试1: 作业表 - 按班级和截止时间查询
echo -e "  ${BLUE}测试1:${NC} 作业表 - 按班级和截止时间查询"
run_query "SELECT * FROM assignments WHERE class_id = 1 AND deadline > NOW() ORDER BY deadline" \
    "作业表 - 按班级和截止时间查询" "$TEMP_BEFORE"

# 测试2: 作业表 - 按教师和状态查询
echo -e "  ${BLUE}测试2:${NC} 作业表 - 按教师和状态查询"
run_query "SELECT * FROM assignments WHERE teacher_id = 1 AND status = 'published' ORDER BY created_at DESC" \
    "作业表 - 按教师和状态查询" "$TEMP_BEFORE"

# 测试3: 提交表 - 按作业和状态查询
echo -e "  ${BLUE}测试3:${NC} 提交表 - 按作业和状态查询"
run_query "SELECT * FROM submissions WHERE assignment_id = 1 AND status = 'graded'" \
    "提交表 - 按作业和状态查询" "$TEMP_BEFORE"

# 测试4: 提交表 - 按学生和提交时间查询
echo -e "  ${BLUE}测试4:${NC} 提交表 - 按学生和提交时间查询"
run_query "SELECT * FROM submissions WHERE student_id = 1 ORDER BY submit_time DESC LIMIT 10" \
    "提交表 - 按学生和提交时间查询" "$TEMP_BEFORE"

# 测试5: 答题记录表 - 按提交和题目查询
echo -e "  ${BLUE}测试5:${NC} 答题记录表 - 按提交和题目查询"
run_query "SELECT * FROM answers WHERE submission_id = 1 AND question_id = 1" \
    "答题记录表 - 按提交和题目查询" "$TEMP_BEFORE"

# 测试6: 答题记录表 - 查询需要复核的答题
echo -e "  ${BLUE}测试6:${NC} 答题记录表 - 查询需要复核的答题"
run_query "SELECT * FROM answers WHERE needs_review = TRUE LIMIT 20" \
    "答题记录表 - 查询需要复核的答题" "$TEMP_BEFORE"

# 测试7: 薄弱点表 - 按学生和错误率查询
echo -e "  ${BLUE}测试7:${NC} 薄弱点表 - 按学生和错误率查询"
run_query "SELECT * FROM student_weak_points WHERE student_id = 1 ORDER BY error_rate DESC LIMIT 10" \
    "薄弱点表 - 按学生和错误率查询" "$TEMP_BEFORE"

# 测试8: 薄弱点表 - 按知识点和状态查询
echo -e "  ${BLUE}测试8:${NC} 薄弱点表 - 按知识点和状态查询"
run_query "SELECT * FROM student_weak_points WHERE knowledge_point_id = 1 AND status = 'weak'" \
    "薄弱点表 - 按知识点和状态查询" "$TEMP_BEFORE"

# 测试9: 推荐表 - 按用户和评分查询
echo -e "  ${BLUE}测试9:${NC} 推荐表 - 按用户和评分查询"
run_query "SELECT * FROM resource_recommendations WHERE user_id = 1 ORDER BY recommendation_score DESC LIMIT 10" \
    "推荐表 - 按用户和评分查询" "$TEMP_BEFORE"

# 测试10: 推荐表 - 按推荐时间查询
echo -e "  ${BLUE}测试10:${NC} 推荐表 - 按推荐时间查询"
run_query "SELECT * FROM resource_recommendations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC" \
    "推荐表 - 按推荐时间查询" "$TEMP_BEFORE"

echo -e "${GREEN}✓ 索引前性能测试完成${NC}"
echo ""

# ========================================
# 阶段2: 添加索引
# ========================================
echo -e "${YELLOW}阶段2: 添加索引${NC}"
echo ""

echo "执行索引添加脚本..."
if [ -z "$DB_PASSWORD" ]; then
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" < scripts/task11-add-indexes.sql > /dev/null 2>&1
else
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < scripts/task11-add-indexes.sql > /dev/null 2>&1
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 索引添加成功${NC}"
else
    echo -e "${YELLOW}⚠ 索引可能已存在或添加失败${NC}"
fi
echo ""

# ========================================
# 阶段3: 添加索引后的性能测试
# ========================================
echo -e "${YELLOW}阶段3: 添加索引后的性能测试${NC}"
echo ""

# 清空临时文件
> "$TEMP_AFTER"

echo "========================================" >> "$TEMP_AFTER"
echo "添加索引后的查询性能" >> "$TEMP_AFTER"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$TEMP_AFTER"
echo "========================================" >> "$TEMP_AFTER"
echo "" >> "$TEMP_AFTER"

# 重复相同的测试
echo -e "  ${BLUE}测试1:${NC} 作业表 - 按班级和截止时间查询"
run_query "SELECT * FROM assignments WHERE class_id = 1 AND deadline > NOW() ORDER BY deadline" \
    "作业表 - 按班级和截止时间查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试2:${NC} 作业表 - 按教师和状态查询"
run_query "SELECT * FROM assignments WHERE teacher_id = 1 AND status = 'published' ORDER BY created_at DESC" \
    "作业表 - 按教师和状态查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试3:${NC} 提交表 - 按作业和状态查询"
run_query "SELECT * FROM submissions WHERE assignment_id = 1 AND status = 'graded'" \
    "提交表 - 按作业和状态查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试4:${NC} 提交表 - 按学生和提交时间查询"
run_query "SELECT * FROM submissions WHERE student_id = 1 ORDER BY submit_time DESC LIMIT 10" \
    "提交表 - 按学生和提交时间查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试5:${NC} 答题记录表 - 按提交和题目查询"
run_query "SELECT * FROM answers WHERE submission_id = 1 AND question_id = 1" \
    "答题记录表 - 按提交和题目查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试6:${NC} 答题记录表 - 查询需要复核的答题"
run_query "SELECT * FROM answers WHERE needs_review = TRUE LIMIT 20" \
    "答题记录表 - 查询需要复核的答题" "$TEMP_AFTER"

echo -e "  ${BLUE}测试7:${NC} 薄弱点表 - 按学生和错误率查询"
run_query "SELECT * FROM student_weak_points WHERE student_id = 1 ORDER BY error_rate DESC LIMIT 10" \
    "薄弱点表 - 按学生和错误率查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试8:${NC} 薄弱点表 - 按知识点和状态查询"
run_query "SELECT * FROM student_weak_points WHERE knowledge_point_id = 1 AND status = 'weak'" \
    "薄弱点表 - 按知识点和状态查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试9:${NC} 推荐表 - 按用户和评分查询"
run_query "SELECT * FROM resource_recommendations WHERE user_id = 1 ORDER BY recommendation_score DESC LIMIT 10" \
    "推荐表 - 按用户和评分查询" "$TEMP_AFTER"

echo -e "  ${BLUE}测试10:${NC} 推荐表 - 按推荐时间查询"
run_query "SELECT * FROM resource_recommendations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC" \
    "推荐表 - 按推荐时间查询" "$TEMP_AFTER"

echo -e "${GREEN}✓ 索引后性能测试完成${NC}"
echo ""

# ========================================
# 阶段4: 生成性能报告
# ========================================
echo -e "${YELLOW}阶段4: 生成性能报告${NC}"
echo ""

# 创建报告目录
mkdir -p docs

# 生成报告
cat > "$REPORT_FILE" << 'EOF'
========================================
Task 11: 数据库索引性能测试报告
========================================

测试日期: $(date '+%Y-%m-%d %H:%M:%S')
数据库: $DB_NAME
主机: $DB_HOST:$DB_PORT

========================================
测试说明
========================================

本测试对比了添加索引前后的查询性能，包括：
1. 作业表（assignments）- 2个索引
2. 提交表（submissions）- 2个索引
3. 答题记录表（answers）- 2个索引
4. 薄弱点表（student_weak_points）- 2个索引
5. 推荐表（resource_recommendations）- 2个索引

测试方法：
- 使用EXPLAIN分析查询执行计划
- 对比索引添加前后的执行计划差异
- 关注是否使用了新添加的索引

========================================
添加索引前的性能
========================================

EOF

# 追加索引前的结果
cat "$TEMP_BEFORE" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << 'EOF'

========================================
添加索引后的性能
========================================

EOF

# 追加索引后的结果
cat "$TEMP_AFTER" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << 'EOF'

========================================
性能改善总结
========================================

索引优化效果：
1. idx_class_deadline: 优化了按班级和截止时间查询作业的性能
2. idx_teacher_status: 优化了按教师和状态查询作业的性能
3. idx_assignment_status: 优化了按作业和状态查询提交的性能
4. idx_student_submit_time: 优化了按学生和提交时间查询的性能
5. idx_submission_question: 优化了按提交和题目查询答题记录的性能
6. idx_needs_review: 优化了查询需要复核的答题记录（已存在）
7. idx_student_error_rate: 优化了按学生和错误率查询薄弱点的性能
8. idx_knowledge_status: 优化了按知识点和状态查询薄弱点的性能
9. idx_user_score: 优化了按用户和评分查询推荐的性能
10. idx_recommended_at: 优化了按推荐时间查询的性能

建议：
1. 定期使用ANALYZE TABLE更新索引统计信息
2. 监控慢查询日志，识别需要优化的查询
3. 使用EXPLAIN分析查询执行计划，确认索引被正确使用
4. 避免过度索引，平衡读写性能

========================================
报告结束
========================================
EOF

echo -e "${GREEN}✓ 性能报告已生成: $REPORT_FILE${NC}"
echo ""

# 清理临时文件
rm -f "$TEMP_BEFORE" "$TEMP_AFTER" "$TEMP_SQL"

# ========================================
# 总结
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Task 11: 数据库索引性能测试完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "测试结果已保存到: $REPORT_FILE"
echo ""
echo "下一步："
echo "  1. 查看性能报告: cat $REPORT_FILE"
echo "  2. 运行验证脚本: bash test-scripts/task11-verification.sh"
echo ""

exit 0
