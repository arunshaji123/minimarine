require('dotenv').config();
const mongoose = require('mongoose');
const Vessel = require('./models/Vessel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find all vessels without vesselId
      const vessels = await Vessel.find({ vesselId: { $exists: false } });
      
      console.log(`Found ${vessels.length} vessels without vesselId`);
      
      for (const vessel of vessels) {
        // Generate a user-friendly vessel ID based on vessel name and a random suffix
        const baseName = vessel.name.replace(/\s+/g, '').substring(0, 5).toUpperCase();
        const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        const newVesselId = `${baseName}${suffix}`;
        
        // Update the vessel with the new ID
        await Vessel.findByIdAndUpdate(vessel._id, { vesselId: newVesselId });
        console.log(`Updated vessel ${vessel.name} with ID: ${newVesselId}`);
      }
      
      console.log('Migration completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });