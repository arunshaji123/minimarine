require('dotenv').config();
const mongoose = require('mongoose');
const { Vessel } = require('./models');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check for vessels
    const vessels = await Vessel.find({}).limit(5);
    console.log('Vessels:', vessels.length);
    
    if (vessels.length > 0) {
      console.log('Sample vessel:');
      console.log('- ID:', vessels[0]._id);
      console.log('- Name:', vessels[0].name);
      console.log('- IMO Number:', vessels[0].imoNumber);
      console.log('- Owner:', vessels[0].owner);
    } else {
      console.log('No vessels found');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
  });