/**
 * Test script to verify ship management surveys endpoint
 * Run this after restarting the backend server
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testShipManagementSurveys() {
  try {
    console.log('🧪 Testing Ship Management Surveys Endpoint...\n');
    
    // First, login as ship_management user
    console.log('1. Logging in as ship_management user...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'ship@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful!');
    console.log('   User:', user.name);
    console.log('   Role:', user.role);
    console.log('   Token:', token.substring(0, 20) + '...\n');
    
    // Now test the completed surveys endpoint
    console.log('2. Fetching completed surveys...');
    const surveysResponse = await axios.get(`${API_URL}/api/surveys/completed`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Surveys fetched successfully!');
    console.log('   Total surveys:', surveysResponse.data.length);
    
    if (surveysResponse.data.length > 0) {
      console.log('\n📊 Sample Survey Data:');
      const sample = surveysResponse.data[0];
      console.log('   Survey ID:', sample._id);
      console.log('   Vessel:', sample.vessel?.name || 'N/A');
      console.log('   Survey Type:', sample.surveyType);
      console.log('   Status:', sample.status);
      console.log('   Surveyor:', sample.surveyor?.name || 'N/A');
      console.log('   Completion Date:', sample.completionDate);
      console.log('   Has Compliance Data:', !!sample.complianceStatus);
    } else {
      console.log('\n⚠️  No completed surveys found');
      console.log('   This might be normal if no surveys have been completed yet.');
    }
    
    console.log('\n✅ All tests passed! The surveys section should now work in the Ship Management Dashboard.');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure your backend server is restarted');
    console.log('   2. Refresh the Ship Management Dashboard');
    console.log('   3. Navigate to the "Surveys" section');
    console.log('   4. Check the browser console for any errors\n');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
      
      if (error.response.status === 403) {
        console.error('\n⚠️  ISSUE FOUND: The surveys endpoint is still blocking ship_management users');
        console.error('   This means the backend server needs to be restarted.');
        console.error('   Please restart the backend server and run this test again.\n');
      } else if (error.response.status === 401) {
        console.error('\n⚠️  Authentication failed. Check if the login credentials are correct.\n');
      }
    } else {
      console.error('   Error:', error.message);
      console.error('\n⚠️  Make sure the backend server is running on port 5000\n');
    }
  }
}

// Run the test
testShipManagementSurveys();
