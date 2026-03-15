@echo off
echo ================================================
echo   Train Ship Damage Detection Model
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

REM Check if training script exists
if not exist "train_ship_damage_model.py" (
    echo ERROR: train_ship_damage_model.py not found
    echo Please run this script from backend/ml directory
    pause
    exit /b 1
)

REM Check if dependencies are installed
echo Checking dependencies...
pip show torch >nul 2>&1
if errorlevel 1 (
    echo.
    echo Installing Python dependencies...
    echo This may take several minutes...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ================================================
echo   Dataset Setup
echo ================================================
echo.

REM Check if dataset exists
if not exist "dataset" (
    echo Dataset folder not found. Creating structure...
    python train_ship_damage_model.py --create-dataset
    echo.
    echo ================================================
    echo   IMPORTANT: Add Your Images!
    echo ================================================
    echo.
    echo Please add training images to these folders:
    echo   - dataset/Rust/
    echo   - dataset/Crack/
    echo   - dataset/Corrosion/
    echo   - dataset/Dent/
    echo   - dataset/Clean/
    echo.
    echo Recommended: 200-500 images per folder
    echo.
    pause
    exit /b 0
)

echo Dataset folder found!
echo.

REM Count images in dataset
set /a total=0
for /d %%d in (dataset\*) do (
    for %%f in (%%d\*.jpg %%d\*.jpeg %%d\*.png) do (
        set /a total+=1
    )
)

if %total% LSS 100 (
    echo WARNING: Only %total% images found in dataset
    echo Recommended: At least 1000 images total (200 per class^)
    echo.
    echo Continue anyway? (y/n^)
    set /p continue=
    if /i not "%continue%"=="y" exit /b 0
)

echo Total images found: %total%
echo.

echo ================================================
echo   Starting Model Training
echo ================================================
echo.
echo This may take 30-120 minutes depending on:
echo   - Dataset size
echo   - GPU availability
echo   - Number of epochs
echo.
echo Training will create: models/ship_damage_model.pth
echo.
echo Press any key to start training...
pause >nul

REM Start training
python train_ship_damage_model.py --data-dir dataset --save-path models/ship_damage_model.pth --epochs 50 --batch-size 32

echo.
echo ================================================
echo   Training Complete!
echo ================================================
echo.
echo Model saved to: models/ship_damage_model.pth
echo.
echo Next steps:
echo 1. Run start_ai_api.bat to start the API server
echo 2. Test in the frontend by uploading ship images
echo.
pause
