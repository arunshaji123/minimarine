@echo off
REM Fix the specific lines in ShipManagementDashboard.js

REM Fix line 1444
powershell -Command "(Get-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js') -replace '<div className=\"text-sm text-gray-500\">\{survey.location?.port ? \\\\\\$\\\\\{survey.location.country ? \\\\, \\\\\\$\\\\\{survey.location.country\\\\\}\\\\ : ''\} : ''Location not specified''\}</div>', '<div className=\"text-sm text-gray-500\">\{formatLocation(survey.location)\}</div>' | Set-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js.tmp'

REM Fix line 1570
powershell -Command "(Get-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js.tmp') -replace '<div className=\"text-gray-900\">\{detailsModal.booking?.location\}</div>', '<div className=\"text-gray-900\">\{formatLocation(detailsModal.booking?.location)\}</div>' | Set-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js'

REM Clean up
del "c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js.tmp"

echo Successfully fixed the location rendering lines