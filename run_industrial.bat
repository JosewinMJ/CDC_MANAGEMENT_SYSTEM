@echo off
echo Starting CDC Management System (Laravel 12 API + React Vite Frontend)...
start "CDC Laravel 12 API" cmd /k "cd /d "%~dp0backend" && C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8000"
start "CDC 3-Portal Frontend" cmd /k "cd /d "%~dp0cdc-portal" && set PATH=C:\xampp\tools\node;%PATH% && npm run dev"
echo.
echo   Frontend (Student / Guide / Admin): http://localhost:5173
echo   Laravel 12 API:                     http://127.0.0.1:8000/api/v1
echo   phpMyAdmin (cdc_industrial):        http://localhost/phpmyadmin/
pause
