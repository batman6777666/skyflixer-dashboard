@echo off
echo ========================================
echo   Starting Dashboard Application
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Checking if servers are already running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo     Stopping existing servers...
    taskkill /F /IM node.exe >NUL 2>&1
    timeout /t 2 >NUL
)

echo [2/2] Starting servers...
echo.
start "Dashboard Backend + Frontend" cmd /k "npm run dev"

timeout /t 3 >NUL

echo.
echo ========================================
echo   Dashboard is starting!
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo   A new window will open with the servers.
echo   Keep that window open to use the app.
echo ========================================
echo.

pause
