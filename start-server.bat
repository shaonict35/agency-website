@echo off
title Insight Creative Studio - Web Server & Admin Panel
echo ===================================================
echo Starting Insight Creative Studio Live Server...
echo Website will be available at: http://localhost:3000/
echo Admin Panel will be at:       http://localhost:3000/admin/
echo Default Login: username: admin ^| password: admin
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
