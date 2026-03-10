@echo off
echo ============================================
echo   Bumiya POS - Install Dependencies
echo ============================================
echo.

echo [1/2] Installing Python dependencies...
cd /d %~dp0backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python packages.
    pause
    exit /b 1
)

echo.
echo [2/2] Installing Node.js dependencies...
cd /d %~dp0frontend
npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node packages.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   All dependencies installed successfully!
echo   Run start.bat to launch the application.
echo ============================================
pause
