# Fix the ShipManagementDashboard.js file

# Read the file content
$content = Get-Content "c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js" -Raw

# Fix the first location line (line 1444)
$content = $content -replace [regex]::Escape('{survey.location?.port ? \\\$\{survey.location.country ? \, \$\{survey.location.country\}\ : \'\'} : \'Location not specified\'}'), '{formatLocation(survey.location)}'

# Fix the second location line (line 1570)
$content = $content -replace [regex]::Escape('{detailsModal.booking?.location}'), '{formatLocation(detailsModal.booking?.location)}'

# Write the file back
$content | Set-Content "c:\Users\aruns\Desktop\demosurvay\marine_survay41\frontend\src\components\dashboards\ShipManagementDashboard.js"

Write-Host "Fixed the location rendering issues"