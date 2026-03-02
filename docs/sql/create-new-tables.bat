@echo off
REM ========================================
REM 智慧教育学习平台 - 新增功能数据库表创建脚本
REM 执行new-features-tables.sql创建8张新表
REM ========================================

echo ========================================
echo 智慧教育学习平台 - 新增功能数据库表创建
echo ========================================
echo.

REM 检测MySQL安装
echo [1/3] 检测MySQL安装...
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到MySQL，请先安装MySQL或配置环境变量
    pause
    exit /b 1
)
echo [成功] MySQL已安装

REM 执行SQL脚本
echo.
echo [2/3] 执行SQL脚本创建新表...
mysql -u root -p edu_education_platform < new-features-tables.sql
if %errorlevel% neq 0 (
    echo [错误] SQL脚本执行失败
    pause
    exit /b 1
)
echo [成功] 新表创建完成

REM 验证表创建
echo.
echo [3/3] 验证表创建...
mysql -u root -p -e "USE edu_education_platform; SHOW TABLES LIKE '%%';" 
if %errorlevel% neq 0 (
    echo [警告] 无法验证表创建结果
) else (
    echo [成功] 表创建验证完成
)

echo.
echo ========================================
echo 新增功能数据库表创建完成！
echo 总计新增8张表：
echo 1. learning_analytics_reports (学情报告表)
echo 2. offline_cache_records (离线缓存记录表)
echo 3. teams (学习小组表)
echo 4. team_members (小组成员关联表)
echo 5. check_ins (打卡记录表)
echo 6. peer_reviews (互评记录表)
echo 7. resource_recommendations (资源推荐表)
echo 8. speech_assessments (口语评测表)
echo ========================================
echo.
pause
