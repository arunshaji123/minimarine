# Read the file
with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line where formatDate function ends
format_date_end_line = -1
for i, line in enumerate(lines):
    if 'const formatDate = (dateString) => {' in line:
        # Skip the function definition
        j = i + 1
        while j < len(lines) and '};' not in lines[j]:
            j += 1
        format_date_end_line = j + 1  # Line after the function ends
        break

if format_date_end_line != -1:
    # Insert the formatLocation function
    format_location_function = [
        '\n',
        '  const formatLocation = (location) => {\n',
        '    if (!location) return \'Location not specified\';\n',
        '    if (location.port) {\n',
        '      return `${location.port}${location.country ? `, ${location.country}` : \'\'}`;\n',
        '    }\n',
        '    return \'Location not specified\';\n',
        '  };\n',
        '\n'
    ]
    
    # Insert the function at the correct position
    for i, new_line in enumerate(format_location_function):
        lines.insert(format_date_end_line + i, new_line)
    
    # Write the file back
    with open('c:\\\\Users\\\\aruns\\\\Desktop\\\\demosurvay\\\\marine_survay41\\\\frontend\\\\src\\\\components\\\\dashboards\\\\ShipManagementDashboard.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("Added formatLocation function in the correct position")
else:
    print("Could not find formatDate function")