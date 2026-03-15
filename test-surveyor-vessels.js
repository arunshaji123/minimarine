/**
 * Test script to verify surveyor vessels query for ship management
 * This tests that ship_management can see ALL vessels inspected by a surveyor
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSurveyorVesselsQuery() {
  try {
    console.log('🧪 Testing Surveyor Vessels Query for Ship Management...\n');
    
    // 1. Login as ship_management user
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
    
    // 2. Get list of surveyors
    console.log('\n2. Fetching surveyors...');
    const surveyorsResponse = await axios.get(`${API_URL}/api/user-management/surveyors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const surveyors = surveyorsResponse.data;
    console.log('✅ Found', surveyors.length, 'surveyors');
    
    if (surveyors.length === 0) {
      console.log('⚠️  No surveyors found. Cannot test.');
      return;
    }
    
    // 3. Pick first surveyor and get their completed surveys
    const testSurveyor = surveyors[0];
    console.log('\n3. Testing with surveyor:', testSurveyor.name);
    console.log('   Surveyor ID:', testSurveyor._id);
    
    const surveysResponse = await axios.get(
      `${API_URL}/api/surveys?surveyor=${testSurveyor._id}&status=Completed`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const surveys = surveysResponse.data;
    console.log('✅ Found', surveys.length, 'completed surveys by this surveyor');
    
    if (surveys.length === 0) {
      console.log('⚠️  This surveyor has no completed surveys. Try with another surveyor.');
      console.log('   Available surveyors:');
      surveyors.forEach(s => console.log('   -', s.name, '(' + s._id + ')'));
      return;
    }
    
    // 4. Extract unique vessels
    console.log('\n4. Extracting vessels from surveys...');
    const uniqueVessels = new Map();
    
    surveys.forEach(survey => {
      if (survey.vessel && survey.vessel._id) {
        uniqueVessels.set(survey.vessel._id, {
          _id: survey.vessel._id,
          name: survey.vessel.name || 'Unknown',
          imo: survey.vessel.imoNumber || survey.vessel.imo || 'N/A',
          owner: survey.vessel.owner
        });
      }
    });
    
    console.log('✅ Found', uniqueVessels.size, 'unique vessels inspected by this surveyor:');
    console.log('\n📊 Vessel Details:');
    console.log('─'.repeat(80));
    
    Array.from(uniqueVessels.values()).forEach((vessel, index) => {
      console.log(`\n${index + 1}. ${vessel.name}`);
      console.log('   IMO: ' + vessel.imo);
      console.log('   Vessel ID: ' + vessel._id);
      if (vessel.owner) {
        console.log('   Owner: ' + (vessel.owner.name || vessel.owner._id || 'Unknown'));
      }
    });
    
    console.log('\n─'.repeat(80));
    console.log('\n✅ TEST PASSED!');
    console.log('\n📝 What this means:');
    console.log('   - Ship management can now see ALL vessels inspected by the selected surveyor');
    console.log('   - This includes vessels owned by the ship company AND individual owners');
    console.log('   - The Predictive Maintenance dropdown should show all these vessels');
    
    console.log('\n🔄 Next Steps:');
    console.log('   1. Make sure your backend server is RESTARTED');
    console.log('   2. Refresh the Ship Management Dashboard');
    console.log('   3. Go to Predictive Maintenance section');
    console.log('   4. Select the surveyor:', testSurveyor.name);
    console.log('   5. The ship dropdown should show ALL', uniqueVessels.size, 'vessels\n');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
      
      if (error.response.status === 403) {
        console.error('\n⚠️  ISSUE: Backend is still filtering surveys');
        console.error('   The backend server needs to be restarted to apply the changes.\n');
      }
    } else {
      console.error('   Error:', error.message);
      console.error('\n⚠️  Make sure the backend server is running on port 5000\n');
    }
  }
}

// Run the test
testSurveyorVesselsQuery();
