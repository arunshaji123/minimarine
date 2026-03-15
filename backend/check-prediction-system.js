const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkSystem() {
  console.log('🔍 PREDICTION SYSTEM STATUS CHECK\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Check ML Files
    console.log('\n1️⃣ ML MODEL FILES:');
    const modelPath = path.join(__dirname, 'ml', 'model.pkl');
    const scalerPath = path.join(__dirname, 'ml', 'scaler.pkl');
    const modelExists = fs.existsSync(modelPath);
    const scalerExists = fs.existsSync(scalerPath);
    console.log(`   model.pkl: ${modelExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   scaler.pkl: ${scalerExists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!modelExists) {
      console.log('   ⚠ Run: cd backend\\ml && python train_model.py');
    }
    
    // 2. Check Database
    console.log('\n2️⃣ DATABASE:');
    
    if (!process.env.MONGODB_URI) {
      console.log('   ❌ MONGODB_URI not found in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connected');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Vessel = mongoose.model('Vessel', new mongoose.Schema({}, { strict: false }));
    const Survey = mongoose.model('Survey', new mongoose.Schema({}, { strict: false }));
    
    const owner = await User.findOne({ email: 'owner@gmail.com' });
    console.log(`   Owner user (owner@gmail.com): ${owner ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (owner) {
      const vesselCount = await Vessel.countDocuments({ owner: owner._id });
      const surveyCount = await Survey.countDocuments({ status: 'Completed' });
      console.log(`   Owner's vessels: ${vesselCount} ${vesselCount > 0 ? '✅' : '❌'}`);
      console.log(`   Completed surveys: ${surveyCount} ${surveyCount > 0 ? '✅' : '❌'}`);
      
      if (vesselCount === 0) {
        console.log('   ⚠ Run: node backend\\fix-owner-vessels.js');
      }
    }
    
    // 3. Check API Route
    console.log('\n3️⃣ API ROUTE:');
    const routePath = path.join(__dirname, 'routes', 'knn.js');
    const routeExists = fs.existsSync(routePath);
    console.log(`   /api/knn/predictions: ${routeExists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // 4. Check Frontend
    console.log('\n4️⃣ FRONTEND:');
    const ownerDashPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'dashboards', 'OwnerDashboard.js');
    const predTabPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'dashboards', 'PredictiveMaintenanceTab.js');
    const ownerDashExists = fs.existsSync(ownerDashPath);
    const predTabExists = fs.existsSync(predTabPath);
    console.log(`   OwnerDashboard.js: ${ownerDashExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   PredictiveMaintenanceTab.js: ${predTabExists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:\n');
    
    const allGood = modelExists && scalerExists && owner && (await Vessel.countDocuments({ owner: owner?._id })) > 0;
    
    if (allGood) {
      console.log('✅ SYSTEM READY!\n');
      console.log('Next steps:');
      console.log('  1. Start backend: cd backend && npm start');
      console.log('  2. Start frontend: cd frontend && npm start');
      console.log('  3. Login as owner@gmail.com');
      console.log('  4. Click "Predictive Maintenance" tab');
    } else {
      console.log('❌ SYSTEM NOT READY\n');
      console.log('Run these commands to fix:\n');
      if (!modelExists) console.log('  python backend\\ml\\train_model.py');
      if (!owner) console.log('  - Create owner user (register at http://localhost:3000)');
      if (owner && (await Vessel.countDocuments({ owner: owner._id })) === 0) {
        console.log('  node backend\\fix-owner-vessels.js');
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkSystem();
