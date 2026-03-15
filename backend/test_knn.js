const axios = require('axios');

// Test the KNN endpoint
async function testKNN() {
  try {
    // First, let's get a vessel ID from the database
    const mongoose = require('mongoose');
    require('dotenv').config();
    const { Vessel } = require('./models');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const vessels = await Vessel.find({}).limit(1);
    if (vessels.length === 0) {
      console.log('No vessels found');
      return;
    }
    
    const vesselId = vessels[0]._id;
    console.log('Testing KNN for vessel ID:', vesselId);
    
    // Close the database connection
    mongoose.connection.close();
    
    // Test the KNN endpoint
    const response = await axios.get(`http://localhost:5000/api/knn/predictions/${vesselId}`);
    console.log('KNN Response:', response.data);
  } catch (error) {
    console.error('Error testing KNN:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testKNN();