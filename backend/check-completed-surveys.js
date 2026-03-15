require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check for completed surveys
    const completedSurveys = await mongoose.connection.db.collection('surveys').find({ status: 'Completed' }).toArray();
    console.log(`Total completed surveys: ${completedSurveys.length}`);
    
    if (completedSurveys.length > 0) {
      console.log('\nCompleted surveys:');
      completedSurveys.forEach((survey, index) => {
        console.log(`\n${index + 1}. ${survey.title} (ID: ${survey._id})`);
        console.log(`   Status: ${survey.status}`);
        console.log(`   Has hullInspection: ${survey.hullInspection !== undefined ? 'Yes' : 'No'}`);
        console.log(`   Has hullInspectionFindings: ${survey.hullInspectionFindings !== undefined ? 'Yes' : 'No'}`);
        console.log(`   Has deckSuperstructure: ${survey.deckSuperstructure !== undefined ? 'Yes' : 'No'}`);
        console.log(`   Has deckSuperstructureFindings: ${survey.deckSuperstructureFindings !== undefined ? 'Yes' : 'No'}`);
        // Add more fields as needed
      });
    } else {
      console.log('No completed surveys found');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });