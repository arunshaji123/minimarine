const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  const { Shipment, Cargo } = require('./backend/models');
  
  console.log('🔄 Starting migration from shipments to cargo collection...');
  
  // Get all existing shipments
  const shipments = await Shipment.find({});
  console.log(`📊 Found ${shipments.length} shipments to migrate`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const shipment of shipments) {
    try {
      // Check if cargo with same reference already exists
      const existingCargo = await Cargo.findOne({ reference: shipment.reference });
      if (existingCargo) {
        console.log(`⏭️ Skipping ${shipment.reference} - already exists in cargo collection`);
        skippedCount++;
        continue;
      }
      
      // Create new cargo document
      const cargoData = {
        reference: shipment.reference,
        description: shipment.description,
        cargoType: shipment.cargoType,
        quantity: shipment.quantity,
        weight: shipment.weight,
        vessel: shipment.vessel,
        voyage: shipment.voyage,
        shipper: shipment.shipper,
        consignee: shipment.consignee,
        status: shipment.status,
        specialRequirements: shipment.specialRequirements,
        notes: shipment.notes,
        createdBy: shipment.createdBy,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt
      };
      
      const newCargo = new Cargo(cargoData);
      await newCargo.save();
      
      console.log(`✅ Migrated: ${shipment.reference} - ${shipment.description}`);
      migratedCount++;
      
    } catch (error) {
      console.error(`❌ Error migrating ${shipment.reference}:`, error.message);
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`✅ Migrated: ${migratedCount} shipments`);
  console.log(`⏭️ Skipped: ${skippedCount} shipments`);
  
  // Show final counts
  const finalShipmentCount = await Shipment.countDocuments();
  const finalCargoCount = await Cargo.countDocuments();
  
  console.log(`\n📈 Final Collection Counts:`);
  console.log(`📦 Shipments collection: ${finalShipmentCount} documents`);
  console.log(`🚢 Cargo collection: ${finalCargoCount} documents`);
  
  // Show cargo collection contents
  const cargoList = await Cargo.find({}).select('reference description status');
  console.log(`\n📋 Active Cargo Shipments:`);
  cargoList.forEach(cargo => {
    console.log(`- ${cargo.reference}: ${cargo.description} (${cargo.status})`);
  });
  
  mongoose.connection.close();
  console.log('✅ Migration completed and database connection closed');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});


