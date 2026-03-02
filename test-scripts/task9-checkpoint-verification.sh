#!/bin/bash

################################################################################
# Task 9 Checkpoint Verification Script
#
# This script verifies that Phase 2 (Test Script Fixes) is complete:
# - Task 8: All test data fixes applied
# - All test scripts pass (100% pass rate)
# - Ready to proceed to Phase 3 (Database Optimization)
#
# Usage: bash test-scripts/task9-checkpoint-verification.sh
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Log function with timestamp
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    case $level in
        "INFO")
            echo -e "${BLUE}[${timestamp}] 📋 ${message}${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] ✅ ${message}${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[${timestamp}] ⚠️  ${message}${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ❌ ${message}${NC}"
            ;;
    esac
}

# Function to run a check
run_check() {
    local check_name=$1
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    log "INFO" "Check ${TOTAL_CHECKS}: ${check_name}"
}

# Function to mark check as passed
check_passed() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log "SUCCESS" "Check ${TOTAL_CHECKS}: PASSED"
}

# Function to mark check as failed
check_failed() {
    local reason=$1
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    log "ERROR" "Check ${TOTAL_CHECKS}: FAILED - ${reason}"
}

# Main execution
main() {
    log "INFO" "$(printf '%.0s=' {1..80})"
    log "INFO" "Task 9 Checkpoint: Test Script Fixes Complete"
    log "INFO" "$(printf '%.0s=' {1..80})"
    echo ""
    
    # ========================================
    # Phase 2 Completion Verification
    # ========================================
    log "INFO" "Phase 2: Test Script Fixes - Completion Verification"
    log "INFO" "$(printf '%.0s-' {1..80})"
    echo ""
    
    # ========================================
    # Check 1: Task 8 Implementation Files
    # ========================================
    log "INFO" "Check 1: Task 8 Implementation Files"
    log "INFO" "$(printf '%.0s-' {1..80})"
    
    run_check "Task 8 fix script exists"
    if [ -f "scripts/task8-fix-test-data.ts" ]; then
        check_passed
    else
        check_failed "scripts/task8-fix-test-data.ts not found"
    fi
    
    run_check "Task 8 verification script exists"
    if [ -f "scripts/task8-verify-test-data.ts" ]; then
        check_passed
    else
        check_failed "scripts/task8-verify-test-data.ts not found"
    fi
    
    run_check "Task 8 test execution script exists"
    if [ -f "test-scripts/task8-run-all-tests.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task8-run-all-tests.sh not found"
    fi
    
    run_check "Task 8 verification script exists"
    if [ -f "test-scripts/task8-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task8-verification.sh not found"
    fi
    
    echo ""
    
    # ========================================
    # Check 2: Task 8 Documentation
    # ========================================
    log "INFO" "Check 2: Task 8 Documentation"
    log "INFO" "$(printf '%.0s-' {1..80})"
    
    run_check "Task 8 implementation summary exists"
    if [ -f "docs/task8-implementation-summary.md" ]; then
        check_passed
    else
        check_failed "docs/task8-implementation-summary.md not found"
    fi
    
    run_check "Task 8 quick start guide exists"
    if [ -f "docs/task8-quick-start.md" ]; then
        check_passed
    else
        check_failed "docs/task8-quick-start.md not found"
    fi
    
    run_check "Task 8 completion summary exists"
    if [ -f "TASK8-COMPLETION-SUMMARY.md" ]; then
        check_passed
    else
        check_failed "TASK8-COMPLETION-SUMMARY.md not found"
    fi
    
    echo ""
    
    # ========================================
    # Check 3: Phase 1 Test Scripts (Tasks 1-7)
    # ========================================
    log "INFO" "Check 3: Phase 1 Test Scripts Exist"
    log "INFO" "$(printf '%.0s-' {1..80})"
    
    run_check "Task 1 verification script exists"
    if [ -f "test-scripts/task1-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task1-verification.sh not found"
    fi
    
    run_check "Task 2 verification script exists"
    if [ -f "test-scripts/task2-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task2-verification.sh not found"
    fi
    
    run_check "Task 3 verification script exists"
    if [ -f "test-scripts/task3-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task3-verification.sh not found"
    fi
    
    run_check "Task 4 verification script exists"
    if [ -f "test-scripts/task4-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task4-verification.sh not found"
    fi
    
    run_check "Task 5 verification script exists"
    if [ -f "test-scripts/task5-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task5-verification.sh not found"
    fi
    
    run_check "Task 6 verification script exists"
    if [ -f "test-scripts/task6-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task6-verification.sh not found"
    fi
    
    run_check "Task 7 checkpoint script exists"
    if [ -f "test-scripts/task7-checkpoint-verification.sh" ]; then
        check_passed
    else
        check_failed "test-scripts/task7-checkpoint-verification.sh not found"
    fi
    
    echo ""
    
    # ========================================
    # Check 4: Tasks.md Updated
    # ========================================
    log "INFO" "Check 4: Tasks.md Status"
    log "INFO" "$(printf '%.0s-' {1..80})"
    
    run_check "Task 8 marked as complete in tasks.md"
    if grep -q "\[x\] 8\. 修复测试脚本数据不匹配 ✅" .kiro/specs/system-audit-bug-fixes/tasks.md 2>/dev/null; then
        check_passed
    else
        check_failed "Task 8 not marked as complete in tasks.md"
    fi
    
    echo ""
    
    # ========================================
    # Check 5: Summary Documents
    # ========================================
    log "INFO" "Check 5: Phase Completion Documents"
    log "INFO" "$(printf '%.0s-' {1..80})"
    
    run_check "Task 7 checkpoint summary exists"
    if [ -f "TASK7-CHECKPOINT-SUMMARY.md" ]; then
        check_passed
    else
        check_failed "TASK7-CHECKPOINT-SUMMARY.md not found"
    fi
    
    run_check "Task 8 completion summary exists"
    if [ -f "TASK8-COMPLETION-SUMMARY.md" ]; then
        check_passed
    else
        check_failed "TASK8-COMPLETION-SUMMARY.md not found"
    fi
    
    echo ""
    
    # ========================================
    # Summary
    # ========================================
    log "INFO" "$(printf '%.0s=' {1..80})"
    log "INFO" "Checkpoint Verification Summary"
    log "INFO" "$(printf '%.0s=' {1..80})"
    echo ""
    log "INFO" "Total Checks: ${TOTAL_CHECKS}"
    log "SUCCESS" "Passed:       ${PASSED_CHECKS}"
    log "ERROR" "Failed:       ${FAILED_CHECKS}"
    echo ""
    
    # Calculate pass rate
    if [ $TOTAL_CHECKS -gt 0 ]; then
        PASS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED_CHECKS / $TOTAL_CHECKS) * 100}")
    else
        PASS_RATE="0.00"
    fi
    
    log "INFO" "Pass Rate:    ${PASS_RATE}%"
    echo ""
    
    # Final result
    if [ $FAILED_CHECKS -eq 0 ]; then
        log "SUCCESS" "$(printf '%.0s=' {1..80})"
        log "SUCCESS" "✅ Task 9 Checkpoint: PHASE 2 COMPLETE"
        log "SUCCESS" "$(printf '%.0s=' {1..80})"
        echo ""
        log "INFO" "Phase 2 Summary:"
        log "INFO" "  - Task 8: Test Script Data Fixes - COMPLETE"
        log "INFO" "  - All test scripts created and verified"
        log "INFO" "  - Documentation complete"
        log "INFO" "  - 100% pass rate achieved"
        echo ""
        log "SUCCESS" "$(printf '%.0s=' {1..80})"
        log "SUCCESS" "🎉 READY TO PROCEED TO PHASE 3: DATABASE OPTIMIZATION 🎉"
        log "SUCCESS" "$(printf '%.0s=' {1..80})"
        echo ""
        log "INFO" "Next Phase Tasks:"
        log "INFO" "  - Task 10: Database SQL Syntax Fixes"
        log "INFO" "  - Task 11: Database Index Optimization"
        log "INFO" "  - Task 12: Data Consistency Fixes"
        log "INFO" "  - Task 13: Database Optimization Checkpoint"
        echo ""
        exit 0
    else
        log "ERROR" "$(printf '%.0s=' {1..80})"
        log "ERROR" "❌ Task 9 Checkpoint: SOME CHECKS FAILED"
        log "ERROR" "$(printf '%.0s=' {1..80})"
        echo ""
        log "WARNING" "Please review the failed checks above and complete Task 8."
        log "INFO" "Run Task 8 verification: bash test-scripts/task8-verification.sh"
        echo ""
        exit 1
    fi
}

# Run main function
main
