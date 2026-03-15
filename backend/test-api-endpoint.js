require('dotenv').config();
const mongoose = require('mongoose');
const { Survey } = require('./models');

// Mock auth middleware for testing
const mockAuth = (req, res, next) => {
  // Mock user with admin role to bypass authorization
  req.user = { role: 'admin', id: 'test-user-id' };
  next();
};

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
      console.log('Testing survey details route logic...');
      
      // Simulate the route logic
      const populatedSurvey = await Survey.findById(survey._id)
        .populate('vessel', 'name imoNumber')
        .populate('surveyor', 'name email')
        .populate('requestedBy', 'name email');
      
      console.log('Populated survey data:');
      console.log('Title:', populatedSurvey.title);
      console.log('Has hullInspection:', populatedSurvey.hullInspection !== undefined);
      console.log('Has hullInspectionFindings:', populatedSurvey.hullInspectionFindings !== undefined);
      console.log('hullInspection value:', populatedSurvey.hullInspection);
      console.log('hullInspectionFindings value:', populatedSurvey.hullInspectionFindings);
      
      // Convert to JSON to see what would be sent in response
      const jsonResponse = populatedSurvey.toJSON();
      console.log('\nJSON response keys:');
      Object.keys(jsonResponse).forEach(key => {
        console.log('-', key);
      });
    } else {
      console.log('No survey with component data found');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });