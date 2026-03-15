/**
 * Test script to verify KNN predictions endpoint for ship management
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testKNNPredictions() {
  try {
    console.log('🧪 Testing KNN Predictions for Ship Management...\n');
    
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
    
    // 2. Get surveyors
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
    
    // 3. Pick first surveyor and get their vessels
    const testSurveyor = surveyors[0];
    console.log('\n3. Testing with surveyor:', testSurveyor.name);
    
    const surveysResponse = await axios.get(
      `${API_URL}/api/surveys?surveyor=${testSurveyor._id}&status=Completed`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const surveys = surveysResponse.data;
    console.log('✅ Found', surveys.length, 'completed surveys');
    
    if (surveys.length === 0) {
      console.log('⚠️  No completed surveys found. Cannot test.');
      return;
    }
    
    // 4. Get first vessel from surveys
    const testVessel = surveys[0].vessel;
    if (!testVessel || !testVessel._id) {
      console.log('❌ No valid vessel found in surveys');
      return;
    }
    
    console.log('\n4. Testing KNN predictions for vessel:', testVessel.name);
    console.log('   Vessel ID:', testVessel._id);
    
    // 5. Call KNN predictions endpoint
    console.log('\n5. Calling KNN predictions endpoint...');
    const knnResponse = await axios.get(
      `${API_URL}/api/knn/predictions/${testVessel._id}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('✅ KNN predictions retrieved successfully!');
    console.log('\n📊 Prediction Data:');
    console.log('   Status:', knnResponse.status);
    console.log('   Has predictions:', !!knnResponse.data.predictions);
    
    if (knnResponse.data.predictions) {
      console.log('   Number of predictions:', knnResponse.data.predictions.length);
      
      if (knnResponse.data.predictions.length > 0) {
        console.log('\n   Sample Prediction:');
        const sample = knnResponse.data.predictions[0];
        console.log('   - Component:', sample.component || 'N/A');
        console.log('   - Risk Level:', sample.risk_level || sample.riskLevel || 'N/A');
        console.log('   - Confidence:', sample.confidence || 'N/A');
      }
    } else if (knnResponse.data.message) {
      console.log('   Message:', knnResponse.data.message);
    }
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📝 What this means:');
    console.log('   - Ship management can now access KNN predictions');
    console.log('   - Predictive Maintenance section should display predictions');
    console.log('   - The 403 error should be resolved');
    
    console.log('\n🔄 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Refresh the Ship Management Dashboard');
    console.log('   3. Go to Predictive Maintenance');
    console.log('   4. Select surveyor:', testSurveyor.name);
    console.log('   5. Select vessel:', testVessel.name);
    console.log('   6. Predictions should now load!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
      
      if (error.response.status === 403) {
        console.error('\n⚠️  ISSUE: Still getting 403 Forbidden');
        console.error('   The backend server needs to be RESTARTED to apply changes.');
        console.error('   Please restart the backend and run this test again.\n');
      } else if (error.response.status === 404) {
        console.error('\n⚠️  Vessel or endpoint not found');
        console.error('   Check that the vessel ID is correct and the endpoint exists.\n');
      }
    } else {
      console.error('   Error:', error.message);
      console.error('\n⚠️  Make sure the backend server is running on port 5000\n');
    }
  }
}

// Run the test
testKNNPredictions();
