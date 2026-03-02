# Windows Redis 安装和启动脚本
# 密码: 000000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redis 安装和启动脚本 (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  警告: 建议以管理员身份运行此脚本" -ForegroundColor Yellow
    Write-Host ""
}

# 步骤1: 检查Redis是否已安装
Write-Host "[1/5] 检查Redis安装状态..." -ForegroundColor Green

$redisPaths = @(
    "C:\Program Files\Redis",
    "C:\Redis",
    "D:\Redis",
    "E:\Redis",
    "$env:ProgramFiles\Redis",
    "$env:LOCALAPPDATA\Redis"
)

$redisPath = $null
foreach ($path in $redisPaths) {
    if (Test-Path "$path\redis-server.exe") {
        $redisPath = $path
        Write-Host "✅ 找到Redis安装目录: $redisPath" -ForegroundColor Green
        break
    }
}

if (-not $redisPath) {
    Write-Host "❌ Redis未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择安装方式:" -ForegroundColor Yellow
    Write-Host "1. 自动下载并安装 (推荐)"
    Write-Host "2. 手动安装 (提供下载链接)"
    Write-Host "3. 跳过安装 (假设Redis已在其他位置)"
    Write-Host ""
    
    $choice = Read-Host "请输入选项 (1/2/3)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "开始下载Redis..." -ForegroundColor Green
        
        $downloadUrl = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
        $zipFile = "$env:TEMP\Redis.zip"
        $extractPath = "C:\Redis"
        
        try {
            # 下载Redis
            Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
            Write-Host "✅ 下载完成" -ForegroundColor Green
            
            # 解压
            Write-Host "正在解压到 $extractPath..." -ForegroundColor Green
            Expand-Archive -Path $zipFile -DestinationPath $extractPath -Force
            
            # 清理
            Remove-Item $zipFile -Force
            
            $redisPath = $extractPath
            Write-Host "✅ Redis安装完成: $redisPath" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ 下载失败: $_" -ForegroundColor Red
            Write-Host "请手动下载: $downloadUrl" -ForegroundColor Yellow
            exit 1
        }
    }
    elseif ($choice -eq "2") {
        Write-Host ""
        Write-Host "请手动下载Redis:" -ForegroundColor Yellow
        Write-Host "下载地址: https://github.com/tporadowski/redis/releases" -ForegroundColor Cyan
        Write-Host "解压到: C:\Redis" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "下载完成后，重新运行此脚本" -ForegroundColor Yellow
        pause
        exit 0
    }
    else {
        Write-Host "跳过安装，继续检查..." -ForegroundColor Yellow
    }
}

Write-Host ""

# 步骤2: 停止现有Redis进程
Write-Host "[2/5] 停止现有Redis进程..." -ForegroundColor Green

$redisProcesses = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if ($redisProcesses) {
    Write-Host "发现 $($redisProcesses.Count) 个Redis进程，正在停止..." -ForegroundColor Yellow
    $redisProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Redis进程已停止" -ForegroundColor Green
}
else {
    Write-Host "✅ 无需停止（没有运行中的Redis进程）" -ForegroundColor Green
}

Write-Host ""

# 步骤3: 创建Redis配置文件
Write-Host "[3/5] 创建Redis配置文件..." -ForegroundColor Green

if ($redisPath) {
    $configFile = "$redisPath\redis.windows.conf"
    
    $configContent = @"
# Redis配置文件 (Windows)
# 生成时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# 绑定地址
bind 127.0.0.1

# 端口
port 6379

# 密码
requirepass 000000

# 保护模式
protected-mode yes

# 数据库数量
databases 16

# 持久化
save 900 1
save 300 10
save 60 10000

# 日志级别
loglevel notice

# 最大内存
maxmemory 256mb
maxmemory-policy allkeys-lru
"@

    $configContent | Out-File -FilePath $configFile -Encoding UTF8 -Force
    Write-Host "✅ 配置文件已创建: $configFile" -ForegroundColor Green
}
else {
    Write-Host "⚠️  跳过配置文件创建（Redis路径未知）" -ForegroundColor Yellow
}

Write-Host ""

# 步骤4: 启动Redis服务
Write-Host "[4/5] 启动Redis服务..." -ForegroundColor Green

if ($redisPath) {
    try {
        $redisExe = "$redisPath\redis-server.exe"
        $configFile = "$redisPath\redis.windows.conf"
        
        if (Test-Path $configFile) {
            # 使用配置文件启动
            Start-Process -FilePath $redisExe -ArgumentList $configFile -WindowStyle Minimized
            Write-Host "✅ Redis已启动（使用配置文件）" -ForegroundColor Green
        }
        else {
            # 使用命令行参数启动
            Start-Process -FilePath $redisExe -ArgumentList "--requirepass 000000 --port 6379" -WindowStyle Minimized
            Write-Host "✅ Redis已启动（使用命令行参数）" -ForegroundColor Green
        }
        
        Write-Host "   地址: 127.0.0.1:6379" -ForegroundColor Cyan
        Write-Host "   密码: 000000" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ 启动失败: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "⚠️  跳过启动（Redis路径未知）" -ForegroundColor Yellow
}

Write-Host ""

# 步骤5: 验证Redis运行状态
Write-Host "[5/5] 验证Redis运行状态..." -ForegroundColor Green

Start-Sleep -Seconds 3

# 检查进程
$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if ($redisProcess) {
    Write-Host "✅ Redis进程运行中 (PID: $($redisProcess.Id))" -ForegroundColor Green
}
else {
    Write-Host "❌ Redis进程未运行" -ForegroundColor Red
}

# 检查端口
$port6379 = netstat -ano | Select-String ":6379.*LISTENING"
if ($port6379) {
    Write-Host "✅ 端口6379正在监听" -ForegroundColor Green
}
else {
    Write-Host "❌ 端口6379未监听" -ForegroundColor Red
}

# 测试连接
Write-Host ""
Write-Host "正在测试Redis连接..." -ForegroundColor Green
try {
    $testResult = node test-redis-connection.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redis连接测试成功" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Redis连接测试失败，但服务可能正在启动中" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  无法运行连接测试（需要Node.js）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redis启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "连接信息:" -ForegroundColor Cyan
Write-Host "  地址: 127.0.0.1:6379" -ForegroundColor White
Write-Host "  密码: 000000" -ForegroundColor White
Write-Host ""
Write-Host "提示: Redis窗口已最小化，关闭窗口会停止服务" -ForegroundColor Yellow
Write-Host ""

pause
