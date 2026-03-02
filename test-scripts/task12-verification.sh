#!/bin/bash

# ========================================
# Task 12: 数据一致性修复 - 验证脚本
# 功能: 验证孤立数据清理和错误率修复
# 平台: Linux/Mac
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 数据库配置
DB_HOST="localhost"
DB_USER="root"
DB_PASS=""
DB_NAME="edu_education_platform"

# 统计变量
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 日志函数
log_info() {
    echo -e "${CYAN}ℹ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
    ((PASSED_CHECKS++))
}

log_error() {
    echo -e "${RED}✗ ${1}${NC}"
    ((FAILED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

log_section() {
    echo ""
    echo -e "${BOLD}========================================${NC}"
    echo -e "${BOLD}${1}${NC}"
    echo -e "${BOLD}========================================${NC}"
}

# 执行SQL查询
execute_query() {
    local query="$1"
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "$query" 2>/dev/null
}

# 检查MySQL连接
check_mysql_connection() {
    ((TOTAL_CHECKS++))
    log_info "检查MySQL连接..."
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1" &>/dev/null; then
        log_success "MySQL连接正常"
        return 0
    else
        log_error "MySQL连接失败"
        return 1
    fi
}

# 检查数据库存在
check_database_exists() {
    ((TOTAL_CHECKS++))
    log_info "检查数据库存在性..."
    
    local result=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -sN -e "SHOW DATABASES LIKE '$DB_NAME'" 2>/dev/null)
    
    if [ -n "$result" ]; then
        log_success "数据库 $DB_NAME 存在"
        return 0
    else
        log_error "数据库 $DB_NAME 不存在"
        return 1
    fi
}

# ========================================
# 孤立数据检查
# ========================================

check_orphaned_submissions_assignment() {
    ((TOTAL_CHECKS++))
    log_info "检查无效提交记录（引用不存在的作业）..."
    
    local count=$(execute_query "
        SELECT COUNT(*) 
        FROM submissions s
        LEFT JOIN assignments a ON s.assignment_id = a.id
        WHERE a.id IS NULL
    ")
    
    if [ "$count" -eq 0 ]; then
        log_success "无效提交记录（引用不存在的作业）: 0 条"
        return 0
    else
        log_error "无效提交记录（引用不存在的作业）: $count 条"
        return 1
    fi
}

check_orphaned_submissions_student() {
    ((TOTAL_CHECKS++))
    log_info "检查无效提交记录（引用不存在的学生）..."
    
    local count=$(execute_query "
        SELECT COUNT(*) 
        FROM submissions s
        LEFT JOIN users u ON s.student_id = u.id
        WHERE u.id IS NULL
    ")
    
    if [ "$count" -eq 0 ]; then
        log_success "无效提交记录（引用不存在的学生）: 0 条"
        return 0
    else
        log_error "无效提交记录（引用不存在的学生）: $count 条"
        return 1
    fi
}

check_orphaned_answers_submission() {
    ((TOTAL_CHECKS++))
    log_info "检查无效答题记录（引用不存在的提交）..."
    
    local count=$(execute_query "
        SELECT COUNT(*) 
        FROM answers a
        LEFT JOIN submissions s ON a.submission_id = s.id
        WHERE s.id IS NULL
    ")
    
    if [ "$count" -eq 0 ]; then
        log_success "无效答题记录（引用不存在的提交）: 0 条"
        return 0
    else
       