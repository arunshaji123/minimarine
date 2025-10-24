/**
 * Script to create a test user with a known password
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Import User model
const User = require('./models/User');

async function createTestUser() {
  console.log('🔍 Creating test user...\n');
  
  // Connect to MongoDB Atlas
  console.log('🔗 Connecting to MongoDB Atlas...');
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
    // Note: These options are deprecated in newer MongoDB drivers but kept for compatibility
  });
  
  try {
    // Get User model
    const UserModel = connection.model('User', User.schema);
    
    // Check if test user already exists
    const existingUser = await UserModel.findOne({ email: 'testuser@example.com' });
    if (existingUser) {
      console.log('⚠️  Test user already exists, deleting...');
      await UserModel.deleteOne({ email: 'testuser@example.com' });
    }
    
    // Create test user
    console.log('👤 Creating test user with email: testuser@example.com and password: password123');
    const testUser = new UserModel({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123', // This will be hashed automatically
      role: 'owner'
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
    console.error(error);
  } finally {
    // Close connection
    await connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script if executed directly
if (require.main === module) {
  createTestUser().catch(console.error);
}

module.exports = { createTestUser };