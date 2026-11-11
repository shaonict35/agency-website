@echo off
title Push to GitHub - Insight Creative Studio
echo ====================================================
echo Pushing Insight Creative Studio to GitHub Repository:
echo https://github.com/shaonict35/agency-website.git
echo ====================================================
echo.

cd /d "%~dp0"

echo 1. Checking git...
git --version
if errorlevel 1 (
    echo.
    echo [ERROR] Git is not installed or blocked in this shell.
    echo Please run this script by double-clicking push-to-github.bat in File Explorer,
    echo or run git commands inside Git Bash / Command Prompt (cmd.exe).
    echo.
    pause
    exit /b 1
)

echo.
echo 2. Initializing repository if needed...
if not exist ".git" (
    git init
)

echo.
echo 3. Setting remote repository URL...
git remote remove origin 2>nul
git remote add origin https://github.com/shaonict35/agency-website.git

echo.
echo 4. Staging files...
git add .

echo.
echo 5. Committing changes...
git commit -m "Update Insight Creative Studio website, locked favicon, cache clean, and Admin CMS fixes"

echo.
echo 6. Pushing to GitHub (main branch)...
git branch -M main
git push -u origin main

echo.
if errorlevel 1 (
    echo ====================================================
    echo [PUSH FAILED]
    echo If GitHub asks for sign in, please sign in via browser
    echo or Personal Access Token (PAT), or push with --force if diverged.
    echo ====================================================
) else (
    echo ====================================================
    echo SUCCESS! Your code has been pushed to:
    echo https://github.com/shaonict35/agency-website
    echo ====================================================
)
echo.
pause
