@echo off
echo ========================================
echo   Training Progress Monitor
echo ========================================
echo.
echo Checking training log and model files...
echo.

if exist "models\ship_damage_model.pth" (
    echo [OK] Model file found: models\ship_damage_model.pth
    for %%A in ("models\ship_damage_model.pth") do echo     Size: %%~zA bytes
    echo     Training completed!
) else (
    echo [INFO] Model file not found yet - training in progress...
)

echo.
echo Dataset Summary:
for /d %%D in (dataset\*) do (
    set count=0
    for %%F in ("%%D\*.*") do set /a count+=1
    call echo     %%~nxD: %%count%% images
)

echo.
echo To view live training output:
echo     Get-Content training.log -Wait -Tail 20
echo.
echo Or check terminal with ID: See VSCode terminal panel
echo.
pause
