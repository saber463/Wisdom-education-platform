#!/bin/bash

################################################################################
# Task 8.4: Run All Test Scripts
#
# This script executes all test verification scripts from Tasks 1-7
# and ensures 100% pass rate
#
# Usage: bash test-scripts/task8-run-all-tests.sh
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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

# Function to run a test script
run_test() {
    local test_name=$1
    local test_script=$2
    
    log "INFO" "Running ${test_name}..."
    log "INFO" "$(printf '%.0s-' {1..80})"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ -f "$test_script" ]; then
        if bash "$test_script"; then
            log "SUCCESS" "${test_name}: PASSED"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            log "ERROR" "${test_name}: FAILED"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    else
        log "WARNING" "${test_name}: Script not found (${test_script})"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    echo ""
}

# Main execution
main() {
    log "INFO" "$(printf '%.0s=' {1..80})"
    log "INFO" "Task 8.4: Run All Test Scripts"
    log "INFO" "$(printf '%.0s=' {1..80})"
    echo ""
    
    # Check if we're in the correct directory
    if [ ! -d "test-scripts" ]; then
        log "ERROR" "test-scripts directory not found. Please run from project root."
        exit 1
    fi
    
    # Run all test verification scripts
    run_test "Task 1 Verification" "test-scripts/task1-verification.sh"
    echo ""
    
    run_test "Task 2 Verification" "test-scripts/task2-verification.sh"
    echo ""
    
    run_test "Task 3 Verification" "test-scripts/task3-verification.sh"
    echo ""
    
    run_test "Task 4 Verification" "test-scripts/task4-verification.sh"
    echo ""
    
    run_test "Task 5 Verification" "test-scripts/task5-verification.sh"
    echo ""
    
    run_test "Task 6 Verification" "test-scripts/task6-verification.sh"
    echo ""
    
    run_test "Task 7 Checkpoint" "test-scripts/task7-checkpoint-verification.sh"
    echo ""
    
    # Calculate pass rate
    if [ $TOTAL_TESTS -gt 0 ]; then
        PASS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS / $TOTAL_TESTS) * 100}")
    else
        PASS_RATE="0.00"
    fi
    
    # Print summary
    log "INFO" "$(printf '%.0s=' {1..80})"
    log "INFO" "Test Execution Summary"
    log "INFO" "$(printf '%.0s=' {1..80})"
    echo ""
    log "INFO" "Total Tests:  ${TOTAL_TESTS}"
    log "SUCCESS" "Passed:       ${PASSED_TESTS}"
    log "ERROR" "Failed:       ${FAILED_TESTS}"
    log "INFO" "Pass Rate:    ${PASS_RATE}%"
    echo ""
    
    # Check if 100% pass rate achieved
    if [ "$PASS_RATE" == "100.00" ]; then
        log "SUCCESS" "$(printf '%.0s=' {1..80})"
        log "SUCCESS" "🎉 ALL TESTS PASSED! 100% PASS RATE ACHIEVED! 🎉"
        log "SUCCESS" "$(printf '%.0s=' {1..80})"
        echo ""
        log "INFO" "Task 8.4: COMPLETED"
        log "INFO" "Phase 2 (Test Script Fixes) is now complete!"
        echo ""
        exit 0
    else
        log "ERROR" "$(printf '%.0s=' {1..80})"
        log "ERROR" "❌ SOME TESTS FAILED - Pass rate: ${PASS_RATE}% (Target: 100%)"
        log "ERROR" "$(printf '%.0s=' {1..80})"
        echo ""
        log "WARNING" "Please review the failed tests above and fix the issues."
        log "INFO" "You can re-run individual test scripts to debug specific failures."
        echo ""
        exit 1
    fi
}

# Run main function
main
