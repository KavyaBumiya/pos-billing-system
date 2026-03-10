@echo off
echo ============================================
echo   Bumiya POS - Starting Application
echo ============================================
echo.

:: Start Python backend
echo [1/2] Starting backend server (port 5000)...
start "Bumiya POS Backend" cmd /k "cd /d %~dp0backend && python app.py"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start React frontend
echo [2/2] Starting frontend (port 3000)...
start "Bumiya POS Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ============================================
echo   Both servers are starting...
echo   Frontend: http://localhost:3000  (open this)
echo   Backend:  http://localhost:5000  (API)
echo ============================================
echo.
echo IMPORTANT: Keep both windows open while using the app.
echo.
