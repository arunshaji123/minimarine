const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing direct connection to backend...');
    const directResponse = await axios.get('http://localhost:5003/api/auth/test');
    console.log('Direct connection success:', directResponse.data);
    
    console.log('\nTesting proxy connection...');
    // Set baseURL to use proxy
    axios.defaults.baseURL = 'http://localhost:3000';
    const proxyResponse = await axios.get('/api/auth/test');
    console.log('Proxy connection success:', proxyResponse.data);
  } catch (error) {
    console.error('Connection error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

testConnection();