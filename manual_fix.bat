@echo off
REM Manual fix for ShipManagementDashboard.js

REM Fix the first location line
powershell -Command "(Get-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js') -replace '{survey.location?.port ? \\\\$\\\\{survey.location.country ? \\\\, \\\\$\\\\{survey.location.country\\\\}\\\\ : ''} : ''Location not specified''}', '{formatLocation(survey.location)}' | Set-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js.tmp'

REM Fix the second location line
powershell -Command "(Get-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js.tmp') -replace '{detailsModal.booking?.location}', '{formatLocation(detailsModal.booking?.location)}' | Set-Content 'c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js'

REM Clean up
del "c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js.tmp"

echo Successfully fixed location rendering issues