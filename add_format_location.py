# Read the file
with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the formatLocation function after the formatDate function
format_date_end = content.find('  };') + 4  # Find the end of formatDate function
format_date_end = content.find('\\n', format_date_end) + 1  # Move to the end of the line

# Insert the formatLocation function
format_location_function = '''  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    if (location.port) {
      return `${location.port}${location.country ? `, ${location.country}` : ''}`;
    }
    return 'Location not specified';
  };

'''

# Insert the function
content = content[:format_date_end] + format_location_function + content[format_date_end:]

# Write the file back
with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added formatLocation function")