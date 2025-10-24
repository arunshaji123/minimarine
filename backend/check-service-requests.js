/**
 * Script to check service requests in the database
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

async function checkServiceRequests() {
  console.log('🔍 Checking service requests in MongoDB Atlas...\n');
  
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
    
    // Check service requests
    console.log('📋 Checking Service Requests...');
    const requests = await ServiceRequestModel.find({})
      .populate('owner', 'name email role')
      .populate('vessel', 'name')
      .populate('shipCompany', 'name email role');
    
    console.log(`  Found ${requests.length} service requests:`);
    requests.forEach((req, index) => {
      console.log(`    ${index + 1}. Title: ${req.title}`);
      console.log(`       Owner: ${req.owner ? `${req.owner.email} (${req.owner.role})` : 'None'}`);
      console.log(`       Vessel: ${req.vessel ? req.vessel.name : 'None'}`);
      console.log(`       Status: ${req.status}`);
      console.log(`       Ship Company: ${req.shipCompany ? req.shipCompany.email : 'None'}`);
      console.log('');
    });
    
    // Check users
    console.log('👥 Checking Users...');
    const users = await UserModel.find({});
    console.log(`  Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`    - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n✅ Data check completed!');
    
  } catch (error) {
    console.log('❌ Error during data check:', error.message);
    console.error(error);
  } finally {
    // Close connection
    await connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkServiceRequests().catch(console.error);
}

module.exports = { checkServiceRequests };