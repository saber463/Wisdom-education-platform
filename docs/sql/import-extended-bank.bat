@echo off
chcp 65001 >nul
echo ========================================
echo 智慧教育学习平台 - 扩展题库导入工具
echo ========================================
echo.

REM 检查MySQL是否在PATH中
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到MySQL命令，请确保MySQL已安装并添加到系统PATH
    echo.
    pause
    exit /b 1
)

echo 请输入MySQL root密码：
set /p MYSQL_PASSWORD=

echo.
echo 开始导入扩展题库...
echo.

echo [1/4] 导入小学题目（1-6年级）...
mysql -u root -p%MYSQL_PASSWORD% edu_education_platform < extended-exercise-bank.sql
if %errorlevel% neq 0 (
    echo [错误] 导入失败！
    pause
    exit /b 1
)
echo [完成] 小学题目导入成功
echo.

echo [2/4] 导入初中题目（7-9年级）...
mysql -u root -p%MYSQL_PASSWORD% edu_education_platform < extended-exercise-bank-part2.sql
if %errorlevel% neq 0 (
    echo [错误] 导入失败！
    pause
    exit /b 1
)
echo [完成] 初中题目导入成功
echo.

echo [3/4] 导入高中题目（高一-高三）...
mysql -u root -p%MYSQL_PASSWORD% edu_education_platform < extended-exercise-bank-part3.sql
if %errorlevel% neq 0 (
    echo [错误] 导入失败！
    pause
    exit /b 1
)
echo [完成] 高中题目导入成功
echo.

echo [4/4] 导入大学题目（大一-大三）...
mysql -u root -p%MYSQL_PASSWORD% edu_education_platform < extended-exercise-bank-part4.sql
if %errorlevel% neq 0 (
    echo [错误] 导入失败！
    pause
    exit /b 1
)
echo [完成] 大学题目导入成功
echo.

echo ========================================
echo 扩展题库导入完成！
echo ========================================
echo.
echo 数据统计：
mysql -u root -p%MYSQL_PASSWORD% edu_education_platform -e "SELECT COUNT(*) AS '知识点总数' FROM knowledge_points; SELECT COUNT(*) AS '题目总数' FROM exercise_bank;"
echo.
echo 按年级查看知识点分布，请运行：
echo mysql -u root -p edu_education_platform -e "SELECT grade, COUNT(*) AS count FROM knowledge_points GROUP BY grade;"
echo.
pause
