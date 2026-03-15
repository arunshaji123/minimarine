# Read the file
with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the first location line (line 1444)
old_text = '{survey.location?.port ? \\\\\\$\\\\\{survey.location.country ? \\\\, \\\\\\$\\\\\{survey.location.country\\\\\}\\\\ : \\'\\'} : \\'Location not specified\\'}'
new_text = '{formatLocation(survey.location)}'
content = content.replace(old_text, new_text)

# Fix the second location line (line 1570)
old_text2 = '{detailsModal.booking?.location}'
new_text2 = '{formatLocation(detailsModal.booking?.location)}'
content = content.replace(old_text2, new_text2)

# Write the file back
with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed the location rendering issues")