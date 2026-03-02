@echo off
REM Navicat检测脚本
REM 检测Navicat是否安装并返回安装路径

setlocal enabledelayedexpansion

echo 正在检测Navicat安装...

REM 检查注册表中的Navicat安装信息
set NAVICAT_FOUND=0
set NAVICAT_PATH=

REM 检查64位注册表
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\PremiumSoft\Navicat" /v "InstallPath" 2^>nul') do (
    set NAVICAT_PATH=%%b
    set NAVICAT_FOUND=1
)

REM 如果64位未找到，检查32位注册表
if !NAVICAT_FOUND! equ 0 (
    for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\WOW6432Node\PremiumSoft\Navicat" /v "InstallPath" 2^>nul') do (
        set NAVICAT_PATH=%%b
        set NAVICAT_FOUND=1
    )
)

REM 检查用户级注册表
if !NAVICAT_FOUND! equ 0 (
    for /f "tokens=2*" %%a in ('reg query "HKCU\SOFTWARE\PremiumSoft\Navicat" /v "InstallPath" 2^>nul') do (
        set NAVICAT_PATH=%%b
        set NAVICAT_FOUND=1
    )
)

if !NAVICAT_FOUND! equ 1 (
    echo Navicat已安装
    echo 安装路径: !NAVICAT_PATH!
    exit /b 0
) else (
    echo Navicat未安装
    exit /b 1
)
