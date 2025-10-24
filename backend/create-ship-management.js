const mongoose = require('mongoose');
const { User } = require('./models');
require('dotenv').config();

async function createShipManagementCompany() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marine_survey');
    console.log('Connected to MongoDB');

    // Check if ship management company already exists
    const existingCompany = await User.findOne({ 
      role: 'ship_management',
      email: 'shipmanagement@example.com'
    });

    if (existingCompany) {
      console.log('Ship management company already exists:', existingCompany.name);
      // Update lastLoginAt to make it available
      existingCompany.lastLoginAt = new Date();
      await existingCompany.save();
      console.log('Updated lastLoginAt for existing company');
    } else {
      // Create new ship management company
      const shipCompany = new User({
        name: 'Marine Ship Management Co.',
        email: 'shipmanagement@example.com',
        role: 'ship_management',
        status: 'active',
        lastLoginAt: new Date(),
        firebaseUid: 'test-ship-management-uid'
      });

      await shipCompany.save();
      console.log('Created new ship management company:', shipCompany.name);
    }

    // List all ship management companies
    const companies = await User.find({ role: 'ship_management', status: 'active' });
    console.log('All ship management companies:');
    companies.forEach(c => {
      console.log(`- ${c.name} (${c.email}) - Last login: ${c.lastLoginAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createShipManagementCompany();
