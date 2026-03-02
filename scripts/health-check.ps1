# 项目深度健康度检测脚本
# 全面检测项目各个方面的健康状况

$ErrorActionPreference = "Continue"
$HealthReport = "PROJECT-HEALTH-REPORT.md"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$RootPath = Split-Path -Parent $PSScriptRoot

# 初始化报告
@"
# 项目健康度检测报告

**检测时间**: $Timestamp
**项目路径**: $RootPath

---

## 📊 检测概览

"@ | Out-File -FilePath $HealthReport -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 项目深度健康度检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "检测时间: $Timestamp"
Write-Host ""

$TotalChecks = 0
$PassedChecks = 0
$WarningChecks = 0
$FailedChecks = 0

# 检测函数
function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$Category = "General"
    )
    
    $script:TotalChecks++
    Write-Host "[检测] $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $result = & $Test
        if ($result -eq $true) {
            Write-Host " ✅" -ForegroundColor Green
            $script:PassedChecks++
            return @{ Status = "✅"; Message = "通过" }
        } elseif ($result -eq $false) {
            Write-Host " ❌" -ForegroundColor Red
            $script:FailedChecks++
            return @{ Status = "❌"; Message = "失败" }
        } else {
            Write-Host " ⚠️" -ForegroundColor Yellow
            $script:WarningChecks++
            return @{ Status = "⚠️"; Message = $result }
        }
    } catch {
        Write-Host " ❌" -ForegroundColor Red
        $script:FailedChecks++
        return @{ Status = "❌"; Message = $_.Exception.Message }
    }
}

# ========== 1. 代码质量检测 ==========
Write-Host ""
Write-Host "## 1. 代码质量检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 1. 代码质量检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 1.1 TypeScript编译检查
$result = Test-Check "TypeScript编译检查" {
    Set-Location "$RootPath\backend"
    $buildResult = npm run build 2>&1 | Out-String
    Set-Location $RootPath
    if ($buildResult -match "error TS") {
        return $false
    }
    return $true
}
"### 1.1 TypeScript编译检查`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 1.2 ESLint配置检查
$result = Test-Check "ESLint配置检查" {
    if (Test-Path "$RootPath\backend\.eslintrc.js") {
        return $true
    }
    return $false
}
"### 1.2 ESLint配置检查`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 1.3 前端构建检查
$result = Test-Check "前端构建检查" {
    Set-Location "$RootPath\frontend"
    $buildResult = npm run build 2>&1 | Out-String
    Set-Location $RootPath
    if ($buildResult -match "error" -and $buildResult -notmatch "warning") {
        return $false
    }
    return $true
}
"### 1.3 前端构建检查`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 2. 依赖管理检测 ==========
Write-Host ""
Write-Host "## 2. 依赖管理检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 2. 依赖管理检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 2.1 后端依赖完整性
$result = Test-Check "后端依赖完整性" {
    if (Test-Path "$RootPath\backend\node_modules") {
        $packageJson = Get-Content "$RootPath\backend\package.json" | ConvertFrom-Json
        $depsCount = ($packageJson.dependencies.PSObject.Properties.Count) + ($packageJson.devDependencies.PSObject.Properties.Count)
        if ($depsCount -gt 0) {
            return $true
        }
    }
    return $false
}
"### 2.1 后端依赖完整性`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 2.2 前端依赖完整性
$result = Test-Check "前端依赖完整性" {
    if (Test-Path "$RootPath\frontend\node_modules") {
        $packageJson = Get-Content "$RootPath\frontend\package.json" | ConvertFrom-Json
        $depsCount = ($packageJson.dependencies.PSObject.Properties.Count) + ($packageJson.devDependencies.PSObject.Properties.Count)
        if ($depsCount -gt 0) {
            return $true
        }
    }
    return $false
}
"### 2.2 前端依赖完整性`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 2.3 Python依赖检查
$result = Test-Check "Python依赖检查" {
    if (Test-Path "$RootPath\python-ai\requirements.txt") {
        if (Test-Path "$RootPath\python-ai\venv") {
            return $true
        }
        return "虚拟环境未创建"
    }
    return $false
}
"### 2.3 Python依赖检查`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 3. 测试覆盖检测 ==========
Write-Host ""
Write-Host "## 3. 测试覆盖检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 3. 测试覆盖检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 3.1 后端测试文件
$result = Test-Check "后端测试文件" {
    $testFiles = Get-ChildItem -Path "$RootPath\backend" -Recurse -Filter "*.test.ts" -ErrorAction SilentlyContinue
    if ($testFiles.Count -gt 0) {
        return "找到 $($testFiles.Count) 个测试文件"
    }
    return $false
}
"### 3.1 后端测试文件`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 3.2 前端测试文件
$result = Test-Check "前端测试文件" {
    $testFiles = Get-ChildItem -Path "$RootPath\frontend" -Recurse -Filter "*.test.ts" -ErrorAction SilentlyContinue
    if ($testFiles.Count -gt 0) {
        return "找到 $($testFiles.Count) 个测试文件"
    }
    return $false
}
"### 3.2 前端测试文件`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 3.3 Python测试文件
$result = Test-Check "Python测试文件" {
    if (Test-Path "$RootPath\python-ai\tests") {
        $testFiles = Get-ChildItem -Path "$RootPath\python-ai\tests" -Filter "test_*.py" -ErrorAction SilentlyContinue
        if ($testFiles.Count -gt 0) {
            return "找到 $($testFiles.Count) 个测试文件"
        }
        return "测试目录存在但无测试文件"
    }
    return "测试目录不存在"
}
"### 3.3 Python测试文件`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 4. 配置文件检测 ==========
Write-Host ""
Write-Host "## 4. 配置文件检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 4. 配置文件检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 4.1 环境变量文件
$result = Test-Check "环境变量文件" {
    $envFiles = @(
        "$RootPath\backend\.env",
        "$RootPath\frontend\.env"
    )
    $found = 0
    foreach ($file in $envFiles) {
        if (Test-Path $file) { $found++ }
    }
    if ($found -gt 0) {
        return "找到 $found 个环境变量文件"
    }
    return "未找到环境变量文件（可能需要创建）"
}
"### 4.1 环境变量文件`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 4.2 TypeScript配置
$result = Test-Check "TypeScript配置" {
    $tsConfigs = @(
        "$RootPath\backend\tsconfig.json",
        "$RootPath\frontend\tsconfig.json"
    )
    $found = 0
    foreach ($file in $tsConfigs) {
        if (Test-Path $file) { $found++ }
    }
    if ($found -eq 2) {
        return $true
    }
    return "缺少 $($tsConfigs.Count - $found) 个配置文件"
}
"### 4.2 TypeScript配置`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 4.3 CI/CD配置
$result = Test-Check "CI/CD配置" {
    $workflows = Get-ChildItem -Path "$RootPath\.github\workflows" -Filter "*.yml" -ErrorAction SilentlyContinue
    if ($workflows.Count -gt 0) {
        return "找到 $($workflows.Count) 个工作流文件"
    }
    return $false
}
"### 4.3 CI/CD配置`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 5. 文档完整性检测 ==========
Write-Host ""
Write-Host "## 5. 文档完整性检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 5. 文档完整性检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 5.1 README文件
$result = Test-Check "README文件" {
    if (Test-Path "$RootPath\README.md") {
        $content = Get-Content "$RootPath\README.md" -Raw
        if ($content.Length -gt 1000) {
            return $true
        }
        return "README文件存在但内容较少"
    }
    return $false
}
"### 5.1 README文件`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 5.2 API文档
$result = Test-Check "API文档" {
    if (Test-Path "$RootPath\docs\API-DOCUMENTATION.md") {
        return $true
    }
    return $false
}
"### 5.2 API文档`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 5.3 部署文档
$result = Test-Check "部署文档" {
    $deployDocs = @(
        "$RootPath\docs\DEPLOYMENT-GUIDE.md",
        "$RootPath\QUICK-START.md"
    )
    $found = 0
    foreach ($file in $deployDocs) {
        if (Test-Path $file) { $found++ }
    }
    if ($found -gt 0) {
        return "找到 $found 个部署相关文档"
    }
    return $false
}
"### 5.3 部署文档`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 6. 安全性检测 ==========
Write-Host ""
Write-Host "## 6. 安全性检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 6. 安全性检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 6.1 .gitignore配置
$result = Test-Check ".gitignore配置" {
    if (Test-Path "$RootPath\.gitignore") {
        $content = Get-Content "$RootPath\.gitignore" -Raw
        $sensitivePatterns = @("node_modules", ".env", "dist", "*.log")
        $found = 0
        foreach ($pattern in $sensitivePatterns) {
            if ($content -match $pattern) { $found++ }
        }
        if ($found -ge 2) {
            return $true
        }
        return "缺少部分敏感文件忽略规则"
    }
    return $false
}
"### 6.1 .gitignore配置`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 6.2 敏感信息检查
$result = Test-Check "敏感信息检查" {
    $sensitiveFiles = @(
        "$RootPath\backend\.env",
        "$RootPath\frontend\.env"
    )
    $found = 0
    foreach ($file in $sensitiveFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
            if ($content -match "password|secret|key|token" -and $content -notmatch "your_|test_|example_") {
                $found++
            }
        }
    }
    if ($found -eq 0) {
        return $true
    }
    return "发现可能的敏感信息"
}
"### 6.2 敏感信息检查`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 7. 性能优化检测 ==========
Write-Host ""
Write-Host "## 7. 性能优化检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 7. 性能优化检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 7.1 数据库连接池配置
$result = Test-Check "数据库连接池配置" {
    $dbConfig = Get-Content "$RootPath\backend\src\config\database.ts" -Raw -ErrorAction SilentlyContinue
    if ($dbConfig -match "connectionLimit|createPool") {
        return $true
    }
    return $false
}
"### 7.1 数据库连接池配置`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 7.2 前端代码分割
$result = Test-Check "前端代码分割" {
    $viteConfig = Get-Content "$RootPath\frontend\vite.config.ts" -Raw -ErrorAction SilentlyContinue
    if ($viteConfig -match "build.*rollupOptions|chunkSizeWarningLimit") {
        return $true
    }
    return "未检测到代码分割配置"
}
"### 7.2 前端代码分割`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 7.3 缓存配置
$result = Test-Check "缓存配置" {
    $redisConfig = Get-Content "$RootPath\backend\src\config\redis.ts" -Raw -ErrorAction SilentlyContinue
    if ($redisConfig -match "redis|cache") {
        return $true
    }
    return "未检测到缓存配置"
}
"### 7.3 缓存配置`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 8. 项目结构检测 ==========
Write-Host ""
Write-Host "## 8. 项目结构检测" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

@"

## 8. 项目结构检测

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 8.1 目录结构完整性
$result = Test-Check "目录结构完整性" {
    $requiredDirs = @(
        "$RootPath\backend\src",
        "$RootPath\frontend\src",
        "$RootPath\docs"
    )
    $found = 0
    foreach ($dir in $requiredDirs) {
        if (Test-Path $dir) { $found++ }
    }
    if ($found -eq $requiredDirs.Count) {
        return $true
    }
    return "缺少 $($requiredDirs.Count - $found) 个必需目录"
}
"### 8.1 目录结构完整性`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 8.2 模块化程度
$result = Test-Check "模块化程度" {
    $backendRoutes = Get-ChildItem -Path "$RootPath\backend\src\routes" -Filter "*.ts" -ErrorAction SilentlyContinue
    $frontendViews = Get-ChildItem -Path "$RootPath\frontend\src\views" -Recurse -Filter "*.vue" -ErrorAction SilentlyContinue
    if ($backendRoutes.Count -gt 5 -and $frontendViews.Count -gt 5) {
        return "后端路由: $($backendRoutes.Count), 前端视图: $($frontendViews.Count)"
    }
    return "模块化程度较低"
}
"### 8.2 模块化程度`n$($result.Status) $($result.Message)`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# ========== 生成总结报告 ==========
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 检测总结" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$healthScore = [math]::Round((($PassedChecks / $TotalChecks) * 100), 2)
$grade = if ($healthScore -ge 90) { "优秀" } elseif ($healthScore -ge 75) { "良好" } elseif ($healthScore -ge 60) { "一般" } else { "需要改进" }

Write-Host "总检测项: $TotalChecks" -ForegroundColor White
Write-Host "通过: $PassedChecks" -ForegroundColor Green
Write-Host "警告: $WarningChecks" -ForegroundColor Yellow
Write-Host "失败: $FailedChecks" -ForegroundColor Red
Write-Host "健康度评分: $healthScore%" -ForegroundColor Cyan
Write-Host "评级: $grade" -ForegroundColor Cyan
Write-Host ""

@"

---

## 📊 检测总结

| 项目 | 数量 |
|------|------|
| 总检测项 | $TotalChecks |
| ✅ 通过 | $PassedChecks |
| ⚠️ 警告 | $WarningChecks |
| ❌ 失败 | $FailedChecks |
| **健康度评分** | **$healthScore%** |
| **评级** | **$grade** |

### 健康度分析

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

if ($healthScore -ge 90) {
    $analysis = "项目健康状况优秀！代码质量、测试覆盖、文档完整性都达到了较高水平。继续保持！"
} elseif ($healthScore -ge 75) {
    $analysis = "项目健康状况良好。大部分检测项通过，但仍有改进空间。建议关注警告项和失败项。"
} elseif ($healthScore -ge 60) {
    $analysis = "项目健康状况一般。存在一些需要改进的地方，建议优先处理失败项，然后逐步改进警告项。"
} else {
    $analysis = "项目健康状况需要改进。存在较多问题，建议制定改进计划，优先处理关键问题。"
}

"$analysis`n`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8

# 建议
@"

### 改进建议

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

if ($FailedChecks -gt 0) {
    "1. **优先修复失败项** ($FailedChecks 项)`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8
}
if ($WarningChecks -gt 0) {
    "2. **处理警告项** ($WarningChecks 项)`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8
}
if ($healthScore -lt 90) {
    "3. **持续改进代码质量和测试覆盖**`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8
    "4. **完善项目文档**`n" | Out-File -FilePath $HealthReport -Append -Encoding UTF8
}

@"

---

**报告生成时间**: $Timestamp
**下次检测建议**: $(Get-Date).AddDays(7).ToString('yyyy-MM-dd')

"@ | Out-File -FilePath $HealthReport -Append -Encoding UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📄 详细报告已保存到: $HealthReport" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 显示报告摘要
Get-Content $HealthReport | Select-Object -First 50

Write-Host ""
Write-Host "查看完整报告: Get-Content $HealthReport" -ForegroundColor Yellow


