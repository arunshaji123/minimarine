const fs = require('fs');
const path = require('path');

// Fix ShipManagementDashboard.js
const shipManagementPath = path.join(__dirname, 'frontend', 'src', 'components', 'dashboards', 'ShipManagementDashboard.js');
let shipManagementContent = fs.readFileSync(shipManagementPath, 'utf8');
shipManagementContent = shipManagementContent.replace(
  '<div className="flex h-screen bg-gray-50">',
  '<div className="flex h-full bg-gray-50">'
);
fs.writeFileSync(shipManagementPath, shipManagementContent);

// Fix SurveyorDashboard.js
const surveyorPath = path.join(__dirname, 'frontend', 'src', 'components', 'dashboards', 'SurveyorDashboard.js');
let surveyorContent = fs.readFileSync(surveyorPath, 'utf8');
surveyorContent = surveyorContent.replace(
  '<div className="flex h-screen bg-gray-50">',
  '<div className="flex h-full bg-gray-50">'
);
fs.writeFileSync(surveyorPath, surveyorContent);

console.log('Dashboard files fixed successfully!');