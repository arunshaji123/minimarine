const http = require('http');

// Test the completed surveys API endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/surveys/completed',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing completed surveys endpoint');

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