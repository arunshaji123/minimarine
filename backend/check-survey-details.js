require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the completed survey with the new fields
    const survey = await mongoose.connection.db.collection('surveys').findOne({ 
      status: 'Completed',
      hullInspection: { $exists: true },
      hullInspectionFindings: { $exists: true }
    });
    
    if (survey) {
      console.log('Survey with component data found:');
      console.log('Title:', survey.title);
      console.log('ID:', survey._id);
      console.log('Status:', survey.status);
      console.log('Completion Date:', survey.completionDate);
      console.log('\nComponent Ratings:');
      console.log('  Hull Inspection:', survey.hullInspection);
      console.log('  Deck Superstructure:', survey.deckSuperstructure);
      console.log('  Machinery Engine Room:', survey.machineryEngineRoom);
      console.log('  Electrical Systems:', survey.electricalSystems);
      console.log('  Safety Equipment:', survey.safetyEquipment);
      console.log('  Navigation Equipment:', survey.navigationEquipment);
      console.log('  Pollution Control Systems:', survey.pollutionControlSystems);
      console.log('  Certificates Verification:', survey.certificatesVerification);
      
      console.log('\nComponent Findings:');
      console.log('  Hull Inspection Findings:', survey.hullInspectionFindings);
      console.log('  Deck Superstructure Findings:', survey.deckSuperstructureFindings);
      console.log('  Machinery Engine Room Findings:', survey.machineryEngineRoomFindings);
      console.log('  Electrical Systems Findings:', survey.electricalSystemsFindings);
      console.log('  Safety Equipment Findings:', survey.safetyEquipmentFindings);
      console.log('  Navigation Equipment Findings:', survey.navigationEquipmentFindings);
      console.log('  Pollution Control Systems Findings:', survey.pollutionControlSystemsFindings);
      console.log('  Certificates Verification Findings:', survey.certificatesVerificationFindings);
      
      console.log('\nGeneral Fields:');
      console.log('  General Findings:', survey.findings);
      console.log('  Recommendations:', survey.recommendations);
      console.log('  Notes:', survey.notes);
    } else {
      console.log('No survey with component data found');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });