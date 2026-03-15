require('dotenv').config();
const mongoose = require('mongoose');
const { Survey, Vessel } = require('./models');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get a vessel
    const vessels = await Vessel.find({}).limit(1);
    if (vessels.length === 0) {
      console.log('No vessels found');
      return;
    }
    
    const vessel = vessels[0];
    console.log('Using vessel:', vessel.name);
    
    // Create a test survey with component ratings
    const testSurvey = new Survey({
      title: 'Test Survey with Ratings',
      vessel: vessel._id,
      surveyType: 'Annual',
      surveyor: vessel.owner, // Using owner as surveyor for test
      requestedBy: vessel.owner,
      scheduledDate: new Date(),
      completionDate: new Date(),
      status: 'Completed',
      hullInspection: 4,
      deckSuperstructure: 3,
      machineryEngineRoom: 5,
      electricalSystems: 4,
      safetyEquipment: 3,
      navigationEquipment: 4,
      pollutionControlSystems: 5,
      certificatesVerification: 4,
      findings: [{
        category: 'Structural', // Valid enum value
        description: 'Test finding',
        severity: 'Observation',
        status: 'Open'
      }],
      notes: 'Test survey with component ratings'
    });
    
    await testSurvey.save();
    console.log('Created test survey with ID:', testSurvey._id);
    console.log('Component ratings:');
    console.log('- Hull Inspection:', testSurvey.hullInspection);
    console.log('- Deck Superstructure:', testSurvey.deckSuperstructure);
    console.log('- Machinery Engine Room:', testSurvey.machineryEngineRoom);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err.message);
  });