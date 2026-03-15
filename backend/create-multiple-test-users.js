/**
 * Script to create test users for different roles with known passwords
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Import User model
const User = require('./models/User');

async function createMultipleTestUsers() {
  console.log('🔍 Creating test users for different roles...\n');
  
  // Connect to MongoDB Atlas
  console.log('🔗 Connecting to MongoDB Atlas...');
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
    // Note: These options are deprecated in newer MongoDB drivers but kept for compatibility
  });
  
  try {
    // Get User model
    const UserModel = connection.model('User', User.schema);
    
    // Define test users for different roles
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      },
      {
        name: 'Owner User',
        email: 'owner@example.com',
        password: 'password123',
        role: 'owner'
      },
      {
        name: 'Surveyor User',
        email: 'surveyor@example.com',
        password: 'password123',
        role: 'surveyor'
      },
      {
        name: 'Cargo Manager User',
        email: 'cargo@example.com',
        password: 'password123',
        role: 'cargo_manager'
      }
    ];
    
    // Create each test user
    for (const userData of testUsers) {
      // Check if test user already exists
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  Test user ${userData.email} already exists, deleting...`);
        await UserModel.deleteOne({ email: userData.email });
      }
      
      // Create test user
      console.log(`👤 Creating test user with email: ${userData.email} and password: ${userData.password}`);
      const testUser = new UserModel(userData);
      
      await testUser.save();
      console.log(`✅ Test user ${userData.email} created successfully!`);
      console.log(`   Name: ${testUser.name}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Role: ${testUser.role}\n`);
    }
    
  } catch (error) {
    console.log('❌ Error creating test users:', error.message);
    console.error(error);
  } finally {
    // Close connection
    await connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script if executed directly
if (require.main === module) {
  createMultipleTestUsers().catch(console.error);
}

module.exports = { createMultipleTestUsers };