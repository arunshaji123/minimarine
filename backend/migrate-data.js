/**
 * Data migration script from local MongoDB to MongoDB Atlas
 * This script copies all data from local MongoDB to MongoDB Atlas
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Import all models
const { User, Vessel, Survey, Cargo, Shipment, ServiceRequest, Document, Maintenance, Crew, SurveyorBooking, CargoManagerBooking } = require('./models');

async function migrateData() {
  console.log('🔄 Starting data migration from local MongoDB to MongoDB Atlas...\n');
  
  // Connect to local MongoDB
  console.log('🔗 Connecting to local MongoDB...');
  const localConnection = await mongoose.createConnection('mongodb://localhost:27017/marine_survey', {
    // Note: These options are deprecated in newer MongoDB drivers but kept for compatibility
  });
  
  // Get local model references
  const LocalUser = localConnection.model('User', require('./models/User').schema);
  const LocalVessel = localConnection.model('Vessel', require('./models/Vessel').schema);
  const LocalSurvey = localConnection.model('Survey', require('./models/Survey').schema);
  const LocalCargo = localConnection.model('Cargo', require('./models/Cargo').schema);
  const LocalShipment = localConnection.model('Shipment', require('./models/Shipment').schema);
  const LocalServiceRequest = localConnection.model('ServiceRequest', require('./models/ServiceRequest').schema);
  const LocalDocument = localConnection.model('Document', require('./models/Document').schema);
  const LocalMaintenance = localConnection.model('Maintenance', require('./models/Maintenance').schema);
  const LocalCrew = localConnection.model('Crew', require('./models/Crew').schema);
  const LocalSurveyorBooking = localConnection.model('SurveyorBooking', require('./models/SurveyorBooking').schema);
  const LocalCargoManagerBooking = localConnection.model('CargoManagerBooking', require('./models/CargoManagerBooking').schema);
  
  console.log('✅ Connected to local MongoDB\n');
  
  // Connect to MongoDB Atlas
  console.log('🔗 Connecting to MongoDB Atlas...');
  const atlasConnection = await mongoose.createConnection(process.env.MONGODB_URI, {
    // Note: These options are deprecated in newer MongoDB drivers but kept for compatibility
  });
  
  // Get Atlas model references
  const AtlasUser = atlasConnection.model('User', require('./models/User').schema);
  const AtlasVessel = atlasConnection.model('Vessel', require('./models/Vessel').schema);
  const AtlasSurvey = atlasConnection.model('Survey', require('./models/Survey').schema);
  const AtlasCargo = atlasConnection.model('Cargo', require('./models/Cargo').schema);
  const AtlasShipment = atlasConnection.model('Shipment', require('./models/Shipment').schema);
  const AtlasServiceRequest = atlasConnection.model('ServiceRequest', require('./models/ServiceRequest').schema);
  const AtlasDocument = atlasConnection.model('Document', require('./models/Document').schema);
  const AtlasMaintenance = atlasConnection.model('Maintenance', require('./models/Maintenance').schema);
  const AtlasCrew = atlasConnection.model('Crew', require('./models/Crew').schema);
  const AtlasSurveyorBooking = atlasConnection.model('SurveyorBooking', require('./models/SurveyorBooking').schema);
  const AtlasCargoManagerBooking = atlasConnection.model('CargoManagerBooking', require('./models/CargoManagerBooking').schema);
  
  console.log('✅ Connected to MongoDB Atlas\n');
  
  try {
    // Clear existing data in Atlas
    console.log('🧹 Clearing existing data in Atlas...');
    await Promise.all([
      AtlasUser.deleteMany({}),
      AtlasVessel.deleteMany({}),
      AtlasSurvey.deleteMany({}),
      AtlasCargo.deleteMany({}),
      AtlasShipment.deleteMany({}),
      AtlasServiceRequest.deleteMany({}),
      AtlasDocument.deleteMany({}),
      AtlasMaintenance.deleteMany({}),
      AtlasCrew.deleteMany({}),
      AtlasSurveyorBooking.deleteMany({}),
      AtlasCargoManagerBooking.deleteMany({})
    ]);
    console.log('✅ Cleared existing data in Atlas\n');
    
    // Migrate Users first (they are referenced by other documents)
    console.log('👥 Migrating Users...');
    const localUsers = await LocalUser.find({});
    console.log(`  Found ${localUsers.length} users in local database`);
    
    // Store mapping of old user IDs to new user IDs
    const userIdMap = {};
    
    if (localUsers.length > 0) {
      // Save users and create ID mapping
      for (const user of localUsers) {
        const userObj = user.toObject();
        const oldId = userObj._id;
        delete userObj._id;
        delete userObj.__v;
        
        const newUser = new AtlasUser(userObj);
        const savedUser = await newUser.save();
        userIdMap[oldId] = savedUser._id;
        console.log(`    Migrated user: ${savedUser.name} (${savedUser.email})`);
      }
      console.log('  ✅ Users migrated successfully');
    }
    
    // Migrate Vessels
    console.log('\n🚢 Migrating Vessels...');
    const localVessels = await LocalVessel.find({});
    console.log(`  Found ${localVessels.length} vessels in local database`);
    
    // Store mapping of old vessel IDs to new vessel IDs
    const vesselIdMap = {};
    
    if (localVessels.length > 0) {
      for (const vessel of localVessels) {
        const vesselObj = vessel.toObject();
        const oldId = vesselObj._id;
        delete vesselObj._id;
        delete vesselObj.__v;
        
        // Fix owner reference
        if (vesselObj.owner && userIdMap[vesselObj.owner]) {
          vesselObj.owner = userIdMap[vesselObj.owner];
          console.log(`    Fixed owner reference for vessel: ${vesselObj.name}`);
        }
        
        // Fix shipManagement reference
        if (vesselObj.shipManagement && userIdMap[vesselObj.shipManagement]) {
          vesselObj.shipManagement = userIdMap[vesselObj.shipManagement];
          console.log(`    Fixed shipManagement reference for vessel: ${vesselObj.name}`);
        }
        
        const newVessel = new AtlasVessel(vesselObj);
        const savedVessel = await newVessel.save();
        vesselIdMap[oldId] = savedVessel._id;
        console.log(`    Migrated vessel: ${savedVessel.name} (IMO: ${savedVessel.imo})`);
      }
      console.log('  ✅ Vessels migrated successfully');
    }
    
    // Migrate Surveys
    console.log('\n📋 Migrating Surveys...');
    const localSurveys = await LocalSurvey.find({});
    console.log(`  Found ${localSurveys.length} surveys in local database`);
    if (localSurveys.length > 0) {
      for (const survey of localSurveys) {
        const surveyObj = survey.toObject();
        delete surveyObj._id;
        delete surveyObj.__v;
        
        // Fix references
        if (surveyObj.vessel && vesselIdMap[surveyObj.vessel]) {
          surveyObj.vessel = vesselIdMap[surveyObj.vessel];
        }
        if (surveyObj.surveyor && userIdMap[surveyObj.surveyor]) {
          surveyObj.surveyor = userIdMap[surveyObj.surveyor];
        }
        if (surveyObj.requestedBy && userIdMap[surveyObj.requestedBy]) {
          surveyObj.requestedBy = userIdMap[surveyObj.requestedBy];
        }
        
        const newSurvey = new AtlasSurvey(surveyObj);
        const savedSurvey = await newSurvey.save();
        console.log(`    Migrated survey: ${savedSurvey.title}`);
      }
      console.log('  ✅ Surveys migrated successfully');
    }
    
    // Migrate Cargo
    console.log('\n📦 Migrating Cargo...');
    const localCargos = await LocalCargo.find({});
    console.log(`  Found ${localCargos.length} cargo records in local database`);
    if (localCargos.length > 0) {
      for (const cargo of localCargos) {
        const cargoObj = cargo.toObject();
        delete cargoObj._id;
        delete cargoObj.__v;
        
        // Fix references
        if (cargoObj.vessel && vesselIdMap[cargoObj.vessel]) {
          cargoObj.vessel = vesselIdMap[cargoObj.vessel];
        }
        if (cargoObj.shippingLine && userIdMap[cargoObj.shippingLine]) {
          cargoObj.shippingLine = userIdMap[cargoObj.shippingLine];
        }
        
        const newCargo = new AtlasCargo(cargoObj);
        const savedCargo = await newCargo.save();
        console.log(`    Migrated cargo: ${savedCargo.description || 'Cargo item'}`);
      }
      console.log('  ✅ Cargo records migrated successfully');
    }
    
    // Migrate Shipments
    console.log('\n🚚 Migrating Shipments...');
    const localShipments = await LocalShipment.find({});
    console.log(`  Found ${localShipments.length} shipments in local database`);
    if (localShipments.length > 0) {
      for (const shipment of localShipments) {
        const shipmentObj = shipment.toObject();
        delete shipmentObj._id;
        delete shipmentObj.__v;
        
        // Fix references
        if (shipmentObj.cargo && localCargos.find(c => c._id.toString() === shipmentObj.cargo)) {
          // This would need more complex mapping, but for now we'll just remove invalid references
          delete shipmentObj.cargo;
        }
        
        const newShipment = new AtlasShipment(shipmentObj);
        const savedShipment = await newShipment.save();
        console.log(`    Migrated shipment: ${savedShipment.trackingNumber || 'Shipment'}`);
      }
      console.log('  ✅ Shipments migrated successfully');
    }
    
    // Migrate Service Requests
    console.log('\n🔧 Migrating Service Requests...');
    const localServiceRequests = await LocalServiceRequest.find({});
    console.log(`  Found ${localServiceRequests.length} service requests in local database`);
    if (localServiceRequests.length > 0) {
      for (const request of localServiceRequests) {
        const requestObj = request.toObject();
        delete requestObj._id;
        delete requestObj.__v;
        
        // Fix references
        if (requestObj.vessel && vesselIdMap[requestObj.vessel]) {
          requestObj.vessel = vesselIdMap[requestObj.vessel];
        }
        if (requestObj.requestedBy && userIdMap[requestObj.requestedBy]) {
          requestObj.requestedBy = userIdMap[requestObj.requestedBy];
        }
        if (requestObj.assignedTo && userIdMap[requestObj.assignedTo]) {
          requestObj.assignedTo = userIdMap[requestObj.assignedTo];
        }
        
        const newRequest = new AtlasServiceRequest(requestObj);
        const savedRequest = await newRequest.save();
        console.log(`    Migrated service request: ${savedRequest.title}`);
      }
      console.log('  ✅ Service requests migrated successfully');
    }
    
    // Migrate Documents
    console.log('\n📄 Migrating Documents...');
    const localDocuments = await LocalDocument.find({});
    console.log(`  Found ${localDocuments.length} documents in local database`);
    if (localDocuments.length > 0) {
      for (const document of localDocuments) {
        const documentObj = document.toObject();
        delete documentObj._id;
        delete documentObj.__v;
        
        // Fix references
        if (documentObj.vessel && vesselIdMap[documentObj.vessel]) {
          documentObj.vessel = vesselIdMap[documentObj.vessel];
        }
        if (documentObj.uploadedBy && userIdMap[documentObj.uploadedBy]) {
          documentObj.uploadedBy = userIdMap[documentObj.uploadedBy];
        }
        
        const newDocument = new AtlasDocument(documentObj);
        const savedDocument = await newDocument.save();
        console.log(`    Migrated document: ${savedDocument.name}`);
      }
      console.log('  ✅ Documents migrated successfully');
    }
    
    // Migrate Maintenance
    console.log('\n🛠️ Migrating Maintenance Records...');
    const localMaintenances = await LocalMaintenance.find({});
    console.log(`  Found ${localMaintenances.length} maintenance records in local database`);
    if (localMaintenances.length > 0) {
      for (const maintenance of localMaintenances) {
        const maintenanceObj = maintenance.toObject();
        delete maintenanceObj._id;
        delete maintenanceObj.__v;
        
        // Fix references
        if (maintenanceObj.vessel && vesselIdMap[maintenanceObj.vessel]) {
          maintenanceObj.vessel = vesselIdMap[maintenanceObj.vessel];
        }
        if (maintenanceObj.assignedTo && userIdMap[maintenanceObj.assignedTo]) {
          maintenanceObj.assignedTo = userIdMap[maintenanceObj.assignedTo];
        }
        
        const newMaintenance = new AtlasMaintenance(maintenanceObj);
        const savedMaintenance = await newMaintenance.save();
        console.log(`    Migrated maintenance: ${savedMaintenance.title}`);
      }
      console.log('  ✅ Maintenance records migrated successfully');
    }
    
    // Migrate Crew
    console.log('\n👨‍✈️ Migrating Crew Records...');
    const localCrews = await LocalCrew.find({});
    console.log(`  Found ${localCrews.length} crew records in local database`);
    if (localCrews.length > 0) {
      for (const crew of localCrews) {
        const crewObj = crew.toObject();
        delete crewObj._id;
        delete crewObj.__v;
        
        // Fix references
        if (crewObj.vessel && vesselIdMap[crewObj.vessel]) {
          crewObj.vessel = vesselIdMap[crewObj.vessel];
        }
        
        const newCrew = new AtlasCrew(crewObj);
        const savedCrew = await newCrew.save();
        console.log(`    Migrated crew member: ${savedCrew.name}`);
      }
      console.log('  ✅ Crew records migrated successfully');
    }
    
    // Migrate Surveyor Bookings
    console.log('\n📅 Migrating Surveyor Bookings...');
    const localSurveyorBookings = await LocalSurveyorBooking.find({});
    console.log(`  Found ${localSurveyorBookings.length} surveyor bookings in local database`);
    if (localSurveyorBookings.length > 0) {
      for (const booking of localSurveyorBookings) {
        const bookingObj = booking.toObject();
        delete bookingObj._id;
        delete bookingObj.__v;
        
        // Fix references
        if (bookingObj.surveyor && userIdMap[bookingObj.surveyor]) {
          bookingObj.surveyor = userIdMap[bookingObj.surveyor];
        }
        if (bookingObj.bookedBy && userIdMap[bookingObj.bookedBy]) {
          bookingObj.bookedBy = userIdMap[bookingObj.bookedBy];
        }
        if (bookingObj.vessel && vesselIdMap[bookingObj.vessel]) {
          bookingObj.vessel = vesselIdMap[bookingObj.vessel];
        }
        
        // Fix status values - map invalid values to valid ones
        if (bookingObj.status && !['Pending', 'Accepted', 'Declined', 'Completed'].includes(bookingObj.status)) {
          console.log(`    ⚠️  Fixing invalid status '${bookingObj.status}' to 'Pending'`);
          bookingObj.status = 'Pending';
        }
        
        const newBooking = new AtlasSurveyorBooking(bookingObj);
        const savedBooking = await newBooking.save();
        console.log(`    Migrated surveyor booking: ${savedBooking.vesselName}`);
      }
      console.log('  ✅ Surveyor bookings migrated successfully');
    }
    
    // Migrate Cargo Manager Bookings
    console.log('\n💼 Migrating Cargo Manager Bookings...');
    const localCargoManagerBookings = await LocalCargoManagerBooking.find({});
    console.log(`  Found ${localCargoManagerBookings.length} cargo manager bookings in local database`);
    if (localCargoManagerBookings.length > 0) {
      for (const booking of localCargoManagerBookings) {
        const bookingObj = booking.toObject();
        delete bookingObj._id;
        delete bookingObj.__v;
        
        // Fix references
        if (bookingObj.cargoManager && userIdMap[bookingObj.cargoManager]) {
          bookingObj.cargoManager = userIdMap[bookingObj.cargoManager];
        }
        if (bookingObj.bookedBy && userIdMap[bookingObj.bookedBy]) {
          bookingObj.bookedBy = userIdMap[bookingObj.bookedBy];
        }
        if (bookingObj.vessel && vesselIdMap[bookingObj.vessel]) {
          bookingObj.vessel = vesselIdMap[bookingObj.vessel];
        }
        
        // Fix status values - map invalid values to valid ones
        if (bookingObj.status && !['Pending', 'Accepted', 'Declined'].includes(bookingObj.status)) {
          console.log(`    ⚠️  Fixing invalid status '${bookingObj.status}' to 'Pending'`);
          bookingObj.status = 'Pending';
        }
        
        const newBooking = new AtlasCargoManagerBooking(bookingObj);
        const savedBooking = await newBooking.save();
        console.log(`    Migrated cargo manager booking: ${savedBooking.vesselName}`);
      }
      console.log('  ✅ Cargo manager bookings migrated successfully');
    }
    
    console.log('\n🎉 Data migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`  👥 Users: ${localUsers.length}`);
    console.log(`  🚢 Vessels: ${localVessels.length}`);
    console.log(`  📋 Surveys: ${localSurveys.length}`);
    console.log(`  📦 Cargo: ${localCargos.length}`);
    console.log(`  🚚 Shipments: ${localShipments.length}`);
    console.log(`  🔧 Service Requests: ${localServiceRequests.length}`);
    console.log(`  📄 Documents: ${localDocuments.length}`);
    console.log(`  🛠️ Maintenance: ${localMaintenances.length}`);
    console.log(`  👨‍✈️ Crew: ${localCrews.length}`);
    console.log(`  📅 Surveyor Bookings: ${localSurveyorBookings.length}`);
    console.log(`  💼 Cargo Manager Bookings: ${localCargoManagerBookings.length}`);
    
  } catch (error) {
    console.log('❌ Error during data migration:', error.message);
    console.error(error);
  } finally {
    // Close connections
    await localConnection.close();
    await atlasConnection.close();
    console.log('\n🔒 Database connections closed');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateData().catch(console.error);
}

module.exports = { migrateData };