# ========================================
# Task 11: Database Index Verification Script (PowerShell)
# 数据库索引验证脚本 (Windows)
# ========================================

# 数据库配置
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "edu_education_platform" }

# 测试计数器
$TOTAL_TESTS = 0
$PASSED_TESTS = 0
$FAILED_TESTS = 0

# 函数：执行SQL查询
function Execute-SQL {
    param(
        [string]$Query
    )
    
    $mysqlCmd = "mysql"
    $args = @(
        "-h$DB_HOST",
        "-P$DB_PORT",
        "-u$DB_USER"
    )
    
    if ($DB_PASSWORD) {
        $args += "-p$DB_PASSWORD"
    }
    
    $args += @(
        "$DB_NAME",
        "-sN",
        "-e",
        $Query
    )
    
    try {
        $result = & $mysqlCmd $args 2>$null
        return $result
    } catch {
        return $null
    }
}

# 函数：检查索引是否存在
function Check-IndexExists {
    param(
        [string]$TableName,
        [string]$IndexName,
        [string]$Description
    )
    
    $script:TOTAL_TESTS++
    
    $query = @"
SELECT COUNT(*) 
FROM information_schema.statistics 
WHERE table_schema = '$DB_NAME' 
  AND table_name = '$TableName' 
  AND index_name = '$IndexName'
"@
    
    $result = Execute-SQL -Query $query
    
    if ($result -and [int]$result -gt 0) {
        Write-Host "  ✓ $Description" -ForegroundColor Green
        $script:PASSED_TESTS++
        return $true
    } else {
        Write-Host "  ✗ $Description" -ForegroundColor Red
        $script:FAILED_TESTS++
        return $false
    }
}

# 函数：检查索引基数
function Check-IndexCardinality {
    param(
        [string]$TableName,
        [string]$IndexName,
        [string]$Description
    )
    
    $script:TOTAL_TESTS++
    
    $query = @"
SELECT CARDINALITY 
FROM information_schema.statistics 
WHERE table_schema = '$DB_NAME' 
  AND table_name = '$TableName' 
  AND index_name = '$IndexName'
LIMIT 1
"@
    
    $cardinality = Execute-SQL -Query $query
    
    if ($cardinality) {
        Write-Host "  ✓ $Description (基数: $cardinality)" -ForegroundColor Green
        $script:PASSED_TESTS++
        return $true
    } else {
        Write-Host "  ✗ $Description (无基数信息)" -ForegroundColor Red
        $script:FAILED_TESTS++
        return $false
    }
}

# 函数：检查重复索引
function Check-DuplicateIndexes {
    param(
        [string]$TableName
    )
    
    $script:TOTAL_TESTS++
    
    $query = @"
SELECT GROUP_CONCAT(index_name) as duplicate_indexes
FROM (
    SELECT index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns
    FROM information_schema.statistics
    WHERE table_schema = '$DB_NAME' 
      AND table_name = '$TableName'
      AND index_name != 'PRIMARY'
    GROUP BY index_name
) t
GROUP BY columns
HAVING COUNT(*) > 1
"@
    
    $duplicates = Execute-SQL -Query $query
    
    if (-not $duplicates) {
        Write-Host "  ✓ 表 $TableName 无重复索引" -ForegroundColor Green
        $script:PASSED_TESTS++
        return $true
    } else {
        Write-Host "  ✗ 表 $TableName 存在重复索引: $duplicates" -ForegroundColor Red
        $script:FAILED_TESTS++
        return $false
    }
}

# ========================================
# 开始验证
# ========================================
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Task 11: 数据库索引验证" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "数据库: $DB_NAME"
Write-Host "主机: ${DB_HOST}:${DB_PORT}"
Write-Host ""

# 检查MySQL命令
Write-Host "检查MySQL命令..." -ForegroundColor Yellow
try {
    $null = Get-Command mysql -ErrorAction Stop
    Write-Host "✓ MySQL命令可用" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到mysql命令" -ForegroundColor Red
    Write-Host "请安装MySQL客户端或确保mysql在PATH中" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 检查数据库连接
Write-Host "检查数据库连接..." -ForegroundColor Yellow
$testQuery = "SELECT 1"
$testResult = Execute-SQL -Query $testQuery

if (-not $testResult) {
    Write-Host "✗ 数据库连接失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 数据库连接成功" -ForegroundColor Green
Write-Host ""

# ========================================
# 检查点1: 验证索引存在性
# ========================================
Write-Host "检查点1: 验证索引存在性" -ForegroundColor Cyan
Write-Host "----------------------------------------"

Write-Host "11.1 作业表索引:" -ForegroundColor Yellow
Check-IndexExists -TableName "assignments" -IndexName "idx_class_deadline" -Description "idx_class_deadline (class_id, deadline)"
Check-IndexExists -TableName "assignments" -IndexName "idx_teacher_status" -Description "idx_teacher_status (teacher_id, status)"

Write-Host ""
Write-Host "11.2 提交表索引:" -ForegroundColor Yellow
Check-IndexExists -TableName "submissions" -IndexName "idx_assignment_status" -Description "idx_assignment_status (assignment_id, status)"
Check-IndexExists -TableName "submissions" -IndexName "idx_student_submit_time" -Description "idx_student_submit_time (student_id, submit_time)"

Write-Host ""
Write-Host "11.3 答题记录表索引:" -ForegroundColor Yellow
Check-IndexExists -TableName "answers" -IndexName "idx_submission_question" -Description "idx_submission_question (submission_id, question_id)"
Check-IndexExists -TableName "answers" -IndexName "idx_needs_review" -Description "idx_needs_review (needs_review)"

Write-Host ""
Write-Host "11.4 薄弱点表索引:" -ForegroundColor Yellow
Check-IndexExists -TableName "student_weak_points" -IndexName "idx_student_error_rate" -Description "idx_student_error_rate (student_id, error_rate)"
Check-IndexExists -TableName "student_weak_points" -IndexName "idx_knowledge_status" -Description "idx_knowledge_status (knowledge_point_id, status)"

Write-Host ""
Write-Host "11.5 推荐表索引:" -ForegroundColor Yellow
Check-IndexExists -TableName "resource_recommendations" -IndexName "idx_user_score" -Description "idx_user_score (user_id, recommendation_score)"
Check-IndexExists -TableName "resource_recommendations" -IndexName "idx_recommended_at" -Description "idx_recommended_at (created_at)"

Write-Host ""

# ========================================
# 检查点2: 验证索引基数
# ========================================
Write-Host "检查点2: 验证索引基数" -ForegroundColor Cyan
Write-Host "----------------------------------------"

Check-IndexCardinality -TableName "assignments" -IndexName "idx_class_deadline" -Description "作业表 - idx_class_deadline"
Check-IndexCardinality -TableName "assignments" -IndexName "idx_teacher_status" -Description "作业表 - idx_teacher_status"
Check-IndexCardinality -TableName "submissions" -IndexName "idx_assignment_status" -Description "提交表 - idx_assignment_status"
Check-IndexCardinality -TableName "submissions" -IndexName "idx_student_submit_time" -Description "提交表 - idx_student_submit_time"
Check-IndexCardinality -TableName "answers" -IndexName "idx_submission_question" -Description "答题记录表 - idx_submission_question"
Check-IndexCardinality -TableName "student_weak_points" -IndexName "idx_student_error_rate" -Description "薄弱点表 - idx_student_error_rate"
Check-IndexCardinality -TableName "student_weak_points" -IndexName "idx_knowledge_status" -Description "薄弱点表 - idx_knowledge_status"
Check-IndexCardinality -TableName "resource_recommendations" -IndexName "idx_user_score" -Description "推荐表 - idx_user_score"
Check-IndexCardinality -TableName "resource_recommendations" -IndexName "idx_recommended_at" -Description "推荐表 - idx_recommended_at"

Write-Host ""

# ========================================
# 检查点3: 验证无重复索引
# ========================================
Write-Host "检查点3: 验证无重复索引" -ForegroundColor Cyan
Write-Host "----------------------------------------"

Check-DuplicateIndexes -TableName "assignments"
Check-DuplicateIndexes -TableName "submissions"
Check-DuplicateIndexes -TableName "answers"
Check-DuplicateIndexes -TableName "student_weak_points"
Check-DuplicateIndexes -TableName "resource_recommendations"

Write-Host ""

# ========================================
# 检查点4: 索引统计信息
# ========================================
Write-Host "检查点4: 索引统计信息" -ForegroundColor Cyan
Write-Host "----------------------------------------"

Write-Host "索引总数统计:"
$tables = @("assignments", "submissions", "answers", "student_weak_points", "resource_recommendations")
foreach ($table in $tables) {
    $query = @"
SELECT COUNT(DISTINCT index_name) 
FROM information_schema.statistics 
WHERE table_schema = '$DB_NAME' 
  AND table_name = '$table'
"@
    $count = Execute-SQL -Query $query
    Write-Host "  $table: $count 个索引"
}

Write-Host ""

# ========================================
# 总结
# ========================================
Write-Host "========================================" -ForegroundColor Blue
Write-Host "验证总结" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "总测试数: $TOTAL_TESTS"
Write-Host "通过: $PASSED_TESTS" -ForegroundColor Green
Write-Host "失败: $FAILED_TESTS" -ForegroundColor Red
Write-Host ""

# 计算通过率
if ($TOTAL_TESTS -gt 0) {
    $PASS_RATE = [math]::Round(($PASSED_TESTS / $TOTAL_TESTS) * 100, 1)
    Write-Host "通过率: $PASS_RATE%"
    Write-Host ""
}

# 最终结果
if ($FAILED_TESTS -eq 0) {
    Write-Host "✓ Task 11: 数据库索引优化验证通过！" -ForegroundColor Green
    Write-Host ""
    Write-Host "所有索引已正确添加并可用。"
    Write-Host ""
    Write-Host "建议："
    Write-Host "  1. 定期运行 ANALYZE TABLE 更新索引统计信息"
    Write-Host "  2. 监控慢查询日志，识别需要优化的查询"
    Write-Host "  3. 使用 EXPLAIN 分析查询执行计划"
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ Task 11: 数据库索引优化验证失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "存在 $FAILED_TESTS 个失败的测试。"
    Write-Host ""
    Write-Host "请检查："
    Write-Host "  1. 是否已运行 scripts/task11-add-indexes.sql"
    Write-Host "  2. 数据库连接是否正常"
    Write-Host "  3. 是否有足够的权限创建索引"
    Write-Host ""
    exit 1
}
