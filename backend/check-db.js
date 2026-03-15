require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log('- ' + collection.name);
    });
    
    // Check if surveys collection exists
    const surveyCollection = collections.find(c => c.name === 'surveys');
    if (surveyCollection) {
      console.log('\nSurveys collection found!');
      
      // Count documents in surveys collection
      const count = await mongoose.connection.db.collection('surveys').countDocuments();
      console.log(`Total surveys in collection: ${count}`);
      
      // Show sample survey document structure
      if (count > 0) {
        const sample = await mongoose.connection.db.collection('surveys').findOne();
        console.log('\nSample survey document structure:');
        console.log(JSON.stringify(sample, null, 2));
      }
    } else {
      console.log('\nSurveys collection NOT found!');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });