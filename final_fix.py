# Final fix for ShipManagementDashboard.js

# Read the file
f = open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'r', encoding='utf-8')
content = f.read()
f.close()

# Fix the corrupted location rendering lines
content = content.replace('{survey.location?.port ? \\\\\\$\\\\\{survey.location.country ? \\\\, \\\\\\$\\\\\{survey.location.country\\\\\}\\\\ : \\'\\'} : \\'Location not specified\\'}', '{formatLocation(survey.location)}')
content = content.replace('{detailsModal.booking?.location}', '{formatLocation(detailsModal.booking?.location)}')

# Add the formatLocation function after the formatDate function
function_code = '''

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    if (location.port) {
      return `${location.port}${location.country ? `, ${location.country}` : ''}`;
    }
    return 'Location not specified';
  };

'''

content = content.replace('const formatDate = (dateString) => {\\n    if (!dateString) return \\'N/A\\';\\n    const options = { year: \\'numeric\\', month: \\'short\\', day: \\'numeric\\' };\\n    return new Date(dateString).toLocaleDateString(undefined, options);\\n  };', 
                         'const formatDate = (dateString) => {\\n    if (!dateString) return \\'N/A\\';\\n    const options = { year: \\'numeric\\', month: \\'short\\', day: \\'numeric\\' };\\n    return new Date(dateString).toLocaleDateString(undefined, options);\\n  };' + function_code)

# Write the file back
f = open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'w', encoding='utf-8')
f.write(content)
f.close()

print("Successfully fixed ShipManagementDashboard.js")