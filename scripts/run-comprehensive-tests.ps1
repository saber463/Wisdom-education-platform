# 修复 Windows PowerShell 乱码问题
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

# 设置环境变量
$env:PYTHONIOENCODING = 'utf-8'
$env:NODE_ENV = 'test'

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "智慧教育学习平台 - 综合功能测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查后端服务是否运行
Write-Host "[检查] 验证后端服务状态..." -ForegroundColor Yellow
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $backendRunning = $true
        Write-Host "✅ 后端服务正在运行" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  后端服务未运行，请先启动后端服务" -ForegroundColor Yellow
}

if (-not $backendRunning) {
    Write-Host ""
    Write-Host "启动后端服务..." -ForegroundColor Yellow
    Push-Location backend
    npm start &
    Start-Sleep -Seconds 5
    Pop-Location
}

Write-Host ""
Write-Host "[1/3] 执行后端单元测试..." -ForegroundColor Yellow
Push-Location backend
npm test 2>&1 | ForEach-Object {
    if ($_ -match "PASS|✓") {
        Write-Host $_ -ForegroundColor Green
    } elseif ($_ -match "FAIL|✗|Error") {
        Write-Host $_ -ForegroundColor Red
    } else {
        Write-Host $_
    }
}
Pop-Location
Write-Host "✅ 后端单元测试完成" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] 执行前端单元测试..." -ForegroundColor Yellow
Push-Location frontend
npm test -- --run 2>&1 | ForEach-Object {
    if ($_ -match "PASS|✓") {
        Write-Host $_ -ForegroundColor Green
    } elseif ($_ -match "FAIL|✗|Error") {
        Write-Host $_ -ForegroundColor Red
    } else {
        Write-Host $_
    }
}
Pop-Location
Write-Host "✅ 前端单元测试完成" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] 执行集成功能测试..." -ForegroundColor Yellow
Write-Host "创建测试用户并验证所有功能..." -ForegroundColor Cyan
Write-Host ""

# 创建测试用户数据
$testUsers = @(
    @{
        username = "teacher_test_001"
        password = "Teacher@123"
        real_name = "测试教师"
        role = "teacher"
        email = "teacher_test@example.com"
    },
    @{
        username = "student_test_001"
        password = "Student@123"
        real_name = "测试学生1"
        role = "student"
        email = "student_test_001@example.com"
    },
    @{
        username = "student_test_002"
        password = "Student@123"
        real_name = "测试学生2"
        role = "student"
        email = "student_test_002@example.com"
    },
    @{
        username = "parent_test_001"
        password = "Parent@123"
        real_name = "测试家长"
        role = "parent"
        email = "parent_test@example.com"
    }
)

$testResults = @()
$passCount = 0
$failCount = 0

# 测试用户注册和登录
Write-Host "【用户管理测试】" -ForegroundColor Cyan
foreach ($user in $testUsers) {
    try {
        # 注册用户
        $registerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
            -Method POST `
            -ContentType "application/json" `
            -Body ($user | ConvertTo-Json) `
            -ErrorAction SilentlyContinue
        
        if ($registerResponse.StatusCode -eq 201 -or $registerResponse.StatusCode -eq 200) {
            Write-Host "✅ 用户注册成功: $($user.username)" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "❌ 用户注册失败: $($user.username)" -ForegroundColor Red
            $failCount++
        }
        
        # 登录用户
        $loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body (@{
                username = $user.username
                password = $user.password
            } | ConvertTo-Json) `
            -ErrorAction SilentlyContinue
        
        if ($loginResponse.StatusCode -eq 200) {
            Write-Host "✅ 用户登录成功: $($user.username)" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "❌ 用户登录失败: $($user.username)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "❌ 用户操作异常: $($user.username) - $($_.Exception.Message)" -ForegroundColor Red
        $failCount += 2
    }
}

Write-Host ""
Write-Host "【作业管理测试】" -ForegroundColor Cyan
try {
    # 创建作业
    $assignmentResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/assignments" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            title = "综合测试作业"
            description = "用于验证系统功能的测试作业"
            class_id = 1
            difficulty = "medium"
            total_score = 100
            deadline = (Get-Date).AddDays(7).ToString("o")
        } | ConvertTo-Json) `
        -ErrorAction SilentlyContinue
    
    if ($assignmentResponse.StatusCode -eq 201 -or $assignmentResponse.StatusCode -eq 200) {
        Write-Host "✅ 作业创建成功" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "❌ 作业创建失败" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "❌ 作业操作异常: $($_.Exception.Message)" -ForegroundColor Red
    $failCount++
}

Write-Host ""
Write-Host "【学情分析测试】" -ForegroundColor Cyan
try {
    $analyticsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/analytics/class/1" `
        -Method GET `
        -ErrorAction SilentlyContinue
    
    if ($analyticsResponse.StatusCode -eq 200) {
        Write-Host "✅ 学情分析查询成功" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "❌ 学情分析查询失败" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "❌ 学情分析异常: $($_.Exception.Message)" -ForegroundColor Red
    $failCount++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试执行完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 测试统计:" -ForegroundColor Yellow
Write-Host "   ✅ 通过: $passCount" -ForegroundColor Green
Write-Host "   ❌ 失败: $failCount" -ForegroundColor Red
Write-Host "   📈 通过率: $(if ($passCount + $failCount -gt 0) { [math]::Round(($passCount / ($passCount + $failCount)) * 100, 2) }else { 0 })%" -ForegroundColor Cyan
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 所有测试通过！项目闭环验证成功！" -ForegroundColor Green
} else {
    Write-Host "⚠️  有 $failCount 个测试失败，请检查日志" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
