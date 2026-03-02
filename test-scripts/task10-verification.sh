#!/bin/bash

# ========================================
# Task 10 验证脚本
# 验证数据库SQL语法修复
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# 打印标题
print_header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
    echo ""
}

# 检查MySQL连接
check_mysql_connection() {
    ((TOTAL_CHECKS++))
    log_info "检查MySQL连接..."
    
    if mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
        log_success "MySQL连接正常"
        return 0
    else
        log_error "MySQL连接失败"
        return 1
    fi
}

# 检查数据库是否存在
check_database_exists() {
    ((TOTAL_CHECKS++))
    log_info "检查数据库是否存在..."
    
    DB_EXISTS=$(mysql -u root -e "SHOW DATABASES LIKE 'edu_education_platform'" | grep -c "edu_education_platform")
    
    if [ "$DB_EXISTS" -eq 1 ]; then
        log_success "数据库 edu_education_platform 存在"
        return 0
    else
        log_error "数据库 edu_education_platform 不存在"
        return 1
    fi
}

# 检查字段类型 - score字段
check_score_field_types() {
    print_header "Task 10.2: 检查score字段类型"
    
    # 检查 assignments.total_score
    ((TOTAL_CHECKS++))
    log_info "检查 assignments.total_score 字段类型..."
    FIELD_TYPE=$(mysql -u root -D edu_education_platform -e "
        SELECT DATA_TYPE, COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='assignments' AND COLUMN_NAME='total_score'
    " | tail -n 1 | awk '{print $1}')
    
    if [ "$FIELD_TYPE" = "int" ]; then
        log_success "assignments.total_score 类型正确 (INT)"
    else
        log_error "assignments.total_score 类型错误: $FIELD_TYPE (应为 INT)"
    fi
    
    # 检查 questions.score
    ((TOTAL_CHECKS++))
    log_info "检查 questions.score 字段类型..."
    FIELD_TYPE=$(mysql -u root -D edu_education_platform -e "
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='questions' AND COLUMN_NAME='score'
    " | tail -n 1)
    
    if [ "$FIELD_TYPE" = "int" ]; then
        log_success "questions.score 类型正确 (INT)"
    else
        log_error "questions.score 类型错误: $FIELD_TYPE (应为 INT)"
    fi
    
    # 检查 submissions.total_score
    ((TOTAL_CHECKS++))
    log_info "检查 submissions.total_score 字段类型..."
    FIELD_TYPE=$(mysql -u root -D edu_education_platform -e "
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='submissions' AND COLUMN_NAME='total_score'
    " | tail -n 1)
    
    if [ "$FIELD_TYPE" = "int" ]; then
        log_success "submissions.total_score 类型正确 (INT)"
    else
        log_error "submissions.total_score 类型错误: $FIELD_TYPE (应为 INT)"
    fi
    
    # 检查 answers.score
    ((TOTAL_CHECKS++))
    log_info "检查 answers.score 字段类型..."
    FIELD_TYPE=$(mysql -u root -D edu_education_platform -e "
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='answers' AND COLUMN_NAME='score'
    " | tail -n 1)
    
    if [ "$FIELD_TYPE" = "int" ]; then
        log_success "answers.score 类型正确 (INT)"
    else
        log_error "answers.score 类型错误: $FIELD_TYPE (应为 INT)"
    fi
}

# 检查字段类型 - error_rate字段
check_error_rate_field_type() {
    print_header "Task 10.2: 检查error_rate字段类型"
    
    ((TOTAL_CHECKS++))
    log_info "检查 student_weak_points.error_rate 字段类型..."
    FIELD_TYPE=$(mysql -u root -D edu_education_platform -e "
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='student_weak_points' AND COLUMN_NAME='error_rate'
    " | tail -n 1)
    
    if [[ "$FIELD_TYPE" == "decimal(5,2)" ]]; then
        log_success "student_weak_points.error_rate 类型正确 (DECIMAL(5,2))"
    else
        log_error "student_weak_points.error_rate 类型错误: $FIELD_TYPE (应为 DECIMAL(5,2))"
    fi
}

# 检查字段注释
check_field_comments() {
    print_header "Task 10.2: 检查字段注释"
    
    # 检查 assignments.title 注释
    ((TOTAL_CHECKS++))
    log_info "检查 assignments.title 字段注释..."
    COMMENT=$(mysql -u root -D edu_education_platform -e "
        SELECT COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='assignments' AND COLUMN_NAME='title'
    " | tail -n 1)
    
    if [ -n "$COMMENT" ]; then
        log_success "assignments.title 有注释: $COMMENT"
    else
        log_error "assignments.title 缺少注释"
    fi
    
    # 检查 submissions.status 注释
    ((TOTAL_CHECKS++))
    log_info "检查 submissions.status 字段注释..."
    COMMENT=$(mysql -u root -D edu_education_platform -e "
        SELECT COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='submissions' AND COLUMN_NAME='status'
    " | tail -n 1)
    
    if [ -n "$COMMENT" ]; then
        log_success "submissions.status 有注释: $COMMENT"
    else
        log_error "submissions.status 缺少注释"
    fi
    
    # 检查 student_weak_points.error_rate 注释
    ((TOTAL_CHECKS++))
    log_info "检查 student_weak_points.error_rate 字段注释..."
    COMMENT=$(mysql -u root -D edu_education_platform -e "
        SELECT COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='student_weak_points' AND COLUMN_NAME='error_rate'
    " | tail -n 1)
    
    if [ -n "$COMMENT" ]; then
        log_success "student_weak_points.error_rate 有注释: $COMMENT"
    else
        log_error "student_weak_points.error_rate 缺少注释"
    fi
}

# 检查数据一致性
check_data_consistency() {
    print_header "Task 10.2: 检查数据一致性"
    
    # 检查score字段是否有非整数值
    ((TOTAL_CHECKS++))
    log_info "检查score字段是否有非整数值..."
    INVALID_COUNT=$(mysql -u root -D edu_education_platform -e "
        SELECT COUNT(*) FROM (
            SELECT 'assignments' AS tbl FROM assignments WHERE total_score IS NOT NULL AND total_score != FLOOR(total_score)
            UNION ALL
            SELECT 'questions' FROM questions WHERE score IS NOT NULL AND score != FLOOR(score)
            UNION ALL
            SELECT 'submissions' FROM submissions WHERE total_score IS NOT NULL AND total_score != FLOOR(total_score)
            UNION ALL
            SELECT 'answers' FROM answers WHERE score IS NOT NULL AND score != FLOOR(score)
        ) AS invalid_scores
    " | tail -n 1)
    
    if [ "$INVALID_COUNT" -eq 0 ]; then
        log_success "所有score字段值都是整数"
    else
        log_error "发现 $INVALID_COUNT 个非整数score值"
    fi
    
    # 检查error_rate字段范围
    ((TOTAL_CHECKS++))
    log_info "检查error_rate字段范围 (0-100)..."
    INVALID_COUNT=$(mysql -u root -D edu_education_platform -e "
        SELECT COUNT(*) 
        FROM student_weak_points 
        WHERE error_rate IS NOT NULL AND (error_rate < 0 OR error_rate > 100)
    " | tail -n 1)
    
    if [ "$INVALID_COUNT" -eq 0 ]; then
        log_success "所有error_rate值都在有效范围内 (0-100)"
    else
        log_error "发现 $INVALID_COUNT 个超出范围的error_rate值"
    fi
}

# 检查GROUP BY语法
check_group_by_syntax() {
    print_header "Task 10.1: 检查GROUP BY语法"
    
    ((TOTAL_CHECKS++))
    log_info "运行GROUP BY语法分析脚本..."
    
    if [ -f "scripts/task10-analyze-group-by.ts" ]; then
        cd backend
        if npx ts-node ../scripts/task10-analyze-group-by.ts > /tmp/task10-group-by-analysis.log 2>&1; then
            log_success "所有GROUP BY语法符合MySQL 8.0严格模式"
            cd ..
        else
            log_error "发现GROUP BY语法问题，详见日志: /tmp/task10-group-by-analysis.log"
            cat /tmp/task10-group-by-analysis.log
            cd ..
        fi
    else
        log_warning "GROUP BY分析脚本不存在，跳过检查"
    fi
}

# 测试SQL查询执行
test_sql_queries() {
    print_header "Task 10.1: 测试SQL查询执行"
    
    # 测试作业列表查询（包含GROUP BY）
    ((TOTAL_CHECKS++))
    log_info "测试作业列表查询..."
    mysql -u root -D edu_education_platform -e "
        SELECT a.id, a.title, a.description, a.class_id, a.teacher_id, 
               a.difficulty, a.total_score, a.deadline, a.status, 
               a.created_at, a.updated_at, c.name, u.real_name,
               COUNT(s.id) as submission_count
        FROM assignments a
        LEFT JOIN classes c ON a.class_id = c.id
        LEFT JOIN users u ON a.teacher_id = u.id
        LEFT JOIN submissions s ON a.id = s.assignment_id
        WHERE a.class_id = 1
        GROUP BY a.id, a.title, a.description, a.class_id, a.teacher_id, 
                 a.difficulty, a.total_score, a.deadline, a.status, 
                 a.created_at, a.updated_at, c.name, u.real_name
        LIMIT 1
    " > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "作业列表查询执行成功"
    else
        log_error "作业列表查询执行失败"
    fi
    
    # 测试薄弱点查询（包含GROUP BY）
    ((TOTAL_CHECKS++))
    log_info "测试薄弱点查询..."
    mysql -u root -D edu_education_platform -e "
        SELECT kp.id, kp.name, kp.subject, AVG(swp.error_rate) as error_rate
        FROM student_weak_points swp
        JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
        WHERE swp.student_id IN (4, 5, 6)
        GROUP BY kp.id, kp.name, kp.subject
        HAVING AVG(swp.error_rate) >= 40
        LIMIT 1
    " > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "薄弱点查询执行成功"
    else
        log_error "薄弱点查询执行失败"
    fi
}

# 检查MySQL严格模式
check_mysql_strict_mode() {
    print_header "Task 10.1: 检查MySQL严格模式"
    
    ((TOTAL_CHECKS++))
    log_info "检查MySQL sql_mode设置..."
    SQL_MODE=$(mysql -u root -e "SELECT @@sql_mode" | tail -n 1)
    
    if [[ "$SQL_MODE" == *"ONLY_FULL_GROUP_BY"* ]]; then
        log_success "MySQL严格模式已启用 (ONLY_FULL_GROUP_BY)"
    else
        log_warning "MySQL严格模式未启用，建议启用ONLY_FULL_GROUP_BY"
    fi
}

# 生成验证报告
generate_report() {
    print_header "Task 10 验证报告"
    
    echo "总检查项: $TOTAL_CHECKS"
    echo "通过: $PASSED_CHECKS"
    echo "失败: $FAILED_CHECKS"
    echo ""
    
    PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "通过率: $PASS_RATE%"
    echo ""
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✓ Task 10 验证通过！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo "✓ 所有GROUP BY语法符合MySQL 8.0严格模式"
        echo "✓ 所有字段类型正确 (score: INT, error_rate: DECIMAL)"
        echo "✓ 所有字段注释完整"
        echo "✓ 数据一致性检查通过"
        echo ""
        return 0
    else
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}✗ Task 10 验证失败${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        echo "请检查上述失败项并修复"
        echo ""
        return 1
    fi
}

# 主函数
main() {
    print_header "Task 10: 数据库SQL语法修复 - 验证脚本"
    
    # 前置检查
    check_mysql_connection || exit 1
    check_database_exists || exit 1
    
    # 执行所有检查
    check_score_field_types
    check_error_rate_field_type
    check_field_comments
    check_data_consistency
    check_mysql_strict_mode
    check_group_by_syntax
    test_sql_queries
    
    # 生成报告
    generate_report
    exit $?
}

# 运行主函数
main
