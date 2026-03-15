const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function deleteSampleData() {
  try {
    console.log('🗑️  DELETE SAMPLE DATA\n');
    console.log('='.repeat(60));
    console.log('⚠️  WARNING: This will delete all sample vessels and surveys!');
    console.log('Only do this if you have REAL vessels with surveys.\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Vessel = mongoose.model('Vessel', new mongoose.Schema({}, { strict: false }));
    const Survey = mongoose.model('Survey', new mongoose.Schema({}, { strict: false }));
    
    // Count current data
    const totalVessels = await Vessel.countDocuments();
    const sampleVessels = await Vessel.countDocuments({ name: /Sample Vessel/ });
    const realVessels = totalVessels - sampleVessels;
    
    console.log('Current data:');
    console.log(`  Total vessels: ${totalVessels}`);
    console.log(`  Sample vessels: ${sampleVessels}`);
    console.log(`  Real vessels: ${realVessels}\n`);
    
    if (realVessels === 0) {
      console.log('⚠️  You have NO real vessels!');
      console.log('Do NOT delete sample data yet.\n');
      console.log('Add real vessels first, then delete sample data.');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    console.log('✅ You have real vessels. Safe to delete sample data.\n');
    console.log('This will:');
    console.log('  1. Delete all vessels with "Sample Vessel" in name');
    console.log('  2. Delete all surveys for those vessels');
    console.log('  3. Keep all your real data intact\n');
    
    // Get sample vessel IDs
    const sampleVesselDocs = await Vessel.find({ name: /Sample Vessel/ });
    const sampleVesselIds = sampleVesselDocs.map(v => v._id);
    
    if (sampleVesselIds.length === 0) {
      console.log('No sample vessels to delete.');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Delete surveys for sample vessels
    const surveyResult = await Survey.deleteMany({ 
      vessel: { $in: sampleVesselIds } 
    });
    
    // Delete sample vessels
    const vesselResult = await Vessel.deleteMany({ 
      name: /Sample Vessel/ 
    });
    
    console.log('='.repeat(60));
    console.log('DELETION COMPLETE:\n');
    console.log(`  ✅ Deleted ${vesselResult.deletedCount} sample vessels`);
    console.log(`  ✅ Deleted ${surveyResult.deletedCount} sample surveys`);
    
    // Verify remaining data
    const remainingVessels = await Vessel.countDocuments();
    const remainingSurveys = await Survey.countDocuments();
    
    console.log(`\nRemaining in database:`);
    console.log(`  Vessels: ${remainingVessels}`);
    console.log(`  Surveys: ${remainingSurveys}\n`);
    
    console.log('⚠️  IMPORTANT: Retrain the ML model with your real data:');
    console.log('  cd backend\\ml');
    console.log('  python train_model.py\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteSampleData();
