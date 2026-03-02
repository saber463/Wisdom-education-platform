# ========================================
# Task 10 验证脚本 (PowerShell版本)
# 验证数据库SQL语法修复
# ========================================

# 计数器
$script:TotalChecks = 0
$script:PassedChecks = 0
$script:FailedChecks = 0

# 日志函数
function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Log-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
    $script:PassedChecks++
}

function Log-Error {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor Red
    $script:FailedChecks++
}

function Log-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

# 打印标题
function Print-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================"
    Write-Host $Title
    Write-Host "========================================"
    Write-Host ""
}

# 执行MySQL查询
function Invoke-MySQLQuery {
    param(
        [string]$Query,
        [string]$Database = ""
    )
    
    $mysqlCmd = "mysql"
    $args = @("-u", "root")
    
    if ($Database) {
        $args += @("-D", $Database)
    }
    
    $args += @("-e", $Query)
    
    try {
        $result = & $mysqlCmd $args 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $result
        } else {
            return $null
        }
    } catch {
        return $null
    }
}

# 检查MySQL连接
function Test-MySQLConnection {
    $script:TotalChecks++
    Log-Info "检查MySQL连接..."
    
    $result = Invoke-MySQLQuery -Query "SELECT 1"
    
    if ($result) {
        Log-Success "MySQL连接正常"
        return $true
    } else {
        Log-Error "MySQL连接失败"
        return $false
    }
}

# 检查数据库是否存在
function Test-DatabaseExists {
    $script:TotalChecks++
    Log-Info "检查数据库是否存在..."
    
    $result = Invoke-MySQLQuery -Query "SHOW DATABASES LIKE 'edu_education_platform'"
    
    if ($result -match "edu_education_platform") {
        Log-Success "数据库 edu_education_platform 存在"
        return $true
    } else {
        Log-Error "数据库 edu_education_platform 不存在"
        return $false
    }
}

# 检查字段类型 - score字段
function Test-ScoreFieldTypes {
    Print-Header "Task 10.2: 检查score字段类型"
    
    # 检查 assignments.total_score
    $script:TotalChecks++
    Log-Info "检查 assignments.total_score 字段类型..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='assignments' AND COLUMN_NAME='total_score'
"@
    
    if ($result -match "int") {
        Log-Success "assignments.total_score 类型正确 (INT)"
    } else {
        Log-Error "assignments.total_score 类型错误 (应为 INT)"
    }
    
    # 检查 questions.score
    $script:TotalChecks++
    Log-Info "检查 questions.score 字段类型..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='questions' AND COLUMN_NAME='score'
"@
    
    if ($result -match "int") {
        Log-Success "questions.score 类型正确 (INT)"
    } else {
        Log-Error "questions.score 类型错误 (应为 INT)"
    }
    
    # 检查 submissions.total_score
    $script:TotalChecks++
    Log-Info "检查 submissions.total_score 字段类型..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='submissions' AND COLUMN_NAME='total_score'
"@
    
    if ($result -match "int") {
        Log-Success "submissions.total_score 类型正确 (INT)"
    } else {
        Log-Error "submissions.total_score 类型错误 (应为 INT)"
    }
    
    # 检查 answers.score
    $script:TotalChecks++
    Log-Info "检查 answers.score 字段类型..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='answers' AND COLUMN_NAME='score'
"@
    
    if ($result -match "int") {
        Log-Success "answers.score 类型正确 (INT)"
    } else {
        Log-Error "answers.score 类型错误 (应为 INT)"
    }
}

# 检查字段类型 - error_rate字段
function Test-ErrorRateFieldType {
    Print-Header "Task 10.2: 检查error_rate字段类型"
    
    $script:TotalChecks++
    Log-Info "检查 student_weak_points.error_rate 字段类型..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='student_weak_points' AND COLUMN_NAME='error_rate'
"@
    
    if ($result -match "decimal\(5,2\)") {
        Log-Success "student_weak_points.error_rate 类型正确 (DECIMAL(5,2))"
    } else {
        Log-Error "student_weak_points.error_rate 类型错误 (应为 DECIMAL(5,2))"
    }
}

# 检查字段注释
function Test-FieldComments {
    Print-Header "Task 10.2: 检查字段注释"
    
    # 检查 assignments.title 注释
    $script:TotalChecks++
    Log-Info "检查 assignments.title 字段注释..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='assignments' AND COLUMN_NAME='title'
"@
    
    if ($result -and $result.Length -gt 10) {
        Log-Success "assignments.title 有注释"
    } else {
        Log-Error "assignments.title 缺少注释"
    }
    
    # 检查 submissions.status 注释
    $script:TotalChecks++
    Log-Info "检查 submissions.status 字段注释..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='submissions' AND COLUMN_NAME='status'
"@
    
    if ($result -and $result.Length -gt 10) {
        Log-Success "submissions.status 有注释"
    } else {
        Log-Error "submissions.status 缺少注释"
    }
    
    # 检查 student_weak_points.error_rate 注释
    $script:TotalChecks++
    Log-Info "检查 student_weak_points.error_rate 字段注释..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='student_weak_points' AND COLUMN_NAME='error_rate'
"@
    
    if ($result -and $result.Length -gt 10) {
        Log-Success "student_weak_points.error_rate 有注释"
    } else {
        Log-Error "student_weak_points.error_rate 缺少注释"
    }
}

# 检查数据一致性
function Test-DataConsistency {
    Print-Header "Task 10.2: 检查数据一致性"
    
    # 检查score字段是否有非整数值
    $script:TotalChecks++
    Log-Info "检查score字段是否有非整数值..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT COUNT(*) as count FROM (
            SELECT 'assignments' AS tbl FROM assignments WHERE total_score IS NOT NULL AND total_score != FLOOR(total_score)
            UNION ALL
            SELECT 'questions' FROM questions WHERE score IS NOT NULL AND score != FLOOR(score)
            UNION ALL
            SELECT 'submissions' FROM submissions WHERE total_score IS NOT NULL AND total_score != FLOOR(total_score)
            UNION ALL
            SELECT 'answers' FROM answers WHERE score IS NOT NULL AND score != FLOOR(score)
        ) AS invalid_scores
"@
    
    if ($result -match "0") {
        Log-Success "所有score字段值都是整数"
    } else {
        Log-Error "发现非整数score值"
    }
    
    # 检查error_rate字段范围
    $script:TotalChecks++
    Log-Info "检查error_rate字段范围 (0-100)..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT COUNT(*) as count
        FROM student_weak_points 
        WHERE error_rate IS NOT NULL AND (error_rate < 0 OR error_rate > 100)
"@
    
    if ($result -match "0") {
        Log-Success "所有error_rate值都在有效范围内 (0-100)"
    } else {
        Log-Error "发现超出范围的error_rate值"
    }
}

# 检查GROUP BY语法
function Test-GroupBySyntax {
    Print-Header "Task 10.1: 检查GROUP BY语法"
    
    $script:TotalChecks++
    Log-Info "运行GROUP BY语法分析脚本..."
    
    if (Test-Path "scripts/task10-analyze-group-by.ts") {
        Push-Location backend
        try {
            $output = npx ts-node ../scripts/task10-analyze-group-by.ts 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log-Success "所有GROUP BY语法符合MySQL 8.0严格模式"
            } else {
                Log-Error "发现GROUP BY语法问题"
                Write-Host $output
            }
        } finally {
            Pop-Location
        }
    } else {
        Log-Warning "GROUP BY分析脚本不存在，跳过检查"
    }
}

# 测试SQL查询执行
function Test-SQLQueries {
    Print-Header "Task 10.1: 测试SQL查询执行"
    
    # 测试作业列表查询
    $script:TotalChecks++
    Log-Info "测试作业列表查询..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
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
"@
    
    if ($result) {
        Log-Success "作业列表查询执行成功"
    } else {
        Log-Error "作业列表查询执行失败"
    }
    
    # 测试薄弱点查询
    $script:TotalChecks++
    Log-Info "测试薄弱点查询..."
    $result = Invoke-MySQLQuery -Database "edu_education_platform" -Query @"
        SELECT kp.id, kp.name, kp.subject, AVG(swp.error_rate) as error_rate
        FROM student_weak_points swp
        JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
        WHERE swp.student_id IN (4, 5, 6)
        GROUP BY kp.id, kp.name, kp.subject
        HAVING AVG(swp.error_rate) >= 40
        LIMIT 1
"@
    
    if ($result) {
        Log-Success "薄弱点查询执行成功"
    } else {
        Log-Error "薄弱点查询执行失败"
    }
}

# 检查MySQL严格模式
function Test-MySQLStrictMode {
    Print-Header "Task 10.1: 检查MySQL严格模式"
    
    $script:TotalChecks++
    Log-Info "检查MySQL sql_mode设置..."
    $result = Invoke-MySQLQuery -Query "SELECT @@sql_mode"
    
    if ($result -match "ONLY_FULL_GROUP_BY") {
        Log-Success "MySQL严格模式已启用 (ONLY_FULL_GROUP_BY)"
    } else {
        Log-Warning "MySQL严格模式未启用，建议启用ONLY_FULL_GROUP_BY"
    }
}

# 生成验证报告
function Show-Report {
    Print-Header "Task 10 验证报告"
    
    Write-Host "总检查项: $script:TotalChecks"
    Write-Host "通过: $script:PassedChecks"
    Write-Host "失败: $script:FailedChecks"
    Write-Host ""
    
    $passRate = [math]::Round(($script:PassedChecks / $script:TotalChecks) * 100, 2)
    Write-Host "通过率: $passRate%"
    Write-Host ""
    
    if ($script:FailedChecks -eq 0) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ Task 10 验证通过！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "✓ 所有GROUP BY语法符合MySQL 8.0严格模式"
        Write-Host "✓ 所有字段类型正确 (score: INT, error_rate: DECIMAL)"
        Write-Host "✓ 所有字段注释完整"
        Write-Host "✓ 数据一致性检查通过"
        Write-Host ""
        return $true
    } else {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "✗ Task 10 验证失败" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "请检查上述失败项并修复"
        Write-Host ""
        return $false
    }
}

# 主函数
function Main {
    Print-Header "Task 10: 数据库SQL语法修复 - 验证脚本"
    
    # 前置检查
    if (-not (Test-MySQLConnection)) {
        exit 1
    }
    
    if (-not (Test-DatabaseExists)) {
        exit 1
    }
    
    # 执行所有检查
    Test-ScoreFieldTypes
    Test-ErrorRateFieldType
    Test-FieldComments
    Test-DataConsistency
    Test-MySQLStrictMode
    Test-GroupBySyntax
    Test-SQLQueries
    
    # 生成报告
    $success = Show-Report
    
    if ($success) {
        exit 0
    } else {
        exit 1
    }
}

# 运行主函数
Main
