# =========================================
# Learning AI Platform - Service Manager
# =========================================
# Usage:
#   - Right click -> Run with PowerShell
#   - Enter number to select action
# =========================================

param([int]$Action = 0)

$ErrorActionPreference = "SilentlyContinue"
$PROJECT_ROOT = "D:/edu-ai-platform-web/Wisdom-education-platform/learning-ai-platform"
$FRONTEND_DIR = "$PROJECT_ROOT/client"
$BACKEND_DIR = "$PROJECT_ROOT/server"

function Show-Menu {
    Clear-Host
    Write-Host "========================================"
    Write-Host "  Learning AI Platform - Service Manager"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "  [1] Start All Services"
    Write-Host "  [2] Stop All Services"
    Write-Host "  [3] Restart All Services"
    Write-Host "  [4] Check Port Status"
    Write-Host "  [5] Clean nginx processes"
    Write-Host "  [0] Exit"
    Write-Host ""
}

function Check-Ports {
    Write-Host "`n[Port Status]" -ForegroundColor Cyan
    $ports = @(3000, 4001, 5000, 80)
    $names = @{3000="Frontend"; 4001="Backend"; 5000="AI-Svc"; 80="Nginx"}

    foreach ($port in $ports) {
        $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($proc) {
            $p = Get-Process -Id $proc.OwningProcess -ErrorAction SilentlyContinue
            Write-Host "  [OK] Port $port ($($names[$port])): $($p.ProcessName) PID=$($proc.OwningProcess)" -ForegroundColor Green
        } else {
            Write-Host "  [--] Port $port ($($names[$port])): Not running" -ForegroundColor Gray
        }
    }
}

function Stop-All-Services {
    Write-Host "`n[Stopping services...]" -ForegroundColor Yellow

    # Stop extra nginx
    $nginxCount = (Get-Process nginx* -ErrorAction SilentlyContinue).Count
    if ($nginxCount -gt 1) {
        Write-Host "  Found $nginxCount nginx processes, cleaning..." -ForegroundColor Yellow
        Stop-Process -Name "nginx" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "nginx_server" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }

    # Stop project node processes
    Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
            if ($cmd -match "learning-ai-platform|vite|nodemon") {
                Write-Host "  Stopping Node PID=$($_.Id)" -ForegroundColor Yellow
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            }
        } catch {}
    }

    Write-Host "  Done" -ForegroundColor Green
}

function Start-Frontend {
    Write-Host "`n[Starting Frontend...]" -ForegroundColor Cyan
    if (-not (Test-Path "$FRONTEND_DIR/package.json")) {
        Write-Host "  ERROR: Frontend dir not found" -ForegroundColor Red
        return $false
    }

    # Kill port 3000 if occupied
    $portCheck = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Stop-Process -Id $portCheck.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }

    Set-Location $FRONTEND_DIR
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND_DIR'; npm run dev"
    Write-Host "  Frontend started in new window (port 3000)" -ForegroundColor Green
    return $true
}

function Start-Backend {
    Write-Host "`n[Starting Backend...]" -ForegroundColor Cyan
    if (-not (Test-Path "$BACKEND_DIR/package.json")) {
        Write-Host "  ERROR: Backend dir not found" -ForegroundColor Red
        return $false
    }

    # Kill port 4001 if occupied
    $portCheck = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Stop-Process -Id $portCheck.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }

    Set-Location $BACKEND_DIR
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; npm run dev"
    Write-Host "  Backend started in new window (port 4001)" -ForegroundColor Green
    return $true
}

function Start-All {
    Stop-All-Services
    Start-Sleep -Seconds 2
    Start-Backend
    Start-Sleep -Seconds 2
    Start-Frontend
    Start-Sleep -Seconds 3
    Check-Ports
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  All services started!"
    Write-Host "  Visit: http://localhost" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Green
}

function Clean-Nginx {
    Write-Host "`n[Cleaning nginx processes...]" -ForegroundColor Yellow
    Stop-Process -Name "nginx" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "nginx_server" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    $remaining = (Get-Process nginx* -ErrorAction SilentlyContinue).Count
    if ($remaining -eq 0) {
        Write-Host "  All nginx processes cleaned" -ForegroundColor Green
    } else {
        Write-Host "  $remaining nginx processes remaining" -ForegroundColor Yellow
    }
}

# Main
if ($Action -eq 0) {
    Show-Menu
    $choice = Read-Host "Enter option"
} else {
    $choice = $Action
}

switch ($choice) {
    "1" { Start-All }
    "2" { Stop-All-Services }
    "3" { Stop-All-Services; Start-Sleep -Seconds 2; Start-All }
    "4" { Check-Ports }
    "5" { Clean-Nginx }
    "0" { exit }
    default { Write-Host "Invalid option"; Start-Sleep -1 }
}

if ($Action -eq 0) {
    Read-Host "`nPress Enter to exit"
}
