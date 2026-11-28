@echo off
echo Building React 3-Portal Frontend and packaging into Laravel backend\public...
cd /d "%~dp0cdc-portal"
set PATH=C:\xampp\tools\node;%PATH%
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

if exist "%~dp0backend\public\assets" rmdir /s /q "%~dp0backend\public\assets"
xcopy /e /i /y "%~dp0cdc-portal\dist\assets" "%~dp0backend\public\assets" >nul
copy /y "%~dp0cdc-portal\dist\index.html" "%~dp0backend\public\spa.html" >nul
if exist "%~dp0cdc-portal\dist\christ-logo.png" copy /y "%~dp0cdc-portal\dist\christ-logo.png" "%~dp0backend\public\christ-logo.png" >nul
if exist "%~dp0cdc-portal\dist\favicon.ico" copy /y "%~dp0cdc-portal\dist\favicon.ico" "%~dp0backend\public\favicon.ico" >nul
if exist "%~dp0cdc-portal\dist\favicon.png" copy /y "%~dp0cdc-portal\dist\favicon.png" "%~dp0backend\public\favicon.png" >nul
if exist "%~dp0cdc-portal\dist\favicon.svg" copy /y "%~dp0cdc-portal\dist\favicon.svg" "%~dp0backend\public\favicon.svg" >nul

echo.
echo Single-domain production package ready in backend\public!
echo   - Student Dashboard: /student/dashboard
echo   - Guide Dashboard:   /guide/dashboard
echo   - Admin Dashboard:   /admin/dashboard
