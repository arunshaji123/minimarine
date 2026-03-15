const axios = require('axios');

async function testAPI() {
    try {
        // Test without auth first
        const response = await axios.get('http://localhost:5000/api/surveys/completed');
        console.log('Status:', response.status);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ Auth required - this is expected');
            console.log('The surveys are being returned but require authentication');
        } else {
            console.log('Error:', error.message);
        }
    }
}

testAPI();
