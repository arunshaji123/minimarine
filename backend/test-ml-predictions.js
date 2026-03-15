const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testMLPredictions() {
  try {
    console.log('🧪 TESTING ML PREDICTIONS\n');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Vessel = mongoose.model('Vessel', new mongoose.Schema({}, { strict: false }));
    const Survey = mongoose.model('Survey', new mongoose.Schema({}, { strict: false }));
    
    // Get owner
    const owner = await User.findOne({ email: 'owner@gmail.com' });
    if (!owner) {
      console.log('❌ ERROR: No owner user found!');
      process.exit(1);
    }
    
    // Get owner's vessels
    const vessels = await Vessel.find({ owner: owner._id }).limit(3);
    
    if (vessels.length === 0) {
      console.log('❌ ERROR: Owner has no vessels!');
      console.log('\nRun: node backend\\fix-owner-vessels.js');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`Found ${vessels.length} vessels for ${owner.email}\n`);
    
    // Test predictions for each vessel
    for (const vessel of vessels) {
      console.log('='.repeat(60));
      console.log(`VESSEL: ${vessel.name}`);
      console.log('='.repeat(60));
      
      // Check surveys
      const surveyCount = await Survey.countDocuments({ 
        vessel: vessel._id,
        status: 'Completed'
      });
      
      console.log(`Completed surveys: ${surveyCount}`);
      
      if (surveyCount === 0) {
        console.log('⚠ No surveys - cannot make predictions\n');
        continue;
      }
      
      // Run prediction
      console.log('Running ML prediction...\n');
      
      const pythonScript = path.join(__dirname, 'ml', 'predict.py');
      
      await new Promise((resolve) => {
        const python = spawn('python', [
          pythonScript,
          '--vesselId', vessel._id.toString()
        ], {
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });
        
        let output = '';
        let errorOutput = '';
        
        python.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        python.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(output);
              console.log('✅ Prediction successful!\n');
              console.log(`Vessel: ${result.vessel.name}`);
              console.log(`Overall Risk: ${result.overallRisk.prediction}`);
              console.log(`Risk Score: ${result.overallRisk.riskScore}/10\n`);
              console.log('Component Predictions:');
              result.predictions.slice(0, 3).forEach(p => {
                console.log(`  - ${p.component}: Risk ${p.riskScore}/10 [${p.urgency}]`);
              });
              console.log(`  ... and ${result.predictions.length - 3} more components\n`);
            } catch (e) {
              console.log('❌ Failed to parse prediction output');
              console.log('Raw output:', output.substring(0, 200));
            }
          } else {
            console.log(`❌ Python error (exit code ${code})`);
            if (errorOutput) {
              console.log('Error:', errorOutput.substring(0, 200));
            }
          }
          resolve();
        });
      });
    }
    
    await mongoose.disconnect();
    console.log('='.repeat(60));
    console.log('✅ Test complete!\n');
    console.log('If predictions worked, you can now:');
    console.log('  1. Start backend: cd backend && npm start');
    console.log('  2. Start frontend: cd frontend && npm start');
    console.log('  3. Login and view predictions in the dashboard!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMLPredictions();
