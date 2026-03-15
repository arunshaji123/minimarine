@echo off
echo ================================================
echo   AI Ship Damage Detection API Server
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo Python found!
echo.

REM Check if in correct directory
if not exist "ship_damage_detector.py" (
    echo ERROR: ship_damage_detector.py not found
    echo Please run this script from backend/ml directory
    pause
    exit /b 1
)

echo Checking dependencies...
pip show torch >nul 2>&1
if errorlevel 1 (
    echo.
    echo Installing Python dependencies...
    echo This may take a few minutes...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed!
)

echo.
echo ================================================
echo Starting AI Ship Damage Detection API...
echo ================================================
echo.
echo API will be available at: http://localhost:5001
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the Flask API
python ship_damage_detector.py

pause
