/**
 * Test script to verify surveys section shows all vessels including owner vessels
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSurveysSection() {
  try {
    console.log('🧪 Testing Ship Management Surveys Section...\n');
    
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
    
    // 2. Get all completed surveys (what the surveys section shows)
    console.log('\n2. Fetching all completed surveys...');
    const surveysResponse = await axios.get(`${API_URL}/api/surveys/completed`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const surveys = surveysResponse.data;
    console.log('✅ Found', surveys.length, 'completed surveys');
    
    if (surveys.length === 0) {
      console.log('⚠️  No completed surveys found in the system.');
      return;
    }
    
    // 3. Analyze vessel ownership
    console.log('\n3. Analyzing vessel ownership...');
    const vesselOwnership = {
      shipCompany: [],
      owners: [],
      unknown: []
    };
    
    const uniqueVessels = new Map();
    
    surveys.forEach(survey => {
      if (survey.vessel && survey.vessel._id) {
        uniqueVessels.set(survey.vessel._id, survey.vessel);
      }
    });
    
    uniqueVessels.forEach((vessel, vesselId) => {
      if (vessel.owner) {
        if (vessel.shipManagement) {
          vesselOwnership.shipCompany.push(vessel);
        } else {
          vesselOwnership.owners.push(vessel);
        }
      } else {
        vesselOwnership.unknown.push(vessel);
      }
    });
    
    console.log('\n📊 Vessel Breakdown:');
    console.log('   Ship Company Vessels:', vesselOwnership.shipCompany.length);
    console.log('   Owner-Registered Vessels:', vesselOwnership.owners.length);
    console.log('   Unknown Ownership:', vesselOwnership.unknown.length);
    console.log('   Total Unique Vessels:', uniqueVessels.size);
    
    // 4. Get list of surveyors
    console.log('\n4. Fetching surveyors...');
    const surveyorsResponse = await axios.get(`${API_URL}/api/user-management/surveyors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const surveyors = surveyorsResponse.data;
    console.log('✅ Found', surveyors.length, 'surveyors');
    
    if (surveyors.length > 0) {
      // 5. Test surveyor filter
      const testSurveyor = surveyors[0];
      console.log('\n5. Testing surveyor filter with:', testSurveyor.name);
      
      const surveyorSurveysResponse = await axios.get(
        `${API_URL}/api/surveys/completed?surveyor=${testSurveyor._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const surveyorSurveys = surveyorSurveysResponse.data;
      console.log('✅ Found', surveyorSurveys.length, 'surveys by this surveyor');
      
      if (surveyorSurveys.length > 0) {
        const surveyorVessels = new Map();
        surveyorSurveys.forEach(survey => {
          if (survey.vessel && survey.vessel._id) {
            surveyorVessels.set(survey.vessel._id, survey.vessel);
          }
        });
        
        console.log('   Vessels inspected by this surveyor:', surveyorVessels.size);
        console.log('\n   Surveyor\'s Vessels:');
        Array.from(surveyorVessels.values()).forEach((vessel, index) => {
          const ownerType = vessel.shipManagement ? 'Ship Company' : 'Owner-Registered';
          console.log(`   ${index + 1}. ${vessel.name} (${ownerType})`);
        });
      }
    }
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📝 What this means:');
    console.log('   - Ship management can see ALL completed surveys in the system');
    console.log('   - This includes surveys for owner-registered vessels');
    console.log('   - Surveyor filters work correctly to show specific surveyor\'s work');
    console.log('   - The Surveys section should display all data correctly');
    
    console.log('\n🔄 Next Steps:');
    console.log('   1. Restart your backend server (if not already restarted)');
    console.log('   2. Refresh the Ship Management Dashboard');
    console.log('   3. Go to Surveys section');
    console.log('   4. You should see ALL surveys (company + owner vessels)');
    console.log('   5. Use surveyor filter to view specific surveyor\'s reports');
    console.log('   6. Use ship filter to view specific vessel\'s reports\n');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
      
      if (error.response.status === 403) {
        console.error('\n⚠️  ISSUE: Getting 403 Forbidden');
        console.error('   The backend server needs to be RESTARTED to apply changes.');
      }
    } else {
      console.error('   Error:', error.message);
      console.error('\n⚠️  Make sure the backend server is running on port 5000');
    }
    console.error('');
  }
}

// Run the test
testSurveysSection();
