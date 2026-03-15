const http = require('http');

// Test the KNN API endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/knn/predictions/68fa5e39867a4ed231bc36f0',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error.message);
});

req.end();