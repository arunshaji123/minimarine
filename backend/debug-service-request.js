const mongoose = require('mongoose');
const { User, ServiceRequest } = require('./models');
require('dotenv').config();

async function debugServiceRequest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marine_survey');
    console.log('Connected to MongoDB');

    // Find all service requests
    const requests = await ServiceRequest.find({})
      .populate('vessel', 'name')
      .populate('owner', 'name email role')
      .populate('shipCompany', 'name email role');

    console.log('\n=== ALL SERVICE REQUESTS ===');
    requests.forEach(req => {
      console.log(`ID: ${req._id}`);
      console.log(`Title: ${req.title}`);
      console.log(`Status: ${req.status}`);
      console.log(`Owner: ${req.owner?.name} (${req.owner?.email}) - Role: ${req.owner?.role}`);
      console.log(`Ship Company: ${req.shipCompany?.name} (${req.shipCompany?.email}) - Role: ${req.shipCompany?.role}`);
      console.log(`Vessel: ${req.vessel?.name}`);
      console.log('---');
    });

    // Find all ship management users
    const shipUsers = await User.find({ role: 'ship_management' });
    console.log('\n=== SHIP MANAGEMENT USERS ===');
    shipUsers.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`Last Login: ${user.lastLoginAt}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugServiceRequest();
