@echo off
echo ================================================
echo   Deploy Backend to HuggingFace Space
echo ================================================
echo.

set /p HF_TOKEN=Enter your HuggingFace token (hf_...): 
if "%HF_TOKEN%"=="" ( echo ERROR: Token cannot be empty & pause & exit /b 1 )

set HF_SPACE=skyflixerdashboard/skyflixer-dashboard
set HF_URL=https://skyflixerdashboard:%HF_TOKEN%@huggingface.co/spaces/%HF_SPACE%
set BACKEND_DIR=%~dp0backend
set TEMP_DIR=%~dp0hf-deploy-temp

echo.
echo [1/5] Cleaning temp folder...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"

echo [2/5] Cloning HuggingFace Space...
git clone %HF_URL% "%TEMP_DIR%"
if errorlevel 1 ( echo ERROR: Clone failed. Check your token. & pause & exit /b 1 )

echo [3/5] Copying backend files...
for /d %%i in ("%TEMP_DIR%\*") do if not "%%~nxi"==".git" rmdir /s /q "%%i"
for %%i in ("%TEMP_DIR%\*") do if not "%%~nxi"==".git" del /q "%%i"
xcopy /E /I /Y "%BACKEND_DIR%\*" "%TEMP_DIR%\"

echo [4/5] Committing and pushing to HuggingFace...
cd /d "%TEMP_DIR%"
git config user.email "deploy@local"
git config user.name "Deploy Script"
git add -A
git commit -m "Deploy backend %date% %time%"
git push %HF_URL% main
if errorlevel 1 ( echo ERROR: Push failed. & pause & exit /b 1 )

echo [5/5] Cleaning up...
cd /d "%~dp0"
rmdir /s /q "%TEMP_DIR%"

echo.
echo ================================================
echo   SUCCESS! HuggingFace will rebuild now.
echo   URL: https://skyflixerdashboard-skyflixer-dashboard.hf.space/health
echo ================================================
pause
