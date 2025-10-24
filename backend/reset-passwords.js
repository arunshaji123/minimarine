/**
 * Script to reset passwords for existing users
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Import User model
const User = require('./models/User');

async function resetPasswords() {
  console.log('🔄 Resetting passwords for existing users...\n');
  
  // Connect to MongoDB Atlas
  console.log('🔗 Connecting to MongoDB Atlas...');
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
    // Note: These options are deprecated in newer MongoDB drivers but kept for compatibility
  });
  
  try {
    // Get User model
    const UserModel = connection.model('User', User.schema);
    
    // List of users to reset passwords for
    const usersToReset = [
      { email: 'aa@gmail.com', password: 'password123' },
      { email: 'ship@gmail.com', password: 'password123' },
      { email: 'owner@gmail.com', password: 'password123' },
      { email: 'admin@gmail.com', password: 'password123' },
      { email: 'cargo@gmail.com', password: 'password123' },
      { email: 'survey@gmail.com', password: 'password123' },
      { email: 'demo@gmail.com', password: 'password123' },
      { email: 'survey2@gmail.com', password: 'password123' },
      { email: 'cargo2@gmail.com', password: 'password123' },
      { email: 'survey3@gmail.com', password: 'password123' },
      { email: 'arunshaji216@gmail.com', password: 'password123' }
    ];
    
    console.log('👤 Resetting passwords for users:');
    for (const user of usersToReset) {
      console.log(`   - ${user.email}`);
    }
    
    // Reset passwords for each user
    let resetCount = 0;
    for (const userData of usersToReset) {
      try {
        const user = await UserModel.findOne({ email: userData.email });
        if (user) {
          user.password = userData.password; // This will be hashed automatically
          await user.save();
          console.log(`✅ Password reset for ${userData.email}`);
          resetCount++;
        } else {
          console.log(`⚠️  User not found: ${userData.email}`);
        }
      } catch (error) {
        console.log(`❌ Error resetting password for ${userData.email}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Password reset completed! ${resetCount} users updated.`);
    console.log('\n📝 You can now log in with these credentials:');
    usersToReset.forEach(user => {
      console.log(`   ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.log('❌ Error resetting passwords:', error.message);
    console.error(error);
  } finally {
    // Close connection
    await connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script if executed directly
if (require.main === module) {
  resetPasswords().catch(console.error);
}

module.exports = { resetPasswords };