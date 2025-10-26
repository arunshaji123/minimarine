const axios = require('axios');

async function testLocalSetup() {
  console.log('Testing local development setup...\n');
  
  // Test 1: Direct backend connection
  try {
    console.log('1. Testing direct connection to backend...');
    const directResponse = await axios.get('http://localhost:5000/api/test');
    console.log('   ✅ Direct connection success:', directResponse.data);
  } catch (error) {
    console.log('   ❌ Direct connection failed:', error.message);
  }
  
  // Test 2: Proxy connection (simulating frontend)
  try {
    console.log('\n2. Testing proxy connection...');
    // Set baseURL to simulate frontend proxy behavior
    axios.defaults.baseURL = 'http://localhost:3000';
    const proxyResponse = await axios.get('/api/test');
    console.log('   ✅ Proxy connection success:', proxyResponse.data);
  } catch (error) {
    console.log('   ❌ Proxy connection failed:', error.message);
    if (error.response) {
      console.log('   Response data:', error.response.data);
    }
  }
  
  console.log('\nLocal development setup test completed.');
  console.log('\nTo run the application locally:');
  console.log('1. Make sure MongoDB is running or MongoDB Atlas URI is configured');
  console.log('2. Start backend: cd backend && npm run dev');
  console.log('3. Start frontend: cd frontend && npm start');
  console.log('4. Access application at: http://localhost:3000');
}

testLocalSetup();