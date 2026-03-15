const http = require('http');

// Test the KNN API endpoint with a proper vessel ID
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/knn/predictions/68fa5e39867a4ed231bc36f0', // Use the vessel ID from our test
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing KNN endpoint with vessel ID: 68fa5e39867a4ed231bc36f0');

const req = http.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Response:', JSON.stringify(jsonData, null, 2));
    } catch (err) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', error => {
  console.error('Error:', error.message);
});

req.end();