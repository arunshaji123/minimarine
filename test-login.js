const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    // Set baseURL to use proxy
    axios.defaults.baseURL = 'http://localhost:3000';
    const response = await axios.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login success:', response.data);
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

testLogin();