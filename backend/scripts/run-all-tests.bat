@echo off
REM 运行所有测试脚本 (Windows版本)
REM Task: 22.1, 22.2, 22.3

echo ==========================================
echo 开始运行所有测试
echo ==========================================

REM 设置测试环境
set NODE_ENV=test
set DB_NAME=edu_education_platform_test

REM 1. 运行单元测试
echo.
echo 1. 运行单元测试...
call npm run test:unit -- --coverage

REM 2. 运行属性测试
echo.
echo 2. 运行属性测试...
call npm run test:property -- --verbose

REM 3. 运行集成测试
echo.
echo 3. 运行集成测试...
call npm run test:integration

echo.
echo ==========================================
echo 所有测试完成
echo ==========================================
pause

