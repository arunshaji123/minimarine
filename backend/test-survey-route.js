require('dotenv').config();
const mongoose = require('mongoose');
const { Survey } = require('./models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the completed survey with the new fields
    const survey = await Survey.findOne({ 
      status: 'Completed',
      hullInspection: { $exists: true },
      hullInspectionFindings: { $exists: true }
    });
    
    if (survey) {
      console.log('Survey found directly from Mongoose model:');
      console.log('Title:', survey.title);
      console.log('ID:', survey._id);
      console.log('Has hullInspection:', survey.hullInspection !== undefined);
      console.log('Has hullInspectionFindings:', survey.hullInspectionFindings !== undefined);
      console.log('hullInspection value:', survey.hullInspection);
      console.log('hullInspectionFindings value:', survey.hullInspectionFindings);
    } else {
      console.log('No survey with component data found');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });