const mongoose = require('mongoose');
const { User, Vessel, ServiceRequest } = require('./models');
require('dotenv').config();

async function testServiceRequest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marine_survey');
    console.log('Connected to MongoDB');

    // Find an owner user
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.log('No owner found in database');
      return;
    }
    console.log('Found owner:', owner.name, owner.email);

    // Find a vessel owned by this owner
    const vessel = await Vessel.findOne({ owner: owner._id });
    if (!vessel) {
      console.log('No vessel found for this owner');
      return;
    }
    console.log('Found vessel:', vessel.name, vessel.imo);

    // Find a ship management company
    const shipCompany = await User.findOne({ role: 'ship_management', status: 'active' });
    if (!shipCompany) {
      console.log('No ship management company found');
      return;
    }
    console.log('Found ship company:', shipCompany.name, shipCompany.email);

    // Try to create a service request
    const request = await ServiceRequest.create({
      title: 'Test Service Request',
      description: 'This is a test service request to verify the system works',
      vessel: vessel._id,
      owner: owner._id,
      shipCompany: shipCompany._id,
      status: 'pending'
    });

    console.log('Service request created successfully:', request._id);

    // Populate and display
    const populated = await ServiceRequest.findById(request._id)
      .populate('vessel', 'name imo')
      .populate('owner', 'name email')
      .populate('shipCompany', 'name email');

    console.log('Populated request:', {
      title: populated.title,
      vessel: populated.vessel.name,
      owner: populated.owner.name,
      shipCompany: populated.shipCompany.name
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testServiceRequest();
