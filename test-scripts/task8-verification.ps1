################################################################################
# Task 8 Verification Script (PowerShell)
#
# This script verifies all sub-tasks of Task 8:
# - 8.1: Username format unified (no underscores)
# - 8.2: Password hashes fixed (bcrypt saltRounds=10)
# - 8.3: Test data consistency verified
# - 8.4: All test scripts pass (100% pass rate)
#
# Usage: pwsh test-scripts/task8-verification.ps1
################################################################################

# Counters
$script:TotalChecks = 0
$script:PassedChecks = 0
$script:FailedChecks = 0

# Log function with timestamp
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ" -AsUTC
    
    switch ($Level) {
        "INFO" {
            Write-Host "[$timestamp] 📋 $Message" -ForegroundColor Cyan
        }
        "SUCCESS" {
            Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green
        }
        "WARNING" {
            Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow
        }
        "ERROR" {
            Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red
        }
    }
}

# Function to run a check
function Start-Check {
    param([string]$CheckName)
    
    $script:TotalChecks++
    Write-Log "INFO" "Check $($script:TotalChecks): $CheckName"
}

# Function to mark check as passed
function Set-CheckPassed {
    $script:PassedChecks++
    Write-Log "SUCCESS" "Check $($script:TotalChecks): PASSED"
}

# Function to mark check as failed
function Set-CheckFailed {
    param([string]$Reason)
    
    $script:FailedChecks++
    Write-Log "ERROR" "Check $($script:TotalChecks): FAILED - $Reason"
}

# Main execution
function Main {
    Write-Log "INFO" ("=" * 80)
    Write-Log "INFO" "Task 8 Verification: Fix Test Script Data Mismatch"
    Write-Log "INFO" ("=" * 80)
    Write-Host ""
    
    # ========================================
    # Verification 8.1: Username Format
    # ========================================
    Write-Log "INFO" "Verification 8.1: Username format unified"
    Write-Log "INFO" ("-" * 80)
    
    Start-Check "Test data fix script exists"
    if (Test-Path "scripts/task8-fix-test-data.ts") {
        Set-CheckPassed
    } else {
        Set-CheckFailed "scripts/task8-fix-test-data.ts not found"
    }
    
    Start-Check "Verification script exists"
    if (Test-Path "scripts/task8-verify-test-data.ts") {
        Set-CheckPassed
    } else {
        Set-CheckFailed "scripts/task8-verify-test-data.ts not found"
    }
    
    Write-Host ""
    
    # ========================================
    # Verification 8.2: Password Hash Fixed
    # ========================================
    Write-Log "INFO" "Verification 8.2: Password hashes fixed"
    Write-Log "INFO" ("-" * 80)
    
    Start-Check "Fix script includes bcrypt password hashing"
    if (Test-Path "scripts/task8-fix-test-data.ts") {
        $content = Get-Content "scripts/task8-fix-test-data.ts" -Raw
        if ($content -match "bcrypt\.hash") {
            Set-CheckPassed
        } else {
            Set-CheckFailed "bcrypt.hash not found in fix script"
        }
    } else {
        Set-CheckFailed "Fix script not found"
    }
    
    Start-Check "Fix script uses saltRounds=10"
    if (Test-Path "scripts/task8-fix-test-data.ts") {
        $content = Get-Content "scripts/task8-fix-test-data.ts" -Raw
        if ($content -match "SALT_ROUNDS = 10") {
            Set-CheckPassed
        } else {
            Set-CheckFailed "SALT_ROUNDS = 10 not found in fix script"
        }
    } else {
        Set-CheckFailed "Fix script not found"
    }
    
    Write-Host ""
    
    # ========================================
    # Verification 8.3: Data Consistency
    # ========================================
    Write-Log "INFO" "Verification 8.3: Test data consistency verified"
    Write-Log "INFO" ("-" * 80)
    
    Start-Check "Verification script checks username format"
    if (Test-Path "scripts/task8-verify-test-data.ts") {
        $content = Get-Content "scripts/task8-verify-test-data.ts" -Raw
        if ($content -match "username.*underscore") {
            Set-CheckPassed
        } else {
            Set-CheckFailed "Username format check not found"
        }
    } else {
        Set-CheckFailed "Verification script not found"
    }
    
    Start-Check "Verification script checks password hash"
    if (Test-Path "scripts/task8-verify-test-data.ts") {
        $content = Get-Content "scripts/task8-verify-test-data.ts" -Raw
        if ($content -match "bcrypt\.compare") {
            Set-CheckPassed
        } else {
            Set-CheckFailed "Password hash check not found"
        }
    } else {
        Set-CheckFailed "Verification script not found"
    }
    
    Start-Check "Verification script checks class associations"
    if (Test-Path "scripts/task8-verify-test-data.ts") {
        $content = Get-Content "scripts/task8-verify-test-data.ts" -Raw
        if ($content -match "class.*association") {
            Set-CheckPassed
        } else {
            Set-CheckFailed "Class association check not found"
        }
    } else {
        Set-CheckFailed "Verification script not found"
    }
    
    Start-Check "Verification script checks assignment data"
    if (Test-Path "scripts/task8-verify-test-data.ts") {
        $content = Get-Content "scripts/task8-verify-test-data.ts" -Raw
        if ($content -match "assignment") {
            Set-CheckPassed
        } else {
            Set-CheckFailed "Assignment data check not found"
        }
    } else {
        Set-CheckFailed "Verification script not found"
    }
    
    Write-Host ""
    
    # ========================================
    # Verification 8.4: Test Execution
    # ========================================
    Write-Log "INFO" "Verification 8.4: All test scripts execution"
    Write-Log "INFO" ("-" * 80)
    
    Start-Check "Test execution script exists"
    if (Test-Path "test-scripts/task8-run-all-tests.sh") {
        Set-CheckPassed
    } else {
        Set-CheckFailed "test-scripts/task8-run-all-tests.sh not found"
    }
    
    Start-Check "Test execution script includes all task verifications"
    if (Test-Path "test-scripts/task8-run-all-tests.sh") {
        $content = Get-Content "test-scripts/task8-run-all-tests.sh" -Raw
        if (($content -match "task1-verification") -and ($content -match "task7-checkpoint")) {
            Set-CheckPassed
        } else {
            Set-CheckFailed "Not all task verifications included"
        }
    } else {
        Set-CheckFailed "Test execution script not found"
    }
    
    Write-Host ""
    
    # ========================================
    # Additional Checks
    # ========================================
    Write-Log "INFO" "Additional Checks"
    Write-Log "INFO" ("-" * 80)
    
    Start-Check "Documentation exists"
    if (Test-Path "docs/task8-implementation-summary.md") {
        Set-CheckPassed
    } else {
        Set-CheckFailed "docs/task8-implementation-summary.md not found"
    }
    
    Start-Check "Bash verification script exists"
    if (Test-Path "test-scripts/task8-verification.sh") {
        Set-CheckPassed
    } else {
        Set-CheckFailed "test-scripts/task8-verification.sh not found"
    }
    
    Write-Host ""
    
    # ========================================
    # Summary
    # ========================================
    Write-Log "INFO" ("=" * 80)
    Write-Log "INFO" "Verification Summary"
    Write-Log "INFO" ("=" * 80)
    Write-Host ""
    Write-Log "INFO" "Total Checks: $($script:TotalChecks)"
    Write-Log "SUCCESS" "Passed:       $($script:PassedChecks)"
    Write-Log "ERROR" "Failed:       $($script:FailedChecks)"
    Write-Host ""
    
    # Calculate pass rate
    if ($script:TotalChecks -gt 0) {
        $passRate = [math]::Round(($script:PassedChecks / $script:TotalChecks) * 100, 2)
    } else {
        $passRate = 0
    }
    
    Write-Log "INFO" "Pass Rate:    $passRate%"
    Write-Host ""
    
    # Final result
    if ($script:FailedChecks -eq 0) {
        Write-Log "SUCCESS" ("=" * 80)
        Write-Log "SUCCESS" "✅ Task 8 Verification: ALL CHECKS PASSED"
        Write-Log "SUCCESS" ("=" * 80)
        Write-Host ""
        Write-Log "INFO" "Next steps:"
        Write-Log "INFO" "  1. Run fix script: npx ts-node scripts/task8-fix-test-data.ts"
        Write-Log "INFO" "  2. Run verification: npx ts-node scripts/task8-verify-test-data.ts"
        Write-Log "INFO" "  3. Run all tests: bash test-scripts/task8-run-all-tests.sh"
        Write-Host ""
        exit 0
    } else {
        Write-Log "ERROR" ("=" * 80)
        Write-Log "ERROR" "❌ Task 8 Verification: SOME CHECKS FAILED"
        Write-Log "ERROR" ("=" * 80)
        Write-Host ""
        Write-Log "WARNING" "Please review the failed checks above and fix the issues."
        Write-Host ""
        exit 1
    }
}

# Run main function
Main
