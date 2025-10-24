/**
 * Script to check data in MongoDB Atlas and verify owner references
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

async function checkData() {
  console.log('🔍 Checking data in MongoDB Atlas...\n');
  
  // Connect to MongoDB Atlas
  console.log('🔗 Connecting to MongoDB Atlas...');
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
    // Note: These options are deprecated in newer MongoDB drivers but kept for compatibility
  });
  
  try {
    // Get model references
    const User = connection.model('User', require('./models/User').schema);
    const Vessel = connection.model('Vessel', require('./models/Vessel').schema);
    
    // Check users
    console.log('👥 Checking Users...');
    const users = await User.find({});
    console.log(`  Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`    - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check vessels and their owners
    console.log('\n🚢 Checking Vessels...');
    const vessels = await Vessel.find({}).populate('owner', 'name email');
    console.log(`  Found ${vessels.length} vessels:`);
    vessels.forEach(vessel => {
      console.log(`    - ${vessel.name} (IMO: ${vessel.imo}) - Owner: ${vessel.owner ? `${vessel.owner.name} (${vessel.owner.email})` : 'None'}`);
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
  checkData().catch(console.error);
}

module.exports = { checkData };