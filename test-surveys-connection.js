const axios = require('axios');

async function testSurveysConnection() {
  try {
    // Test the surveys endpoint
    console.log('Testing surveys endpoint...');
    const response = await axios.get('http://localhost:3000/api/surveys');
    console.log('Surveys endpoint is accessible');
    console.log('Number of surveys:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('Sample survey:', JSON.stringify(response.data[0], null, 2));
    }
  } catch (error) {
    console.error('Error testing surveys endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSurveysConnection();