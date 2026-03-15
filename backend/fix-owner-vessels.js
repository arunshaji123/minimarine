const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixOwnerVessels() {
  try {
    console.log('🔧 FIXING OWNER-VESSEL LINKS\n');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Vessel = mongoose.model('Vessel', new mongoose.Schema({}, { strict: false }));
    const Survey = mongoose.model('Survey', new mongoose.Schema({}, { strict: false }));
    
    // Find owner user
    const owner = await User.findOne({ email: 'owner@gmail.com' });
    
    if (!owner) {
      console.log('❌ ERROR: No owner user found!');
      console.log('\nPlease create owner user first:');
      console.log('  1. Go to http://localhost:3000/register');
      console.log('  2. Register with email: owner@gmail.com');
      console.log('  3. Role: Owner');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`Found owner: ${owner.email}`);
    console.log(`Owner ID: ${owner._id}\n`);
    
    // Get current vessel counts
    const totalVessels = await Vessel.countDocuments();
    const ownedVessels = await Vessel.countDocuments({ owner: owner._id });
    
    console.log(`Total vessels in database: ${totalVessels}`);
    console.log(`Currently owned by ${owner.email}: ${ownedVessels}\n`);
    
    if (totalVessels === 0) {
      console.log('❌ No vessels in database!');
      console.log('\nGenerate sample data:');
      console.log('  cd backend\\ml');
      console.log('  python generate_sample_data.py');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    // Assign ALL vessels to this owner
    console.log('Assigning all vessels to owner...');
    const result = await Vessel.updateMany(
      {},
      { $set: { owner: owner._id } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} vessels\n`);
    
    // Verify
    const finalCount = await Vessel.countDocuments({ owner: owner._id });
    const surveyCount = await Survey.countDocuments({ status: 'Completed' });
    
    console.log('='.repeat(60));
    console.log('FINAL STATUS:\n');
    console.log(`  ✅ Vessels owned by ${owner.email}: ${finalCount}`);
    console.log(`  ✅ Completed surveys in database: ${surveyCount}`);
    
    if (finalCount > 0) {
      console.log('\n🎉 SUCCESS! Owner can now see vessels in the dashboard.');
      console.log('\nNext: Start the servers and login to see predictions!');
    }
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixOwnerVessels();
