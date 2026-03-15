import re

# Read the file
with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the first location (line 1444)
pattern1 = r'<div className="text-sm text-gray-500">\{survey\.location\?\.port \? \\\\\\$\\\{survey\.location\.country \? \\\\\,\ \\\\\\$\\\{survey\.location\.country\\\}\\\ :\ \'\'\} :\ \'Location not specified\'\}</div>'
replacement1 = '<div className="text-sm text-gray-500">{survey.location ? (survey.location.port ? `${survey.location.port}${survey.location.country ? `, ${survey.location.country}` : \'\'}` : \'Location not specified\') : \'Location not specified\'}</div>'
content = re.sub(pattern1, replacement1, content)

# Fix the second location (line 1570)
pattern2 = r'<div className="text-gray-900">\{detailsModal\.booking\?\.location\}</div>'
replacement2 = '<div className="text-gray-900">{detailsModal.booking?.location ? (detailsModal.booking.location.port ? `${detailsModal.booking.location.port}${detailsModal.booking.location.country ? `, ${detailsModal.booking.location.country}` : \'\'}` : \'Location not specified\') : \'Location not specified\'}</div>'
content = re.sub(pattern2, replacement2, content)

# Write the file back
with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed the location rendering issues")