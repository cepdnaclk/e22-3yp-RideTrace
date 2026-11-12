@echo off
title RideTrace Enterprise Admin Portal Launcher
echo =====================================================================
echo   RideTrace Enterprise Hardware Provisioning ^& Security Portal
echo =====================================================================
echo.
echo [1/2] Starting Secure Backend API Server (Port 5000)...
start "RideTrace Admin Backend (Port 5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Enterprise Light Frontend (Port 5173)...
start "RideTrace Admin Frontend (Port 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo Portal is starting! Open http://localhost:5173 in your browser.
pause
