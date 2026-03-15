@echo off
echo ========================================
echo Marine Survey ML System Setup
echo ========================================
echo.

REM Check if .env exists
if not exist "backend\.env" (
    echo ERROR: backend\.env file not found!
    echo.
    echo Please create backend\.env from backend\env-template.txt
    echo and configure your MONGODB_URI
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
echo ✓ Python found
echo.

echo [2/4] Installing Python dependencies...
cd backend\ml
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo ✓ Dependencies installed
echo.

echo [3/4] Generating sample training data...
cd backend\ml
python generate_sample_data.py
if errorlevel 1 (
    echo ERROR: Failed to generate sample data
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo ✓ Sample data generated
echo.

echo [4/4] Training ML model...
cd backend\ml
python train_model.py
if errorlevel 1 (
    echo ERROR: Failed to train model
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo ✓ Model trained successfully
echo.

echo ========================================
echo ML System Setup Complete!
echo ========================================
echo.
echo You can now:
echo 1. Start the backend server: cd backend ^&^& npm start
echo 2. Test predictions: python backend\ml\predict.py --vesselId ^<vessel_id^>
echo.
pause
