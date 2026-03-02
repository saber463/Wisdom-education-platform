# CI/CD 完整测试套件 - PowerShell版本
# 模拟 GitHub Actions 流程，执行所有模块的测试

$ErrorActionPreference = "Continue"
$TestReport = "CI-CD-TEST-REPORT.md"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# 初始化报告
$reportPath = Join-Path $PSScriptRoot "..\$TestReport"
@"
# CI/CD 测试报告

**测试时间**: $Timestamp
**测试类型**: 完整 CI/CD 流程模拟

---
"@ | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 CI/CD 完整测试套件" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "模拟 GitHub Actions 工作流"
Write-Host "测试时间: $Timestamp"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========== 后端模块测试 ==========
Write-Host ""
Write-Host "[1/6] 🔵 后端模块 (Node.js/TypeScript)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

"## 1. 后端模块测试`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

$backendPath = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendPath

# 1.1 代码检查
Write-Host "[1.1] 运行 ESLint 代码检查..." -ForegroundColor Yellow
$lintLog = Join-Path $PSScriptRoot "..\backend-lint.log"
$lintResult = npm run lint 2>&1 | Tee-Object -FilePath $lintLog
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ESLint 检查通过" -ForegroundColor Green
    $content = "### 1.1 代码检查 (ESLint)`n✅ ESLint 检查通过`n`n"
    $content | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $PassedTests++
} else {
    Write-Host "⚠️  ESLint 检查有警告" -ForegroundColor Yellow
    $content = "### 1.1 代码检查 (ESLint)`n⚠️  ESLint 检查有警告`n`n"
    $content | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $FailedTests++
}
$TotalTests++

# 1.2 快速测试
Write-Host "[1.2] 运行快速测试 (Jest)..." -ForegroundColor Yellow
$env:NODE_ENV = "test"
$testLog = Join-Path $PSScriptRoot "..\backend-test.log"
$testResult = npm run test:fast 2>&1 | Tee-Object -FilePath $testLog
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 快速测试通过" -ForegroundColor Green
    "### 1.2 快速测试 (Jest)`n✅ 快速测试通过`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $PassedTests++
} else {
    Write-Host "❌ 快速测试失败" -ForegroundColor Red
    "### 1.2 快速测试 (Jest)`n❌ 快速测试失败`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $FailedTests++
}
$TotalTests++

# 1.3 构建验证
Write-Host "[1.3] 验证 TypeScript 构建..." -ForegroundColor Yellow
$buildLog = Join-Path $PSScriptRoot "..\backend-build.log"
$buildResult = npm run build 2>&1 | Tee-Object -FilePath $buildLog
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 构建成功" -ForegroundColor Green
    "### 1.3 构建验证`n✅ 构建成功`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $PassedTests++
} else {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    "### 1.3 构建验证`n❌ 构建失败`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $FailedTests++
}
$TotalTests++

Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "✅ 后端模块测试完成" -ForegroundColor Green
"`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

# ========== 前端模块测试 ==========
Write-Host ""
Write-Host "[2/6] 🟢 前端模块 (Vue3/TypeScript)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

"## 2. 前端模块测试`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

$frontendPath = Join-Path $PSScriptRoot "..\frontend"
Set-Location $frontendPath

# 2.1 代码检查
Write-Host "[2.1] 运行 ESLint 代码检查..." -ForegroundColor Yellow
$lintResult = npm run lint 2>&1 | Tee-Object -FilePath "..\frontend-lint.log"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ESLint 检查通过" -ForegroundColor Green
    @"
### 2.1 代码检查 (ESLint)
✅ ESLint 检查通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $PassedTests++
} else {
    Write-Host "⚠️  ESLint 检查有警告" -ForegroundColor Yellow
    @"
### 2.1 代码检查 (ESLint)
⚠️  ESLint 检查有警告

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $FailedTests++
}
$TotalTests++

# 2.2 测试
Write-Host "[2.2] 运行前端测试 (Vitest)..." -ForegroundColor Yellow
$testResult = npm run test 2>&1 | Tee-Object -FilePath "..\frontend-test.log"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 前端测试通过" -ForegroundColor Green
    @"
### 2.2 前端测试 (Vitest)
✅ 前端测试通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $PassedTests++
} else {
    Write-Host "⚠️  前端测试失败或未配置" -ForegroundColor Yellow
    @"
### 2.2 前端测试 (Vitest)
⚠️  前端测试失败或未配置

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $FailedTests++
}
$TotalTests++

# 2.3 类型检查
Write-Host "[2.3] 运行 TypeScript 类型检查..." -ForegroundColor Yellow
$typeCheckResult = npx vue-tsc --noEmit 2>&1 | Tee-Object -FilePath "..\frontend-typecheck.log"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 类型检查通过" -ForegroundColor Green
    @"
### 2.3 类型检查 (vue-tsc)
✅ 类型检查通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $PassedTests++
} else {
    Write-Host "⚠️  类型检查有错误" -ForegroundColor Yellow
    @"
### 2.3 类型检查 (vue-tsc)
⚠️  类型检查有错误

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $FailedTests++
}
$TotalTests++

# 2.4 构建验证
Write-Host "[2.4] 验证前端构建..." -ForegroundColor Yellow
$buildResult = npm run build 2>&1 | Tee-Object -FilePath "..\frontend-build.log"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 构建成功" -ForegroundColor Green
    @"
### 2.4 构建验证
✅ 构建成功

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $PassedTests++
} else {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    @"
### 2.4 构建验证
❌ 构建失败

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
    $FailedTests++
}
$TotalTests++

Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "✅ 前端模块测试完成" -ForegroundColor Green
"`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

# ========== Python AI 服务测试 ==========
Write-Host ""
Write-Host "[3/6] 🐍 Python AI 服务" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

"## 3. Python AI 服务测试`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

$pythonPath = Join-Path $PSScriptRoot "..\python-ai"
Set-Location $pythonPath

# 3.1 代码质量检查
Write-Host "[3.1] 运行代码质量检查..." -ForegroundColor Yellow
if (Get-Command python -ErrorAction SilentlyContinue) {
    $lintResult = python -m pip install flake8 --quiet 2>&1
    $flake8Result = python -m flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics 2>&1 | Tee-Object -FilePath "..\python-lint.log"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 代码质量检查通过" -ForegroundColor Green
        @"
### 3.1 代码质量检查
✅ 代码质量检查通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $PassedTests++
    } else {
        Write-Host "⚠️  代码质量检查有警告" -ForegroundColor Yellow
        @"
### 3.1 代码质量检查
⚠️  代码质量检查有警告

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $FailedTests++
    }
    $TotalTests++
} else {
    Write-Host "⚠️  Python 未安装，跳过" -ForegroundColor Yellow
}

# 3.2 测试
Write-Host "[3.2] 运行 Python 测试 (pytest)..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
    if (Test-Path "tests") {
        $testResult = pytest tests/ -v --tb=short 2>&1 | Tee-Object -FilePath "..\python-test.log"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Python 测试通过" -ForegroundColor Green
            @"
### 3.2 Python 测试 (pytest)
✅ Python 测试通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
            $PassedTests++
        } else {
            Write-Host "⚠️  Python 测试失败或未配置" -ForegroundColor Yellow
            @"
### 3.2 Python 测试 (pytest)
⚠️  Python 测试失败或未配置

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
            $FailedTests++
        }
        $TotalTests++
    } else {
        Write-Host "⚠️  测试目录不存在，跳过" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Python 虚拟环境不存在，跳过测试" -ForegroundColor Yellow
    @"
### 3.2 Python 测试 (pytest)
⚠️  Python 虚拟环境不存在，跳过测试

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
}

Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "✅ Python AI 服务测试完成" -ForegroundColor Green
"`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

# ========== Rust 服务测试 ==========
Write-Host ""
Write-Host "[4/6] 🦀 Rust 服务 (可选)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

"## 4. Rust 服务测试`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

$rustPath = Join-Path $PSScriptRoot "..\rust-service"
Set-Location $rustPath

# 4.1 格式化检查
Write-Host "[4.1] 运行代码格式化检查..." -ForegroundColor Yellow
if (Get-Command cargo -ErrorAction SilentlyContinue) {
    $fmtResult = cargo fmt --all -- --check 2>&1 | Tee-Object -FilePath "..\rust-fmt.log"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 格式化检查通过" -ForegroundColor Green
        @"
### 4.1 格式化检查 (cargo fmt)
✅ 格式化检查通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $PassedTests++
    } else {
        Write-Host "⚠️  格式化检查有差异" -ForegroundColor Yellow
        @"
### 4.1 格式化检查 (cargo fmt)
⚠️  格式化检查有差异

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $FailedTests++
    }
    $TotalTests++

    # 4.2 代码检查
    Write-Host "[4.2] 运行代码检查 (clippy)..." -ForegroundColor Yellow
    $clippyResult = cargo clippy --all-targets --all-features -- -D warnings 2>&1 | Tee-Object -FilePath "..\rust-clippy.log"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Clippy 检查通过" -ForegroundColor Green
        @"
### 4.2 代码检查 (clippy)
✅ Clippy 检查通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $PassedTests++
    } else {
        Write-Host "⚠️  Clippy 检查有警告" -ForegroundColor Yellow
        @"
### 4.2 代码检查 (clippy)
⚠️  Clippy 检查有警告

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $FailedTests++
    }
    $TotalTests++

    # 4.3 测试
    Write-Host "[4.3] 运行 Rust 测试..." -ForegroundColor Yellow
    $testResult = cargo test --release --verbose 2>&1 | Tee-Object -FilePath "..\rust-test.log"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Rust 测试通过" -ForegroundColor Green
        @"
### 4.3 Rust 测试
✅ Rust 测试通过

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $PassedTests++
    } else {
        Write-Host "⚠️  Rust 测试失败或未配置" -ForegroundColor Yellow
        @"
### 4.3 Rust 测试
⚠️  Rust 测试失败或未配置

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $FailedTests++
    }
    $TotalTests++

    # 4.4 构建验证
    Write-Host "[4.4] 验证 Release 构建..." -ForegroundColor Yellow
    $buildResult = cargo build --release 2>&1 | Tee-Object -FilePath "..\rust-build.log"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 构建成功" -ForegroundColor Green
        @"
### 4.4 构建验证
✅ 构建成功

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $PassedTests++
    } else {
        Write-Host "⚠️  构建失败或未配置" -ForegroundColor Yellow
        @"
### 4.4 构建验证
⚠️  构建失败或未配置

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
        $FailedTests++
    }
    $TotalTests++
} else {
    Write-Host "⚠️  Rust/Cargo 未安装，跳过" -ForegroundColor Yellow
    @"
### Rust 服务
⚠️  Rust/Cargo 未安装，跳过测试

"@ | Out-File -FilePath "..\$TestReport" -Append -Encoding UTF8
}

Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "✅ Rust 服务测试完成" -ForegroundColor Green
"`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8

# ========== 测试总结 ==========
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 测试总结" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SuccessRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 2) } else { 0 }

$summary = "## 测试总结`n`n| 项目 | 通过 | 失败 | 总计 |`n|------|------|------|------|`n| 所有模块 | $PassedTests | $FailedTests | $TotalTests |`n`n**成功率**: $SuccessRate%`n`n"
$summary | Out-File -FilePath $reportPath -Append -Encoding UTF8

if ($FailedTests -eq 0) {
    Write-Host "✅ 所有测试通过！" -ForegroundColor Green
    Write-Host "✅ 通过: $PassedTests / $TotalTests" -ForegroundColor Green
    Write-Host "✅ 成功率: $SuccessRate%" -ForegroundColor Green
    "✅ **所有测试通过！**`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $exitCode = 0
} else {
    Write-Host "❌ 部分测试失败" -ForegroundColor Red
    Write-Host "✅ 通过: $PassedTests / $TotalTests" -ForegroundColor Yellow
    Write-Host "❌ 失败: $FailedTests / $TotalTests" -ForegroundColor Red
    Write-Host "📊 成功率: $SuccessRate%" -ForegroundColor Yellow
    "❌ **部分测试失败**`n`n" | Out-File -FilePath $reportPath -Append -Encoding UTF8
    $exitCode = 1
}

$logInfo = "---`n**详细日志文件**:`n- backend-lint.log, backend-test.log, backend-build.log`n- frontend-lint.log, frontend-test.log, frontend-typecheck.log, frontend-build.log`n- python-lint.log, python-test.log`n- rust-fmt.log, rust-clippy.log, rust-test.log, rust-build.log`n"
$logInfo | Out-File -FilePath $reportPath -Append -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📄 测试报告已保存到: $reportPath" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Get-Content $reportPath

exit $exitCode

