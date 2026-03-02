@echo off
chcp 65001 >nul
REM ========================================
REM Checkpoint 25 - Functional Testing
REM ========================================
echo.
echo ========================================
echo Checkpoint 25 - Scripts and Recovery Functional Test
echo ========================================
echo.

set PASS_COUNT=0
set FAIL_COUNT=0
set TOTAL_TESTS=0

REM Test 1: Resource Monitor Module
echo [Test 1/8] Testing Resource Monitor Module...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- src/services/__tests__/resource-monitor.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Resource Monitor tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Resource Monitor tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Test 2: Health Monitor Module
echo [Test 2/8] Testing Health Monitor Module...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- src/services/__tests__/health-monitor.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Health Monitor tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Health Monitor tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Test 3: Startup Order Script
echo [Test 3/8] Testing Startup Order Script...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- scripts/__tests__/startup-order.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Startup Order tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Startup Order tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Test 4: Service Shutdown Script
echo [Test 4/8] Testing Service Shutdown Script...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- scripts/__tests__/service-shutdown.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Service Shutdown tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Service Shutdown tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Test 5: Emergency Repair Script
echo [Test 5/8] Testing Emergency Repair Script...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- scripts/__tests__/emergency-repair.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Emergency Repair tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Emergency Repair tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Test 6: Database Backup Script
echo [Test 6/8] Testing Database Backup Script...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- scripts/__tests__/database-backup.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Database Backup tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Database Backup tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Test 7: Demo Data Reset Script
echo [Test 7/8] Testing Demo Data Reset Script...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- scripts/__tests__/demo-data-reset.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Demo Data Reset tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Demo Data Reset tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Test 8: Mirror Switcher Script
echo [Test 8/8] Testing Mirror Switcher Script...
set /a TOTAL_TESTS+=1
cd backend
call npm test -- scripts/__tests__/mirror-switcher.property.test.ts --run --reporter=verbose 2>nul
if %ERRORLEVEL%==0 (
    echo [PASS] Mirror Switcher tests passed
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Mirror Switcher tests failed
    set /a FAIL_COUNT+=1
)
cd ..
echo.

REM Summary
echo ========================================
echo Checkpoint 25 Functional Test Summary
echo ========================================
echo Total Tests: %TOTAL_TESTS%
echo Passed: %PASS_COUNT%
echo Failed: %FAIL_COUNT%
echo ========================================
echo.

if %FAIL_COUNT%==0 (
    echo [SUCCESS] All functional tests passed!
    echo.
    echo All scripts and recovery mechanisms are working correctly:
    echo   - Resource monitoring and limiting
    echo   - Health monitoring and auto-restart
    echo   - Service startup ordering
    echo   - Service shutdown procedures
    echo   - Emergency repair functionality
    echo   - Database backup operations
    echo   - Demo data reset capability
    echo   - Mirror switching for dependencies
    echo.
    exit /b 0
) else (
    echo [WARNING] %FAIL_COUNT% test(s) failed. Please review the failures above.
    echo.
    exit /b 1
)
