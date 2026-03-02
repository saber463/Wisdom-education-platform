@echo off
chcp 65001 >nul
powershell.exe -ExecutionPolicy Bypass -File "%~dp0health-check.ps1"
pause


