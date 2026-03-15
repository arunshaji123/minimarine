require('dotenv').config();
const mongoose = require('mongoose');
const { Survey } = require('./models');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check for completed surveys
    const surveys = await Survey.find({ status: 'Completed' }).limit(5);
    console.log('Completed surveys:', surveys.length);
    
    if (surveys.length > 0) {
      console.log('Sample survey:');
      console.log('- ID:', surveys[0]._id);
      console.log('- Hull Inspection:', surveys[0].hullInspection);
      console.log('- Deck Superstructure:', surveys[0].deckSuperstructure);
      console.log('- Machinery Engine Room:', surveys[0].machineryEngineRoom);
      console.log('- Status:', surveys[0].status);
      console.log('- Completion Date:', surveys[0].completionDate);
    } else {
      console.log('No completed surveys found');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
  });