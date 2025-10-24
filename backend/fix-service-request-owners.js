/**
 * Script to fix owner references in service requests
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Import models
const ServiceRequest = require('./models/ServiceRequest');
const User = require('./models/User');
const Vessel = require('./models/Vessel');

async function fixServiceRequestOwners() {
  console.log('🔧 Fixing owner references in service requests...\n');
  
  // Connect to MongoDB Atlas
  console.log('🔗 Connecting to MongoDB Atlas...');
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
    // Note: These options are deprecated in newer MongoDB drivers but kept for compatibility
  });
  
  try {
    // Get model references
    const ServiceRequestModel = connection.model('ServiceRequest', ServiceRequest.schema);
    const UserModel = connection.model('User', User.schema);
    const VesselModel = connection.model('Vessel', Vessel.schema);
    
    // Find users by role
    const owners = await UserModel.find({ role: 'owner' });
    const shipManagers = await UserModel.find({ role: 'ship_management' });
    
    console.log(`👥 Found ${owners.length} owners and ${shipManagers.length} ship managers`);
    
    // Get the default owner and ship manager
    const defaultOwner = owners.find(u => u.email === 'owner@gmail.com') || owners[0];
    const defaultManager = shipManagers.find(u => u.email === 'ship@gmail.com') || shipManagers[0];
    
    if (!defaultOwner) {
      console.log('❌ No owner found');
      return;
    }
    
    if (!defaultManager) {
      console.log('❌ No ship manager found');
      return;
    }
    
    console.log(`👤 Using owner: ${defaultOwner.email}`);
    console.log(`🏢 Using ship manager: ${defaultManager.email}`);
    
    // Get all service requests
    const requests = await ServiceRequestModel.find({});
    console.log(`📋 Found ${requests.length} service requests to fix`);
    
    // Fix owner references
    let fixedCount = 0;
    for (const request of requests) {
      // Fix all requests, even if they have owners (to ensure they're correct)
      console.log(`🔧 Processing request: ${request.title}`);
      console.log(`   Current owner: ${request.owner}`);
      console.log(`   Current ship company: ${request.shipCompany}`);
      
      request.owner = defaultOwner._id;
      request.shipCompany = defaultManager._id;
      await request.save();
      console.log(`✅ Fixed request: ${request.title}`);
      fixedCount++;
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} service requests!`);
    
  } catch (error) {
    console.log('❌ Error fixing service request owners:', error.message);
    console.error(error);
  } finally {
    // Close connection
    await connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixServiceRequestOwners().catch(console.error);
}

module.exports = { fixServiceRequestOwners };