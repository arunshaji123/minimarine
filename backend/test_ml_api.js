const axios = require('axios');

const vesselId = '68fa5e39867a4ed231bc36f0';
const apiUrl = `http://localhost:5000/api/knn/predictions/${vesselId}`;

console.log('Testing ML Prediction API Endpoint');
console.log('===================================');
console.log(`Vessel ID: ${vesselId}`);
console.log(`API URL: ${apiUrl}`);
console.log('');

// You'll need to add an authorization token
// For testing, you can use a token from your login

axios.get(apiUrl)
  .then(response => {
    console.log('✓ API Response Received:');
    console.log('');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('✗ API Error:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  });
