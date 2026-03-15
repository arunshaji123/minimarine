@echo off
REM Add formatLocation function to ShipManagementDashboard.js

REM Create a temporary file with the function
echo. >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo   const formatLocation = (location) =^> { >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo     if (!location) return 'Location not specified'; >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo     if (location.port) { >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo       return `${location.port}${location.country ? `, ${location.country}` : ''}`; >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo     } >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo     return 'Location not specified'; >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo   }; >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt
echo. >> c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt

REM Insert the function after the formatDate function
powershell -Command "$lines = Get-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js'; $functionLines = Get-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt'; $insertIndex = -1; for ($i = 0; $i -lt $lines.Length; $i++) { if ($lines[$i] -match 'const formatDate = \(dateString\) =^> {') { $j = $i; while ($j -lt $lines.Length -and $lines[$j] -ne '  };') { $j++; } if ($j -lt $lines.Length) { $insertIndex = $j + 1; break; } } }; if ($insertIndex -ne -1) { $lines = $lines[0..($insertIndex-1)] + $functionLines + '' + $lines[$insertIndex..($lines.Length-1)]; $lines | Set-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js' }"

REM Clean up
del "c:\Users\aruns\Desktop\demosurvay\marine_survay41\format_location_function.txt"

echo Successfully added formatLocation function