# 智慧教育平台 - 环境检查脚本 (PowerShell版本)
# 使用方法: .\Check-Environment.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "智慧教育平台 - 本地环境全量检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建日志文件
$LogFile = "install_check.log"
$ErrorLog = "install_error.log"
"检查开始时间: $(Get-Date)" | Out-File $LogFile
"安装失败项汇总" | Out-File $ErrorLog
"----------------------------------------" | Out-File $ErrorLog -Append

$TotalChecks = 0
$PassedChecks = 0
$FailedChecks = 0

Write-Host "一、基础运行环境检测" -ForegroundColor Yellow
Write-Host ""

# 检查 Node.js
Write-Host "[1/11] 检查 Node.js..." -NoNewline
$TotalChecks++
try {
    $nodeVersion = node -v 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [√] 已安装: $nodeVersion" -ForegroundColor Green
        "[√] Node.js 已安装: $nodeVersion" | Out-File $LogFile -Append
        $PassedChecks++
    } else {
        throw
    }
} catch {
    Write-Host " [×] 未安装" -ForegroundColor Red
    "[×] Node.js 未安装" | Out-File $LogFile -Append
    "Node.js|程序|本地Windows|未安装|请从 https://nodejs.org 下载安装 LTS 版本|需要手动安装" | Out-File $ErrorLog -Append
    $FailedChecks++
}

# 检查 npm
Write-Host "[2/11] 检查 npm..." -NoNewline
$TotalChecks++
try {
    $npmVersion = npm -v 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [√] 已安装: $npmVersion" -ForegroundColor Green
        "[√] npm 已安装: $npmVersion" | Out-File $LogFile -Append
        $PassedChecks++
    } else {
        throw
    }
} catch {
    Write-Host " [×] 未安装" -ForegroundColor Red
    "[×] npm 未安装" | Out-File $LogFile -Append
    $FailedChecks++
}

# 检查 Python
Write-Host "[3/11] 检查 Python..." -NoNewline
$TotalChecks++
try {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [√] 已安装: $pythonVersion" -ForegroundColor Green
        "[√] Python 已安装: $pythonVersion" | Out-File $LogFile -Append
        $PassedChecks++
    } else {
        throw
    }
} catch {
    Write-Host " [×] 未安装" -ForegroundColor Red
    "[×] Python 未安装" | Out-File $LogFile -Append
    "Python|程序|本地Windows|未安装|请从 https://www.python.org/downloads/ 下载安装 Python 3.9+|需要手动安装" | Out-File $ErrorLog -Append
    $FailedChecks++
}

# 检查 pip
Write-Host "[4/11] 检查 pip..." -NoNewline
$TotalChecks++
try {
    $pipVersion = pip --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [√] 已安装: $pipVersion" -ForegroundColor Green
        "[√] pip 已安装: $pipVersion" | Out-File $LogFile -Append
        $PassedChecks++
    } else {
        throw
    }
} catch {
    Write-Host " [×] 未安装" -ForegroundColor Red
    "[×] pip 未安装" | Out-File $LogFile -Append
    $FailedChecks++
}

# 检查 Git
Write-Host "[5/11] 检查 Git..." -NoNewline
$TotalChecks++
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [√] 已安装: $gitVersion" -ForegroundColor Green
        "[√] Git 已安装: $gitVersion" | Out-File $LogFile -Append
        $PassedChecks++
    } else {
        throw
    }
} catch {
    Write-Host " [×] 未安装" -ForegroundColor Red
    "[×] Git 未安装" | Out-File $LogFile -Append
    "Git|程序|本地Windows|未安装|请从 https://git-scm.com/download/win 下载安装|需要手动安装" | Out-File $ErrorLog -Append
    $FailedChecks++
}

Write-Host ""
Write-Host "二、中间件检测（Docker方式）" -ForegroundColor Yellow
Write-Host ""

# 检查 Docker
Write-Host "[6/11] 检查 Docker..." -NoNewline
$TotalChecks++
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [√] 已安装: $dockerVersion" -ForegroundColor Green
        "[√] Docker 已安装: $dockerVersion" | Out-File $LogFile -Append
        $PassedChecks++
        
        # 检查Docker是否运行
        docker ps >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "         Docker 服务运行中" -ForegroundColor Green
            "[√] Docker 服务运行中" | Out-File $LogFile -Append
        } else {
            Write-Host "         [!] Docker 已安装但未运行，请启动 Docker Desktop" -ForegroundColor Yellow
            "[!] Docker 已安装但未运行" | Out-File $LogFile -Append
        }
    } else {
        throw
    }
} catch {
    Write-Host " [×] 未安装" -ForegroundColor Red
    "[×] Docker 未安装" | Out-File $LogFile -Append
    "Docker|程序|本地Windows|未安装|请从 https://www.docker.com/products/docker-desktop 下载安装|需要手动安装" | Out-File $ErrorLog -Append
    $FailedChecks++
}

# 检查 MySQL 容器
Write-Host "[7/11] 检查 MySQL 容器..." -NoNewline
$TotalChecks++
$mysqlRunning = docker ps 2>$null | Select-String "mysql"
if ($mysqlRunning) {
    Write-Host " [√] 运行中" -ForegroundColor Green
    "[√] MySQL 容器运行中" | Out-File $LogFile -Append
    $PassedChecks++
} else {
    Write-Host " [!] 未运行" -ForegroundColor Yellow
    "[!] MySQL 容器未运行" | Out-File $LogFile -Append
    
    # 尝试启动
    $mysqlExists = docker ps -a 2>$null | Select-String "mysql"
    if ($mysqlExists) {
        Write-Host "         尝试启动现有容器..." -ForegroundColor Cyan
        docker start mysql >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "         [√] MySQL 容器启动成功" -ForegroundColor Green
            $PassedChecks++
        }
    } else {
        Write-Host "         尝试创建新容器..." -ForegroundColor Cyan
        docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=edu_platform mysql:8.0 >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "         [√] MySQL 容器创建成功" -ForegroundColor Green
            Write-Host "         等待MySQL初始化..." -ForegroundColor Cyan
            Start-Sleep -Seconds 10
            $PassedChecks++
        } else {
            Write-Host "         [×] MySQL 容器创建失败" -ForegroundColor Red
            "MySQL|中间件|本地Windows|Docker创建失败|检查Docker是否运行，端口3306是否被占用|需要手动排查" | Out-File $ErrorLog -Append
            $FailedChecks++
        }
    }
}

# 检查 Redis 容器
Write-Host "[8/11] 检查 Redis 容器..." -NoNewline
$TotalChecks++
$redisRunning = docker ps 2>$null | Select-String "redis"
if ($redisRunning) {
    Write-Host " [√] 运行中" -ForegroundColor Green
    "[√] Redis 容器运行中" | Out-File $LogFile -Append
    $PassedChecks++
} else {
    Write-Host " [!] 未运行" -ForegroundColor Yellow
    "[!] Redis 容器未运行" | Out-File $LogFile -Append
    
    # 尝试启动
    $redisExists = docker ps -a 2>$null | Select-String "redis"
    if ($redisExists) {
        Write-Host "         尝试启动现有容器..." -ForegroundColor Cyan
        docker start redis >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "         [√] Redis 容器启动成功" -ForegroundColor Green
            $PassedChecks++
        }
    } else {
        Write-Host "         尝试创建新容器..." -ForegroundColor Cyan
        docker run -d --name redis -p 6379:6379 redis:latest redis-server --requirepass 123456 >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "         [√] Redis 容器创建成功" -ForegroundColor Green
            $PassedChecks++
        } else {
            Write-Host "         [×] Redis 容器创建失败" -ForegroundColor Red
            "Redis|中间件|本地Windows|Docker创建失败|检查Docker是否运行，端口6379是否被占用|需要手动排查" | Out-File $ErrorLog -Append
            $FailedChecks++
        }
    }
}

Write-Host ""
Write-Host "三、项目依赖检查" -ForegroundColor Yellow
Write-Host ""

# 检查后端依赖
Write-Host "[9/11] 检查后端依赖..." -NoNewline
$TotalChecks++
if (Test-Path "backend\node_modules") {
    Write-Host " [√] 已安装" -ForegroundColor Green
    "[√] 后端依赖已安装" | Out-File $LogFile -Append
    $PassedChecks++
} else {
    Write-Host " [!] 未安装，开始安装..." -ForegroundColor Yellow
    if (Test-Path "backend\package.json") {
        Push-Location backend
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "         [√] 后端依赖安装成功" -ForegroundColor Green
            $PassedChecks++
        } else {
            Write-Host "         [×] 后端依赖安装失败" -ForegroundColor Red
            "后端依赖|依赖包|本地Windows|npm install失败|检查网络连接，尝试使用国内镜像|需要手动安装" | Out-File $ErrorLog -Append
            $FailedChecks++
        }
        Pop-Location
    } else {
        Write-Host " [!] 未找到backend目录" -ForegroundColor Yellow
        $FailedChecks++
    }
}

# 检查前端依赖
Write-Host "[10/11] 检查前端依赖..." -NoNewline
$TotalChecks++
if (Test-Path "frontend\node_modules") {
    Write-Host " [√] 已安装" -ForegroundColor Green
    "[√] 前端依赖已安装" | Out-File $LogFile -Append
    $PassedChecks++
} else {
    Write-Host " [!] 未安装，开始安装..." -ForegroundColor Yellow
    if (Test-Path "frontend\package.json") {
        Push-Location frontend
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "         [√] 前端依赖安装成功" -ForegroundColor Green
            $PassedChecks++
        } else {
            Write-Host "         [×] 前端依赖安装失败" -ForegroundColor Red
            "前端依赖|依赖包|本地Windows|npm install失败|检查网络连接，尝试使用国内镜像|需要手动安装" | Out-File $ErrorLog -Append
            $FailedChecks++
        }
        Pop-Location
    } else {
        Write-Host " [!] 未找到frontend目录" -ForegroundColor Yellow
        $FailedChecks++
    }
}

# 检查Python依赖
Write-Host "[11/11] 检查Python依赖..." -NoNewline
$TotalChecks++
if (Test-Path "python-ai\requirements.txt") {
    Push-Location python-ai
    
    # 检查虚拟环境
    $venvPath = "venv"
    $venvExists = Test-Path $venvPath
    
    if (-not $venvExists) {
        Write-Host " [!] 未检测到虚拟环境" -ForegroundColor Yellow
        Write-Host "         建议创建虚拟环境以隔离依赖" -ForegroundColor Cyan
        Write-Host "         创建命令: python -m venv venv" -ForegroundColor Cyan
        Write-Host "         激活命令: venv\Scripts\activate" -ForegroundColor Cyan
        "[!] Python虚拟环境未创建" | Out-File ..\$LogFile -Append
    } else {
        Write-Host " [√] 虚拟环境已存在" -ForegroundColor Green
        "[√] Python虚拟环境已创建" | Out-File ..\$LogFile -Append
        
        # 检查是否在虚拟环境中
        if ($env:VIRTUAL_ENV) {
            Write-Host "         [√] 当前已在虚拟环境中" -ForegroundColor Green
        } else {
            Write-Host "         [!] 当前未激活虚拟环境" -ForegroundColor Yellow
            Write-Host "         建议激活: venv\Scripts\activate" -ForegroundColor Cyan
        }
    }
    
    Write-Host " [*] 开始安装依赖..." -ForegroundColor Cyan
    
    # 如果在虚拟环境中，使用虚拟环境的pip
    if ($env:VIRTUAL_ENV) {
        $pipCmd = "$env:VIRTUAL_ENV\Scripts\pip.exe"
        if (Test-Path $pipCmd) {
            & $pipCmd install -r requirements.txt >$null 2>&1
        } else {
            pip install -r requirements.txt >$null 2>&1
        }
    } else {
        # 如果虚拟环境存在但未激活，尝试使用虚拟环境的pip
        if ($venvExists) {
            $venvPip = "$venvPath\Scripts\pip.exe"
            if (Test-Path $venvPip) {
                & $venvPip install -r requirements.txt >$null 2>&1
            } else {
                pip install -r requirements.txt >$null 2>&1
            }
        } else {
            pip install -r requirements.txt >$null 2>&1
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [√] 安装成功" -ForegroundColor Green
        "[√] Python依赖安装成功" | Out-File ..\$LogFile -Append
        $PassedChecks++
    } else {
        Write-Host " [×] 安装失败" -ForegroundColor Red
        "[×] Python依赖安装失败" | Out-File ..\$LogFile -Append
        "Python依赖|依赖包|本地Windows|pip install失败|检查网络连接，尝试使用国内镜像，或创建虚拟环境后安装|需要手动安装" | Out-File ..\$ErrorLog -Append
        $FailedChecks++
    }
    Pop-Location
} else {
    Write-Host " [!] 未找到python-ai目录" -ForegroundColor Yellow
    $FailedChecks++
}

Write-Host ""
Write-Host "四、端口检查" -ForegroundColor Yellow
Write-Host ""

Write-Host "检查关键端口占用情况..." -ForegroundColor Cyan

$ports = @(
    @{Port=3000; Service="后端"},
    @{Port=5173; Service="前端"},
    @{Port=50051; Service="AI服务"},
    @{Port=3306; Service="MySQL"},
    @{Port=6379; Service="Redis"}
)

foreach ($p in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $p.Port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        if ($p.Port -eq 3306 -or $p.Port -eq 6379) {
            Write-Host "  [√] 端口 $($p.Port) ($($p.Service)) 已占用（正常）" -ForegroundColor Green
        } else {
            Write-Host "  [!] 端口 $($p.Port) ($($p.Service)) 已被占用" -ForegroundColor Yellow
        }
    } else {
        if ($p.Port -eq 3306 -or $p.Port -eq 6379) {
            Write-Host "  [!] 端口 $($p.Port) ($($p.Service)) 未占用" -ForegroundColor Yellow
        } else {
            Write-Host "  [√] 端口 $($p.Port) ($($p.Service)) 可用" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "检查完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "统计信息：" -ForegroundColor Yellow
Write-Host "  总检查项: $TotalChecks" -ForegroundColor White
Write-Host "  通过: $PassedChecks" -ForegroundColor Green
Write-Host "  失败: $FailedChecks" -ForegroundColor Red
Write-Host ""
Write-Host "详细日志已保存到: $LogFile" -ForegroundColor Cyan
Write-Host "失败项汇总已保存到: $ErrorLog" -ForegroundColor Cyan
Write-Host ""

if ($FailedChecks -eq 0) {
    Write-Host "✓ 所有检查通过！可以启动服务了。" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：运行 .\start-services.bat 启动所有服务" -ForegroundColor Cyan
} else {
    Write-Host "! 发现 $FailedChecks 个问题需要解决" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "下一步操作：" -ForegroundColor Cyan
    Write-Host "1. 查看 $ErrorLog 了解需要手动处理的项目" -ForegroundColor White
    Write-Host "2. 安装完缺失的程序后，重新运行此脚本" -ForegroundColor White
    Write-Host "3. 所有检查通过后，运行 .\start-services.bat 启动服务" -ForegroundColor White
}

Write-Host ""
